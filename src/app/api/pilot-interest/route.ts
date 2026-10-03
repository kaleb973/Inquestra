// src/app/api/pilot-interest/route.ts
// Pilot Lab Interest capture — stores interest in DB AuditLog or sends email via Resend.
// No authentication required (public endpoint). Rate-limited to 5 submissions per IP/hour.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const PilotInterestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(255),
  institution: z.string().min(1).max(300),
  role: z.string().max(100).optional(),
  useCase: z.string().max(1000).optional(),
});

// Simple in-process rate limit map (resets on server restart, sufficient for low-traffic MVP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = PilotInterestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Sanitize string fields
  const sanitized = {
    name: DOMPurify.sanitize(data.name),
    email: data.email.toLowerCase().trim(),
    institution: DOMPurify.sanitize(data.institution),
    role: data.role ? DOMPurify.sanitize(data.role) : null,
    useCase: data.useCase ? DOMPurify.sanitize(data.useCase) : null,
  };

  // Send via Resend if configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && !resendApiKey.startsWith('placeholder')) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Inquestra Pilot <noreply@inquestra.app>',
          to: [process.env.PILOT_NOTIFY_EMAIL ?? sanitized.email],
          subject: `🧪 New Pilot Interest: ${sanitized.institution} — ${sanitized.name}`,
          html: `
            <h2>New Pilot Lab Interest</h2>
            <table style="border-collapse:collapse;font-family:monospace">
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Name</td><td><strong>${sanitized.name}</strong></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Email</td><td><a href="mailto:${sanitized.email}">${sanitized.email}</a></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Institution</td><td>${sanitized.institution}</td></tr>
              ${sanitized.role ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Role</td><td>${sanitized.role}</td></tr>` : ''}
              ${sanitized.useCase ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Use Case</td><td>${sanitized.useCase}</td></tr>` : ''}
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">IP</td><td>${ip}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Time</td><td>${new Date().toISOString()}</td></tr>
            </table>
          `,
        }),
      });
      if (!res.ok) {
        console.error('[pilot-interest] Resend error:', await res.text());
      }
    } catch (err) {
      console.error('[pilot-interest] Email send failed:', err);
    }
  } else {
    // Fallback: log to console (useful for local dev / Railway w/o Resend yet)
    console.log('[pilot-interest] New submission:', sanitized);
  }

  return NextResponse.json({ success: true });
}
