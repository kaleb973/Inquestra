import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Data privacy, security, and research data confidentiality policies for the Inquestra platform.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-16 sm:pt-20 pb-20">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 border-b border-border pb-8">
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-xs font-mono">
            Last Updated: September 30, 2026 · Effective Date: October 1, 2026
          </p>
        </div>

        {/* Clauses */}
        <div className="space-y-10 text-muted-foreground text-sm leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Overview &amp; Research Confidentiality</h2>
            <p className="mb-3">
              Inquestra (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
              respects the confidentiality of your scientific research, intellectual property, and personal information.
              This Privacy Policy describes our practices regarding the collection, handling, and safeguarding of data
              when you use our Electronic Research Notebook (ERN) and Data Acquisition (DAQ) systems.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Zero Third-Party Session Replay or Surveillance</h2>
            <div className="p-4 bg-card border border-border rounded-lg space-y-2 text-foreground">
              <p>
                <strong>Wiretapping &amp; CIPA Protection:</strong> Inquestra strictly adheres to a
                zero-surveillance philosophy. We <strong>do not employ session replay, screen recording, or keystroke tracking
                software</strong> (such as Hotjar, FullStory, LogRocket, or mouse-tracking heatmaps).
              </p>
              <p className="text-xs text-muted-foreground">
                Your research notes, experimental formulas, reagent ratios, and raw serial hardware packet telemetry are never
                streamed to consumer analytics services or unvetted advertising brokers.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Self-Hosted Infrastructure &amp; Font Privacy</h2>
            <p>
              To protect visitor privacy and satisfy stringent European and German data privacy standards (including the 2022 Munich
              Regional Court ruling on dynamic IP transmission), Inquestra self-hosts its typography directly
              from our static application delivery infrastructure. When you browse Inquestra, your IP address is not transmitted
              to third-party CDN font endpoints at runtime.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Account Credentials &amp; Profiles:</strong> When you register, we collect your name,
                institutional work email address, lab type, hashed passwords, and WebAuthn/FIDO2 passkey credentials.
              </li>
              <li>
                <strong className="text-foreground">Laboratory Data &amp; Telemetry:</strong> Experimental notebooks, TipTap documents,
                FAIR metadata tags, sensor sample streams (e.g., ESP32/Arduino data via Web Serial), inventory lots, and equipment calibration dates.
              </li>
              <li>
                <strong className="text-foreground">Audit Trail &amp; Signature Logs:</strong> To maintain immutable data provenance and tamper-evident audit logs, we record
                timestamped events (user ID, action type, IP address, and cryptographic signatures).
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Children&apos;s Online Privacy Protection Act (COPPA)</h2>
            <p className="mb-3">
              Inquestra is exclusively designed and marketed for adult scientists, researchers, and engineers. Our services are
              strictly <strong>prohibited to individuals under eighteen (18) years of age</strong>. We do not knowingly collect,
              solicit, or maintain personal information from children under the age of 13 or minors under 18.
            </p>
            <p>
              If we become aware that an account has been established by an individual under the age of 18, we will immediately take
              steps to terminate the account and purge any associated personal data from our operational databases.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. CAN-SPAM &amp; Email Communications</h2>
            <p className="mb-3">
              In accordance with the CAN-SPAM Act:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>We only send transactional emails necessary for platform operation (email confirmation, password resets, lab clearance invitations, and critical security notices).</li>
              <li>Any optional product announcements or research digests include an unambiguous, functioning unsubscribe link.</li>
              <li>Every outbound communication clearly identifies Inquestra and provides our valid contact channels.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Data Security &amp; Encryption Standards</h2>
            <p>
              All communication between your browser and our servers is secured using modern Transport Layer Security (TLS 1.3).
              Stored databases and uploaded telemetry binary archives are encrypted at rest using AES-256. Experimental trials sealed
              in the workspace are cryptographically bound using deterministic SHA-256 checksums to ensure tamper-evident
              integrity.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Your Rights (GDPR &amp; CCPA/CPRA)</h2>
            <p className="mb-3">
              Depending on your jurisdiction, you may have rights to access, inspect, download, or request deletion of your personal
              information. Please note that certain audit log entries and cryptographically sealed research records must be retained
              pursuant to institutional compliance, NIH FAIR data directives, and FDA GLP regulatory record retention mandates.
            </p>
            <p>
              To exercise your data privacy rights, email <span className="text-foreground select-all font-mono font-medium">legal@inquestra.org</span> or visit our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link>.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Privacy Inquiries &amp; Data Protection Office</h2>
            <div className="p-4 bg-card border border-border rounded-lg space-y-1.5 text-xs font-mono text-muted-foreground">
              <p className="font-semibold text-foreground text-sm font-sans mb-1">Inquestra: Data Protection &amp; Compliance</p>
              <p>Legal &amp; Privacy: <span className="text-foreground font-semibold select-all">legal@inquestra.org</span></p>
              <p>Platform Support: <span className="text-foreground font-semibold select-all">support@inquestra.org</span></p>
              <p className="pt-1 font-sans">
                <Link href="/contact" className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  Visit Contact and Support Page
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
