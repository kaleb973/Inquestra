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
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            <Mail className="w-3.5 h-3.5" />
            Direct Communication Channels
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Get in touch with Inquestra
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Have questions about telemetry hardware integrations, lab onboarding, or compliance audits?
            Our engineering and research support team is here to assist.
          </p>
        </div>

        {/* Channels Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: Platform & Research Support */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-indigo-500/30 transition-colors shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400">
                <Headphones className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Technical &amp; Lab Support</h2>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Assistance with Web Serial DAQ, ESP32/Arduino drivers, protocol notebook syncing, and enterprise lab deployment.
              </p>

              <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-3.5 mb-6 flex items-center justify-between">
                <span className="font-mono text-sm text-indigo-300 font-semibold select-all">
                  support@inquestra.org
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('support@inquestra.org')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
                  title="Copy email to clipboard"
                >
                  {copiedEmail === 'support@inquestra.org' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <a
                href={getGmailComposeUrl('support@inquestra.org', 'Inquestra Technical Support Inquiry')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <span>Compose in Gmail</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
              <a
                href="mailto:support@inquestra.org"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 text-gray-300 hover:text-white transition-colors"
              >
                <span>Open in Default Mail Client</span>
              </a>
            </div>
          </div>

          {/* Card 2: Legal, DMCA & Compliance */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-indigo-500/30 transition-colors shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5 text-purple-400">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Legal, DMCA &amp; Compliance</h2>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Official inquiries regarding 21 CFR Part 11 audit trails, GDPR/CCPA privacy rights, and DMCA copyright notices.
              </p>

              <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-3.5 mb-6 flex items-center justify-between">
                <span className="font-mono text-sm text-purple-300 font-semibold select-all">
                  legal@inquestra.org
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('legal@inquestra.org')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
                  title="Copy email to clipboard"
                >
                  {copiedEmail === 'legal@inquestra.org' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <a
                href={getGmailComposeUrl('legal@inquestra.org', 'Inquestra Legal & Compliance Notice')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                <span>Compose in Gmail</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
              <a
                href="mailto:legal@inquestra.org"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 text-gray-300 hover:text-white transition-colors"
              >
                <span>Open in Default Mail Client</span>
              </a>
            </div>
          </div>
        </div>

        {/* SLA / Expectations Card */}
        <div className="mt-10 p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 text-center">
          <p className="text-xs font-medium text-gray-300 mb-1">
            Research &amp; Institutional Response Windows
          </p>
          <p className="text-xs text-gray-500 max-w-xl mx-auto leading-relaxed">
            All inquiries sent to Inquestra are routed through our secure forwarding infrastructure.
            Standard inquiries are typically reviewed within 1 business day.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 py-8 border-t border-gray-900 text-center text-xs text-gray-500">
        <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
          <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/app/login" className="hover:text-gray-300 transition-colors">Researcher Login</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Inquestra. All rights reserved.</p>
      </footer>
    </div>
  );
}
