'use client';
// src/app/app/(auth)/login/page.tsx
// Enterprise login form — password step, then optional 6-digit TOTP challenge for MFA users.

import { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { signIn, verifyMfaLogin } from '@/actions/authActions';
import type { SignInResult } from '@/actions/authActions';
import { ShieldCheck, Smartphone, Fingerprint, Loader2, Eye, EyeOff } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type LoginStep = 'email' | 'authenticate' | 'mfa' | 'redirecting';

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isPasskeyPending, setIsPasskeyPending] = useState(false);
  const supabase = createSupabaseBrowserClient();

  // MFA step state
  const [factorId, setFactorId] = useState('');
  const [otp, setOtp] = useState('');
  const otpRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Focus appropriate inputs when step changes
  useEffect(() => {
    if (step === 'authenticate') {
      setTimeout(() => passwordInputRef.current?.focus(), 50);
    } else if (step === 'mfa') {
      setTimeout(() => otpRef.current?.focus(), 50);
    }
  }, [step]);

  // ── Step 1: Email ─────────────────────────────────────────────────
  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setStep('authenticate');
  };

  // ── Step 2: Password ──────────────────────────────────────────────
  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('email', email.trim());

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
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error) {
        const msg = error.message.toLowerCase();
        // If the user cancelled, closed the OS dialog, or timed out, do NOT show an ugly error
        if (
          msg.includes('not allowed') ||
          msg.includes('abort') ||
          msg.includes('cancelled') ||
          msg.includes('canceled') ||
          msg.includes('timed out')
        ) {
          setIsPasskeyPending(false);
          return;
        }

        setError('No passkey found for this device. Please sign in with your password below.');
        setIsPasskeyPending(false);
        return;
      }

      // Security Guard: Prevent account mismatch / spoofing via Windows PIN
      if (data?.user?.email && data.user.email.toLowerCase() !== email.trim().toLowerCase()) {
        await supabase.auth.signOut();
        setError(
          `Security mismatch: The selected passkey belongs to ${data.user.email}, not ${email.trim()}. Please choose the matching account or use your password.`
        );
        setIsPasskeyPending(false);
        return;
      }

      setStep('redirecting');
      window.location.href = '/app';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (
        msg.includes('not allowed') ||
        msg.includes('abort') ||
        msg.includes('cancelled') ||
        msg.includes('canceled') ||
        msg.includes('timed out')
      ) {
        setIsPasskeyPending(false);
        return;
      }
      setError('Unable to authenticate with passkey. Please sign in with your password.');
      setIsPasskeyPending(false);
    }
  };

  // ── Step 3: TOTP Challenge ────────────────────────────────────────
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <Logo className="text-foreground group-hover:text-primary transition-colors w-6 h-6" />
          <span className="text-foreground font-semibold text-base tracking-tight">Inquestra</span>
        </Link>

        <div className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-sm">
          {/* ── Redirecting ── */}
          {step === 'redirecting' && (
            <div className="text-center py-4 space-y-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-primary text-sm font-medium">Redirecting to your workspace…</p>
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <>
              <h1 className="text-foreground text-xl font-semibold mb-1">Sign in</h1>
              <p className="text-muted-foreground text-xs mb-6">Enter your lab email to continue.</p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="username webauthn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="researcher@university.edu"
                  />
                </div>

                {error && (
                  <p className="text-critical text-xs bg-critical/10 border border-critical/20 rounded px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold py-2.5 rounded transition-colors"
                >
                  Continue →
                </button>
              </form>

              <div className="mt-6 space-y-2 text-center">
                <p className="text-xs text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/app/signup" className="text-primary hover:underline transition-colors font-medium">
                    Create one
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  Have an invite link?{' '}
                  <Link href="/app/join" className="text-primary hover:underline transition-colors font-medium">
                    Join your lab →
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* ── Step 2: Authenticate (Passkey or Password) ── */}
          {step === 'authenticate' && (
            <>
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
                <div className="min-w-0 pr-2">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Signing in as</p>
                  <p className="text-sm font-medium text-foreground truncate">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep('email');
                  }}
                  className="text-xs text-primary hover:underline transition-colors shrink-0 font-medium"
                >
                  Change
                </button>
              </div>

              {/* Passkey option */}
              <div className="space-y-4 mb-6">
                <button
                  type="button"
                  onClick={handlePasskeySignIn}
                  disabled={isPending || isPasskeyPending}
                  className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-accent border border-border disabled:opacity-50 disabled:cursor-not-allowed text-foreground text-xs font-semibold py-2.5 rounded transition-colors"
                >
                  {isPasskeyPending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <Fingerprint className="w-4 h-4 text-primary" />
                  )}
                  {isPasskeyPending ? 'Awaiting passkey…' : 'Sign in with Passkey'}
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Or password</span>
                  <div className="h-px bg-border flex-1" />
                </div>
              </div>

              {/* Password form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      ref={passwordInputRef}
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      disabled={isPending || isPasskeyPending}
                      className="w-full bg-background border border-border rounded px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-critical text-xs bg-critical/10 border border-critical/20 rounded px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPending || isPasskeyPending}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold py-2.5 rounded transition-colors"
                >
                  {isPending ? 'Signing in…' : 'Sign in with Password'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep('email');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to email
                </button>
              </div>
            </>
          )}

          {/* ── MFA Challenge Step ── */}
          {step === 'mfa' && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded bg-primary/10 border border-primary/20 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-foreground text-base font-semibold">Two-factor authentication</h1>
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
                    className="w-full bg-background border border-border rounded px-4 py-3 text-2xl font-mono text-center text-foreground tracking-[0.4em] placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {error && (
                  <p className="text-critical text-xs bg-critical/10 border border-critical/20 rounded px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPending || otp.length !== 6}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold py-2.5 rounded transition-colors"
                >
                  {isPending ? 'Verifying…' : 'Verify & Sign in'}
                </button>
              </form>

              <button
                onClick={() => { setStep('authenticate'); setError(null); setOtp(''); }}
                className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                ← Back to sign in
              </button>
            </>
          )}
        </div>

        {/* Legal Footer Links */}
        <div className="mt-8 text-center text-xs text-neutral-600 flex items-center justify-center gap-3">
          <Link href="/terms" className="hover:text-neutral-400 transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-neutral-400 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/" className="hover:text-neutral-400 transition-colors">Home</Link>
        </div>
      </div>
    </div>
  );
}
