// src/app/app/(workspace)/literature/loading.tsx
// High-fidelity streaming loading skeleton for Literature & Citations.
// Instantly renders on route navigation to eliminate perceived loading waterfalls.

export default function LiteratureLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col animate-pulse select-none">
      {/* Top Header Skeleton */}
      <header className="border-b border-border/80 bg-card/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-36 rounded-lg bg-muted/60" />
            <div className="h-4 w-px bg-border/60" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-5 w-44 rounded bg-muted/80" />
                <div className="h-4 w-20 rounded-full bg-muted/50" />
              </div>
              <div className="h-3 w-72 rounded bg-muted/40" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-9 w-40 rounded-xl bg-primary/20" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto px-6 py-6 w-full space-y-6 flex-1">
        {/* KPI Stats Counter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border/60 bg-card/50 flex items-center justify-between"
            >
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-muted/50" />
                <div className="h-7 w-16 rounded bg-muted/80" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted/30" />
            </div>
          ))}
        </div>

        {/* Search & Filter Toolbar Skeleton */}
        <div className="p-4 rounded-xl border border-border/60 bg-card/40 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="h-10 rounded-lg bg-muted/50 flex-1 w-full" />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="h-9 w-28 rounded-lg bg-muted/60" />
              <div className="h-9 w-28 rounded-lg bg-muted/60" />
              <div className="h-9 w-28 rounded-lg bg-muted/60" />
            </div>
          </div>

          {/* Preset topic pills skeleton */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-6 w-20 rounded-full bg-muted/40" />
            ))}
          </div>
        </div>

        {/* Paper Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border/60 bg-card/40 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 w-28 rounded bg-muted/60" />
                  <div className="h-4 w-12 rounded bg-muted/40 font-mono" />
                </div>
                <div className="h-4 w-full rounded bg-muted/80" />
                <div className="h-4 w-4/5 rounded bg-muted/70" />
                <div className="h-3 w-2/3 rounded bg-muted/40" />
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                <div className="h-5 w-20 rounded bg-muted/30" />
                <div className="h-7 w-24 rounded-lg bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
