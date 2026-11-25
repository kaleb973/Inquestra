import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { PilotInterestForm } from '@/components/marketing/PilotInterestForm';

export const metadata: Metadata = {
  title: {
    absolute: 'Inquestra: Local-First Electronic Lab Notebook (ELN)',
  },
  description:
    'An open electronic lab notebook that stores protocol notes, reagent lots, and serial instrument data directly on your machine.',
  openGraph: {
    title: 'Inquestra: Local-First Electronic Lab Notebook (ELN)',
    description:
      'An open electronic lab notebook that stores protocol notes, reagent lots, and serial instrument data directly on your machine.',
  },
  twitter: {
    title: 'Inquestra: Local-First Electronic Lab Notebook (ELN)',
    description:
      'An open electronic lab notebook that stores protocol notes, reagent lots, and serial instrument data directly on your machine.',
  },
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
      'Browser-based research notebook pairing protocol documentation with chemical storage and serial instrument capture on your local machine.',
  };

  return (
    <div className="font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
                  text: 'Inquestra is a browser-based notebook for experimental laboratory work. Researchers run step-by-step protocols alongside chemical aliquot logs and real-time serial instrument capture on their local machine.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is Inquestra free for academic labs and students?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Inquestra is free to use without subscriptions. All notes and instrument telemetry remain stored on your machine.',
                },
              },
              {
                '@type': 'Question',
                name: 'Does Inquestra support molecular biology research?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. It includes built-in primitives for PCR protocols, primer analysis, 2D SMILES rendering via PubChem, and inline DOI lookups through PubMed and Europe PMC.',
                },
              },
              {
                '@type': 'Question',
                name: 'How does Inquestra handle data ownership?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Inquestra stores your unpublished trials and telemetry locally in your browser using IndexedDB. You can export complete records as Markdown notes and CSV files at any time.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is Inquestra easy to learn for students and new researchers?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Inquestra is designed for fast bench onboarding. The notebook editor uses familiar document conventions with slash commands, runs in standard modern web browsers without installing drivers, and includes one-click export protection for shared lab computers.',
                },
              },
            ],
          }),
        }}
      />

      {/* ── 1. Hero & Real Product Screen ──────────────────────────────────────── */}
      <section className="pt-12 sm:pt-16 pb-16 sm:pb-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-5 text-left">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.06]">
              The local-first electronic lab notebook.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Log bench protocols with reagent lots and USB telemetry in Chromium.
            </p>

            <p className="sr-only">
              Inquestra is an open electronic lab notebook combining protocol tracking, reagent
              lots, 2D molecular structures, and serial instrument recording within a local
              browser workspace.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Link
                href="/app"
                className="inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground hover:opacity-95 px-6 h-11 rounded-md text-sm font-semibold transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Open Research Workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex justify-center items-center gap-2 px-5 h-11 rounded-md text-sm font-medium border border-border bg-card text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Explore Live Demo
              </Link>
            </div>
          </div>

          <figure className="mt-10 sm:mt-12 rounded-lg border border-border bg-card overflow-hidden">
            <Image
              src="/screens/workspace-light.png"
              alt="Inquestra desktop workspace showing local IndexedDB storage, trial protocol steps, inline countdown timers, and navigation sidebar in light theme"
              width={2880}
              height={1800}
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="w-full h-auto block dark:hidden"
            />
            <Image
              src="/screens/workspace-dark.png"
              alt="Inquestra desktop workspace showing local IndexedDB storage, trial protocol steps, inline countdown timers, and navigation sidebar in dark theme"
              width={2880}
              height={1800}
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="w-full h-auto hidden dark:block"
            />
          </figure>
        </div>
      </section>

      {/* ── 2. Workspace Architecture & Built-In Primitives ────────────────────── */}
      <section id="features" className="py-20 sm:py-24 border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Structured trial records inside one canvas.
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Every trial runs inside an offline-first TipTap editor stored locally in IndexedDB. Opening the workspace requires no account or installation, letting researchers start documenting protocols, inventory deductions, and mathematical formulas immediately.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Scientific blocks (incubation timers, SMILES structure depictions, DNA sequence statistics, and reagent links) insert inline via slash commands and export cleanly to Markdown, JSON, and CSV.
              </p>
            </div>

            <div className="lg:col-span-7 border-y border-border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3.5 pr-6 font-semibold text-foreground w-1/3">Module</th>
                    <th className="py-3.5 px-4 font-semibold text-foreground">Capabilities in workspace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 pr-6 font-medium text-foreground align-top">Protocol Engine</td>
                    <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                      Step checklists with per-step timers, deviation annotations, and KaTeX stoichiometry calculations.
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 pr-6 font-medium text-foreground align-top">Reagent Inventory</td>
                    <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                      Stock volume tracking linked to trial protocols with manufacturer lot numbers, storage locations, and QR/DataMatrix labels.
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 pr-6 font-medium text-foreground align-top">Chemistry and Sequence</td>
                    <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                      2D SMILES depictions via PubChem resolution alongside inline DNA/RNA/protein GC% and Tm sequence calculations.
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 pr-6 font-medium text-foreground align-top">Literature Citations</td>
                    <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                      Inline DOI resolution and bibliography lookups querying PubMed, Europe PMC, and arXiv directly from trial notes.
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 pr-6 font-medium text-foreground align-top">Disciplines Supported</td>
                    <td className="py-4 px-4 text-muted-foreground leading-relaxed">
                      Shared trial schema spanning chemistry, molecular biology, materials testing, biopharma batch logs, and hardware engineering.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Direct USB Hardware Acquisition ────────────────────────────────── */}
      <section id="hardware" className="py-20 sm:py-24 border-b border-border bg-muted/20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Live serial capture directly inside browser notes.
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                W3C Web Serial connects balances, RTD temperature probes, load cells, potentiostats, and microcontrollers (ESP32-S3, Teensy 4.1, Arduino) straight to your active trial without vendor kernel drivers or standalone Python listeners.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Incoming serial lines run inside an off-main-thread Web Worker ring buffer up to 921,600 baud, rendering continuous sweeps in real time while rich-text editing remains responsive. Captured traces export alongside trial notes as plain CSV.
              </p>

              <dl className="grid grid-cols-2 gap-6 pt-4 border-t border-border text-xs">
                <div>
                  <dt className="text-muted-foreground font-medium">Supported transport</dt>
                  <dd className="font-mono text-foreground font-medium mt-1">USB-CDC and UART (9,600 to 921,600 baud)</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Browser runtime</dt>
                  <dd className="font-mono text-foreground font-medium mt-1">Chrome, Edge, Chromium (Web Worker)</dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center gap-5 pt-2 text-sm">
                <Link
                  href="/hardware"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Read hardware specs and firmware examples
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/demo"
                  className="text-muted-foreground hover:text-foreground font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Open DAQ simulator
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <figure className="w-full max-w-sm rounded-lg border border-border bg-card overflow-hidden">
                <Image
                  src="/screens/telemetry-light.png"
                  alt="Inquestra telemetry drawer streaming 50 Hz temperature readings over a green live oscilloscope plot with Export CSV and Connect USB Device controls"
                  width={720}
                  height={1400}
                  sizes="(max-width: 1024px) 100vw, 384px"
                  className="w-full h-auto block dark:hidden"
                />
                <Image
                  src="/screens/telemetry-dark.png"
                  alt="Inquestra telemetry drawer streaming 50 Hz temperature readings over a green live oscilloscope plot with Export CSV and Connect USB Device controls in dark theme"
                  width={720}
                  height={1400}
                  sizes="(max-width: 1024px) 100vw, 384px"
                  className="w-full h-auto hidden dark:block"
                />
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Persistence and Cryptographic Provenance ───────────────────────── */}
      <section id="provenance" className="py-20 sm:py-24 border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
            <div className="lg:col-span-6 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Local storage by default, optional PostgreSQL sync.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Unpublished experiments save continuously inside browser IndexedDB so bench work continues across basement labs or air-gapped rooms with zero network dependency.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Research teams can connect their own self-hosted PostgreSQL database via Prisma ORM for shared inventories, role-based project oversight, and append-only revision diffs with no per-seat licensing.
              </p>
              <div className="pt-2">
                <Link
                  href="/architecture"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Inspect telemetry and sync pipeline
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Deterministic SHA-256 sealing and open exports.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Completed trials compile into a canonical key-sorted JSON payload hashed under SHA-256 alongside author and PI signatures, ensuring post-hoc changes to text, lots, or telemetry arrays are detected immediately.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Export sealed records anytime as self-contained ZIP archives containing readable Markdown documents, raw CSV instrument files, and verifiable checksum manifests inspectable with standard <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">sha256sum</code> utilities.
              </p>
              <div className="pt-2">
                <Link
                  href="/provenance"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Inspect cryptographic sealing and test verification
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Pilot Lab Onboarding (5/7 Split) ───────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-muted/20" id="pilot">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-4 text-left">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Set up Inquestra with your lab group.
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Core local workspace tools stay free in your browser. Reach out if your research team needs custom serial instrument firmware profiles or assistance deploying self-hosted PostgreSQL.
              </p>
              <dl className="pt-4 border-t border-border space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Onboarding response</dt>
                  <dd className="font-mono text-foreground">Within 2 business days</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Academic access</dt>
                  <dd className="font-mono text-phosphor">$0 (open infrastructure)</dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-7 bg-card border border-border rounded-lg p-6 sm:p-8">
              <div className="mb-6 pb-4 border-b border-border text-left">
                <h3 className="text-lg font-semibold text-foreground">
                  Request Pilot Lab Access
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Share your lab setup and any serial hardware you want to connect.
                </p>
              </div>
              <PilotInterestForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
