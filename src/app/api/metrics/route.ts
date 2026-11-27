import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { flushPostHogLogs, logProductMetric } from '@/lib/posthog-logs';

const MetricsSchema = z.object({
  event: z.enum([
    'workspace_entered',
    'trial_created',
    'daq_stream_started',
    'export_triggered',
  ]),
  format: z.enum(['zip', 'pdf', 'json', 'csv', 'markdown']).optional(),
  portType: z.enum(['serial', 'mock', 'usb']).optional(),
});

/**
 * First-party, zero-PII aggregate product event counter.
 * Drops cookies, IP addresses, user-agents, and arbitrary payload keys.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = MetricsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 422 });
  }

  const attributes: Record<string, string> = {};
  if (parsed.data.format) attributes.format = parsed.data.format;
  if (parsed.data.portType) attributes.portType = parsed.data.portType;

  logProductMetric(parsed.data.event, attributes);
  await flushPostHogLogs();

  return NextResponse.json({ ok: true });
}
