'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { signUp } from '@/actions/authActions';
import { Eye, EyeOff } from 'lucide-react';

const LAB_TYPES = [
  { value: '', label: '— Select lab type —' },
  { value: 'Academic Lab', label: 'Academic / University Lab' },
  { value: 'Biotech / Startup', label: 'Biotech / Startup' },
  { value: 'Hospital / Clinical', label: 'Hospital / Clinical Research' },
  { value: 'Government / Federal', label: 'Government / Federal Lab' },
  { value: 'Independent', label: 'Independent Researcher' },
];

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await signUp(formData);
        if (result?.error) setError(result.error);
        if (result?.success) setSuccess(result.success);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <Logo className="text-foreground group-hover:text-primary transition-colors w-6 h-6" />
          <span className="text-foreground font-semibold text-base tracking-tight">
            Inquestra
          </span>
        </Link>

        <div className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-sm">
          <h1 className="text-foreground text-xl font-semibold mb-1">Create lab account</h1>
          <p className="text-muted-foreground text-xs mb-6">
            Set up your research workspace on Inquestra.
          </p>

          {success ? (
            <div className="text-primary text-xs bg-primary/10 border border-primary/20 rounded p-4 text-center">
              <p className="font-semibold mb-1">Check your inbox</p>
              <p className="text-muted-foreground leading-relaxed">{success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  disabled={isPending}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Dr. Jane Smith"
                />
              </div>

              {/* Lab Type */}
              <div>
                <label htmlFor="labType" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Lab type
                </label>
                <select
                  id="labType"
                  name="labType"
                  required
                  disabled={isPending}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {LAB_TYPES.map((t) => (
                    <option key={t.value} value={t.value} disabled={t.value === ''}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Institutional work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={isPending}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="researcher@university.edu"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Password <span className="text-muted-foreground/80">(min. 8 chars, mixed case &amp; numbers)</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    disabled={isPending}
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

              {/* Age Certification & Terms Agreement */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="termsAccepted"
                  name="termsAccepted"
                  type="checkbox"
                  value="true"
                  required
                  disabled={isPending}
                  className="mt-0.5 w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 transition-colors cursor-pointer"
                />
                <label htmlFor="termsAccepted" className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
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

              {error && (
                <p className="text-critical text-xs bg-critical/10 border border-critical/20 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold py-2.5 rounded transition-colors"
              >
                {isPending ? 'Creating account…' : 'Create Lab Account'}
              </button>
            </form>
          )}

          {/* Value Prop Underneath */}
          <div className="mt-6 pt-4 border-t border-border text-center text-[11px] text-muted-foreground">
            <span>Free open-core access</span>
            <span className="mx-1.5">·</span>
            <span>No credit card required</span>
            <span className="mx-1.5">·</span>
            <span>Export data anytime</span>
          </div>

          <div className="mt-4 space-y-1.5 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link href="/app/login" className="text-primary hover:underline transition-colors font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              Have an invite link?{' '}
              <Link href="/app/join" className="text-primary hover:underline transition-colors font-medium">
                Join your lab →
              </Link>
            </p>
          </div>
        </div>

        {/* Legal Footer Links */}
        <div className="mt-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-3">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        </div>
      </div>
    </div>
  );
}
