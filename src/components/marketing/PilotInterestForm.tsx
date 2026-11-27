'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { trackAnalyticsEvent } from '@/lib/analytics/events';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export function PilotInterestForm() {
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [role, setRole] = useState('');
  const [useCase, setUseCase] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('submitting');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/pilot-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, institution, role, useCase }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server error (${res.status})`);
      }

      setState('success');
      trackAnalyticsEvent('pilot_interest_submitted', { role, institution });
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    }
  };

  const isSubmitting = state === 'submitting';
  const submitLabel = isSubmitting ? 'Sending…' : 'Send Inquiry';

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-phosphor" />
        <h3 className="text-lg font-semibold text-foreground">Inquiry received.</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Thank you for reaching out. Your note has been forwarded to the project maintainer for review.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pilot-name" className="block text-sm font-medium text-foreground mb-1.5">
            Full name <span className="text-critical">*</span>
          </label>
          <input
            id="pilot-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full h-11 px-3 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          />
        </div>
        <div>
          <label htmlFor="pilot-email" className="block text-sm font-medium text-foreground mb-1.5">
            Email <span className="text-critical">*</span>
          </label>
          <input
            id="pilot-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full h-11 px-3 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pilot-institution" className="block text-sm font-medium text-foreground mb-1.5">
            Lab, organization, or project{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="pilot-institution"
            name="institution"
            type="text"
            autoComplete="organization"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="University lab, maker bench, or independent"
            className="w-full h-11 px-3 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          />
        </div>
        <div>
          <label htmlFor="pilot-role" className="block text-sm font-medium text-foreground mb-1.5">
            Your role <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="pilot-role"
            name="role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Principal Investigator, Postdoc, or Engineer"
            className="w-full h-11 px-3 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor="pilot-usecase" className="block text-sm font-medium text-foreground mb-1.5">
          What are you trying to track?{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="pilot-usecase"
          name="useCase"
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          placeholder="Instrument serial streams with linked reagent lots"
          rows={3}
          className="w-full p-3 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
        />
      </div>

      <div className="min-h-[1.25rem]">
        {state === 'error' && errorMsg && (
          <p role="alert" className="text-xs text-critical bg-critical/10 border border-critical/25 rounded-md px-3 py-2">
            {errorMsg}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-95 px-6 rounded-md text-sm font-semibold transition-opacity disabled:opacity-55 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        <span>{submitLabel}</span>
        {isSubmitting ? null : <ArrowRight className="w-4 h-4" />}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Open-source hardware and setup inquiry. Reviewed asynchronously by the maintainer.
      </p>
    </form>
  );
}
