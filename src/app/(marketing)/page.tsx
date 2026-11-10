import Link from 'next/link';
import {
  ArrowRight,
  Lock,
  Database,
  Activity,
} from 'lucide-react';
import type { Metadata } from 'next';
import { ScientificWorkspacePreview } from '@/components/marketing/ScientificWorkspacePreview';
import { FirmwareShowcase } from '@/components/marketing/FirmwareShowcase';
import { ProvenanceInteractiveDemo } from '@/components/marketing/ProvenanceInteractiveDemo';
import { PilotInterestForm } from '@/components/marketing/PilotInterestForm';

export const metadata: Metadata = {
  title: 'Inquestra — Free Electronic Lab Notebook (ELN)',
  description:
    'Free electronic lab notebook (ELN) for life sciences, chemistry & engineering. Protocols, chemical inventory, molecular structures & DAQ. Free for all labs.',
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
      'Enterprise-grade Electronic Research Notebook and Laboratory Intelligence Platform for Life Sciences, Chemistry, Biotech, Materials, and Engineering. Integrates protocol execution, chemical inventory LIMS, molecular structures, literature citations, 21 CFR Part 11 provenance, and bench DAQ.',
  };

  return (
    <div className="font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── FAQPage JSON-LD for AEO / AI Answer Engines ───────────────────────────── */}
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
                  text: 'Inquestra is a free, browser-based Electronic Lab Notebook (ELN) for life sciences, chemistry, biotech, materials science, and engineering research. It unifies scientific protocols, chemical inventory LIMS, molecular structure visualization, PubMed and Europe PMC literature citations, 21 CFR Part 11 compliant audit trails, and optional hardware data acquisition in one workspace.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is Inquestra free for academic labs and students?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Inquestra is completely free for individual researchers, students, postdocs, and academic labs. There is no subscription fee, no credit card required, and no per-user licensing cost. The full notebook, chemical inventory LIMS, molecular structure tools, and literature citation manager are free for everyone. Optional institutional features such as self-hosted PostgreSQL and SSO are available for university IT departments.',
                },
              },
              {
                '@type': 'Question',
                name: 'Does Inquestra support molecular biology research?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Inquestra is purpose-built for molecular biology, life sciences, chemistry, biotech, materials science, and engineering — not just hardware labs. It supports PCR protocols, gel electrophoresis documentation, primer and reagent inventory, plasmid and molecule structure visualization using JSME and RDKit, and integration with PubMed and Europe PMC for literature citations.',
                },
              },
              {
                '@type': 'Question',
                name: 'How does Inquestra compare to Benchling, LabArchives, and SciNote?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Inquestra is the only platform in this category that is completely free and covers life sciences, chemistry, biotech, materials science, and engineering in one unified notebook. Benchling is free for academics but focused on molecular biology and genetics (CRISPR, plasmids). LabArchives charges per user and is institution-license-focused. SciNote has a free tier but limits storage and team features. Inquestra uniquely adds hardware DAQ integration, 21 CFR Part 11 provenance, and chemical inventory LIMS at no cost.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is Inquestra easy to learn for students and new researchers?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Inquestra is designed with a zero-learning-curve goal for students and new researchers. The notebook editor uses familiar document conventions, the slash command menu provides instant access to all block types, and no IT setup or software installation is required — just open the browser and start a protocol. Most researchers are productive within minutes of first use.',
                },
              },
            ],
          }),
        }}
      />

      {/* ── 1. Hero Section ────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-38 lg:pb-28 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-foreground mb-6 leading-[1.12] text-balance">
            One unified notebook for your protocols, molecules, inventory, and data.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed text-balance">
            Protocol execution, chemical inventory, molecular structures, literature citations, and
            bench DAQ — in one reproducible, audit-ready research environment.
          </p>

          {/* ── AEO Definition Block — crawlable, visually subtle ─────────────────── */}
          <p className="sr-only">
            Inquestra is a free electronic lab notebook (ELN) for life sciences, chemistry, biotech,
            materials science, and engineering research. It unifies scientific protocols, chemical
            inventory LIMS, molecular structure visualization, PubMed and Europe PMC literature
            citations, 21 CFR Part 11 audit trails, and optional hardware data acquisition in one
            browser-based workspace — free for academic labs, students, and researchers with no credit
            card or IT setup required.
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

      {/* ── 2. The 6 Core Pillars of Inquestra ────────────────────────────────────────── */}
      <section id="features" className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Left: primary callout */}
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
                Every stage of the scientific lifecycle in one place.
              </h2>
              <p className="text-muted-foreground text-sm mt-4 leading-relaxed">
                Scientific discoveries happen across wet lab synthesis, molecular assays, mathematical
                modeling, inventory management, and physical measurements. Inquestra provides native
                scientific tools for every phase — without stitching together a five-app stack.
              </p>
              <Link
                href="/app"
                className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-foreground hover:text-foreground/70 transition-colors"
              >
                Open the workspace <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right: vertical feature list */}
            <div className="border-l border-border pl-8 space-y-6">
              <div>
                <p className="text-sm font-medium text-foreground">Scientific Protocol Canvas</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  TipTap block editor with native SMILES structures, nucleotide sequences, KaTeX
                  equations, and live execution timers. Commands: /molecule · /sequence · /math
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">SOPs &amp; Interactive Step Timers</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Reproducible checklists with synchronized incubation, centrifuge, and wash timers.
                  Commands: /protocol · /timer · /checklist
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">LIMS &amp; Chemical Inventory</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Track reagents, antibodies, primers, and cell lines. Inline /reagent deduction
                  automates chain-of-custody at bench execution.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">PubMed &amp; Europe PMC Citations</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Search peer-reviewed literature in context. Insert verified DOIs and generate
                  formatted bibliographies (Nature, APA, IEEE). Commands: /citation
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Audit Trails &amp; Version History</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Time-stamped versioning captures procedure edits, reagent calibrations, and author attestation.
                  Standards: 21 CFR § 11 · RFC 3161
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Integrated Instrument DAQ (Optional)</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Connect biopotentials, load cells, and pressure sensors via W3C Web Serial — no
                  drivers or terminal scripts. Transports: Web Serial · CSV Ingestion
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Dedicated Disciplines ──────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-border bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
              Purpose-built for your laboratory workflow.
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Whether you are running PCR gels, synthesizing compounds, testing polymer mechanics, or
              measuring electrical biopotentials, Inquestra adapts to your domain.
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
                    Plasmid cloning, DNA/RNA sequence verification, antibody aliquot management (-80°C), cell culture feeding timers.
                    <span className="block mt-1 font-mono">Primer design · Cell passaging · Western blots</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">Chemistry &amp; Biochemistry</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                    2D chemical structures from SMILES, stoichiometry computation, reagent lot tracking, GHS safety data sheets.
                    <span className="block mt-1 font-mono">SMILES structures · Enzyme kinetics · GHS safety</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">Biotech &amp; Biopharma R&amp;D</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                    Batch records, SOP checklists, real-time deviation logging, 21 CFR Part 11 audit trails with dual-signature sign-offs.
                    <span className="block mt-1 font-mono">SOP management · Deviation logs · 21 CFR § 11</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">Materials Science &amp; Physics</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                    Tensile test stress-strain curves, load cell deformation recording, continuum mechanics modeling with KaTeX.
                    <span className="block mt-1 font-mono">Stress-strain curves · Load cells · KaTeX modeling</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">Bioengineering &amp; Devices</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                    Biopotential telemetry (EMG, ECG), hemodynamic waveforms, design history files (DHF) with zero loose CSV files.
                    <span className="block mt-1 font-mono">Web Serial DAQ · Biopotentials · Design history files</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">Academic Core Facilities</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                    Graduate student onboarding, shared equipment clearances, institutional research provenance across grants.
                    <span className="block mt-1 font-mono">Equipment tracking · Protocol sharing · Grant archives</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 4. The Fragmented Reality vs Inquestra ─────────────────────────────────── */}
      <section className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
              Eliminate the five-app shuffle in your lab.
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Most research groups waste hours stitching together office document software, unsearchable paper binders,
              scattered inventory sheets, and separate reference managers. Here is the difference Inquestra makes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* The Fragmented Reality */}
            <div className="bg-card border border-border p-7 rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-mono uppercase text-muted-foreground font-semibold">
                  Fragmented Laboratory Software
                </span>
                <span className="text-[10px] font-mono text-critical bg-critical/10 border border-critical/20 px-2 py-0.5 rounded">
                  High Error Rate
                </span>
              </div>
              <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
                <div className="p-3.5 bg-background border border-border rounded-lg">
                  <span className="font-semibold text-foreground block mb-1 text-sm font-sans">
                    Generic Document Editors (Word, Notion, Google Docs)
                  </span>
                  No native chemistry, molecular structure drawing, or biological sequence support. Equations require clumsy image
                  copy-pasting, and incubation timers exist only on phones or kitchen timers.
                </div>
                <div className="p-3.5 bg-background border border-border rounded-lg">
                  <span className="font-semibold text-foreground block mb-1 text-sm font-sans">
                    Disconnected Spreadsheets for Reagent Inventory
                  </span>
                  Chemical lot numbers, antibody aliquots, and buffer volumes tracked in spreadsheets that are never updated
                  at the moment of bench execution, leading to expired stock errors and failed experiments.
                </div>
                <div className="p-3.5 bg-background border border-border rounded-lg">
                  <span className="font-semibold text-foreground block mb-1 text-sm font-sans">
                    Isolated Literature Silos (Zotero, Mendeley, Desktop PDFs)
                  </span>
                  Theoretical rationale and published protocols live in separate citation managers, forcing researchers to
                  manually copy DOIs and lose track of protocol references over time.
                </div>
                <div className="p-3.5 bg-background border border-border rounded-lg">
                  <span className="font-semibold text-foreground block mb-1 text-sm font-sans">
                    Unverified Desktop CSV Files &amp; Terminal Scripts
                  </span>
                  Instrument data saved to loose desktop folders without cryptographic hashing or audit trails,
                  creating severe reproducibility vulnerabilities during peer review or regulatory audits.
                </div>
              </div>
            </div>

            {/* The Inquestra Standard */}
            <div className="bg-card border border-border p-7 rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-mono uppercase text-phosphor font-semibold">
                  The Inquestra Integrated Standard
                </span>
                <span className="text-[10px] font-mono text-phosphor bg-phosphor/10 border border-phosphor/30 px-2 py-0.5 rounded font-semibold">
                  Unified Research OS
                </span>
              </div>
              <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
                <div className="p-3.5 bg-background border border-border rounded-lg">
                  <span className="font-semibold text-foreground block mb-1 text-sm font-sans">
                    Native Scientific Protocol Canvas
                  </span>
                  SMILES 2D molecular structures, nucleotide color-coded DNA/RNA sequences, KaTeX mathematical equations,
                  and live execution timers integrated directly into notes.
                </div>
                <div className="p-3.5 bg-background border border-border rounded-lg">
                  <span className="font-semibold text-foreground block mb-1 text-sm font-sans">
                    Inline LIMS &amp; Reagent Deduction
                  </span>
                  Typing <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-semibold">/reagent</code> automatically
                  deducts volumes from your inventory, checking expiration dates and logging consumption directly in the note.
                </div>
                <div className="p-3.5 bg-background border border-border rounded-lg">
                  <span className="font-semibold text-foreground block mb-1 text-sm font-sans">
                    Direct PubMed &amp; Europe PMC Citation Integration
                  </span>
                  Search peer-reviewed literature in real time. Link scientific rationale, protocol citations, and DOI references
                  directly to experimental steps with automatic bibliography formatting.
                </div>
                <div className="p-3.5 bg-background border border-border rounded-lg">
                  <span className="font-semibold text-foreground block mb-1 text-sm font-sans">
                    Tamper-Evident Record of Execution
                  </span>
                  Completed trials seal protocol text, reagent lots, and raw telemetry into an immutable,
                  21 CFR Part 11 compliant audit log with non-repudiation.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Regulatory Compliance & Data Integrity ──────────────────────── */}
      <section id="provenance" className="py-24 border-b border-border bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
              Regulatory compliance &amp; verifiable integrity.
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Scientific trust is earned through verification. Inquestra seals completed trials so protocol procedures,
              chemical lots, and telemetry samples maintain an unalterable chain of custody.
            </p>
          </div>

          <ProvenanceInteractiveDemo />

          {/* 21 CFR Part 11 Technical Controls — horizontal spec strip */}
          <div className="mt-14 border-t border-b border-border py-8 flex flex-wrap gap-y-8">
            <div className="flex-1 min-w-56 pr-8 border-r border-border last:border-r-0">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                21 CFR § 11.10(b)
              </p>
              <p className="text-sm font-medium text-foreground mb-1">Audit Trails</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Computer-generated, time-stamped records independently log the date, time, and operator of all
                trial additions, calibrations, and seals. Modifications preserve complete differential histories.
              </p>
            </div>
            <div className="flex-1 min-w-56 px-8 border-r border-border last:border-r-0">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                21 CFR § 11.50
              </p>
              <p className="text-sm font-medium text-foreground mb-1">Electronic Signatures</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manifests display the printed name of the signer, date/time stamp, and the explicit meaning of the
                signature (Author Execution, Technical Review, or Principal Investigator Sign-Off).
              </p>
            </div>
            <div className="flex-1 min-w-56 pl-8">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                FAIR Data Principles
              </p>
              <p className="text-sm font-medium text-foreground mb-1">Local-First &amp; Offline</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Full offline continuity inside Faraday cages and basement labs via browser IndexedDB.
                Export to open formats (CSV, EDF, JSON with cryptographic manifest) with zero platform lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Integrated Bench DAQ ──────────────────────────────────────────────────── */}
      <section id="hardware" className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-muted text-muted-foreground text-xs font-mono uppercase tracking-wider mb-4">
              <Activity className="w-3.5 h-3.5 text-phosphor" />
              <span>Optional Hardware Ingestion</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
              When your study needs physical data, connect directly.
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              If your research involves physical sensors &mdash; spectrophotometers, balances, load cells, temperature arrays,
              or biopotentials &mdash; Inquestra can ingest continuous telemetry straight into your notebook note via browser Web Serial.
              No custom drivers or terminal scripts required.
            </p>
          </div>

          <FirmwareShowcase />

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-muted/10 border border-border text-xs font-mono">
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


      {/* ── 6b. Free for Academic Research ──────────────────────────────────────────── */}
      <section className="py-24 border-b border-border" id="academic">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight mb-4">
              Free for every researcher. No exceptions.
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Inquestra is free for individual researchers, students, postdoctoral fellows, academic
              labs, and university research groups — permanently, with no subscription, no credit
              card, and no per-user licensing fee.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start mb-20">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">What is included for free</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span>Full scientific protocol notebook with rich text, tables, equations, molecular structures, and timers</span></li>
                <li className="flex gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span>Chemical and biological inventory LIMS — unlimited reagents, standards, and samples</span></li>
                <li className="flex gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span>Molecular structure drawing and visualization (JSME, RDKit-compatible)</span></li>
                <li className="flex gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span>PubMed and Europe PMC literature citation manager</span></li>
                <li className="flex gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span>21 CFR Part 11 compliant audit trails and cryptographic provenance</span></li>
                <li className="flex gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span>Hardware DAQ integration for Arduino, ESP32, and USB instruments</span></li>
                <li className="flex gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span>PDF and CSV export — no data lock-in</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Built for academic environments</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Inquestra is designed for the realities of academic research: rotating undergraduate
                and graduate students who need to get productive immediately, postdoctoral researchers
                managing multiple concurrent experiments, and professors who need reproducible,
                audit-ready documentation for grant reporting and publication.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No IT department required. No software installation. Open a browser, create a trial,
                and start documenting — your protocol history, inventory, and observations are saved
                automatically and downloadable at any time.
              </p>
            </div>
          </div>

          {/* ── ELN Comparison Table ─────────────────────────────────────────────────── */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
              Inquestra vs Benchling vs LabArchives vs SciNote
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-foreground font-semibold">Feature</th>
                    <th className="text-left py-3 px-4 text-emerald-500 font-semibold">Inquestra</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Benchling</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">LabArchives</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">SciNote</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 px-4 text-foreground font-medium">Price for academics</td>
                    <td className="py-3 px-4 text-emerald-500 font-semibold">Free, always</td>
                    <td className="py-3 px-4 text-muted-foreground">Free academic tier (limited)</td>
                    <td className="py-3 px-4 text-muted-foreground">Institution license required</td>
                    <td className="py-3 px-4 text-muted-foreground">Free tier (storage limits)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground font-medium">Scientific disciplines</td>
                    <td className="py-3 px-4 text-emerald-500 font-semibold">Life sciences, chemistry, biotech, materials, engineering</td>
                    <td className="py-3 px-4 text-muted-foreground">Molecular biology, genetics, biotech</td>
                    <td className="py-3 px-4 text-muted-foreground">General science (all disciplines)</td>
                    <td className="py-3 px-4 text-muted-foreground">Life sciences, medical research</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground font-medium">Learning curve for students</td>
                    <td className="py-3 px-4 text-emerald-500 font-semibold">Minimal — productive in minutes</td>
                    <td className="py-3 px-4 text-muted-foreground">Moderate — specialized UI</td>
                    <td className="py-3 px-4 text-muted-foreground">Low — simple document-based</td>
                    <td className="py-3 px-4 text-muted-foreground">Low to moderate</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground font-medium">Hardware DAQ integration</td>
                    <td className="py-3 px-4 text-emerald-500 font-semibold">Yes — Arduino, ESP32, USB instruments</td>
                    <td className="py-3 px-4 text-muted-foreground">No</td>
                    <td className="py-3 px-4 text-muted-foreground">No</td>
                    <td className="py-3 px-4 text-muted-foreground">No</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground font-medium">Chemical inventory LIMS</td>
                    <td className="py-3 px-4 text-emerald-500 font-semibold">Yes — built-in, free</td>
                    <td className="py-3 px-4 text-muted-foreground">Yes (Benchling Registry)</td>
                    <td className="py-3 px-4 text-muted-foreground">Limited</td>
                    <td className="py-3 px-4 text-muted-foreground">Yes (inventory module)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground font-medium">21 CFR Part 11 / audit trail</td>
                    <td className="py-3 px-4 text-emerald-500 font-semibold">Yes — cryptographic provenance</td>
                    <td className="py-3 px-4 text-muted-foreground">Enterprise tier only</td>
                    <td className="py-3 px-4 text-muted-foreground">Yes</td>
                    <td className="py-3 px-4 text-muted-foreground">Yes</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground font-medium">Setup required</td>
                    <td className="py-3 px-4 text-emerald-500 font-semibold">None — browser only</td>
                    <td className="py-3 px-4 text-muted-foreground">Account + onboarding</td>
                    <td className="py-3 px-4 text-muted-foreground">Institution account</td>
                    <td className="py-3 px-4 text-muted-foreground">Account required</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Pilot Lab Program ─────────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-border bg-muted/10" id="pilot">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-5xl font-normal text-foreground tracking-tight mb-4">
              Partner with Inquestra on your bench.
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We are onboarding scientific research groups and biotech teams for our pilot program.
              Work directly with our engineering team to import your existing protocols, calibrate custom instrument profiles,
              and configure team workspace permissions.
            </p>
            {/* Pilot value — plain list, no cards */}
            <ul className="mt-8 text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
              <li>— Individual researchers retain full free access to the core notebook, LIMS, and local DAQ tools.</li>
              <li>— Collaborate directly with the engineers building Inquestra to tailor custom protocol blocks and data export schemas.</li>
              <li>— Assistance setting up self-hosted institutional PostgreSQL instances, team SSO, and importing existing lab SOPs.</li>
            </ul>
          </div>

          {/* Clean Intake Form */}
          <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6 pb-4 border-b border-border text-left">
              <h3 className="text-base font-semibold text-foreground">
                Request Pilot Lab Access &amp; Lab Onboarding
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tell us about your research focus, lab setup, and protocol needs. Inquiries are reviewed within 48 hours.
              </p>
            </div>
            <PilotInterestForm />
          </div>
        </div>
      </section>

      {/* ── 8. Final Call to Action ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight mb-4">
            Start organizing your research in one unified notebook.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            No mandatory sales calls. No credit card required. Launch the workspace right in your browser.
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
