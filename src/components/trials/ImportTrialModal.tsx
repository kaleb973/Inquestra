'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import {
  Upload,
  FileCheck2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  X,
  FileText,
  Archive,
  Loader2,
  FolderLock,
  ArrowRight,
  Database,
  Laptop,
} from 'lucide-react';
import {
  processSafeTrialImportFile,
  type ValidatedTrialImport,
  type SecurityAuditReport,
} from '@/lib/security/trialImportSanitizer';
import { useNotebookStore } from '@/store/useNotebookStore';
import { createNewTrial } from '@/actions/trialActions';
import type { TrialDocument, TrialSummaryItem } from '@/types/inquestra';

interface ImportTrialModalProps {
  open: boolean;
  onClose: () => void;
  isGuest?: boolean;
}

export function ImportTrialModal({ open, onClose, isGuest = false }: ImportTrialModalProps) {
  const [mounted, setMounted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const [auditReport, setAuditReport] = useState<SecurityAuditReport | null>(null);
  const [validatedTrial, setValidatedTrial] = useState<ValidatedTrialImport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [targetDestination, setTargetDestination] = useState<'LOCAL' | 'CLOUD'>(
    isGuest ? 'LOCAL' : 'CLOUD'
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const cachedProjects = useNotebookStore((s) => s.cachedProjects);
  const addLocalTrial = useNotebookStore((s) => s.addLocalTrial);
  const setActiveTrial = useNotebookStore((s) => s.setActiveTrial);
  const setCloudIds = useNotebookStore((s) => s.setCloudIds);
  const setSaveStatus = useNotebookStore((s) => s.setSaveStatus);
  const setCachedTrials = useNotebookStore((s) => s.setCachedTrials);
  const cachedTrials = useNotebookStore((s) => s.cachedTrials);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (cachedProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(cachedProjects[0].id);
    }
  }, [cachedProjects, selectedProjectId]);

  useEffect(() => {
    if (open) {
      setTargetDestination(isGuest ? 'LOCAL' : 'CLOUD');
      if (cachedProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(cachedProjects[0].id);
      }
    } else {
      // Reset state on close
      setSelectedFile(null);
      setAuditReport(null);
      setValidatedTrial(null);
      setErrorMessage(null);
      setIsProcessing(false);
      setDragActive(false);
    }
  }, [open, isGuest, cachedProjects, selectedProjectId]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isProcessing, isSaving, onClose]);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const { trial, report } = await processSafeTrialImportFile(file);
      setValidatedTrial(trial);
      setAuditReport(report);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse and sanitize file.');
      setValidatedTrial(null);
      setAuditReport(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleCommitImport = () => {
    if (!validatedTrial) return;

    if (isGuest || targetDestination === 'LOCAL') {
      // Mount directly in client Zustand store
      const localTrialDoc: TrialDocument = {
        id: validatedTrial.id,
        title: validatedTrial.title,
        content: validatedTrial.content,
        status: 'DRAFT',
        metadata: validatedTrial.metadata,
        createdAt: validatedTrial.createdAt,
        updatedAt: validatedTrial.updatedAt,
      };

      const newSummary: TrialSummaryItem = {
        id: validatedTrial.id,
        title: validatedTrial.title,
        status: 'DRAFT',
        updatedAt: validatedTrial.updatedAt,
        createdAt: validatedTrial.createdAt,
        projectId: 'local',
        metadata: validatedTrial.metadata,
      };

      addLocalTrial(localTrialDoc);
      setCachedTrials([newSummary, ...cachedTrials.filter((t) => t.id !== validatedTrial.id)]);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('inquestra:trial-imported', {
            detail: { trial: newSummary, doc: localTrialDoc },
          })
        );
      }

      onClose();
      return;
    }

    // Authenticated cloud import
    startTransition(async () => {
      try {
        const targetProj = selectedProjectId && selectedProjectId !== 'ALL' ? selectedProjectId : null;
        const newTrial = await createNewTrial(targetProj, null, {
          title: validatedTrial.title,
          content: validatedTrial.content,
          metadata: validatedTrial.metadata.map((m) => ({ key: m.key, value: m.value })),
        });

        // Update client store to immediately display the cloud trial
        const cloudDoc: TrialDocument = {
          id: newTrial.id,
          title: newTrial.title,
          content: newTrial.content as Record<string, unknown>,
          status: newTrial.status as import('@/types/inquestra').TrialStatus,
          metadata: (newTrial.metadata ?? []).map((m: { id: string; key: string; value: string }) => ({
            id: m.id,
            key: m.key,
            value: m.value,
          })),
          createdAt: new Date(newTrial.createdAt).toISOString(),
          updatedAt: new Date(newTrial.updatedAt).toISOString(),
        };

        const newSummary: TrialSummaryItem = {
          id: newTrial.id,
          title: newTrial.title,
          status: newTrial.status as import('@/types/inquestra').TrialStatus,
          updatedAt: newTrial.updatedAt,
          createdAt: newTrial.createdAt,
          projectId: newTrial.projectId || undefined,
          metadata: cloudDoc.metadata,
        };

        setCachedTrials([newSummary, ...cachedTrials.filter((t) => t.id !== newTrial.id)]);
        setActiveTrial(cloudDoc);
        setCloudIds({
          cloudTrialId: newTrial.id,
          cloudProjectId: newTrial.projectId || '',
        });
        setSaveStatus('SAVED');

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('inquestra:trial-imported', {
              detail: { trial: newSummary, doc: cloudDoc },
            })
          );
        }

        onClose();
      } catch (err) {
        console.warn('Cloud import creation rejected, falling back to local notebook mount:', err);
        const fallbackLocalDoc: TrialDocument = {
          id: validatedTrial.id,
          title: validatedTrial.title,
          content: validatedTrial.content,
          status: 'DRAFT',
          metadata: validatedTrial.metadata,
          createdAt: validatedTrial.createdAt,
          updatedAt: validatedTrial.updatedAt,
        };
        const fallbackSummary: TrialSummaryItem = {
          id: validatedTrial.id,
          title: validatedTrial.title,
          status: 'DRAFT',
          updatedAt: validatedTrial.updatedAt,
          createdAt: validatedTrial.createdAt,
          projectId: 'local',
          metadata: validatedTrial.metadata,
        };
        addLocalTrial(fallbackLocalDoc);
        setCachedTrials([fallbackSummary, ...cachedTrials.filter((t) => t.id !== validatedTrial.id)]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('inquestra:trial-imported', {
              detail: { trial: fallbackSummary, doc: fallbackLocalDoc },
            })
          );
        }
        onClose();
      }
    });
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-trial-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing && !isSaving) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] my-auto flex flex-col rounded-xl border border-border bg-background shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 id="import-trial-title" className="text-base font-semibold text-foreground">
                Import Trial & Research Notes
              </h2>
              <p className="text-xs text-muted-foreground">
                Re-import previously exported Inquestra <code className="text-foreground font-mono">trial.json</code> or <code className="text-foreground font-mono">.zip</code> archives.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing || isSaving}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* File Dropzone */}
          {!validatedTrial && (
            <div
              role="button"
              tabIndex={0}
              aria-label="Browse or drop an Inquestra trial.json or zip export archive"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-primary bg-primary/5 scale-[0.99]'
                  : 'border-border/80 hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.zip"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />

              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-medium text-foreground">
                    Performing zero-trust security scan…
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Inspecting AST, validating extensions, and sanitizing inputs
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted/80 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                    <Archive className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Click to browse or drop an export archive here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Accepts <span className="font-mono text-foreground font-medium">trial.json</span> or Inquestra <span className="font-mono text-foreground font-medium">.zip</span> archives (restores protocol notes, reagents, and structures)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs leading-relaxed">
                <span className="font-semibold block text-sm">Security or Ingestion Error</span>
                <p className="mt-0.5">{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setErrorMessage(null);
                    setValidatedTrial(null);
                    setAuditReport(null);
                  }}
                  className="mt-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
                >
                  Select another file
                </button>
              </div>
            </div>
          )}

          {/* Validation & Audit Report */}
          {validatedTrial && auditReport && (
            <div className="space-y-4">
              {/* File Info Header */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card/60">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {validatedTrial.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Source: {selectedFile?.name} ({((selectedFile?.size || 0) / 1024).toFixed(1)} KB) • {validatedTrial.nodeCount} document nodes
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setValidatedTrial(null);
                    setAuditReport(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
                >
                  Change
                </button>
              </div>

              {/* Security Audit Checklist */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Security & Integrity Audit Passed</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>No executable, PHP, or shell payloads</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Zip-Slip & path traversal verified safe</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Prompt-injection tokens neutralized</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>TipTap AST whitelisted & DOMPurified</span>
                  </div>
                </div>
                <div className="border-t border-emerald-500/15 pt-2 text-[11px] text-muted-foreground">
                  <strong>Data Provenance Rule:</strong> Imported as a clean <span className="text-foreground font-semibold">DRAFT</span>. Any previous signatures are preserved as read-only historical notes, and previous cryptographic seals are reset.
                </div>
              </div>

              {/* Destination Selector (if authenticated) */}
              {!isGuest && cachedProjects.length > 0 && (
                <div className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
                  <label className="text-xs font-semibold text-foreground block">
                    Choose Destination Workspace:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTargetDestination('CLOUD')}
                      className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                        targetDestination === 'CLOUD'
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Database className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-foreground">Save to Cloud Project</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Persists in PostgreSQL under your organization
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetDestination('LOCAL')}
                      className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                        targetDestination === 'LOCAL'
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Laptop className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-foreground">Local Notebook Draft</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Mounts instantly in local browser storage
                        </div>
                      </div>
                    </button>
                  </div>

                  {targetDestination === 'CLOUD' && (
                    <div className="pt-2">
                      <label htmlFor="import-project-select" className="text-[11px] font-medium text-muted-foreground block mb-1.5">
                        Assign to Project:
                      </label>
                      <select
                        id="import-project-select"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {cachedProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Workspace Safety Clarification */}
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="leading-relaxed">
                  <strong>Safe Workspace Import:</strong> Your existing experiments remain saved in your sidebar. The imported trial will open immediately in your canvas as a new editable draft.
                </span>
              </div>
            </div>
          )}

          {/* Security Notice Footer */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/60 bg-muted/20 text-[11px] text-muted-foreground">
            <FolderLock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span>
              All imported content is evaluated in memory before writing to storage. Foreign tenant IDs and database access keys are discarded.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-card/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing || isSaving}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCommitImport}
            disabled={!validatedTrial || isProcessing || isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Importing…</span>
              </>
            ) : (
              <>
                <span>Mount Trial in Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
