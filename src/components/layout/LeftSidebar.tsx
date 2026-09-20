'use client';
// src/components/layout/LeftSidebar.tsx
// Left panel: dynamic project switcher, trial list, hardware controls.

import { useEffect, useState, useTransition, useCallback } from 'react';
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
} from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';
import { SerialControlPanel } from '@/components/hardware/SerialControlPanel';
import { fetchAllTrials, createNewTrial, getTrial } from '@/actions/trialActions';
import { fetchProjectsWithLeads, createProject, fetchLabMembersForLeadSelector } from '@/actions/projectActions';
import type { TrialStatus } from '@/types/inquestra';
import type { ProjectWithLead } from '@/actions/projectActions';
import type { Role } from '@prisma/client';

const STATUS_DOT: Record<TrialStatus, string> = {
  DRAFT: 'bg-neutral-500',
  ACTIVE: 'bg-indigo-400',
  COMPLETED: 'bg-blue-400',
  FAILED: 'bg-red-400',
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
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
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
  const setActiveTrial = useNotebookStore((s) => s.setActiveTrial);

  const [projects, setProjects] = useState<ProjectWithLead[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const [trials, setTrials] = useState<
    { id: string; title: string; status: TrialStatus; updatedAt: Date }[]
  >([]);
  const [isLoadingTrials, setIsLoadingTrials] = useState(true);
  const [loadingTrialId, setLoadingTrialId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
  }, []);

  // Load trials whenever active project changes
  const loadTrials = useCallback(() => {
    setIsLoadingTrials(true);
    fetchAllTrials()
      .then((ts) => setTrials(ts as typeof trials))
      .catch(console.error)
      .finally(() => setIsLoadingTrials(false));
  }, []);

  useEffect(() => {
    loadTrials();
  }, [loadTrials]);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const handleNewTrial = () => {
    startTransition(async () => {
      try {
        const newTrial = await createNewTrial();
        setTrials((prev) => [newTrial as typeof trials[0], ...prev]);
        // Normalise Prisma Date objects → ISO strings for the store
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
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleSelectTrial = (id: string) => {
    if (loadingTrialId === id) return;
    const localTrial = trials.find((t) => t.id === id);
    if (localTrial) {
      setActiveTrial({
        id: localTrial.id,
        title: localTrial.title,
        content: { type: 'doc', content: [] },
        status: localTrial.status as import('@/types/inquestra').TrialStatus,
        metadata: [],
        createdAt: '',
        updatedAt: localTrial.updatedAt instanceof Date ? localTrial.updatedAt.toISOString() : String(localTrial.updatedAt),
      });
    }
    setLoadingTrialId(id);
    startTransition(async () => {
      try {
        const fullTrial = await getTrial(id);
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
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTrialId(null);
      }
    });
  };

  const handleProjectCreated = (newProject: ProjectWithLead) => {
    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setShowNewProjectModal(false);
  };

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
                <div className="bg-indigo-500/20 p-1 rounded shrink-0">
                  <FlaskConical className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm text-foreground font-medium truncate tracking-tight block">
                    {activeProject?.name ?? 'Select Project'}
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
          {projectMenuOpen && projects.length > 0 && (
            <div className="mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProjectId(p.id);
                    setProjectMenuOpen(false);
                  }}
                  className={`w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-accent transition-colors border-b border-border/30 last:border-0 ${
                    p.id === activeProjectId ? 'bg-indigo-500/5' : ''
                  }`}
                >
                  <FolderOpen
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      p.id === activeProjectId ? 'text-indigo-400' : 'text-muted-foreground'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs font-medium block truncate ${
                        p.id === activeProjectId ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground'
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

        {/* ── Trial List ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Trials
              </span>
            </div>
            <button
              onClick={handleNewTrial}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 p-1 rounded disabled:opacity-50"
              title="New trial"
            >
              {isPending && !loadingTrialId ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="space-y-1">
            {/* Skeleton loaders while trials fetch */}
            {isLoadingTrials &&
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse shrink-0" />
                  <div
                    className="h-3 rounded bg-muted animate-pulse"
                    style={{ width: `${55 + (i % 3) * 15}%` }}
                  />
                </div>
              ))}

            {/* Actual trial list */}
            {!isLoadingTrials &&
              trials.map((t) => {
                const isActive = activeTrial.id === t.id;
                const isLoading = loadingTrialId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTrial(t.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all duration-200 border ${
                      isActive
                        ? 'bg-neutral-200/80 dark:bg-neutral-800/80 border-border/80 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-muted/50 hover:border-border/50'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 text-indigo-400 animate-spin shrink-0" />
                    ) : (
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[t.status as TrialStatus]}`}
                      />
                    )}
                    <span
                      className={`text-sm truncate flex-1 tracking-tight ${
                        isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      {t.title}
                    </span>
                  </button>
                );
              })}

            {/* Empty state */}
            {!isLoadingTrials && trials.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                No trials yet. Hit + to start.
              </p>
            )}
          </div>

          {/* Lab & Settings link */}
          <div className="mt-8 border-t border-border/60 pt-4">
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
    </>
  );
}
