'use client';
// src/app/app/(auth)/login/page.tsx
// Enterprise login form — password step, then optional 6-digit TOTP challenge for MFA users.

import { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { signIn, verifyMfaLogin } from '@/actions/authActions';
import type { SignInResult } from '@/actions/authActions';
import { ShieldCheck, Smartphone, Fingerprint, Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type LoginStep = 'password' | 'mfa' | 'redirecting';

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('password');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPasskeyPending, setIsPasskeyPending] = useState(false);
  const supabase = createSupabaseBrowserClient();

  // MFA step state
  const [factorId, setFactorId] = useState('');
  const [otp, setOtp] = useState('');
  const otpRef = useRef<HTMLInputElement>(null);

  // Focus OTP input when entering MFA step
  useEffect(() => {
    if (step === 'mfa') {
      setTimeout(() => otpRef.current?.focus(), 50);
    }
  }, [step]);

  // ── Step 1: Password ──────────────────────────────────────────────
  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result: SignInResult = await signIn(formData);
        if ('error' in result) {
          setError(result.error);
        } else if ('mfaRequired' in result && result.mfaRequired) {
          setFactorId(result.factorId);
          setStep('mfa');
        } else if ('success' in result && result.success) {
          setStep('redirecting');
          window.location.href = '/app';
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      }
    });
  };

  // ── Passkey Sign In ───────────────────────────────────────────────
  const handlePasskeySignIn = async () => {
    setError(null);
    setIsPasskeyPending(true);
    try {
      const { error } = await supabase.auth.signInWithPasskey();
      if (error) {
        setError(error.message);
        setIsPasskeyPending(false);
        return;
      }
      setStep('redirecting');
      window.location.href = '/app';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Passkey login failed.');
      setIsPasskeyPending(false);
    }
  };

  // ── Step 2: TOTP Challenge ────────────────────────────────────────
  const handleMfaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const result = await verifyMfaLogin(factorId, otp);
        if ('error' in result) {
          setError(result.error);
          setOtp('');
          otpRef.current?.focus();
        } else if (result.success) {
          setStep('redirecting');
          window.location.href = '/app';
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Logo className="text-indigo-400 w-6 h-6" />
          <span className="text-white font-bold text-lg tracking-widest uppercase">Inquestra</span>
        </div>

        <div className="bg-muted border border-border rounded-xl p-8">
          {/* ── Redirecting ── */}
          {step === 'redirecting' && (
            <div className="text-center py-4 space-y-2">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-indigo-400 text-sm font-medium">Redirecting to your workspace…</p>
            </div>
          )}

          {/* ── Password Step ── */}
          {step === 'password' && (
            <>
              <h1 className="text-white text-xl font-semibold mb-1">Sign in</h1>
              <p className="text-muted-foreground text-sm mb-6">Access your research workspace.</p>

              <div className="space-y-4 mb-6">
                <button
                  type="button"
                  onClick={handlePasskeySignIn}
                  disabled={isPending || isPasskeyPending}
                  className="w-full flex items-center justify-center gap-2 bg-background border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-foreground text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {isPasskeyPending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Fingerprint className="w-4 h-4 text-indigo-400" />
                  )}
                  {isPasskeyPending ? 'Awaiting passkey…' : 'Sign in with Passkey'}
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Or</span>
                  <div className="h-px bg-border flex-1" />
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    disabled={isPending || isPasskeyPending}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="researcher@university.edu"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    disabled={isPending || isPasskeyPending}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs bg-red-950/40 border border-red-900 rounded px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPending || isPasskeyPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {isPending ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <div className="mt-6 space-y-2 text-center">
                <p className="text-xs text-neutral-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/app/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                    Create one
                  </Link>
                </p>
                <p className="text-xs text-neutral-700">
                  Have an invite link?{' '}
                  <Link href="/app/join" className="text-indigo-500 hover:text-indigo-400 transition-colors">
                    Join your lab →
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* ── MFA Challenge Step ── */}
          {step === 'mfa' && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-white text-base font-semibold">Two-factor authentication</h1>
                  <p className="text-muted-foreground text-xs mt-0.5">Enter the code from your authenticator app.</p>
                </div>
              </div>

              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    6-digit authenticator code
                  </label>
                  <input
                    id="otp"
                    ref={otpRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={otp}
                    disabled={isPending}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError(null);
                    }}
                    placeholder="000000"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-2xl font-mono text-center text-white tracking-[0.4em] placeholder:text-neutral-700 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs bg-red-950/40 border border-red-900 rounded px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPending || otp.length !== 6}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {isPending ? 'Verifying…' : 'Verify & Sign in'}
                </button>
              </form>

              <button
                onClick={() => { setStep('password'); setError(null); setOtp(''); }}
                className="mt-4 w-full text-xs text-neutral-600 hover:text-neutral-400 transition-colors text-center"
              >
                ← Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
