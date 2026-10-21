import Link from 'next/link';
import {
  ArrowRight,
  FlaskConical,
  Boxes,
  BookOpen,
  ShieldCheck,
  Activity,
  Check,
  CheckCircle2,
  Clock,
  Dna,
  Sigma,
  FileCode2,
  Scale,
  HeartPulse,
  Lock,
  Database,
  Sparkles,
  Layers,
  Microscope,
  Atom,
  Building2,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';
import { ScientificWorkspacePreview } from '@/components/marketing/ScientificWorkspacePreview';
import { FirmwareShowcase } from '@/components/marketing/FirmwareShowcase';
import { ProvenanceInteractiveDemo } from '@/components/marketing/ProvenanceInteractiveDemo';
import { PilotInterestForm } from '@/components/marketing/PilotInterestForm';

export const metadata: Metadata = {
  title: 'Inquestra — Modern Electronic Lab Notebook for Life Sciences, Chemistry & Engineering',
  description:
    'The complete Electronic Research Notebook (ERN) for scientific discovery. Unify protocols, chemical inventory LIMS, molecular structures, literature citations, 21 CFR Part 11 provenance, and bench DAQ in one reproducible workspace.',
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

      {/* ── 1. Hero Section ────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-38 lg:pb-28 border-b border-border bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Scientific Category Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/80 border border-border text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-phosphor animate-pulse" />
            <span>Electronic Lab Notebook · Life Sciences, Chemistry &amp; Engineering · Open-Core</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-foreground mb-6 leading-[1.12] text-balance">
            One unified notebook for your protocols, molecules, inventory, and data.
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed text-balance">
            Replace the tangle of paper binders, generic document apps, disconnected spreadsheets, and one-off logging tools.
            Inquestra brings protocol execution, chemical and biological inventory, molecular structures, literature citations,
            and optional bench instrument data acquisition into one reproducible, audit-ready research environment.
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

          {/* Multi-Disciplinary Domain Badges */}
          <div className="pt-8 border-t border-border/60">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Built for Modern Scientific Research Across Disciplines
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Microscope className="w-3.5 h-3.5 text-primary" />
                Molecular &amp; Cell Biology
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Atom className="w-3.5 h-3.5 text-primary" />
                Chemistry &amp; Biochemistry
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-primary" />
                Biotech &amp; Pharma R&amp;D
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-primary" />
                Materials Science &amp; Physics
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-primary" />
                Bioengineering &amp; Medical Devices
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Academic Core Facilities
              </span>
            </div>
          </div>
        </div>

        {/* Live Interactive Workspace Preview */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <ScientificWorkspacePreview />
        </div>
      </section>

      {/* ── 2. The 6 Core Pillars of Inquestra ────────────────────────────────────────── */}
      <section id="features" className="py-24 border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Platform Architecture
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
              Every stage of the scientific lifecycle in one place.
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Scientific discoveries happen across wet lab synthesis, molecular assays, mathematical modeling,
              inventory management, and physical measurements. Inquestra provides native scientific tools for every phase.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pillar 1: Research Canvas */}
            <div className="bg-background border border-border p-6 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground font-sans">
                  Scientific Protocol Canvas
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  TipTap/ProseMirror block editor tailored for science. Embed 2D molecular structures from SMILES strings,
                  DNA/RNA sequences with nucleotide coloring, KaTeX mathematical equations, and interactive execution timers.
                </p>
              </div>
              <div className="pt-3 border-t border-border font-mono text-[11px] text-primary">
                Commands: /molecule · /sequence · /math
              </div>
            </div>

            {/* Pillar 2: SOP & Protocol Management */}
            <div className="bg-background border border-border p-6 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground font-sans">
                  SOPs &amp; Interactive Step Timers
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Turn static protocols into reproducible checklists. Synchronized incubation, centrifuge, and wash timers
                  keep bench procedures disciplined across your entire lab with audio alerts and step validation.
                </p>
              </div>
              <div className="pt-3 border-t border-border font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                Commands: /protocol · /timer · /checklist
              </div>
            </div>

            {/* Pillar 3: LIMS & Inventory */}
            <div className="bg-background border border-border p-6 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <Boxes className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground font-sans">
                  LIMS &amp; Chemical Inventory
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Track chemicals, reagents, antibodies, primers, cell lines, and consumable lots. Use inline slash commands to
                  deduct volumes directly inside protocol notes, preventing expired reagent usage and automating chain-of-custody.
                </p>
              </div>
              <div className="pt-3 border-t border-border font-mono text-[11px] text-amber-600 dark:text-amber-400">
                Commands: /reagent · Storage Tracking · Barcodes
              </div>
            </div>

            {/* Pillar 4: Literature & DOI Citations */}
            <div className="bg-background border border-border p-6 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground font-sans">
                  PubMed &amp; Europe PMC Discovery
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Search millions of peer-reviewed articles without leaving your experiment. Insert verified DOIs, link
                  theoretical rationale to protocols, and generate formatted bibliographies (Nature, APA, IEEE) automatically.
                </p>
              </div>
              <div className="pt-3 border-t border-border font-mono text-[11px] text-blue-600 dark:text-blue-400">
                Commands: /citation · Europe PMC · PubMed
              </div>
            </div>

            {/* Pillar 5: Cryptographic Provenance */}
            <div className="bg-background border border-border p-6 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground font-sans">
                  Cryptographic Provenance
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Deterministic SHA-256 trial sealing locks raw data, protocol procedures, and timestamps into an immutable ledger.
                  Supports 21 CFR Part 11 audit trails and dual-attestation electronic signatures (Author + PI review).
                </p>
              </div>
              <div className="pt-3 border-t border-border font-mono text-[11px] text-purple-600 dark:text-purple-400">
                Standards: 21 CFR § 11 · SHA-256 · RFC 3161
              </div>
            </div>

            {/* Pillar 6: Integrated Bench DAQ */}
            <div className="bg-background border border-border p-6 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-phosphor/10 text-phosphor flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground font-sans">
                  Integrated Instrument DAQ (Optional)
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  When your study requires physical instrumentation &mdash; biopotentials, load cells, pressure sensors, spectrophotometers,
                  or thermocouples &mdash; connect directly in the browser via Web Serial with zero drivers or logging scripts.
                </p>
              </div>
              <div className="pt-3 border-t border-border font-mono text-[11px] text-phosphor">
                Transports: W3C Web Serial · CSV Ingestion
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Dedicated Disciplines: How Your Field Uses Inquestra ──────────────────── */}
      <section className="py-24 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Tailored for Your Science
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
              Purpose-built for your laboratory workflow.
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Whether you are running PCR gels, synthesizing compounds, testing polymer mechanics, or measuring electrical biopotentials,
              Inquestra adapts to your domain.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Domain 1: Molecular Biology */}
            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Dna className="w-4 h-4 text-purple-400" />
                <span>Molecular &amp; Cell Biology</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Log plasmid cloning, verify DNA/RNA sequences, manage antibody aliquots across -80°C freezers,
                and keep cell culture feeding and incubation protocols on disciplined timers.
              </p>
              <div className="pt-2 text-[11px] font-mono text-muted-foreground">
                Primer design · Cell passaging · Western blots
              </div>
            </div>

            {/* Domain 2: Chemistry */}
            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <FlaskConical className="w-4 h-4 text-primary" />
                <span>Chemistry &amp; Biochemistry</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Render 2D chemical structures directly from SMILES, compute stoichiometry, track reagent lot numbers,
                and maintain GHS chemical safety data sheets linked to your bench notes.
              </p>
              <div className="pt-2 text-[11px] font-mono text-muted-foreground">
                SMILES structures · Enzyme kinetics · GHS safety
              </div>
            </div>

            {/* Domain 3: Biotechnology */}
            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Biotech &amp; Biopharma R&amp;D</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Standardize batch records, enforce SOP checklists, log deviations in real time, and generate
                21 CFR Part 11 compliant audit trails with dual-signature sign-offs for regulatory filings.
              </p>
              <div className="pt-2 text-[11px] font-mono text-muted-foreground">
                SOP management · Deviation logs · 21 CFR § 11
              </div>
            </div>

            {/* Domain 4: Materials Science */}
            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Scale className="w-4 h-4 text-amber-500" />
                <span>Materials Science &amp; Physics</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Analyze tensile test stress-strain curves, record load cell deformation, model continuum mechanics with KaTeX,
                and archive sensor datasets with permanent cryptographic verification.
              </p>
              <div className="pt-2 text-[11px] font-mono text-muted-foreground">
                Stress-strain curves · Load cells · KaTeX modeling
              </div>
            </div>

            {/* Domain 5: Bioengineering & Devices */}
            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Activity className="w-4 h-4 text-phosphor" />
                <span>Bioengineering &amp; Devices</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stream biopotential telemetry (EMG, ECG), hemodynamic waveforms, or sensor arrays directly into protocols.
                Maintain clean design history records (DHF) with zero loose CSV files.
              </p>
              <div className="pt-2 text-[11px] font-mono text-muted-foreground">
                Web Serial DAQ · Biopotentials · Design history files
              </div>
            </div>

            {/* Domain 6: Academic & Core Facilities */}
            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>Academic Core Facilities</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Streamline graduate student onboarding, share standardized lab protocols, manage shared equipment clearances,
                and maintain institutional research provenance across multiple research grants.
              </p>
              <div className="pt-2 text-[11px] font-mono text-muted-foreground">
                Equipment tracking · Protocol sharing · Grant archives
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. The Fragmented Reality vs Inquestra ─────────────────────────────────── */}
      <section className="py-24 border-b border-border bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Why Inquestra
            </p>
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
                    Deterministic SHA-256 Cryptographic Provenance
                  </span>
                  Completed trials are sealed with an irreversible SHA-256 digest binding protocol text, reagent lots, and raw
                  telemetry into an immutable, 21 CFR Part 11 compliant audit ledger.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Cryptographic Provenance & Regulatory Assurance ──────────────────────── */}
      <section id="provenance" className="py-24 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Data Integrity &amp; Provenance
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
              Cryptographic proof of research reproducibility.
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Scientific trust is earned through verification, not assertions. Inquestra cryptographically seals every completed
              trial, ensuring that protocol procedures, chemical lots, and telemetry samples cannot be silently modified after the fact.
            </p>
          </div>

          <ProvenanceInteractiveDemo />

          {/* 21 CFR Part 11 Technical Controls Breakdown */}
          <div className="mt-14 pt-10 border-t border-border grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Lock className="w-4 h-4 text-primary" />
                <span>21 CFR § 11.10(b) Audit Trails</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Computer-generated, time-stamped audit trails independently record the date, time, and operator of all
                trial additions, calibrations, and seals. Modifications preserve complete differential histories.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <ShieldCheck className="w-4 h-4 text-phosphor" />
                <span>21 CFR § 11.50 Electronic Signatures</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manifests display the printed name of the signer, date/time stamp, and the explicit meaning of the signature
                (Author Execution, Technical Review, or Principal Investigator Sign-Off).
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Database className="w-4 h-4 text-primary" />
                <span>Local-First &amp; FAIR Data Principles</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Full offline operational continuity inside Faraday cages and basement labs via browser IndexedDB.
                Export data to open formats (CSV, EDF, JSON with cryptographic manifest) with zero platform lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Integrated Bench DAQ (Sized Appropriately as a Feature) ──────────────── */}
      <section id="hardware" className="py-24 border-b border-border bg-card">
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

      {/* ── 7. Transparent Tier Structure (Free Open-Core vs Pro / Enterprise) ─────── */}
      <section id="pricing" className="py-24 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Transparent Access
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
              Free open-core for individual researchers. Scalable for teams.
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Individual researchers and students retain full free access to the core notebook, LIMS, and local DAQ environment forever.
              Commercial cloud collaboration and institutional regulatory modules are available as your lab grows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Tier 1: Free Open-Core */}
            <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Free Open-Core
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-foreground">
                    Available Now
                  </span>
                </div>
                <div className="text-3xl font-mono font-semibold text-foreground mb-1">$0</div>
                <div className="text-xs text-muted-foreground mb-6">Free forever for individual bench researchers</div>

                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-phosphor" />
                    <span>Complete Scientific Protocol Canvas</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-phosphor" />
                    <span>SMILES molecules &amp; DNA/RNA sequences</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-phosphor" />
                    <span>Local Web Serial DAQ (unlimited Hz)</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-phosphor" />
                    <span>Local IndexedDB cache (zero cloud lock-in)</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-phosphor" />
                    <span>Full data export (Markdown, CSV, JSON)</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/app"
                className="w-full text-center py-2.5 rounded bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold transition-colors"
              >
                Launch Free Workspace
              </Link>
            </div>

            {/* Tier 2: Pro Lab */}
            <div className="bg-card border border-primary ring-1 ring-primary/30 p-6 rounded-xl flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                For Research Teams
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                    Pro Lab
                  </span>
                </div>
                <div className="text-3xl font-mono font-semibold text-foreground mb-1">
                  $15 <span className="text-xs font-normal text-muted-foreground font-sans">/ seat / mo</span>
                </div>
                <div className="text-xs text-muted-foreground mb-6">For academic groups, startups, and core labs</div>

                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>Everything in Free Open-Core</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>Encrypted cloud synchronization &amp; backups</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>Shared lab inventory &amp; low-stock alerts</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>Team SOP library &amp; multi-trial versioning</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>Role-based access control (RBAC)</span>
                  </li>
                </ul>
              </div>

              <Link
                href="#pilot"
                className="w-full text-center py-2.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors"
              >
                Request Lab Preview
              </Link>
            </div>

            {/* Tier 3: Enterprise & Institutional */}
            <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Enterprise / Institutional
                  </span>
                </div>
                <div className="text-3xl font-mono font-semibold text-foreground mb-1">Custom</div>
                <div className="text-xs text-muted-foreground mb-6">For biopharma, hospitals, and university departments</div>

                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-phosphor" />
                    <span>Everything in Pro Lab</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-phosphor" />
                    <span>21 CFR Part 11 Regulatory Compliance Module</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-phosphor" />
                    <span>Institutional Single Sign-On (SSO / SAML 2.0)</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-phosphor" />
                    <span>Equipment calibration dossiers &amp; maintenance logs</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-phosphor" />
                    <span>On-premise or private cloud deployment</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/contact"
                className="w-full text-center py-2.5 rounded border border-border text-foreground hover:bg-muted/40 text-xs font-semibold transition-colors"
              >
                Contact Institutional Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Pilot Lab Program — Direct Collaboration ─────────────────────────────── */}
      <section className="py-24 border-b border-border bg-card" id="pilot">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-4">
              <span>Scientific Research Collaboration</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-normal text-foreground tracking-tight mb-4">
              Partner with Inquestra on your bench.
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We are onboarding scientific research groups and biotech teams for our pilot program.
              Work directly with our engineering team to import your existing protocols, calibrate custom instrument profiles,
              and configure team workspace permissions.
            </p>
          </div>

          {/* Value Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="bg-background border border-border rounded-xl p-5 text-left">
              <div className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-phosphor" />
                <span>Open Core Free Tier</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Individual researchers retain full free access to the core notebook, LIMS, and local DAQ tools forever.
              </p>
            </div>

            <div className="bg-background border border-border rounded-xl p-5 text-left">
              <div className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-phosphor" />
                <span>Direct Engineering</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Collaborate directly with the engineers building Inquestra to tailor custom protocol blocks and data export schemas.
              </p>
            </div>

            <div className="bg-background border border-border rounded-xl p-5 text-left">
              <div className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-phosphor" />
                <span>Deployment Support</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Assistance setting up self-hosted institutional PostgreSQL instances, team SSO, and importing existing lab SOPs.
              </p>
            </div>
          </div>

          {/* Clean Intake Form (No Fake Personas) */}
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

      {/* ── 9. Final Call to Action ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/20">
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
