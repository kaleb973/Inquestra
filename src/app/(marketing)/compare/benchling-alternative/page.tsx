import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, X, Shield, Zap, Database, Cpu } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  ENTITY_IDS,
  SITE_URL,
  buildBreadcrumbSchema,
  buildFounderPerson,
  buildGraphSchema,
  buildOrganizationSchema,
  buildPageMetadata,
  buildSoftwareApplicationSchema,
} from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Best Benchling Alternative for Research Labs',
  description:
    'Looking for a modern alternative to Benchling? Compare Inquestra vs Benchling for academic labs, wet chemistry, materials science, and biotech startups. Free, local-first, with native hardware DAQ.',
  path: '/compare/benchling-alternative',
  keywords: [
    'benchling alternative',
    'free benchling alternative',
    'benchling pricing alternative',
    'open source eln',
    'electronic lab notebook',
    'chemistry eln',
    'inquestra vs benchling',
  ],
});

export default function BenchlingAlternativePage() {
  const structuredData = buildGraphSchema([
    buildOrganizationSchema(),
    buildFounderPerson(),
    buildSoftwareApplicationSchema(),
    {
      '@type': 'WebPage',
      name: 'Inquestra vs Benchling: Best Benchling Alternative for Research Labs',
      description:
        'Detailed feature and pricing comparison between Inquestra and Benchling for academic, biotech, and chemical research groups.',
      url: `${SITE_URL}/compare/benchling-alternative`,
      mainEntity: { '@id': ENTITY_IDS.software },
    },
    {
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
            text: 'Unlike proprietary walled gardens, Inquestra supports one-click exports to universal standard JSON, PDF, and Markdown with SHA-256 checksum manifests for verifiable audit integrity and provenance.',
          },
        },
      ],
    },
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Compare ELNs', path: '/compare' },
      { name: 'Benchling Alternative', path: '/compare/benchling-alternative' },
    ]),
  ]);

  return (
    <div className="font-sans">
      <JsonLd data={structuredData} />

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="pt-14 sm:pt-20 pb-16 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-5 leading-tight">
            The Modern Alternative to Benchling
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-8">
            Built for academic and R&amp;D groups running multi-disciplinary science without enterprise pricing.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-11 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-95 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Explore In-Browser Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 h-11 rounded-md border border-border bg-card hover:bg-muted/60 font-medium text-foreground transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open Local Academic Workspace
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
              Comparison for groups pairing biological assays with wet chemistry, bench instrumentation, or self-hosted storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Multi-Disciplinary by Default</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Designed from the start with first-class support for <strong>wet chemistry</strong> (stoichiometry math and CAS/PubChem links), <strong>materials testing</strong> traces, and standard molecular biology protocols under one trial schema.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Native Hardware DAQ Streaming</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stop photographing balance screens or manually pasting CSV exports. Inquestra connects directly to microcontrollers and serial sensors over W3C Web Serial.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Fast Bench Execution</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Skip heavy page reloads. Inquestra pairs a keyboard-driven block editor with step countdown timers, inline math blocks, and deviation notes.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Tamper-Evident Provenance</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every sealed trial stores a canonical SHA-256 checksum alongside dual author and PI signatures, exportable as verifiable PDF and JSON bundles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Side-by-Side Comparison Matrix ─────────────────────────────────── */}
      <section className="py-20 border-b border-border bg-muted/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              Feature-by-Feature Comparison
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl">
              How Inquestra compares directly against Benchling for university groups and R&amp;D labs.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-background">
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
                    <Check className="w-4 h-4 text-phosphor" /> Free (Full Capabilities)
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Free Tier (Feature Limited)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Supported Disciplines</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> Bio, Chemistry, Materials, DAQ
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Molecular Biology primarily</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Hardware DAQ Streaming</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> Native WebSerial (Direct USB)
                  </td>
                  <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-critical" /> None (Manual file upload only)
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Chemical Inventory &amp; Stoichiometry</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> In-editor reagent nodes + CAS
                  </td>
                  <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-critical" /> Limited / Biology registry only
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Self-Hosting / Data Sovereignty</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> Connect your own PostgreSQL
                  </td>
                  <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-critical" /> Proprietary cloud only
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Cryptographic Trial Sealing</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> Automated SHA-256 snapshots
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Paid enterprise add-on</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Bench Protocol Execution Mode</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> Step checklists + live timers
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Standard text editor view</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Export Formats</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> Universal JSON, Markdown, PDF
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">PDF, proprietary formats</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Migration Steps (Hairline Divided Ledger) ───────────────────────── */}
      <section className="py-20 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              Moving Protocols from Benchling
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl">
              Bring existing lab notes into Inquestra without losing historical format structure.
            </p>
          </div>

          <div className="divide-y divide-border border-y border-border">
            <div className="py-6 grid sm:grid-cols-12 gap-4 items-baseline">
              <div className="sm:col-span-4">
                <span className="font-mono text-xs text-primary">01</span>
                <h3 className="text-base font-semibold text-foreground mt-1">Export Benchling entries</h3>
              </div>
              <p className="sm:col-span-8 text-sm text-muted-foreground leading-relaxed">
                Download your existing protocol templates and notes from Benchling as standard PDF or Markdown documents.
              </p>
            </div>

            <div className="py-6 grid sm:grid-cols-12 gap-4 items-baseline">
              <div className="sm:col-span-4">
                <span className="font-mono text-xs text-primary">02</span>
                <h3 className="text-base font-semibold text-foreground mt-1">Open local or team workspace</h3>
              </div>
              <p className="sm:col-span-8 text-sm text-muted-foreground leading-relaxed">
                Start immediately in browser localStorage with portable ZIP/CSV exports or connect your research group&apos;s self-hosted PostgreSQL database for shared inventory.
              </p>
            </div>

            <div className="py-6 grid sm:grid-cols-12 gap-4 items-baseline">
              <div className="sm:col-span-4">
                <span className="font-mono text-xs text-primary">03</span>
                <h3 className="text-base font-semibold text-foreground mt-1">Attach hardware and timers</h3>
              </div>
              <p className="sm:col-span-8 text-sm text-muted-foreground leading-relaxed">
                Convert static steps into interactive timers and stream live sensor telemetry straight from bench USB instruments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border bg-muted/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-border border-y border-border">
            <div className="py-6">
              <h3 className="text-base font-semibold text-foreground mb-2">
                Will my data be locked in if I use Inquestra?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Never. You can export raw trials, protocol templates, and chemical lot records as standard JSON, Markdown, and CSV at any time, or run your own PostgreSQL instance for complete database ownership.
              </p>
            </div>
            <div className="py-6">
              <h3 className="text-base font-semibold text-foreground mb-2">
                Can Inquestra support regulated data integrity audits?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Inquestra implements append-only immutable audit logging, cryptographic SHA-256 snapshot digests of sealed trial states, and dual-signoff witnessing for Author and PI review.
              </p>
            </div>
            <div className="py-6">
              <h3 className="text-base font-semibold text-foreground mb-2">
                Do I need to install any desktop drivers for serial hardware DAQ?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No. Inquestra uses the browser-native Web Serial API supported in Google Chrome, Microsoft Edge, and Opera to capture USB sensor and balance readings straight into the workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
              Try Inquestra directly in your browser.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Launch a local research notebook without subscriptions or setup tickets.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-2 px-6 h-11 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-95 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open Research Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center px-6 h-11 rounded-md border border-border bg-card hover:bg-muted/60 font-medium text-foreground transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try DAQ Simulator
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
