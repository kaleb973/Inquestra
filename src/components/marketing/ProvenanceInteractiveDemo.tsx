'use client';

import { useState, useTransition } from 'react';
import { ShieldCheck, ShieldAlert, RotateCcw, AlertTriangle, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProvenanceInteractiveDemo() {
  const [isTampered, setIsTampered] = useState(false);
  const [, startTransition] = useTransition();

  const originalTemp = '58.400';
  const originalReagent = "2'-Deoxyadenosine 5'-triphosphate (Lot #DA-9820-C)";
  const originalHash = '1cfa3f0f0064c27d6cb034f4166e559daa8a07edc944ae590ff3b6d3e10f5d9e';
  const tamperedHash = '45d4b413425a690cb8e32ac5a941b6c659512590391cf8dee545e8c3aad836c5';

  const currentTemp = isTampered ? '58.401' : originalTemp;
  const currentHash = isTampered ? tamperedHash : originalHash;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden text-left">
      <div className="px-5 py-3.5 bg-muted/50 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          {isTampered ? (
            <ShieldAlert className="w-4 h-4 text-critical" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-phosphor" />
          )}
          <span className="font-semibold text-foreground">
            {isTampered ? 'Integrity Violation Detected' : 'Experiment Audit Trail and Hash Verification'}
          </span>
        </div>

        <span
          className={cn(
            'px-2.5 py-0.5 rounded font-medium',
            isTampered
              ? 'bg-critical/15 text-critical'
              : 'bg-phosphor/15 text-phosphor'
          )}
        >
          {isTampered ? 'Digest Mismatch' : 'Record Locked and Verified'}
        </span>
      </div>

      <div className="p-5 sm:p-6 space-y-6 bg-background">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground font-sans">
              Test tamper-evident SHA-256 verification
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Modify a recorded annealing temperature below to see how any post-sealing change triggers an immediate checksum mismatch.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              startTransition(() => {
                setIsTampered(!isTampered);
              });
            }}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px',
              isTampered
                ? 'bg-primary text-primary-foreground hover:opacity-95'
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
                <span>Simulate 0.001 °C Edit</span>
              </>
            )}
          </button>
        </div>

        {/* Hairline split instead of nested card boxes */}
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border border-y border-border font-mono text-xs">
          <div className="py-4 md:pr-6 space-y-3">
            <div className="text-muted-foreground font-sans font-medium flex justify-between items-center pb-2 border-b border-border">
              <span>Trial PR-2026-PCR-01</span>
              <span>Archive Snapshot</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Annealing Temp:</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded font-semibold transition-colors',
                    isTampered ? 'bg-critical/15 text-critical line-through' : 'text-foreground bg-muted/50'
                  )}
                >
                  {originalTemp} °C
                </span>
              </div>

              {isTampered && (
                <div className="flex justify-between items-center gap-2 text-critical">
                  <span className="font-semibold">Tampered Value:</span>
                  <span className="bg-critical/15 px-2 py-0.5 rounded font-semibold">
                    {currentTemp} °C (+0.001 °C)
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Reagent Lot:</span>
                <span className="text-foreground truncate max-w-[220px]" title={originalReagent}>
                  {originalReagent}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Operator:</span>
                <span className="text-foreground">KH (Bench Operator)</span>
              </div>
            </div>
          </div>

          <div className="py-4 md:pl-6 space-y-3">
            <div className="font-sans font-medium flex justify-between items-center pb-2 border-b border-border">
              <span className="text-muted-foreground">Sealed Digest Verification</span>
              <span className={cn('font-mono font-semibold', isTampered ? 'text-critical' : 'text-phosphor')}>
                {isTampered ? 'FAIL: Hash Mismatch' : 'PASS: Authentic'}
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="text-muted-foreground block mb-1">Stored Certificate Digest:</span>
                <div className="bg-muted/40 p-2 rounded text-foreground truncate select-all">
                  {originalHash}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block mb-1">Recomputed Record Digest:</span>
                <div
                  className={cn(
                    'p-2 rounded truncate select-all transition-colors',
                    isTampered ? 'bg-critical/15 text-critical font-semibold' : 'bg-muted/40 text-phosphor'
                  )}
                >
                  {currentHash}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'p-3.5 rounded-md text-xs leading-relaxed transition-colors flex items-start gap-3',
            isTampered ? 'bg-critical/10 text-critical' : 'bg-muted/40 text-muted-foreground'
          )}
        >
          {isTampered ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-critical mt-0.5" />
          ) : (
            <FileCheck className="w-4 h-4 shrink-0 text-phosphor mt-0.5" />
          )}
          {isTampered ? (
            <p>
              <strong>Checksum mismatch:</strong> Altering a sealed field changes the computed SHA-256 digest and flags the record during audit inspection.
            </p>
          ) : (
            <p>
              <strong>Tamper-evident verification:</strong> Protocol text, telemetry arrays, and reagent deductions share one verifiable SHA-256 fingerprint.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
