'use client';
// src/components/trials/TrialContextMenu.tsx
// Specialized right-click and action context menu for experiments and trials.
// Provides rapid renaming, categorization, duplication, status shifting, and deletion.

import { useEffect, useRef, useState } from 'react';
import {
  Edit3,
  Copy,
  Tag,
  Trash2,
  Lock,
  Download,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Loader2,
  Share2,
} from 'lucide-react';
import type { TrialStatus, TrialSummaryItem } from '@/types/inquestra';

interface TrialContextMenuProps {
  trial: TrialSummaryItem;
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onRename: (trial: TrialSummaryItem, newTitle: string) => Promise<void>;
  onDuplicate: (trial: TrialSummaryItem) => Promise<void>;
  onDelete: (trial: TrialSummaryItem) => Promise<{ success: boolean; error?: string } | void>;
  onSetCategory: (trial: TrialSummaryItem, category: string) => Promise<void>;
  onChangeStatus: (trial: TrialSummaryItem, status: TrialStatus) => Promise<void>;
  onExport?: (trial: TrialSummaryItem) => void;
}

const COMMON_CATEGORIES = [
  'Assay',
  'Telemetry',
  'Cell Culture',
  'Biomarker',
  'PCR',
  'In Vivo',
  'Calibration',
  'Protocol',
];

const STATUS_OPTIONS: { status: TrialStatus; label: string; dotClass: string }[] = [
  { status: 'DRAFT', label: 'Draft', dotClass: 'bg-muted-foreground' },
  { status: 'ACTIVE', label: 'Active', dotClass: 'bg-sky-500' },
  { status: 'IN_REVIEW', label: 'In Review', dotClass: 'bg-amber-500' },
  { status: 'COMPLETED', label: 'Completed', dotClass: 'bg-emerald-500' },
  { status: 'FAILED', label: 'Failed', dotClass: 'bg-red-500' },
];

