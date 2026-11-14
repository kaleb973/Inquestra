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
  | 'trial_sealed';

export interface EventProperties {
  path?: string;
  referrer?: string;
  trialId?: string;
  stepId?: string;
  protocolTitle?: string;
  durationSeconds?: number;
  portType?: 'serial' | 'mock' | 'usb';
  baudRate?: number;
  format?: 'zip' | 'pdf' | 'json';
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

export function isAnalyticsPermitted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      // Default to true until the user explicit declines or configures preferences
      return true;
    }
    const parsed = JSON.parse(raw);
    return parsed?.analytics !== false;
  } catch {
    return true;
  }
}

/**
 * Dispatches a strongly-typed custom event to both PostHog and Google Analytics.
 */
export function trackAnalyticsEvent(
  eventName: InquestraAnalyticsEvent,
  properties?: EventProperties
): void {
  if (typeof window === 'undefined') return;

  if (!isAnalyticsPermitted()) {
    return;
  }

  const payload: EventProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    isAnonymous: properties?.isAnonymous ?? true,
  };

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
