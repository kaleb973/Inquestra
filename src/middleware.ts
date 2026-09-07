// src/middleware.ts
// Next.js Edge Middleware — refreshes Supabase session cookies on every request
// and enforces route protection for authenticated areas.

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl;

  // Subdomain routing for app.inquestra.org or app.localhost
  const hostname = request.headers.get('host') || '';
  if (hostname.startsWith('app.')) {
    // Check auth for protected routes in the app zone
    const isAppProtectedRoute =
      pathname.startsWith('/admin') ||
      pathname.startsWith('/billing') ||
      pathname === '/'; // The workspace root is protected

    const isAppAuthRoute =
      pathname.startsWith('/login') || pathname.startsWith('/signup');

    if (isAppProtectedRoute && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAppAuthRoute && user) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      return NextResponse.redirect(homeUrl);
    }

    // Rewrite to the internal /app folder
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/app${pathname}`;
    const rewriteRes = NextResponse.rewrite(rewriteUrl);
    // Propagate cookies from Supabase to the rewrite response
    // Actually, NextResponse.rewrite does not easily inherit cookies modified by setAll without explicit re-setting,
    // but the Next.js Supabase setup relies on supabaseResponse for outgoing cookies.
    // We can copy headers from supabaseResponse to rewriteRes:
    supabaseResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        rewriteRes.headers.append('set-cookie', value);
      }
    });
    return rewriteRes;
  }

  // Root domain (marketing)
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
