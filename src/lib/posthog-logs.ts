// Server-side PostHog telemetry and OpenTelemetry logging provider
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
    console.warn(
      `[PostHog] ${missingVariable} variable required by PostHog is missing or un-configured.`
    );
  }
} else if (projectToken && host) {
  try {
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
  } catch (err) {
    console.warn('[PostHog] Failed to initialize LoggerProvider:', err);
  }
}

const posthogLogger = posthogLoggerProvider?.getLogger('inquestra.posthog-exporter');

export function logTrialSealed(): void {
  try {
    posthogLogger?.emit({
      body: 'Trial sealed successfully',
      severityNumber: SeverityNumber.INFO,
      attributes: { operation: 'trial_sealed' },
    });
  } catch (err) {
    console.warn('[PostHog] logTrialSealed error (non-fatal):', err);
  }
}

export function logTrialStatusChanged(status: string): void {
  try {
    posthogLogger?.emit({
      body: 'Trial status changed successfully',
      severityNumber: SeverityNumber.INFO,
      attributes: { operation: 'trial_status_changed', status },
    });
  } catch (err) {
    console.warn('[PostHog] logTrialStatusChanged error (non-fatal):', err);
  }
}

export function logProductMetric(
  event: string,
  attributes?: Record<string, string>
): void {
  try {
    posthogLogger?.emit({
      body: `Product event: ${event}`,
      severityNumber: SeverityNumber.INFO,
      attributes: {
        operation: event,
        ...(attributes ?? {}),
      },
    });
  } catch (err) {
    console.warn('[PostHog] logProductMetric error (non-fatal):', err);
  }
}

export async function flushPostHogLogs(): Promise<void> {
  try {
    await posthogLoggerProvider?.forceFlush();
  } catch {
    // Log delivery must not change the outcome of a completed server action.
  }
}
