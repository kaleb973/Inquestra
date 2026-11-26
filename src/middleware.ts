// src/middleware.ts
// Next.js Edge Middleware — refreshes Supabase session cookies on every request,
// enforces route protection, rate limits endpoints, and injects enterprise security headers & CORS policy.

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIp, type RateLimitResult } from '@/lib/rateLimit';

const ALLOWED_ORIGINS = new Set([
  'https://inquestra.org',
  'https://www.inquestra.org',
]);

if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.add('http://localhost:3000');
  ALLOWED_ORIGINS.add('http://127.0.0.1:3000');
}

const isDev = process.env.NODE_ENV === 'development';

const CSP_HEADER = [
  "default-src 'self'",
  `script-src 'self' ${isDev ? "'unsafe-eval' " : ''}'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.cloudflarestorage.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com" +
    (isDev ? ' ws://localhost:* http://localhost:*' : ''),
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join('; ');

const PERMISSIONS_POLICY_HEADER =
  'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), serial=(self), display-capture=()';

function applySecurityHeaders(headers: Headers) {
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Permissions-Policy', PERMISSIONS_POLICY_HEADER);
  headers.set('Content-Security-Policy', CSP_HEADER);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request.headers);

  // 0. Fast-path for Health & Liveness probes (bypasses session refresh & rate limits)
  if (pathname === '/api/health') {
    return NextResponse.next();
  }

  // 1. Explicit CORS Preflight Handling for API Routes
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    if (request.method === 'OPTIONS') {
      const preflightHeaders = new Headers();
      if (origin && ALLOWED_ORIGINS.has(origin)) {
        preflightHeaders.set('Access-Control-Allow-Origin', origin);
        preflightHeaders.set('Access-Control-Allow-Credentials', 'true');
      }
      preflightHeaders.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS, PATCH'
      );
      preflightHeaders.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, stripe-signature, X-Requested-With'
      );
      preflightHeaders.set('Access-Control-Max-Age', '86400');
      applySecurityHeaders(preflightHeaders);
      return new NextResponse(null, { status: 204, headers: preflightHeaders });
    }
  }

  // 2. Rate Limiting Protection
  const isAppRoute = pathname === '/app' || pathname.startsWith('/app/');
  const isScanRoute = pathname === '/scan' || pathname.startsWith('/scan/');
  const isApiRoute = pathname.startsWith('/api');
  const isNoIndexRoute = isAppRoute || isScanRoute || isApiRoute;
  let rateLimitResult: RateLimitResult = { success: true, limit: 180, remaining: 180, reset: 0 };

  if (pathname.startsWith('/app/login') || pathname.startsWith('/app/signup')) {
    // High-security window for authentication (brute-force defense): 60 attempts per minute
    rateLimitResult = checkRateLimit(`auth:${clientIp}`, 60, 60_000);
  } else if (pathname.startsWith('/api')) {
    // API endpoints: 120 requests per minute
    rateLimitResult = checkRateLimit(`api:${clientIp}`, 120, 60_000);
  } else if (isAppRoute) {
    // General workspace navigation: 300 requests per minute
    rateLimitResult = checkRateLimit(`app:${clientIp}`, 300, 60_000);
  }

  if (!rateLimitResult.success) {
    const rateLimitHeaders = new Headers({
      'Content-Type': 'application/json',
      'Retry-After': String(rateLimitResult.retryAfterSeconds || 60),
      'X-RateLimit-Limit': String(rateLimitResult.limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(rateLimitResult.reset),
    });
    applySecurityHeaders(rateLimitHeaders);

    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests.',
        message: `Rate limit exceeded. Please wait ${rateLimitResult.retryAfterSeconds} seconds before trying again.`,
      }),
      {
        status: 429,
        headers: rateLimitHeaders,
      }
    );
  }

  let response = NextResponse.next({ request });

  // Only refresh Supabase session cookies on workspace, auth, and barcode scan routes
  // so public marketing pages avoid unnecessary auth lookups.
  if (isAppRoute || isScanRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session — required for Server Components to read auth state
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Subpath routing (everything under /app is the workspace)
    // /app operates in Local Notebook mode for unauthenticated researchers.
    // Only administrative and billing management routes require authentication.
    const isAppProtectedRoute =
      pathname.startsWith('/app/admin') ||
      pathname.startsWith('/app/billing');

    const isAppAuthRoute =
      pathname.startsWith('/app/login') || pathname.startsWith('/app/signup');

    if (isAppProtectedRoute && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/app/login';
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Enforce step-up MFA (AAL2) when the authenticated user has verified TOTP factors enrolled
    let mfaPending = false;
    if (user && (isAppProtectedRoute || isAppAuthRoute)) {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      mfaPending =
        aalData?.nextLevel === 'aal2' && aalData?.currentLevel !== 'aal2';

      if (isAppProtectedRoute && mfaPending) {
        const mfaUrl = request.nextUrl.clone();
        mfaUrl.pathname = '/app/login';
        mfaUrl.searchParams.set('mfa', 'required');
        mfaUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(mfaUrl);
      }
    }

    if (isAppAuthRoute && user && !mfaPending) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/app';
      return NextResponse.redirect(homeUrl);
    }
  }

  // 3. Attach CORS Origin for API requests
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    if (origin && ALLOWED_ORIGINS.has(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, stripe-signature, X-Requested-With'
    );
  }

  // 4. Attach Enterprise Security Headers (Defense in Depth)
  applySecurityHeaders(response.headers);
  if (isNoIndexRoute) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets, _next internals, and static file extensions.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
