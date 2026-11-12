'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export function MarketingFooter() {
  const handleOpenCookieSettings = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inquestra:open-cookie-settings'));
    }
  };

  return (
    <footer className="py-14 bg-background text-xs text-muted-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-border">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <Logo className="w-5 h-5 text-foreground" />
              <span className="font-semibold text-base text-foreground tracking-tight">Inquestra</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">
              Free electronic lab notebook (ELN) for life sciences, chemistry, biotech, materials science, and engineering.
              Protocols, chemical inventory LIMS, molecular structures, literature citations, hardware DAQ, and 21 CFR Part 11 provenance — free for every researcher.
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <span>·</span>
              <Link href="/compare" className="hover:text-foreground transition-colors">Compare ELNs</Link>
              <span>·</span>
              <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <span>·</span>
              <a href="https://github.com/kaleb973/Inquestra" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
              <span>Chromium Web Serial Engine · Audit-Logged Research OS</span>
            </div>
          </div>

          {/* Col 2: Platform Architecture */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">
              Platform &amp; Tech
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/hardware" className="hover:text-foreground transition-colors">
                  Hardware DAQ &amp; Microcontrollers
                </Link>
              </li>
              <li>
                <Link href="/provenance" className="hover:text-foreground transition-colors">
                  Cryptographic Provenance
                </Link>
              </li>
              <li>
                <Link href="/architecture" className="hover:text-foreground transition-colors">
                  System Architecture Pipeline
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-foreground transition-colors">
                  In-Browser DAQ Simulator
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Regulatory & Institutional */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">
              Governance &amp; Support
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Institutional Support &amp; Clearances
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service &amp; SLA
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Data Privacy &amp; Confidentiality
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookieSettings}
                  className="hover:text-foreground transition-colors text-left"
                >
                  Cookie Preferences &amp; Notice
                </button>
              </li>
              <li>
                <Link href="/.well-known/security.txt" className="hover:text-foreground transition-colors">
                  Security Disclosure (security.txt)
                </Link>
              </li>
              <li>
                <Link href="/app/login" className="hover:text-foreground transition-colors">
                  Lab Account Access
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-muted-foreground/80">
          <p>&copy; {new Date().getFullYear()} Inquestra. All rights reserved.</p>
          <div className="flex items-center gap-4 font-mono">
            <span>21 CFR § 11 Technical Controls</span>
            <span>·</span>
            <span>NIH FAIR Directives</span>
            <span>·</span>
            <span>RFC 3161 Timestamps</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
