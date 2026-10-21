'use client';

import { useState, useTransition } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Unlock, RotateCcw, AlertTriangle, Check, FileCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProvenanceInteractiveDemo() {
  const [isTampered, setIsTampered] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Authentic original baseline data
  const originalVoltage = '1.4820';
  const originalReagent = 'Lot #KR-2026-99';
  const originalHash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
  const tamperedHash = '3a710bc8d910a95e26b1584c01289fe204859a1c8762f790c37bb18429fa014e';

  const currentVoltage = isTampered ? '1.4821' : originalVoltage;
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
            {isTampered ? 'INTEGRITY VIOLATION DETECTED' : 'CRYPTOGRAPHIC TRIAL PROVENANCE'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[11px]">Audit Engine:</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
              isTampered
                ? 'bg-critical/15 text-critical border border-critical/30'
                : 'bg-phosphor/15 text-phosphor border border-phosphor/30'
            )}
          >
            {isTampered ? 'Digest Mismatch' : 'Deterministic Seal Active'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-6 bg-background">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-semibold text-foreground font-sans">
              Test Tamper-Evident SHA-256 Binding
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Inquestra computes a cryptographic hash over the raw telemetry packet array and the protocol notebook.
              Modify a single digit to observe how cryptographic verification instantly detects unauthorized post-hoc alterations.
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
                  <span>Restore Original Baseline</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Simulate 0.0001 mV Alteration</span>
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
              <span>Trial Payload #TR-8841-BME</span>
              <span className="text-[10px] text-muted-foreground font-normal">IndexedDB / Cloud</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Recorded Peak Biopotential:</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded font-bold transition-colors',
                    isTampered
                      ? 'bg-critical/20 text-critical border border-critical/40 line-through'
                      : 'text-foreground bg-muted/40'
                  )}
                >
                  {originalVoltage} mV
                </span>
              </div>

              {isTampered && (
                <div className="flex justify-between items-center text-critical">
                  <span className="font-semibold">Modified Telemetry Sample:</span>
                  <span className="bg-critical/20 px-2 py-0.5 rounded font-bold border border-critical/40">
                    {currentVoltage} mV (+0.0001 mV)
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Reagent Batch Lot:</span>
                <span className="text-foreground">{originalReagent}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Lead Author Attestation:</span>
                <span className="text-foreground">Instrument Operator [ID: OP-33]</span>
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
                  Stored Seal in Immutable Audit Ledger:
                </span>
                <div className="bg-muted/40 p-2 rounded text-[10px] text-foreground truncate select-all">
                  {originalHash}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block mb-1">
                  Recomputed Checksum of Current Record:
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
                <strong>Audit Warning § 11.10(b):</strong> Because the telemetry buffer was modified after sealing,
                the recomputed SHA-256 digest diverges from the timestamped signature ledger. Inquestra flags the
                record as corrupted and prevents silent overwrites.
              </p>
            ) : (
              <p>
                <strong>Regulatory Compliance Assurance:</strong> Once a trial is locked by the Principal Investigator,
                all telemetry packets, protocol parameters, and reagent deductions are cryptographically bound.
                Any institutional auditor or peer-review journal can verify record authenticity with standard SHA-256 tooling.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
