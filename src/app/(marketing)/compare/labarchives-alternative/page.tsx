import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, X, Shield, Zap, Cpu, FileSpreadsheet } from 'lucide-react';
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
  title: 'Best LabArchives Alternative for Universities & Research Labs',
  description:
    'Frustrated with LabArchives clunky UI and per-seat fees? Inquestra provides a modern, fast electronic lab notebook with instant search, interactive protocols, chemical inventory, and native hardware DAQ.',
  path: '/compare/labarchives-alternative',
  keywords: [
    'labarchives alternative',
    'free labarchives alternative',
    'university electronic lab notebook',
    'modern eln software',
    'academic lab notebook',
    'inquestra vs labarchives',
  ],
});

const LABARCHIVES_FAQS = [
  {
    question: 'Why do academic researchers look for LabArchives alternatives?',
    answer:
      'LabArchives relies on an older folder-tree hierarchy, charges per-seat or institutional fees, and lacks real-time serial hardware instrument DAQ and interactive protocol execution timers.',
  },
  {
    question: 'Can Inquestra satisfy university institutional compliance and IP patent requirements?',
    answer:
      'Yes. Inquestra features append-only audit logging, SHA-256 cryptographic trial snapshots, and dual-signoff witness review workflows that support 21 CFR Part 11 and university tech-transfer provenance workflows.',
  },
  {
    question: 'How easy is it to switch from LabArchives to Inquestra?',
    answer:
      'You can export your existing LabArchives pages as PDF or Markdown and immediately start logging trials in Inquestra with zero setup fees.',
  },
] as const;

export default function LabArchivesAlternativePage() {
  const structuredData = buildGraphSchema([
    buildOrganizationSchema(),
    buildFounderPerson(),
    buildSoftwareApplicationSchema(),
    {
      '@type': 'WebPage',
      name: 'Inquestra vs LabArchives: Best LabArchives Alternative',
      description:
        'Side-by-side comparison between Inquestra and LabArchives for academic research groups and university wet labs.',
      url: `${SITE_URL}/compare/labarchives-alternative`,
      mainEntity: { '@id': ENTITY_IDS.software },
    },
    {
      '@type': 'FAQPage',
      mainEntity: LABARCHIVES_FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Compare ELNs', path: '/compare' },
      { name: 'LabArchives Alternative', path: '/compare/labarchives-alternative' },
    ]),
  ]);

  return (
    <div className="font-sans">
      <JsonLd data={structuredData} />

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="pt-14 sm:pt-20 pb-16 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-5 leading-tight">
            The Modern Alternative to LabArchives
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-8">
            Replace folder trees with a block canvas and live USB streaming.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-11 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-95 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Test Live Local Notebook Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/app/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 h-11 rounded-md border border-border bg-card hover:bg-muted/60 font-medium text-foreground transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Start Free Academic Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* ── Key Differentiators ────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center sm:text-left mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              Where Inquestra Outperforms LabArchives
            </h2>
            <p className="text-muted-foreground text-base max-w-2xl">
              Engineered by scientists and modern software builders to eliminate daily bench frustration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Fast Block Canvas Navigation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Navigate directly through a keyboard-driven TipTap workspace with instant local trial filtering and slash-command scientific blocks instead of nested folder pages.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Integrated Reagent &amp; Inventory Nodes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track chemical lot numbers, purity specs, CAS entries, and storage shelf locations directly inside your active trial rather than in separate attachments.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Real-Time Serial Instrument DAQ</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect balances, temperature probes, and serial DAQ boards straight to your browser via Web Serial. Data streams into live time-series charts.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Dual-Signoff Witnessing &amp; Audit Integrity</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Both Author and PI can countersign sealed trials with cryptographic SHA-256 snapshots printed onto exported verification certificates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison Table ────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border bg-muted/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              Head-to-Head Comparison
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl">
              Compare capabilities and usability between Inquestra and LabArchives.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-background">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="py-4 px-6 font-semibold text-foreground">Feature</th>
                  <th className="py-4 px-6 font-bold text-primary w-1/3">Inquestra</th>
                  <th className="py-4 px-6 font-semibold text-muted-foreground w-1/3">LabArchives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Academic Cost</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> Free for Academic Labs
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Paid per-seat / Site License</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">User Interface</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> Block Canvas (TipTap)
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Hierarchical Folder Tree</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Hardware Instrument DAQ</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> Native WebSerial DAQ
                  </td>
                  <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-critical" /> No hardware integration
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Interactive Protocol Timers</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> Built-in step timers &amp; checklists
                  </td>
                  <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-critical" /> Static text only
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Self-Hosting Option</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> Own your Postgres database
                  </td>
                  <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-critical" /> Cloud SaaS only
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">2D Barcode Label Generation</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-phosphor" /> Native DataMatrix &amp; QR
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Separate paid add-on</td>
                </tr>
              </tbody>
            </table>
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
            {LABARCHIVES_FAQS.map((item) => (
              <div key={item.question} className="py-6">
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {item.question}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
              Move beyond folder trees.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Free for academic research groups with zero enterprise procurement steps.
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
              Launch Local Notebook Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
