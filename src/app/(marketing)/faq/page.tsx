import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, Cpu, ShieldCheck } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildGraphSchema,
  buildPageMetadata,
} from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Frequently Asked Questions: Inquestra Free Electronic Lab Notebook',
  description:
    'Answers to common questions about Inquestra: offline usage, hardware data capture, local storage, sequence tools, and data export.',
  path: '/faq',
  absoluteTitle: true,
});

interface FaqItem {
  id: string;
  category: 'Capabilities & Roadmap' | 'Compliance & Provenance' | 'Hardware & Data' | 'Access & Licensing';
  question: string;
  answer: string;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: 'guest-mode',
    category: 'Access & Licensing',
    question: 'Can I use Inquestra without signing up?',
    answer:
      'Yes. Opening the workspace launches full guest mode immediately with browser localStorage persistence. You can write protocols, run step timers, analyze sequences, resolve PubChem chemical structures, and connect Serial port bench instruments without creating an account or waiting for IT approval.',
  },
  {
    id: 'academic-access',
    category: 'Access & Licensing',
    question: 'Is Inquestra free for academic research?',
    answer:
      'Yes. Inquestra is built as free, open research infrastructure for academic researchers, students, university labs, iGEM teams, and independent scientists, whether running locally in the browser or synced to an optional PostgreSQL workspace.',
  },
  {
    id: 'serial-hardware',
    category: 'Hardware & Data',
    question: 'What ELNs support Serial port hardware?',
    answer:
      'Inquestra is the only open, browser-based Electronic Lab Notebook with native Chromium Web Serial API integration built directly into notebook chart blocks. Researchers can stream real-time CSV or ASCII telemetry from pH meters, analytical balances, thermocouples, potentiostats, Arduino, and ESP32 boards without external Python scripts or vendor middleware.',
  },
  {
    id: 'glp-gmp-compliance',
    category: 'Compliance & Provenance',
    question: 'Does Inquestra support data integrity compliance?',
    answer:
      'Inquestra implements verification primitives: immutable SHA-256 record sealing, append-only revision snapshots, timestamped protocol step execution, deviation notes, and audit logs. Regulated organizations must validate their specific procedures against institutional standards.',
  },
  {
    id: 'crispr-guide-design',
    category: 'Capabilities & Roadmap',
    question: 'Does Inquestra have CRISPR guide design?',
    answer:
      'Not yet. Dedicated CRISPR guide RNA scoring and off-target alignment tools are scheduled on the development roadmap for Q2 2027. Today, Inquestra includes inline DNA, RNA, and protein sequence blocks with live nucleotide length, GC percentage, Wallace and salt-adjusted melting temperature (Tm), reverse-complement copy, and FASTA export.',
  },
  {
    id: 'plasmid-visualization',
    category: 'Capabilities & Roadmap',
    question: 'Does Inquestra support plasmid visualization?',
    answer:
      'A circular plasmid map viewer for GenBank and annotated FASTA constructs is currently in development. In the current workspace, molecular biologists can organize plasmid miniprep SOPs, reagent deductions, primer pairs, and linear sequence annotations inside structured experiment records.',
  },
  {
    id: 'chemistry-tools',
    category: 'Capabilities & Roadmap',
    question: 'What chemistry and multi-discipline tools are included?',
    answer:
      'Inquestra serves Chemistry, Materials Science, Life Sciences, and Engineering side by side. Inline slash commands support IUPAC or common-name PubChem resolution to canonical SMILES, subscript molecular formula, molar mass, and InChIKey, alongside 2D structure rendering, KaTeX mathematical equations, tensile/sensor telemetry charts, and reagent inventory blocks.',
  },
  {
    id: 'data-export',
    category: 'Hardware & Data',
    question: 'Can I export my experimental records and raw telemetry?',
    answer:
      'Yes. Inquestra imposes zero vendor lock-in. Sequence blocks export directly as FASTA, hardware DAQ charts import and export CSV traces, completed protocols print or export as ZIP archives (Markdown, JSON, and CSV), and cloud Postgres schemas remain fully transparent.',
  },
];

export default function FaqPage() {
  const structuredData = buildGraphSchema([
    {
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
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
      { name: 'FAQ', path: '/faq' },
    ]),
  ]);

  return (
    <div className="font-sans">
      <JsonLd data={structuredData} />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="pt-14 sm:pt-20 pb-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-5 leading-tight">
            Questions about Inquestra, answered plainly.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Details on offline browser storage and serial hardware capture.
          </p>
        </div>
      </section>

      {/* ── Summary Badges ────────────────────────────────────────────────────── */}
      <section className="py-6 border-b border-border bg-muted/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Zero-signup Local mode</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Cpu className="w-4 h-4 text-sky-500 shrink-0" />
            <span>Native Web Serial DAQ</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>SHA-256 record sealing</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Transparent roadmap</span>
          </div>
        </div>
      </section>

      {/* ── FAQ List ─────────────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {FAQ_ITEMS.map((item) => (
            <article
              key={item.id}
              id={item.id}
              className="p-6 rounded-xl border border-border bg-card/40"
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-medium text-phosphor">
                  {item.category}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight mb-3">
                {item.question}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground tracking-tight mb-4">
            Inspect the workspace directly with no account required.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Open the browser workspace to test protocol execution timers, sequence Tm calculations,
            PubChem lookup, and template workflows right away.
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
              Compare Inquestra vs. Benchling &amp; LabArchives
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
