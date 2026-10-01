import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Lock, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Inquestra',
  description: 'Enterprise data privacy, security, and telemetry confidentiality policy for Inquestra platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-50 selection:bg-indigo-500/30 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo className="w-6 h-6 text-indigo-500 group-hover:text-indigo-400 transition-colors" />
              <span className="font-bold text-lg tracking-tight text-white">Inquestra</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Home
              </Link>
              <Link
                href="/app/signup"
                className="text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg transition-colors"
              >
                Open Workspace
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="mb-12 border-b border-gray-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            <Lock className="w-3.5 h-3.5" />
            Data Protection &amp; Confidentiality
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-sm">
            Last Updated: September 30, 2026 · Effective Date: October 1, 2026
          </p>
        </div>

        {/* Clauses */}
        <div className="space-y-10 text-gray-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Executive Overview &amp; Research Confidentiality</h2>
            <p className="mb-3">
              Inquestra (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
              respects the confidentiality of your scientific research, intellectual property, and personal information.
              This Privacy Policy describes our practices regarding the collection, handling, and safeguarding of data
              when you use our Electronic Research Notebook (ERN) and Data Acquisition (DAQ) systems.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Zero Third-Party Session Replay or Surveillance</h2>
            <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-2 text-gray-300">
              <p>
                <strong className="text-white">Wiretapping &amp; CIPA Protection:</strong> Inquestra strictly adheres to a
                zero-surveillance philosophy. We <strong>do not employ session replay, screen recording, or keystroke tracking
                software</strong> (such as Hotjar, FullStory, LogRocket, or mouse-tracking heatmaps).
              </p>
              <p className="text-xs text-gray-400">
                Your research notes, experimental formulas, reagent ratios, and raw serial hardware packet telemetry are never
                streamed to consumer analytics services or unvetted advertising brokers.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Self-Hosted Infrastructure &amp; Font Privacy</h2>
            <p>
              To protect visitor privacy and satisfy stringent European and German data privacy standards (including the 2022 Munich
              Regional Court ruling on dynamic IP transmission), Inquestra self-hosts its typography and application fonts directly
              from our static application delivery infrastructure. When you browse Inquestra, your IP address is not transmitted
              to third-party CDN font endpoints (such as Google Fonts CDN) at runtime.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>
                <strong className="text-gray-200">Account Credentials &amp; Profiles:</strong> When you register, we collect your name,
                institutional work email address, lab type, hashed passwords, and WebAuthn/FIDO2 passkey credentials.
              </li>
              <li>
                <strong className="text-gray-200">Laboratory Data &amp; Telemetry:</strong> Experimental notebooks, TipTap documents,
                FAIR metadata tags, sensor sample streams (e.g., ESP32/Arduino data via Web Serial), inventory lots, and equipment calibration dates.
              </li>
              <li>
                <strong className="text-gray-200">Audit Trail &amp; Signature Logs:</strong> Under FDA 21 CFR Part 11 requirements, we record
                timestamped events (user ID, action type, IP address, and cryptographic signatures) to maintain immutable data provenance.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Children&apos;s Online Privacy Protection Act (COPPA)</h2>
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
            <h2 className="text-lg font-semibold text-white mb-3">6. CAN-SPAM &amp; Email Communications</h2>
            <p className="mb-3">
              In accordance with the CAN-SPAM Act:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>We only send transactional emails necessary for platform operation (email confirmation, password resets, lab clearance invitations, and critical security notices).</li>
              <li>Any optional product announcements or research digests include an unambiguous, functioning unsubscribe link.</li>
              <li>Every outbound communication clearly identifies Inquestra Technologies Inc. and provides our valid physical postal address.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Data Security &amp; Encryption Standards</h2>
            <p>
              All communication between your browser and our servers is secured using modern Transport Layer Security (TLS 1.3).
              Stored databases and uploaded telemetry binary archives are encrypted at rest using AES-256. Experimental trials sealed
              under our Part 11 module are cryptographically bound using deterministic SHA-256 checksums to ensure tamper-evident
              integrity.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Your Rights (GDPR &amp; CCPA/CPRA)</h2>
            <p className="mb-3">
              Depending on your jurisdiction, you may have rights to access, inspect, download, or request deletion of your personal
              information. Please note that certain audit log entries and cryptographically sealed research records must be retained
              pursuant to institutional compliance, NIH FAIR data directives, and FDA GLP regulatory record retention mandates.
            </p>
            <p>
              To exercise your data privacy rights, email <span className="text-indigo-400 select-all font-mono">legal@inquestra.org</span> or visit our <Link href="/contact" className="text-indigo-400 underline">Contact Page</Link>.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Privacy Inquiries &amp; Data Protection Office</h2>
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-1.5 text-xs font-mono text-gray-300">
              <p className="font-semibold text-white text-sm font-sans mb-1">Inquestra — Data Protection &amp; Compliance</p>
              <p>Legal &amp; Privacy: <span className="text-indigo-400 font-semibold select-all">legal@inquestra.org</span></p>
              <p>Platform Support: <span className="text-indigo-400 font-semibold select-all">support@inquestra.org</span></p>
              <p className="pt-1 font-sans">
                <Link href="/contact" className="text-indigo-400 hover:text-indigo-300 underline">
                  Visit Contact &amp; Support Page →
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 py-8 border-t border-gray-900 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Inquestra. All rights reserved.</p>
      </footer>
    </div>
  );
}