export function TrialContextMenu({
  trial,
  x,
  y,
  isOpen,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  onSetCategory,
  onChangeStatus,
  onExport,
}: TrialContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Sub-dialog states
  const [dialogMode, setDialogMode] = useState<'NONE' | 'RENAME' | 'CATEGORY' | 'DELETE'>('NONE');
  const [renameValue, setRenameValue] = useState(trial.title);
  const [categoryValue, setCategoryValue] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false);

  // Position adjustments to prevent viewport clipping
  const [adjustedPos, setAdjustedPos] = useState({ top: y, left: x });

  useEffect(() => {
    if (!isOpen) {
      setDialogMode('NONE');
      setDeleteError(null);
      setShowStatusSubmenu(false);
      setCopiedId(false);
      return;
    }

    setRenameValue(trial.title);
    const existingCat = trial.metadata?.find(
      (m) => m.key.toLowerCase() === 'category' || m.key.toLowerCase() === 'type'
    )?.value;
    setCategoryValue(existingCat || '');

    // Adjust position
    const menuWidth = 220;
    const menuHeight = 260;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    let posX = x;
    let posY = y;

    if (posX + menuWidth > screenW - 12) {
      posX = screenW - menuWidth - 12;
    }
    if (posY + menuHeight > screenH - 12) {
      posY = screenH - menuHeight - 12;
    }

    setAdjustedPos({ top: Math.max(12, posY), left: Math.max(12, posX) });
  }, [isOpen, x, y, trial]);

  // Click outside and escape key listeners
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (dialogMode === 'NONE') {
          onClose();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dialogMode !== 'NONE') {
          setDialogMode('NONE');
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dialogMode, onClose]);

  if (!isOpen) return null;

  const isSealed = trial.status === 'COMPLETED' || !!trial.checksum;

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(trial.id);
    setCopiedId(true);
    setTimeout(() => {
      setCopiedId(false);
      onClose();
    }, 900);
  };

  const handleExecuteRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onRename(trial, renameValue.trim());
      setDialogMode('NONE');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteCategory = async (cat: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSetCategory(trial, cat.trim());
      setDialogMode('NONE');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (isSubmitting || isSealed) return;
    setIsSubmitting(true);
    setDeleteError(null);
    try {
      const res = await onDelete(trial);
      if (res && typeof res === 'object' && res.success === false) {
        setDeleteError(res.error || 'Failed to delete experiment.');
        return;
      }
      setDialogMode('NONE');
      onClose();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete experiment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Context Menu Dropdown */}
      {dialogMode === 'NONE' && (
        <div
          ref={menuRef}
          style={{ top: `${adjustedPos.top}px`, left: `${adjustedPos.left}px` }}
          className="fixed z-50 w-48 rounded-lg bg-popover/95 backdrop-blur-sm border border-border shadow-lg p-1 text-xs text-popover-foreground font-sans animate-in fade-in-50 zoom-in-95 duration-75 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header identity */}
          <div className="px-2 py-1 text-[10px] text-muted-foreground truncate font-mono border-b border-border/50 mb-1">
            <span className="font-medium text-foreground">{trial.title}</span>
          </div>

          {/* Primary Operations */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                if (isSealed) return;
                setDialogMode('RENAME');
              }}
              disabled={isSealed}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Edit3 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>Rename</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isSealed) return;
                setDialogMode('CATEGORY');
              }}
              disabled={isSealed}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>Set tag…</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (isSealed) return;
                  setShowStatusSubmenu(!showStatusSubmenu);
                }}
                disabled={isSealed}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Status</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono uppercase">{trial.status}</span>
              </button>

              {/* Status Submenu */}
              {showStatusSubmenu && !isSealed && (
                <div className="absolute left-full top-0 ml-1 w-32 rounded-lg bg-popover/95 backdrop-blur-sm border border-border shadow-lg p-1 text-xs animate-in fade-in-50 zoom-in-95 duration-75">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.status}
                      onClick={async () => {
                        await onChangeStatus(trial, opt.status);
                        setShowStatusSubmenu(false);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${opt.dotClass}`} />
                        <span>{opt.label}</span>
                      </div>
                      {trial.status === opt.status && <Check className="w-3 h-3 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await onDuplicate(trial);
                  onClose();
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>Duplicate</span>
            </button>
          </div>

          <div className="my-1 h-px bg-border/50" />

          {/* Utility Operations */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={handleCopyId}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>Copy ID</span>
              </div>
              {copiedId && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </button>

            {onExport && (
              <button
                type="button"
                onClick={() => {
                  onExport(trial);
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>Export ZIP…</span>
              </button>
            )}
          </div>

          <div className="my-1 h-px bg-border/50" />

          {/* Destructive Zone */}
          <div>
            {isSealed ? (
              <div
                className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground/60 text-xs cursor-not-allowed"
                title="Sealed experiments are immutable and cannot be deleted"
              >
                <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>Sealed (Locked)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDialogMode('DELETE')}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Delete…</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Rename Dialog Modal */}
      {dialogMode === 'RENAME' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setDialogMode('NONE')}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trial-rename-dialog-title"
            className="w-full max-w-sm rounded-xl bg-card border border-border shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 id="trial-rename-dialog-title" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                Rename Experiment
              </h3>
              <button
                type="button"
                aria-label="Close rename dialog"
                onClick={() => setDialogMode('NONE')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleExecuteRename} className="space-y-4">
              <input
                type="text"
                aria-label="Experiment title"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Experiment title"
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDialogMode('NONE')}
                  className="px-3 py-1.5 rounded text-xs text-muted-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !renameValue.trim()}
                  className="px-3 py-1.5 rounded text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Title'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Category Modal */}
      {dialogMode === 'CATEGORY' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setDialogMode('NONE')}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trial-category-dialog-title"
            className="w-full max-w-sm rounded-xl bg-card border border-border shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 id="trial-category-dialog-title" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Categorize Experiment
              </h3>
              <button
                type="button"
                aria-label="Close categorize dialog"
                onClick={() => setDialogMode('NONE')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="trial-custom-category-input" className="text-xs text-muted-foreground">Select a common tag or type a custom one:</label>
              <div className="flex flex-wrap gap-1.5 pb-2">
                {COMMON_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleExecuteCategory(cat)}
                    disabled={isSubmitting}
                    className="px-2 py-0.5 rounded text-[11px] font-mono border border-border bg-muted/60 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="trial-custom-category-input"
                  type="text"
                  value={categoryValue}
                  onChange={(e) => setCategoryValue(e.target.value)}
                  placeholder="Custom tag (e.g. Chromatography)"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => handleExecuteCategory(categoryValue)}
                  disabled={isSubmitting || !categoryValue.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Set Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {dialogMode === 'DELETE' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && !isSubmitting && setDialogMode('NONE')}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trial-delete-dialog-title"
            className="w-full max-w-sm rounded-xl bg-card border border-destructive/40 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div id="trial-delete-dialog-title" className="flex items-center gap-2 text-destructive font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Delete Experiment?</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">{trial.title}</strong>? All draft revisions and metadata will be permanently removed.
            </p>
            {deleteError && (
              <div className="p-2.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs leading-relaxed animate-in fade-in-50">
                {deleteError}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDialogMode('NONE')}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded text-xs text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Experiment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
