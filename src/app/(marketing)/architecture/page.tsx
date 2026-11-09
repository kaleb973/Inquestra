import Link from 'next/link';
import { ArrowRight, Database } from 'lucide-react';
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
            <span>Platform / Engineering &amp; Architecture · Last updated November 2026</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-normal tracking-tight text-foreground mb-6 leading-[1.15]">
            Engineered for high-frequency telemetry &amp; immutable storage.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
            How Inquestra delivers smooth 60fps real-time sensor telemetry waveform rendering, zero UI frame drops,
            offline bench resilience, and tamper-evident cloud synchronization across modern scientific laboratories and research facilities.
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

        {/* 4-Tier Pipeline — horizontal flow diagram */}
        <div className="mt-14 bg-card border border-border rounded-lg overflow-hidden shadow-xl p-8">
          <div className="border-b border-border pb-4 mb-8">
            <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">
              Full-Stack Ingestion Pipeline
            </span>
            <h3 className="text-base font-semibold text-foreground mt-1">
              From Physical Transducer to Cryptographic Ledger
            </h3>
          </div>

          {/* Horizontal stepped flow */}
          <div className="flex flex-wrap items-start gap-0">
            {/* Tier 1 */}
            <div className="flex-1 min-w-40 pr-4 border-r border-border">
              <span className="text-[10px] font-mono text-muted-foreground">TIER 01</span>
              <h4 className="font-semibold text-sm text-foreground mt-1 mb-2">Silicon &amp; ADC</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Microcontrollers (ESP32-S3, Teensy 4.1, Arduino) capture analog sensor biopotentials and emit structured UART byte frames.
              </p>
              <p className="mt-3 font-mono text-[10px] text-muted-foreground">Transport: USB-CDC / UART</p>
            </div>

            <div className="self-start pt-4 px-3 text-muted-foreground text-lg font-light select-none">→</div>

            {/* Tier 2 */}
            <div className="flex-1 min-w-40 px-4 border-r border-border">
              <span className="text-[10px] font-mono text-muted-foreground">TIER 02</span>
              <h4 className="font-semibold text-sm text-foreground mt-1 mb-2">Worker Ring Buffer</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Native Web Serial API streams bytes into a dedicated HTML5 Web Worker thread. Fixed ring buffers prevent garbage collection spikes.
              </p>
              <p className="mt-3 font-mono text-[10px] text-phosphor">Latency: &lt; 0.5 ms</p>
            </div>

            <div className="self-start pt-4 px-3 text-muted-foreground text-lg font-light select-none">→</div>

            {/* Tier 3 */}
            <div className="flex-1 min-w-40 px-4 border-r border-border">
              <span className="text-[10px] font-mono text-muted-foreground">TIER 03</span>
              <h4 className="font-semibold text-sm text-foreground mt-1 mb-2">Reactive Workspace</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Zustand state slices render 60fps HTML5 Canvas sweeps while researchers log observations and LIMS deductions in Tiptap.
              </p>
              <p className="mt-3 font-mono text-[10px] text-muted-foreground">Rendering: 60 FPS Canvas</p>
            </div>

            <div className="self-start pt-4 px-3 text-muted-foreground text-lg font-light select-none">→</div>

            {/* Tier 4 */}
            <div className="flex-1 min-w-40 pl-4">
              <span className="text-[10px] font-mono text-muted-foreground">TIER 04</span>
              <h4 className="font-semibold text-sm text-foreground mt-1 mb-2">Immutable Persistence</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Local IndexedDB provides offline resilience. Finalized trials sync to PostgreSQL via Prisma ORM with SHA-256 seals.
              </p>
              <p className="mt-3 font-mono text-[10px] text-primary">Integrity: 21 CFR § 11</p>
            </div>
          </div>
        </div>
      </section>

      {/* Off-Main-Thread Architecture */}
      <section className="py-16 border-t border-border bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl font-normal text-foreground tracking-tight">
                Why off-main-thread Web Workers are essential for bench DAQ.
              </h2>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                Continuous laboratory signal acquisition requires uninterrupted streaming. At 1 kHz with multiple differential channels,
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
              <div className="text-muted-foreground">{''}</div>
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

      {/* Offline Resilience — prose + table */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-display text-3xl font-normal text-foreground tracking-tight">
                Offline-first resilience for critical lab benches.
              </h2>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Hospital basements, wet labs, and Faraday cages often suffer from intermittent or blocked Wi-Fi connections.
                Inquestra is designed to never lose a trial when connectivity drops.
              </p>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-5 py-3 text-xs font-mono text-muted-foreground font-normal uppercase tracking-wider">Mode</th>
                    <th className="text-left px-5 py-3 text-xs font-mono text-muted-foreground font-normal uppercase tracking-wider">Storage</th>
                    <th className="text-left px-5 py-3 text-xs font-mono text-muted-foreground font-normal uppercase tracking-wider">Network</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/5 transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground align-top text-xs">Local IndexedDB Caching</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed align-top">Browser IndexedDB — packets and protocol edits persisted in real time</td>
                    <td className="px-5 py-4 text-xs font-mono text-muted-foreground align-top">None required</td>
                  </tr>
                  <tr className="hover:bg-muted/5 transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground align-top text-xs">Automatic Reconnection Sync</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed align-top">PostgreSQL via Prisma — validated local buffer synced on reconnect without data collisions</td>
                    <td className="px-5 py-4 text-xs font-mono text-muted-foreground align-top">Restored automatically</td>
                  </tr>
                  <tr className="hover:bg-muted/5 transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground align-top text-xs">Air-Gapped Standalone Mode</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed align-top">Local cryptographic export to USB storage for restricted military, biosecurity, or high-containment laboratories</td>
                    <td className="px-5 py-4 text-xs font-mono text-muted-foreground align-top">Not required</td>
                  </tr>
                </tbody>
              </table>
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
