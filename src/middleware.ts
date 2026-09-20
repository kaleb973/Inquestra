// src/middleware.ts
// Next.js Edge Middleware — refreshes Supabase session cookies on every request
// and enforces route protection for authenticated areas.

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIp, type RateLimitResult } from '@/lib/rateLimit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request.headers);

  // 1. Rate Limiting Protection
  let rateLimitResult: RateLimitResult = { success: true, limit: 180, remaining: 180, reset: 0 };

  if (pathname.startsWith('/app/login') || pathname.startsWith('/app/signup')) {
    // High-security window for authentication (brute-force defense): 12 attempts per minute
    rateLimitResult = checkRateLimit(`auth:${clientIp}`, 12, 60_000);
  } else if (pathname.startsWith('/api')) {
    // API endpoints: 60 requests per minute
    rateLimitResult = checkRateLimit(`api:${clientIp}`, 60, 60_000);
  } else if (pathname.startsWith('/app')) {
    // General workspace navigation: 180 requests per minute
    rateLimitResult = checkRateLimit(`app:${clientIp}`, 180, 60_000);
  }

  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests.',
        message: `Rate limit exceeded. Please wait ${rateLimitResult.retryAfterSeconds} seconds before trying again.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.retryAfterSeconds || 60),
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        },
      }
    );
  }

  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
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
  const isAppProtectedRoute =
    pathname.startsWith('/app/admin') ||
    pathname.startsWith('/app/billing') ||
    pathname === '/app'; // The workspace root is protected

  const isAppAuthRoute =
    pathname.startsWith('/app/login') || pathname.startsWith('/app/signup');

  if (isAppProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/app/login';
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAppAuthRoute && user) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/app';
    return NextResponse.redirect(homeUrl);
  }

  // 2. Attach Enterprise Security Headers (Defense in Depth)
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets, _next internals, and API routes
     * that don't need session refresh.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
