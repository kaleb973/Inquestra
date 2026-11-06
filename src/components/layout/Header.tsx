'use client';
// src/components/layout/Header.tsx
// Top navigation bar: workspace identity, trial status badge, simulator toggle,
// Save to Cloud button, Export (.zip) button, and User Login / Profile status.

import { useState, useTransition, useEffect, useCallback, useRef } from 'react';
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
  ShieldCheck,
  AlertCircle,
  Check,
  Bookmark,
  PanelLeft,
  PanelRight,
  MoreVertical,
} from 'lucide-react';
import { SealConfirmationModal } from '@/components/trials/SealConfirmationModal';
import { Logo } from '@/components/ui/Logo';
import { useNotebookStore } from '@/store/useNotebookStore';
import { syncTrialToCloud } from '@/actions/syncActions';
import { exportTrialAsZip, type SignatureExport } from '@/lib/exportTrial';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { signOut } from '@/actions/authActions';
import { sealTrial, updateTrialStatus, fetchTrialSignatures } from '@/actions/trialActions';
import { checkLabCompliance, getCurrentUserProfile } from '@/actions/adminActions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { TrialStatus, MetadataEntry } from '@/types/inquestra';
import type { User } from '@supabase/supabase-js';
import type { Role } from '@prisma/client';

const EMPTY_METADATA: MetadataEntry[] = [];

const STATUS_COLORS: Record<TrialStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-border',
  ACTIVE: 'bg-primary/10 text-primary border-primary/30',
  IN_REVIEW: 'bg-caution/10 text-caution border-caution/30',
  COMPLETED: 'bg-phosphor/10 text-phosphor border-phosphor/30',
  FAILED: 'bg-critical/10 text-critical border-critical/30',
};

