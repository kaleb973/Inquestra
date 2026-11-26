'use client';
// src/components/trials/SealConfirmationModal.tsx
// Two-step verification modal for cryptographic experiment sealing.
// Prevents accidental single-click sealing and ensures deliberate regulatory sign-off.

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, AlertTriangle, X, Loader2, Lock } from 'lucide-react';

interface SealConfirmationModalProps {
  trialTitle: string;
  isOpen: boolean;
  isSealing: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function SealConfirmationModal({
  trialTitle,
  isOpen,
  isSealing,
  error,
  onClose,
  onConfirm,
}: SealConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset input when modal closes and allow Escape to dismiss when idle
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSealing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSealing, onClose]);

  if (!isOpen || !mounted) return null;

  const isConfirmed = confirmText.trim() === 'SEAL';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => e.target === e.currentTarget && !isSealing && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="seal-confirmation-title"
        className="relative w-full max-w-md my-auto bg-card border border-destructive/40 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 shrink-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-destructive/10">
          <div id="seal-confirmation-title" className="flex items-center gap-2.5 text-destructive font-semibold text-sm">
            <Shield className="w-4 h-4" />
            <span>Seal Experiment Permanently</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSealing}
            aria-label="Close seal confirmation dialog"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs leading-relaxed animate-in fade-in-50">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Cryptographic Provenance Lock</p>
              <p className="leading-relaxed text-[11px]">
                Sealing is <strong>strictly permanent and irreversible</strong>. A cryptographic SHA-256 hash will be generated. All further editing, status transitions, and data modifications will be locked.
              </p>
            </div>
          </div>

          <div className="space-y-1 bg-muted/40 p-3 rounded-lg border border-border/60">
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Experiment Title</span>
            <p className="font-semibold text-foreground text-sm truncate">{trialTitle}</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <label htmlFor="seal-confirm-input" className="block text-muted-foreground text-xs">
              To confirm, type <span className="font-mono font-bold text-foreground">SEAL</span> in capital letters below:
            </label>
            <input
              id="seal-confirm-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SEAL"
              disabled={isSealing}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-destructive transition-colors"
              autoFocus
            />
            <div className="flex items-center justify-between text-[11px] pt-1">
              {confirmText.length === 0 ? (
                <span className="text-muted-foreground font-mono">Case-sensitive: type &quot;SEAL&quot;</span>
              ) : confirmText === 'SEAL' ? (
                <span className="text-emerald-500 font-mono font-medium flex items-center gap-1">
                  ✓ Confirmation verified
                </span>
              ) : confirmText.toLowerCase() === 'seal' ? (
                <span className="text-amber-500 font-mono">
                  Must be capital letters: type &quot;SEAL&quot;
                </span>
              ) : (
                <span className="text-destructive font-mono">
                  Text must match &quot;SEAL&quot;
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-5 py-4 bg-muted/30 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isSealing}
            className="flex-1 px-3 py-2 rounded text-xs font-medium border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isConfirmed || isSealing}
            className="flex-1 px-3 py-2 rounded text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
          >
            {isSealing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            {isSealing ? 'Sealing...' : 'Seal Experiment'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
