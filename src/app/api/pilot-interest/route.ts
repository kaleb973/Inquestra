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
  institution: z.string().max(300).optional().default(''),
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

function stripControlChars(str: string): string {
  return str.replace(/[\r\n\t\u0000-\u001F\u007F]/g, ' ').trim();
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

  // Sanitize string fields against XSS, template injection, and SMTP header injection
  const cleanName = stripControlChars(DOMPurify.sanitize(data.name, { ALLOWED_TAGS: [] }));
  const cleanInstitution = stripControlChars(
    DOMPurify.sanitize(data.institution || '', { ALLOWED_TAGS: [] })
  );
  const sanitized = {
    name: cleanName || 'Researcher',
    email: stripControlChars(data.email).toLowerCase(),
    institution: cleanInstitution || 'Independent / Bench Lab',
    role: data.role ? stripControlChars(DOMPurify.sanitize(data.role, { ALLOWED_TAGS: [] })) : null,
    useCase: data.useCase ? DOMPurify.sanitize(data.useCase, { ALLOWED_TAGS: [] }).trim() : null,
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

  if (resendApiKey && !resendApiKey.startsWith('placeholder')) {
    const escName = escapeHtml(sanitized.name);
    const escEmail = escapeHtml(sanitized.email);
    const escInst = escapeHtml(sanitized.institution);
    const escRole = sanitized.role ? escapeHtml(sanitized.role) : null;
    const escUseCase = sanitized.useCase ? escapeHtml(sanitized.useCase) : null;
    const safeSubjectInst = sanitized.institution.slice(0, 80);
    const safeSubjectName = sanitized.name.slice(0, 60);

    // 1. Internal notification to Inquestra team
    const adminNotificationPayload = {
      from: 'Inquestra Support <support@inquestra.org>',
      to: [notifyEmail],
      reply_to: sanitized.email,
      subject: `New Workspace / Hardware Inquiry: ${safeSubjectInst} / ${safeSubjectName}`,
      html: `
        <h2>New Workspace &amp; Hardware Inquiry</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;line-height:1.6">
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Name</td><td><strong>${escName}</strong></td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Email</td><td><a href="mailto:${escEmail}">${escEmail}</a></td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Affiliation / Bench</td><td>${escInst}</td></tr>
          ${escRole ? `<tr><td style="padding:6px 12px 6px 0;color:#6b7280">Role</td><td>${escRole}</td></tr>` : ''}
          ${escUseCase ? `<tr><td style="padding:6px 12px 6px 0;color:#6b7280">Use Case / Targets</td><td>${escUseCase}</td></tr>` : ''}
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280">IP</td><td>${escapeHtml(clientIp)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Submitted At</td><td>${new Date().toISOString()}</td></tr>
        </table>
      `,
    };

    // 2. Direct confirmation to the applicant
    const applicantConfirmationPayload = {
      from: 'Inquestra Maintainer <support@inquestra.org>',
      to: [sanitized.email],
      reply_to: 'support@inquestra.org',
      subject: `Inquestra Inquiry Received (${safeSubjectInst})`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#18181b;line-height:1.6">
          <div style="border-bottom:1px solid #e4e4e7;padding-bottom:16px;margin-bottom:20px">
            <h1 style="font-size:18px;margin:0;font-weight:700;letter-spacing:-0.02em;color:#09090b">INQUESTRA</h1>
            <p style="font-size:12px;color:#71717a;margin:4px 0 0">Open-Source Electronic Lab Notebook &amp; Web Serial Workspace</p>
          </div>

          <p style="font-size:15px;margin-bottom:16px">Hello ${escName},</p>

          <p style="font-size:14px;color:#27272a;margin-bottom:16px">
            Thank you for sending an inquiry regarding Inquestra (${escInst}). Your message has been delivered to the project maintainer.
          </p>

          <div style="background-color:#f4f4f5;border-radius:6px;padding:16px;margin-bottom:20px;font-size:13px">
            <p style="font-weight:600;margin:0 0 8px;color:#09090b">Submission Summary:</p>
            <ul style="margin:0;padding-left:18px;color:#3f3f46">
              <li><strong>Affiliation / Bench:</strong> ${escInst}</li>
              ${escRole ? `<li><strong>Role:</strong> ${escRole}</li>` : ''}
              ${escUseCase ? `<li><strong>Notes / Hardware Scope:</strong> ${escUseCase}</li>` : ''}
            </ul>
          </div>

          <p style="font-size:14px;color:#27272a;margin-bottom:16px">
            <strong>What happens next?</strong><br/>
            The Local Notebook is open immediately at <a href="https://inquestra.org/app" style="color:#2563eb">inquestra.org/app</a> with no account required. Inquiries are reviewed asynchronously by the project maintainer as time permits (with no guaranteed response SLA).
          </p>

          <p style="font-size:14px;color:#27272a;margin-bottom:24px">
            For public bug reports or feature requests, you can also open an issue on <a href="https://github.com/kaleb973/Inquestra/issues" style="color:#2563eb">GitHub</a> or email <a href="mailto:support@inquestra.org" style="color:#2563eb">support@inquestra.org</a>.
          </p>

          <div style="border-top:1px solid #e4e4e7;padding-top:16px;font-size:12px;color:#71717a">
            <p style="margin:0"><strong>Inquestra Project Maintainer</strong></p>
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
        console.error('[pilot-interest] Dispatch errors:', errors.join(' | '));
      }
    } catch (err) {
      console.error('[pilot-interest] Unexpected dispatch error:', err);
    }
  } else {
    console.error('[pilot-interest] Email service is not configured.');
  }

  // Never leak provider errors or env configuration status to unauthenticated clients
  return NextResponse.json(
    {
      success: true,
    },
    { headers: rateLimitHeaders }
  );
}
