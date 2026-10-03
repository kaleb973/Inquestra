'use client';
// src/components/editor/tools/SignaturePanel.tsx
// 21 CFR Part 11 electronic signature workflow panel.
// Attaches to the bottom of the trial canvas when the trial is cloud-synced.

import { useEffect, useState, useTransition } from 'react';
import { fetchTrialSignatures, signTrial } from '@/actions/trialActions';
import {
  ShieldCheck,
  PenLine,
  Loader2,
  CheckCircle2,
  User as UserIcon,
  AlertTriangle,
} from 'lucide-react';
import type { Role } from '@prisma/client';

type Sig = {
  id: string;
  role: 'AUTHOR' | 'WITNESS' | 'PI_APPROVAL';
  meaning: string;
  signedAt: Date;
  user: { email: string; role: Role };
};

interface SignaturePanelProps {
  trialId: string | null;
  isSynced: boolean;
  isSealed: boolean;
  currentUserRole: Role | null;
  currentUserEmail: string | null;
  onRequestSeal?: () => void;
}

const SIG_META: Record<Sig['role'], { label: string; color: string; badge: string }> = {
  AUTHOR: {
    label: 'Authored & Recorded',
    color: 'border-sky-500/30 bg-sky-500/5',
    badge: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/30',
  },
  WITNESS: {
    label: 'Witnessed',
    color: 'border-indigo-500/30 bg-indigo-500/5',
    badge: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/30',
  },
  PI_APPROVAL: {
    label: 'PI Approved',
    color: 'border-violet-500/30 bg-violet-500/5',
    badge: 'text-violet-700 dark:text-violet-300 bg-violet-500/10 border-violet-500/30',
  },
};

const DEFAULT_MEANINGS: Record<Sig['role'], string> = {
  AUTHOR: 'I authored this experiment and certify that the data recorded herein is accurate and complete.',
  WITNESS: 'I have reviewed the procedures and data in this trial and confirm they are consistent with laboratory standards.',
  PI_APPROVAL: 'I have reviewed, approved, and take responsibility for this trial as the Principal Investigator.',
};

export function SignaturePanel({
  trialId,
  isSynced,
  isSealed,
  currentUserRole,
  currentUserEmail,
  onRequestSeal,
}: SignaturePanelProps) {
  const [signatures, setSignatures] = useState<Sig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [signingRole, setSigningRole] = useState<Sig['role'] | null>(null);
  const [meaning, setMeaning] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canApprove = currentUserRole === 'PI' || currentUserRole === 'ADMIN';

  const reload = () => {
    if (!trialId) return;
    setIsLoading(true);
    fetchTrialSignatures(trialId)
      .then((sigs) => setSignatures(sigs as Sig[]))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isSynced && trialId) reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trialId, isSynced]);

  const alreadySigned = (role: Sig['role']) =>
    signatures.some((s) => s.user.email === currentUserEmail && s.role === role);

  const hasPIApproval = signatures.some((s) => s.role === 'PI_APPROVAL');

  const handleSign = (role: Sig['role']) => {
    if (!trialId) return;
    setError(null);
    const sigMeaning = meaning.trim() || DEFAULT_MEANINGS[role];
    startTransition(async () => {
      try {
        await signTrial(trialId, role, sigMeaning);
        setSigningRole(null);
        setMeaning('');
        reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Signing failed.');
      }
    });
  };

  if (!isSynced || !trialId) return null;

  return (
    <div className="border-t-2 border-border/60 mt-12 pt-8 pb-4 print:hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <ShieldCheck className="w-4 h-4 text-indigo-500" />
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Electronic Signatures
        </h3>
        <span className="text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded">
          21 CFR Part 11
        </span>
        {isSealed && (
          <span className="ml-auto text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
            ✓ Trial Sealed
          </span>
        )}
      </div>

      {/* Existing signatures */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading signatures…
        </div>
      ) : (
        <div className="space-y-2 mb-5">
          {signatures.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              No signatures yet. Sign below to begin the approval chain.
            </p>
          )}
          {signatures.map((sig) => {
            const meta = SIG_META[sig.role];
            return (
              <div
                key={sig.id}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${meta.color}`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-foreground font-medium">
                      <UserIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                      {sig.user.email}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(sig.signedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 italic leading-snug">
                    &ldquo;{sig.meaning}&rdquo;
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons (hidden when sealed) */}
      {!isSealed && (
        <div className="space-y-3">
          {error && (
            <div className="flex items-start gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Signing form */}
          {signingRole && (
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-medium text-foreground">
                Signing as: <span className="font-bold">{SIG_META[signingRole].label}</span>
              </p>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">
                  Signature meaning (edit or use default)
                </label>
                <textarea
                  value={meaning || DEFAULT_MEANINGS[signingRole]}
                  onChange={(e) => setMeaning(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground resize-none focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSign(signingRole)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />}
                  Confirm Signature
                </button>
                <button
                  onClick={() => { setSigningRole(null); setMeaning(''); setError(null); }}
                  className="px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Signature action buttons */}
          {!signingRole && (
            <div className="flex flex-wrap gap-2">
              {/* Author */}
              {!alreadySigned('AUTHOR') && (
                <button
                  onClick={() => { setSigningRole('AUTHOR'); setMeaning(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-sky-500/40 text-sky-700 dark:text-sky-300 bg-sky-500/5 hover:bg-sky-500/15 transition-colors"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Sign as Author
                </button>
              )}

              {/* Witness (PI/Admin only) */}
              {canApprove && !alreadySigned('WITNESS') && (
                <button
                  onClick={() => { setSigningRole('WITNESS'); setMeaning(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/15 transition-colors"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Sign as Witness
                </button>
              )}

              {/* PI Approval (PI/Admin only) */}
              {canApprove && !alreadySigned('PI_APPROVAL') && (
                <button
                  onClick={() => { setSigningRole('PI_APPROVAL'); setMeaning(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-500/40 text-violet-700 dark:text-violet-300 bg-violet-500/5 hover:bg-violet-500/15 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  PI Approval
                </button>
              )}

              {/* Seal trial — only shows after PI has approved */}
              {hasPIApproval && onRequestSeal && (
                <button
                  onClick={onRequestSeal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/5 hover:bg-amber-500/15 transition-colors ml-auto"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Seal Trial
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
