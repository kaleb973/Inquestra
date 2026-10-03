import Link from 'next/link';
import { ArrowRight, ShieldCheck, Lock, FileCheck, Key, CheckCircle, AlertCircle, Fingerprint, Database } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cryptographic Provenance & 21 CFR Part 11 Compliance — Inquestra',
  description:
    'Immutable data provenance, deterministic SHA-256 trial hashing, RFC 3161 timestamps, and FDA 21 CFR Part 11 compliance for biomedical research.',
};

export default function ProvenancePage() {
  return (
    <div className="pt-28 pb-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-muted text-muted-foreground text-xs font-mono uppercase tracking-wider mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-phosphor" />
            <span>Platform / Regulatory Compliance &amp; Integrity</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-normal tracking-tight text-foreground mb-6 leading-[1.15]">
            Zero silent mutations. Immutable research integrity.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
            Scientific irreproducibility thrives in the gap between physical sensor capture and report publication.
            Inquestra cryptographically binds hardware telemetry, notebook protocol logs, and reagent deductions into
            a deterministic SHA-256 digest adhering strictly to FDA 21 CFR Part 11.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-6 py-3 rounded text-sm font-medium transition-colors"
            >
              Open Research Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 px-6 py-3 rounded text-sm font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              Inspect Ingestion Pipeline
            </Link>
          </div>
        </div>

        {/* Cryptographic Seal Visual Card */}
        <div className="mt-14 bg-card border border-border rounded-lg overflow-hidden shadow-xl">
          <div className="bg-muted/70 px-4 py-2.5 border-b border-border flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-caution" />
              <span className="font-semibold text-foreground">Cryptographic Trial Dossier</span>
              <span className="text-muted-foreground">#TR-2026-9042 · Sealed &amp; Validated</span>
            </div>
            <span className="text-caution font-medium bg-caution/10 border border-caution/30 px-2 py-0.5 rounded text-[10px]">
              IMMUTABLE RECORD
            </span>
          </div>

          <div className="p-6 grid lg:grid-cols-12 gap-8 bg-background">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center text-xs font-mono text-muted-foreground">
                <span>DIGITAL SIGNATURE CHAIN OF CUSTODY</span>
                <span className="text-phosphor">VERIFIED RFC 3161 TIMESTAMP</span>
              </div>
              <div className="p-4 rounded border border-border bg-card space-y-3 font-mono text-xs">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <div>
                    <div className="text-foreground font-semibold">Author Execution Signature</div>
                    <div className="text-muted-foreground text-[11px]">Dr. Eleanor Vance, PhD · Senior Research Scientist</div>
                  </div>
                  <span className="text-phosphor text-[11px]">SEAL APPLIED</span>
                </div>
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <div>
                    <div className="text-foreground font-semibold">Principal Investigator Counter-Sign</div>
                    <div className="text-muted-foreground text-[11px]">Prof. Marcus Sterling, MD, PhD · Lab Director</div>
                  </div>
                  <span className="text-phosphor text-[11px]">CO-SIGNED</span>
                </div>
                <div className="pt-1 text-[11px] text-muted-foreground space-y-1">
                  <div>Deterministic Digest (SHA-256):</div>
                  <div className="text-foreground select-all bg-muted/40 p-1.5 rounded truncate font-mono text-[10px]">
                    4f53cda18c2e8697b91d2938e3e4a5d89f10928374a56b2c1d0e9f8a7b6c5d4e
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-card border border-border rounded p-4 flex flex-col justify-between font-mono text-xs space-y-4">
              <div>
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Part 11 Attestation Manifest
                </div>
                <ul className="space-y-2 text-[11px] text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-phosphor" />
                    <span>Append-only audit trail logging active</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-phosphor" />
                    <span>Raw serial packet stream checksum verified</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-phosphor" />
                    <span>LIMS reagent batch deductions confirmed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-phosphor" />
                    <span>Non-repudiation cryptographic key bound</span>
                  </li>
                </ul>
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Audit Status</span>
                <span className="text-phosphor font-semibold">INSPECTION-READY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1: The Cryptographic Hash Pipeline */}
      <section className="py-16 border-t border-border bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Mathematical Foundation
            </span>
            <h2 className="font-display text-3xl font-normal text-foreground mt-2 tracking-tight">
              How Inquestra seals experimental trials.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              When an experiment is concluded, Inquestra does not just save a database row. It compiles the entire
              context into an unalterable cryptographic block.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-card border border-border p-5 rounded-lg space-y-2">
              <span className="text-xs font-mono text-muted-foreground">STEP 01</span>
              <h3 className="text-sm font-semibold text-foreground">Sensor Ingestion Buffer</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Raw serial byte arrays and microsecond timestamps are frozen in the Web Worker memory ring.
              </p>
            </div>

            <div className="bg-card border border-border p-5 rounded-lg space-y-2">
              <span className="text-xs font-mono text-muted-foreground">STEP 02</span>
              <h3 className="text-sm font-semibold text-foreground">Protocol Notes &amp; LIMS</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Experimental observations, math formulas, chemical lot numbers, and author metadata are normalized to JSON.
              </p>
            </div>

            <div className="bg-card border border-border p-5 rounded-lg space-y-2">
              <span className="text-xs font-mono text-muted-foreground">STEP 03</span>
              <h3 className="text-sm font-semibold text-foreground">Deterministic Digest</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A deterministic SHA-256 hash is computed across all concatenated streams, creating a unique digital fingerprint.
              </p>
            </div>

            <div className="bg-card border border-border p-5 rounded-lg space-y-2">
              <span className="text-xs font-mono text-muted-foreground">STEP 04</span>
              <h3 className="text-sm font-semibold text-foreground">Immutable Ledger Anchor</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The trial transitions to COMPLETED. Any subsequent modification attempt triggers an integrity alarm and invalidates the seal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2: FDA 21 CFR Part 11 Compliance Table */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Regulatory Verification
            </span>
            <h2 className="font-display text-3xl font-normal text-foreground mt-2 tracking-tight">
              FDA 21 CFR Part 11 Alignment Matrix.
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Designed specifically for Good Laboratory Practice (GLP) and Good Manufacturing Practice (GMP) biotechnology compliance.
            </p>
          </div>

          <div className="border border-border rounded-lg overflow-x-auto bg-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-foreground font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">CFR § Clause</th>
                  <th className="py-3.5 px-4 font-semibold">Regulatory Requirement</th>
                  <th className="py-3.5 px-4 font-semibold">Inquestra Architectural Implementation</th>
                  <th className="py-3.5 px-4 font-semibold">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans text-muted-foreground">
                <tr className="hover:bg-muted/20">
                  <td className="py-3.5 px-4 font-mono text-foreground font-medium">§ 11.10 (a)</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Validation of Closed Systems</td>
                  <td className="py-3.5 px-4">Deterministic state machine validation, automated end-to-end integration test suites</td>
                  <td className="py-3.5 px-4 font-mono text-phosphor">VALIDATED</td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-3.5 px-4 font-mono text-foreground font-medium">§ 11.10 (e)</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Time-Stamped Audit Trails</td>
                  <td className="py-3.5 px-4">Computer-generated, append-only PostgreSQL audit ledger logging actor, timestamp, action &amp; hash</td>
                  <td className="py-3.5 px-4 font-mono text-phosphor">VALIDATED</td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-3.5 px-4 font-mono text-foreground font-medium">§ 11.50</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Signature Manifestations</td>
                  <td className="py-3.5 px-4">Contains printed name, UTC timestamp, and explicit signing reason (Author, Reviewer, Principal Investigator)</td>
                  <td className="py-3.5 px-4 font-mono text-phosphor">VALIDATED</td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-3.5 px-4 font-mono text-foreground font-medium">§ 11.70</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Signature Linking</td>
                  <td className="py-3.5 px-4">Cryptographic signature is inextricably hashed into the trial record block; cannot be excised or transferred</td>
                  <td className="py-3.5 px-4 font-mono text-phosphor">VALIDATED</td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-3.5 px-4 font-mono text-foreground font-medium">NIH FAIR</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Data Stewardship Standards</td>
                  <td className="py-3.5 px-4">Standardized JSON-LD metadata schemas for Findability, Accessibility, Interoperability, and Reusability</td>
                  <td className="py-3.5 px-4 font-mono text-phosphor">COMPLIANT</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Feature Section 3: Tamper-Evident Export */}
      <section className="py-20 border-t border-border bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Zero Vendor Lock-In
              </span>
              <h2 className="font-display text-3xl font-normal text-foreground tracking-tight">
                Inspect and verify exports in standard terminal tools.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When you export an Inquestra experiment, you receive a standalone archive containing the raw CSV telemetry,
                the markdown protocol note, the author cryptographic manifest, and a checksum file.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Any regulatory inspector, peer-review journal, or institutional archivist can verify integrity without
                an Inquestra account using standard open-source command line utilities.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-5 font-mono text-xs text-foreground space-y-3 shadow-sm">
              <div className="text-muted-foreground">{''}</div>
              <div className="text-muted-foreground">$ unzip trial_TR-2026-9042_sealed.zip</div>
              <div>$ sha256sum -c checksums.sha256</div>
              <div className="p-2.5 rounded bg-muted/30 border border-border space-y-1 text-[11px]">
                <div className="text-phosphor">telemetry_raw_1000hz.csv: OK</div>
                <div className="text-phosphor">protocol_observations.md: OK</div>
                <div className="text-phosphor">lims_reagent_manifest.json: OK</div>
                <div className="text-phosphor">audit_trail_ledger.json: OK</div>
              </div>
              <div className="text-foreground text-[11px]">Verification Result: 100% Cryptographic Match</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 text-center">
        <div className="p-10 rounded-xl bg-card border border-border shadow-sm">
          <h3 className="font-display text-2xl sm:text-3xl text-foreground mb-3 font-normal">
            Protect your lab&apos;s data provenance.
          </h3>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
            Explore the technical pipeline behind our high-speed acquisition and tamper-evident storage architecture.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded text-xs font-semibold transition-colors"
            >
              Explore System Architecture
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/hardware"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded text-xs font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              Review Hardware Specifications
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
