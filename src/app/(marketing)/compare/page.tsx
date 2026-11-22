import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: {
    absolute: 'Inquestra vs Benchling vs LabArchives: ELN Comparison',
  },
  description:
    'Compare Inquestra, Benchling, LabArchives, and SciNote. Pricing, supported disciplines, learning curve, and DAQ compared side by side for academic labs.',
};

export default function ComparePage() {
  const softwareJsonLd = {
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
      'Comparison of electronic lab notebook features, pricing, local data ownership, and hardware integration across leading research platforms.',
    url: 'https://inquestra.org',
    datePublished: '2026-11-01',
    dateModified: '2026-11-09',
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Electronic Lab Notebook (ELN) Comparison: Inquestra, Benchling, LabArchives, SciNote',
    description:
      'Side-by-side comparison of the leading electronic lab notebooks for academic and research use.',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inquestra',
        url: 'https://inquestra.org',
        description:
          'Local-first electronic lab notebook with native serial DAQ, chemical lot tracking, and in-browser execution for academic labs.',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Benchling',
        url: 'https://benchling.com',
        description:
          'ELN and molecular biology platform focused on genetics, CRISPR, plasmid mapping, and biotech. Free academic tier available. Strong in life sciences, limited in physical sciences and engineering.',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'LabArchives',
        url: 'https://labarchives.com',
        description:
          'General-purpose ELN for all scientific disciplines. Commonly licensed by universities. Per-user pricing; no hardware DAQ integration.',
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'SciNote',
        url: 'https://scinote.net',
        description:
          'Open-source ELN for life sciences and medical research. Free tier with storage limits. Strong inventory and sample management; no hardware DAQ.',
      },
    ],
  };

  return (
    <div className="font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────────────── */}
      <section className="pt-16 sm:pt-20 pb-16 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
            ELN Comparison · Last updated November 2026
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            Inquestra vs Benchling vs LabArchives vs SciNote
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Choosing an Electronic Lab Notebook (ELN) for academic research means evaluating pricing,
            supported scientific disciplines, ease of use for students, hardware integration, and
            regulatory compliance. This page provides a factual, up-to-date comparison of the four
            most commonly evaluated ELN platforms for university labs, graduate research groups, and
            individual researchers.
          </p>
        </div>
      </section>

      {/* ── What is Inquestra ───────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
            What is Inquestra?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            Inquestra is a free, browser-based Electronic Lab Notebook (ELN) built across experimental laboratory disciplines.
            It serves molecular biologists running PCR protocols, chemists tracking synthesis reactions, materials scientists logging
            mechanical test data, and engineers acquiring serial sensor measurements in a unified workspace.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            The notebook pairs structured protocol steps with inline chemical structures, literature lookups, and direct Web Serial streaming from USB-connected instruments.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Pricing:</strong> Free for individual
            researchers, students, postdocs, and academic labs. No subscriptions or per-seat fees.
            Labs that want to self-host can connect their own PostgreSQL instance.
          </p>
        </div>
      </section>

      {/* ── What is Benchling ──────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border bg-muted/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
            What is Benchling?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            Benchling is an ELN and molecular biology platform primarily serving life sciences and
            biotech organizations. It is especially strong in molecular biology workflows: DNA and
            plasmid sequence design, CRISPR guide RNA design, primer management, and biological
            sample registration. Benchling is widely used in academic molecular biology and genetics
            labs and in commercial biotech companies.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Pricing:</strong> Benchling offers a free academic
            tier for university researchers with valid institutional email addresses. Advanced
            features (batch operations, enterprise integrations, compliance modules) require paid
            commercial plans. Benchling is not well-suited for physical sciences, materials
            engineering, or hardware DAQ workflows: its toolset is designed for biological
            laboratory environments.
          </p>
        </div>
      </section>

      {/* ── What is LabArchives ────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
            What is LabArchives?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            LabArchives is a general-purpose ELN supporting all scientific disciplines. It is
            commonly licensed by universities as an institution-wide tool, allowing students and
            faculty to access notebooks through their university account. LabArchives uses a
            document-centric, folder-based structure that many researchers find familiar and easy to
            adopt.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Pricing:</strong> LabArchives is primarily available
            through institutional site licenses. Individual researcher accounts require a paid
            subscription. There is no free individual tier equivalent to Inquestra or Benchling.
            LabArchives does not include hardware DAQ integration, molecular structure tools, or a
            chemical inventory LIMS.
          </p>
        </div>
      </section>

      {/* ── What is SciNote ───────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border bg-muted/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
            What is SciNote?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            SciNote is an open-source ELN with a strong focus on life sciences, regulated
            environments, and team-based sample and inventory management. It offers a free community
            tier with storage limits, with paid team and enterprise plans for expanded features and
            storage.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Pricing:</strong> SciNote has a free tier limited in
            storage and team collaboration. The paid team plan unlocks larger storage quotas and
            priority support. SciNote is well-suited for regulated lab environments and
            teams with complex inventory needs, but does not include hardware DAQ or molecular
            structure tools.
          </p>
        </div>
      </section>

      {/* ── Full Comparison Table ─────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-8">
            Side-by-side comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted/20">
                  <th className="text-left py-4 px-5 text-foreground font-semibold border-b border-border">Feature</th>
                  <th className="text-left py-4 px-5 text-emerald-500 font-semibold border-b border-border">Inquestra</th>
                  <th className="text-left py-4 px-5 text-muted-foreground font-semibold border-b border-border">Benchling</th>
                  <th className="text-left py-4 px-5 text-muted-foreground font-semibold border-b border-border">LabArchives</th>
                  <th className="text-left py-4 px-5 text-muted-foreground font-semibold border-b border-border">SciNote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3.5 px-5 font-medium text-foreground">Price for academics</td>
                  <td className="py-3.5 px-5 text-emerald-500 font-semibold">Free, always: no limits</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Free academic tier (limited)</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Institution license required</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Free tier (storage limits)</td>
                </tr>
                <tr className="bg-muted/5">
                  <td className="py-3.5 px-5 font-medium text-foreground">Scientific disciplines</td>
                  <td className="py-3.5 px-5 text-emerald-500 font-semibold">Life sciences, chemistry, biotech, materials science, engineering</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Molecular biology, genetics, biotech</td>
                  <td className="py-3.5 px-5 text-muted-foreground">All disciplines (general purpose)</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Life sciences, medical research</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-foreground">Learning curve for students</td>
                  <td className="py-3.5 px-5 text-emerald-500 font-semibold">Minimal: productive within minutes</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Moderate: specialized UI</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Low: familiar document structure</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Low to moderate</td>
                </tr>
                <tr className="bg-muted/5">
                  <td className="py-3.5 px-5 font-medium text-foreground">Molecular biology support</td>
                  <td className="py-3.5 px-5 text-emerald-500 font-semibold">Yes: PCR, gel electrophoresis, molecular structures, primer inventory</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Yes: industry-leading molecular tools</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Basic (notebook only)</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Yes (protocols and inventory)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-foreground">Hardware DAQ integration</td>
                  <td className="py-3.5 px-5 text-emerald-500 font-semibold">Yes: Arduino, ESP32, USB instruments</td>
                  <td className="py-3.5 px-5 text-muted-foreground">No</td>
                  <td className="py-3.5 px-5 text-muted-foreground">No</td>
                  <td className="py-3.5 px-5 text-muted-foreground">No</td>
                </tr>
                <tr className="bg-muted/5">
                  <td className="py-3.5 px-5 font-medium text-foreground">Chemical inventory LIMS</td>
                  <td className="py-3.5 px-5 text-emerald-500 font-semibold">Yes: built-in, free, unlimited</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Yes (Benchling Registry)</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Limited attachment-based</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Yes (inventory module)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-foreground">Literature citation manager</td>
                  <td className="py-3.5 px-5 text-emerald-500 font-semibold">Yes: PubMed + Europe PMC integration</td>
                  <td className="py-3.5 px-5 text-muted-foreground">No native citation manager</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Yes (widget-based)</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Limited</td>
                </tr>
                <tr className="bg-muted/5">
                  <td className="py-3.5 px-5 font-medium text-foreground">Cryptographic audit trail</td>
                  <td className="py-3.5 px-5 text-emerald-500 font-semibold">Yes: SHA-256 provenance, free</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Enterprise tier only</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Yes</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Yes</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-foreground">Setup required</td>
                  <td className="py-3.5 px-5 text-emerald-500 font-semibold">None: browser only, no installation</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Account creation + onboarding</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Institution account required</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Account required</td>
                </tr>
                <tr className="bg-muted/5">
                  <td className="py-3.5 px-5 font-medium text-foreground">Open source</td>
                  <td className="py-3.5 px-5 text-muted-foreground">GitHub available</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Closed source</td>
                  <td className="py-3.5 px-5 text-muted-foreground">Closed source</td>
                  <td className="py-3.5 px-5 text-emerald-500 font-semibold">Yes: open source core</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Who should use each ───────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border bg-muted/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-8">
            Who should use each platform?
          </h2>
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Choose Inquestra if:</h3>
              <ul className="space-y-1.5 ml-4 list-disc">
                <li>You are a student, postdoc, or independent researcher who needs a free, full-featured ELN with no institutional affiliation or IT setup required</li>
                <li>Your research spans multiple disciplines (chemistry, biology, materials, engineering) and you need a single notebook rather than domain-specific tools</li>
                <li>You use or plan to use physical instruments (Arduino, ESP32, or USB DAQ devices) and want their data logged directly in your notebook</li>
                <li>You run molecular biology protocols (PCR, gel electrophoresis, DNA extraction) alongside instrument measurements or chemical synthesis</li>
                <li>You need technical controls (immutable audit trails and SHA-256 seals) for regulatory or grant documentation without paying for an enterprise tier</li>
                <li>You value a minimal learning curve: get a new rotating student productive in under 10 minutes</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Choose Benchling if:</h3>
              <ul className="space-y-1.5 ml-4 list-disc">
                <li>Your lab is primarily focused on molecular biology, genetics, CRISPR screening, or plasmid design</li>
                <li>You need industry-standard biological registry and sequence management features used by biotech companies</li>
                <li>Your institution has a Benchling academic license already in place</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Choose LabArchives if:</h3>
              <ul className="space-y-1.5 ml-4 list-disc">
                <li>Your university has a site license that provides free access to all students and faculty</li>
                <li>You prefer a simple, folder-and-document structure without the need for structured inventory or hardware integration</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Choose SciNote if:</h3>
              <ul className="space-y-1.5 ml-4 list-disc">
                <li>You are in a regulated medical research environment with complex team-based sample management requirements</li>
                <li>You prefer an open-source platform you can self-host</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Inquestra for academic labs deep-dive ────────────────────────────── */}
      <section className="py-16 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
            Inquestra for academic labs: a detailed look
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            Academic labs face a unique set of constraints that most ELN vendors design around rather
            than for. Students rotate every semester. Postdocs balance multiple projects. Professors
            need grant-ready, reproducible documentation without depending on expensive site licenses
            that disappear when funding cycles change.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            Inquestra was built from scratch to address these constraints. The notebook editor
            requires no training: it uses familiar document conventions augmented with a slash
            command menu that surfaces scientific blocks (equations, molecular structures, timers,
            telemetry charts) on demand. A new rotating undergraduate can open the workspace, create
            a trial, and start documenting a PCR protocol in under five minutes, with no manual,
            tutorial, or IT ticket required.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            The chemical and biological inventory LIMS is integrated directly into the notebook
            context: reagents and standards referenced in a protocol are linked to their inventory
            records, so lot tracking and concentration audits are automatic rather than manual
            spreadsheet work. Literature citations pull directly from PubMed and Europe PMC with a
            single DOI or search query, eliminating manual reference entry.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            For labs using physical instruments (temperature sensors, pH meters, spectrophotometers,
            custom Arduino-based rigs), Inquestra&apos;s hardware DAQ module streams data directly into
            the protocol notebook via Web Serial API (Chrome/Edge), creating a time-stamped,
            cryptographically sealed record of every measurement without manual transcription. This
            is a capability unique to Inquestra among free ELN platforms as of November 2026.
          </p>
        </div>
      </section>

      {/* ── Pricing breakdown ─────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border bg-muted/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">
            Pricing comparison for academic researchers
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <div className="border border-emerald-500/30 rounded-lg p-5 bg-emerald-500/5">
              <h3 className="font-semibold text-foreground mb-2">Inquestra</h3>
              <p className="text-emerald-500 font-bold text-lg mb-1">Free (open development)</p>
              <p className="text-muted-foreground">
                Full notebook, inventory, molecular structures, citations, hardware DAQ, and audit
                trails. Free for individual researchers, with core tools available directly in the browser.
              </p>
            </div>
            <div className="border border-border rounded-lg p-5">
              <h3 className="font-semibold text-foreground mb-2">Benchling (Academic)</h3>
              <p className="text-sky-400 font-bold text-lg mb-1">Free academic tier</p>
              <p className="text-muted-foreground">
                Free for verified academic users. Advanced features, batch operations, and enterprise
                compliance require commercial plans. Primarily focused on molecular biology and
                biotech workflows.
              </p>
            </div>
            <div className="border border-border rounded-lg p-5">
              <h3 className="font-semibold text-foreground mb-2">LabArchives</h3>
              <p className="text-amber-400 font-bold text-lg mb-1">Institution license</p>
              <p className="text-muted-foreground">
                Typically $10 to $15 per user per year at institutional scale; free to individual users only
                when their university holds a site license. No free individual tier. Pricing varies
                by institution size.
              </p>
            </div>
            <div className="border border-border rounded-lg p-5">
              <h3 className="font-semibold text-foreground mb-2">SciNote</h3>
              <p className="text-sky-400 font-bold text-lg mb-1">Free tier (limited)</p>
              <p className="text-muted-foreground">
                Free community tier with limited storage (1 GB). Team plan starts at approximately
                $149/user/year. Open-source self-hosted version available but requires server
                infrastructure.
              </p>
            </div>
          </div>

          {/* Dedicated In-Depth Comparison Guides */}
          <div className="mt-12 p-6 rounded-xl border border-border bg-muted/10">
            <h3 className="text-lg font-bold text-foreground mb-3">Looking for a Specific Alternative?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Read our dedicated evaluations comparing migration steps, compliance, and bench usability:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/compare/benchling-alternative"
                className="p-4 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors group flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Best Benchling Alternative
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Why molecular biology & chemistry labs switch to Inquestra.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-2 shrink-0" />
              </Link>
              <Link
                href="/compare/labarchives-alternative"
                className="p-4 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors group flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Best LabArchives Alternative
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upgrading academic teams from legacy folder trees to modern canvas speed.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-2 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
            Try Inquestra in your lab.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Launch the workspace directly in your browser and start documenting your next protocol in minutes.
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
              href="/about"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-3.5 rounded text-sm font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              About the project
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
