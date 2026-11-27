'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Logo } from '@/components/ui/Logo';
import {
  Menu,
  X,
  Cpu,
  ShieldCheck,
  Database,
  Layers,
  Info,
  ChevronDown,
  Sun,
  Moon,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GITHUB_REPO_URL } from '@/lib/seo';
import { IS_CLOUD_WORKSPACE_ENABLED } from '@/lib/features';

const PLATFORM_ITEMS = [
  {
    label: 'Notebook Canvas',
    description: 'Block editor, step timers, KaTeX math, and reagent tracking',
    href: '/#features',
    icon: Database,
  },
  {
    label: 'Hardware DAQ',
    description: 'Driverless W3C Web Serial capture for bench instruments',
    href: '/hardware',
    icon: Cpu,
  },
  {
    label: 'Cryptographic Provenance',
    description: 'SHA-256 record sealing and append-only revision history',
    href: '/provenance',
    icon: ShieldCheck,
  },
  {
    label: 'System Architecture',
    description: 'Local browser persistence, Web Serial DAQ, and optional PostgreSQL',
    href: '/architecture',
    icon: Layers,
  },
  {
    label: 'About Inquestra',
    description: 'Project principles, open codebase, and maintainer notes',
    href: '/about',
    icon: Info,
  },
];

const TOP_LINKS = [
  { label: 'Live Demo', href: '/demo' },
  { label: 'Compare', href: '/compare' },
  { label: 'FAQ', href: '/faq' },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPlatformOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!platformOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPlatformOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPlatformOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [platformOpen]);

  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const isPlatformActive = PLATFORM_ITEMS.some(
    (item) => item.href !== '/#features' && pathname.startsWith(item.href)
  );

  return (
    <header className="sticky top-0 w-full z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <nav aria-label="Primary" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-6">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              aria-label="Inquestra home"
              className="flex items-center gap-2.5 group shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Logo className="w-5 h-5 text-primary transition-colors" />
              <span className="font-semibold text-base tracking-tight text-foreground">Inquestra</span>
            </Link>

            <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setPlatformOpen((prev) => !prev)}
                  aria-expanded={platformOpen}
                  aria-haspopup="menu"
                  aria-controls="platform-nav-menu"
                  className={cn(
                    'inline-flex items-center gap-1 py-1.5 whitespace-nowrap rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isPlatformActive || platformOpen
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>Platform</span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-150',
                      platformOpen && 'rotate-180'
                    )}
                  />
                </button>

                {platformOpen && (
                  <div
                    id="platform-nav-menu"
                    role="menu"
                    className="absolute left-0 top-full mt-2 w-80 rounded-lg border border-border bg-card p-1.5 divide-y divide-border"
                  >
                    {PLATFORM_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isCurrent = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setPlatformOpen(false)}
                          className={cn(
                            'flex items-start gap-3 px-3 py-2.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isCurrent ? 'bg-muted/70 text-foreground' : 'hover:bg-muted/50 text-foreground'
                          )}
                        >
                          <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-foreground">
                              {item.label}
                            </span>
                            <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">
                              {item.description}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {TOP_LINKS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 py-1.5 text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>GitHub</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
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
            {IS_CLOUD_WORKSPACE_ENABLED && (
              <Link
                href="/app/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Sign in
              </Link>
            )}
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
        <div id="mobile-nav" className="lg:hidden border-b border-border bg-background/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4">
          <div className="space-y-1">
            {PLATFORM_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-border space-y-1">
            {TOP_LINKS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'block px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                pathname === '/contact'
                  ? 'bg-muted text-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              Contact
            </Link>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>GitHub</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {IS_CLOUD_WORKSPACE_ENABLED && (
              <Link
                href="/app/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-sm font-medium py-2.5 rounded-md border border-border text-foreground hover:bg-muted/40 transition-colors whitespace-nowrap"
              >
                Sign in to lab account
              </Link>
            )}
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
