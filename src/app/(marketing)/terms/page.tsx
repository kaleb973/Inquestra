import Link from 'next/link';
import { Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Enterprise terms of service, acceptable use, and compliance policies for Inquestra research platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="pt-28 pb-20">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 border-b border-border pb-8">
          <h1 className="font-display text-3xl sm:text-5xl font-normal text-foreground tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-xs font-mono">
            Last Updated: September 30, 2026 · Effective Date: October 1, 2026
          </p>
        </div>

        {/* Clauses */}
        <div className="space-y-10 text-muted-foreground text-sm leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Agreement to Terms &amp; Age Eligibility</h2>
            <p className="mb-3">
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you
              (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and Inquestra
              (&quot;Inquestra&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), governing your access to and
              use of the Inquestra Data Acquisition (DAQ) and Electronic Research Notebook (ERN) platform, websites,
              APIs, and services.
            </p>
            <div className="p-4 bg-card border border-border rounded-lg text-foreground">
              <strong className="block mb-1">Strict Age Requirement (COPPA Safe Harbor):</strong>
              Inquestra is exclusively designed and operated for adult professional researchers, engineers, academic faculty,
              and institutional laboratory staff. <strong>You must be at least eighteen (18) years of age</strong> to create
              an account, join an institutional lab, or access the services. Inquestra does not knowingly collect, solicit,
              or store personal information from anyone under the age of 18, in compliance with the Children&apos;s Online
              Privacy Protection Act (COPPA). If we learn an account belongs to a minor, it will be immediately terminated.
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. 21 CFR Part 11 Electronic Records &amp; Signatures</h2>
            <p className="mb-3">
              Inquestra incorporates technical design controls tailored for compliance with the United States Food and
              Drug Administration (FDA) regulations set forth in <strong>Title 21 of the Code of Federal Regulations Part 11
              (21 CFR Part 11)</strong>, Good Laboratory Practices (GLP), and Good Clinical Practices (GCP):
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Electronic Signatures:</strong> Electronic signatures executed on Inquestra
                (including Author, Witness, and Principal Investigator approval roles) are designed to be the legally binding
                equivalent of handwritten signatures.
              </li>
              <li>
                <strong className="text-foreground">Credential Integrity:</strong> Users are prohibited from sharing credentials,
                session tokens, or passkeys. Any action performed under your authenticated session will be attributed to your identity
                in the immutable audit ledger.
              </li>
              <li>
                <strong className="text-foreground">Tamper-Evident Hashing:</strong> Once an experiment trial is cryptographically sealed,
                its contents, metadata, and linked hardware telemetry streams are permanently locked with a SHA-256 checksum. Any attempt
                to alter historical records will fail integrity checks.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Acceptable Use &amp; Hardware Telemetry</h2>
            <p className="mb-3">
              You agree not to use the platform to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Upload malicious code, corrupted serial packets, or attempt denial-of-service against telemetry ingestion endpoints.</li>
              <li>Circumvent or tamper with cryptographic checksums, audit logs, or institutional role-based access control (RBAC).</li>
              <li>Transmit unauthorized, classified, or export-controlled biological, chemical, or radiological data in violation of applicable laws.</li>
              <li>Infringe upon the intellectual property, trade secret, or privacy rights of any third party.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Commercial Subscriptions &amp; Automatic Renewal Terms</h2>
            <p className="mb-3">
              Inquestra offers both free open-core software tiers and optional commercial subscription tiers (e.g., Pro, Enterprise).
              In compliance with applicable consumer protection and Automatic Renewal Laws (including California Business and Professions
              Code § 17600 et seq.):
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Recurring Billing:</strong> If you enroll in a paid subscription, your payment method
                will be charged recurringly at the frequency stated at checkout (monthly or annually) until you cancel.
              </li>
              <li>
                <strong className="text-foreground">Unconditional Online Cancellation:</strong> You may cancel your subscription at any time
                directly within the application via your <Link href="/app/billing" className="text-primary hover:underline">Workspace Billing Settings</Link> or
                by contacting billing support. No phone calls or retention hurdles are required.
              </li>
              <li>
                <strong className="text-foreground">Effect of Cancellation:</strong> Upon cancellation, your subscription will continue through
                the conclusion of your current paid billing period without further recurring charges. Export access to your scientific data
                remains available.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Digital Millennium Copyright Act (DMCA) Notice &amp; Takedown</h2>
            <p className="mb-3">
              Inquestra respects the intellectual property rights of others and complies with the Digital Millennium Copyright Act
              of 1998 (17 U.S.C. § 512). If you believe that content hosted on Inquestra infringes your copyright, you may submit a
              written notification to our Designated Copyright Agent containing the required statutory elements:
            </p>
            <div className="p-4 bg-card border border-border rounded-lg space-y-1.5 text-xs font-mono text-muted-foreground">
              <p className="font-semibold text-foreground text-sm font-sans mb-1">Designated DMCA Copyright Notices:</p>
              <p>Inquestra — Legal &amp; Compliance Team</p>
              <p>Email: <span className="text-foreground font-semibold select-all">legal@inquestra.org</span></p>
              <p className="pt-1 font-sans">
                <Link href="/contact" className="text-primary hover:underline">
                  Visit Contact &amp; Inquiries Page →
                </Link>
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Scientific Disclaimer &amp; Limitation of Liability</h2>
            <p className="mb-3">
              INQUESTRA IS A RESEARCH AND DATA ACQUISITION NOTEBOOK SYSTEM. THE SOFTWARE IS PROVIDED ON AN &quot;AS IS&quot;
              AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND. INQUESTRA DOES NOT PROVIDE MEDICAL DIAGNOSES,
              DRUG PRESCRIPTIONS, OR DIRECT CLINICAL TREATMENT DECISIONS. RESEARCHERS AND INSTITUTIONS BEAR SOLE RESPONSIBILITY
              FOR SCIENTIFIC METHODOLOGY, LAB SAFETY, AND REGULATORY SUBMISSIONS.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Modifications &amp; Inquiries</h2>
            <p>
              We reserve the right to revise these Terms as regulatory standards and platform capabilities evolve. Continued use
              of the platform after an update signifies your acceptance. For legal questions or institutional master services
              agreements (MSAs), please visit our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link> or
              email <span className="text-foreground select-all font-mono font-medium">legal@inquestra.org</span>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
