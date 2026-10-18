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
  AlertCircle,
  Check,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useNotebookStore } from '@/store/useNotebookStore';
import { syncTrialToCloud } from '@/actions/syncActions';
import { exportTrialAsZip, type SignatureExport } from '@/lib/exportTrial';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { signOut } from '@/actions/authActions';
import { sealTrial, updateTrialStatus, fetchTrialSignatures } from '@/actions/trialActions';
import { checkLabCompliance, getCurrentUserProfile } from '@/actions/adminActions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { TrialStatus } from '@/types/inquestra';
import type { User } from '@supabase/supabase-js';
import type { Role } from '@prisma/client';

const STATUS_COLORS: Record<TrialStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-border',
  ACTIVE: 'bg-primary/10 text-primary border-primary/30',
  IN_REVIEW: 'bg-caution/10 text-caution border-caution/30',
  COMPLETED: 'bg-phosphor/10 text-phosphor border-phosphor/30',
  FAILED: 'bg-critical/10 text-critical border-critical/30',
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
  const saveStatus = useNotebookStore((s) => s.saveStatus);
  const saveError = useNotebookStore((s) => s.saveError);
  const setSaveStatus = useNotebookStore((s) => s.setSaveStatus);
  const setSaveError = useNotebookStore((s) => s.setSaveError);
  const setLastSavedAt = useNotebookStore((s) => s.setLastSavedAt);

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
    setSaveError(null);

    // If user is not logged in, direct them to login
    if (!user) {
      window.location.href = '/app/login?redirectTo=/app';
      return;
    }

    setSaveStatus('SAVING');
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
        const err = result.error ?? 'Sync failed.';
        setSyncError(err);
        setSaveError(err);
        setSaveStatus('ERROR');
      } else if (result.cloudTrialId && result.cloudProjectId) {
        setCloudIds({
          cloudTrialId: result.cloudTrialId,
          cloudProjectId: result.cloudProjectId,
        });
        setSaveStatus('SAVED');
        setLastSavedAt(new Date().toISOString());
        setSaveError(null);
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

      let signatures: SignatureExport[] = [];
      if (cloudTrialId) {
        try {
          const sigs = await fetchTrialSignatures(cloudTrialId);
          signatures = sigs.map((s) => ({
            role: s.role as 'AUTHOR' | 'WITNESS' | 'PI_APPROVAL',
            meaning: s.meaning,
            signedAt: s.signedAt,
            user: { email: s.user.email, role: s.user.role },
          }));
        } catch (e) {
          console.error('Failed to fetch signatures for export:', e);
        }
      }

      await exportTrialAsZip({
        title,
        content,
        metadata: metadata.map(({ key, value }) => ({ key, value })),
        status,
        createdAt: activeTrial.createdAt,
        updatedAt: activeTrial.updatedAt,
        html: resolvedHtml,
        checksum: activeTrial.checksum,
        signatures,
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
    <header className="h-14 border-b border-border bg-background/90 backdrop-blur-md flex items-center px-5 gap-4 shrink-0 z-50 sticky top-0 shadow-sm font-sans">
      {/* Brand */}
      <Link href="/app" className="flex items-center gap-2.5 shrink-0 group">
        <Logo className="text-foreground group-hover:text-primary transition-colors w-5 h-5" />
        <span className="text-foreground font-semibold text-sm tracking-tight">
          Inquestra
        </span>
      </Link>

      <div className="h-4 w-px bg-border shrink-0" />

      {/* Trial identity */}
      <span className="text-foreground text-sm truncate max-w-xs font-medium tracking-tight">{title}</span>

      {/* Status badge — interactive dropdown when trial is not sealed */}
      {activeTrial.checksum ? (
        <span
          className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_COLORS[status]}`}
        >
          {status.replace('_', ' ')}
        </span>
      ) : (
        <select
          value={status}
          disabled={!cloudTrialId || isPending}
          onChange={(e) => {
            const newStatus = e.target.value as TrialStatus;
            if (!cloudTrialId) return;
            startTransition(async () => {
              try {
                await updateTrialStatus(cloudTrialId, newStatus);
                // Optimistically update local store
                useNotebookStore.setState((s) => ({
                  activeTrial: { ...s.activeTrial, status: newStatus },
                }));
              } catch (err) {
                alert(err instanceof Error ? err.message : 'Status update failed');
              }
            });
          }}
          title={cloudTrialId ? 'Change trial status' : 'Sync trial to cloud to change status'}
          className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border cursor-pointer appearance-none bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors disabled:cursor-not-allowed ${STATUS_COLORS[status]}`}
        >
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="IN_REVIEW">IN REVIEW</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="FAILED">FAILED</option>
        </select>
      )}

      <div className="ml-auto flex items-center gap-3">
        {/* Sync error */}
        {syncError && (
          <span className="text-[11px] text-critical font-mono max-w-[200px] truncate" title={syncError}>
            {syncError}
          </span>
        )}

        {/* Real-time Save/Sync status badge */}
        {(saveStatus === 'SAVING' || isPending) && (
          <span className="flex items-center gap-1.5 text-xs text-primary font-mono animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Saving…
          </span>
        )}
        {saveStatus === 'SAVED' && !syncError && isSynced && !isPending && (
          <span className="flex items-center gap-1.5 text-xs text-primary font-mono">
            <Cloud className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
        {saveStatus === 'UNSAVED' && isSynced && !isPending && (
          <span className="flex items-center gap-1.5 text-xs text-amber-500 font-mono">
            <Circle className="w-2 h-2 fill-amber-500" />
            Unsaved
          </span>
        )}
        {(saveStatus === 'ERROR' || syncError) && (
          <span className="flex items-center gap-1.5 text-xs text-critical font-mono" title={saveError || syncError || 'Sync failed'}>
            <AlertCircle className="w-3.5 h-3.5 text-critical" />
            Save Error
          </span>
        )}

        {/* Print button */}
        <button
          onClick={() => window.print()}
          title="Print to PDF"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-border bg-muted/60 text-foreground hover:bg-accent transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          title="Export trial as ZIP (Markdown + JSON + CSV)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-border bg-muted/60 text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-caution/30 bg-caution/10 text-caution font-mono" title={`Sealed with SHA-256: ${activeTrial.checksum}`}>
            <Shield className="w-3.5 h-3.5" />
            Sealed SHA-256
          </div>
        ) : (
          <button
            onClick={handleSealTrial}
            disabled={isSealing}
            title="Seal trial (Irreversible)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-caution/30 bg-caution/10 text-caution hover:bg-caution/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={isPending || saveStatus === 'SAVING'}
          title={isSynced ? 'Push latest trial changes to cloud' : 'Save trial to cloud'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
            isSynced
              ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
              : 'bg-muted/60 text-foreground border-border hover:bg-accent'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isPending || saveStatus === 'SAVING' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isSynced ? (
            <Cloud className="w-3.5 h-3.5" />
          ) : (
            <CloudOff className="w-3.5 h-3.5" />
          )}
          {isPending || saveStatus === 'SAVING' ? 'Syncing…' : isSynced ? 'Sync Changes' : 'Save to Cloud'}
        </button>

        {/* Live connection badge */}
        {hardwareStatus.isConnected && (
          <span className="flex items-center gap-1.5 text-xs text-phosphor font-mono bg-phosphor/10 border border-phosphor/30 px-2.5 py-1 rounded">
            <Circle className="w-2 h-2 fill-phosphor animate-pulse" />
            {hardwareStatus.portName || 'USB Serial'}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
