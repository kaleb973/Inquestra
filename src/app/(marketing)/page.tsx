import Link from 'next/link';
import {
  ArrowRight,
  Database,
  ShieldCheck,
  HardDrive,
  Check,
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
    'An open electronic lab notebook that stores your notes, materials, and serial instrument data directly on your machine.',
  openGraph: {
    title: 'Inquestra: Local-First Electronic Lab Notebook (ELN)',
    description:
      'An open electronic lab notebook that stores your notes, materials, and serial instrument data directly on your machine.',
  },
  twitter: {
    title: 'Inquestra: Local-First Electronic Lab Notebook (ELN)',
    description:
      'An open electronic lab notebook that stores your notes, materials, and serial instrument data directly on your machine.',
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
      'Browser-based research notebook that combines protocol tracking, chemical storage, and serial instrumentation on your local machine.',
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
                  text: 'Inquestra is a browser-based notebook for experimental laboratory work. It lets researchers run step-by-step protocols, track chemical aliquots, and capture real-time measurements from bench instruments on their local machine.',
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
                  text: 'Yes. It includes built-in primitives for PCR protocols, primer tracking, 2D SMILES rendering via PubChem, and inline DOI lookups through PubMed and Europe PMC.',
                },
              },
              {
                '@type': 'Question',
                name: 'How does Inquestra handle data ownership?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Inquestra stores your unpublished experiments and telemetry locally in your browser using IndexedDB. You can export complete records as Markdown notes and CSV files at any time.',
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
                Execute protocols, track reagent lots, and capture live USB instruments in one workspace.
              </p>

              <p className="sr-only">
                Inquestra is an open-source electronic lab notebook for experimental science. It combines
                protocol tracking, reagent lots, 2D molecular structures, and serial instrument recording
                within a local browser workspace.
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

              <dl className="grid grid-cols-3 gap-4 pt-6 border-t border-border text-xs">
                <div>
                  <dt className="text-muted-foreground font-medium">Storage</dt>
                  <dd className="font-mono text-foreground font-medium mt-1">Browser IndexedDB</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Hardware</dt>
                  <dd className="font-mono text-foreground font-medium mt-1">W3C Web Serial</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Integrity</dt>
                  <dd className="font-mono text-phosphor font-medium mt-1">SHA-256 Digest</dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-7 min-w-0">
              <ScientificWorkspacePreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Unified Notebook Engine (Asymmetric 1px Ruled Bento) ───────────────── */}
      <section id="features" className="py-20 sm:py-24 border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-6 items-end mb-12">
            <div className="lg:col-span-7">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                A block-based canvas built for experimental work.
              </h2>
            </div>
            <p className="lg:col-span-5 text-base text-muted-foreground leading-relaxed">
              Embed synchronized protocol timers, reagent deductions, molecular structures, and literature DOIs straight inside your lab notes.
            </p>
          </div>

          <div className="grid md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border border border-border rounded-lg overflow-hidden bg-card">
            <div className="md:col-span-6 p-7 sm:p-8 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                Step timers and SOP checklists
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Run step-by-step protocol checklists with synchronized countdown timers for incubations and wash steps. Inline KaTeX equations calculate dilutions and stoichiometry beside every note.
              </p>
            </div>

            <div className="md:col-span-3 p-7 sm:p-8 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                Reagents and lot tracking
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Log chemical batches, antibody aliquots, and primer stocks. Protocol deductions record manufacturer lots automatically.
              </p>
            </div>

            <div className="md:col-span-3 p-7 sm:p-8 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                Molecules and DOI lookup
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Render 2D chemical structures from SMILES strings, calculate primer melting temperatures, and cite PubMed DOIs inline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Dedicated Disciplines (Full-Width Benchling Specification Table) ───── */}
      <section className="py-20 sm:py-24 border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Structured across laboratory disciplines.
            </h2>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed">
              From molecular assays and chemical synthesis to physical instrumentation and core facilities.
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
                    Plasmid cloning, DNA sequence verification, antibody aliquot tracking, and cell culture timers.
                    <span className="block mt-1 font-mono text-xs text-foreground/80">Primer design, Cell passaging</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 pr-6 font-medium text-foreground align-top">Chemistry and Biochemistry</td>
                  <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                    2D chemical structures from SMILES, stoichiometry computation, reagent lot tracking, and safety sheets.
                    <span className="block mt-1 font-mono text-xs text-foreground/80">SMILES structures, Kinetic math</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 pr-6 font-medium text-foreground align-top">Biotech and Biopharma R&amp;D</td>
                  <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                    Batch records, SOP checklists, real-time deviation logging, and cryptographic audit records.
                    <span className="block mt-1 font-mono text-xs text-foreground/80">SOP checklists, Audit logging</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 pr-6 font-medium text-foreground align-top">Materials Science and Physics</td>
                  <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                    Tensile stress-strain curves, load cell deformation recording, and continuum modeling.
                    <span className="block mt-1 font-mono text-xs text-foreground/80">Stress-strain curves, Load telemetry</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 pr-6 font-medium text-foreground align-top">Instrumentation and Devices</td>
                  <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                    Differential analog telemetry, thermal profiles, design records, and raw sensor streams.
                    <span className="block mt-1 font-mono text-xs text-foreground/80">Web Serial DAQ, Waveform logs</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 pr-6 font-medium text-foreground align-top">Academic Core Facilities</td>
                  <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                    Student onboarding, shared instrument logs, and cross-project protocol archives.
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

          <div className="mt-12 border-y border-border py-8 grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border gap-y-6">
            <div className="md:pr-8 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>SHA-256 record sealing</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Computes a deterministic digest covering protocol text, material lots, and logged sensor arrays.
              </p>
            </div>
            <div className="pt-6 md:pt-0 md:px-8 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Database className="w-4 h-4 text-primary shrink-0" />
                <span>Append-only revision history</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every draft save records a timestamped revision snapshot so labs can inspect diffs and restore prior states.
              </p>
            </div>
            <div className="pt-6 md:pt-0 md:pl-8 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <HardDrive className="w-4 h-4 text-primary shrink-0" />
                <span>Local mode or lab database</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Draft in browser IndexedDB with zero accounts, or sync to your lab&apos;s PostgreSQL server and export Markdown/CSV bundles.
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
              Stream continuous readings over browser Web Serial from balances, temperature probes, load cells, and microcontrollers without desktop drivers.
            </p>
          </div>

          <FirmwareShowcase />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 rounded-lg bg-card border border-border text-sm">
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <span className="text-foreground font-semibold">Supported modalities:</span>
              <span>Load cells, temperature probes, differential channels, pressure sensors, bench meters</span>
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
                  <h3 className="font-semibold text-foreground text-base">1. At the bench (Local Notebook)</h3>
                  <span className="font-mono text-xs text-primary">Browser IndexedDB</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Draft protocols, deduct reagents, and capture USB serial telemetry completely offline in culture hoods, cold rooms, or field stations.
                </p>
              </div>

              <div className="py-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <h3 className="font-semibold text-foreground text-base">2. In the laboratory (Cloud Notebook)</h3>
                  <span className="font-mono text-xs text-phosphor">PostgreSQL &amp; RLS</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connect to self-hosted or managed PostgreSQL for shared chemical inventories, equipment calibration logs, and role-based access without per-seat fees.
                </p>
              </div>

              <div className="py-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <h3 className="font-semibold text-foreground text-base">3. Publication and archiving</h3>
                  <span className="font-mono text-xs text-muted-foreground">CommonMark &amp; CSV</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Export complete trials as self-contained ZIP bundles with readable Markdown, raw CSV streams, and verifiable SHA-256 manifests.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 rounded-lg border border-border bg-card space-y-5">
              <h3 className="text-lg font-semibold text-foreground">
                Open infrastructure principles
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Research records belong to the laboratory producing them, free from proprietary formats or lock-in.
              </p>
              <ul className="space-y-3.5 pt-4 border-t border-border text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-phosphor shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">No account required:</strong> Launch the workspace on any bench computer immediately.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-phosphor shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Open standard formats:</strong> CommonMark, CSV, and JSON keep trials readable for decades.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-phosphor shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Free for academia:</strong> Core ELN, LIMS, and Web Serial tools remain open for students and PIs.
                  </span>
                </li>
              </ul>
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
                We collaborate with academic groups and biotech teams to wire custom bench hardware, import existing SOPs, and deploy group PostgreSQL workspaces.
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
