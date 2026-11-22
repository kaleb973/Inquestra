// src/app/api/pilot-interest/route.ts
// Pilot Lab Interest capture — sends notification to team and confirmation to applicant via Resend.
// No authentication required (public endpoint). Rate-limited to 5 submissions per IP/hour (relaxed in dev).
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: NextRequest) {
  // 1. Centralized Rate Limiting (5 requests per 60 minutes per IP in prod, 100 in dev)
  const isDev = process.env.NODE_ENV === 'development';
  const maxRequests = isDev ? 100 : 5;
  const clientIp = getClientIp(req.headers);
  const rateLimitResult = checkRateLimit(`pilot-interest:${clientIp}`, maxRequests, 60 * 60 * 1000);

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
  const rawKey =
    process.env.RESEND_API_KEY ??
    process.env.Resend_API ??
    process.env.RESEND_API ??
    process.env.RESEND_KEY;
  const resendApiKey = rawKey?.trim().replace(/^["']|["']$/g, '');
  const rawNotify =
    process.env.PILOT_NOTIFY_EMAIL ??
    process.env.Pilot_notify_email ??
    process.env.PILOT_EMAIL ??
    'inquestrasupport@gmail.com';
  const notifyEmail = rawNotify.trim().replace(/^["']|["']$/g, '');

  let emailDispatchStatus = 'unconfigured';
  let emailDispatchError: string | null = null;

  if (resendApiKey && !resendApiKey.startsWith('placeholder')) {
    const escName = escapeHtml(sanitized.name);
    const escEmail = escapeHtml(sanitized.email);
    const escInst = escapeHtml(sanitized.institution);
    const escRole = sanitized.role ? escapeHtml(sanitized.role) : null;
    const escUseCase = sanitized.useCase ? escapeHtml(sanitized.useCase) : null;

    // 1. Internal notification to Inquestra team
    const adminNotificationPayload = {
      from: 'Inquestra Pilot <support@inquestra.org>',
      to: [notifyEmail],
      reply_to: sanitized.email,
      subject: `New Pilot Interest: ${escInst} / ${escName}`,
      html: `
        <h2>New Pilot Lab Interest</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;line-height:1.6">
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Name</td><td><strong>${escName}</strong></td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Email</td><td><a href="mailto:${escEmail}">${escEmail}</a></td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Institution</td><td>${escInst}</td></tr>
          ${escRole ? `<tr><td style="padding:6px 12px 6px 0;color:#6b7280">Role</td><td>${escRole}</td></tr>` : ''}
          ${escUseCase ? `<tr><td style="padding:6px 12px 6px 0;color:#6b7280">Use Case / Targets</td><td>${escUseCase}</td></tr>` : ''}
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280">IP</td><td>${escapeHtml(clientIp)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Submitted At</td><td>${new Date().toISOString()}</td></tr>
        </table>
      `,
    };

    // 2. Direct confirmation to the applicant
    const applicantConfirmationPayload = {
      from: 'Inquestra Pilot Program <support@inquestra.org>',
      to: [sanitized.email],
      reply_to: 'support@inquestra.org',
      subject: `Inquestra Pilot Lab Access: Application Received (${escInst})`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#18181b;line-height:1.6">
          <div style="border-bottom:1px solid #e4e4e7;padding-bottom:16px;margin-bottom:20px">
            <h1 style="font-size:18px;margin:0;font-weight:700;letter-spacing:-0.02em;color:#09090b">INQUESTRA</h1>
            <p style="font-size:12px;color:#71717a;margin:4px 0 0">Electronic Lab Notebook for Life Sciences, Chemistry & Engineering</p>
          </div>

          <p style="font-size:15px;margin-bottom:16px">Dear ${escName},</p>

          <p style="font-size:14px;color:#27272a;margin-bottom:16px">
            Thank you for requesting access to the Inquestra Pilot Lab program for <strong>${escInst}</strong>. Your lab specifications and onboarding request have been received.
          </p>

          <div style="background-color:#f4f4f5;border-radius:6px;padding:16px;margin-bottom:20px;font-size:13px">
            <p style="font-weight:600;margin:0 0 8px;color:#09090b">Submission Summary:</p>
            <ul style="margin:0;padding-left:18px;color:#3f3f46">
              <li><strong>Institution / Lab:</strong> ${escInst}</li>
              ${escRole ? `<li><strong>Role:</strong> ${escRole}</li>` : ''}
              ${escUseCase ? `<li><strong>Research & Protocol Scope:</strong> ${escUseCase}</li>` : ''}
            </ul>
          </div>

          <p style="font-size:14px;color:#27272a;margin-bottom:16px">
            <strong>What happens next?</strong><br/>
            Your research focus and protocol requirements are under review. A follow-up with access instructions and workspace configuration guidance will be sent within 48 hours.
          </p>

          <p style="font-size:14px;color:#27272a;margin-bottom:24px">
            If you have questions or specific protocol notes to share in advance, you can reply directly to this email or contact <a href="mailto:support@inquestra.org" style="color:#2563eb">support@inquestra.org</a>.
          </p>

          <div style="border-top:1px solid #e4e4e7;padding-top:16px;font-size:12px;color:#71717a">
            <p style="margin:0"><strong>Inquestra Onboarding</strong></p>
            <p style="margin:2px 0 0"><a href="https://inquestra.org" style="color:#71717a;text-decoration:none">inquestra.org</a> &bull; <a href="mailto:support@inquestra.org" style="color:#71717a;text-decoration:none">support@inquestra.org</a></p>
          </div>
        </div>
      `,
    };

    try {
      const sendEmail = (payload: object) =>
        fetchWithTimeout('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          timeoutMs: 5000,
        });

      const [adminRes, applicantRes] = await Promise.allSettled([
        sendEmail(adminNotificationPayload),
        sendEmail(applicantConfirmationPayload),
      ]);

      const errors: string[] = [];
      if (adminRes.status === 'fulfilled' && !adminRes.value.ok) {
        const text = await adminRes.value.text();
        errors.push(`Admin (${adminRes.value.status}): ${text}`);
      } else if (adminRes.status === 'rejected') {
        errors.push(`Admin dispatch error: ${String(adminRes.reason)}`);
      }

      if (applicantRes.status === 'fulfilled' && !applicantRes.value.ok) {
        const text = await applicantRes.value.text();
        errors.push(`Applicant (${applicantRes.value.status}): ${text}`);
      } else if (applicantRes.status === 'rejected') {
        errors.push(`Applicant dispatch error: ${String(applicantRes.reason)}`);
      }

      if (errors.length > 0) {
        emailDispatchStatus = 'partial_or_failed';
        emailDispatchError = errors.join(' | ');
        console.error('[pilot-interest] Dispatch errors:', emailDispatchError);
      } else {
        emailDispatchStatus = 'sent';
      }
    } catch (err) {
      emailDispatchStatus = 'exception';
      emailDispatchError = String(err);
      console.error('[pilot-interest] Unexpected dispatch error:', err);
    }
  } else {
    emailDispatchStatus = 'missing_resend_api_key';
    console.log('[pilot-interest] RESEND_API_KEY missing or placeholder');
  }

  return NextResponse.json(
    {
      success: true,
      dispatchStatus: emailDispatchStatus,
      dispatchError: emailDispatchError,
    },
    { headers: rateLimitHeaders }
  );
}
