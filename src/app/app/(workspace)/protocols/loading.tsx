// src/app/app/(workspace)/protocols/loading.tsx
// Instant route transition skeleton for Protocol & SOP Library.

import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';

export default function ProtocolsLoading() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-colors flex items-center gap-1.5 text-xs font-medium shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Notebook</span>
          </Link>

          <div className="h-4 w-px bg-border/80" />

          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              Protocol &amp; SOP Library
            </h2>
            <div className="h-5 w-20 bg-muted/80 rounded animate-pulse" />
          </div>
        </div>

        <div className="h-7 w-28 bg-muted rounded-md animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-9 w-64 bg-muted/60 rounded-lg animate-pulse" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-border bg-card/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-12 bg-muted/80 rounded-full animate-pulse" />
                </div>
                <div className="h-3 w-full bg-muted/40 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-muted/40 rounded animate-pulse" />
                <div className="pt-2 flex items-center justify-between border-t border-border/40">
                  <div className="h-3 w-16 bg-muted/50 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
