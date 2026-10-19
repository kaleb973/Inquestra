// src/app/api/pilot-interest/route.ts
// Pilot Lab Interest capture — stores interest in DB AuditLog or sends email via Resend.
// No authentication required (public endpoint). Rate-limited to 5 submissions per IP/hour.
// Hardened with centralized rate-limiting, standardized headers, and outbound fetch timeouts.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { fetchWithTimeout } from '@/lib/resilience';

const PilotInterestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(255),
  institution: z.string().min(1).max(300),
  role: z.string().max(100).optional(),
  useCase: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  // 1. Centralized Rate Limiting (5 requests per 60 minutes per IP)
  const clientIp = getClientIp(req.headers);
  const rateLimitResult = checkRateLimit(`pilot-interest:${clientIp}`, 5, 60 * 60 * 1000);

  const rateLimitHeaders = {
    'X-RateLimit-Limit': String(rateLimitResult.limit),
    'X-RateLimit-Remaining': String(rateLimitResult.remaining),
    'X-RateLimit-Reset': String(rateLimitResult.reset),
  };

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many submissions.',
        message: `Rate limit exceeded. Please wait ${rateLimitResult.retryAfterSeconds} seconds before trying again.`,
      },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders,
          'Retry-After': String(rateLimitResult.retryAfterSeconds || 3600),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400, headers: rateLimitHeaders }
    );
  }

  const parsed = PilotInterestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
      { status: 422, headers: rateLimitHeaders }
    );
  }

  const data = parsed.data;

  // Sanitize string fields against XSS and template injection
  const sanitized = {
    name: DOMPurify.sanitize(data.name),
    email: data.email.toLowerCase().trim(),
    institution: DOMPurify.sanitize(data.institution),
    role: data.role ? DOMPurify.sanitize(data.role) : null,
    useCase: data.useCase ? DOMPurify.sanitize(data.useCase) : null,
  };

  // Send via Resend if configured, with strict 5-second timeout deadline
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && !resendApiKey.startsWith('placeholder')) {
    try {
      const res = await fetchWithTimeout('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Inquestra Pilot <support@inquestra.org>',
          to: [process.env.PILOT_NOTIFY_EMAIL ?? 'inquestrasupport@gmail.com'],
          subject: `New Pilot Interest: ${sanitized.institution} — ${sanitized.name}`,
          html: `
            <h2>New Pilot Lab Interest</h2>
            <table style="border-collapse:collapse;font-family:monospace">
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Name</td><td><strong>${sanitized.name}</strong></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Email</td><td><a href="mailto:${sanitized.email}">${sanitized.email}</a></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Institution</td><td>${sanitized.institution}</td></tr>
              ${sanitized.role ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Role</td><td>${sanitized.role}</td></tr>` : ''}
              ${sanitized.useCase ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Use Case</td><td>${sanitized.useCase}</td></tr>` : ''}
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">IP</td><td>${clientIp}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Time</td><td>${new Date().toISOString()}</td></tr>
            </table>
          `,
        }),
        timeoutMs: 5000,
      });

      if (!res.ok) {
        console.error('[pilot-interest] Resend error:', await res.text());
      }
    } catch (err) {
      console.error('[pilot-interest] Email dispatch failed or timed out:', err);
    }
  } else {
    // Fallback: log to console (useful for local dev / staging w/o Resend yet)
    console.log('[pilot-interest] New submission:', sanitized);
  }

  return NextResponse.json({ success: true }, { headers: rateLimitHeaders });
}
