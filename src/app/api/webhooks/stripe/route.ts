// src/app/api/webhooks/stripe/route.ts
// Stripe Webhook Endpoint for Inquestra.
// Hardened with Webhook Signature Verification, Idempotency Deduplication,
// and audit logging to ensure duplicate webhook deliveries are safely ignored.

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-08-26.dahlia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

// In-memory idempotency deduplication cache for event IDs (cleans up after 24h)
const processedEventCache = new Map<string, number>();
const EVENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function isEventAlreadyProcessed(eventId: string): boolean {
  const now = Date.now();
  const processedAt = processedEventCache.get(eventId);
  if (processedAt && now - processedAt < EVENT_CACHE_TTL_MS) {
    return true;
  }
  // Prune expired entries if cache exceeds 1,000 entries
  if (processedEventCache.size > 1000) {
    for (const [id, ts] of processedEventCache.entries()) {
      if (now - ts >= EVENT_CACHE_TTL_MS) {
        processedEventCache.delete(id);
      }
    }
  }
  return false;
}

function markEventProcessed(eventId: string) {
  processedEventCache.set(eventId, Date.now());
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET || endpointSecret;
    if (!process.env.STRIPE_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
      console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET must be configured in production.');
      return NextResponse.json({ error: 'Webhook signing secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid signature';
      console.error(`[stripe-webhook] Signature verification failed: ${message}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 1. Idempotency Check: Don't re-process duplicate webhook deliveries
    if (isEventAlreadyProcessed(event.id)) {
      console.log(`[stripe-webhook] Duplicate event ignored (idempotent): ${event.id}`);
      return NextResponse.json({ received: true, deduplicated: true });
    }

    // 2. Event Dispatch
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[stripe-webhook] Checkout completed for session:', session.id);

        const organizationId = session.metadata?.organizationId;
        const userId = session.metadata?.userId;

        // If metadata contains org and user, log to immutable audit trail
        if (organizationId && userId) {
          try {
            await prisma.auditLog.create({
              data: {
                action: 'STRIPE_CHECKOUT_COMPLETED',
                entityType: 'Subscription',
                entityId: session.id,
                details: {
                  eventId: event.id,
                  customerId: typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null),
                  amountTotal: session.amount_total,
                  currency: session.currency,
                },
                organizationId,
                userId,
              },
            });
          } catch (dbErr) {
            console.error('[stripe-webhook] Failed to write audit log:', dbErr);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[stripe-webhook] Subscription cancelled:', subscription.id);
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    // Mark as processed in idempotency ledger
    markEventProcessed(event.id);

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal webhook error';
    console.error('[stripe-webhook] Webhook handler error:', message);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
