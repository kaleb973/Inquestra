'use client';
// src/app/app/(auth)/join/page.tsx
// Invite acceptance page — renders the lab clearance preview and sign-up form.

import { useEffect, useState, useTransition, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { previewInvite, acceptInvite } from '@/actions/inviteActions';
import { Logo } from '@/components/ui/Logo';
import {
  FlaskConical,
  Shield,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import type { Role } from '@prisma/client';

const ROLE_META: Record<Role, { label: string; level: string; color: string; duties: string }> = {
  PI: {
    label: 'Principal Investigator',
    level: 'Level 4 — Lab Director',
    color: 'text-foreground bg-muted border-violet-500/30',
    duties: 'Full lab governance, trial sealing, team management, and regulatory oversight.',
  },
  ADMIN: {
    label: 'Lab Administrator',
    level: 'Level 3 — Lab Manager',
    color: 'text-foreground bg-muted border-border',
    duties: 'Inventory management, equipment calibration, squad assignments, and compliance monitoring.',
  },
  RESEARCHER: {
    label: 'Bench Researcher',
    level: 'Level 2 — Scientist',
    color: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/30',
    duties: 'Create and run trials, link reagents, record telemetry, and sign experiments as author.',
  },
  VIEWER: {
    label: 'Compliance Auditor',
    level: 'Level 1 — Read-Only',
    color: 'text-muted-foreground bg-muted border-border',
    duties: 'View sealed trials, inspect the audit ledger, and download research packages.',
  },
};

function JoinPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = searchParams.get('token') ?? '';

  const [currentToken, setCurrentToken] = useState(tokenFromUrl);
  const [manualInput, setManualInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [preview, setPreview] = useState<{ orgName: string; role: Role } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(Boolean(tokenFromUrl));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!tokenFromUrl) {
      setIsLoadingPreview(false);
      return;
    }
    previewInvite(tokenFromUrl).then((res) => {
      if (res.valid) {
        setPreview({ orgName: res.orgName, role: res.role });
        setCurrentToken(tokenFromUrl);
      } else {
        setPreviewError(res.error);
      }
      setIsLoadingPreview(false);
    });
  }, [tokenFromUrl]);

  const handleVerifyManualToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = manualInput.trim();
    if (!raw) return;

    // Extract token if user pasted a full URL
    let extracted = raw;
    try {
      if (raw.includes('token=')) {
        const urlObj = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        extracted = urlObj.searchParams.get('token') || raw;
      }
    } catch {
      extracted = raw;
    }

    setIsVerifying(true);
    setPreviewError(null);
    try {
      const res = await previewInvite(extracted);
      if (res.valid) {
        setPreview({ orgName: res.orgName, role: res.role });
        setCurrentToken(extracted);
        router.replace(`/app/join?token=${encodeURIComponent(extracted)}`);
      } else {
        setPreviewError(res.error);
      }
    } catch (err: unknown) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to verify invite token.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFormError('Email and password are required.');
      return;
    }
    if (!termsAccepted) {
      setFormError('You must certify that you are at least 18 years of age and agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const result = await acceptInvite(currentToken, email, password, termsAccepted);
      if (!result.success) {
        setFormError(result.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/app'), 2500);
    });
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoadingPreview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Manual Token Entry / Invalid Link Entry ────────────────────────────────
  if (!preview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-muted border border-border/60 flex items-center justify-center mx-auto text-muted-foreground">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Join Your Lab</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter the invite token or paste the full invite link provided by your Lab PI or Administrator.
            </p>
          </div>

          {previewError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Invite Invalid or Expired</p>
                <p className="mt-0.5">{previewError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleVerifyManualToken} className="space-y-4">
            <div>
              <label htmlFor="inviteToken" className="block text-xs font-medium text-foreground mb-1.5">
                Invite Link or Token
              </label>
              <input
                id="inviteToken"
                type="text"
                required
                autoFocus
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste link or token here…"
                className="w-full px-3 py-2 rounded bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || !manualInput.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {isVerifying ? 'Verifying invite…' : 'Continue to Clearance →'}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-border">
            <Link
              href="/app/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-card border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
          <h1 className="text-base font-semibold text-foreground">Welcome to the lab.</h1>
          <p className="text-sm text-muted-foreground">
            Check your email to confirm your account. Redirecting you to Inquestra…
          </p>
        </div>
      </div>
    );
  }

  const meta = ROLE_META[preview!.role];

  // ── Join form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10 font-sans">
      <div className="max-w-md w-full space-y-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 justify-center group">
          <Logo className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
          <span className="text-foreground font-semibold text-sm tracking-tight">Inquestra</span>
        </Link>

        {/* Clearance card */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-muted/40 border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-primary/10 border border-primary/20">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Lab Clearance Granted
                </p>
                <h1 className="text-sm font-semibold text-foreground mt-0.5">{preview!.orgName}</h1>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Role badge */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                Your Clearance Level
              </p>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-semibold ${meta.color}`}>
                <Shield className="w-3.5 h-3.5" />
                {meta.level} · {meta.label}
              </div>
            </div>

            {/* Duties */}
            <div className="bg-muted/30 border border-border rounded px-4 py-3">
              <p className="text-xs font-medium text-foreground mb-1">Operational Mandate</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{meta.duties}</p>
            </div>
          </div>
        </div>

        {/* Sign-up form */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Create your account</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              You&apos;re joining <strong>{preview!.orgName}</strong> as a{' '}
              <span className="font-semibold text-foreground">{meta.label}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                autoFocus
                className="w-full px-3 py-2 rounded bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Password <span className="text-muted-foreground font-normal">(min. 8 chars, mixed case &amp; numbers)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2 pr-10 rounded bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Age Certification & Terms Agreement (COPPA / Legal Compliance) */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="termsAcceptedJoin"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={isPending}
                className="mt-0.5 w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 transition-colors cursor-pointer"
              />
              <label htmlFor="termsAcceptedJoin" className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
                I certify that I am at least 18 years of age and agree to the{' '}
                <Link href="/terms" target="_blank" className="text-primary hover:underline underline-offset-2">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="text-primary hover:underline underline-offset-2">
                  Privacy Policy
                </Link>.
              </label>
            </div>

            {formError && (
              <p className="text-xs text-critical bg-critical/10 border border-critical/20 rounded px-3 py-2">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {isPending ? 'Creating your account…' : 'Join Lab & Accept Clearance'}
            </button>
          </form>

          <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
            By joining, you acknowledge your compliance duties under{' '}
            <span className="font-medium">FDA 21 CFR Part 11</span> and your lab&apos;s GLP policies.
          </p>
        </div>

        {/* Legal Footer Links */}
        <div className="text-center text-xs text-neutral-600 flex items-center justify-center gap-3">
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

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  );
}
