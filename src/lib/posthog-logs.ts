import 'server-only';

import { SeverityNumber } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const missingVariable = !projectToken
  ? 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN'
  : !host
    ? 'NEXT_PUBLIC_POSTHOG_HOST'
    : null;

let posthogLoggerProvider: LoggerProvider | undefined;

if (missingVariable) {
  if (process.env.NODE_ENV === 'development') {
    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    );
  }
} else if (projectToken && host) {
  posthogLoggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({ 'service.name': 'inquestra' }),
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: new URL('i/v1/logs', `${host}/`).toString(),
          headers: {
            Authorization: `Bearer ${projectToken}`,
            'Content-Type': 'application/json',
          },
        }),
      }),
    ],
  });
}

const posthogLogger = posthogLoggerProvider?.getLogger('inquestra.posthog-exporter');

export function logTrialSealed(): void {
  posthogLogger?.emit({
    body: 'Trial sealed successfully',
    severityNumber: SeverityNumber.INFO,
    attributes: { operation: 'trial_sealed' },
  });
}

export function logTrialStatusChanged(status: string): void {
  posthogLogger?.emit({
    body: 'Trial status changed successfully',
    severityNumber: SeverityNumber.INFO,
    attributes: { operation: 'trial_status_changed', status },
  });
}

export async function flushPostHogLogs(): Promise<void> {
  try {
    await posthogLoggerProvider?.forceFlush();
  } catch {
    // Log delivery must not change the outcome of a completed server action.
  }
}
