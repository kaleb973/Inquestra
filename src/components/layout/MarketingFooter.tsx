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
    <footer className="py-16 bg-muted/25 text-sm text-muted-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-border">
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <Logo className="w-5 h-5 text-primary" />
              <span className="font-semibold text-base text-foreground tracking-tight">Inquestra</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              A local-first electronic lab notebook unifying protocol execution, reagent inventory, molecular primitives, and bench hardware telemetry.
            </p>
            <div className="flex flex-wrap gap-5 text-sm">
              <Link href="/about" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">About</Link>
              <Link href="/compare" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">Compare ELNs</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">FAQ</Link>
              <a
                href="https://github.com/kaleb973/Inquestra"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                GitHub
              </a>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="text-sm text-foreground font-semibold">Platform</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/hardware" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  Hardware DAQ
                </Link>
              </li>
              <li>
                <Link href="/provenance" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  Data Verification
                </Link>
              </li>
              <li>
                <Link href="/architecture" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  Architecture
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  Interactive Demo
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="text-sm text-foreground font-semibold">Project and legal</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookieSettings}
                  className="hover:text-foreground transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Cookie Settings
                </button>
              </li>
              <li>
                <Link href="/app/login" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Inquestra. Open research infrastructure.</p>
          <span>Free for academic and independent laboratories.</span>
        </div>
      </div>
    </footer>
  );
}
