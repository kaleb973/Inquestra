import Link from 'next/link';
import { resolveScanCode } from '@/actions/scanActions';
import { Logo } from '@/components/ui/Logo';
import {
  MapPin,
  Box,
  FlaskConical,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Search,
  LogIn,
  BookOpen,
} from 'lucide-react';

interface ScanPageProps {
  searchParams: Promise<{ code?: string }>;
}

export const metadata = {
  title: 'Specimen and Location Resolver',
  description: 'Instant mobile barcode and QR code lookup for lab specimens, freezer storage, and instruments.',
};

export default async function ScanPage({ searchParams }: ScanPageProps) {
  const { code } = await searchParams;
  const result = code ? await resolveScanCode(code) : null;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-start p-4 sm:p-8">
      {/* Top Header */}
      <header className="w-full max-w-lg flex items-center justify-between py-4 border-b border-border/80 mb-6">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
          <span className="font-semibold text-sm tracking-tight text-foreground">Inquestra</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground uppercase">
            Resolver
          </span>
        </Link>
        <Link
          href="/app"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Notebook
        </Link>
      </header>

      <div className="w-full max-w-lg space-y-6">
        {/* Search Bar (always accessible for manual entry or USB gun) */}
        <form method="GET" action="/scan" className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            name="code"
            aria-label="Scan barcode or enter identifier"
            defaultValue={code || ''}
            placeholder="Scan barcode or enter ID (e.g. INQ-LOT-4821)..."
            autoFocus={!code}
            className="w-full pl-10 pr-24 py-2.5 bg-card border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-xs"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg hover:bg-foreground/90 transition-colors shadow-xs"
          >
            Resolve
          </button>
        </form>

        {/* State A: Result Found */}
        {result?.found && (
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Kind & Status Banner */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-muted border border-border text-foreground">
                {result.kind === 'inventory' && (
                  <>
                    <FlaskConical className="w-3.5 h-3.5 text-primary" />
                    {result.type}
                  </>
                )}
                {result.kind === 'storage' && (
                  <>
                    <Box className="w-3.5 h-3.5 text-emerald-500" />
                    {result.type}
                  </>
                )}
                {result.kind === 'equipment' && (
                  <>
                    <Wrench className="w-3.5 h-3.5 text-sky-500" />
                    Equipment · {result.status}
                  </>
                )}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                {result.organizationName}
              </span>
            </div>

            {/* Title & Identifier */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {result.name}
              </h1>
              {result.barcode && (
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  Barcode: <span className="text-foreground">{result.barcode}</span>
                </p>
              )}
            </div>

            {/* Physical Storage Breadcrumb */}
            {'locationPath' in result && result.locationPath.length > 0 && (
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  Assigned Storage Hierarchy
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-foreground font-medium">
                  {result.locationPath.map((segment: string, index: number) => (
                    <span key={index} className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-background border border-border font-mono text-[11px]">
                        {segment}
                      </span>
                      {index < result.locationPath.length - 1 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory-Specific Details */}
            {result.kind === 'inventory' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div className="p-3 rounded-lg bg-background border border-border">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Current Stock</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-bold text-foreground font-mono">
                      {result.quantity}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{result.unit}</span>
                  </div>
                  {result.isLowStock && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-1">
                      <AlertTriangle className="w-3 h-3" /> Low Stock
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-background border border-border">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Lot Number</span>
                  <p className="text-sm font-semibold text-foreground font-mono mt-0.5 truncate">
                    {result.lotNumber || 'None specified'}
                  </p>
                  {result.expirationDate && (
                    <p
                      className={`text-[10px] font-mono mt-1 flex items-center gap-1 ${
                        result.isExpired
                          ? 'text-red-500 font-semibold'
                          : result.isExpiringSoon
                          ? 'text-amber-500 font-semibold'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      Exp: {new Date(result.expirationDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Storage-Specific Details */}
            {result.kind === 'storage' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div className="p-3 rounded-lg bg-background border border-border">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Stored Items</span>
                  <p className="text-lg font-bold text-foreground font-mono mt-0.5">
                    {result.containedItemsCount}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background border border-border">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Child Sub-Racks/Boxes</span>
                  <p className="text-lg font-bold text-foreground font-mono mt-0.5">
                    {result.containedLocationsCount}
                  </p>
                </div>
              </div>
            )}

            {/* Equipment-Specific Details */}
            {result.kind === 'equipment' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div className="p-3 rounded-lg bg-background border border-border">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Operational Status</span>
                  <p className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {result.status}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background border border-border">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Next Calibration</span>
                  <p
                    className={`text-xs font-mono mt-0.5 ${
                      result.isCalibrationDue ? 'text-red-500 font-bold' : 'text-foreground'
                    }`}
                  >
                    {new Date(result.calibrationDueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Actions & Deep-Links */}
            <div className="pt-4 border-t border-border flex flex-col gap-2">
              {result.isMember ? (
                <>
                  <Link
                    href={result.adminUrl}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-xs"
                  >
                    Manage in Lab Admin
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/app"
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors"
                  >
                    Open Active Notebook
                  </Link>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    href={`/app/login?returnTo=${encodeURIComponent(result.adminUrl)}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-xs"
                  >
                    <LogIn className="w-4 h-4" />
                    Log In to Edit or Deduct Reagent
                  </Link>
                  <p className="text-[11px] text-center text-muted-foreground">
                    Public read-only view. Authorized lab members can log in to update stock.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* State B: Code Searched but Not Found */}
        {code && result && !result.found && (
          <div className="bg-card border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Identifier Not Found</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No active inventory item, freezer rack, or piece of equipment matches barcode code{' '}
                <span className="font-mono text-foreground font-semibold">&quot;{code}&quot;</span>.
              </p>
            </div>
            <Link
              href="/scan"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-muted hover:bg-accent text-foreground border border-border transition-colors"
            >
              Clear Search
            </Link>
          </div>
        )}

        {/* State C: Initial Scan Prompt */}
        {!code && (
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border text-foreground flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Scan or Enter a Barcode</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Aim your phone camera at any Inquestra QR label or pull the trigger on a USB barcode gun to view instant freezer coordinates and lot data.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
