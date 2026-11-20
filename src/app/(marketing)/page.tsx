import Link from 'next/link';
import {
  ArrowRight,
  Database,
  ShieldCheck,
  HardDrive,
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

      {/* FAQPage JSON-LD for Search & AI Answer Engines */}
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

      {/* ── 1. Hero Section ────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.12] text-balance">
            The local-first notebook for experimental science.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed text-balance">
            A browser-native research notebook with built-in serial instrument capture. Your experimental records never leave your machine.
          </p>

          {/* AEO Definition Block */}
          <p className="sr-only">
            Inquestra is an open-source electronic lab notebook for experimental science. It combines
            protocol tracking, reagent lots, 2D molecular structures, and serial instrument recording
            within a local browser workspace.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-14">
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-7 py-3.5 rounded text-sm font-semibold transition-colors shadow-sm"
            >
              Open Research Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded text-sm font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              Explore Interactive Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Live Interactive Workspace Preview */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <ScientificWorkspacePreview />
        </div>
      </section>

      {/* ── 2. Unified Notebook Engine ────────────────────────────────────────────── */}
      <section id="features" className="py-24 border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              A block-based canvas built for experimental research.
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Standard text editors ignore experimental workflows. Inquestra embeds interactive step timers, chemical structures, and literature citations directly into your notes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border border-border rounded-xl overflow-hidden bg-card/40">
            {/* Capability 1: Protocol Execution */}
            <div className="p-6 sm:p-8 space-y-3">
              <span className="font-mono text-xs text-primary font-semibold uppercase tracking-wider">Protocol Execution</span>
              <h3 className="text-lg font-semibold text-foreground">
                Step Timers &amp; SOP Checklists
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Step-by-step procedure checklists with synchronized countdown timers for incubation periods and wash steps. Inline KaTeX formulas calculate dilution factors and reaction stoichiometry directly inside your protocol notes.
              </p>
            </div>

            {/* Capability 2: Chemical & Biological LIMS */}
            <div className="p-6 sm:p-8 space-y-3">
              <span className="font-mono text-xs text-emerald-500 font-semibold uppercase tracking-wider">Inventory LIMS</span>
              <h3 className="text-lg font-semibold text-foreground">
                Reagents &amp; Lot Tracking
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Log chemical batches, antibody aliquots, and primer stocks across cold storage or room temperature. Deducting materials during an experiment records manufacturer lot numbers and balances automatically.
              </p>
            </div>

            {/* Capability 3: Molecular Primitives & Citations */}
            <div className="p-6 sm:p-8 space-y-3">
              <span className="font-mono text-xs text-sky-500 font-semibold uppercase tracking-wider">Chemical &amp; Sequence Tools</span>
              <h3 className="text-lg font-semibold text-foreground">
                Molecules &amp; DOI Citations
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Draw 2D chemical structures from SMILES strings, calculate oligonucleotide melting temperatures, and link literature DOIs in context.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Dedicated Disciplines ──────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-border bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Validated across laboratory disciplines.
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              From molecular biology assays and chemical synthesis to physical testing and instrumentation.
            </p>
          </div>

          <div className="border border-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-5 py-3 text-xs font-mono text-muted-foreground font-normal uppercase tracking-wider w-1/3">Domain</th>
                  <th className="text-left px-5 py-3 text-xs font-mono text-muted-foreground font-normal uppercase tracking-wider">Example workflows &amp; signals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">Molecular &amp; Cell Biology</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                    Plasmid cloning, DNA sequence verification, antibody aliquot tracking, and cell culture feeding timers.
                    <span className="block mt-1 font-mono">Primer design · Cell culture passaging</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">Chemistry &amp; Biochemistry</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                    2D chemical structures from SMILES, stoichiometry computation, reagent lot tracking, and GHS safety data sheets.
                    <span className="block mt-1 font-mono">SMILES structures · Kinetic calculations</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">Biotech &amp; Biopharma R&amp;D</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                    Batch records, SOP checklists, real-time deviation logging, and cryptographic audit records.
                    <span className="block mt-1 font-mono">SOP checklists · Audit logging</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">Materials Science &amp; Physics</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                    Tensile test stress-strain curves, load cell deformation recording, and continuum mechanics modeling.
                    <span className="block mt-1 font-mono">Stress-strain curves · Material deformation</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">Instrumentation &amp; Devices</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                    Biopotential telemetry (EMG, ECG), hemodynamic waveforms, design records, and raw sensor logs.
                    <span className="block mt-1 font-mono">Web Serial DAQ · Waveform telemetry</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">Academic Core Facilities</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                    Student onboarding, shared equipment schedules, and keeping protocol records organized across projects.
                    <span className="block mt-1 font-mono">Equipment logging · Protocol archives</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 4. Data Integrity & Cryptographic Provenance ───────────────────────── */}
      <section id="provenance" className="py-24 border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Tamper-evident cryptographic verification.
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              When an experiment concludes, Inquestra cryptographically seals the completed record. Completed protocol entries and recorded sensor data cannot be modified without failing checksum verification.
            </p>
          </div>

          <ProvenanceInteractiveDemo />

          {/* Three Core Data Guarantees */}
          <div className="mt-14 border-t border-b border-border py-8 flex flex-wrap gap-y-8">
            <div className="flex-1 min-w-56 pr-8 border-r border-border last:border-r-0">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                SHA-256 Record Sealing
              </p>
              <p className="text-sm font-medium text-foreground mb-1">Cryptographic Fingerprint</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When an experiment concludes, Inquestra computes a SHA-256 digest covering your notebook text and captured sensor values. Any subsequent modification triggers an immediate checksum mismatch.
              </p>
            </div>
            <div className="flex-1 min-w-56 px-8 border-r border-border last:border-r-0">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-primary" />
                Append-Only History
              </p>
              <p className="text-sm font-medium text-foreground mb-1">Traceable Revisions</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every draft save generates an auditable, timestamped revision snapshot.
                You can review the full differential history and restore previous states at any time.
              </p>
            </div>
            <div className="flex-1 min-w-56 pl-8">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-primary" />
                Local &amp; Lab Ownership
              </p>
              <p className="text-sm font-medium text-foreground mb-1">Local Mode or Lab DB</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Draft notes and active sensor capture run locally in browser IndexedDB without mandatory accounts. Connect to your lab&apos;s PostgreSQL database or export signed Markdown and CSV bundles when ready to archive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Integrated Bench DAQ ──────────────────────────────────────────────────── */}
      <section id="hardware" className="py-24 border-b border-border bg-muted/10 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Connect bench instruments directly to your notes.
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Ingest continuous sensor data straight into your notebook via browser Web Serial. Connect analytical balances, temperature probes, load cells, or custom microcontrollers without installing device drivers.
            </p>
          </div>

          <FirmwareShowcase />

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-background border border-border text-xs font-mono">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="text-foreground font-semibold">Supported Modalities:</span>
              <span>Load Cells · Temperature Probes · Biopotentials (EMG/ECG) · Pressure Sensors · Bench Meters</span>
            </div>
            <Link
              href="/hardware"
              className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold"
            >
              Explore Full Hardware DAQ Specifications
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Laboratory Architecture & Data Lifecycle ──────────────────────────── */}
      <section className="py-24 border-b border-border scroll-mt-20" id="academic">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Built for offline laboratory benches and self-hosted research teams.
            </h2>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed">
              Most laboratory notebooks force research data into proprietary clouds behind recurring subscriptions.
              Inquestra gives individual scientists a zero-install local workspace, with optional PostgreSQL synchronization for collaborative research groups.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Visual Lifecycle Flow */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-xl border border-border bg-card/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-foreground">1. At the Bench (Zero-Install Local Mode)</span>
                  <span className="text-primary text-[11px]">Browser IndexedDB</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Draft protocols, track reagent deductions, and log USB serial telemetry directly in your browser. Runs completely offline in tissue culture hoods, cold rooms, or field stations without sign-up or network access.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border bg-card/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-foreground">2. In the Laboratory (Team Collaboration)</span>
                  <span className="text-emerald-500 text-[11px]">PostgreSQL &amp; RLS</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Connect your group to a self-hosted or managed PostgreSQL instance for centralized reagent inventory, shared equipment calibration logs, and role-based permissions without per-user licensing fees.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border bg-card/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-foreground">3. For Publication &amp; Archiving (Open Portability)</span>
                  <span className="text-sky-500 text-[11px]">CommonMark &amp; CSV</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Export complete experiments as self-contained ZIP packages containing human-readable Markdown notes, raw sensor CSV files, and SHA-256 checksums that any collaborator or reviewer can verify from the command line.
                </p>
              </div>
            </div>

            {/* Right Column: Open-Source Principles Card */}
            <div className="lg:col-span-5 p-6 rounded-xl border border-border bg-muted/20 space-y-4 text-xs">
              <h3 className="text-sm font-semibold text-foreground">
                Why we built an open, local-first notebook
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Academic research and early-stage biotechnology thrive when experimental records belong entirely to the laboratory producing them.
              </p>
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-start gap-2.5">
                  <span className="text-primary font-mono font-bold">✓</span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">No account required:</strong> Open the app URL on any bench computer and start executing protocols immediately.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-primary font-mono font-bold">✓</span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">No vendor lock-in:</strong> Open standard schemas (CommonMark, CSV, JSON) ensure your research remains readable decades from now.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-primary font-mono font-bold">✓</span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Free for academia:</strong> All core research tools are open source and free for students, postdocs, and PIs.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Pilot Lab Program ─────────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-border bg-muted/10" id="pilot">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
              Partner with Inquestra on your bench.
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We collaborate directly with academic research groups and biotech teams to connect custom bench hardware, import existing protocols, or deploy dedicated team instances.
            </p>
          </div>

          {/* Clean Intake Form */}
          <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6 pb-4 border-b border-border text-left">
              <h3 className="text-base font-semibold text-foreground">
                Request Pilot Lab Access &amp; Lab Onboarding
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tell us about your experimental setup. We review inquiries within two business days.
              </p>
            </div>
            <PilotInterestForm />
          </div>
        </div>
      </section>

      {/* ── 8. Final Call to Action ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
            Start organizing your research in one unified notebook.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Free and open source. Start drafting immediately in your browser.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-8 py-3.5 rounded text-sm font-semibold transition-colors shadow-sm"
            >
              Launch Research Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-3.5 rounded text-sm font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              Try In-Browser DAQ Simulator
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
