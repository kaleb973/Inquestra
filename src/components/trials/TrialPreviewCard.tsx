'use client';
// src/components/trials/TrialPreviewCard.tsx
// Headless summary preview card inspired by Cassini ELN.
// Previews experiment parameters, metadata, and provenance without loading the full notebook kernel.

import { useEffect, useState } from 'react';
import {
  FlaskConical,
  Clock,
  Layers,
  FileCheck2,
  ExternalLink,
  Copy,
  Check,
  Tag,
  X,
  Package,
} from 'lucide-react';
import type { TrialSummaryItem, TrialStatus } from '@/types/inquestra';

const STATUS_STYLE: Record<TrialStatus, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: 'bg-muted/80', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  ACTIVE: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  IN_REVIEW: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  COMPLETED: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  FAILED: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
};

interface TrialPreviewCardProps {
  trial: TrialSummaryItem;
  onOpen: () => void;
  onClose: () => void;
}

export function TrialPreviewCard({ trial, onOpen, onClose }: TrialPreviewCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const status = trial.status as TrialStatus;
  const statusInfo = STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT;

  const handleCopyRef = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`@trial:${trial.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = trial.updatedAt
    ? new Date(trial.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';

  const metadataList = trial.metadata ?? [];
  const revisionsCount = trial._count?.revisions ?? 0;
  const inventoryCount = trial._count?.inventoryUsed ?? 0;
  const signaturesCount = trial._count?.signatures ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-preview-title"
        className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border bg-muted/20">
          <div className="space-y-1.5 pr-4 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold tracking-wider uppercase ${statusInfo.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-xs ${statusInfo.dot}`} />
                {trial.status}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formattedDate}
              </span>
            </div>
            <h3 id="trial-preview-title" className="text-base font-semibold text-foreground truncate tracking-tight">
              {trial.title}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close preview dialog"
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-4 text-xs">
          {/* Cassini-style Experiment Parameters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3 text-muted-foreground" />
                Experiment Parameters
              </span>
              <span className="text-[10px] text-muted-foreground">
                {metadataList.length} tag{metadataList.length !== 1 ? 's' : ''}
              </span>
            </div>

            {metadataList.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/50">
                {metadataList.map((m) => (
                  <div key={m.id} className="flex flex-col min-w-0">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">
                      {m.key}
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate font-mono">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-border/60 text-center text-muted-foreground text-[11px]">
                No structured parameters attached to this trial.
              </div>
            )}
          </div>

          {/* Lineage & Provenance Indicators */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/40 border border-border/40 text-center">
              <Layers className="w-3.5 h-3.5 text-muted-foreground mb-1" />
              <span className="text-xs font-bold text-foreground">{revisionsCount}</span>
              <span className="text-[10px] text-muted-foreground">Revisions</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/40 border border-border/40 text-center">
              <Package className="w-3.5 h-3.5 text-emerald-400 mb-1" />
              <span className="text-xs font-bold text-foreground">{inventoryCount}</span>
              <span className="text-[10px] text-muted-foreground">Reagents</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/40 border border-border/40 text-center">
              <FileCheck2 className="w-3.5 h-3.5 text-blue-400 mb-1" />
              <span className="text-xs font-bold text-foreground">{signaturesCount}</span>
              <span className="text-[10px] text-muted-foreground">Signatures</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-3 border-t border-border bg-muted/20 gap-2">
          <button
            type="button"
            onClick={handleCopyRef}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-accent text-foreground transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Ref Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Copy Ref Token</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpen();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <span>Open in Canvas</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
