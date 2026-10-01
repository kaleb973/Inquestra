import Link from 'next/link';
import { ArrowRight, Database, Server, Layers, Cpu, ShieldCheck, Activity, HardDrive, WifiOff, RefreshCw } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Architecture & Telemetry Pipeline — Inquestra',
  description:
    'Technical architecture of Inquestra: 4-tier telemetry pipeline, off-main-thread Web Workers, Zustand reactive state, and offline-first PostgreSQL sync.',
};

export default function ArchitecturePage() {
  return (
    <div className="pt-28 pb-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-muted text-muted-foreground text-xs font-mono uppercase tracking-wider mb-6">
            <Database className="w-3.5 h-3.5 text-phosphor" />
            <span>Platform / Engineering &amp; Architecture</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-normal tracking-tight text-foreground mb-6 leading-[1.15]">
            Engineered for high-frequency telemetry &amp; immutable storage.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
            How Inquestra delivers smooth 60fps real-time biopotential waveform rendering, zero UI frame drops,
            offline bench resilience, and tamper-evident cloud synchronization across modern biomedical laboratories.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-6 py-3 rounded text-sm font-medium transition-colors"
            >
              Open Research Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded text-sm font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              Test DAQ Simulator
            </Link>
          </div>
        </div>

        {/* 4-Tier Pipeline Architecture Visual */}
        <div className="mt-14 bg-card border border-border rounded-lg overflow-hidden shadow-xl p-8">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-8">
            <div>
              <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">
                Full-Stack Ingestion Pipeline
              </span>
              <h3 className="text-base font-semibold text-foreground mt-1">
                From Physical Transducer to Cryptographic Ledger
              </h3>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-phosphor">
              <span className="w-2 h-2 rounded-full bg-phosphor animate-pulse" />
              <span>Pipeline: ACTIVE &amp; STABLE</span>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Tier 1 */}
            <div className="bg-background border border-border rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-muted-foreground">TIER 01</span>
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
                <h4 className="font-semibold text-sm text-foreground">Silicon &amp; ADC</h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Microcontrollers (ESP32-S3, Teensy 4.1, Arduino) capture analog sensor biopotentials and emit structured UART byte frames.
                </p>
              </div>
              <div className="pt-3 border-t border-border font-mono text-[10px] text-muted-foreground">
                Transport: USB-CDC / UART
              </div>
            </div>

            {/* Tier 2 */}
            <div className="bg-background border border-border rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-muted-foreground">TIER 02</span>
                  <Activity className="w-4 h-4 text-phosphor" />
                </div>
                <h4 className="font-semibold text-sm text-foreground">Worker Ring Buffer</h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Native Web Serial API streams bytes into a dedicated HTML5 Web Worker thread. Fixed ring buffers prevent garbage collection spikes.
                </p>
              </div>
              <div className="pt-3 border-t border-border font-mono text-[10px] text-phosphor">
                Latency: &lt; 0.5 ms
              </div>
            </div>

            {/* Tier 3 */}
            <div className="bg-background border border-border rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-muted-foreground">TIER 03</span>
                  <Layers className="w-4 h-4 text-caution" />
                </div>
                <h4 className="font-semibold text-sm text-foreground">Reactive Workspace</h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Zustand state slices render 60fps HTML5 Canvas sweeps while researchers log observations and LIMS deductions in Tiptap.
                </p>
              </div>
              <div className="pt-3 border-t border-border font-mono text-[10px] text-muted-foreground">
                Rendering: 60 FPS Canvas
              </div>
            </div>

            {/* Tier 4 */}
            <div className="bg-background border border-border rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-muted-foreground">TIER 04</span>
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <h4 className="font-semibold text-sm text-foreground">Immutable Persistence</h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Local IndexedDB provides offline resilience. Finalized trials sync to PostgreSQL via Prisma ORM with SHA-256 seals.
                </p>
              </div>
              <div className="pt-3 border-t border-border font-mono text-[10px] text-primary">
                Integrity: 21 CFR § 11
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1: Off-Main-Thread Architecture */}
      <section className="py-16 border-t border-border bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Zero Frame Drops
              </span>
              <h2 className="font-display text-3xl font-normal text-foreground mt-2 tracking-tight">
                Why off-main-thread Web Workers are essential for BME DAQ.
              </h2>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                Biomedical signal acquisition requires uninterrupted streaming. At 1 kHz with multiple differential channels,
                a browser processing serial data on the JavaScript main thread will inevitably stutter whenever the user types
                in their protocol notes or scrolls a complex document.
              </p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Inquestra decouples serial packet parsing completely. The Web Serial stream reader runs in a dedicated Web Worker,
                depositing incoming floats into a pre-allocated circular ring buffer. The main thread draws only the latest sweep
                using high-performance Canvas rendering.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 font-mono text-xs text-foreground space-y-3 shadow-sm">
              <div className="text-muted-foreground">// Off-Thread Worker Thread Architecture</div>
              <div className="text-foreground">
                <span className="text-primary">const</span> worker = <span className="text-primary">new</span> Worker(&apos;/workers/telemetryWorker.js&apos;);
              </div>
              <div className="text-foreground">
                worker.postMessage(&#123; type: &apos;START_STREAM&apos;, baudRate: 115200 &#125;);
              </div>
              <div className="p-3 rounded bg-muted/30 border border-border text-[11px] space-y-1.5 text-muted-foreground">
                <div className="text-foreground font-semibold">Worker Thread Heap: Isolated</div>
                <div>Memory Allocation: 32MB SharedArrayBuffer</div>
                <div>Main Thread CPU Load: &lt; 3.2%</div>
                <div className="text-phosphor">FPS: Solid 60.0 fps under continuous 1,000 Hz input</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2: Offline-First Laboratory Resilience */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Fault Tolerance
            </span>
            <h2 className="font-display text-3xl font-normal text-foreground mt-2 tracking-tight">
              Offline-first resilience for critical lab benches.
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Hospital basements, wet labs, and Faraday cages often suffer from intermittent or blocked Wi-Fi connections.
              Inquestra is designed to never lose a trial when connectivity drops.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border border-border bg-card space-y-3">
              <div className="w-8 h-8 rounded bg-caution/10 text-caution flex items-center justify-center">
                <WifiOff className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Local IndexedDB Caching</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Telemetry packets and protocol edits are persisted locally to browser IndexedDB in real time. If the laboratory
                network disconnects, recording continues seamlessly.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card space-y-3">
              <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Automatic Reconnection Sync</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                As soon as laboratory connectivity is re-established, Inquestra validates the local trial buffer against
                the server state and syncs to PostgreSQL without data collisions.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card space-y-3">
              <div className="w-8 h-8 rounded bg-phosphor/10 text-phosphor flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Air-Gapped Standalone Mode</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For restricted military, biosecurity, or high-containment laboratories, Inquestra can operate in full air-gapped
                mode with local cryptographic export to USB storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 text-center">
        <div className="p-10 rounded-xl bg-card border border-border shadow-sm">
          <h3 className="font-display text-2xl sm:text-3xl text-foreground mb-3 font-normal">
            Test the telemetry pipeline yourself.
          </h3>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
            Launch our simulated test bench or open the research workspace to connect your microcontroller.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded text-xs font-semibold transition-colors"
            >
              Launch Live DAQ Demo
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/hardware"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded text-xs font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              Review Hardware Specifications
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
