'use client';
// src/components/admin/LabSettings.tsx

import { useState, useTransition } from 'react';
import { updateStrictMode } from '@/actions/adminActions';
import { Loader2, ShieldCheck, ShieldAlert, Check, X, AlertTriangle, Cpu, Box, FileText, Lock } from 'lucide-react';
import type { Organization } from '@prisma/client';
import { SecuritySettings } from '@/components/admin/SecuritySettings';

export function LabSettings({ org }: { org: Organization }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateStrictMode(!org.strictMode);
      if (!res.success) setError(res.error || 'Failed to update strict mode');
    });
  };

  const isStrict = !!org.strictMode;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Main Mode Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/60 bg-muted/40">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {isStrict ? (
                <ShieldCheck className="w-5 h-5 text-foreground" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-muted-foreground" />
              )}
              <h2 className="text-lg font-semibold text-foreground">Compliance & Governance Policy</h2>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${
                isStrict 
                  ? 'bg-muted text-foreground border-border' 
                  : 'bg-muted text-muted-foreground border-border'
              }`}>
                {isStrict ? 'Strict Mode (GLP / Audit Locked)' : 'Flexible Bench Mode'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Configure how Inquestra enforces inventory overdrafts, chemical registration, and instrument calibration across your organization.
            </p>
          </div>

          {/* Master Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-medium text-foreground">
              {isStrict ? 'Strict Enforcement Active' : 'Flexible Discovery Active'}
            </span>
            <button
              onClick={handleToggle}
              disabled={isPending}
              aria-label="Toggle Strict Compliance Mode"
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                isStrict ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              {isPending ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                </span>
              ) : (
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isStrict ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="m-5 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded">
            {error}
          </div>
        )}

        {/* Feature Comparison Matrix */}
        <div className="p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Side-by-Side Policy Comparison
          </h3>

          <div className="border border-border rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 bg-muted/40 font-semibold border-b border-border text-foreground">
              <div className="p-3">Function / Dimension</div>
              <div className="p-3 border-l border-border bg-muted/20">Flexible Mode (Off)</div>
              <div className="p-3 border-l border-border bg-muted text-indigo-700 dark:text-indigo-200">Strict Compliance Mode (On)</div>
            </div>

            {/* Row 1: Inventory Overdraft */}
            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border/50 hover:bg-muted/20 transition-colors">
              <div className="p-3 flex items-start gap-2 font-medium text-foreground">
                <Box className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <div>Inventory Overdrafts</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Deducting more quantity than is in stock</div>
                </div>
              </div>
              <div className="p-3 border-l border-border/50 text-foreground">
                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mb-1">
                  <Check className="w-3.5 h-3.5" /> Allowed (Deficit Logged)
                </span>
                Stock balance goes negative (e.g. <code className="font-mono text-[10px] text-amber-600 dark:text-amber-300">-3 mL</code>). Scientist is not blocked at the bench; lab manager is alerted.
              </div>
              <div className="p-3 border-l border-border/50 text-foreground bg-muted/50">
                <span className="text-foreground font-medium flex items-center gap-1 mb-1">
                  <Lock className="w-3.5 h-3.5" /> Hard Block (Zero Overdraft)
                </span>
                Deduction is strictly rejected. Scientists cannot consume more physical material than what has been verified and logged into inventory.
              </div>
            </div>

            {/* Row 2: Uncataloged Materials */}
            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border/50 hover:bg-muted/20 transition-colors">
              <div className="p-3 flex items-start gap-2 font-medium text-foreground">
                <FileText className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <div>Uncataloged Reagents</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Using a chemical not in database</div>
                </div>
              </div>
              <div className="p-3 border-l border-border/50 text-foreground">
                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mb-1">
                  <Check className="w-3.5 h-3.5" /> Auto-Created with Warning
                </span>
                Item is automatically created on the fly with negative stock so experimental notes can be saved without delay.
              </div>
              <div className="p-3 border-l border-border/50 text-foreground bg-muted/50">
                <span className="text-foreground font-medium flex items-center gap-1 mb-1">
                  <Lock className="w-3.5 h-3.5" /> Hard Block (Must be Registered)
                </span>
                Reagents must be pre-cataloged with lot numbers and physical storage locations before they can be used in any experiment.
              </div>
            </div>

            {/* Row 3: Instrument Calibration */}
            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border/50 hover:bg-muted/20 transition-colors">
              <div className="p-3 flex items-start gap-2 font-medium text-foreground">
                <Cpu className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <div>Hardware & Sensor DAQ</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Overdue or uncalibrated devices</div>
                </div>
              </div>
              <div className="p-3 border-l border-border/50 text-foreground">
                <span className="text-foreground font-medium flex items-center gap-1 mb-1">
                  Warning Tags Only
                </span>
                Telemetry streams are tagged with calibration warnings, but live DAQ ingestion continues unimpeded.
              </div>
              <div className="p-3 border-l border-border/50 text-foreground bg-muted/50">
                <span className="text-foreground font-medium flex items-center gap-1 mb-1">
                  <Lock className="w-3.5 h-3.5" /> DAQ Hardware Gate
                </span>
                Serial port data acquisition is locked if connected instrument is marked <span className="font-mono text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1 py-0.5 rounded border border-amber-500/30">NEEDS_CALIBRATION</span> or <span className="font-mono text-[9px] bg-red-500/10 text-red-700 dark:text-red-300 px-1 py-0.5 rounded border border-red-500/30">BROKEN</span>.
              </div>
            </div>

            {/* Row 4: Audit Trail */}
            <div className="grid grid-cols-1 md:grid-cols-3 hover:bg-muted/20 transition-colors">
              <div className="p-3 flex items-start gap-2 font-medium text-foreground">
                <ShieldAlert className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <div>Immutable Audit Trail</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Regulatory inspection readiness</div>
                </div>
              </div>
              <div className="p-3 border-l border-border/50 text-foreground">
                Standard audit events recorded for user accountability.
              </div>
              <div className="p-3 border-l border-border/50 text-foreground bg-muted/50">
                Full regulatory audit trail with cryptographic trial sealing and strict discrepancy prevention.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Practical Guidance Box */}
      <div className="p-5 bg-background/50 border border-border rounded-xl space-y-3">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Which mode should my lab use?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground leading-relaxed">
          <div className="p-3 bg-muted/40 border border-border/60 rounded-lg">
            <span className="text-foreground font-medium block mb-1">Choose Flexible Mode if:</span>
            You are an early-stage research lab, university group, or discovery incubator where moving fast at the bench is prioritized and lab members frequently introduce novel chemicals before logging them in digital inventory.
          </div>
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 rounded-lg">
            <span className="text-foreground font-medium block mb-1">Choose Strict Mode if:</span>
            You are operating in regulated biopharma, translational research, or pre-clinical safety studies where internal SOPs require immutable material verification and zero unverified chemical usage.
          </div>
        </div>
      </div>

      {/* Security / 2FA */}
      <SecuritySettings />
    </div>
  );
}