export function Header() {
  const isLeftSidebarOpen = useNotebookStore((s) => s.isLeftSidebarOpen);
  const isRightDrawerOpen = useNotebookStore((s) => s.isRightDrawerOpen);
  const toggleLeftSidebar = useNotebookStore((s) => s.toggleLeftSidebar);
  const toggleRightDrawer = useNotebookStore((s) => s.toggleRightDrawer);

  const title = useNotebookStore((s) => s.activeTrial.title);
  const status = useNotebookStore((s) => s.activeTrial.status);
  const metadata = useNotebookStore((s) => s.activeTrial?.metadata ?? EMPTY_METADATA);
  const checksum = useNotebookStore((s) => s.activeTrial.checksum);
  const activeTrialId = useNotebookStore((s) => s.activeTrial.id);
  const cloudTrialId = useNotebookStore((s) => s.cloudTrialId);
  const cloudProjectId = useNotebookStore((s) => s.cloudProjectId);
  const setCloudIds = useNotebookStore((s) => s.setCloudIds);
  const hardwareStatus = useNotebookStore((s) => s.hardwareStatus);
  const isLoadingTrial = useNotebookStore((s) => s.isLoadingTrial);
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
  const [showSealModal, setShowSealModal] = useState(false);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMoreMenu]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Clear local storage so no private experiments leak on shared lab computers
      if (typeof window !== 'undefined') {
        localStorage.removeItem('inquestra-notebook-v1');
      }
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.href = '/app';
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('inquestra-notebook-v1');
      }
      await signOut();
      window.location.href = '/app';
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

  const handleSaveSnapshot = useCallback(() => {
    setSyncError(null);
    setSaveError(null);

    // If user is not logged in, direct them to login
    if (!user) {
      window.location.href = '/app/login?redirectTo=/app';
      return;
    }

    setSaveStatus('SAVING');
    startTransition(async () => {
      const currentContent = useNotebookStore.getState().activeTrial.content;
      const result = await syncTrialToCloud({
        title,
        content: JSON.parse(JSON.stringify(currentContent || {})),
        status,
        metadata: metadata.map(({ key, value }) => ({ key, value })),
        cloudTrialId: cloudTrialId ?? undefined,
        cloudProjectId: cloudProjectId ?? undefined,
      });

      if (!result.success || result.error) {
        const err = result.error ?? 'Snapshot save failed.';
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
        setSnapshotSuccess(true);
        setTimeout(() => setSnapshotSuccess(false), 2500);
      }
    });
  }, [user, title, status, metadata, cloudTrialId, cloudProjectId, setCloudIds, setSaveStatus, setLastSavedAt, setSaveError, startTransition]);

  // Listen to global shortcut trigger from EditorCanvas or elsewhere
  useEffect(() => {
    const handleSnapshotEvent = () => {
      handleSaveSnapshot();
    };
    window.addEventListener('inquestra:trigger-snapshot', handleSnapshotEvent);
    return () => window.removeEventListener('inquestra:trigger-snapshot', handleSnapshotEvent);
  }, [handleSaveSnapshot]);

  // Listen for slash-command triggered export and seal events
  useEffect(() => {
    const handleExportEvent = () => { handleExport(); };
    const handleSealEvent = () => { handleOpenSealModal(); };
    window.addEventListener('inquestra:trigger-export', handleExportEvent);
    window.addEventListener('inquestra:trigger-seal', handleSealEvent);
    return () => {
      window.removeEventListener('inquestra:trigger-export', handleExportEvent);
      window.removeEventListener('inquestra:trigger-seal', handleSealEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global shortcuts for sidebar (Ctrl+B) and telemetry drawer (Ctrl+J)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleLeftSidebar();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggleRightDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeftSidebar, toggleRightDrawer]);

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

      const currentTrial = useNotebookStore.getState().activeTrial;
      await exportTrialAsZip({
        title,
        content: currentTrial.content,
        metadata: metadata.map(({ key, value }) => ({ key, value })),
        status,
        createdAt: currentTrial.createdAt,
        updatedAt: currentTrial.updatedAt,
        html: resolvedHtml,
        checksum: currentTrial.checksum,
        signatures,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const [isSealing, setIsSealing] = useState(false);
  const handleOpenSealModal = () => {
    setShowSealModal(true);
  };

  const handleExecuteSeal = () => {
    setIsSealing(true);
    startTransition(async () => {
      try {
        let targetId = cloudTrialId || activeTrialId;
        const currentTrial = useNotebookStore.getState().activeTrial;
        
        // Ensure trial exists in DB by syncing first
        const syncResult = await syncTrialToCloud({
          title,
          content: JSON.parse(JSON.stringify(currentTrial.content || {})),
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
        setShowSealModal(false);
        // Force reload to grab latest DB state
        window.location.reload(); 
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to seal trial');
        setIsSealing(false);
      }
    });
  };

  return (
    <header className="h-14 border-b border-border bg-background/90 backdrop-blur-md flex items-center px-4 sm:px-5 gap-3 sm:gap-4 shrink-0 z-50 sticky top-0 shadow-sm font-sans">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-primary focus:text-primary-foreground focus:rounded focus:shadow-lg focus:text-xs focus:font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      {/* Left Sidebar Toggle Button */}
      <button
        type="button"
        onClick={toggleLeftSidebar}
        title={isLeftSidebarOpen ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)"}
        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
          isLeftSidebarOpen
            ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
            : 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25'
        }`}
        aria-label="Toggle left sidebar"
      >
        <PanelLeft className="w-4 h-4" />
      </button>

      {/* Brand */}
      <Link href="/app" className="flex items-center gap-2 shrink-0 group">
        <Logo className="text-foreground group-hover:text-primary transition-colors w-5 h-5" />
        <span className="text-foreground font-semibold text-sm tracking-tight hidden sm:inline">
          Inquestra
        </span>
      </Link>

      <div className="h-4 w-px bg-border shrink-0" />

      {/* Trial identity */}
      <div className="flex items-center min-w-0 max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md shrink">
        {isLoadingTrial ? (
          <div className="h-4 w-28 bg-muted-foreground/20 rounded animate-pulse" />
        ) : (
          <span className="text-foreground text-sm font-semibold tracking-tight truncate" title={title}>
            {title}
          </span>
        )}
      </div>

      {/* Status badge — interactive dropdown when trial is not sealed */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold hidden md:inline">Status:</span>
        {checksum ? (
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
            title={cloudTrialId ? 'Change trial lifecycle status' : 'Save trial to cloud to change status'}
            aria-label="Change trial lifecycle status"
            className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border cursor-pointer appearance-none bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/50 focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:cursor-not-allowed ${STATUS_COLORS[status]}`}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="IN_REVIEW">IN REVIEW</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
          </select>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
        {/* Sync error */}
        {syncError && (
          <span className="text-[11px] text-critical font-mono max-w-[140px] sm:max-w-[200px] truncate" title={syncError}>
            {syncError}
          </span>
        )}

        {/* Real-time Autosave / Local status indicator */}
        {!user && (
          saveStatus === 'UNSAVED' ? (
            <span
              className="flex items-center gap-1.5 text-xs text-amber-500 font-mono"
              title="Unsaved changes pending local save"
            >
              <Circle className="w-2 h-2 fill-amber-500 shrink-0" />
              <span className="hidden sm:inline">Unsaved</span>
            </span>
          ) : (
            <span
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium"
              title="Private to this device. Everything is saved automatically in your browser's local storage."
            >
              <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 shrink-0" />
              <span className="hidden sm:inline">Saved in browser</span>
            </span>
          )
        )}
        {user && (saveStatus === 'SAVING' || isPending) && (
          <span className="flex items-center gap-1.5 text-xs text-primary font-mono animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Saving…</span>
          </span>
        )}
        {user && saveStatus === 'SAVED' && !syncError && isSynced && !isPending && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono" title="Continuous background autosave is active">
            <Cloud className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Autosaved</span>
          </span>
        )}
        {user && saveStatus === 'UNSAVED' && isSynced && !isPending && (
          <span className="flex items-center gap-1.5 text-xs text-amber-500 font-mono" title="Unsaved changes pending autosave">
            <Circle className="w-2 h-2 fill-amber-500" />
            <span className="hidden sm:inline">Unsaved</span>
          </span>
        )}
        {user && (saveStatus === 'ERROR' || syncError) && (
          <span className="flex items-center gap-1.5 text-xs text-critical font-mono" title={saveError || syncError || 'Sync failed'}>
            <AlertCircle className="w-3.5 h-3.5 text-critical" />
            <span className="hidden sm:inline">Save Error</span>
          </span>
        )}

        {/* Back up to Cloud (Guests) or Save Snapshot button (Logged in users) */}
        {!user ? (
          <Link
            href="/app/signup?redirectTo=/app"
            title="Create an account to back up notes and sync across devices"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Back up to Cloud</span>
          </Link>
        ) : (
          <button
            onClick={handleSaveSnapshot}
            disabled={isPending || saveStatus === 'SAVING'}
            title={isSynced ? 'Autosave is active. Click or press Ctrl+S to save a numbered revision checkpoint.' : 'Save trial to cloud database'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              snapshotSuccess
                ? 'bg-phosphor/15 text-phosphor border-phosphor/40 font-semibold'
                : isSynced
                ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                : 'bg-muted/60 text-foreground border-border hover:bg-accent'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPending || saveStatus === 'SAVING' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : snapshotSuccess ? (
              <Check className="w-3.5 h-3.5 text-phosphor" />
            ) : isSynced ? (
              <Bookmark className="w-3.5 h-3.5" />
            ) : (
              <Cloud className="w-3.5 h-3.5" />
            )}
            <span>
              {isPending || saveStatus === 'SAVING'
                ? 'Saving…'
                : snapshotSuccess
                ? 'Saved!'
                : isSynced
                ? 'Snapshot'
                : 'Save'}
            </span>
          </button>
        )}

        {/* Download / Export button */}
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          title="Download notes and protocol as ZIP (Markdown + JSON)"
          aria-label="Export trial as ZIP"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border border-border bg-muted/60 text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{isExporting ? 'Downloading…' : 'Download'}</span>
        </button>

        {/* Print button (desktop) */}
        <button
          type="button"
          onClick={() => window.print()}
          title="Print trial to PDF (Ctrl+P)"
          aria-label="Print trial to PDF"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border border-border bg-muted/60 text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>

        {/* Sealed indicator badge if experiment is cryptographically locked */}
        {checksum && (
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium border border-caution/30 bg-caution/10 text-caution font-mono"
            title={`Sealed with SHA-256: ${checksum}. Experiment is cryptographically locked and read-only.`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Sealed</span>
            <span className="sm:hidden font-mono text-[10px]">LOCKED</span>
          </div>
        )}

        {/* More Actions Dropdown (contains Print, Export, and dangerous 21 CFR Part 11 Seal action) */}
        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setShowMoreMenu((prev) => !prev)}
            title="More actions and regulatory tools"
            aria-label="More actions and regulatory tools"
            aria-expanded={showMoreMenu}
            className={`p-1.5 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              showMoreMenu
                ? 'bg-accent text-foreground border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted border-transparent hover:border-border'
            }`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl p-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-100">
              {/* Export in dropdown */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  handleExport();
                }}
                disabled={isExporting}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent text-left transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-foreground">Export Trial Archive</div>
                  <div className="text-[10px] text-muted-foreground">Download ZIP with Markdown, CSV, and JSON</div>
                </div>
              </button>

              {/* Print in dropdown */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  window.print();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent text-left transition-colors"
              >
                <Printer className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-foreground">Print to PDF</div>
                  <div className="text-[10px] text-muted-foreground">Formatted paper or PDF output (Ctrl+P)</div>
                </div>
              </button>

              <div className="my-1.5 h-px bg-border" />

              {/* 21 CFR Part 11 Regulatory Sealing Option */}
              {checksum ? (
                <div className="px-2.5 py-2 rounded-md bg-muted/40 text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <ShieldCheck className="w-4 h-4 text-caution" />
                    <span>Trial Sealed (SHA-256)</span>
                  </div>
                  <div className="text-[10px] font-mono mt-0.5 truncate text-muted-foreground" title={checksum}>
                    Hash: {checksum.slice(0, 16)}...
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleOpenSealModal();
                  }}
                  className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-md hover:bg-destructive/10 text-left transition-colors group"
                >
                  <Shield className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-destructive group-hover:underline">
                      Seal Trial (21 CFR Part 11)
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-snug">
                      Irreversible cryptographic lock. All data becomes permanently read-only.
                    </div>
                  </div>
                </button>
              )}

              <div className="my-1.5 h-px bg-border" />

              {/* Shortcut reference */}
              <div className="px-2.5 py-1 text-[10px] text-muted-foreground font-mono space-y-1">
                <div className="flex justify-between items-center">
                  <span>Toggle Sidebar</span>
                  <kbd className="bg-muted px-1.5 py-0.5 rounded text-[9px] border border-border">Ctrl+B</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Toggle Telemetry</span>
                  <kbd className="bg-muted px-1.5 py-0.5 rounded text-[9px] border border-border">Ctrl+J</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Save Snapshot</span>
                  <kbd className="bg-muted px-1.5 py-0.5 rounded text-[9px] border border-border">Ctrl+S</kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live connection badge */}
        {hardwareStatus.isConnected && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-phosphor font-mono bg-phosphor/10 border border-phosphor/30 px-2 py-1 rounded">
            <Circle className="w-2 h-2 fill-phosphor animate-pulse" />
            <span className="truncate max-w-[90px]">{hardwareStatus.portName || 'Serial'}</span>
            &nbsp;·&nbsp;
            {hardwareStatus.packetsPerSec} Hz
          </span>
        )}

        <div className="h-5 w-px bg-border shrink-0" />

        {/* Telemetry drawer toggle button */}
        <button
          type="button"
          onClick={toggleRightDrawer}
          title={isRightDrawerOpen ? "Close telemetry drawer (Ctrl+J)" : "Open telemetry drawer (Ctrl+J)"}
          className={`p-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 ${
            isRightDrawerOpen
              ? 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          aria-label="Toggle telemetry drawer"
        >
          <PanelRight className="w-4 h-4" />
          <span className="hidden xl:inline text-xs font-medium">Telemetry</span>
        </button>

        <ThemeToggle />

        {/* Auth status: User Profile or Sign In button */}
        {user ? (
          <div className="flex items-center gap-2">
            {profile && (profile.role === 'ADMIN' || profile.role === 'PI') ? (
              <Link
                href="/app/admin"
                className="flex items-center gap-1.5 text-xs text-foreground font-mono bg-muted border border-border px-2.5 py-1 rounded max-w-[240px] truncate hover:bg-accent hover:border-border/80 transition-colors shadow-sm"
                title="Lab Operations & Settings"
              >
                <Shield className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                <span
                  className={`font-semibold text-[10px] uppercase ${
                    profile.role === 'PI'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-sky-600 dark:text-sky-400'
                  }`}
                >
                  {profile.role === 'PI' ? 'LAB PI' : profile.role}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="truncate">{user.email?.split('@')?.[0] ?? 'Researcher'}</span>
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
                <span className="truncate">{user.email?.split('@')?.[0] ?? 'Researcher'}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-muted border border-transparent hover:border-border rounded transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      <SealConfirmationModal
        trialTitle={title}
        isOpen={showSealModal}
        isSealing={isSealing}
        onClose={() => setShowSealModal(false)}
        onConfirm={handleExecuteSeal}
      />
    </header>
  );
}
