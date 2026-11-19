'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  Archive,
  FileCode,
  FileText,
  Printer,
  ShieldCheck,
  CheckCircle2,
  X,
  Loader2,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';
import {
  exportTrialAsZip,
  exportTrialAsJson,
  exportTrialAsMarkdown,
  type SignatureExport,
} from '@/lib/exportTrial';
import { fetchTrialSignatures } from '@/actions/trialActions';

interface ExportTrialModalProps {
  open: boolean;
  onClose: () => void;
  onOpenImport?: () => void;
}

type ExportFormat = 'ZIP' | 'JSON' | 'MARKDOWN' | 'PDF';

export function ExportTrialModal({ open, onClose, onOpenImport }: ExportTrialModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('ZIP');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const activeTrial = useNotebookStore((s) => s.activeTrial);
  const cloudTrialId = useNotebookStore((s) => s.cloudTrialId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isExporting, onClose]);

  if (!open || !mounted) return null;

  const isSealed = !!activeTrial.checksum;
  const metadataCount = activeTrial.metadata?.length || 0;

  const handleExecuteExport = async () => {
    if (selectedFormat === 'PDF') {
      onClose();
      // Wait for modal backdrop to unmount before triggering print dialog
      setTimeout(() => {
        window.print();
      }, 150);
      return;
    }

    setIsExporting(true);
    try {
      // 1. Resolve HTML from canvas for Markdown/ZIP generation
      const htmlEvent = new CustomEvent<{ resolve: (html: string) => void }>(
        'inquestra:request-html',
        { detail: { resolve: () => {} }, bubbles: true }
      );
      let resolvedHtml = '';
      const promise = new Promise<string>((res) => {
        (htmlEvent.detail as { resolve: (html: string) => void }).resolve = res;
      });
      document.dispatchEvent(htmlEvent);
      resolvedHtml = await Promise.race([
        promise,
        new Promise<string>((res) => setTimeout(() => res(''), 250)),
      ]);

      // 2. Resolve signatures if cloud trial
      let signatures: SignatureExport[] = [];
      if (cloudTrialId) {
        try {
          const sigs = await fetchTrialSignatures(cloudTrialId);
          signatures = sigs.map((s) => ({
            role: s.role as 'AUTHOR' | 'WITNESS' | 'PI_APPROVAL',
            meaning: s.meaning,
            signedAt: s.signedAt,
            user: { email: s.user.email, role: s.user.role },
          }));
        } catch (e) {
          console.error('Failed to fetch signatures for export:', e);
        }
      }

      const payload = {
        title: activeTrial.title || 'Untitled Experiment',
        content: activeTrial.content,
        metadata: (activeTrial.metadata || []).map(({ key, value }) => ({ key, value })),
        status: activeTrial.status || 'DRAFT',
        createdAt: activeTrial.createdAt,
        updatedAt: activeTrial.updatedAt,
        html: resolvedHtml,
        checksum: activeTrial.checksum,
        sealedAt: activeTrial.sealedAt,
        signatures,
      };

      if (selectedFormat === 'ZIP') {
        await exportTrialAsZip(payload);
      } else if (selectedFormat === 'JSON') {
        exportTrialAsJson(payload);
      } else if (selectedFormat === 'MARKDOWN') {
        exportTrialAsMarkdown(payload);
      }

      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      setExportError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-trial-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-xl max-h-[90vh] my-auto flex flex-col rounded-xl border border-border bg-background shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 id="export-trial-title" className="text-base font-semibold text-foreground">
                Export Experiment
              </h2>
              <p className="text-xs text-muted-foreground">
                Save a portable archive of this experiment for archiving, reporting, or re-import.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
            aria-label="Close export dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Active Trial Target Info */}
          <div className="p-4 rounded-xl border border-border bg-card/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Target Experiment
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-muted text-foreground border border-border">
                  {activeTrial.status || 'DRAFT'}
                </span>
                {isSealed && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-caution/10 text-caution border border-caution/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    SEALED
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">
              {activeTrial.title || 'Untitled Experiment'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <span>{metadataCount} metadata parameter{metadataCount !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{cloudTrialId ? 'Cloud synced' : 'Local notebook draft'}</span>
              {isSealed && activeTrial.checksum && (
                <>
                  <span>•</span>
                  <span className="font-mono truncate max-w-[200px]" title={activeTrial.checksum}>
                    SHA-256: {activeTrial.checksum.slice(0, 12)}…
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Format Selection Grid */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-foreground block">
              Choose Export Format:
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: ZIP (Recommended) */}
              <div
                onClick={() => setSelectedFormat('ZIP')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'ZIP'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border bg-card/30 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Archive className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        Complete Archive (.ZIP)
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      All-in-one portable package containing everything needed for compliance, archiving, or 1-click re-import.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5 text-[10px] font-mono text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-background border border-border">trial.md</span>
                      <span className="px-2 py-0.5 rounded bg-background border border-border">trial.json</span>
                      <span className="px-2 py-0.5 rounded bg-background border border-border">metadata.csv</span>
                      <span className="px-2 py-0.5 rounded bg-background border border-border">AUDIT_CERTIFICATE.md</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: JSON */}
              <div
                onClick={() => setSelectedFormat('JSON')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'JSON'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border bg-card/30 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground">
                      TipTap Document (.JSON)
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Raw document AST with chemical molecules, DNA sequences, and protocol steps. Directly re-importable into Inquestra.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 3: Markdown */}
              <div
                onClick={() => setSelectedFormat('MARKDOWN')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'MARKDOWN'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border bg-card/30 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground">
                      Markdown Notes (.MD)
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Clean GitHub-flavored Markdown protocol with YAML frontmatter. Ideal for GitHub, Notion, or lab wikis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 4: PDF */}
              <div
                onClick={() => setSelectedFormat('PDF')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'PDF'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border bg-card/30 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground">
                      Print / Save as PDF
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Opens browser print layout pre-styled with paginated protocol tables, charts, and audit headers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Re-import cross link */}
          {onOpenImport && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Want to restore a previously exported run?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenImport();
                }}
                className="text-xs font-semibold text-foreground hover:text-primary transition-colors underline underline-offset-2 flex items-center gap-1 shrink-0"
              >
                Open Import Tool
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {exportError && (
          <div className="mx-6 mb-3 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs leading-relaxed">
            {exportError}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-card/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Preparing Export…</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>
                  {selectedFormat === 'ZIP' && 'Download Complete Archive (.ZIP)'}
                  {selectedFormat === 'JSON' && 'Download TipTap JSON (.JSON)'}
                  {selectedFormat === 'MARKDOWN' && 'Download Markdown (.MD)'}
                  {selectedFormat === 'PDF' && 'Print / Save as PDF'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
