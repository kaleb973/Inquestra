'use client';
// src/components/layout/Header.tsx
// Top navigation bar: workspace identity, trial status badge, simulator toggle,
// Save to Cloud button, Export (.zip) button, and User Login / Profile status.

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Cpu,
  Circle,
  Square,
  Cloud,
  CloudOff,
  Loader2,
  Download,
  Printer,
  LogIn,
  LogOut,
  Shield,
} from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';
import { useTelemetrySim } from '@/hooks/useTelemetrySim';
import { syncTrialToCloud } from '@/actions/syncActions';
import { exportTrialAsZip } from '@/lib/exportTrial';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { signOut } from '@/actions/authActions';
import { sealTrial } from '@/actions/trialActions';
import { checkLabCompliance } from '@/actions/adminActions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { TrialStatus } from '@/types/inquestra';
import type { User } from '@supabase/supabase-js';

const STATUS_COLORS: Record<TrialStatus, string> = {
  DRAFT: 'text-muted-foreground border-border',
  ACTIVE: 'text-emerald-400 border-emerald-900',
  COMPLETED: 'text-blue-400 border-blue-900',
  FAILED: 'text-red-400 border-red-900',
};

export function Header() {
  const title = useNotebookStore((s) => s.activeTrial.title);
  const status = useNotebookStore((s) => s.activeTrial.status);
  const content = useNotebookStore((s) => s.activeTrial.content);
  const metadata = useNotebookStore((s) => s.activeTrial?.metadata || []);
  const activeTrial = useNotebookStore((s) => s.activeTrial);
  const cloudTrialId = useNotebookStore((s) => s.cloudTrialId);
  const cloudProjectId = useNotebookStore((s) => s.cloudProjectId);
  const setCloudIds = useNotebookStore((s) => s.setCloudIds);
  const hardwareStatus = useNotebookStore((s) => s.hardwareStatus);
  const { startSimulation, stopSimulation } = useTelemetrySim();

  const isSimRunning = hardwareStatus.isSimulated && hardwareStatus.isConnected;
  const isSynced = cloudTrialId !== null;

  const [user, setUser] = useState<User | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  // Monitor Supabase Auth state client-side
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSync = () => {
    setSyncError(null);

    // If user is not logged in, direct them to login
    if (!user) {
      window.location.href = '/app/login?redirectTo=/app';
      return;
    }

    startTransition(async () => {
      const result = await syncTrialToCloud({
        title,
        content,
        status,
        metadata: metadata.map(({ key, value }) => ({ key, value })),
        cloudTrialId: cloudTrialId ?? undefined,
        cloudProjectId: cloudProjectId ?? undefined,
      });

      if (!result.success || result.error) {
        setSyncError(result.error ?? 'Sync failed.');
      } else if (result.cloudTrialId && result.cloudProjectId) {
        setCloudIds({
          cloudTrialId: result.cloudTrialId,
          cloudProjectId: result.cloudProjectId,
        });
      }
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Request HTML from EditorCanvas via custom event
      const htmlEvent = new CustomEvent<{ resolve: (html: string) => void }>(
        'inquestra:request-html',
        { detail: { resolve: () => {} }, bubbles: true }
      );
      let resolvedHtml = '';
      const promise = new Promise<string>((res) => {
        (htmlEvent.detail as { resolve: (html: string) => void }).resolve = res;
      });
      document.dispatchEvent(htmlEvent);
      resolvedHtml = await Promise.race([
        promise,
        new Promise<string>((res) => setTimeout(() => res(''), 200)),
      ]);

      await exportTrialAsZip({
        title,
        content,
        metadata: metadata.map(({ key, value }) => ({ key, value })),
        status,
        createdAt: activeTrial.createdAt,
        updatedAt: activeTrial.updatedAt,
        html: resolvedHtml,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const [isSealing, setIsSealing] = useState(false);
  const handleSealTrial = () => {
    if (!confirm('Seal this trial? This action is irreversible. The trial will be locked from further edits and cryptographically hashed.')) return;
    setIsSealing(true);
    startTransition(async () => {
      try {
        await sealTrial(activeTrial.id);
        // Force reload to grab latest DB state since activeTrial doesn't auto-update checksum yet
        window.location.reload(); 
      } catch (err: any) {
        alert(err.message || 'Failed to seal trial');
        setIsSealing(false);
      }
    });
  };

  return (
    <header className="h-14 border-b border-border/80 bg-background/80 backdrop-blur-md flex items-center px-5 gap-4 shrink-0 z-50 sticky top-0 shadow-sm">
      {/* Brand */}
      <Link href="/app" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
        <Activity className="text-emerald-400 w-4 h-4" />
        <span className="text-white font-semibold text-sm tracking-tight">
          Inquestra
        </span>
      </Link>

      <div className="h-4 w-px bg-neutral-800 shrink-0" />

      {/* Trial identity */}
      <span className="text-foreground text-sm truncate max-w-xs font-medium tracking-tight">{title}</span>
      <span
        className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_COLORS[status]}`}
      >
        {status}
      </span>

      <div className="ml-auto flex items-center gap-3">
        {/* Sync error */}
        {syncError && (
          <span className="text-[11px] text-red-400 font-mono max-w-[200px] truncate" title={syncError}>
            {syncError}
          </span>
        )}

        {/* Cloud sync badge when synced */}
        {isSynced && !syncError && (
          <span className="flex items-center gap-1.5 text-xs text-blue-400 font-mono">
            <Cloud className="w-3.5 h-3.5" />
            Saved
          </span>
        )}

        {/* Print button */}
        <button
          onClick={() => window.print()}
          title="Print to PDF"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-border bg-neutral-800 text-foreground hover:bg-neutral-700 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          title="Export trial as ZIP (Markdown + JSON + CSV)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-border bg-neutral-800 text-foreground hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {isExporting ? 'Exporting…' : 'Export'}
        </button>

        {/* Seal Trial Button or Lock Badge */}
        {activeTrial.checksum ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-amber-900 bg-amber-950/30 text-amber-500" title={`Sealed with SHA-256: ${activeTrial.checksum}`}>
            <Shield className="w-3.5 h-3.5" />
            Sealed
          </div>
        ) : (
          <button
            onClick={handleSealTrial}
            disabled={isSealing}
            title="Seal trial (Irreversible)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-amber-900 bg-amber-950/40 text-amber-500 hover:bg-amber-950/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSealing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Shield className="w-3.5 h-3.5" />
            )}
            {isSealing ? 'Sealing...' : 'Seal'}
          </button>
        )}

        {/* Save to Cloud button */}
        <button
          onClick={handleSync}
          disabled={isPending}
          title={isSynced ? 'Re-sync to cloud' : 'Save to cloud'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
            isSynced
              ? 'bg-blue-950/30 text-blue-400 border-blue-900 hover:bg-blue-950/60'
              : 'bg-neutral-800 text-foreground border-border hover:bg-neutral-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isSynced ? (
            <Cloud className="w-3.5 h-3.5" />
          ) : (
            <CloudOff className="w-3.5 h-3.5" />
          )}
          {isPending ? 'Syncing…' : isSynced ? 'Re-sync' : 'Save to Cloud'}
        </button>

        {/* Live connection badge */}
        {hardwareStatus.isConnected && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/50 border border-emerald-900/60 px-2.5 py-1 rounded">
            <Circle className="w-2 h-2 fill-emerald-400 animate-pulse" />
            {hardwareStatus.isSimulated ? 'SIMULATOR' : hardwareStatus.portName}
            &nbsp;·&nbsp;
            {hardwareStatus.packetsPerSec} Hz
          </span>
        )}

        {/* Simulator mode toggle */}
        <button
          onClick={async () => {
            if (isSimRunning) {
              stopSimulation();
            } else {
              const res = await checkLabCompliance();
              if (!res.compliant) {
                alert(res.reason);
                return;
              }
              startSimulation();
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
            isSimRunning
              ? 'bg-red-950/40 text-red-400 border-red-900 hover:bg-red-950/70'
              : 'bg-emerald-950/40 text-emerald-400 border-emerald-900 hover:bg-emerald-950/70'
          }`}
        >
          {isSimRunning ? (
            <>
              <Square className="w-3.5 h-3.5" />
              Stop Simulator
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5" />
              Sim Mode
            </>
          )}
        </button>

        <div className="h-5 w-px bg-neutral-800 shrink-0" />

        <ThemeToggle />

        {/* Auth status: User Profile or Sign In button */}
        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/app/admin"
              className="flex items-center gap-1.5 text-xs text-foreground font-mono bg-muted border border-border px-2.5 py-1 rounded max-w-[160px] truncate hover:bg-neutral-800 transition-colors"
              title="Admin Dashboard"
            >
              <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{user.email?.split('@')[0]}</span>
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                title="Sign out"
                className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-muted border border-transparent hover:border-border rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/app/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
