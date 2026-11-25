'use client';

import { useState } from 'react';
import {
  FlaskConical,
  Dna,
  Sigma,
  BookOpen,
  Boxes,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Activity,
  Play,
  Pause,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ActiveView = 'canvas' | 'inventory' | 'literature' | 'telemetry' | 'audit';

export function ScientificWorkspacePreview() {
  const [activeView, setActiveView] = useState<ActiveView>('canvas');
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [timerSeconds] = useState<number>(274);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const tabs: { id: ActiveView; label: string; icon: typeof FlaskConical }[] = [
    { id: 'canvas', label: 'Research Canvas', icon: FlaskConical },
    { id: 'inventory', label: 'LIMS & Inventory', icon: Boxes },
    { id: 'literature', label: 'Citations', icon: BookOpen },
    { id: 'telemetry', label: 'Hardware DAQ', icon: Activity },
    { id: 'audit', label: 'Audit & Seals', icon: ShieldCheck },
  ];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden text-left">
      {/* Workspace Instrument Header */}
      <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-phosphor shrink-0" aria-hidden="true" />
          <span className="text-foreground font-semibold">Molecular_Biotech_Core</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">PR-2026-PCR-01</span>
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-background rounded-md border border-border overflow-x-auto no-scrollbar" role="tablist" aria-label="Workspace preview modules">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-phosphor">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Local IndexedDB synced</span>
        </div>
      </div>

      {/* Main Workspace Body (flat hairline seams, zero nested card-in-card) */}
      <div className="p-5 sm:p-6 bg-background min-h-[430px]">
        {activeView === 'canvas' && (
          <div className="space-y-5">
            <div className="border-b border-border pb-4">
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground mb-1.5">
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  Standard Operating Procedure
                </span>
                <span className="font-mono">v2.1</span>
                <span>Molecular Biology Lab</span>
              </div>
              <h3 className="font-sans text-xl font-semibold tracking-tight text-foreground">
                Genomic DNA Extraction and PCR Amplification
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Extract high-purity genomic DNA from HEK293T cells and verify locus amplification by PCR.
              </p>
            </div>

            {/* Section 1: Reagent Deduction */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Phase 1: Cell Lysis and DNA Extraction</span>
                <span className="font-mono text-phosphor">Synced with Lab Inventory</span>
              </div>
              <div className="divide-y divide-border border-y border-border text-xs">
                <div className="flex items-center gap-2.5 py-2.5">
                  <FlaskConical className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-mono text-muted-foreground">Deducted</span>
                  <span className="font-semibold text-foreground">Buffer AL (Lysis Buffer)</span>
                  <span className="font-mono text-muted-foreground">200 µL</span>
                  <span className="ml-auto font-mono text-muted-foreground">Lot #AL-2026-07</span>
                </div>
                <div className="flex items-center gap-2.5 py-2.5">
                  <FlaskConical className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-mono text-muted-foreground">Deducted</span>
                  <span className="font-semibold text-foreground">Proteinase K Solution (20 mg/mL)</span>
                  <span className="font-mono text-muted-foreground">20 µL</span>
                  <span className="ml-auto font-mono text-muted-foreground">Lot #PK-5091-B</span>
                </div>
              </div>
            </div>

            {/* Section 2: Incubation Timer */}
            <div className="py-3.5 px-4 bg-muted/40 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <span className="w-5 h-5 rounded bg-primary/15 text-primary inline-flex items-center justify-center font-mono font-semibold">
                    2
                  </span>
                  <span>Lysis Incubation at 56 °C</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                  Incubate lysate at 56 °C with vortex mixing every 5 minutes for complete digestion.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 pl-7 sm:pl-0">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-background border border-border font-mono text-sm">
                  <Clock className="w-4 h-4 text-phosphor" />
                  <span className="font-semibold text-foreground num">{formatTime(timerSeconds)}</span>
                  <span className="text-xs text-muted-foreground">left</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  aria-label={timerRunning ? 'Pause incubation timer' : 'Resume incubation timer'}
                  className="p-2 rounded border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-phosphor" />}
                </button>
              </div>
            </div>

            {/* Section 3: Molecular & Thermocycling Strip */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border border-y border-border">
              <div className="py-3.5 md:pr-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <FlaskConical className="w-3.5 h-3.5 text-primary" />
                    PCR Substrate (dATP)
                  </span>
                  <span className="font-mono text-muted-foreground">CID 65069</span>
                </div>
                <div className="text-xs font-medium text-foreground">2&apos;-Deoxyadenosine 5&apos;-Triphosphate</div>
                <div className="text-xs font-mono text-muted-foreground truncate">
                  SMILES: C1C(C(OC1N2C=NC3=C(N=CN=C32)N)COP(=O)...
                </div>
              </div>

              <div className="py-3.5 md:pl-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Sigma className="w-3.5 h-3.5 text-primary" />
                    Thermocycler Program
                  </span>
                  <span className="font-mono text-muted-foreground">35 cycles</span>
                </div>
                <div className="font-mono text-sm text-foreground font-semibold">
                  95 °C (Denature) / 60 °C (Anneal) / 72 °C (Extend)
                </div>
                <div className="text-xs text-muted-foreground">Working concentration: 200 µM in 1X master mix</div>
              </div>
            </div>

            {/* Section 4: Primer Sequence */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Dna className="w-3.5 h-3.5 text-primary" />
                  Forward Primer: GAPDH (Housekeeping Control)
                </span>
                <span className="font-mono text-muted-foreground">22 bp, GC 52.4%, Tm 58.9 °C</span>
              </div>
              <div className="bg-muted/35 rounded-md p-2.5 font-mono text-xs flex flex-wrap gap-1">
                {['5\'-', 'G', 'T', 'C', 'T', 'C', 'C', 'T', 'C', 'T', 'G', 'A', 'C', 'T', 'T', 'C', 'A', 'A', 'C', 'A', 'G', 'C', 'G', '-3\''].map((ch, i) => (
                  <span
                    key={i}
                    className={cn(
                      'px-1 py-0.5 rounded text-xs font-semibold',
                      ch === 'A' && 'bg-phosphor/15 text-phosphor',
                      ch === 'T' && 'bg-critical/15 text-critical',
                      ch === 'G' && 'bg-caution/15 text-caution',
                      ch === 'C' && 'bg-primary/15 text-primary',
                      (ch.includes('\'') || ch.includes('-')) && 'text-muted-foreground font-normal'
                    )}
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'inventory' && (
          <div className="space-y-5">
            <div className="border-b border-border pb-3.5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Laboratory Reagents and Consumables</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time stock tracking with lot numbers, storage shelves, and protocol deductions.
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-muted text-foreground">
                142 active lots
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="py-2.5 pr-4 font-medium">Catalog Item</th>
                    <th className="py-2.5 px-3 font-medium">Lot Number</th>
                    <th className="py-2.5 px-3 font-medium">Location</th>
                    <th className="py-2.5 px-3 font-medium">Available Stock</th>
                    <th className="py-2.5 pl-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted-foreground font-mono">
                  <tr>
                    <td className="py-3 pr-4 font-sans font-semibold text-foreground">Tris-EDTA Buffer (TE, pH 8.0)</td>
                    <td className="py-3 px-3">#TE-2026-012</td>
                    <td className="py-3 px-3 font-sans">Cold Room 4 °C, Shelf 1</td>
                    <td className="py-3 px-3 text-foreground">500 mL</td>
                    <td className="py-3 pl-3 text-phosphor">Active</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-sans font-semibold text-foreground">Proteinase K Solution (20 mg/mL)</td>
                    <td className="py-3 px-3">#PK-5091-B</td>
                    <td className="py-3 px-3 font-sans">-20 °C Freezer Box 3</td>
                    <td className="py-3 px-3 text-foreground">1.0 mL</td>
                    <td className="py-3 pl-3 text-phosphor">Active</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-sans font-semibold text-foreground">dNTP Mix (10 mM each)</td>
                    <td className="py-3 px-3">#DN-4401-X</td>
                    <td className="py-3 px-3 font-sans">-20 °C Freezer Box 1</td>
                    <td className="py-3 px-3 text-foreground">200 µL</td>
                    <td className="py-3 pl-3 text-phosphor">Verified</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-sans font-semibold text-foreground">Taq DNA Polymerase (5 U/µL)</td>
                    <td className="py-3 px-3">#TQ-1092-C</td>
                    <td className="py-3 px-3 font-sans">-20 °C Freezer Box 1</td>
                    <td className="py-3 px-3 text-foreground">250 U</td>
                    <td className="py-3 pl-3 text-phosphor">Cleared</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'literature' && (
          <div className="space-y-5">
            <div className="border-b border-border pb-3.5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Integrated Literature and DOI Citations</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Query PubMed, Europe PMC, and arXiv directly from protocol notes.
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-phosphor/10 text-phosphor">
                Europe PMC &amp; PubMed connected
              </span>
            </div>

            <div className="divide-y divide-border">
              <div className="py-4 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                  <span className="text-primary font-semibold">Science (1988)</span>
                  <span className="font-mono text-muted-foreground">PMID 2448875, DOI 10.1126/science.2448875</span>
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  Primer-directed enzymatic amplification of DNA with a thermostable DNA polymerase
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Demonstrates automated amplification kinetics using Thermus aquaticus polymerase across 30 thermal cycles.
                </p>
              </div>
              <div className="py-4 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                  <span className="text-primary font-semibold">Clinical Chemistry (2009)</span>
                  <span className="font-mono text-muted-foreground">PMID 19246619, DOI 10.1373/clinchem.2008.112797</span>
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  The MIQE Guidelines: Minimum Information for Publication of Quantitative Real-Time PCR Experiments
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Reporting framework for primer specificity, annealing temperature tolerance, and extraction yield.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'telemetry' && (
          <div className="space-y-5">
            <div className="border-b border-border pb-3.5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Bench Instrument and Sensor Acquisition</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Direct W3C Web Serial streaming for thermal cyclers, balances, probes, and custom DAQ hardware.
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-primary/10 text-primary">
                5 Hz Live Telemetry
              </span>
            </div>

            <div className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-7 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-muted-foreground">Channel 01: Peltier Block Temp (°C)</span>
                  <span className="text-phosphor font-semibold">±0.08 °C stability</span>
                </div>
                <div className="h-36 w-full bg-graphite rounded-md relative flex items-end p-2.5 gap-1 overflow-hidden">
                  {[95, 95, 95, 58, 58, 58, 58, 72, 72, 72, 95, 95, 95, 58, 58, 58, 58, 72, 72, 72, 95, 95, 95, 58, 58, 58, 58, 72, 72].map((temp, idx) => (
                    <div key={idx} className="flex-1 bg-phosphor/85 rounded-t-sm" style={{ height: `${(temp / 100) * 100}%` }} title={`${temp} °C`} />
                  ))}
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  Cycle 18/35: 72.0 °C Extension
                </div>
              </div>

              <div className="md:col-span-5 space-y-3 text-xs">
                <div className="font-semibold text-foreground">Serial Port Configuration</div>
                <div className="p-3 rounded-md bg-muted/40 font-mono space-y-1.5 text-muted-foreground">
                  <div>Port: /dev/ttyACM0 (USB CDC)</div>
                  <div>Baud: 115,200</div>
                  <div>Device: OpenPCR Peltier PID</div>
                  <div className="text-phosphor">Status: Streaming to trial</div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Sensor sweeps append straight into your notebook record without external logger software.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'audit' && (
          <div className="space-y-5">
            <div className="border-b border-border pb-3.5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Immutable Audit Trail and Verification</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Append-only revision snapshots and SHA-256 record sealing.
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-phosphor/10 text-phosphor">
                Sealed and Validated
              </span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Record Digest (SHA-256)</span>
                  <span className="text-phosphor">ISO 8601 UTC timestamped</span>
                </div>
                <div className="p-2.5 rounded bg-muted/50 text-foreground truncate select-all">
                  1cfa3f0f0064c27d6cb034f4166e559daa8a07edc944ae590ff3b6d3e10f5d9e
                </div>
              </div>

              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border border-y border-border">
                <div className="py-3 sm:pr-4 space-y-1">
                  <div className="font-sans text-muted-foreground">Author Signature</div>
                  <div className="font-semibold text-foreground">KH, Protocol Author</div>
                  <div className="text-phosphor">Verified: Execution signed</div>
                </div>
                <div className="py-3 sm:pl-4 space-y-1">
                  <div className="font-sans text-muted-foreground">PI Reviewer Signature</div>
                  <div className="font-semibold text-foreground">PI Reviewer, Lab Lead</div>
                  <div className="text-phosphor">Verified: Dual-attestation sealed</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Telemetry Line */}
      <div className="px-5 py-2.5 bg-muted/40 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted-foreground">
        <span>Trial PR-2026-PCR-01, 5 Hz Peltier Block Log</span>
        <span className="text-foreground">Local workspace draft</span>
      </div>
    </div>
  );
}
