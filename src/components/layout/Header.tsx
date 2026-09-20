'use client';
// src/components/layout/Header.tsx
// Top navigation bar: workspace identity, trial status badge, simulator toggle,
// Save to Cloud button, Export (.zip) button, and User Login / Profile status.

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import {
  Circle,
  Cloud,
  CloudOff,
  Loader2,
  Download,
  Printer,
  LogIn,
  LogOut,
  Shield,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useNotebookStore } from '@/store/useNotebookStore';
import { syncTrialToCloud } from '@/actions/syncActions';
import { exportTrialAsZip } from '@/lib/exportTrial';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { signOut } from '@/actions/authActions';
import { sealTrial } from '@/actions/trialActions';
import { checkLabCompliance, getCurrentUserProfile } from '@/actions/adminActions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { TrialStatus } from '@/types/inquestra';
import type { User } from '@supabase/supabase-js';
import type { Role } from '@prisma/client';

const STATUS_COLORS: Record<TrialStatus, string> = {
  DRAFT: 'bg-muted-foreground/30 text-muted-foreground border-border',
  ACTIVE: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  COMPLETED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  FAILED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
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

  const isSynced = cloudTrialId !== null;

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{
    id: string;
    email: string;
    role: Role;
    organizationId: string;
    orgName: string;
    strictMode: boolean;
    teamId: string | null;
    teamName: string | null;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.href = '/app/login';
    } catch {
      await signOut();
    }
  };

  // Monitor Supabase Auth state client-side
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      if (currentUser) {
        getCurrentUserProfile().then((p) => {
          if (p) setProfile(p);
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getCurrentUserProfile().then((p) => {
          if (p) setProfile(p);
        });
      } else {
        setProfile(null);
      }
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
        content: JSON.parse(JSON.stringify(content || {})),
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
        let targetId = cloudTrialId || activeTrial.id;
        
        // Ensure trial exists in DB by syncing first
        const syncResult = await syncTrialToCloud({
          title,
          content: JSON.parse(JSON.stringify(content || {})),
          status,
          metadata: metadata.map(({ key, value }) => ({ key, value })),
          cloudTrialId: targetId ?? undefined,
          cloudProjectId: cloudProjectId ?? undefined,
        });

        if (syncResult.success && syncResult.cloudTrialId) {
          targetId = syncResult.cloudTrialId;
          setCloudIds({
            cloudTrialId: syncResult.cloudTrialId,
            cloudProjectId: syncResult.cloudProjectId ?? '',
          });
        }

        await sealTrial(targetId);
        // Force reload to grab latest DB state
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
        <Logo className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
        <span className="text-foreground font-semibold text-sm tracking-tight">
          Inquestra
        </span>
      </Link>

      <div className="h-4 w-px bg-border shrink-0" />

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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-border bg-muted text-foreground hover:bg-accent transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          title="Export trial as ZIP (Markdown + JSON + CSV)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-border bg-muted text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" title={`Sealed with SHA-256: ${activeTrial.checksum}`}>
            <Shield className="w-3.5 h-3.5" />
            Cryptographically Sealed
          </div>
        ) : (
          <button
            onClick={handleSealTrial}
            disabled={isSealing}
            title="Seal trial (Irreversible)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSealing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Shield className="w-3.5 h-3.5" />
            )}
            {isSealing ? 'Sealing...' : 'Seal Trial'}
          </button>
        )}

        {/* Save to Cloud button */}
        <button
          onClick={handleSync}
          disabled={isPending}
          title={isSynced ? 'Push latest trial changes to cloud' : 'Save trial to cloud'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
            isSynced
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
              : 'bg-muted text-foreground border-border hover:bg-accent'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isSynced ? (
            <Cloud className="w-3.5 h-3.5" />
          ) : (
            <CloudOff className="w-3.5 h-3.5" />
          )}
          {isPending ? 'Syncing…' : isSynced ? 'Sync Changes' : 'Save to Cloud'}
        </button>

        {/* Live connection badge */}
        {hardwareStatus.isConnected && (
          <span className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded">
            <Circle className="w-2 h-2 fill-indigo-500 animate-pulse" />
            {hardwareStatus.portName || 'USB Connected'}
            &nbsp;·&nbsp;
            {hardwareStatus.packetsPerSec} Hz
          </span>
        )}

        <div className="h-5 w-px bg-border shrink-0" />

        <ThemeToggle />

        {/* Auth status: User Profile or Sign In button */}
        {user ? (
          <div className="flex items-center gap-2">
            {profile && (profile.role === 'ADMIN' || profile.role === 'PI') ? (
              <Link
                href="/app/admin"
                className="flex items-center gap-1.5 text-xs text-foreground font-mono bg-muted border border-border px-2.5 py-1 rounded max-w-[240px] truncate hover:bg-accent hover:border-indigo-500/60 transition-colors shadow-sm"
                title="Lab Operations & Settings"
              >
                <Shield className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span
                  className={`font-semibold text-[10px] uppercase ${
                    profile.role === 'PI'
                      ? 'text-violet-700 dark:text-violet-300'
                      : 'text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  {profile.role === 'PI' ? '★ LAB PI' : profile.role}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="truncate">{user.email?.split('@')[0]}</span>
              </Link>
            ) : profile === null ? (
              // Profile still loading — show skeleton to avoid role flash
              <div className="flex items-center gap-1.5 bg-muted border border-border px-2.5 py-1 rounded">
                <div className="w-14 h-2.5 rounded bg-muted-foreground/20 animate-pulse" />
                <span className="text-muted-foreground">·</span>
                <div className="w-16 h-2.5 rounded bg-muted-foreground/20 animate-pulse" />
              </div>
            ) : (
              <Link
                href="/app/admin"
                className="flex items-center gap-1.5 text-xs text-foreground font-mono bg-muted border border-border px-2.5 py-1 rounded max-w-[220px] truncate hover:bg-accent hover:border-sky-500/40 transition-colors shadow-sm"
                title="Lab Operations & Settings"
              >
                <span className="font-semibold text-sky-600 dark:text-sky-400 text-[10px] uppercase">
                  {profile.role}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="truncate">{user.email?.split('@')[0]}</span>
              </Link>
            )}

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              title="Sign out"
              className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-muted border border-transparent hover:border-border rounded transition-colors disabled:opacity-50"
            >
              {isSigningOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ) : (
          <Link
            href="/app/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
