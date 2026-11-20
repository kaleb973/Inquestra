'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Shield, Check, Copy, ExternalLink, Headphones } from 'lucide-react';

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
    <div className="pt-16 sm:pt-20 pb-20">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
            Get in touch
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Questions about hardware integrations, importing existing protocols, or setting up Inquestra for your lab?
            You can reach out directly.
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
              <h2 className="text-lg font-semibold text-foreground mb-2">General &amp; Privacy Inquiries</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Questions about data privacy, open source development, security disclosures, or collaboration.
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

        {/* Response Note */}
        <div className="mt-10 p-6 rounded-lg bg-card border border-border text-center">
          <p className="text-xs font-medium text-foreground mb-1">
            Response time
          </p>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Messages go directly to the builder. You can expect a response within one business day.
          </p>
        </div>
      </main>
    </div>
  );
}
