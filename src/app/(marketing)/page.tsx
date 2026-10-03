import Link from "next/link";
import { ArrowRight, Cpu, ShieldCheck, Database, Terminal, FileCode2, Lock, Activity, Check } from "lucide-react";
import type { Metadata } from "next";
import { PilotInterestForm } from "@/components/marketing/PilotInterestForm";

export const metadata: Metadata = {
  title: "Inquestra — Hardware DAQ & Electronic Lab Notebook for Biomedical Engineering",
  description:
    "Direct Web Serial data acquisition for ESP32 and Arduino sensors coupled with FDA 21 CFR Part 11 compliant immutable lab notebook records.",
};

export default function MarketingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Inquestra",
    "operatingSystem": "Web Browser (Chrome, Edge, Chromium)",
    "applicationCategory": "ScientificResearchSoftware",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Enterprise-grade Data Acquisition and Electronic Research Notebook for Biomedical Engineering with browser-native Web Serial ingestion and SHA-256 cryptographic provenance."
  };

  return (
    <div className="font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
            Biomedical Instrumentation &amp; Research Provenance
          </p>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-foreground mb-8 leading-[1.1] text-balance">
            Hardware telemetry meets immutable protocols.
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed text-balance">
            Inquestra connects directly to ESP32 and Arduino instrumentation via browser Web Serial.
            Sensor telemetry streams into cryptographically sealed, 21 CFR Part 11 compliant research
            notebooks with zero manual CSV transfers.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-6 py-3 rounded text-sm font-medium transition-colors"
            >
              Open Research Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/architecture"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3 rounded text-sm font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              View System Architecture
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Institutional Deployment Banner */}
          <div className="pt-8 border-t border-border/60">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Engineered For Strict Biomedical Disciplines
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-2 text-xs font-mono text-muted-foreground">
              <span>Academic Biomechanics</span>
              <span>·</span>
              <span>Electrophysiology</span>
              <span>·</span>
              <span>Cardiovascular DAQ</span>
              <span>·</span>
              <span>Translational Biotech</span>
              <span>·</span>
              <span>GLP / GMP Testing</span>
            </div>
          </div>
        </div>

        {/* Live Instrument Preview */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">
            {/* Instrument Header Bar */}
            <div className="px-4 py-2.5 bg-muted/60 border-b border-border flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="inline-block w-2 h-2 rounded-full bg-phosphor animate-pulse" />
                <span className="text-foreground font-semibold">ESP32-S3 DAQ</span>
                <span className="text-muted-foreground">COM3 · 115,200 baud · 100 Hz</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>BUFFER: 4,820 samples</span>
                <span className="text-phosphor font-semibold">CHECKSUM: ACTIVE</span>
              </div>
            </div>

            {/* Interactive Telemetry & Notebook Split Representation */}
            <div className="grid md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
              {/* Telemetry Channel Graph */}
              <div className="md:col-span-7 p-6 bg-background">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Channel 01: Differential Biopotential (mV)
                  </span>
                  <span className="text-xs font-mono text-foreground font-semibold">ΔV: 1.284 mV</span>
                </div>
                {/* Waveform Representation */}
                <div className="h-44 w-full bg-muted/20 border border-border/80 rounded relative flex items-end p-2 gap-1 overflow-hidden">
                  <div className="absolute inset-0 grid grid-rows-4 grid-cols-6 pointer-events-none opacity-20 border-b border-border">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="border-r border-t border-border/40" />
                    ))}
                  </div>
                  {[35, 42, 38, 55, 92, 18, 48, 52, 45, 48, 50, 88, 22, 46, 52, 49, 53, 95, 14, 45, 52, 50, 48, 54, 91, 20, 49, 53, 51, 47, 52].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-phosphor/80 rounded-t-sm"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 text-[11px] font-mono text-muted-foreground">
                  <span>Sweep: 250ms/div</span>
                  <span>Sensitivity: 200µV/div</span>
                  <span className="text-phosphor">Live Web Serial Stream</span>
                </div>
              </div>

              {/* Protocol Document Log */}
              <div className="md:col-span-5 p-6 bg-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">
                      Protocol Log #TR-2026-088
                    </span>
                    <span className="text-[10px] font-mono bg-caution/10 text-caution border border-caution/30 px-2 py-0.5 rounded">
                      SEALED SHA-256
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-2">
                    In Vitro Myocardial Impedance Assay
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Real-time serial stream ingested from active electrode array. All sensor packets appended
                    directly into study record with UTC RFC 3161 timestamps.
                  </p>
                  <div className="space-y-2 text-xs font-mono bg-background p-3 rounded border border-border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reagent:</span>
                      <span className="text-foreground">Krebs-Henseleit Buffer (50 mL)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lead PI:</span>
                      <span className="text-foreground">Dr. K. Vance, PhD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Digest:</span>
                      <span className="text-muted-foreground truncate max-w-[140px]">e3b0c44298fc1c149afb...</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Compliance Verification</span>
                  <span className="text-foreground font-mono font-medium">FDA 21 CFR Part 11 Validated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive (Asymmetric Instrument Breakdown) */}
      <section id="instrumentation" className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-20">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              System Capabilities
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
              A unified bench instrument for rigorous data acquisition.
            </h2>
          </div>

          <div className="space-y-16">
            {/* Capability 01 */}
            <div className="grid md:grid-cols-12 gap-8 items-start border-t border-border pt-10">
              <div className="md:col-span-3">
                <span className="text-xs font-mono text-muted-foreground">01 / HARDWARE DAQ</span>
                <h3 className="text-lg font-semibold text-foreground mt-2">
                  Browser-Native Web Serial
                </h3>
              </div>
              <div className="md:col-span-5 text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Connect microcontroller hardware directly from Chromium-based browsers. Inquestra
                  ingests high-speed continuous byte streams from ESP32, Arduino, Teensy, and custom UART devices
                  without intermediate Python scripts, terminal listeners, or virtual COM bridges.
                </p>
                <Link
                  href="/hardware"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
                >
                  Explore Hardware DAQ &amp; Microcontroller Specs
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="md:col-span-4 bg-muted/30 p-4 rounded border border-border font-mono text-xs text-foreground space-y-2">
                <div className="text-muted-foreground">{''}</div>
                <div>const port = await navigator.serial.requestPort();</div>
                <div>await port.open({`{ baudRate: 115200 }`});</div>
                <div className="text-phosphor">Status: Connected to USB Serial Port</div>
              </div>
            </div>

            {/* Capability 02 */}
            <div id="provenance" className="grid md:grid-cols-12 gap-8 items-start border-t border-border pt-10">
              <div className="md:col-span-3">
                <span className="text-xs font-mono text-muted-foreground">02 / PROVENANCE</span>
                <h3 className="text-lg font-semibold text-foreground mt-2">
                  Cryptographic Immutability
                </h3>
              </div>
              <div className="md:col-span-5 text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Research falsification often occurs in the gap between data collection and report drafting.
                  Inquestra seals every trial with a deterministic SHA-256 hash. Once locked by the Principal Investigator,
                  the trial record, associated sensor packets, and audit ledger cannot be modified silently.
                </p>
                <Link
                  href="/provenance"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
                >
                  Read 21 CFR Part 11 Regulatory Matrix
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="md:col-span-4 bg-muted/30 p-4 rounded border border-border font-mono text-xs text-foreground space-y-2">
                <div className="text-muted-foreground">{''}</div>
                <div>EVENT: TRIAL_SEALED</div>
                <div>ACTOR: investigator@lab.org</div>
                <div>HASH: 7a82c40d512a8335b2e...</div>
                <div className="text-caution">Integrity: Sealed &amp; Tamper-Evident</div>
              </div>
            </div>

            {/* Capability 03 */}
            <div className="grid md:grid-cols-12 gap-8 items-start border-t border-border pt-10">
              <div className="md:col-span-3">
                <span className="text-xs font-mono text-muted-foreground">03 / ARCHITECTURE &amp; LIMS</span>
                <h3 className="text-lg font-semibold text-foreground mt-2">
                  Integrated Pipeline &amp; Inventory
                </h3>
              </div>
              <div className="md:col-span-5 text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Track chemical lots, plasmids, primers, and antibodies directly inside your experimental protocol.
                  Using notebook slash commands, researchers deduct reagent volumes in real-time, automatically warning
                  lab administrators when safety thresholds are breached.
                </p>
                <Link
                  href="/architecture"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
                >
                  Inspect Full Pipeline Architecture
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="md:col-span-4 bg-muted/30 p-4 rounded border border-border font-mono text-xs text-foreground space-y-2">
                <div className="text-muted-foreground">{''}</div>
                <div>/reagent &quot;Paraformaldehyde 4%&quot; 25mL</div>
                <div>Deduction: Batch #PF-8841-A</div>
                <div className="text-foreground">Remaining: 475 mL in Storage Cabinet B</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Architectural Difference */}
      <section id="architecture" className="py-24 border-b border-border bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              System Comparison
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
              The cost of fragmented laboratory software.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* The Fragmented Stack */}
            <div className="bg-card border border-border p-8 rounded-lg">
              <div className="text-xs font-mono uppercase text-muted-foreground mb-4">
                Fragmented Laboratory Stack
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="p-3 bg-background border border-border rounded">
                  <span className="font-semibold text-foreground block mb-1">Disconnected DAQ</span>
                  Custom Python scripts capture serial packets to loose .csv files on local lab workstations.
                </div>
                <div className="p-3 bg-background border border-border rounded">
                  <span className="font-semibold text-foreground block mb-1">Unverifiable Chain of Custody</span>
                  Spreadsheets can be edited at any time with no cryptographic record or timestamp verification.
                </div>
                <div className="p-3 bg-background border border-border rounded">
                  <span className="font-semibold text-foreground block mb-1">Manual Inventory Audits</span>
                  Reagents are tracked in separate binders or outdated spreadsheets, leading to expired stocks.
                </div>
              </div>
            </div>

            {/* The Inquestra Standard */}
            <div className="bg-card border border-border p-8 rounded-lg">
              <div className="text-xs font-mono uppercase text-phosphor mb-4 font-semibold">
                The Inquestra Standard
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="p-3 bg-background border border-border rounded">
                  <span className="font-semibold text-foreground block mb-1">Direct Browser Ingestion</span>
                  Zero drivers or third-party wrappers. Web Serial captures packets straight into the notebook buffer.
                </div>
                <div className="p-3 bg-background border border-border rounded">
                  <span className="font-semibold text-foreground block mb-1">Deterministic SHA-256 Provenance</span>
                  Trials are sealed with cryptographic hashes conforming strictly to FDA 21 CFR Part 11 requirements.
                </div>
                <div className="p-3 bg-background border border-border rounded">
                  <span className="font-semibold text-foreground block mb-1">Inline Reagent Consumption</span>
                  Reagent deductions occur inside the experimental note, syncing directly with the organization LIMS.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Integrity Metrics */}
      <section className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="border-t sm:border-t-0 sm:border-l border-border pt-6 sm:pt-0 sm:pl-6">
              <div className="text-3xl font-mono font-semibold text-foreground mb-1">0 ms</div>
              <div className="text-xs uppercase tracking-wider font-mono text-muted-foreground mb-2">Driver Latency</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Direct browser-to-silicon UART communication using standard Web Serial API standards.
              </p>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-border pt-6 sm:pt-0 sm:pl-6">
              <div className="text-3xl font-mono font-semibold text-foreground mb-1">SHA-256</div>
              <div className="text-xs uppercase tracking-wider font-mono text-muted-foreground mb-2">Cryptographic Binding</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every finalized experiment produces a verifiable cryptographic digest for peer review.
              </p>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-border pt-6 sm:pt-0 sm:pl-6">
              <div className="text-3xl font-mono font-semibold text-foreground mb-1">21 CFR § 11</div>
              <div className="text-xs uppercase tracking-wider font-mono text-muted-foreground mb-2">Regulatory Alignment</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Role-based access control, immutable audit ledgers, and author signature verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-normal text-foreground tracking-tight mb-6">
            Equip your laboratory with immutable data acquisition.
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Begin logging live serial telemetry in your browser immediately. Open-core individual access is free forever.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/app/signup"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-8 py-3.5 rounded text-sm font-semibold transition-colors"
            >
              Create Free Lab Account
            </Link>
            <Link
              href="/app/login"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-3.5 rounded text-sm font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              Sign In To Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* Pilot Lab Program — lead capture */}
      <section className="py-24 border-b border-border" id="pilot">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Pilot Lab Program
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight mb-5">
              Join the first five pilot labs.
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              W&apos;e selectively onboarding academic and biotech labs for our founding cohort.
              You get direct access to the founding team, white-glove deployment support, and a permanent free tier for your lab. No enterprise contract required.
            </p>
          </div>

          {/* Value bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Free Forever', desc: 'No credit card. Founding cohort keeps the core platform free.' },
              { label: 'Founder Direct', desc: 'You email the builder, not a sales rep. Fast iteration on your needs.' },
              { label: 'Deployment Help', desc: 'We configure your Railway / self-hosted instance and import your SOPs.' },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider mb-1">
                  {item.label}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Inline lead form */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl">
            <PilotInterestForm />
          </div>
        </div>
      </section>
    </div>
  );
}

