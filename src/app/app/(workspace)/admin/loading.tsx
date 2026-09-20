// src/app/app/(workspace)/admin/loading.tsx
// Skeleton screen — renders instantly while page.tsx fetches data from DB.
// Uses theme-adaptive tokens (bg-muted) so it looks clean in both light and dark mode.

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background p-8 overflow-y-auto h-full w-full">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-4 h-4 rounded bg-muted/80 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-muted/80 animate-pulse" />
            <div className="h-3 w-48 rounded bg-muted/60 animate-pulse" />
          </div>
        </div>

        {/* Tab bar skeleton */}
        <div className="flex gap-6 border-b border-border mb-8 pb-0">
          {[80, 64, 96, 88, 96, 72, 80].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-t animate-pulse bg-muted/70"
              style={{ width: w }}
            />
          ))}
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="h-3 w-24 rounded bg-muted/80 animate-pulse" />
              <div className="h-8 w-10 rounded bg-muted/80 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30">
              <div className="h-4 w-28 rounded bg-muted/80 animate-pulse" />
            </div>
            <div className="divide-y divide-border/50">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex gap-4 items-center">
                  <div className="h-3 flex-1 rounded bg-muted/60 animate-pulse" />
                  <div className="h-5 w-20 rounded bg-muted/40 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted/30 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden h-fit">
            <div className="px-5 py-3 border-b border-border bg-muted/30">
              <div className="h-4 w-20 rounded bg-muted/80 animate-pulse" />
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex justify-between items-center">
                <div className="h-3 w-28 rounded bg-muted/60 animate-pulse" />
                <div className="h-3 w-12 rounded bg-muted/40 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
