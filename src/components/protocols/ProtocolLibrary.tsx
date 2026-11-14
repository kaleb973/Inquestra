'use client';
// src/components/protocols/ProtocolLibrary.tsx
// Browse, create, publish/unpublish, and delete protocol & SOP templates.
// Admin/PI users see publish and delete controls; researchers see read-only published protocols.

import { useEffect, useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Globe,
  Lock,
  Trash2,
  Pencil,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import {
  listProtocols,
  createProtocol,
  toggleProtocolPublished,
  deleteProtocol,
} from '@/actions/protocolActions';
import type { Role } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProtocolSummary = {
  id: string;
  name: string;
  description: string | null;
  version: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ─── New Protocol Modal ────────────────────────────────────────────────────────

function NewProtocolModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (protocolId: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Protocol name is required.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await createProtocol({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        onCreated(result.protocolId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create protocol.');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground">New Protocol Template</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Protocol Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Western Blot — Standard Protocol v1"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Description{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief scope of this SOP…"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded text-xs font-medium border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-3 py-2 rounded text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {isPending ? 'Creating…' : 'Create Protocol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Library Component ───────────────────────────────────────────────────

interface ProtocolLibraryProps {
  currentUserRole: Role;
  initialProtocols?: ProtocolSummary[];
  orgName?: string;
  onEditProtocol?: (protocolId: string) => void;
  /** Optional: if provided, clicking a published protocol inserts it at this callback */
  onInsertProtocol?: (protocol: ProtocolSummary) => void;
  /** Compact picker mode — hides admin controls */
  pickerMode?: boolean;
}

export function ProtocolLibrary({
  currentUserRole,
  initialProtocols,
  orgName,
  onEditProtocol,
  onInsertProtocol,
  pickerMode = false,
}: ProtocolLibraryProps) {
  const [protocols, setProtocols] = useState<ProtocolSummary[]>(initialProtocols || []);
  const [isLoading, setIsLoading] = useState(!initialProtocols);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canManage = currentUserRole === 'PI' || currentUserRole === 'ADMIN';

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listProtocols();
      // Convert Date objects passed through server action boundary
      setProtocols(data as ProtocolSummary[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialProtocols) {
      load();
    }
  }, [load, initialProtocols]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleTogglePublish = (protocolId: string) => {
    setActionError(null);
    startTransition(async () => {
      try {
        const result = await toggleProtocolPublished(protocolId);
        setProtocols((prev) =>
          prev.map((p) => (p.id === protocolId ? { ...p, isPublished: result.isPublished } : p))
        );
        showSuccess(result.isPublished ? 'Protocol published.' : 'Protocol unpublished.');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Action failed.');
      }
    });
  };

  const handleDelete = (protocol: ProtocolSummary) => {
    if (
      !confirm(
        `Permanently delete "${protocol.name}"? This cannot be undone.\n\nNote: protocols referenced by active trials cannot be deleted.`
      )
    )
      return;
    setActionError(null);
    startTransition(async () => {
      try {
        await deleteProtocol(protocol.id);
        setProtocols((prev) => prev.filter((p) => p.id !== protocol.id));
        showSuccess('Protocol deleted.');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Delete failed.');
      }
    });
  };

  const handleCreated = (protocolId: string) => {
    setShowNewModal(false);
    load(); // reload list
    if (onEditProtocol) onEditProtocol(protocolId);
  };

  const visibleProtocols = pickerMode
    ? protocols.filter((p) => p.isPublished)
    : protocols;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {!pickerMode && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-colors flex items-center gap-1.5 text-xs font-medium shrink-0 shadow-xs"
              title="Return to notebook workspace"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Notebook</span>
            </Link>

            <div className="h-4 w-px bg-border/80" />

            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-foreground" />
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                Protocol &amp; SOP Library
              </h2>
              {orgName && (
                <span className="text-[10px] text-muted-foreground font-mono bg-muted border border-border px-1.5 py-0.5 rounded">
                  {orgName}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded font-mono">
                {protocols.length} templates
              </span>
            </div>
          </div>
          {canManage && (
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New Protocol
            </button>
          )}
        </div>
      )}

      {/* Feedback banners */}
      {successMsg && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          {successMsg}
        </div>
      )}
      {actionError && (
        <div className="mx-4 mt-3 flex items-start gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : visibleProtocols.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <ClipboardList className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              {pickerMode ? 'No published protocols available.' : 'No protocols yet.'}
            </p>
            {!pickerMode && canManage && (
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create your first protocol
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleProtocols.map((protocol) => (
              <div
                key={protocol.id}
                className={`group bg-card border rounded-xl p-4 transition-all ${
                  pickerMode
                    ? 'border-border hover:border-border cursor-pointer hover:shadow-md'
                    : 'border-border hover:border-border/80'
                }`}
                onClick={pickerMode && onInsertProtocol ? () => onInsertProtocol(protocol) : undefined}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {protocol.isPublished ? (
                      <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {protocol.name}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded shrink-0">
                        v{protocol.version}
                      </span>
                      {protocol.isPublished && (
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded shrink-0">
                          Published
                        </span>
                      )}
                    </div>
                    {protocol.description && (
                      <p className="text-xs text-muted-foreground mt-1 leading-snug truncate">
                        {protocol.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground font-mono mt-1.5">
                      Updated {new Date(protocol.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Admin controls */}
                  {!pickerMode && (
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEditProtocol && (
                        <button
                          onClick={() => onEditProtocol(protocol.id)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Edit protocol"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleTogglePublish(protocol.id)}
                            disabled={isPending}
                            className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                              protocol.isPublished
                                ? 'text-emerald-600 hover:bg-emerald-500/10'
                                : 'text-muted-foreground hover:text-emerald-600 hover:bg-accent'
                            }`}
                            title={protocol.isPublished ? 'Unpublish' : 'Publish'}
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(protocol)}
                            disabled={isPending}
                            className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="Delete protocol"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewModal && (
        <NewProtocolModal onClose={() => setShowNewModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
