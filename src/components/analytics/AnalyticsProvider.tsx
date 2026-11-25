'use client';
// src/components/analytics/AnalyticsProvider.tsx
// Unified Client Analytics Provider: Google Analytics 4 (GA4) + PostHog
// Compliant with Next.js App Router (Suspense-wrapped route listener) and GDPR Cookie Consent.

import { useEffect, Suspense, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import posthog from 'posthog-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { isAnalyticsPermitted } from '@/lib/analytics/events';
import { isDeploymentSkewError } from '@/lib/deploymentSkew';
import type { User } from '@supabase/supabase-js';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const POSTHOG_PROJECT_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const POSTHOG_CONFIGURED = Boolean(POSTHOG_PROJECT_TOKEN && POSTHOG_HOST);

function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const searchString = searchParams?.toString();
    const currentUrl = searchString ? `${pathname}?${searchString}` : pathname;

    // Avoid duplicate pageviews for identical URLs
    if (previousUrlRef.current === currentUrl) return;
    previousUrlRef.current = currentUrl;

    if (!isAnalyticsPermitted()) return;

    // 1. PostHog Pageview
    if (POSTHOG_CONFIGURED && typeof posthog.capture === 'function') {
      try {
        posthog.capture('$pageview', {
          $current_url: window.location.href,
          path: pathname,
        });
      } catch {
        // Silently ignore if blocked
      }
    }

    // 2. Google Analytics 4 Pageview
    if (GA_ID && typeof window.gtag === 'function') {
      try {
        window.gtag('event', 'page_view', {
          page_path: currentUrl,
          page_title: document.title,
        });
      } catch {
        // Silently ignore if blocked
      }
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider() {
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!POSTHOG_PROJECT_TOKEN || !POSTHOG_HOST || posthog.__loaded) return;

    posthog.init(POSTHOG_PROJECT_TOKEN, {
      api_host: POSTHOG_HOST,
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
            return null;
          }
        }
        return event;
      },
    });
  }, []);

  useEffect(() => {
    if (!POSTHOG_CONFIGURED) return;

    const identifyUser = (user: User) => {
      if (identifiedUserId.current === user.id) return;

      if (identifiedUserId.current) {
        posthog.reset();
      }

      const fullName = user.user_metadata.full_name;
      const labType = user.user_metadata.lab_type;
      posthog.identify(user.id, {
        ...(user.email ? { email: user.email } : {}),
        ...(typeof fullName === 'string' && fullName ? { name: fullName } : {}),
        ...(typeof labType === 'string' && labType ? { lab_type: labType } : {}),
      });
      identifiedUserId.current = user.id;
    };

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) identifyUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        identifyUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        if (
          identifiedUserId.current &&
          posthog.get_distinct_id() === identifiedUserId.current
        ) {
          posthog.reset();
        }
        identifiedUserId.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Synchronize cookie consent controls with the PostHog and GA4 singletons.
    const handleConsentChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ analytics: boolean }>;
      const analyticsAllowed = customEvent.detail?.analytics;

      if (analyticsAllowed) {
        try {
          if (POSTHOG_CONFIGURED) posthog.opt_in_capturing();
          window.gtag?.('consent', 'update', {
            analytics_storage: 'granted',
          });
        } catch {}
      } else {
        try {
          if (POSTHOG_CONFIGURED) posthog.opt_out_capturing();
          window.gtag?.('consent', 'update', {
            analytics_storage: 'denied',
          });
        } catch {}
      }
    };

    window.addEventListener('inquestra:cookie-consent-updated', handleConsentChange);
    return () => {
      window.removeEventListener('inquestra:cookie-consent-updated', handleConsentChange);
    };
  }, []);

  return (
    <>
      {/* Route-change pageview watcher wrapped in Suspense per Next.js App Router rules */}
      <Suspense fallback={null}>
        <RouteChangeTracker />
      </Suspense>

      {/* Google Analytics 4 Scripts (only rendered if NEXT_PUBLIC_GA_ID is provided) */}
      {GA_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script
            id="google-analytics-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  send_page_view: false
                });
              `,
            }}
          />
        </>
      )}
    </>
  );
}
