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
              A browser-based notebook for experimental bench work and live instrument recording.
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
              <span>Local-first electronic lab notebook</span>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">
              Platform
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/hardware" className="hover:text-foreground transition-colors">
                  Hardware DAQ
                </Link>
              </li>
              <li>
                <Link href="/provenance" className="hover:text-foreground transition-colors">
                  Data Verification
                </Link>
              </li>
              <li>
                <Link href="/architecture" className="hover:text-foreground transition-colors">
                  Architecture
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-foreground transition-colors">
                  Interactive Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Project & Legal */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">
              Project &amp; Legal
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookieSettings}
                  className="hover:text-foreground transition-colors text-left"
                >
                  Cookie Settings
                </button>
              </li>
              <li>
                <Link href="/app/login" className="hover:text-foreground transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-muted-foreground/80">
          <p>&copy; {new Date().getFullYear()} Inquestra. All rights reserved.</p>
          <div className="flex items-center gap-4 font-mono">
            <span>Free and open source for academic and independent research.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
