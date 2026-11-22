import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, X, Shield, Zap, FolderTree, Cpu, FileSpreadsheet, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Best LabArchives Alternative for Universities & Research Labs | Inquestra',
  description:
    'Frustrated with LabArchives clunky UI and per-seat fees? Inquestra provides a modern, fast electronic lab notebook with instant search, interactive protocols, chemical inventory, and native hardware DAQ.',
  keywords: [
    'labarchives alternative',
    'free labarchives alternative',
    'university electronic lab notebook',
    'modern eln software',
    'academic lab notebook',
    'inquestra vs labarchives',
  ],
  openGraph: {
    title: 'Inquestra vs LabArchives: The Modern Academic ELN',
    description:
      'Replace legacy folder trees with a high-velocity research canvas. Instant search, chemical lot tracking, and tamper-proof 21 CFR Part 11 audit trails.',
    url: 'https://inquestra.org/compare/labarchives-alternative',
    siteName: 'Inquestra',
    type: 'website',
  },
};

export default function LabArchivesAlternativePage() {
  const comparisonJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Inquestra vs LabArchives: Best LabArchives Alternative',
    description:
      'Side-by-side comparison between Inquestra and LabArchives for academic research groups and university wet labs.',
    url: 'https://inquestra.org/compare/labarchives-alternative',
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
        name: 'Why do academic researchers look for LabArchives alternatives?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'LabArchives relies on an antiquated folder-tree hierarchy from the mid-2000s, has sluggish search, charges steep per-seat fees, and completely lacks real-time hardware instrument DAQ or interactive protocol execution timers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can Inquestra satisfy university institutional compliance and IP patent requirements?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Inquestra features append-only audit logging, SHA-256 cryptographic trial snapshots, and dual-signoff witness review workflows that meet 21 CFR Part 11 and university tech-transfer patent provenance standards.',
        },
      },
      {
        '@type': 'Question',
        name: 'How easy is it to switch from LabArchives to Inquestra?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can export your existing LabArchives pages as PDF or Markdown and immediately start logging trials in Inquestra with zero setup fees.',
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
            <span>Academic Infrastructure Guide · 2026 Evaluation</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
            The Modern Alternative to LabArchives
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed mb-8">
            Many university labs are handed LabArchives licenses, only to find an antiquated 2005-era interface,
            painful navigation, and zero support for modern hardware or chemical workflows. Discover why research groups
            are switching to <strong className="text-foreground">Inquestra</strong>.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              Test Live Sandbox Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-background hover:bg-muted font-medium text-foreground transition-colors"
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
            <div className="p-6 rounded-xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Linear/Notion-Style Canvas Speed</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                LabArchives requires navigating deep, slow folder trees. Inquestra provides a keyboard-first canvas with global instant search, slash commands, and zero lag.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Integrated Reagent & Inventory Nodes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track chemical lot numbers, purity, CAS entries, and freezer locations right inside your experimental protocol rather than toggling separate inventory add-ons.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Real-Time Serial Instrument DAQ</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect balances, temperature probes, and serial DAQ boards directly to the browser via WebSerial. Data streams directly into live time-series plots.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Dual-Signoff Witnessing & Audit Integrity</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Both Author and PI can sign off with password-verified legal witnessing statements and cryptographic SHA-256 snapshots printed directly on exported PDF trial certificates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison Table ────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border bg-muted/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              Head-to-Head Comparison
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              Compare features and usability between Inquestra and LabArchives.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-background">
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
                    <Check className="w-4 h-4 text-emerald-500" /> Free for Academic Labs
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Paid per-seat / Site License</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">User Interface</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Modern Canvas (TipTap / Linear-style)
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Hierarchical Folder Tree (Legacy)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Hardware Instrument DAQ</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Native WebSerial DAQ
                  </td>
                  <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" /> No hardware integration
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Interactive Protocol Timers</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Built-in step timers & checklists
                  </td>
                  <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" /> Static text only
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">Self-Hosting Option</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Own your Postgres database
                  </td>
                  <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" /> Cloud SaaS only
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-foreground">2D Barcode Label Generation</td>
                  <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Native DataMatrix & QR
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">Separate paid add-on</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-primary/5 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Upgrade Your Lab&apos;s Daily Workflow
          </h2>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed">
            Free forever for academic research labs. No enterprise sales hurdles.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-md"
            >
              Start Free Academic Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-lg border border-border bg-background hover:bg-muted font-medium text-foreground transition-colors"
            >
              Try Interactive Sandbox
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
