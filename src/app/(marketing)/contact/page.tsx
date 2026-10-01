'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Mail, Shield, Check, Copy, ExternalLink, ArrowLeft, Headphones } from 'lucide-react';

export default function ContactPage() {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const getGmailComposeUrl = (email: string, subject: string) => {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Logo className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
              <span className="font-semibold text-base tracking-tight text-foreground">Inquestra</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Home
              </Link>
              <Link
                href="/app"
                className="text-xs font-medium bg-foreground text-background hover:bg-foreground/90 px-3.5 py-1.5 rounded transition-colors"
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
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Institutional Communications
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-normal text-foreground tracking-tight mb-4">
            Direct communication channels
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Have inquiries regarding telemetry hardware integrations, lab clearance onboarding,
            or regulatory compliance audits? Our engineering team assists researchers directly.
          </p>
        </div>

        {/* Channels Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: Platform & Research Support */}
          <div className="bg-card border border-border rounded-lg p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center mb-5 text-foreground">
                <Headphones className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Technical &amp; Lab Support</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Assistance with Web Serial DAQ, ESP32/Arduino drivers, protocol notebook syncing, and enterprise lab deployment.
              </p>

              <div className="bg-background border border-border rounded p-3 mb-6 flex items-center justify-between">
                <span className="font-mono text-xs text-foreground font-medium select-all">
                  support@inquestra.org
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('support@inquestra.org')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-muted hover:bg-accent text-foreground transition-colors border border-border"
                  title="Copy email to clipboard"
                >
                  {copiedEmail === 'support@inquestra.org' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-phosphor" />
                      <span className="text-phosphor text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={getGmailComposeUrl('support@inquestra.org', 'Inquestra Technical Support Inquiry')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                <span>Compose in Gmail</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
              <a
                href="mailto:support@inquestra.org"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-xs font-medium bg-muted hover:bg-accent border border-border text-foreground transition-colors"
              >
                <span>Open in Default Mail Client</span>
              </a>
            </div>
          </div>

          {/* Card 2: Legal, DMCA & Compliance */}
          <div className="bg-card border border-border rounded-lg p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center mb-5 text-foreground">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Legal, Governance &amp; Compliance</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Official inquiries regarding 21 CFR Part 11 electronic records, NIH FAIR metadata retention, and GDPR/CCPA requests.
              </p>

              <div className="bg-background border border-border rounded p-3 mb-6 flex items-center justify-between">
                <span className="font-mono text-xs text-foreground font-medium select-all">
                  legal@inquestra.org
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('legal@inquestra.org')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-muted hover:bg-accent text-foreground transition-colors border border-border"
                  title="Copy email to clipboard"
                >
                  {copiedEmail === 'legal@inquestra.org' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-phosphor" />
                      <span className="text-phosphor text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={getGmailComposeUrl('legal@inquestra.org', 'Inquestra Legal & Compliance Notice')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                <span>Compose in Gmail</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
              <a
                href="mailto:legal@inquestra.org"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-xs font-medium bg-muted hover:bg-accent border border-border text-foreground transition-colors"
              >
                <span>Open in Default Mail Client</span>
              </a>
            </div>
          </div>
        </div>

        {/* SLA Card */}
        <div className="mt-10 p-6 rounded-lg bg-card border border-border text-center">
          <p className="text-xs font-medium text-foreground mb-1">
            Research &amp; Institutional Response Cadence
          </p>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
            All inquiries sent to Inquestra are routed through encrypted institutional forwarders.
            Technical and regulatory inquiries are reviewed within one business day.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/app/login" className="hover:text-foreground transition-colors">Researcher Login</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Inquestra. All rights reserved.</p>
      </footer>
    </div>
  );
}
