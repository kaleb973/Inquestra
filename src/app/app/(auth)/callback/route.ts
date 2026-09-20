import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';

  // Determine a safe origin: prefer NEXT_PUBLIC_APP_URL, and never use 0.0.0.0 which browsers reject
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  const baseUrl = appUrl && !appUrl.includes('0.0.0.0')
    ? appUrl
    : origin.includes('0.0.0.0')
      ? 'http://localhost:3000'
      : origin;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${baseUrl}/app/login?error=Invalid+confirmation+link`);
}
