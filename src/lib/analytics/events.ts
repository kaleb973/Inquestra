// src/lib/analytics/events.ts
// Unified telemetry & product analytics dispatcher for Inquestra.
// Dispatches events to PostHog and Google Analytics 4 while respecting GDPR cookie consent.

import posthog from 'posthog-js';

export type InquestraAnalyticsEvent =
  | 'page_view'
  | 'workspace_entered'
  | 'trial_created'
  | 'protocol_step_completed'
  | 'timer_started'
  | 'daq_stream_started'
  | 'export_triggered'
  | 'cloud_backup_intent'
  | 'sign_in_intent'
  | 'pilot_interest_submitted'
  | 'trial_status_changed'
  | 'trial_sealed'
  | 'github_click';

export interface EventProperties {
  path?: string;
  referrer?: string;
  trialId?: string;
  stepId?: string;
  protocolTitle?: string;
  durationSeconds?: number;
  portType?: 'serial' | 'mock' | 'usb';
  baudRate?: number;
  format?: 'zip' | 'pdf' | 'json' | 'csv' | 'markdown';
  triggerSource?: string;
  isAnonymous?: boolean;
  [key: string]: unknown;
}

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set' | 'consent',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

const CONSENT_STORAGE_KEY = 'inquestra_cookie_consent';
const POSTHOG_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST
);
const AGGREGATE_METRIC_EVENTS = new Set<InquestraAnalyticsEvent>([
  'workspace_entered',
  'trial_created',
  'daq_stream_started',
  'export_triggered',
]);

export function isAnalyticsPermitted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      // Strict GDPR opt-in: third-party analytics remain disabled until explicitly granted
      return false;
    }
    const parsed = JSON.parse(raw) as { analytics?: unknown } | null;
    return parsed?.analytics === true;
  } catch {
    return false;
  }
}

function dispatchZeroPiiMetric(
  eventName: InquestraAnalyticsEvent,
  properties?: EventProperties
): void {
  if (!AGGREGATE_METRIC_EVENTS.has(eventName)) return;

  const metricPayload: Record<string, string> = { event: eventName };
  if (properties?.format) metricPayload.format = properties.format;
  if (properties?.portType) metricPayload.portType = properties.portType;

  const serialized = JSON.stringify(metricPayload);
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const sent = navigator.sendBeacon(
        '/api/metrics',
        new Blob([serialized], { type: 'application/json' })
      );
      if (sent) return;
    }
    void fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serialized,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Aggregate counter failures must never disrupt interactive workspace workflows
  }
}

/**
 * Dispatches zero-PII aggregate product counters and (when opted in) PostHog/GA4 events.
 */
export function trackAnalyticsEvent(
  eventName: InquestraAnalyticsEvent,
  properties?: EventProperties
): void {
  if (typeof window === 'undefined') return;

  dispatchZeroPiiMetric(eventName, properties);

  const permitted = isAnalyticsPermitted();
  const payload: EventProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    isAnonymous: properties?.isAnonymous ?? true,
  };

  if (permitted) {
    // 1. PostHog Event Capture
    try {
      if (POSTHOG_CONFIGURED && typeof posthog.capture === 'function') {
        posthog.capture(eventName, payload);
      }
    } catch {
      // PostHog capture silently ignored if blocked or not yet initialized
    }

    // 2. Google Analytics 4 Event Capture
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, payload);
      }
    } catch {
      // Google Analytics capture silently ignored if blocked
    }
  }

  // 3. Local Inquestra Event Bus (allows local UI or test listeners to tap in)
  try {
    window.dispatchEvent(
      new CustomEvent('inquestra:analytics-event', {
        detail: { eventName, properties: payload },
      })
    );
  } catch {
    // Window dispatch silently ignored
  }
}
