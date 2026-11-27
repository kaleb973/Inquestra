import Link from 'next/link';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description: 'Data privacy, security, and research data confidentiality policies for the Inquestra platform.',
  path: '/privacy',
});

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
            Last Updated: November 26, 2026 · Effective Date: November 26, 2026
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
                Your research notes, experimental formulas, reagent ratios, and raw serial hardware packet telemetry remain local
                in Local Notebook mode and are never streamed to advertising brokers. Optional usage analytics load only when you
                explicitly opt in, alongside cookie-less, zero-PII aggregate workspace/export event counts.
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
            <h2 className="text-base font-semibold text-foreground mb-3">4. Local Notebook Storage vs. Optional Self-Hosted Deployments</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Local Notebook Mode (Default):</strong> When you use the browser workspace at{' '}
                <code className="text-foreground">/app</code> without signing into a self-hosted instance, your experimental notes,
                protocol edits, and Web Serial telemetry stay on your device inside browser{' '}
                <code className="text-foreground">localStorage</code> and in-memory export buffers. Nothing is uploaded to an
                Inquestra server.
              </li>
              <li>
                <strong className="text-foreground">Optional Analytics (Strict Opt-In) &amp; Aggregate Counters:</strong> Third-party
                page diagnostics via PostHog and Google Analytics 4 are disabled by default and load only if you explicitly accept
                optional analytics in Cookie Preferences. Separate cookie-less, zero-PII aggregate event counters (<code className="text-foreground">/api/metrics</code>)
                count core workspace and export actions without storing IP addresses, cookies, or personal identifiers.
              </li>
              <li>
                <strong className="text-foreground">External Scientific APIs &amp; Inquiry Forwarding:</strong> If you run chemical structure or
                citation lookups inside the editor, your browser queries public scientific endpoints (PubChem and Europe PMC). If you
                submit the inquiry form, your submitted details are forwarded via Resend solely so the maintainer can respond.
              </li>
              <li>
                <strong className="text-foreground">Self-Hosted PostgreSQL Deployments:</strong> When an institution or lab self-hosts
                the MIT codebase with PostgreSQL and authentication enabled, account records, synced trials, and audit trail timestamps
                are stored and governed solely by that deployment&apos;s operator.
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
              Traffic between your browser and <code className="text-foreground">inquestra.org</code> is protected in transit over HTTPS/TLS.
              In default Local Notebook mode, notebook state remains inside your local browser storage and RAM export buffers. Where an
              institution deploys the optional self-hosted PostgreSQL and object-storage stack, database-level encryption at rest, access
              controls, and SHA-256 record sealing depend on that operator&apos;s deployment configuration.
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
            <h2 className="text-base font-semibold text-foreground mb-3">9. Privacy &amp; Maintainer Contact</h2>
            <div className="p-4 bg-card border border-border rounded-lg space-y-1.5 text-xs font-mono text-muted-foreground">
              <p className="font-semibold text-foreground text-sm font-sans mb-1">Inquestra Open-Source Project Maintainer</p>
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
