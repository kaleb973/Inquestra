import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, X, Shield, Zap, Database, Cpu, FileText, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Best Benchling Alternative for Research Labs | Inquestra',
  description:
    'Looking for a modern alternative to Benchling? Compare Inquestra vs Benchling for academic labs, wet chemistry, materials science, and biotech startups. Free, local-first, with native hardware DAQ.',
  keywords: [
    'benchling alternative',
    'free benchling alternative',
    'benchling pricing alternative',
    'open source eln',
    'electronic lab notebook',
    'chemistry eln',
    'inquestra vs benchling',
  ],
  openGraph: {
    title: 'Inquestra vs Benchling: The Modern ELN Alternative',
    description:
      'Break free from enterprise paywalls and single-discipline silos. Inquestra provides a fast, multi-disciplinary electronic lab notebook with native DAQ, chemical inventory, and immutable audit logs.',
    url: 'https://inquestra.org/compare/benchling-alternative',
    siteName: 'Inquestra',
    type: 'website',
  },
};

export default function BenchlingAlternativePage() {
  const comparisonJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Inquestra vs Benchling: Best Benchling Alternative for Research Labs',
    description:
      'Detailed feature and pricing comparison between Inquestra and Benchling for academic, biotech, and chemical research groups.',
    url: 'https://inquestra.org/compare/benchling-alternative',
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'Inquestra',
      applicationCategory: 'ScientificResearchSoftware',
      operatingSystem: 'All Modern Web Browsers',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Why are labs looking for Benchling alternatives?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Benchling has pivoted heavily toward large enterprise biopharma contracts, making it expensive and restrictive for academic labs and seed-stage startups. Additionally, Benchling is focused almost exclusively on molecular biology and lacks first-class support for wet chemistry, materials science, and direct hardware DAQ instruments.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Inquestra completely free for academic researchers?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Inquestra provides free, full-featured access for university labs, postdocs, graduate students, and individual researchers. Labs can also connect their own PostgreSQL database for total self-hosted data ownership.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does Inquestra handle data portability and export compared to Benchling?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Unlike proprietary walled gardens, Inquestra supports one-click exports to universal standard JSON, PDF, and Markdown with embedded SHA-256 cryptographic hashes for 21 CFR Part 11 compliant audit integrity.',
        },
      },
    ],
  };

  return (
    <div className="font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="pt-16 sm:pt-24 pb-16 border-b border-border bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/20 mb-6">
            <span>Market Analysis · 2026 Evaluation Guide</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
            The Modern Alternative to Benchling
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed mb-8">
            Benchling built a powerful tool for molecular biology. But as their focus shifted toward
            five-figure enterprise biopharma contracts, academic labs, chemistry groups, and multidisciplinary
            teams were left behind. Discover why modern labs are switching to <strong className="text-foreground">Inquestra</strong>.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              Explore In-Browser Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-background hover:bg-muted font-medium text-foreground transition-colors"
            >
              Create Free Academic Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Labs Switch (The 4 Pillars) ─────────────────────────────────── */}
      <section className="py-20 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center sm:text-left mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              Why Research Teams Are Switching from Benchling
            </h2>
            <p className="text-muted-foreground text-base max-w-2xl">
              Traditional ELNs force you into proprietary silos. Inquestra delivers speed, multi-disciplinary science, and genuine data sovereignty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Truly Multi-Disciplinary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Benchling is 95% geared toward DNA sequences and CRISPR plasmids. Inquestra gives equal, first-class status to
                <strong> wet chemistry</strong> (reagent stoichiometry & CAS lookups), <strong>materials science</strong>, and physical engineering alongside standard molecular biology protocols.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Native Hardware DAQ Streaming</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stop taking photos of balance screens or manually pasting CSVs. Inquestra integrates directly with microcontrollers and lab instrumentation via WebSerial, streaming real-time sensor data straight into your notebook notes.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">High-Velocity Bench Execution</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No lagging 30-second page reloads. Inquestra provides a keyboard-driven canvas editor (Notion/Linear-speed) equipped with interactive step completion checkboxes, protocol countdown timers, and deviation logging for glove-friendly use.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Immutable 21 CFR Part 11 Provenance</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every observation is sealed with an automated cryptographic SHA-256 hash. When you export to PDF or archive trials, Inquestra embeds an official visual Audit Certificate and witness signoff compliant with GLP and FDA regulations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Side-by-Side Comparison Matrix ─────────────────────────────────── */}
      <section className="py-20 border-b border-border bg-muted/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              Feature-by-Feature Comparison
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              How Inquestra stacks up directly against Benchling for academic labs and biotech research.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="py-4 px-6 font-semibold text-foreground">Capability</th>
                  <th className="py-4 px-6 font-bold text-primary w-1/3">Inquestra</th>
                  <th className="py-4 px-6 font-semibold text-muted-foreground w-1/3">Benchling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Academic Pricing</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Free (Full Capabilities)
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Free Tier (Feature Limited)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Supported Disciplines</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Bio, Chemistry, Materials, DAQ
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Molecular Biology primarily</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Hardware DAQ Streaming</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Native WebSerial (Direct USB)
                  </td>
                  <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" /> None (Manual file upload only)
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Chemical Inventory & Stoichiometry</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> In-editor reagent nodes + CAS
                  </td>
                  <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" /> Limited / Biology registry only
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Self-Hosting / Data Sovereignty</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Connect your own PostgreSQL
                  </td>
                  <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" /> Proprietary cloud only
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Cryptographic Trial Sealing</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Automated SHA-256 snapshots
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Paid enterprise add-on</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Bench Protocol Execution Mode</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Step checklists + live timers
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Standard text editor view</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Export Formats</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Universal JSON, Markdown, PDF
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">PDF, proprietary formats</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Step-by-Step Migration Guide ────────────────────────────────────── */}
      <section className="py-20 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center sm:text-left mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              How to Migrate from Benchling to Inquestra
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl">
              Switching your lab takes under 15 minutes with zero data loss.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-border bg-card">
              <span className="text-xs font-mono font-bold text-primary px-2.5 py-1 rounded bg-primary/10">STEP 1</span>
              <h3 className="text-lg font-bold text-foreground mt-4 mb-2">Export Your Benchling Protocols</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Export your existing protocol text and notes from Benchling as standard PDF or Markdown documents.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <span className="text-xs font-mono font-bold text-primary px-2.5 py-1 rounded bg-primary/10">STEP 2</span>
              <h3 className="text-lg font-bold text-foreground mt-4 mb-2">Create Your Team Workspace</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sign in to Inquestra and create an organization workspace for your research team or core lab in one click.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <span className="text-xs font-mono font-bold text-primary px-2.5 py-1 rounded bg-primary/10">STEP 3</span>
              <h3 className="text-lg font-bold text-foreground mt-4 mb-2">Execute with Full Provenance</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Convert your protocols into interactive checklists, connect hardware sensors via USB, and enjoy lag-free note-taking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border bg-muted/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-base font-semibold text-foreground mb-2">
                Will my data be locked in if I use Inquestra?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Never. Inquestra is built on open standards. You can export your full raw trials, protocol templates, and chemical lot records as standard JSON, Markdown, and PDF at any time. If you run your own PostgreSQL instance, you retain 100% on-premises database ownership.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-base font-semibold text-foreground mb-2">
                Can Inquestra be used for FDA, GLP, or 21 CFR Part 11 compliant research?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Yes. Inquestra features append-only immutable audit logging, cryptographic SHA-256 snapshot hashes of sealed trial states, and dual-signoff electronic signature witnessing (Author + PI Review).
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-base font-semibold text-foreground mb-2">
                Do I need to install any desktop drivers for serial hardware DAQ?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No. Inquestra utilizes the browser-native Web Serial API supported in Google Chrome, Microsoft Edge, and Opera. Connect your sensor rig, analytical balance, or microcontroller via USB, click Connect, and stream data directly into your notebook canvas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-primary/5 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Ready for a Better Lab Notebook Experience?
          </h2>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed">
            Join hundreds of researchers enjoying fast, multi-disciplinary, and audit-ready experiment tracking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-md"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-lg border border-border bg-background hover:bg-muted font-medium text-foreground transition-colors"
            >
              Launch Live Sandbox Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
