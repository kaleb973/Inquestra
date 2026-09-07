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

  // Protected routes — redirect unauthenticated users to login
  const isProtectedRoute =
    pathname.startsWith('/projects') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/billing');

  // Auth routes — redirect authenticated users away from login/signup
  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/signup');

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    return NextResponse.redirect(homeUrl);
  }

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
