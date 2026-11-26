import Link from 'next/link';
import { ArrowRight, Lock, CheckCircle } from 'lucide-react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildGraphSchema,
  buildPageMetadata,
} from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Cryptographic Provenance and Audit Verification',
  description:
    'Tamper-evident record hashing, SHA-256 trial checksums, and immutable audit logs for experimental science.',
  path: '/provenance',
});

export default function ProvenancePage() {
  const structuredData = buildGraphSchema([
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Cryptographic Provenance', path: '/provenance' },
    ]),
  ]);

  return (
    <div className="pt-14 sm:pt-20 pb-24">
      <JsonLd data={structuredData} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-5 leading-[1.1]">
            Tamper-evident verification for experimental research.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
            Inquestra hashes notes and serial logs with SHA-256 upon trial completion.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-95 px-6 h-11 rounded-md text-sm font-semibold transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open Research Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 px-6 h-11 rounded-md text-sm font-medium border border-border bg-card text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Inspect Ingestion Pipeline
            </Link>
          </div>
        </div>

        {/* Cryptographic Seal Visual Panel (zero nested cards, zero shadow-xl) */}
        <div className="mt-12 bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/60 px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-3.5 h-3.5 text-caution" />
              <span className="font-semibold text-foreground">Trial Record Certificate</span>
              <span className="text-muted-foreground">#PR-2026-PCR-01, Sealed</span>
            </div>
            <span className="text-caution font-medium bg-caution/10 px-2.5 py-0.5 rounded">
              Immutable Record
            </span>
          </div>

          <div className="p-6 grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border gap-8 bg-background">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-mono text-muted-foreground">
                <span>Digital Signature Chain of Custody</span>
                <span className="text-phosphor">ISO 8601 UTC timestamp verified</span>
              </div>
              <div className="divide-y divide-border border-y border-border font-mono text-xs">
                <div className="flex items-start justify-between py-3">
                  <div>
                    <div className="text-foreground font-semibold">Author Execution Signature</div>
                    <div className="text-muted-foreground">KH, Protocol Author</div>
                  </div>
                  <span className="text-phosphor">Seal applied</span>
                </div>
                <div className="flex items-start justify-between py-3">
                  <div>
                    <div className="text-foreground font-semibold">Principal Investigator Counter-Sign</div>
                    <div className="text-muted-foreground">Lab Lead [Verified ECDSA signature]</div>
                  </div>
                  <span className="text-phosphor">Co-signed</span>
                </div>
                <div className="py-3 text-muted-foreground space-y-1.5">
                  <div>Deterministic Digest (SHA-256):</div>
                  <div className="text-foreground select-all bg-muted/50 p-2 rounded truncate">
                    1cfa3f0f0064c27d6cb034f4166e559daa8a07edc944ae590ff3b6d3e10f5d9e
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between text-xs space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3">
                  Data integrity manifest
                </h2>
                <ul className="space-y-2.5 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-phosphor shrink-0" />
                    <span>Append-only audit trail logging active</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-phosphor shrink-0" />
                    <span>Raw serial packet stream checksum verified</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-phosphor shrink-0" />
                    <span>LIMS reagent batch deductions confirmed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-phosphor shrink-0" />
                    <span>Non-repudiation cryptographic key bound</span>
                  </li>
                </ul>
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between font-mono">
                <span className="text-muted-foreground">Audit status</span>
                <span className="text-phosphor font-semibold">Audit Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <h2 className="text-3xl font-semibold text-foreground tracking-tight">
              How Inquestra seals experimental trials.
            </h2>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed">
              When a trial concludes, Inquestra compiles the full context into a verifiable cryptographic block.
            </p>
          </div>

          <div className="border-y border-border py-8 grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border gap-y-6">
            <div className="sm:pr-6">
              <p className="text-xs font-mono text-muted-foreground mb-2">Step 01</p>
              <p className="text-base font-semibold text-foreground mb-1">Sensor ingestion buffer</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Raw serial byte arrays and microsecond timestamps freeze in the Web Worker ring.
              </p>
            </div>
            <div className="pt-4 sm:pt-0 sm:px-6">
              <p className="text-xs font-mono text-muted-foreground mb-2">Step 02</p>
              <p className="text-base font-semibold text-foreground mb-1">Protocol notes and LIMS</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Observations, math formulas, chemical lot numbers, and author metadata normalize to JSON.
              </p>
            </div>
            <div className="pt-4 lg:pt-0 sm:pr-6 lg:px-6">
              <p className="text-xs font-mono text-muted-foreground mb-2">Step 03</p>
              <p className="text-base font-semibold text-foreground mb-1">Deterministic digest</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A SHA-256 hash is computed across all streams to create a single verifiable fingerprint.
              </p>
            </div>
            <div className="pt-4 lg:pt-0 sm:pl-6">
              <p className="text-xs font-mono text-muted-foreground mb-2">Step 04</p>
              <p className="text-base font-semibold text-foreground mb-1">Immutable ledger anchor</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The trial locks as completed. Post-hoc modifications fail verification immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <h2 className="text-3xl font-semibold text-foreground tracking-tight">
              Data integrity and standards alignment.
            </h2>
            <p className="text-base text-muted-foreground mt-2">
              Cryptographic primitives, append-only audit logs, and electronic signature workflows designed to support GLP and FDA 21 CFR Part 11 programs.
            </p>
          </div>

          <div className="border-y border-border overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-foreground">
                <tr>
                  <th className="py-3.5 pr-4 font-semibold">Standard / Guideline</th>
                  <th className="py-3.5 px-4 font-semibold">Integrity Objective</th>
                  <th className="py-3.5 px-4 font-semibold">Inquestra Architectural Implementation</th>
                  <th className="py-3.5 pl-4 font-semibold">Technical Control Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 pr-4 font-mono text-foreground font-medium">21 CFR § 11.10 (a)</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Validation of Closed Systems</td>
                  <td className="py-3.5 px-4">Deterministic state machine validation and automated end-to-end integration suites</td>
                  <td className="py-3.5 pl-4 font-mono text-xs text-phosphor">Controls Active</td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 pr-4 font-mono text-foreground font-medium">21 CFR § 11.10 (e)</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Time-Stamped Audit Trails</td>
                  <td className="py-3.5 px-4">Computer-generated, append-only PostgreSQL ledger logging actor, UTC timestamp, and hash</td>
                  <td className="py-3.5 pl-4 font-mono text-xs text-phosphor">Controls Active</td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 pr-4 font-mono text-foreground font-medium">21 CFR § 11.50</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Signature Manifestations</td>
                  <td className="py-3.5 px-4">Records printed name, UTC timestamp, and signing reason (Author, Reviewer, PI)</td>
                  <td className="py-3.5 pl-4 font-mono text-xs text-phosphor">Controls Active</td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 pr-4 font-mono text-foreground font-medium">21 CFR § 11.70</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Signature Linking</td>
                  <td className="py-3.5 px-4">Cryptographic signature is hashed directly into the trial record block</td>
                  <td className="py-3.5 pl-4 font-mono text-xs text-phosphor">Controls Active</td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 pr-4 font-mono text-foreground font-medium">NIH FAIR</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Data Stewardship Standards</td>
                  <td className="py-3.5 px-4">Standardized JSON-LD schemas for Findability, Accessibility, Interoperability, and Reusability</td>
                  <td className="py-3.5 pl-4 font-mono text-xs text-phosphor">FAIR Schema Ready</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-muted/30 rounded-md text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Regulatory Disclaimer:</strong> Formal regulatory compliance (FDA 21 CFR Part 11, GLP, GMP) requires institutional system validation (IQ/OQ/PQ), physical access controls, and procedural SOP adherence by the operating laboratory.
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-foreground tracking-tight">
                Verify exports with standard terminal tools.
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Exported archives bundle raw CSV telemetry, Markdown protocols, cryptographic manifests, and SHA-256 checksums.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Inspectors, reviewers, and archivists can verify every file offline using open command-line utilities.
              </p>
            </div>

            <div className="bg-graphite text-graphite-ink border border-border rounded-lg p-6 font-mono text-xs space-y-3">
              <div className="text-graphite-muted">$ unzip trial_PR-2026-PCR-01_sealed.zip</div>
              <div>$ sha256sum -c checksums.sha256</div>
              <div className="p-3 rounded bg-graphite-elevated space-y-1 text-xs">
                <div className="text-phosphor">temperature_cycle_log.csv: OK</div>
                <div className="text-phosphor">protocol_observations.md: OK</div>
                <div className="text-phosphor">lims_reagent_manifest.json: OK</div>
                <div className="text-phosphor">audit_trail_ledger.json: OK</div>
              </div>
              <div className="text-graphite-ink">Verification Result: 100% Cryptographic Match</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 text-center">
        <div className="p-10 rounded-lg bg-card border border-border">
          <h3 className="text-2xl sm:text-3xl text-foreground mb-3 font-semibold">
            Protect your lab&apos;s data provenance.
          </h3>
          <p className="text-base text-muted-foreground max-w-xl mx-auto mb-6">
            Explore the pipeline behind Inquestra&apos;s acquisition and tamper-evident storage architecture.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-95 px-6 h-11 rounded-md text-sm font-semibold transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Explore System Architecture
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/hardware"
              className="inline-flex items-center gap-2 px-6 h-11 rounded-md text-sm font-medium border border-border bg-background text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Review Hardware Specifications
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
