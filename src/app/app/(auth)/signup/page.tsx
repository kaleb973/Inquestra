'use client';
// src/app/(auth)/signup/page.tsx
// Researcher account creation — validates email + password, sends confirmation.

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Activity } from 'lucide-react';
import { signUp } from '@/actions/authActions';

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
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Activity className="text-emerald-400 w-6 h-6" />
          <span className="text-white font-bold text-lg tracking-widest uppercase">
            Inquestra
          </span>
        </div>

        <div className="bg-muted border border-border rounded-xl p-8">
          <h1 className="text-white text-xl font-semibold mb-1">Create account</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Join your research organization on Inquestra.
          </p>

          {success ? (
            <div className="text-emerald-400 text-sm bg-emerald-950/40 border border-emerald-900 rounded-lg px-4 py-4 text-center">
              <p className="font-medium mb-1">Check your inbox</p>
              <p className="text-emerald-500 text-xs">{success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors"
                  placeholder="researcher@university.edu"
                />
              </div>

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
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors"
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
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {isPending ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-neutral-600 mt-6">
            Already have an account?{' '}
            <Link href="/app/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
