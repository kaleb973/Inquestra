import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildGraphSchema,
  buildPageMetadata,
} from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'System Architecture and Telemetry Pipeline',
  description:
    'Technical architecture of Inquestra: W3C Web Serial ingestion, Zustand reactive state with 500-sample preview buffering, session CSV archiving, and local-first storage.',
  path: '/architecture',
});

export default function ArchitecturePage() {
  const structuredData = buildGraphSchema([
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'System Architecture', path: '/architecture' },
    ]),
  ]);

  return (
    <div className="pt-14 sm:pt-20 pb-24">
      <JsonLd data={structuredData} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-5 leading-[1.1]">
            Built for direct Web Serial telemetry and local-first research records.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
            W3C Web Serial streams live numeric frames into a 500-sample preview buffer while preserving full session data for CSV/ZIP export alongside localStorage notebooks.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-95 px-6 h-11 rounded-md text-sm font-semibold transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open Research Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 h-11 rounded-md text-sm font-medium border border-border bg-card text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Test DAQ Simulator
            </Link>
          </div>
        </div>

        {/* 4-Tier Pipeline (clean 1px hairline grid, zero shadow-xl, no uppercase eyebrow) */}
        <div className="mt-12 bg-card border border-border rounded-lg overflow-hidden p-6 sm:p-8">
          <div className="border-b border-border pb-4 mb-8">
            <h2 className="text-xl font-semibold text-foreground">
              Full-stack ingestion pipeline: transducer to ledger
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border gap-y-6">
            <div className="sm:pr-5 space-y-2">
              <span className="text-xs font-mono text-muted-foreground">Tier 01</span>
              <h3 className="font-semibold text-base text-foreground">Silicon and ADC</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Microcontrollers (ESP32-S3, Teensy 4.1, Arduino) sample analog channels and emit structured serial frames.
              </p>
              <p className="font-mono text-xs text-muted-foreground pt-1">Transport: USB-CDC / UART</p>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-5 space-y-2">
              <span className="text-xs font-mono text-muted-foreground">Tier 02</span>
              <h3 className="font-semibold text-base text-foreground">Bounded preview &amp; session archive</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Web Serial parses incoming UTF-8 serial lines into a 500-sample rolling sparkline while keeping the full session archive in memory for CSV export.
              </p>
              <p className="font-mono text-xs text-phosphor pt-1">Live Window: 500 pts · CSV Full Session</p>
            </div>

            <div className="pt-4 lg:pt-0 sm:pr-5 lg:px-5 space-y-2">
              <span className="text-xs font-mono text-muted-foreground">Tier 03</span>
              <h3 className="font-semibold text-base text-foreground">Reactive workspace</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Zustand state slices render 60 fps HTML5 Canvas sweeps alongside TipTap notes and reagent lots.
              </p>
              <p className="font-mono text-xs text-muted-foreground pt-1">Rendering: 60 fps Canvas</p>
            </div>

            <div className="pt-4 lg:pt-0 sm:pl-5 space-y-2">
              <span className="text-xs font-mono text-muted-foreground">Tier 04</span>
              <h3 className="font-semibold text-base text-foreground">Local persistence &amp; ZIP export</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browser localStorage persists local trials automatically, with portable ZIP exports including SHA-256 checksums or optional self-hosted PostgreSQL sync.
              </p>
              <p className="font-mono text-xs text-primary pt-1">Integrity: SHA-256 Checksummed</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-foreground tracking-tight">
                Bounded UI rendering with full-session CSV capture.
              </h2>
              <p className="text-base text-muted-foreground mt-4 leading-relaxed">
                Rendering thousands of telemetry points directly inside DOM charts slows down rich-text protocol editing during active benchtop runs.
              </p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Inquestra parses W3C Web Serial numeric streams into a capped 500-sample live SVG sparkline while retaining the full run in a non-persisted session archive for CSV and ZIP export.
              </p>
            </div>

            <div className="bg-graphite text-graphite-ink border border-border rounded-lg p-6 font-mono text-xs space-y-3">
              <div className="text-graphite-ink">
                <span className="text-sky-400">const</span> port = <span className="text-sky-400">await</span> navigator.serial.requestPort();
              </div>
              <div className="text-graphite-ink">
                <span className="text-sky-400">await</span> port.open(&#123; baudRate: 115200 &#125;);
              </div>
              <div className="p-3 rounded bg-graphite-elevated text-xs space-y-1.5 text-graphite-muted">
                <div className="text-graphite-ink font-semibold">Telemetry Pipeline: Active Stream</div>
                <div>Live Sparkline Buffer: Capped at 500 samples</div>
                <div>Session Archive: Retained for full CSV export</div>
                <div className="text-phosphor">Protocol Timers: Dedicated Web Worker thread</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-5">
              <h2 className="text-3xl font-semibold text-foreground tracking-tight">
                Offline-first resilience for critical benches.
              </h2>
              <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                Hospital basements, wet labs, and Faraday cages experience intermittent Wi-Fi. Inquestra persists edits locally so trials never drop.
              </p>
            </div>

            <div className="md:col-span-7 border-y border-border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3.5 pr-4 font-semibold text-foreground">Mode</th>
                    <th className="py-3.5 px-4 font-semibold text-foreground">Storage</th>
                    <th className="py-3.5 pl-4 font-semibold text-foreground">Network</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 pr-4 font-medium text-foreground align-top">Local Browser Persistence</td>
                    <td className="py-4 px-4 text-muted-foreground leading-relaxed align-top">Browser localStorage persists local trials, protocols, and quota-safe exports continuously</td>
                    <td className="py-4 pl-4 font-mono text-xs text-muted-foreground align-top">None required</td>
                  </tr>
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 pr-4 font-medium text-foreground align-top">Self-Hosted PostgreSQL Sync</td>
                    <td className="py-4 px-4 text-muted-foreground leading-relaxed align-top">Optional self-hosted PostgreSQL via Prisma stores synced team notebooks and checksummed trials</td>
                    <td className="py-4 pl-4 font-mono text-xs text-muted-foreground align-top">Optional self-host</td>
                  </tr>
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 pr-4 font-medium text-foreground align-top">Air-Gapped Standalone</td>
                    <td className="py-4 px-4 text-muted-foreground leading-relaxed align-top">Self-contained file export for isolated lab workstations</td>
                    <td className="py-4 pl-4 font-mono text-xs text-muted-foreground align-top">Not required</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 text-center">
        <div className="p-10 rounded-lg bg-card border border-border">
          <h3 className="text-2xl sm:text-3xl text-foreground mb-3 font-semibold">
            Test the telemetry pipeline yourself.
          </h3>
          <p className="text-base text-muted-foreground max-w-xl mx-auto mb-6">
            Launch the simulated test bench or open the research workspace to connect hardware.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-95 px-6 h-11 rounded-md text-sm font-semibold transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Launch Live DAQ Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/hardware"
              className="inline-flex items-center gap-2 px-6 h-11 rounded-md text-sm font-medium border border-border bg-background text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Review Hardware Specifications
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
