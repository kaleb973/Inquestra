'use client';

import { useState } from 'react';
import {
  FlaskConical,
  Dna,
  Sigma,
  BookOpen,
  Boxes,
  Cpu,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Lock,
  Barcode,
  Activity,
  FileSpreadsheet,
  Play,
  Pause,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ActiveView = 'canvas' | 'inventory' | 'literature' | 'telemetry' | 'audit';

export function ScientificWorkspacePreview() {
  const [activeView, setActiveView] = useState<ActiveView>('canvas');
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [timerSeconds, setTimerSeconds] = useState<number>(274); // 4m 34s

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden transition-all text-left">
      {/* Workspace App Chrome Bar */}
      <div className="px-4 py-3 bg-muted/60 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Project Breadcrumb */}
        <div className="flex items-center gap-2">
          <span className="w-2 rounded-full h-2 bg-phosphor" />
          <span className="text-foreground font-semibold">Molecular_&amp;_Biotech_Core</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">Protocols</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-mono">PR-2026-PCR-01</span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-background rounded-lg border border-border overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveView('canvas')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              activeView === 'canvas'
                ? 'bg-foreground text-background font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Research Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('inventory')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              activeView === 'inventory'
                ? 'bg-foreground text-background font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>LIMS &amp; Inventory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('literature')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              activeView === 'literature'
                ? 'bg-foreground text-background font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Literature &amp; Citations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('telemetry')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              activeView === 'telemetry'
                ? 'bg-foreground text-background font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Hardware DAQ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('audit')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              activeView === 'audit'
                ? 'bg-foreground text-background font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit &amp; Seals</span>
          </button>
        </div>

        {/* Global Save Status Indicator */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 text-phosphor">
            <CheckCircle2 className="w-3 h-3" />
            <span>Encrypted &amp; Cached</span>
          </span>
          <span className="hidden sm:inline">Cryptographic Audit Trail Active</span>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="p-6 sm:p-8 bg-background min-h-[460px]">
        {/* VIEW 1: THE RESEARCH NOTEBOOK CANVAS */}
        {activeView === 'canvas' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Note Header */}
            <div className="border-b border-border pb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1.5">
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  STANDARD OPERATING PROCEDURE
                </span>
                <span>Version 2.1</span>
                <span>·</span>
                <span>Molecular Biology Lab</span>
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Genomic DNA Extraction &amp; PCR Amplification
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Objective: Extract high-purity genomic DNA from cultured HEK293T cells and confirm target locus amplification by PCR and gel electrophoresis.
              </p>
            </div>

            {/* Canvas Blocks Demonstration */}
            <div className="space-y-4">
              {/* Block 1: Reagent Deduction & Protocol Checklist */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-foreground uppercase tracking-wider">
                    Phase 1: Cell Lysis &amp; DNA Extraction
                  </span>
                  <span className="text-phosphor text-[11px]">Synced with Lab Inventory</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded bg-background border border-border">
                    <FlaskConical className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-mono text-muted-foreground">Deducted:</span>
                    <span className="font-semibold text-foreground">Buffer AL (Lysis Buffer)</span>
                    <span className="text-muted-foreground">· 200 µL</span>
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">Lot #AL-2026-07</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded bg-background border border-border">
                    <FlaskConical className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-mono text-muted-foreground">Deducted:</span>
                    <span className="font-semibold text-foreground">Proteinase K Solution (20 mg/mL)</span>
                    <span className="text-muted-foreground">· 20 µL</span>
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">Lot #PK-5091-B</span>
                  </div>
                </div>
              </div>

              {/* Block 2: Protocol Step with Active Incubation Timer */}
              <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                      2
                    </span>
                    <span className="font-semibold text-foreground uppercase">Lysis Incubation at 56°C</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                    Incubate lysate at 56°C with periodic vortexing every 5 minutes to ensure complete proteinase K digestion.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 pl-7 sm:pl-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border font-mono text-sm">
                    <Clock className="w-4 h-4 text-phosphor animate-pulse" />
                    <span className="font-semibold text-foreground">{formatTime(timerSeconds)}</span>
                    <span className="text-[10px] text-muted-foreground">remaining</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="p-2 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title={timerRunning ? 'Pause timer' : 'Resume timer'}
                  >
                    {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-phosphor" />}
                  </button>
                </div>
              </div>

              {/* Block 3: Molecular Structure & PCR Formula Dual Card */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Molecular Structure Preview */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <FlaskConical className="w-3.5 h-3.5 text-primary" />
                      PCR Substrate (dATP)
                    </span>
                    <span className="text-[10px]">PubChem CID: 65069</span>
                  </div>
                  <div className="bg-background rounded-lg p-3 border border-border text-center">
                    <div className="text-xs font-semibold text-foreground">2&apos;-Deoxyadenosine 5&apos;-Triphosphate</div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                      SMILES: C1C(C(OC1N2C=NC3=C(N=CN=C32)N)COP(=O)...
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground italic bg-muted/30 py-1 px-2 rounded">
                      Working conc.: 200 µM in 1X PCR master mix
                    </div>
                  </div>
                </div>

                {/* PCR Thermocycling Parameters */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Sigma className="w-3.5 h-3.5 text-primary" />
                      Thermocycler Program
                    </span>
                    <span className="text-[10px]">35 cycles · 2h est.</span>
                  </div>
                  <div className="bg-background rounded-lg p-3 border border-border text-center flex flex-col justify-center min-h-[76px]">
                    <div className="font-mono text-sm text-foreground font-semibold">
                      95°C → 60°C → 72°C
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-1">
                      Denaturation · Annealing · Extension
                    </div>
                  </div>
                </div>
              </div>

              {/* Block 4: Biological Sequence Snippet */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Dna className="w-3.5 h-3.5 text-purple-400" />
                    Forward Primer: GAPDH (Housekeeping Control)
                  </span>
                  <span className="text-[10px]">Forward · Tm: 58.9°C</span>
                </div>
                <div className="bg-background rounded-lg p-2.5 border border-border font-mono text-xs flex flex-wrap gap-1">
                  {['5\'-', 'G', 'T', 'C', 'T', 'C', 'C', 'T', 'C', 'T', 'G', 'A', 'C', 'T', 'T', 'C', 'A', 'A', 'C', 'A', 'G', 'C', 'G', '-3\''].map((ch, i) => (
                    <span
                      key={i}
                      className={cn(
                        'px-1 py-0.5 rounded text-[11px] font-bold',
                        ch === 'A' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                        ch === 'T' && 'bg-red-500/15 text-red-600 dark:text-red-400',
                        ch === 'G' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                        ch === 'C' && 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                        (ch.includes('\'') || ch.includes('-')) && 'text-muted-foreground font-normal'
                      )}
                    >
                      {ch}
                    </span>
                  ))}
                  <span className="ml-auto text-[11px] text-muted-foreground self-center">22 bp · GC: 52.4%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: LIMS & LAB INVENTORY */}
        {activeView === 'inventory' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-border pb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Laboratory Reagents &amp; Consumables</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time stock tracking with lot numbers, expiration alarms, and barcode verification.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-muted border border-border text-foreground font-medium">
                  Total Items: 142 Active Lots
                </span>
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-card text-xs font-mono">
              <table className="w-full text-left">
                <thead className="bg-muted/50 border-b border-border uppercase tracking-wider text-[11px] text-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Catalog Item</th>
                    <th className="py-2.5 px-4">Lot Number</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4">Available Stock</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted-foreground">
                  <tr className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-semibold text-foreground">Tris-EDTA Buffer (TE, pH 8.0)</td>
                    <td className="py-3 px-4">#TE-2026-012</td>
                    <td className="py-3 px-4">Cold Room 4°C · Shelf 1</td>
                    <td className="py-3 px-4 text-foreground font-medium">500 mL</td>
                    <td className="py-3 px-4 text-phosphor">Active · Sealed</td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-semibold text-foreground">Proteinase K Solution (20 mg/mL)</td>
                    <td className="py-3 px-4">#PK-5091-B</td>
                    <td className="py-3 px-4">-20°C Freezer Box 3</td>
                    <td className="py-3 px-4 text-foreground font-medium">1.0 mL (aliquoted)</td>
                    <td className="py-3 px-4 text-phosphor">Active</td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-semibold text-foreground">dNTP Mix (10 mM each)</td>
                    <td className="py-3 px-4">#DN-4401-X</td>
                    <td className="py-3 px-4">-20°C Freezer Box 1</td>
                    <td className="py-3 px-4 text-foreground font-medium">200 µL (8 aliquots)</td>
                    <td className="py-3 px-4 text-phosphor">Verified</td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-semibold text-foreground">Taq DNA Polymerase (5 U/µL)</td>
                    <td className="py-3 px-4">#TQ-1092-C</td>
                    <td className="py-3 px-4">-20°C Freezer Box 1</td>
                    <td className="py-3 px-4 text-foreground font-medium">250 U remaining</td>
                    <td className="py-3 px-4 text-phosphor">Quality Cleared</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground uppercase text-[10px] block mb-1">Inline Protocol Deduction</span>
                <p className="text-foreground text-xs leading-relaxed">
                  Typing <code className="bg-muted px-1 py-0.5 rounded text-foreground font-semibold">/reagent</code> in any protocol automatically deducts volumes upon trial execution.
                </p>
              </div>
              <div className="p-3.5 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground uppercase text-[10px] block mb-1">Barcodes &amp; Label Generation</span>
                <p className="text-foreground text-xs leading-relaxed">
                  Print Code-128 and 2D DataMatrix labels for tubes, cryovials, and 96-well culture plates with one click.
                </p>
              </div>
              <div className="p-3.5 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground uppercase text-[10px] block mb-1">Safety &amp; SDS Integration</span>
                <p className="text-foreground text-xs leading-relaxed">
                  GHS hazard pictograms, safety data sheets, and disposal protocols bound to every chemical lot.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: LITERATURE & CITATIONS */}
        {activeView === 'literature' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-border pb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Integrated Literature &amp; DOI Citations</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Query PubMed, Europe PMC, and arXiv directly from your protocol notes without switching windows.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Connected to Europe PMC &amp; PubMed API
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="text-primary font-semibold">Science (1988)</span>
                  <span>PMID: 2448875 · DOI: 10.1126/science.2448875</span>
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  Primer-directed enzymatic amplification of DNA with a thermostable DNA polymerase
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Demonstrates automated amplification kinetics using Thermus aquaticus (Taq) polymerase across 30+ thermal cycles without enzyme replenishment.
                </p>
                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono">
                  <span className="text-phosphor">Cited in Section 1.2: Thermostable Polymerase Kinetics</span>
                  <span className="text-muted-foreground">Direct Markdown Citation: [@Science1988]</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="text-primary font-semibold">Clinical Chemistry (2009)</span>
                  <span>PMID: 19246619 · DOI: 10.1373/clinchem.2008.112797</span>
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  The MIQE Guidelines: Minimum Information for Publication of Quantitative Real-Time PCR Experiments
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Establishes experimental reporting guidelines for target specificity, annealing temperature tolerance, template purity, and extraction yield.
                </p>
                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono">
                  <span className="text-phosphor">Cited in Section 2.4: Primer Specificity &amp; QC Criteria</span>
                  <span className="text-muted-foreground">Direct Markdown Citation: [@ClinChem2009]</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: HARDWARE DAQ & INSTRUMENTATION */}
        {activeView === 'telemetry' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-border pb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Bench Instrument &amp; Sensor Acquisition</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Direct telemetry capture for thermal cyclers, analytical balances, probes, and custom DAQ hardware via browser Web Serial.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                W3C Web Serial API Native
              </span>
            </div>

            <div className="grid md:grid-cols-12 gap-6 bg-card border border-border rounded-xl p-5">
              <div className="md:col-span-7 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-muted-foreground uppercase">Channel 01: Peltier Block Temperature (°C)</span>
                  <span className="text-phosphor font-semibold">5 Hz Live Telemetry</span>
                </div>
                <div className="h-36 w-full bg-background border border-border rounded-lg relative flex items-end p-2 gap-1 overflow-hidden">
                  <div className="absolute inset-0 grid grid-rows-3 grid-cols-6 pointer-events-none opacity-20 border-b border-border">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} className="border-r border-t border-border/40" />
                    ))}
                  </div>
                  {/* PCR 3-step thermal cycle simulation: 95°C Denature, 58°C Anneal, 72°C Extend */}
                  {[95, 95, 95, 58, 58, 58, 58, 72, 72, 72, 95, 95, 95, 58, 58, 58, 58, 72, 72, 72, 95, 95, 95, 58, 58, 58, 58, 72, 72].map((temp, idx) => (
                    <div key={idx} className="flex-1 bg-phosphor/80 rounded-t-xs" style={{ height: `${(temp / 100) * 100}%` }} title={`${temp}°C`} />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
                  <span>Cycle Stage: 72.0 °C Extension (Cycle 18/35)</span>
                  <span className="text-phosphor">±0.08 °C Stability</span>
                </div>
              </div>

              <div className="md:col-span-5 flex flex-col justify-between space-y-3 font-mono text-xs">
                <div className="space-y-2">
                  <div className="text-muted-foreground uppercase text-[10px] font-semibold">Instrument Connection</div>
                  <div className="p-2.5 rounded bg-background border border-border text-[11px] space-y-1">
                    <div>Port: USB CDC (/dev/ttyACM0)</div>
                    <div>Baud: 115,200 (serial streaming)</div>
                    <div>Device: OpenPCR / Peltier PID Controller</div>
                    <div className="text-phosphor">Status: Logging cycle profile to note</div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  When your protocol requires instrument logging, temperature sweeps, balance measurements, or sensor streams append straight into your notebook without external logger apps.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: AUDIT & CRYPTOGRAPHIC PROVENANCE */}
        {activeView === 'audit' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-border pb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Immutable Audit Trail &amp; Verification</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Append-only revision records and SHA-256 integrity verification.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Record Status: Sealed &amp; Validated
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-4 font-mono text-xs">
              <div className="space-y-2 border-b border-border pb-3">
                <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>RECORD DIGEST (SHA-256)</span>
                  <span className="text-phosphor">ISO 8601 UTC TIMESTAMPED</span>
                </div>
                <div className="p-2 rounded bg-background border border-border text-[10px] text-foreground truncate select-all">
                  1cfa3f0f0064c27d6cb034f4166e559daa8a07edc944ae590ff3b6d3e10f5d9e
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded bg-background border border-border space-y-1">
                  <div className="text-muted-foreground text-[10px] uppercase">Author Signature</div>
                  <div className="font-semibold text-foreground">KH: Protocol Author</div>
                  <div className="text-muted-foreground text-[11px]">Reason: Authorship &amp; Protocol Execution</div>
                  <div className="text-phosphor text-[10px]">Verified: Signature Applied</div>
                </div>

                <div className="p-3 rounded bg-background border border-border space-y-1">
                  <div className="text-muted-foreground text-[10px] uppercase">PI Reviewer Signature</div>
                  <div className="font-semibold text-foreground">PI Reviewer: Lab Lead</div>
                  <div className="text-muted-foreground text-[11px]">Reason: Technical Review &amp; Approval</div>
                  <div className="text-phosphor text-[10px]">Verified: Dual-Attestation Sealed</div>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                Any modification to protocol text, telemetry samples, or reagent records invalidates the mathematical checksum,
                preventing silent alterations during peer review or grant audits.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Pill */}
      <div className="px-6 py-3 bg-muted/40 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted-foreground">
        <span>Trial record PR-2026-PCR-01 · 5 Hz Peltier Block Temperature Log</span>
        <span className="text-foreground font-medium">Local workspace draft</span>
      </div>
    </div>
  );
}
