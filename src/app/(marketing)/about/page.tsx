import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: {
    absolute: 'About Inquestra — Free ELN Built for Researchers',
  },
  description:
    'About Inquestra: a free electronic lab notebook (ELN) for life sciences, chemistry, and engineering, built by researchers for reproducible lab documentation.',
};

export default function AboutPage() {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Inquestra',
    url: 'https://inquestra.org',
    description:
      'Inquestra builds free, open research infrastructure for scientists. The flagship product is a browser-based Electronic Lab Notebook for life sciences, chemistry, biotech, materials science, and engineering.',
    foundingDate: '2024',
    sameAs: ['https://github.com/kaleb973/Inquestra'],
  };

  return (
    <div className="font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
            About · Inquestra
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-normal tracking-tight text-foreground mb-6 leading-tight">
            Built by researchers. Free for researchers.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Inquestra is a free, browser-based Electronic Lab Notebook (ELN) for life sciences,
            chemistry, biotech, materials science, and engineering. It was built out of frustration
            with the fragmented, expensive, and domain-narrow state of scientific documentation
            tools — and a belief that every researcher deserves a professional, unified workspace
            without a licensing fee or an IT department.
          </p>
        </div>
      </section>

      {/* ── The problem we solve ─────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-foreground tracking-tight mb-6">
            The problem
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            Scientific research today involves at least five disconnected tools: a word processor for
            protocols, a spreadsheet for inventory, a citation manager for references, a molecular
            drawing program for structures, and a separate data logger for instrument output. When a
            rotating student joins a lab, onboarding means installing and learning all five — and
            then keeping them in sync manually.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            The ELN market exists to solve this problem, but most solutions reproduce it in a
            different form: they lock you into a single scientific domain (molecular biology, or
            physical science, but rarely both), charge per-user licensing fees that academic labs
            cannot sustain across rotating students, or require institutional IT infrastructure just
            to get started.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Inquestra is built on the premise that this is unnecessary. A single, well-designed,
            browser-based workspace can serve a molecular biologist, a materials scientist, and an
            electrical engineer in the same research group — with no installation, no subscription,
            and no compromise on features.
          </p>
        </div>
      </section>

      {/* ── What Inquestra is ────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border bg-muted/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-foreground tracking-tight mb-6">
            What Inquestra is
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
            Inquestra is an Electronic Lab Notebook (ELN) for the full breadth of experimental
            science. In a single browser tab, researchers can:
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-emerald-500 font-bold mt-0.5 shrink-0">→</span>
              <span>Write, execute, and version-control scientific protocols with rich text, equations, molecular structures, tables, and embedded timers</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-500 font-bold mt-0.5 shrink-0">→</span>
              <span>Manage chemical and biological inventories — reagents, standards, samples, instruments — with lot tracking and automatic protocol linkage</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-500 font-bold mt-0.5 shrink-0">→</span>
              <span>Render 2D chemical structures from canonical SMILES with live PubChem property resolution</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-500 font-bold mt-0.5 shrink-0">→</span>
              <span>Search PubMed and Europe PMC and insert formatted literature citations directly into protocols</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-500 font-bold mt-0.5 shrink-0">→</span>
              <span>Log instrument data from USB-connected hardware (Arduino, ESP32, and standard serial devices) directly into the notebook with cryptographic timestamps</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-500 font-bold mt-0.5 shrink-0">→</span>
              <span>Generate cryptographic audit trails and verifiable exports adhering to 21 CFR Part 11 technical controls</span>
            </li>
          </ul>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-6">
            All of this is free, with no per-researcher licensing cost, no mandatory account
            creation, and no software to install. Researchers can start in a guest workspace
            immediately and sync to a free account when they are ready to persist their data.
          </p>
        </div>
      </section>

      {/* ── Who it is for ────────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-foreground tracking-tight mb-6">
            Who Inquestra is for
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <h3 className="text-foreground font-semibold mb-2">Students and rotating researchers</h3>
              <p className="leading-relaxed">
                Undergraduates, graduate students, and postdoctoral fellows who need a professional
                research notebook from day one — without waiting for institutional licenses or
                on-boarding tutorials.
              </p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-2">Academic lab groups</h3>
              <p className="leading-relaxed">
                University research groups in life sciences, chemistry, biotech, materials science,
                or engineering that need a shared protocol library, inventory system, and
                reproducible experimental record.
              </p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-2">Independent and citizen scientists</h3>
              <p className="leading-relaxed">
                Researchers without institutional affiliation who need a professional tool without
                paying enterprise pricing. Inquestra requires no institutional email or IT
                department.
              </p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-2">Multidisciplinary research groups</h3>
              <p className="leading-relaxed">
                Labs that span molecular biology, chemistry, and hardware instrumentation — where
                domain-specific tools like Benchling leave gaps in the workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Founder & Engineering Leadership ─────────────────────────────── */}
      <section className="py-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-foreground tracking-tight mb-6">
            Founder &amp; Engineering Leadership
          </h2>
          <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Kaleb</h3>
                <p className="text-xs font-mono text-muted-foreground">Founder &amp; Lead Builder · Inquestra</p>
              </div>
              <a
                href="https://github.com/kaleb973"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
              >
                github.com/kaleb973
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Inquestra was created by Kaleb out of first-hand frustration running bench sensor experiments and lab trials:
              commercial Electronic Lab Notebooks are either gated behind enterprise procurement walls costing tens of thousands
              of dollars, locked into proprietary cloud silos, or completely disconnected from physical bench instrumentation and hardware.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Instead of accepting that student researchers, iGEM teams, and independent labs have to stitch together Google Docs,
              loose CSV files, and unverified scripts, Inquestra was engineered from the ground up on modern browser standards
              (W3C Web Serial, PubChem REST integration, and local IndexedDB cryptographic storage). It provides an open, local-first
              workspace where researchers retain 100% ownership over their data and bench protocols.
            </p>
          </div>
        </div>
      </section>

      {/* ── Trust signals & open source ──────────────────────────────────────── */}
      <section className="py-16 border-b border-border bg-muted/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-foreground tracking-tight mb-6">
            Open development
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
            Inquestra is developed openly on GitHub. The source code is inspectable, issues are
            tracked publicly, and contributions from the research community are welcome. Scientific
            software should be auditable — particularly software involved in data provenance and
            audit trails.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="https://github.com/kaleb973/Inquestra"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded text-sm font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              View source on GitHub
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 rounded text-sm font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              Contact the team
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight mb-4">
            Try Inquestra in your browser — free.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            No credit card. No institutional affiliation required. Launch the workspace and start
            your first protocol today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-8 py-3.5 rounded text-sm font-semibold transition-colors shadow-sm"
            >
              Open Research Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/compare"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-3.5 rounded text-sm font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              Compare to other ELNs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
