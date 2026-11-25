'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Logo } from '@/components/ui/Logo';
import { Menu, X, Cpu, ShieldCheck, Database, PlayCircle, Mail, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Features', href: '/#features', icon: Database },
  { label: 'Compare ELNs', href: '/compare', icon: Database },
  { label: 'FAQ', href: '/faq', icon: Database },
  { label: 'About', href: '/about', icon: Database },
  { label: 'Provenance', href: '/provenance', icon: ShieldCheck },
  { label: 'Hardware DAQ', href: '/hardware', icon: Cpu },
  { label: 'Live Demo', href: '/demo', icon: PlayCircle },
  { label: 'Contact', href: '/contact', icon: Mail },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <header className="sticky top-0 w-full z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <nav aria-label="Primary" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <Link
            href="/"
            aria-label="Inquestra home"
            className="flex items-center gap-2.5 group shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo className="w-5 h-5 text-primary transition-colors" />
            <span className="font-semibold text-base tracking-tight text-foreground">Inquestra</span>
          </Link>

          <div className="hidden lg:flex items-center gap-5 text-sm font-medium">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'transition-colors py-1.5 relative whitespace-nowrap rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              title={isDark ? 'Light paper theme' : 'Graphite dark theme'}
              className="p-2 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px"
            >
              {mounted && isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/app/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Sign in
            </Link>
            <Link
              href="/app"
              className="text-sm font-semibold bg-primary text-primary-foreground hover:opacity-95 px-4 py-2 rounded-md transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px"
            >
              Open Workspace
            </Link>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="sm:hidden p-2 rounded-md border border-border text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {mounted && isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/app"
              className="sm:hidden text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md whitespace-nowrap"
            >
              Workspace
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div id="mobile-nav" className="lg:hidden border-b border-border bg-background/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <Link
              href="/app/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center text-sm font-medium py-2.5 rounded-md border border-border text-foreground hover:bg-muted/40 transition-colors whitespace-nowrap"
            >
              Sign in to lab account
            </Link>
            <Link
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center text-sm font-semibold py-2.5 rounded-md bg-primary text-primary-foreground hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              Open Research Workspace
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
