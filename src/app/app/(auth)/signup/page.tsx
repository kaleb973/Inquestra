'use client';
// src/app/(auth)/signup/page.tsx
// Researcher account creation — collects name, lab type, email, password.

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { signUp } from '@/actions/authActions';

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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Logo className="text-indigo-400 w-6 h-6" />
          <span className="text-white font-bold text-lg tracking-widest uppercase">
            Inquestra
          </span>
        </div>

        <div className="bg-muted border border-border rounded-xl p-8">
          <h1 className="text-white text-xl font-semibold mb-1">Create account</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Set up your research lab on Inquestra.
          </p>

          {success ? (
            <div className="text-indigo-400 text-sm bg-indigo-950/40 border border-indigo-900 rounded-lg px-4 py-4 text-center">
              <p className="font-medium mb-1">Check your inbox</p>
              <p className="text-indigo-500 text-xs">{success}</p>
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
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                  Institutional email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={isPending}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="researcher@university.edu"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Password <span className="text-neutral-700">(min. 8 characters)</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={isPending}
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
                disabled={isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {isPending ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}

          <div className="mt-6 space-y-2 text-center">
            <p className="text-xs text-neutral-600">
              Already have an account?{' '}
              <Link href="/app/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-neutral-700">
              Have an invite link?{' '}
              <Link href="/app/join" className="text-indigo-500 hover:text-indigo-400 transition-colors">
                Join your lab →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
