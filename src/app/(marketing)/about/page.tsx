import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: {
    absolute: 'About Inquestra: Free ELN Built for Researchers',
  },
  description:
    'About Inquestra: a free electronic lab notebook (ELN) for life sciences, chemistry, and engineering, built by researchers for reproducible lab documentation.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Inquestra',
    url: 'https://inquestra.org',
    description:
      'Inquestra builds open research tools for scientists, centering on a browser-based Electronic Lab Notebook that runs locally on your machine.',
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
      <section className="pt-14 sm:pt-20 pb-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-5 leading-tight">
            An open workspace built for laboratory documentation.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Store lab notebooks, reagent lots, and serial data without per-seat subscriptions.
          </p>
        </div>
      </section>

      {/* ── The problem we solve ─────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
            Background and design focus
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            Daily lab work often spreads notes across word processors, reagent spreadsheets, citation tools, drawing software, and vendor serial loggers. Onboarding a new rotating student means setting up each piece separately and keeping exports matched by hand.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Running the editor, chemical lot registry, literature lookups, and Chromium Web Serial directly inside a browser tab removes per-seat software barriers and keeps trials legible across molecular biology, wet chemistry, materials testing, and electronics benches.
          </p>
        </div>
      </section>

      {/* ── What Inquestra is ────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border bg-muted/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
            What Inquestra is
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
            Inquestra is an Electronic Lab Notebook for the full breadth of experimental
            science. In a single browser tab, researchers can:
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-emerald-500 font-bold mt-0.5 shrink-0">→</span>
              <span>Write, execute, and version-control scientific protocols with rich text, equations, molecular structures, tables, and embedded timers</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-500 font-bold mt-0.5 shrink-0">→</span>
              <span>Manage chemical and biological inventories (reagents, standards, samples, instruments) with lot tracking and automatic protocol linkage</span>
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
              <span>Generate cryptographic audit trails and verifiable exports with tamper-evident checksums</span>
            </li>
          </ul>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-6">
            Inquestra runs directly in your browser with local storage. You can start working immediately in guest mode,
            and export your experiments as standard Markdown, JSON, and CSV archives whenever you want.
          </p>
        </div>
      </section>

      {/* ── Who it is for ────────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
            Who Inquestra is for
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <h3 className="text-foreground font-semibold mb-2">Students and rotating researchers</h3>
              <p className="leading-relaxed">
                Undergraduates, graduate students, and postdoctoral fellows who need a professional
                research notebook from day one without waiting for institutional licenses or onboarding tutorials.
              </p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-2">Academic lab groups</h3>
              <p className="leading-relaxed">
                University research groups that need shared protocols, inventory tracking, and
                reproducible experiment records without per-seat software licenses.
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
                Labs that span molecular biology, chemistry, and hardware instrumentation where
                domain-specific tools like Benchling leave gaps in the workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Founder & Engineering Leadership ─────────────────────────────── */}
      <section className="py-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
            Founder &amp; Engineering Leadership
          </h2>
          <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Kaleb</h3>
                <p className="text-xs font-mono text-muted-foreground">Founder and Lead Builder, Inquestra</p>
              </div>
              <a
                href="https://github.com/kaleb973"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                github.com/kaleb973
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Inquestra started from running sensor acquisitions alongside lab notebooks where hardware logs lived in separate CSV files, inventory lived in spreadsheets, and commercial ELN suites required institutional procurement contracts.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Building directly on standard browser APIs (W3C Web Serial, IndexedDB, and public PubChem / PubMed endpoints) keeps the workspace fast to open in Chrome or Edge while letting academic groups export standard Markdown, JSON, and CSV archives or sync to self-hosted PostgreSQL.
            </p>
          </div>
        </div>
      </section>

      {/* ── Trust signals & open source ──────────────────────────────────────── */}
      <section className="py-16 border-b border-border bg-muted/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
            Open development
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
            Inquestra is developed openly on GitHub. The source code is inspectable, issues are
            tracked publicly, and contributions from the research community are welcome. Scientific
            software should be auditable, particularly software involved in data provenance and
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
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
            Try Inquestra in your browser for free.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Opens in your browser. No account needed to start your first protocol.
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
