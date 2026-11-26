import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const posthogCspSources = posthogHost
  ? (() => {
      const url = new URL(posthogHost);
      const baseDomain = url.hostname.split('.').slice(-2).join('.');

      return {
        apiHost: url.origin,
        scriptHost: `${url.protocol}//*.${baseDomain}`,
      };
    })()
  : null;

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), serial=(self), display-capture=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' ${isDev ? "'unsafe-eval' " : ''}'unsafe-inline' https://js.stripe.com` +
        (posthogCspSources ? ` ${posthogCspSources.scriptHost}` : ''),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' blob: data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.cloudflarestorage.com" +
        (posthogCspSources ? ` ${posthogCspSources.apiHost}` : '') +
        (isDev ? ' ws://localhost:* http://localhost:*' : ''),
      `worker-src 'self'${posthogCspSources ? ' blob:' : ''}`,
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
