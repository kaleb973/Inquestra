import Link from 'next/link';
import {
  ArrowRight,
  Database,
  ShieldCheck,
} from 'lucide-react';
import type { Metadata } from 'next';
import { ScientificWorkspacePreview } from '@/components/marketing/ScientificWorkspacePreview';
import { FirmwareShowcase } from '@/components/marketing/FirmwareShowcase';
import { ProvenanceInteractiveDemo } from '@/components/marketing/ProvenanceInteractiveDemo';
import { PilotInterestForm } from '@/components/marketing/PilotInterestForm';

export const metadata: Metadata = {
  title: {
    absolute: 'Inquestra: Local-First Electronic Lab Notebook (ELN)',
  },
  description:
    'An open electronic lab notebook that stores protocol notes, reagent lots, and serial instrument data directly on your machine.',
  openGraph: {
    title: 'Inquestra: Local-First Electronic Lab Notebook (ELN)',
    description:
      'An open electronic lab notebook that stores protocol notes, reagent lots, and serial instrument data directly on your machine.',
  },
  twitter: {
    title: 'Inquestra: Local-First Electronic Lab Notebook (ELN)',
    description:
      'An open electronic lab notebook that stores protocol notes, reagent lots, and serial instrument data directly on your machine.',
  },
};

export default function MarketingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Inquestra',
    operatingSystem: 'Web Browser (Google Chrome, Microsoft Edge, Chromium)',
    applicationCategory: 'ScientificResearchSoftware',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Browser-based research notebook pairing protocol documentation with chemical storage and serial instrument capture on your local machine.',
  };

  return (
    <div className="font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What is Inquestra?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Inquestra is a browser-based notebook for experimental laboratory work. Researchers run step-by-step protocols alongside chemical aliquot logs and real-time serial instrument capture on their local machine.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is Inquestra free for academic labs and students?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Inquestra is free to use without subscriptions. All notes and instrument telemetry remain stored on your machine.',
                },
              },
              {
                '@type': 'Question',
                name: 'Does Inquestra support molecular biology research?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. It includes built-in primitives for PCR protocols, primer analysis, 2D SMILES rendering via PubChem, and inline DOI lookups through PubMed and Europe PMC.',
                },
              },
              {
                '@type': 'Question',
                name: 'How does Inquestra handle data ownership?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Inquestra stores your unpublished trials and telemetry locally in your browser using IndexedDB. You can export complete records as Markdown notes and CSV files at any time.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is Inquestra easy to learn for students and new researchers?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Inquestra is designed for fast bench onboarding. The notebook editor uses familiar document conventions with slash commands, runs in standard modern web browsers without installing drivers, and includes one-click export protection for shared lab computers.',
                },
              },
            ],
          }),
        }}
      />

      {/* ── 1. Stage Hero (Asymmetric Split, Live Workbench on Fold) ─────────────── */}
      <section className="py-12 sm:py-16 lg:py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-6 text-left">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.06]">
                Local-first notebook for experimental science.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                Write bench protocols directly alongside live USB instrument streams in your browser.
              </p>

              <p className="sr-only">
                Inquestra is an open electronic lab notebook combining protocol tracking, reagent
                lots, 2D molecular structures, and serial instrument recording within a local
                browser workspace.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  href="/app"
                  className="inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground hover:opacity-95 px-6 h-12 rounded-md text-sm font-semibold transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Open Research Workspace
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex justify-center items-center gap-2 px-5 h-12 rounded-md text-sm font-medium border border-border bg-card text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Explore Live Demo
                </Link>
              </div>

              <dl className="grid grid-cols-2 gap-6 pt-6 border-t border-border text-xs">
                <div>
                  <dt className="text-muted-foreground font-medium">Local persistence</dt>
                  <dd className="font-mono text-foreground font-medium mt-1">Browser IndexedDB (offline)</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Instrument bus and seal</dt>
                  <dd className="font-mono text-phosphor font-medium mt-1">W3C Web Serial and SHA-256</dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-7 min-w-0">
              <ScientificWorkspacePreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Unified Notebook Engine (Asymmetric 2-Column Editorial Layout) ──── */}
      <section id="features" className="py-20 sm:py-24 border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-6 items-end mb-12">
            <div className="lg:col-span-7">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                A block-based canvas built for experimental work.
              </h2>
            </div>
            <p className="lg:col-span-5 text-base text-muted-foreground leading-relaxed">
              Protocol timers and molecular calculation blocks execute inside your trial notes rather than across disconnected spreadsheets.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border border border-border rounded-lg overflow-hidden bg-card">
            <div className="lg:col-span-7 p-7 sm:p-9 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">
                  Interactive protocol timers and inline stoichiometry
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                  Embed countdown timers straight into assay and synthesis steps, with KaTeX formula blocks evaluating dilutions and reaction yields beside your observations.
                </p>
              </div>

              <div className="border-t border-border pt-5 grid sm:grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-3.5 rounded-md bg-muted/40 border border-border space-y-1">
                  <div className="text-muted-foreground">Slash command /calc</div>
                  <div className="text-foreground font-semibold">c₁V₁ = c₂V₂ (200 µM mix)</div>
                  <div className="text-phosphor">Evaluated inline during trial</div>
                </div>
                <div className="p-3.5 rounded-md bg-muted/40 border border-border space-y-1">
                  <div className="text-muted-foreground">Active step block</div>
                  <div className="text-foreground font-semibold">56 °C Thermal Hold (04:34 left)</div>
                  <div className="text-primary">Timestamped to audit ledger</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 divide-y divide-border flex flex-col">
              <div className="p-7 sm:p-8 space-y-2.5 flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  Reagent inventory and lot linkage
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Referencing a reagent stock inside a protocol deducts volume automatically and binds its manufacturer lot number to that trial record.
                </p>
              </div>

              <div className="p-7 sm:p-8 space-y-2.5 flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  2D SMILES rendering and DOI citations
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Paste IUPAC names or SMILES strings to inspect molecular geometry alongside inline references pulled from PubMed and Europe PMC.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Dedicated Disciplines (Full-Width Specification Table) ────────────── */}
      <section className="py-20 sm:py-24 border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Structured across laboratory disciplines.
            </h2>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed">
              Shared notebook primitives adapted for both wet-lab synthesis rooms and physical testing bays.
            </p>
          </div>

          <div className="border-y border-border overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3.5 pr-6 text-sm text-foreground font-semibold w-1/3">Domain</th>
                  <th className="py-3.5 px-4 text-sm text-foreground font-semibold">Workflows and signals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 pr-6 font-medium text-foreground align-top">Molecular and Cell Biology</td>
                  <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                    Plasmid cloning records, sequence verification, antibody aliquots, and incubation timers.
                    <span className="block mt-1 font-mono text-xs text-foreground/80">Primer checks, Passaging logs</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 pr-6 font-medium text-foreground align-top">Chemistry and Biochemistry</td>
                  <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                    2D structures rendered from SMILES, reaction stoichiometry, reagent batch logs, and safety sheets.
                    <span className="block mt-1 font-mono text-xs text-foreground/80">SMILES rendering, Kinetic math</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 pr-6 font-medium text-foreground align-top">Biotech and Biopharma R&amp;D</td>
                  <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                    Controlled batch execution with structured protocol checklists, deviation notes, and cryptographic seals.
                    <span className="block mt-1 font-mono text-xs text-foreground/80">Protocol checklists, Audit logs</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 pr-6 font-medium text-foreground align-top">Materials Science and Physics</td>
                  <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                    Tensile stress-strain curves alongside load cell deformation traces and continuum math models.
                    <span className="block mt-1 font-mono text-xs text-foreground/80">Stress-strain traces, Load telemetry</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 pr-6 font-medium text-foreground align-top">Instrumentation and Devices</td>
                  <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                    Differential analog acquisition, thermal chamber profiles, and high-rate serial sensor frames.
                    <span className="block mt-1 font-mono text-xs text-foreground/80">Web Serial DAQ, Waveform CSV</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 pr-6 font-medium text-foreground align-top">Academic Core Facilities</td>
                  <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                    Shared calibration history and searchable protocol archives across rotating lab members.
                    <span className="block mt-1 font-mono text-xs text-foreground/80">Equipment logs, Protocol archives</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 4. Data Integrity & Cryptographic Provenance ───────────────────────── */}
      <section id="provenance" className="py-20 sm:py-24 border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Tamper-evident cryptographic verification.
            </h2>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed">
              When a trial concludes, Inquestra seals the completed record under a SHA-256 digest so post-hoc edits trigger checksum mismatches.
            </p>
          </div>

          <ProvenanceInteractiveDemo />

          <div className="mt-10 border-y border-border py-8 grid md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border gap-y-6">
            <div className="md:col-span-7 md:pr-10 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Canonical SHA-256 sealing with append-only history</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every draft save records an immutable timestamped snapshot so labs inspect diffs anytime. Locking the trial computes a key-sorted SHA-256 digest spanning the document JSON, linked reagent batches, and raw serial telemetry streams.
              </p>
            </div>
            <div className="md:col-span-5 pt-6 md:pt-0 md:pl-10 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Database className="w-4 h-4 text-primary shrink-0" />
                <span>Browser IndexedDB or group PostgreSQL</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Run drafts locally without an account or replicate sealed trials to your team&apos;s PostgreSQL database and export standalone Markdown/CSV bundles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Integrated Bench DAQ (Graphite Code Band) ────────────────────────── */}
      <section id="hardware" className="py-20 sm:py-24 border-b border-border bg-muted/20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Connect bench instruments straight to notes.
            </h2>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed">
              Capture live USB serial telemetry directly into active trial charts via W3C Web Serial with zero desktop drivers.
            </p>
          </div>

          <FirmwareShowcase />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 rounded-lg bg-card border border-border text-sm">
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <span className="text-foreground font-semibold">Supported sensors:</span>
              <span>Load cells, RTD temperature probes, potentiostats, pressure transducers, and USB serial balances</span>
            </div>
            <Link
              href="/hardware"
              className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Hardware DAQ specifications
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Laboratory Architecture & Data Lifecycle (7/5 Split) ──────────────── */}
      <section className="py-20 sm:py-24 border-b border-border scroll-mt-20" id="academic">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Built for offline benches and self-hosted teams.
            </h2>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed">
              Start locally in a single browser tab and optionally connect your own PostgreSQL instance as your group grows.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7 divide-y divide-border border-y border-border">
              <div className="py-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <h3 className="font-semibold text-foreground text-base">Local Notebook Mode</h3>
                  <span className="font-mono text-xs text-primary">Browser IndexedDB</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Execute protocols and record USB serial telemetry completely offline in basement instrumentation rooms or field sites where Wi-Fi drops.
                </p>
              </div>

              <div className="py-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <h3 className="font-semibold text-foreground text-base">Cloud Notebook Mode</h3>
                  <span className="font-mono text-xs text-phosphor">PostgreSQL and RLS</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Synchronize sealed trials to a managed or self-hosted PostgreSQL cluster for shared reagent inventories and role-based sign-off without per-seat fees.
                </p>
              </div>

              <div className="py-6 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-foreground">Archive Export Format</span>
                <span className="font-mono text-muted-foreground">Self-contained ZIP (CommonMark, CSV telemetry, SHA-256 manifest)</span>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 rounded-lg border border-border bg-card space-y-5">
              <h3 className="text-lg font-semibold text-foreground">
                Open data ownership
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Scientific records belong to the group producing them. Inquestra never wraps your experimental files in proprietary binary schemas or gated export tiers.
              </p>
              <dl className="pt-4 border-t border-border divide-y divide-border text-sm">
                <div className="py-3 flex justify-between gap-4">
                  <dt className="text-muted-foreground">Local setup</dt>
                  <dd className="font-mono text-foreground font-medium">Zero accounts</dd>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <dt className="text-muted-foreground">Export standards</dt>
                  <dd className="font-mono text-foreground font-medium">CommonMark, CSV, JSON</dd>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <dt className="text-muted-foreground">Academic access</dt>
                  <dd className="font-mono text-phosphor font-medium">Free core platform</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Pilot Lab Program (5/7 Form Split) ───────────────────────────────── */}
      <section className="py-20 sm:py-24 border-b border-border bg-muted/20" id="pilot">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-4 text-left">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Partner with Inquestra on your bench.
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                We collaborate directly with university labs and R&amp;D groups connecting custom serial hardware or deploying self-hosted PostgreSQL workspaces.
              </p>
              <dl className="pt-4 border-t border-border space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Onboarding review</dt>
                  <dd className="font-mono text-foreground">Within 2 business days</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Academic cost</dt>
                  <dd className="font-mono text-phosphor">$0 (pilot supported)</dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-7 bg-card border border-border rounded-lg p-6 sm:p-8">
              <div className="mb-6 pb-4 border-b border-border text-left">
                <h3 className="text-lg font-semibold text-foreground">
                  Request Pilot Lab Access and Onboarding
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Share your experimental setup and hardware requirements.
                </p>
              </div>
              <PilotInterestForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Final Call to Action ─────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Start organizing trials in one unified notebook.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Free and open source. Launch locally in your browser without registration.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/app"
              className="inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground hover:opacity-95 px-7 h-12 rounded-md text-sm font-semibold transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Launch Research Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex justify-center items-center gap-2 px-6 h-12 rounded-md text-sm font-medium border border-border bg-card text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try DAQ Simulator
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
