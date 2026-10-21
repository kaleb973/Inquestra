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
          <span className="w-2.5 h-2.5 rounded-full bg-phosphor animate-pulse" />
          <span className="text-foreground font-semibold">Molecular_&amp;_Biotech_Core</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">Protocols</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-mono">PR-2026-ASSAY-04</span>
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
          <span className="hidden sm:inline">21 CFR § 11 Audit Trail Active</span>
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
                <span>Version 3.2</span>
                <span>·</span>
                <span>Biochemistry &amp; Analytical Lab</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-normal text-foreground">
                Enzyme Kinetics &amp; Interfacial Impedance Assay
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Objective: Quantify substrate turnover kinetics and interfacial double-layer capacitance across functionalized surface substrates.
              </p>
            </div>

            {/* Canvas Blocks Demonstration */}
            <div className="space-y-4">
              {/* Block 1: Reagent Deduction & Protocol Checklist */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-foreground uppercase tracking-wider">
                    Phase 1: Reagent Preparation &amp; Inventory Deduction
                  </span>
                  <span className="text-phosphor text-[11px]">Synced with Lab Inventory</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded bg-background border border-border">
                    <FlaskConical className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-mono text-muted-foreground">Deducted:</span>
                    <span className="font-semibold text-foreground">Dulbecco&apos;s Modified Eagle Medium (DMEM 1X)</span>
                    <span className="text-muted-foreground">· 50 mL</span>
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">Lot #DM-8891-B</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded bg-background border border-border">
                    <FlaskConical className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-mono text-muted-foreground">Deducted:</span>
                    <span className="font-semibold text-foreground">Collagenase Type II (0.1% Solution)</span>
                    <span className="text-muted-foreground">· 10 mL</span>
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">Lot #CL-4012</span>
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
                    <span className="font-semibold text-foreground uppercase">Incubation &amp; Cellular Attachment</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                    Transfer seeded scaffolds to 37°C humidified incubator with 5% CO2. Maintain quiescent culture environment.
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

              {/* Block 3: Molecular Structure & Biophysical Formula Dual Card */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Molecular Structure Preview */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <FlaskConical className="w-3.5 h-3.5 text-primary" />
                      Molecular Compound
                    </span>
                    <span className="text-[10px]">SMILES: C1=NC(=C2C...</span>
                  </div>
                  <div className="bg-background rounded-lg p-3 border border-border text-center">
                    <div className="text-xs font-semibold text-foreground">Adenosine Triphosphate (ATP Disodium Salt)</div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">MW: 551.14 g/mol · CAS: 987-65-5</div>
                    <div className="mt-2 text-[11px] text-muted-foreground italic bg-muted/30 py-1 px-2 rounded">
                      Concentration: 5.0 mM in Krebs-Henseleit Buffer
                    </div>
                  </div>
                </div>

                {/* Biophysical Equation (KaTeX) */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Sigma className="w-3.5 h-3.5 text-primary" />
                      Reaction Kinetics &amp; Impedance
                    </span>
                    <span className="text-[10px]">Michaelis-Menten / Randles</span>
                  </div>
                  <div className="bg-background rounded-lg p-3 border border-border text-center flex flex-col justify-center min-h-[76px]">
                    <div className="font-mono text-sm text-foreground font-semibold">
                      v = (V_max · [S]) / (K_m + [S])
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-1">
                      Substrate velocity modeling &amp; dual-layer electrochemical fit
                    </div>
                  </div>
                </div>
              </div>

              {/* Block 4: Biological Sequence Snippet */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Dna className="w-3.5 h-3.5 text-purple-400" />
                    Target Primer Sequence (Cardiomyocyte Troponin T2)
                  </span>
                  <span className="text-[10px]">Forward Primer · Tm: 59.4°C</span>
                </div>
                <div className="bg-background rounded-lg p-2.5 border border-border font-mono text-xs flex flex-wrap gap-1">
                  {['5\'-', 'A', 'T', 'G', 'C', 'C', 'T', 'A', 'A', 'G', 'C', 'T', 'G', 'C', 'A', 'T', 'G', 'A', 'C', 'C', 'G', 'T', 'A', '-3\''].map((ch, i) => (
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
                  <span className="ml-auto text-[11px] text-muted-foreground self-center">22 bp · GC: 50.0%</span>
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
                    <td className="py-3 px-4 font-semibold text-foreground">Dulbecco&apos;s PBS (1X, Sterile)</td>
                    <td className="py-3 px-4">#PB-2026-904</td>
                    <td className="py-3 px-4">Cold Room 4°C · Shelf 2</td>
                    <td className="py-3 px-4 text-foreground font-medium">4,250 mL</td>
                    <td className="py-3 px-4 text-phosphor">Active · Sealed</td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-semibold text-foreground">Paraformaldehyde 4% in PBS</td>
                    <td className="py-3 px-4">#PF-8841-A</td>
                    <td className="py-3 px-4">Flammables Cabinet B</td>
                    <td className="py-3 px-4 text-foreground font-medium">475 mL</td>
                    <td className="py-3 px-4 text-phosphor">Active</td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-semibold text-foreground">Anti-Troponin T2 Rabbit mAb</td>
                    <td className="py-3 px-4">#AB-7702-X</td>
                    <td className="py-3 px-4">-80°C Freezer Bay 2</td>
                    <td className="py-3 px-4 text-foreground font-medium">80 µL (4 aliquots)</td>
                    <td className="py-3 px-4 text-phosphor">Verified Antibody</td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-semibold text-foreground">Gelatin Methacryloyl (GelMA)</td>
                    <td className="py-3 px-4">#GM-1092-C</td>
                    <td className="py-3 px-4">Desiccator Chamber 1</td>
                    <td className="py-3 px-4 text-foreground font-medium">15.4 g</td>
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
                  <span className="text-primary font-semibold">Nature Biomedical Engineering (2024)</span>
                  <span>PMID: 38412901 · DOI: 10.1038/s41551-024-01182-1</span>
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  Electromechanical synchronization of engineered human cardiac tissue on nanofibrous scaffolds
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Demonstrates 2.4-fold enhancement in longitudinal action potential conduction velocity using oriented electrospun polyurethane matrices.
                </p>
                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono">
                  <span className="text-phosphor">Cited in Section 3.1: Protocol Electrophysiological Rationale</span>
                  <span className="text-muted-foreground">Direct Markdown Citation: [@NBE2024]</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="text-primary font-semibold">Biomaterials (2023)</span>
                  <span>PMID: 36729014 · DOI: 10.1016/j.biomaterials.2023.122049</span>
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  Viscoelastic characterization of photopolymerized hydrogel constructs under physiological cyclic strain
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Establishes standard frequency sweep protocols (0.1–10 Hz) for evaluating loss and storage moduli in tissue replacements.
                </p>
                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono">
                  <span className="text-phosphor">Cited in Section 4.2: Mechanical Testing Parameters</span>
                  <span className="text-muted-foreground">Direct Markdown Citation: [@Biomaterials2023]</span>
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
                  Optional direct ingestion for sensors, load cells, biopotentials, and microcontrollers via browser Web Serial.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                W3C Web Serial API Native
              </span>
            </div>

            <div className="grid md:grid-cols-12 gap-6 bg-card border border-border rounded-xl p-5">
              <div className="md:col-span-7 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-muted-foreground uppercase">Channel 01: Biopotential ECG (mV)</span>
                  <span className="text-phosphor font-semibold">1,000 Hz Live Stream</span>
                </div>
                <div className="h-36 w-full bg-background border border-border rounded-lg relative flex items-end p-2 gap-1 overflow-hidden">
                  <div className="absolute inset-0 grid grid-rows-3 grid-cols-6 pointer-events-none opacity-20 border-b border-border">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} className="border-r border-t border-border/40" />
                    ))}
                  </div>
                  {[45, 48, 52, 90, 18, 46, 50, 48, 51, 52, 88, 20, 47, 51, 49, 53, 92, 16, 45, 52, 50, 48, 52, 89, 19, 48, 52, 50, 47].map((h, idx) => (
                    <div key={idx} className="flex-1 bg-phosphor/80 rounded-t-xs" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
                  <span>Transport: Off-thread Web Worker</span>
                  <span className="text-phosphor">Zero UI Frame Drops</span>
                </div>
              </div>

              <div className="md:col-span-5 flex flex-col justify-between space-y-3 font-mono text-xs">
                <div className="space-y-2">
                  <div className="text-muted-foreground uppercase text-[10px] font-semibold">Instrument Connection</div>
                  <div className="p-2.5 rounded bg-background border border-border text-[11px] space-y-1">
                    <div>Port: USB CDC (/dev/ttyACM0)</div>
                    <div>Baud: 115,200 (up to 921,600)</div>
                    <div>Compatible: ESP32, Teensy, Arduino, DAQ cards</div>
                    <div className="text-phosphor">Status: Connected directly to note buffer</div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  When your protocol requires live sensor logging, readings append straight into the notebook note without separate logging programs.
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
                <h3 className="text-lg font-semibold text-foreground">Immutable Audit Trail &amp; Regulatory Sealing</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Technical controls supporting 21 CFR Part 11, GAMP 5, and institutional peer-review verification.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Record Status: Cryptographically Sealed
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-4 font-mono text-xs">
              <div className="space-y-2 border-b border-border pb-3">
                <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>RECORD DIGEST (SHA-256)</span>
                  <span className="text-phosphor">RFC 3161 TIMESTAMPED</span>
                </div>
                <div className="p-2 rounded bg-background border border-border text-[10px] text-foreground truncate select-all">
                  4f53cda18c2e8697b91d2938e3e4a5d89f10928374a56b2c1d0e9f8a7b6c5d4e
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded bg-background border border-border space-y-1">
                  <div className="text-muted-foreground text-[10px] uppercase">Author Signature (§ 11.50)</div>
                  <div className="font-semibold text-foreground">Instrument Operator [OP-4091]</div>
                  <div className="text-muted-foreground text-[11px]">Reason: Authorship &amp; Protocol Execution</div>
                  <div className="text-phosphor text-[10px]">Verified: ECDSA Signature Applied</div>
                </div>

                <div className="p-3 rounded bg-background border border-border space-y-1">
                  <div className="text-muted-foreground text-[10px] uppercase">PI Reviewer Signature (§ 11.50)</div>
                  <div className="font-semibold text-foreground">Principal Investigator [PI-7021]</div>
                  <div className="text-muted-foreground text-[11px]">Reason: Technical Review &amp; Approval</div>
                  <div className="text-phosphor text-[10px]">Verified: Dual-Attestation Sealed</div>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                Any post-sealing modification to protocol text, telemetry samples, or reagent records invalidates the mathematical checksum,
                preventing silent alterations during peer review or regulatory audits.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Pill */}
      <div className="px-6 py-3 bg-muted/40 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted-foreground">
        <span>The complete research environment for modern scientific discovery</span>
        <span className="text-foreground font-medium">TipTap Canvas · LIMS · Citations · Optional DAQ · 21 CFR § 11</span>
      </div>
    </div>
  );
}
