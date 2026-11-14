'use client';
// src/components/layout/LeftSidebar.tsx
// Left panel: dynamic project switcher, trial list, hardware controls.

import { useEffect, useState, useTransition, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import TemplateGalleryModal from '@/components/trials/TemplateGalleryModal';
import { ImportTrialModal } from '@/components/trials/ImportTrialModal';
import type { ExperimentTemplate } from '@/lib/templates';
import {
  FlaskConical,
  ChevronDown,
  Plus,
  Upload,
  HardDrive,
  BookOpen,
  Settings2,
  Loader2,
  X,
  User as UserIcon,
  FolderOpen,
  Eye,
  Search,
  Tag,
  Info,
  MoreVertical,
  Quote,
  PanelLeftClose,
  Activity,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useNotebookStore } from '@/store/useNotebookStore';
import {
  fetchWorkspaceBootstrap,
  fetchAllTrials,
  createNewTrial,
  getTrial,
  renameTrial,
  duplicateTrial,
  deleteTrial,
  setTrialCategory,
  updateTrialStatus,
} from '@/actions/trialActions';
import { fetchProjectsWithLeads, createProject, fetchLabMembersForLeadSelector } from '@/actions/projectActions';
import type { TrialStatus, TrialSummaryItem } from '@/types/inquestra';
import type { ProjectWithLead } from '@/actions/projectActions';
import type { Role } from '@prisma/client';
import { TrialPreviewCard } from '@/components/trials/TrialPreviewCard';
import { TrialContextMenu } from '@/components/trials/TrialContextMenu';
import { trackAnalyticsEvent } from '@/lib/analytics/events';

interface StatusConfig {
  dotClass: string;
  badgeClass: string;
  label: string;
  tooltip: string;
}

const STATUS_CONFIG: Record<TrialStatus, StatusConfig> = {
  DRAFT: {
    dotClass: 'bg-muted-foreground/60',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    label: 'Draft',
    tooltip: 'Lifecycle: Draft (Protocol setup / in planning)',
  },
  ACTIVE: {
    dotClass: 'bg-primary ring-2 ring-primary/20 shadow-[0_0_6px_rgba(56,189,248,0.4)]',
    badgeClass: 'bg-primary/10 text-primary border border-primary/30',
    label: 'Active',
    tooltip: 'Lifecycle: Active (Live telemetry acquisition / execution in progress)',
  },
  IN_REVIEW: {
    dotClass: 'bg-caution ring-2 ring-caution/20 shadow-[0_0_6px_rgba(245,158,11,0.4)]',
    badgeClass: 'bg-caution/10 text-caution border border-caution/30',
    label: 'In Review',
    tooltip: 'Lifecycle: In Review (Pending peer or QA verification)',
  },
  COMPLETED: {
    dotClass: 'bg-phosphor ring-2 ring-phosphor/20 shadow-[0_0_6px_rgba(34,197,94,0.4)]',
    badgeClass: 'bg-phosphor/10 text-phosphor border border-phosphor/30',
    label: 'Completed',
    tooltip: 'Lifecycle: Completed (Acquisition finished & cryptographically sealed)',
  },
  FAILED: {
    dotClass: 'bg-critical ring-2 ring-critical/20 shadow-[0_0_6px_rgba(239,68,68,0.4)]',
    badgeClass: 'bg-critical/10 text-critical border border-critical/30',
    label: 'Failed',
    tooltip: 'Lifecycle: Failed (Sensor anomaly or protocol deviation)',
  },
};

const ROLE_LABEL: Record<Role, string> = {
  PI: '★ PI',
  ADMIN: 'Admin',
  RESEARCHER: 'Researcher',
  VIEWER: 'Viewer',
};

// ─── New Project Modal ─────────────────────────────────────────────────────────

interface LabMember {
  id: string;
  email: string;
  role: Role;
}

function NewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (project: ProjectWithLead) => void;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState('');
  const [members, setMembers] = useState<LabMember[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLabMembersForLeadSelector().then(setMembers).catch(console.error);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createProject({
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        leadId: leadId || undefined,
      });
      if (!result.success) {
        setError(result.error ?? 'Failed to create project.');
        return;
      }
      // Return minimal placeholder so sidebar updates immediately
      onCreated({
        id: result.projectId!,
        name: name.trim(),
        code: code.trim() || null,
        description: description.trim() || null,
        status: 'ACTIVE',
        organizationId: '',
        leadId: leadId || null,
        lead: members.find((m) => m.id === leadId) ?? null,
        _count: { trials: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground">New Research Project</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cardiac Biomarker Study"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Protocol / Grant Code{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. PRJ-CARD-02"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Description{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief research scope or objectives…"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Project Lead / PI{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors"
            >
              <option value="">— No lead assigned yet —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.email} ({ROLE_LABEL[m.role]})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded text-xs font-medium border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-3 py-2 rounded text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {isPending ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function LeftSidebar() {
  const isLeftSidebarOpen = useNotebookStore((s) => s.isLeftSidebarOpen);
  const toggleLeftSidebar = useNotebookStore((s) => s.toggleLeftSidebar);
  const activeTrial = useNotebookStore((s) => s.activeTrial);
  const cloudTrialId = useNotebookStore((s) => s.cloudTrialId);
  const cloudProjectId = useNotebookStore((s) => s.cloudProjectId);
  const setActiveTrial = useNotebookStore((s) => s.setActiveTrial);
  const setCloudIds = useNotebookStore((s) => s.setCloudIds);
  const setIsLoadingTrial = useNotebookStore((s) => s.setIsLoadingTrial);
  const setAuthStatus = useNotebookStore((s) => s.setAuthStatus);
  const cachedProjects = useNotebookStore((s) => s.cachedProjects);
  const cachedTrials = useNotebookStore((s) => s.cachedTrials);
  const setCachedProjects = useNotebookStore((s) => s.setCachedProjects);
  const setCachedTrials = useNotebookStore((s) => s.setCachedTrials);
  const localTrials = useNotebookStore((s) => s.localTrials);
  const addLocalTrial = useNotebookStore((s) => s.addLocalTrial);
  const deleteLocalTrial = useNotebookStore((s) => s.deleteLocalTrial);
  const selectLocalTrial = useNotebookStore((s) => s.selectLocalTrial);
  const updateLocalTrialStatus = useNotebookStore((s) => s.updateLocalTrialStatus);
  const updateLocalTrialMetadata = useNotebookStore((s) => s.updateLocalTrialMetadata);
  const hardwareStatus = useNotebookStore((s) => s.hardwareStatus);

  // Instant restoration from in-memory cache — zero layout flash or skeleton wait
  const [projects, setProjects] = useState<ProjectWithLead[]>(cachedProjects || []);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    cloudProjectId || (cachedProjects && cachedProjects.length > 0 ? cachedProjects[0]?.id ?? null : null)
  );
  type StatusFilter = 'ALL' | 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'FAILED';

  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isGuest = isAuthenticated === false;
  const [trials, setTrials] = useState<TrialSummaryItem[]>(cachedTrials || []);
  const [previewTrial, setPreviewTrial] = useState<TrialSummaryItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    trial: TrialSummaryItem;
    x: number;
    y: number;
  } | null>(null);
  const [isLoadingTrials, setIsLoadingTrials] = useState(cachedTrials.length === 0);
  const [loadingTrialId, setLoadingTrialId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showInfoPopover, setShowInfoPopover] = useState(false);

  const requestSeqRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const loadingTrialIdRef = useRef<string | null>(null);

  const handleSelectTrial = useCallback((id: string) => {
    // Before switching away, ensure the outgoing active trial's latest title/status in store is mirrored to trials
    const currentActive = useNotebookStore.getState().activeTrial;
    if (currentActive && currentActive.id) {
      setTrials((prev) =>
        prev.map((t) =>
          t.id === currentActive.id
            ? {
                ...t,
                status: currentActive.status || t.status,
                title: currentActive.title || t.title,
                metadata: currentActive.metadata || t.metadata,
              }
            : t
        )
      );
    }

    // Guest / Local Notebook mode: instant switch with 0ms network latency
    if (isGuest) {
      selectLocalTrial(id);
      setIsLoadingTrial(false);
      return;
    }

    // Check if trial exists in localTrials as a fast local fallback (when not authenticated)
    const localMatch = (useNotebookStore.getState().localTrials || []).find((t) => t.id === id);
    if (localMatch && !isAuthenticated) {
      selectLocalTrial(id);
      setIsLoadingTrial(false);
      return;
    }

    // If user is already on this exact trial AND it has already been synced with cloud, don't trigger a full network reload
    const storeState = useNotebookStore.getState();
    if (storeState.activeTrial.id === id && storeState.cloudTrialId === id) {
      setIsLoadingTrial(false);
      return;
    }

    if (loadingTrialIdRef.current === id) return;

    const currentSeq = ++requestSeqRef.current;
    loadingTrialIdRef.current = id;
    setLoadingTrialId(id);
    setIsLoadingTrial(true);

    startTransition(async () => {
      try {
        const fullTrial = await getTrial(id);
        if (requestSeqRef.current !== currentSeq) return;

        if (fullTrial) {
          const loadedStatus = fullTrial.status as import('@/types/inquestra').TrialStatus;
          const loadedMetadata = (fullTrial.metadata ?? []) as import('@/types/inquestra').MetadataEntry[];
          setActiveTrial({
            id: fullTrial.id,
            title: fullTrial.title,
            content: (fullTrial.content ?? { type: 'doc', content: [] }) as Record<string, unknown>,
            status: loadedStatus,
            metadata: loadedMetadata,
            createdAt: fullTrial.createdAt instanceof Date ? fullTrial.createdAt.toISOString() : String(fullTrial.createdAt),
            updatedAt: fullTrial.updatedAt instanceof Date ? fullTrial.updatedAt.toISOString() : String(fullTrial.updatedAt),
            checksum: fullTrial.checksum ?? null,
            sealedAt: fullTrial.sealedAt instanceof Date ? fullTrial.sealedAt.toISOString() : (fullTrial.sealedAt ?? null),
            sealedBy: fullTrial.sealedBy ?? null,
          });

          setTrials((prev) =>
            prev.map((t) =>
              t.id === fullTrial.id
                ? {
                    ...t,
                    status: loadedStatus || t.status,
                    title: fullTrial.title || t.title,
                    metadata: loadedMetadata || t.metadata,
                  }
                : t
            )
          );

          setCloudIds({
            cloudTrialId: fullTrial.id,
            cloudProjectId: fullTrial.projectId,
          });
        }
      } catch (err) {
        console.error('Failed to load trial:', err);
      } finally {
        if (requestSeqRef.current === currentSeq) {
          loadingTrialIdRef.current = null;
          setLoadingTrialId(null);
          setIsLoadingTrial(false);
        }
      }
    });
  }, [isGuest, isAuthenticated, selectLocalTrial, setActiveTrial, setCloudIds, setIsLoadingTrial]);

  const handleSelectTrialRef = useRef(handleSelectTrial);
  useEffect(() => {
    handleSelectTrialRef.current = handleSelectTrial;
  }, [handleSelectTrial]);

  // Consolidated workspace bootstrap on mount with Supabase auth awareness
  useEffect(() => {
    let isCancelled = false;
    setAuthStatus('UNKNOWN');
    const supabase = createSupabaseBrowserClient();

    // Defensive safety timeout so the loading spinner can never stay stuck indefinitely
    const safetyTimer = setTimeout(() => {
      if (!isCancelled) {
        setIsLoadingTrials(false);
        setIsLoadingTrial(false);
      }
    }, 5000);

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isCancelled) return;
      const isAuthed = !!user;
      setIsAuthenticated(isAuthed);
      setAuthStatus(isAuthed ? 'AUTHENTICATED' : 'GUEST');

      if (!isAuthed) {
        clearTimeout(safetyTimer);
        // Enforce Local Notebook guest mode: purge stale cloud IDs from localStorage
        useNotebookStore.setState({ cloudProjectId: null, cloudTrialId: null, saveStatus: 'SAVED' });
        setProjects([]);
        setTrials([]);
        setIsLoadingTrials(false);
        setIsLoadingTrial(false);
        return;
      }

      // Authenticated: mask canvas immediately if holding an un-synced trial
      const currentCloudTrialId = useNotebookStore.getState().cloudTrialId;
      if (!currentCloudTrialId) {
        setIsLoadingTrial(true);
      }

      // Fetch cloud workspace bootstrap
      setIsLoadingTrials(true);
      const initialProjectId = activeProjectId || cloudProjectId;
      fetchWorkspaceBootstrap(initialProjectId)
        .then((res) => {
          if (isCancelled) return;
          clearTimeout(safetyTimer);
          setProjects(res.projects);
          setCachedProjects(res.projects);

          if (res.activeProjectId) {
            setActiveProjectId(res.activeProjectId);
          }

          const trialList = res.trials as unknown as TrialSummaryItem[];
          setTrials(trialList);
          setCachedTrials(trialList);
          setIsLoadingTrials(false);

          // Auto-hydrate active or first cloud trial
          if (trialList.length > 0 && !hasInitializedRef.current) {
            hasInitializedRef.current = true;
            const currentActiveId = useNotebookStore.getState().activeTrial?.id;
            const currentCloudId = useNotebookStore.getState().cloudTrialId;

            // Prioritize preserving current active trial if it exists in the cloud trial list
            const targetTrialId =
              (currentCloudId && trialList.some((t) => t.id === currentCloudId))
                ? currentCloudId
                : (currentActiveId && trialList.some((t) => t.id === currentActiveId))
                  ? currentActiveId
                  : trialList[0]?.id;

            if (targetTrialId) {
              handleSelectTrialRef.current(targetTrialId);
            } else {
              setIsLoadingTrial(false);
            }
          } else {
            setIsLoadingTrial(false);
          }
        })
        .catch((err) => {
          console.error('Failed to bootstrap workspace:', err);
          clearTimeout(safetyTimer);
          setIsLoadingTrials(false);
          setIsLoadingTrial(false);
        });
    }).catch((err) => {
      console.error('Auth resolution error:', err);
      if (isCancelled) return;
      clearTimeout(safetyTimer);
      setIsAuthenticated(false);
      setAuthStatus('GUEST');
      setIsLoadingTrials(false);
      setIsLoadingTrial(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isCancelled) return;
      const isAuthed = !!session?.user;
      setIsAuthenticated(isAuthed);
      setAuthStatus(isAuthed ? 'AUTHENTICATED' : 'GUEST');
      if (!isAuthed) {
        useNotebookStore.setState({ cloudProjectId: null, cloudTrialId: null, saveStatus: 'SAVED' });
        setProjects([]);
        setTrials([]);
        setIsLoadingTrials(false);
        setIsLoadingTrial(false);
      }
    });

    return () => {
      isCancelled = true;
      clearTimeout(safetyTimer);
      loadingTrialIdRef.current = null;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize trial status changes across components (Header, Context Menu, Canvas)
  useEffect(() => {
    const handleStatusUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ trialId: string; status: TrialStatus }>).detail;
      if (!detail?.trialId) return;
      setTrials((prev) =>
        prev.map((t) => (t.id === detail.trialId ? { ...t, status: detail.status } : t))
      );
    };
    window.addEventListener('inquestra:trial-status-updated', handleStatusUpdate);
    return () => window.removeEventListener('inquestra:trial-status-updated', handleStatusUpdate);
  }, []);

  // Handler for manual project switcher
  const handleSelectProject = useCallback(async (newProjectId: string) => {
    setActiveProjectId(newProjectId);
    setIsLoadingTrials(true);
    try {
      const ts = await fetchAllTrials(newProjectId);
      const trialList = ts as unknown as TrialSummaryItem[];
      setTrials(trialList);
      setCachedTrials(trialList);
    } catch (err) {
      console.error('Failed to load trials for project:', err);
    } finally {
      setIsLoadingTrials(false);
    }
  }, [setCachedTrials]);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const handleNewTrial = (cat?: string, template?: ExperimentTemplate) => {
    const resolvedCategory =
      cat ||
      template?.metadata.find((m) => m.key === 'category')?.value ||
      (template?.category && template.category !== 'General' ? template.category : undefined);

    trackAnalyticsEvent('trial_created', {
      category: resolvedCategory || 'General',
      templateId: template?.id || 'blank',
      isAnonymous: isGuest,
    });
    // Before creating new trial, preserve outgoing active trial's latest title/status
    const currentActive = useNotebookStore.getState().activeTrial;
    if (currentActive && currentActive.id) {
      setTrials((prev) =>
        prev.map((t) =>
          t.id === currentActive.id
            ? {
                ...t,
                status: currentActive.status || t.status,
                title: currentActive.title || t.title,
                metadata: currentActive.metadata || t.metadata,
              }
            : t
        )
      );
    }

    const buildLocalTemplateTrial = () => {
      const localId = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      const now = new Date().toISOString();
      const baseMeta = (template?.metadata ?? []).map((entry, idx) => ({
        id: `${localId}-meta-${idx}`,
        key: entry.key,
        value: entry.value,
      }));
      if (resolvedCategory && !baseMeta.some((m) => m.key === 'category')) {
        baseMeta.unshift({ id: `${localId}-cat`, key: 'category', value: resolvedCategory });
      }
      const localTrial: import('@/types/inquestra').TrialDocument = {
        id: localId,
        title: template?.defaultTitle || 'Untitled Run',
        content: template?.content
          ? (JSON.parse(JSON.stringify(template.content)) as Record<string, unknown>)
          : { type: 'doc', content: [] },
        status: 'DRAFT',
        metadata: baseMeta,
        createdAt: now,
        updatedAt: now,
      };
      return localTrial;
    };

    if (isGuest) {
      addLocalTrial(buildLocalTemplateTrial());
      setShowTemplateGallery(false);
      return;
    }
    startTransition(async () => {
      try {
        setIsLoadingTrial(true);
        const newTrial = await createNewTrial(
          activeProjectId,
          resolvedCategory ?? null,
          template
            ? {
                title: template.defaultTitle,
                content: template.content,
                metadata: template.metadata,
              }
            : null
        );
        const summary = newTrial as unknown as TrialSummaryItem;
        setTrials((prev) => [summary, ...prev]);
        setActiveTrial({
          id: newTrial.id,
          title: newTrial.title,
          content: (newTrial.content ?? { type: 'doc', content: [] }) as Record<string, unknown>,
          status: newTrial.status as import('@/types/inquestra').TrialStatus,
          metadata: (newTrial.metadata ?? []) as import('@/types/inquestra').MetadataEntry[],
          createdAt: newTrial.createdAt instanceof Date ? newTrial.createdAt.toISOString() : String(newTrial.createdAt),
          updatedAt: newTrial.updatedAt instanceof Date ? newTrial.updatedAt.toISOString() : String(newTrial.updatedAt),
          checksum: null,
          sealedAt: null,
          sealedBy: null,
        });
        setCloudIds({
          cloudTrialId: newTrial.id,
          cloudProjectId: newTrial.projectId,
        });
      } catch (err) {
        console.warn('Server trial creation skipped (fallback to local):', err);
        addLocalTrial(buildLocalTemplateTrial());
      } finally {
        setIsLoadingTrial(false);
        setShowTemplateGallery(false);
      }
    });
  };

  const handleProjectCreated = (newProject: ProjectWithLead) => {
    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setShowNewProjectModal(false);
  };

  const handleContextMenu = (e: React.MouseEvent, targetTrial: TrialSummaryItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ trial: targetTrial, x: e.clientX, y: e.clientY });
  };

  const handleOpenMenuFromButton = (e: React.MouseEvent, targetTrial: TrialSummaryItem) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ trial: targetTrial, x: rect.right, y: rect.bottom });
  };

  const handleRenameTrial = async (targetTrial: TrialSummaryItem, newTitle: string) => {
    if (isGuest || targetTrial.projectId === 'local' || !cloudProjectId) {
      const now = new Date().toISOString();
      if (targetTrial.id === activeTrial.id) {
        useNotebookStore.getState().updateTitle(newTitle);
      } else {
        useNotebookStore.setState((s) => ({
          localTrials: s.localTrials.map((t) =>
            t.id === targetTrial.id ? { ...t, title: newTitle, updatedAt: now } : t
          ),
        }));
      }
      return;
    }
    try {
      await renameTrial(targetTrial.id, newTitle);
      setTrials((prev) =>
        prev.map((t) => (t.id === targetTrial.id ? { ...t, title: newTitle } : t))
      );
      if (activeTrial.id === targetTrial.id) {
        useNotebookStore.getState().updateTitle(newTitle);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to rename experiment');
    }
  };

  const handleDuplicateTrial = async (targetTrial: TrialSummaryItem) => {
    if (isGuest || targetTrial.projectId === 'local' || !cloudProjectId) {
      const source =
        localTrials.find((t) => t.id === targetTrial.id) ??
        (activeTrial.id === targetTrial.id ? activeTrial : null);
      const now = new Date().toISOString();
      const localId =
        typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      const cloned: import('@/types/inquestra').TrialDocument = {
        id: localId,
        title: `${targetTrial.title} (Copy)`,
        content: source?.content
          ? (JSON.parse(JSON.stringify(source.content)) as Record<string, unknown>)
          : { type: 'doc', content: [] },
        status: 'DRAFT',
        metadata: (source?.metadata ?? targetTrial.metadata ?? []).map((m) => ({ ...m })),
        createdAt: now,
        updatedAt: now,
      };
      addLocalTrial(cloned);
      return;
    }
    try {
      const res = await duplicateTrial(targetTrial.id);
      if (res.success && res.trial) {
        const summary = res.trial as unknown as TrialSummaryItem;
        setTrials((prev) => [summary, ...prev]);
        handleSelectTrial(res.trial.id);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate experiment');
    }
  };

  const handleDeleteTrial = async (targetTrial: TrialSummaryItem) => {
    if (isGuest || targetTrial.projectId === 'local' || !cloudProjectId) {
      deleteLocalTrial(targetTrial.id);
      return;
    }
    try {
      await deleteTrial(targetTrial.id);
      setTrials((prev) => prev.filter((t) => t.id !== targetTrial.id));
      if (activeTrial.id === targetTrial.id) {
        const remaining = trials.filter((t) => t.id !== targetTrial.id);
        if (remaining.length > 0 && remaining[0]?.id) {
          handleSelectTrial(remaining[0].id);
        } else {
          handleNewTrial();
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete experiment');
    }
  };

  const handleSetCategory = async (targetTrial: TrialSummaryItem, category: string) => {
    if (isGuest || targetTrial.projectId === 'local' || !cloudProjectId) {
      const currentMeta = targetTrial.metadata || [];
      const filteredMeta = currentMeta.filter(
        (m) => !['category', 'type'].includes(m.key.toLowerCase())
      );
      const newMeta = category ? [...filteredMeta, { id: 'cat', key: 'category', value: category }] : filteredMeta;
      updateLocalTrialMetadata(targetTrial.id, newMeta);
      return;
    }
    try {
      await setTrialCategory(targetTrial.id, category);
      setTrials((prev) =>
        prev.map((t) => {
          if (t.id !== targetTrial.id) return t;
          const filteredMeta = (t.metadata || []).filter(
            (m) => !['category', 'type'].includes(m.key.toLowerCase())
          );
          return {
            ...t,
            metadata: category ? [...filteredMeta, { id: 'cat', key: 'category', value: category }] : filteredMeta,
          };
        })
      );
      if (activeTrial.id === targetTrial.id) {
        const currentMeta = activeTrial.metadata || [];
        const filteredMeta = currentMeta.filter(
          (m) => !['category', 'type'].includes(m.key.toLowerCase())
        );
        useNotebookStore.setState((s) => ({
          activeTrial: {
            ...s.activeTrial,
            metadata: category ? [...filteredMeta, { id: 'cat', key: 'category', value: category }] : filteredMeta,
          },
        }));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to set category');
    }
  };

  const handleChangeStatus = async (targetTrial: TrialSummaryItem, newStatus: TrialStatus) => {
    if (isGuest || targetTrial.projectId === 'local' || !cloudProjectId) {
      useNotebookStore.getState().updateTrialStatusEverywhere(targetTrial.id, newStatus);
      setTrials((prev) =>
        prev.map((t) => (t.id === targetTrial.id ? { ...t, status: newStatus } : t))
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('inquestra:trial-status-updated', {
            detail: { trialId: targetTrial.id, status: newStatus },
          })
        );
      }
      return;
    }
    try {
      const res = await updateTrialStatus(targetTrial.id, newStatus);
      if (!res.success) {
        alert(res.error || 'Failed to update status');
        return;
      }
      useNotebookStore.getState().updateTrialStatusEverywhere(targetTrial.id, newStatus);
      setTrials((prev) =>
        prev.map((t) => (t.id === targetTrial.id ? { ...t, status: newStatus } : t))
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('inquestra:trial-status-updated', {
            detail: { trialId: targetTrial.id, status: newStatus },
          })
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Real-time optimistic synchronization of the active trial's title, status, metadata
  const displayTrials = useMemo(() => {
    // Prevent flashing stale/guest trial lists before Supabase auth resolves
    if (isAuthenticated === null) {
      return [];
    }
    if (isGuest) {
      const list = localTrials && localTrials.length > 0 ? localTrials : (activeTrial ? [activeTrial] : []);
      return list.map((t) => {
        const isCurrentActive = t.id === activeTrial.id;
        return {
          id: t.id,
          title: isCurrentActive ? (activeTrial.title || t.title) : t.title,
          status: isCurrentActive ? (activeTrial.status || t.status) : t.status,
          metadata: isCurrentActive ? (activeTrial.metadata || t.metadata) : t.metadata,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt || t.createdAt,
          projectId: 'local',
        } as TrialSummaryItem;
      });
    }
    return trials.map((t) => {
      if (t.id === activeTrial.id) {
        return {
          ...t,
          title: activeTrial.title || t.title,
          status: activeTrial.status || t.status,
          metadata: activeTrial.metadata || t.metadata,
        };
      }
      return t;
    });
  }, [isAuthenticated, isGuest, localTrials, trials, activeTrial]);

  // Extract distinct category tags across all trials
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    displayTrials.forEach((t) => {
      const cat = t.metadata?.find(
        (m) => m.key.toLowerCase() === 'category' || m.key.toLowerCase() === 'type'
      )?.value;
      if (cat && cat.trim()) cats.add(cat.trim());
    });
    return Array.from(cats);
  }, [displayTrials]);

  // Multi-dimensional filtering: Search + Status + Category
  const filteredTrials = useMemo(() => {
    return displayTrials.filter((t) => {
      // Status filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        const cat = t.metadata?.find(
          (m) => m.key.toLowerCase() === 'category' || m.key.toLowerCase() === 'type'
        )?.value?.toLowerCase();
        if (cat !== categoryFilter.toLowerCase()) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchStatus = t.status.toLowerCase().includes(q);
        const matchMeta = t.metadata?.some(
          (m) => m.key.toLowerCase().includes(q) || m.value.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchStatus && !matchMeta) return false;
      }

      return true;
    });
  }, [displayTrials, statusFilter, categoryFilter, searchQuery]);

  return (
    <>
      <aside
        className={`bg-background/95 backdrop-blur-md border-r border-border/80 flex flex-col shrink-0 overflow-hidden shadow-2xl transition-all duration-300 ease-in-out fixed inset-y-14 left-0 z-40 lg:static lg:inset-auto lg:h-auto ${
          isLeftSidebarOpen
            ? 'w-[280px] sm:w-[260px] translate-x-0 opacity-100'
            : 'w-0 border-r-0 opacity-0 pointer-events-none -translate-x-full lg:translate-x-0'
        }`}
      >

        {/* ── Project Switcher ──────────────────────────────────────────── */}
        <div className="px-3 py-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-1">
            {isGuest ? (
              <div className="flex-1 flex items-center px-2 py-1.5 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="bg-muted p-1 rounded shrink-0">
                    <FlaskConical className="w-3.5 h-3.5 text-foreground shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm text-foreground font-medium truncate tracking-tight block">
                      Local Notebook
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block leading-none mt-0.5">
                      Stored in this browser
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Switcher button */}
                <button
                  onClick={() => setProjectMenuOpen((v) => !v)}
                  className="flex-1 flex items-center justify-between px-2 py-1.5 rounded hover:bg-accent transition-all duration-200 group min-w-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="bg-muted p-1 rounded shrink-0">
                      <FlaskConical className="w-3.5 h-3.5 text-foreground shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm text-foreground font-medium truncate tracking-tight block">
                        {activeProject?.name ?? 'All Projects'}
                      </span>
                      {activeProject?.lead && (
                        <span className="text-[10px] text-muted-foreground truncate block leading-none mt-0.5">
                          {ROLE_LABEL[activeProject.lead.role]} ·{' '}
                          {activeProject.lead.email?.split('@')?.[0] ?? 'Lead'}
                        </span>
                      )}
                      {activeProject?.code && !activeProject.lead && (
                        <span className="text-[10px] text-muted-foreground font-mono truncate block leading-none mt-0.5">
                          {activeProject.code}
                        </span>
                      )}
                      {!activeProject && (
                        <span className="text-[10px] text-muted-foreground truncate block leading-none mt-0.5">
                          Workspace Overview
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 text-muted-foreground shrink-0 transition-transform duration-200 ${projectMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* New Project button */}
                <button
                  onClick={() => {
                    setProjectMenuOpen(false);
                    setShowNewProjectModal(true);
                  }}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                  title="New project"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Collapse sidebar button */}
            <button
              onClick={toggleLeftSidebar}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
              title="Collapse sidebar (Ctrl+B)"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Project dropdown */}
          {projectMenuOpen && (
            <div className="mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
              {/* All Projects Option */}
              <button
                onClick={() => {
                  handleSelectProject('ALL');
                  setProjectMenuOpen(false);
                }}
                className={`w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-accent transition-colors border-b border-border/30 ${
                  !activeProjectId || activeProjectId === 'ALL' ? 'bg-muted/60' : ''
                }`}
              >
                <FolderOpen
                  className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                    !activeProjectId || activeProjectId === 'ALL' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className={`text-xs font-medium block truncate ${
                      !activeProjectId || activeProjectId === 'ALL' ? 'text-primary font-semibold' : 'text-foreground'
                    }`}
                  >
                    All Projects
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Entire organization workspace
                  </span>
                </div>
              </button>

              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    handleSelectProject(p.id);
                    setProjectMenuOpen(false);
                  }}
                  className={`w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-accent transition-colors border-b border-border/30 last:border-0 ${
                    p.id === activeProjectId ? 'bg-muted/60' : ''
                  }`}
                >
                  <FolderOpen
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      p.id === activeProjectId ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs font-medium block truncate ${
                        p.id === activeProjectId ? 'text-primary font-semibold' : 'text-foreground'
                      }`}
                    >
                      {p.name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.lead && (
                        <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                          <UserIcon className="w-2.5 h-2.5 shrink-0" />
                          {p.lead.email?.split('@')?.[0] ?? 'Lead'}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {p._count.trials} trial{p._count.trials !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Experiments & Trials Section ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground truncate">
                Experiments &amp; Trials
              </span>
              <span className="text-[10px] text-muted-foreground font-mono shrink-0 tabular-nums">
                ({filteredTrials.length})
              </span>
              <button
                type="button"
                onClick={() => setShowInfoPopover((v) => !v)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Why 'Trials'? Click for details on Inquestra's research notebook architecture."
                aria-label="About trials and notebook architecture"
                aria-expanded={showInfoPopover}
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                disabled={isPending}
                className="text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 p-1.5 rounded disabled:opacity-50 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Import trial from trial.json or .zip archive"
                aria-label="Import trial archive"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowTemplateGallery(true)}
                disabled={isPending}
                className="text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 p-1.5 rounded disabled:opacity-50 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="New experiment from template"
                aria-label="New experiment"
              >
                {isPending && !loadingTrialId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Architecture Explainer Popover */}
          {showInfoPopover && (
            <div className="mb-2.5 p-2.5 rounded-lg bg-card border border-border shadow-md text-[11px] text-muted-foreground space-y-1.5 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span className="flex items-center gap-1">
                  <FlaskConical className="w-3.5 h-3.5 text-primary" />
                  What is an Experiment / Trial?
                </span>
                <button
                  type="button"
                  onClick={() => setShowInfoPopover(false)}
                  className="text-muted-foreground hover:text-foreground rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close information popup"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="leading-relaxed">
                In experimental research and laboratory data acquisition, a <strong>trial</strong> is an individual data collection cycle, protocol execution, or telemetry run.
              </p>
              <p className="leading-relaxed">
                In Inquestra, every entry is also a full <strong>Electronic Research Notebook (ERN)</strong> document that tracks rich hypotheses, protocol executions (SOPs), LIMS reagent deductions, telemetry graphs, and 21 CFR Part 11 seals.
              </p>
            </div>
          )}

          {/* Search Input */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search experiments, tags..."
              aria-label="Search experiments and tags"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background/60 border border-border/80 rounded-md pl-7 pr-6 py-1 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary focus-visible:ring-2 focus-visible:ring-ring focus:bg-background transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1.5 text-muted-foreground hover:text-foreground p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Clear search input"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Categorization: Status Filter Segmented Control */}
          <div className="grid grid-cols-4 p-0.5 mb-2.5 bg-muted/50 border border-border/60 rounded-md text-[10px] font-mono">
            {(['ALL', 'ACTIVE', 'DRAFT', 'COMPLETED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`py-1 text-center transition-all rounded-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  statusFilter === st
                    ? 'bg-background text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : st === 'DRAFT' ? 'Draft' : 'Done'}
              </button>
            ))}
          </div>

          {/* Optional Category Filter Dropdown (if tags exist) */}
          {availableCategories.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2 px-1 text-[10px] text-muted-foreground">
              <Tag className="w-3 h-3 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent border-0 text-[10px] text-foreground font-medium focus:outline-none cursor-pointer py-0.5"
              >
                <option value="ALL">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actual trial list */}
          <div className="space-y-1 flex-1 overflow-y-auto">
            {/* Skeleton loaders while auth resolves or on initial empty load */}
            {(isAuthenticated === null || isLoadingTrials) && displayTrials.length === 0 &&
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse shrink-0" />
                  <div
                    className="h-3 rounded bg-muted animate-pulse"
                    style={{ width: `${55 + (i % 3) * 15}%` }}
                  />
                </div>
              ))}

            {filteredTrials.map((t) => {
              const isActive = activeTrial.id === t.id;
              const isLoading = loadingTrialId === t.id;
              const categoryTag = t.metadata?.find(
                (m) => m.key.toLowerCase() === 'category' || m.key.toLowerCase() === 'type'
              )?.value;

              return (
                <div
                  key={t.id}
                  onContextMenu={(e) => handleContextMenu(e, t)}
                  className={`group relative flex items-center justify-between w-full px-2 py-1.5 rounded transition-all duration-200 border ${
                    isActive
                      ? 'bg-neutral-200/80 dark:bg-neutral-800/80 border-border/80 shadow-xs'
                      : 'bg-transparent border-transparent hover:bg-muted/50 hover:border-border/50'
                  }`}
                >
                  <button
                    onClick={() => handleSelectTrial(t.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />
                    ) : (
                      <span
                        title={STATUS_CONFIG[t.status as TrialStatus]?.tooltip || `Status: ${t.status}`}
                        className="relative flex items-center justify-center p-0.5 shrink-0"
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 transition-transform hover:scale-125 ${
                            STATUS_CONFIG[t.status as TrialStatus]?.dotClass || 'bg-muted-foreground'
                          }`}
                        />
                      </span>
                    )}
                    <span
                      className={`text-sm truncate tracking-tight ${
                        isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      {t.title}
                    </span>
                  </button>

                  <div className="flex items-center gap-0.5 shrink-0 ml-1">
                    {categoryTag && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted/90 text-muted-foreground font-mono uppercase tracking-wider hidden sm:inline-block">
                        {categoryTag}
                      </span>
                    )}

                    {/* Cassini-Style Headless Preview Inspector */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTrial(t);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all shrink-0"
                      title="Preview experiment parameters & metadata"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Specialized Actions Context Menu Trigger */}
                    <button
                      onClick={(e) => handleOpenMenuFromButton(e, t)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all shrink-0"
                      title="Experiment menu (Right-click)"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Filtered Empty State */}
            {isAuthenticated !== null && !isLoadingTrials && filteredTrials.length === 0 && displayTrials.length > 0 && (
              <div className="px-2 py-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">No experiments match filter.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setCategoryFilter('ALL');
                  }}
                  className="text-[10px] text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Truly Empty State */}
            {isAuthenticated !== null && !isLoadingTrials && displayTrials.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                No experiments yet. Hit + to start.
              </p>
            )}
          </div>

          {/* Lab & Settings link */}
          <div className="mt-8 border-t border-border/60 pt-4 space-y-1">
            <Link
              href="/app/literature"
              prefetch={true}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 tracking-tight"
            >
              <Quote className="w-3.5 h-3.5 shrink-0" />
              Literature &amp; Citations
            </Link>
            <Link
              href="/app/protocols"
              prefetch={true}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 tracking-tight"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              Protocol Library
            </Link>
            <Link
              href="/app/admin"
              prefetch={true}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 tracking-tight"
            >
              <Settings2 className="w-3.5 h-3.5 shrink-0" />
              Lab &amp; Settings
            </Link>
          </div>
        </div>

        {/* ── Telemetry & DAQ Drawer Trigger ───────────────────────────── */}
        <div className="border-t border-border p-3">
          <button
            onClick={() => useNotebookStore.getState().setRightDrawerMode('TELEMETRY')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card/60 hover:bg-muted text-xs text-foreground transition-all duration-200 group shadow-2xs"
            title="Open Live DAQ Telemetry Drawer"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-foreground" />
              <span className="font-medium text-xs">DAQ Telemetry</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  hardwareStatus.isConnected
                    ? hardwareStatus.isSimulated
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-500 animate-pulse'
                    : 'bg-muted-foreground/30'
                }`}
              />
              <span className="text-[10px] font-mono text-muted-foreground">
                {hardwareStatus.isConnected
                  ? hardwareStatus.isSimulated
                    ? 'Sim'
                    : 'USB'
                  : 'Idle'}
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onCreated={handleProjectCreated}
        />
      )}

      {/* Experiment Template Gallery Modal */}
      <TemplateGalleryModal
        open={showTemplateGallery}
        isCreating={isPending}
        onClose={() => setShowTemplateGallery(false)}
        onSelectTemplate={(template) => handleNewTrial(undefined, template)}
      />

      {/* Trial Re-Import Modal */}
      <ImportTrialModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        isGuest={isGuest}
      />

      {/* Cassini-Style Headless Trial Preview */}
      {previewTrial && (
        <TrialPreviewCard
          trial={previewTrial}
          onClose={() => setPreviewTrial(null)}
          onOpen={() => {
            handleSelectTrial(previewTrial.id);
            setPreviewTrial(null);
          }}
        />
      )}

      {/* Specialized Right-Click & Action Context Menu */}
      {contextMenu && (
        <TrialContextMenu
          trial={contextMenu.trial}
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={true}
          onClose={() => setContextMenu(null)}
          onRename={handleRenameTrial}
          onDuplicate={handleDuplicateTrial}
          onDelete={handleDeleteTrial}
          onSetCategory={handleSetCategory}
          onChangeStatus={handleChangeStatus}
        />
      )}
    </>
  );
}
