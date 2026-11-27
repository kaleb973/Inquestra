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
  Upload,
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
  RotateCw,
  Laptop,
} from 'lucide-react';
import { isDeploymentSkewError, notifyDeploymentSkew } from '@/lib/deploymentSkew';
import { SealConfirmationModal } from '@/components/trials/SealConfirmationModal';
import { ImportTrialModal } from '@/components/trials/ImportTrialModal';
import { ExportTrialModal } from '@/components/trials/ExportTrialModal';
import { Logo } from '@/components/ui/Logo';
import { useNotebookStore, STORAGE_QUOTA_ERROR, getSessionTelemetry } from '@/store/useNotebookStore';
import { IS_CLOUD_WORKSPACE_ENABLED } from '@/lib/features';
import { syncTrialToCloud } from '@/actions/syncActions';
import { exportTrialAsZip, type SignatureExport } from '@/lib/exportTrial';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { signOut } from '@/actions/authActions';
import { sealTrial, updateTrialStatus, fetchTrialSignatures } from '@/actions/trialActions';
import { checkLabCompliance, getCurrentUserProfile } from '@/actions/adminActions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { trackAnalyticsEvent } from '@/lib/analytics/events';
import posthog from 'posthog-js';
import type { TrialStatus, MetadataEntry, TrialSummaryItem } from '@/types/inquestra';
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
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
    if (
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      posthog.reset();
    }
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
        if (isDeploymentSkewError(err)) {
          notifyDeploymentSkew('Header.handleSaveSnapshot');
          setSyncError('NEW_VERSION_DEPLOYED');
          setSaveError('NEW_VERSION_DEPLOYED');
        } else {
          setSyncError(err);
          setSaveError(err);
        }
        setSaveStatus('ERROR');
      } else if (result.cloudTrialId && result.cloudProjectId) {
        const newCloudTrialId = result.cloudTrialId;
        const newCloudProjectId = result.cloudProjectId;
        const prevId = useNotebookStore.getState().activeTrial.id;

        useNotebookStore.setState((s) => ({
          activeTrial: {
            ...s.activeTrial,
            id: newCloudTrialId,
          },
          localTrials: s.localTrials.filter((t) => t.id !== prevId && t.id !== newCloudTrialId),
          cloudTrialId: newCloudTrialId,
          cloudProjectId: newCloudProjectId,
          saveStatus: 'SAVED',
          lastSavedAt: new Date().toISOString(),
          saveError: null,
        }));

        // Notify LeftSidebar to add/update this trial in trials list
        const updatedSummary: TrialSummaryItem = {
          id: newCloudTrialId,
          title,
          status: status as TrialStatus,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          projectId: newCloudProjectId,
          metadata: metadata,
        };

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('inquestra:trial-imported', {
              detail: { trial: updatedSummary, doc: useNotebookStore.getState().activeTrial },
            })
          );
        }

        setSnapshotSuccess(true);
        setTimeout(() => setSnapshotSuccess(false), 2500);
      }
    });
  }, [user, title, status, metadata, cloudTrialId, cloudProjectId, setSaveStatus, setSaveError, startTransition]);

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
    const handleExportEvent = () => { setShowExportModal(true); };
    const handleSealEvent = () => { handleOpenSealModal(); };
    const handleImportEvent = () => { setShowImportModal(true); };
    window.addEventListener('inquestra:trigger-export', handleExportEvent);
    window.addEventListener('inquestra:trigger-seal', handleSealEvent);
    window.addEventListener('inquestra:trigger-import', handleImportEvent);
    return () => {
      window.removeEventListener('inquestra:trigger-export', handleExportEvent);
      window.removeEventListener('inquestra:trigger-seal', handleSealEvent);
      window.removeEventListener('inquestra:trigger-import', handleImportEvent);
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
    trackAnalyticsEvent('export_triggered', { format: 'zip', trialTitle: title });
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
        telemetry: getSessionTelemetry(),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const [sealError, setSealError] = useState<string | null>(null);

  const [isSealing, setIsSealing] = useState(false);
  const handleOpenSealModal = () => {
    if (!user) {
      setSealError(
        IS_CLOUD_WORKSPACE_ENABLED
          ? 'Permanent cryptographic trial sealing and dual-signature manifests require an authenticated account. Please sign in to sync and seal, or use Export to download a portable JSON/ZIP archive.'
          : 'Database-backed trial sealing requires a self-hosted PostgreSQL workspace. Use Export to download a portable ZIP, Markdown, or JSON archive from your Local Notebook.'
      );
      setShowSealModal(true);
      return;
    }
    setSealError(null);
    setShowSealModal(true);
  };

  const handleExecuteSeal = () => {
    if (!user) return;
    setIsSealing(true);
    setSealError(null);
    startTransition(async () => {
      try {
        let targetId = cloudTrialId || activeTrialId;
        const currentTrial = useNotebookStore.getState().activeTrial;
        
        // If not already sealed, sync to cloud first
        if (!currentTrial.checksum) {
          const syncResult = await syncTrialToCloud({
            title,
            content: JSON.parse(JSON.stringify(currentTrial.content || {})),
            status,
            metadata: metadata.map(({ key, value }) => ({ key, value })),
            cloudTrialId: targetId ?? undefined,
            cloudProjectId: cloudProjectId ?? undefined,
          });

          if (!syncResult.success && !syncResult.error?.includes('sealed')) {
            setSealError(syncResult.error || 'Failed to sync trial before sealing.');
            setIsSealing(false);
            return;
          }

          if (syncResult.success && syncResult.cloudTrialId) {
            targetId = syncResult.cloudTrialId;
            setCloudIds({
              cloudTrialId: syncResult.cloudTrialId,
              cloudProjectId: syncResult.cloudProjectId ?? '',
            });
          }
        }

        const sealRes = await sealTrial(targetId);
        if (!sealRes.success) {
          setSealError(sealRes.error || 'Failed to seal trial.');
          setIsSealing(false);
          return;
        }

        if (sealRes.checksum) {
          const store = useNotebookStore.getState();
          store.setActiveTrial({
            ...store.activeTrial,
            checksum: sealRes.checksum,
            status: 'COMPLETED',
            sealedAt: sealRes.sealedAt || new Date().toISOString(),
          });
        }

        trackAnalyticsEvent('trial_sealed', { trialId: targetId });
        setShowSealModal(false);
        setIsSealing(false);
        // Force reload to grab latest DB state
        window.location.reload(); 
      } catch (err: unknown) {
        console.error('Failed to seal trial:', err);
        setSealError(err instanceof Error ? err.message : 'Failed to seal trial.');
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
            disabled={isPending}
            onChange={(e) => {
              const newStatus = e.target.value as TrialStatus;
              const targetId = cloudTrialId || activeTrialId;
              startTransition(async () => {
                try {
                  if (cloudTrialId) {
                    const res = await updateTrialStatus(cloudTrialId, newStatus);
                    if (!res.success) {
                      console.warn('Status update warning from server:', res.error);
                    }
                  }
                  useNotebookStore.getState().updateTrialStatusEverywhere(targetId, newStatus);
                  trackAnalyticsEvent('trial_status_changed', {
                    trialId: targetId,
                    status: newStatus,
                  });
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                      new CustomEvent('inquestra:trial-status-updated', {
                        detail: { trialId: targetId, status: newStatus },
                      })
                    );
                  }
                } catch (err) {
                  console.error('Status update network error:', err);
                  useNotebookStore.getState().updateTrialStatusEverywhere(targetId, newStatus);
                }
              });
            }}
            title="Change trial lifecycle status"
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

        {/* Scope Badge: Cloud Project vs Local Draft */}
        {isSynced ? (
          <span
            className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-primary/10 text-primary border border-primary/25"
            title="Synced to your organization's cloud project"
          >
            <Cloud className="w-3 h-3 shrink-0" />
            <span>Cloud</span>
          </span>
        ) : (
          <span
            className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border"
            title="Stored locally in this browser. Not synced to cloud."
          >
            <Laptop className="w-3 h-3 shrink-0" />
            <span>Local Draft</span>
          </span>
        )}

        {/* Real-time Save Status Indicator */}
        {(saveStatus === 'SAVING' || isPending) ? (
          <span className="flex items-center gap-1.5 text-xs text-primary font-mono animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span className="hidden sm:inline">{isSynced ? 'Saving to cloud…' : 'Saving locally…'}</span>
          </span>
        ) : (saveStatus === 'ERROR' || syncError) ? (
          isDeploymentSkewError(saveError || syncError) ? (
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 font-mono cursor-pointer transition-colors"
              title="A new version of Inquestra was deployed to the server. Your draft is preserved locally: click to reload."
            >
              <RotateCw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Update deployed (Reload)</span>
            </button>
          ) : saveError === STORAGE_QUOTA_ERROR ? (
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 text-xs text-critical hover:underline font-mono cursor-pointer"
              title={STORAGE_QUOTA_ERROR}
            >
              <AlertCircle className="w-3.5 h-3.5 text-critical shrink-0" />
              <span className="hidden sm:inline">Storage full · Export backup</span>
            </button>
          ) : (
            <span
              className="flex items-center gap-1.5 text-xs text-critical font-mono"
              title={saveError || syncError || 'Save failed'}
            >
              <AlertCircle className="w-3.5 h-3.5 text-critical shrink-0" />
              <span className="hidden sm:inline">Save failed</span>
            </span>
          )
        ) : saveStatus === 'UNSAVED' ? (
          <span
            className="flex items-center gap-1.5 text-xs text-amber-500 font-mono"
            title="Pending background autosave"
          >
            <Circle className="w-2 h-2 fill-amber-500 shrink-0" />
            <span className="hidden sm:inline">Unsaved</span>
          </span>
        ) : (
          <span
            className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium"
            title={isSynced ? 'All changes synced to cloud' : 'All changes saved locally in browser storage'}
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{isSynced ? 'Saved' : 'Saved locally'}</span>
          </span>
        )}

        {/* Back up to Cloud (Guests, when cloud enabled) or Save / Snapshot button (Logged in users) */}
        {!user ? (
          IS_CLOUD_WORKSPACE_ENABLED ? (
            <Link
              href="/app/signup?redirectTo=/app"
              onClick={() =>
                trackAnalyticsEvent('cloud_backup_intent', {
                  triggerSource: 'header_backup_button',
                })
              }
              title="Create an account to back up notes and sync across devices"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Back up to Cloud</span>
            </Link>
          ) : null
        ) : (
          <button
            onClick={handleSaveSnapshot}
            disabled={isPending || saveStatus === 'SAVING'}
            title={
              isSynced
                ? 'Autosave is active. Click or press Ctrl+S to save a numbered revision checkpoint.'
                : 'Upload this local draft to your cloud database'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              snapshotSuccess
                ? 'bg-phosphor/15 text-phosphor border-phosphor/40 font-semibold'
                : isSynced
                ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 font-medium'
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
                : 'Save to Cloud'}
            </span>
          </button>
        )}

        {/* Import button */}
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          title="Import trial from trial.json or .zip archive"
          aria-label="Import trial from archive"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border border-border bg-muted/60 text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Upload className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">Import</span>
        </button>

        {/* Export button */}
        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          title="Export experiment as ZIP, JSON, Markdown, or PDF"
          aria-label="Export experiment"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border border-border bg-muted/60 text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Print button (desktop) */}
        <button
          type="button"
          onClick={() => {
            trackAnalyticsEvent('export_triggered', { format: 'pdf', trialTitle: title });
            window.print();
          }}
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

        {/* More Actions Dropdown (contains Print, Export, and permanent record seal action) */}
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
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover/95 backdrop-blur-sm text-popover-foreground shadow-lg p-1 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-75 select-none">
              {/* Import in dropdown */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowImportModal(true);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-left transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>Import Archive…</span>
              </button>

              {/* Export in dropdown */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowExportModal(true);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-left transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>Export Experiment…</span>
              </button>

              {/* Print in dropdown */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  trackAnalyticsEvent('export_triggered', { format: 'pdf' });
                  window.print();
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Print</span>
                </div>
                <kbd className="text-[9px] font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded border border-border">
                  Ctrl+P
                </kbd>
              </button>

              <div className="my-1 h-px bg-border/50" />

              {/* Regulatory Sealing Option */}
              {checksum ? (
                <div className="px-2 py-1.5 rounded-md bg-muted/40 text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">Sealed ({checksum.slice(0, 8)}…)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleOpenSealModal();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-destructive hover:bg-destructive/10 text-left transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>Seal Trial Record…</span>
                </button>
              )}

              {!user && !IS_CLOUD_WORKSPACE_ENABLED && (
                <>
                  <div className="my-1 h-px bg-border/50" />
                  <Link
                    href="/app/login"
                    onClick={() => setShowMoreMenu(false)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent text-left transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 shrink-0" />
                    <span>Sign in (existing account)…</span>
                  </Link>
                </>
              )}
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
        ) : IS_CLOUD_WORKSPACE_ENABLED ? (
          <Link
            href="/app/login"
            onClick={() =>
              trackAnalyticsEvent('sign_in_intent', {
                triggerSource: 'header_signin_button',
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </Link>
        ) : null}
      </div>

      <SealConfirmationModal
        trialTitle={title}
        isOpen={showSealModal}
        isSealing={isSealing}
        error={sealError}
        onClose={() => {
          setShowSealModal(false);
          setSealError(null);
        }}
        onConfirm={handleExecuteSeal}
      />

      <ImportTrialModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        isGuest={!user}
      />

      <ExportTrialModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        onOpenImport={() => setShowImportModal(true)}
      />
    </header>
  );
}
