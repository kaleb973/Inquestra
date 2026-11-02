'use client';
// src/components/editor/tools/VersionHistory.tsx
// Revision timeline panel — browse, preview, and fork prior saves as new drafts.

import { useEffect, useState, useTransition } from 'react';
import { fetchTrialRevisions, restoreTrialRevision } from '@/actions/trialActions';
import { History, RotateCcw, Loader2, Clock, User as UserIcon, FileText } from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';

type Revision = {
  id: string;
  title: string;
  savedAt: Date;
  note: string | null;
  savedBy: { email: string };
};

interface VersionHistoryProps {
  trialId: string | null;
  isSynced: boolean;
}

export function VersionHistory({ trialId, isSynced }: VersionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const setActiveTrial = useNotebookStore((s) => s.setActiveTrial);

  useEffect(() => {
    if (!trialId || !isSynced) return;
    setIsLoading(true);
    fetchTrialRevisions(trialId)
      .then((revs) => setRevisions(revs as Revision[]))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [trialId, isSynced]);

  const handleRestore = (rev: Revision) => {
    if (!confirm(`Restore the version from ${new Date(rev.savedAt).toLocaleString()}?\n\nThis creates a new draft trial — it does not overwrite the current one.`)) return;
    setRestoringId(rev.id);
    startTransition(async () => {
      try {
        const result = await restoreTrialRevision(rev.id);
        if (result.success) {
          setRestoreSuccess(
            `Restored as a new draft. Find it in your trial list as "Restored — ${rev.title}".`
          );
          setTimeout(() => setRestoreSuccess(null), 6000);
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Restore failed.');
      } finally {
        setRestoringId(null);
      }
    });
  };

  // ── Not synced state ────────────────────────────────────────────────────────
  if (!isSynced || !trialId) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center px-4">
        <History className="w-6 h-6 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">
          Save this trial to the cloud first to enable version history.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Version History</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{revisions.length} saves</span>
      </div>

      {restoreSuccess && (
        <div className="mx-3 mt-3 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg leading-relaxed">
          {restoreSuccess}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : revisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <FileText className="w-6 h-6 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">
              No saves yet. History captures a snapshot every time you sync to cloud.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {revisions.map((rev, idx) => (
              <div
                key={rev.id}
                className="px-4 py-3 group hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {/* Version label */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {idx === 0 ? 'Latest Save' : `v${revisions.length - idx}`}
                      </span>
                    </div>

                    {/* Title */}
                    <p className="text-xs font-medium text-foreground truncate">{rev.title}</p>

                    {/* Meta */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        {new Date(rev.savedAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <UserIcon className="w-2.5 h-2.5 shrink-0" />
                        {rev.savedBy?.email?.split('@')?.[0] ?? 'Author'}
                      </span>
                    </div>

                    {rev.note && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 italic">&ldquo;{rev.note}&rdquo;</p>
                    )}
                  </div>

                  {/* Restore button (not on the latest save — no point) */}
                  {idx > 0 && (
                    <button
                      onClick={() => handleRestore(rev)}
                      disabled={isPending && restoringId === rev.id}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/15 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 shrink-0"
                      title="Restore this version as a new draft"
                    >
                      {restoringId === rev.id ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-2.5 h-2.5" />
                      )}
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Restoring creates a new draft trial — it never overwrites sealed or original data.
        </p>
      </div>
    </div>
  );
}
