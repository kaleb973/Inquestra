'use client';
// src/components/layout/LeftSidebar.tsx
// Left panel: dynamic project switcher, trial list, hardware controls.

import { useEffect, useState, useTransition, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  ChevronDown,
  Plus,
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
} from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';
import { SerialControlPanel } from '@/components/hardware/SerialControlPanel';
import {
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

interface StatusConfig {
  dotClass: string;
  badgeClass: string;
  label: string;
  tooltip: string;
}

const STATUS_CONFIG: Record<TrialStatus, StatusConfig> = {
  DRAFT: {
    dotClass: 'bg-muted-foreground/60',
    badgeClass: 'bg-muted text-muted-foreground',
    label: 'Draft',
    tooltip: 'Lifecycle: Draft (Protocol setup / in planning)',
  },
  ACTIVE: {
    dotClass: 'bg-sky-500 ring-2 ring-sky-500/20 shadow-[0_0_6px_rgba(14,165,233,0.4)]',
    badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30',
    label: 'Active',
    tooltip: 'Lifecycle: Active (Live telemetry acquisition / execution in progress)',
  },
  IN_REVIEW: {
    dotClass: 'bg-amber-500 ring-2 ring-amber-500/20 shadow-[0_0_6px_rgba(245,158,11,0.4)]',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    label: 'In Review',
    tooltip: 'Lifecycle: In Review (Pending peer or QA verification)',
  },
  COMPLETED: {
    dotClass: 'bg-emerald-500 ring-2 ring-emerald-500/20 shadow-[0_0_6px_rgba(16,185,129,0.4)]',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    label: 'Completed',
    tooltip: 'Lifecycle: Completed (Acquisition finished & cryptographically sealed)',
  },
  FAILED: {
    dotClass: 'bg-red-500 ring-2 ring-red-500/20 shadow-[0_0_6px_rgba(239,68,68,0.4)]',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30',
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
            <FolderOpen className="w-4 h-4 text-indigo-500" />
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
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
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
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
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
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
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
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
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
  const activeTrial = useNotebookStore((s) => s.activeTrial);
  const cloudTrialId = useNotebookStore((s) => s.cloudTrialId);
  const setActiveTrial = useNotebookStore((s) => s.setActiveTrial);
  const setCloudIds = useNotebookStore((s) => s.setCloudIds);
  const setIsLoadingTrial = useNotebookStore((s) => s.setIsLoadingTrial);

  const [projects, setProjects] = useState<ProjectWithLead[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  type StatusFilter = 'ALL' | 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'FAILED';

  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const [trials, setTrials] = useState<TrialSummaryItem[]>([]);
  const [previewTrial, setPreviewTrial] = useState<TrialSummaryItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    trial: TrialSummaryItem;
    x: number;
    y: number;
  } | null>(null);
  const [isLoadingTrials, setIsLoadingTrials] = useState(true);
  const [loadingTrialId, setLoadingTrialId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showInfoPopover, setShowInfoPopover] = useState(false);

  const requestSeqRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const loadingTrialIdRef = useRef<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    fetchProjectsWithLeads()
      .then((ps) => {
        setProjects(ps);
        if (ps.length > 0 && !activeProjectId) {
          setActiveProjectId(ps[0].id);
        }
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectTrial = useCallback((id: string) => {
    if (loadingTrialIdRef.current === id) return;

    const currentSeq = ++requestSeqRef.current;
    loadingTrialIdRef.current = id;
    setLoadingTrialId(id);
    setIsLoadingTrial(true);

    startTransition(async () => {
      try {
        const fullTrial = await getTrial(id);
        // Ignore stale responses if the user clicked another trial in the meantime
        if (requestSeqRef.current !== currentSeq) return;

        if (fullTrial) {
          setActiveTrial({
            id: fullTrial.id,
            title: fullTrial.title,
            content: (fullTrial.content ?? { type: 'doc', content: [] }) as Record<string, unknown>,
            status: fullTrial.status as import('@/types/inquestra').TrialStatus,
            metadata: (fullTrial.metadata ?? []) as import('@/types/inquestra').MetadataEntry[],
            createdAt: fullTrial.createdAt instanceof Date ? fullTrial.createdAt.toISOString() : String(fullTrial.createdAt),
            updatedAt: fullTrial.updatedAt instanceof Date ? fullTrial.updatedAt.toISOString() : String(fullTrial.updatedAt),
            checksum: fullTrial.checksum ?? null,
            sealedAt: fullTrial.sealedAt instanceof Date ? fullTrial.sealedAt.toISOString() : (fullTrial.sealedAt ?? null),
            sealedBy: fullTrial.sealedBy ?? null,
          });

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
  }, [setActiveTrial, setCloudIds, setIsLoadingTrial]);

  const handleSelectTrialRef = useRef(handleSelectTrial);
  useEffect(() => {
    handleSelectTrialRef.current = handleSelectTrial;
  }, [handleSelectTrial]);

  const trialsRef = useRef<TrialSummaryItem[]>([]);
  useEffect(() => {
    trialsRef.current = trials;
  }, [trials]);

  // Load trials whenever active project changes
  const loadTrials = useCallback(async (projectIdToLoad?: string | null) => {
    // Only show full skeleton loader on initial cold load
    if (trialsRef.current.length === 0) {
      setIsLoadingTrials(true);
    }
    try {
      const ts = await fetchAllTrials(projectIdToLoad);
      const trialList = ts as unknown as TrialSummaryItem[];
      setTrials(trialList);

      // Auto-hydrate the latest cloud trial on initial load if user has existing trials
      if (!hasInitializedRef.current && trialList.length > 0) {
        hasInitializedRef.current = true;
        const currentCloudTrialId = useNotebookStore.getState().cloudTrialId;
        const targetTrial = (currentCloudTrialId && trialList.find((t) => t.id === currentCloudTrialId)) || trialList[0];
        if (targetTrial) {
          handleSelectTrialRef.current(targetTrial.id);
        }
      }
    } catch (err) {
      console.error('Failed to load trials:', err);
    } finally {
      setIsLoadingTrials(false);
    }
  }, []);

  useEffect(() => {
    loadTrials(activeProjectId);
  }, [activeProjectId, loadTrials]);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const handleNewTrial = (cat?: string) => {
    startTransition(async () => {
      try {
        setIsLoadingTrial(true);
        const newTrial = await createNewTrial(activeProjectId, cat);
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
        console.error('Failed to create new trial:', err);
      } finally {
        setIsLoadingTrial(false);
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
    try {
      await deleteTrial(targetTrial.id);
      setTrials((prev) => prev.filter((t) => t.id !== targetTrial.id));
      if (activeTrial.id === targetTrial.id) {
        const remaining = trials.filter((t) => t.id !== targetTrial.id);
        if (remaining.length > 0) {
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
    try {
      await updateTrialStatus(targetTrial.id, newStatus);
      setTrials((prev) =>
        prev.map((t) => (t.id === targetTrial.id ? { ...t, status: newStatus } : t))
      );
      if (activeTrial.id === targetTrial.id) {
        useNotebookStore.setState((s) => ({
          activeTrial: { ...s.activeTrial, status: newStatus },
        }));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Real-time optimistic synchronization of the active trial's title, status, metadata
  const displayTrials = useMemo(() => {
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
  }, [trials, activeTrial.id, activeTrial.title, activeTrial.status, activeTrial.metadata]);

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
      <aside className="w-[260px] bg-background/80 backdrop-blur-md border-r border-border/80 flex flex-col shrink-0 overflow-hidden shadow-2xl">

        {/* ── Project Switcher ──────────────────────────────────────────── */}
        <div className="px-3 py-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-1">
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
                      {activeProject.lead.email.split('@')[0]}
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
          </div>

          {/* Project dropdown */}
          {projectMenuOpen && (
            <div className="mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
              {/* All Projects Option */}
              <button
                onClick={() => {
                  setActiveProjectId(null);
                  setProjectMenuOpen(false);
                }}
                className={`w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-accent transition-colors border-b border-border/30 ${
                  !activeProjectId ? 'bg-muted/60' : ''
                }`}
              >
                <FolderOpen
                  className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                    !activeProjectId ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className={`text-xs font-medium block truncate ${
                      !activeProjectId ? 'text-primary font-semibold' : 'text-foreground'
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
                    setActiveProjectId(p.id);
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
                          {p.lead.email.split('@')[0]}
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
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-mono shrink-0">
                {filteredTrials.length}
              </span>
              <button
                onClick={() => setShowInfoPopover((v) => !v)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                title="Why 'Trials'? Click for details on Inquestra's BME DAQ + ELN architecture."
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={() => handleNewTrial()}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 p-1 rounded disabled:opacity-50 shrink-0"
              title="New experiment"
            >
              {isPending && !loadingTrialId ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
            </button>
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
                  onClick={() => setShowInfoPopover(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="leading-relaxed">
                In Biomedical Engineering (BME) and DAQ, a <strong>trial</strong> is an individual data collection cycle or telemetry run.
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background/60 border border-border/80 rounded-md pl-7 pr-6 py-1 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1.5 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Categorization: Status Filter Pills */}
          <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 scrollbar-none text-[10px]">
            {(['ALL', 'ACTIVE', 'DRAFT', 'COMPLETED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded-full border transition-colors shrink-0 font-medium ${
                  statusFilter === st
                    ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
                    : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-accent hover:text-foreground'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : st === 'DRAFT' ? 'Draft' : 'Completed'}
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
            {/* Skeleton loaders only on initial empty load */}
            {isLoadingTrials && trials.length === 0 &&
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
                      <Loader2 className="w-3 h-3 text-indigo-400 animate-spin shrink-0" />
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
            {!isLoadingTrials && filteredTrials.length === 0 && trials.length > 0 && (
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
            {!isLoadingTrials && trials.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                No experiments yet. Hit + to start.
              </p>
            )}
          </div>

          {/* Lab & Settings link */}
          <div className="mt-8 border-t border-border/60 pt-4 space-y-1">
            <Link
              href="/app/literature"
              className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 tracking-tight"
            >
              <Quote className="w-3.5 h-3.5 shrink-0" />
              Literature &amp; Citations
            </Link>
            <Link
              href="/app/protocols"
              className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 tracking-tight"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              Protocol Library
            </Link>
            <Link
              href="/app/admin"
              className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 tracking-tight"
            >
              <Settings2 className="w-3.5 h-3.5 shrink-0" />
              Lab &amp; Settings
            </Link>
          </div>
        </div>

        {/* ── Hardware Controls ─────────────────────────────────────────── */}
        <div className="border-t border-border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Hardware
            </span>
          </div>
          <SerialControlPanel />
        </div>
      </aside>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onCreated={handleProjectCreated}
        />
      )}

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
