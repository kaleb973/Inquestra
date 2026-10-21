'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { ArrowRight, Menu, X, Cpu, ShieldCheck, Database, PlayCircle, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Features', href: '/#features', icon: Database },
  { label: 'Provenance', href: '/provenance', icon: ShieldCheck },
  { label: 'Hardware DAQ', href: '/hardware', icon: Cpu },
  { label: 'Architecture', href: '/architecture', icon: Database },
  { label: 'Live Demo', href: '/demo', icon: PlayCircle },
  { label: 'Contact', href: '/contact', icon: Mail },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
            <span className="font-semibold text-base tracking-tight text-foreground">Inquestra</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-medium">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'transition-colors py-1 relative',
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

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/app/login"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Sign In
            </Link>
            <Link
              href="/app"
              className="text-xs font-medium bg-foreground text-background hover:bg-foreground/90 px-3.5 py-2 rounded transition-colors inline-flex items-center gap-1.5"
            >
              Open Workspace
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/app"
              className="text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded"
            >
              Workspace
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
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
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
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
              className="text-center text-xs font-medium py-2 rounded border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              Sign In to Lab Account
            </Link>
            <Link
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center text-xs font-medium py-2 rounded bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Open Research Workspace
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
