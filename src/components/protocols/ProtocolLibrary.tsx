'use client';
// src/components/protocols/ProtocolLibrary.tsx
// Browse, execute, adopt, create, publish/unpublish, and delete protocol & SOP templates.
// Features:
//   - Organization SOPs (My Lab)
//   - Verified SOP Catalog (Multi-disciplinary standard protocols across Molecular Bio, Chemistry, Biotech, Materials Science)
//   - 1-Click "Execute at Bench" directly creating/loading active trials
//   - "Adopt to Lab" cloning verified templates into the lab's private library

import { useEffect, useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Play,
  Download,
  BookOpen,
  Clock,
  Layers,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  FlaskConical,
} from 'lucide-react';
import {
  listProtocols,
  createProtocol,
  toggleProtocolPublished,
  deleteProtocol,
  adoptStandardProtocol,
  createTrialFromProtocol,
} from '@/actions/protocolActions';
import {
  STANDARD_PROTOCOLS,
  type StandardProtocol,
  type ProtocolCategory,
  buildTipTapProtocolDoc,
} from '@/lib/protocols/standardProtocols';
import { useNotebookStore } from '@/store/useNotebookStore';
import type { Role } from '@prisma/client';
import type { TrialDocument } from '@/types/inquestra';

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

const CATEGORIES: ('All' | ProtocolCategory)[] = [
  'All',
  'Molecular Biology',
  'Biochemistry',
  'Cell Biology',
  'Chemistry',
  'Materials Science',
];

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
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors font-sans"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief scope, equipment, or target analytes for this SOP…"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors font-sans"
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
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'lab' | 'catalog'>('lab');
  const [protocols, setProtocols] = useState<ProtocolSummary[]>(initialProtocols || []);
  const [isLoading, setIsLoading] = useState(!initialProtocols);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [executingSlug, setExecutingSlug] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProtocolCategory>('All');
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);

  const canManage = currentUserRole === 'PI' || currentUserRole === 'ADMIN';

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listProtocols();
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
    setTimeout(() => setSuccessMsg(null), 3500);
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
    load();
    if (onEditProtocol) onEditProtocol(protocolId);
  };

  // ─── Bench Execution ───────────────────────────────────────────────────────

  const handleExecuteProtocol = async (options: { protocolId?: string; standard?: StandardProtocol }) => {
    setActionError(null);
    const identifier = options.protocolId || options.standard?.slug || 'run';
    setExecutingSlug(identifier);

    try {
      // Attempt server action to create a cloud trial
      const res = await createTrialFromProtocol({
        protocolId: options.protocolId,
        standardSlug: options.standard?.slug,
      });

      if (res.success && res.trialId) {
        showSuccess('Launching trial bench execution…');
        router.push(`/app?trialId=${res.trialId}`);
        return;
      }
    } catch {
      // Fallback: If unauthenticated, in local-first mode, or network drop
      if (options.standard) {
        const contentDoc = buildTipTapProtocolDoc(options.standard);
        const localTrial: TrialDocument = {
          id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          title: `Run: ${options.standard.name}`,
          content: contentDoc,
          status: 'ACTIVE',
          metadata: [
            { id: 'meta-cat', key: 'Discipline', value: options.standard.category },
            { id: 'meta-dur', key: 'Estimated Duration', value: options.standard.estimatedDuration },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        useNotebookStore.getState().setActiveTrial(localTrial);
        showSuccess('Loaded protocol into local bench notebook.');
        router.push('/app');
        return;
      }
      setActionError('Failed to initialize trial execution. Try again.');
    } finally {
      setExecutingSlug(null);
    }
  };

  // ─── Adopt Standard Protocol ───────────────────────────────────────────────

  const handleAdoptStandard = (standard: StandardProtocol) => {
    setActionError(null);
    startTransition(async () => {
      try {
        const res = await adoptStandardProtocol(standard.slug);
        await load();
        if (res.isExisting) {
          showSuccess(`"${standard.name}" is already in your lab library.`);
        } else {
          showSuccess(`Adopted "${standard.name}" into your lab library.`);
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to adopt protocol.');
      }
    });
  };

  // ─── Filtering ─────────────────────────────────────────────────────────────

  const trimmedSearch = searchQuery.toLowerCase().trim();

  const filteredLabProtocols = protocols.filter((p) => {
    const matchesSearch =
      !trimmedSearch ||
      p.name.toLowerCase().includes(trimmedSearch) ||
      (p.description && p.description.toLowerCase().includes(trimmedSearch));
    return pickerMode ? p.isPublished && matchesSearch : matchesSearch;
  });

  const filteredStandardProtocols = STANDARD_PROTOCOLS.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !trimmedSearch ||
      p.name.toLowerCase().includes(trimmedSearch) ||
      p.description.toLowerCase().includes(trimmedSearch) ||
      p.steps.some((s) => s.text.toLowerCase().includes(trimmedSearch));
    return matchesCategory && matchesSearch;
  });

  const isStandardAdopted = (name: string) => {
    return protocols.some((p) => p.name.toLowerCase() === name.toLowerCase());
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      {!pickerMode && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20 shrink-0 flex-wrap gap-3">
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
              <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                Protocol &amp; SOP Execution Hub
              </h2>
              {orgName && (
                <span className="text-[10px] text-muted-foreground font-mono bg-muted border border-border px-1.5 py-0.5 rounded">
                  {orgName}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                New Protocol
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs & Controls Bar */}
      <div className="px-6 py-3 border-b border-border/80 bg-card/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1 p-0.5 bg-muted/70 rounded-lg border border-border/60">
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'lab'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>My Lab SOPs</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted border border-border">
              {protocols.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Verified SOP Catalog</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {STANDARD_PROTOCOLS.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'lab' ? 'Search lab protocols…' : 'Search verified SOPs…'}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (Only for Catalog Tab) */}
      {activeTab === 'catalog' && (
        <div className="px-6 py-2 border-b border-border/50 bg-muted/10 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
            <FlaskConical className="w-3 h-3" /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? 'bg-foreground text-background font-semibold border-foreground shadow-xs'
                  : 'bg-background/80 text-muted-foreground hover:text-foreground border-border hover:border-border/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Feedback banners */}
      {successMsg && (
        <div className="mx-6 mt-3 flex items-center gap-2 px-3.5 py-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {actionError && (
        <div className="mx-6 mt-3 flex items-start gap-2 px-3.5 py-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'lab' ? (
          /* TAB 1: MY LAB SOPS */
          isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse border border-border/40" />
              ))}
            </div>
          ) : filteredLabProtocols.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card/40 p-8">
              <ClipboardList className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-foreground">
                {searchQuery ? 'No matching lab protocols found.' : 'No protocol templates in your lab yet.'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                {searchQuery
                  ? 'Try clearing your search query or check the Verified SOP Catalog.'
                  : 'Create custom SOPs from scratch or adopt standard templates from our verified catalog.'}
              </p>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Browse Verified SOPs
                </button>
                {canManage && (
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-accent text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Custom Protocol
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLabProtocols.map((protocol) => (
                <div
                  key={protocol.id}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-emerald-500/40 transition-all group"
                  onClick={pickerMode && onInsertProtocol ? () => onInsertProtocol(protocol) : undefined}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {protocol.isPublished ? (
                          <span title="Published to Lab" className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Globe className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span title="Private Draft" className="p-1 rounded bg-muted text-muted-foreground">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {protocol.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded shrink-0">
                        v{protocol.version}
                      </span>
                    </div>

                    {protocol.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {protocol.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Updated {new Date(protocol.updatedAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Execute Button */}
                      {!pickerMode && (
                        <button
                          onClick={() => handleExecuteProtocol({ protocolId: protocol.id })}
                          disabled={executingSlug === protocol.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50"
                          title="Launch interactive protocol run in a new trial"
                        >
                          {executingSlug === protocol.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3 fill-white" />
                          )}
                          <span>Run SOP</span>
                        </button>
                      )}

                      {/* Edit Button */}
                      {!pickerMode && onEditProtocol && (
                        <button
                          onClick={() => onEditProtocol(protocol.id)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent border border-border transition-colors"
                          title="Edit template content"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Publish / Delete for PI/Admin */}
                      {!pickerMode && canManage && (
                        <>
                          <button
                            onClick={() => handleTogglePublish(protocol.id)}
                            disabled={isPending}
                            className={`p-1.5 rounded transition-colors border border-border disabled:opacity-50 ${
                              protocol.isPublished
                                ? 'text-emerald-600 hover:bg-emerald-500/10'
                                : 'text-muted-foreground hover:text-emerald-600 hover:bg-accent'
                            }`}
                            title={protocol.isPublished ? 'Unpublish protocol' : 'Publish protocol'}
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(protocol)}
                            disabled={isPending}
                            className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-border transition-colors disabled:opacity-50"
                            title="Delete protocol template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* TAB 2: VERIFIED SOP CATALOG */
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-xs text-foreground">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Peer-Reviewed Standard Protocols:
                  </span>{' '}
                  Pre-calibrated assay procedures, timers, and quality checkpoints ready for bench execution or lab adoption.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStandardProtocols.map((std) => {
                const adopted = isStandardAdopted(std.name);
                const isExpanded = expandedStandard === std.slug;
                const isExecuting = executingSlug === std.slug;

                return (
                  <div
                    key={std.slug}
                    className="bg-card border border-border hover:border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between shadow-xs transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-muted border border-border text-foreground font-mono">
                              {std.category}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> {std.estimatedDuration}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-foreground">
                            {std.name}
                          </h3>
                        </div>

                        {adopted && (
                          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> In Lab
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        {std.description}
                      </p>

                      {/* Step Preview Accordion */}
                      <div className="border-t border-border/50 pt-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setExpandedStandard(isExpanded ? null : std.slug)}
                          className="flex items-center justify-between w-full text-[11px] font-mono text-muted-foreground hover:text-foreground py-1"
                        >
                          <span>{std.steps.length} Protocol Checkpoints</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1.5 pl-2 border-l border-border/80 text-[11px] font-mono max-h-48 overflow-y-auto">
                            {std.steps.map((st, i) => (
                              <div key={st.id} className="text-muted-foreground flex items-start gap-1.5">
                                <span className="text-foreground shrink-0">{i + 1}.</span>
                                <span className="text-foreground/90">{st.text}</span>
                                {st.timerDuration && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-muted border border-border shrink-0 ml-auto text-emerald-600 dark:text-emerald-400">
                                    {st.timerDuration < 60
                                      ? `${st.timerDuration}s`
                                      : `${Math.round(st.timerDuration / 60)}m`}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        v{std.version} · Ready for Bench
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Adopt to Lab */}
                        {!adopted && canManage && (
                          <button
                            onClick={() => handleAdoptStandard(std)}
                            disabled={isPending}
                            className="px-2.5 py-1 text-xs font-medium rounded border border-border bg-background hover:bg-accent text-foreground transition-colors flex items-center gap-1 shadow-2xs disabled:opacity-50"
                            title="Add a customizable copy to your lab's library"
                          >
                            <Download className="w-3 h-3" />
                            <span>Adopt to Lab</span>
                          </button>
                        )}

                        {/* Execute at Bench */}
                        <button
                          onClick={() => handleExecuteProtocol({ standard: std })}
                          disabled={isExecuting}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50"
                          title="Start live interactive run of this protocol"
                        >
                          {isExecuting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3 fill-white" />
                          )}
                          <span>Run at Bench</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showNewModal && (
        <NewProtocolModal onClose={() => setShowNewModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
