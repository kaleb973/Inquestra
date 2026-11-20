'use client';

import { useState, useTransition } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Unlock, RotateCcw, AlertTriangle, Check, FileCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProvenanceInteractiveDemo() {
  const [isTampered, setIsTampered] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Deterministic SHA-256 computed over the trial payload fields shown below:
  // sha256("trial_PR-2026-PCR-01|reagent=dATP_DA-9820-C|operator=KH|timestamp=2026-11-19T22:00:00Z|anneal_temp=58.400")
  const originalTemp = '58.400';
  const originalReagent = '2\'-Deoxyadenosine 5\'-triphosphate (Lot #DA-9820-C)';
  const originalHash = '1cfa3f0f0064c27d6cb034f4166e559daa8a07edc944ae590ff3b6d3e10f5d9e';
  const tamperedHash = '45d4b413425a690cb8e32ac5a941b6c659512590391cf8dee545e8c3aad836c5';

  const currentTemp = isTampered ? '58.401' : originalTemp;
  const currentHash = isTampered ? tamperedHash : originalHash;

  return (
    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden text-left">
      {/* Top Header */}
      <div className="px-5 py-3.5 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          {isTampered ? (
            <ShieldAlert className="w-4 h-4 text-critical animate-pulse" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-phosphor" />
          )}
          <span className="font-semibold text-foreground">
            {isTampered ? 'INTEGRITY VIOLATION DETECTED' : 'EXPERIMENT AUDIT TRAIL & HASH VERIFICATION'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[11px]">Integrity Check:</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
              isTampered
                ? 'bg-critical/15 text-critical border border-critical/30'
                : 'bg-phosphor/15 text-phosphor border border-phosphor/30'
            )}
          >
            {isTampered ? 'Digest Mismatch' : 'Record Locked & Verified'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-6 bg-background">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-semibold text-foreground font-sans">
              Test Tamper-Evident SHA-256 Verification
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
              When an experiment concludes, Inquestra computes a SHA-256 cryptographic digest across the protocol notes, material lot numbers, and logged instrument readings.
              Modify a recorded value below to test how any post-sealing alteration causes an immediate checksum mismatch.
            </p>
          </div>

          {/* Interactive Tamper Toggle Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                startTransition(() => {
                  setIsTampered(!isTampered);
                });
              }}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded text-xs font-semibold transition-all cursor-pointer',
                isTampered
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'bg-critical/10 text-critical border border-critical/30 hover:bg-critical/20'
              )}
            >
              {isTampered ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Original Record</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Simulate 0.001 °C Value Modification</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Data Inspection Box */}
        <div className="grid md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Trial State */}
          <div className="p-4 rounded-lg border border-border bg-card space-y-3">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold border-b border-border pb-2 flex justify-between items-center">
              <span>Trial: PR-2026-PCR-01</span>
              <span className="text-[10px] text-muted-foreground font-normal">Lab Database / Archive</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Logged Annealing Temperature:</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded font-bold transition-colors',
                    isTampered
                      ? 'bg-critical/20 text-critical border border-critical/40 line-through'
                      : 'text-foreground bg-muted/40'
                  )}
                >
                  {originalTemp} °C
                </span>
              </div>

              {isTampered && (
                <div className="flex justify-between items-center text-critical">
                  <span className="font-semibold">Modified Parameter Value:</span>
                  <span className="bg-critical/20 px-2 py-0.5 rounded font-bold border border-critical/40">
                    {currentTemp} °C (+0.001 °C)
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Reagent Batch Lot:</span>
                <span className="text-foreground text-[11px] truncate max-w-[200px]" title={originalReagent}>{originalReagent}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Author Attestation:</span>
                <span className="text-foreground">KH (Bench Operator)</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Ledger State */}
          <div className="p-4 rounded-lg border border-border bg-card space-y-3">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold border-b border-border pb-2 flex justify-between items-center">
              <span>Sealed Digest Verification</span>
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.2 rounded',
                  isTampered ? 'text-critical' : 'text-phosphor'
                )}
              >
                {isTampered ? 'FAIL: HASH MISMATCH' : 'PASS: AUTHENTIC'}
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[11px] text-muted-foreground block mb-1">
                  Stored Digest in Sealed Audit Certificate:
                </span>
                <div className="bg-muted/40 p-2 rounded text-[10px] text-foreground truncate select-all">
                  {originalHash}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block mb-1">
                  Recomputed Checksum of Record Content:
                </span>
                <div
                  className={cn(
                    'p-2 rounded text-[10px] truncate select-all border transition-colors',
                    isTampered
                      ? 'bg-critical/10 text-critical border-critical/40 font-bold'
                      : 'bg-muted/40 text-phosphor border-transparent'
                  )}
                >
                  {currentHash}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Explainer Message */}
        <div
          className={cn(
            'p-3.5 rounded-lg border text-xs leading-relaxed transition-colors flex items-start gap-3',
            isTampered
              ? 'bg-critical/10 border-critical/30 text-critical'
              : 'bg-muted/30 border-border text-muted-foreground'
          )}
        >
          {isTampered ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-critical mt-0.5" />
          ) : (
            <FileCheck className="w-4 h-4 shrink-0 text-phosphor mt-0.5" />
          )}
          <div>
            {isTampered ? (
              <p>
                <strong>Checksum Mismatch:</strong> Because a recorded protocol value was altered post-sealing,
                the recomputed SHA-256 digest diverges from the timestamped certificate. Inquestra detects the
                modification and flags the record to prevent silent post-hoc tampering.
              </p>
            ) : (
              <p>
                <strong>Tamper-Evident Verification:</strong> Once an experiment is sealed,
                all protocol text, instrument logs, and reagent lot deductions are locked under a SHA-256 digest.
                Any institutional auditor, collaborator, or peer-review journal can verify record integrity using standard command-line tools.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
