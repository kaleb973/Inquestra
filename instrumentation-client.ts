import posthog from 'posthog-js';
import { isDeploymentSkewError } from '@/lib/deploymentSkew';

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const missingVariable = !projectToken
  ? 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN'
  : !host
    ? 'NEXT_PUBLIC_POSTHOG_HOST'
    : null;

if (missingVariable) {
  if (process.env.NODE_ENV === 'development') {
    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    );
  }
} else if (projectToken && host) {
  posthog.init(projectToken, {
    api_host: host,
    defaults: '2025-05-24',
    capture_exceptions: true,
    debug: process.env.NODE_ENV === 'development',
    before_send: (event) => {
      if (event && event.event === '$exception') {
        const props = (event.properties || {}) as Record<string, unknown>;
        const errorText = [
          props.$exception_message,
          props.$exception_type,
          typeof props.$exception_values === 'string'
            ? props.$exception_values
            : JSON.stringify(props.$exception_values || ''),
        ].join(' ');

        if (isDeploymentSkewError(errorText)) {
          // Drop Next.js deployment version skew from PostHog error tracking.
          // These occur normally when Railway rolls out a new build container while active
          // browser sessions reference older Server Action hashes.
          return null;
        }
      }
      return event;
    },
  });
}
