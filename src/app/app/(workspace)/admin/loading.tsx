// src/app/app/(workspace)/admin/loading.tsx
// Instant route transition skeleton for Lab Operations & Settings.

import { ArrowLeft, Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background overflow-y-auto h-full w-full">
      {/* Top nav bar skeleton */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-8 py-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 pt-5 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Notebook</span>
            </div>
            <span className="text-border">|</span>
            <div className="space-y-1">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-2.5 w-48 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>

          {/* Tab buttons skeleton */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-0 border-t border-border/40">
            {['Overview', 'Projects', 'Protocols', 'Inventory', 'Equipment', 'Teams', 'Audit Logs', 'Settings'].map(
              (tab) => (
                <div
                  key={tab}
                  className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2 border-b-2 border-transparent"
                >
                  <div className="w-3 h-3 bg-muted rounded animate-pulse" />
                  <span className="opacity-60">{tab}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Main body skeleton */}
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-44 bg-muted rounded animate-pulse" />
            <div className="h-3 w-72 bg-muted/60 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Loading lab operations…</span>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                <div className="w-6 h-6 rounded-lg bg-muted animate-pulse" />
              </div>
              <div className="h-7 w-16 bg-muted rounded animate-pulse" />
              <div className="h-2.5 w-28 bg-muted/50 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content table/card skeleton */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="h-4 w-36 bg-muted rounded animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-12 w-full bg-muted/40 border border-border/40 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
