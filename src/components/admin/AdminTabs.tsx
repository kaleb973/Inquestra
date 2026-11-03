'use client';
// src/components/admin/AdminTabs.tsx
// "Lab Operations & Settings" — role-adaptive command center.
// Tab switching is instant (no server round-trip).

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Box,
  Wrench,
  ClipboardList,
  Settings2,
  LayoutDashboard,
  FlaskConical,
  AlertTriangle,
  BookOpen,
  FolderOpen,
  User as UserIcon,
  Plus,
  Shield,
  CheckCircle2,
  Archive,
  Loader2,
} from 'lucide-react';
import { InventoryManager } from '@/components/admin/InventoryManager';
import { StorageManager } from '@/components/admin/StorageManager';
import { EquipmentManager } from '@/components/admin/EquipmentManager';
import { LabSettings } from '@/components/admin/LabSettings';
import { TeamManager } from '@/components/admin/TeamManager';
import { ProtocolLibrary } from '@/components/protocols/ProtocolLibrary';
import { updateProjectLead, updateProjectStatus } from '@/actions/projectActions';
import type {
  InventoryItem,
  Equipment,
  Organization,
  User,
  AuditLog,
  Team,
  StorageLocation,
  Role,
} from '@prisma/client';

type TabId = 'overview' | 'projects' | 'protocols' | 'inventory' | 'equipment' | 'teams' | 'audit' | 'settings';

type ProjectWithLead = {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  status: string;
  organizationId: string;
  leadId: string | null;
  lead: { id: string; email: string; role: Role } | null;
  _count: { trials: number };
  createdAt: Date;
  updatedAt: Date;
};

interface AdminTabsProps {
  orgName: string;
  org: Organization;
  orgUsers: (User & { createdAt: Date })[];
  projectsWithLeads: ProjectWithLead[];
  trials: number;
  inventory: (InventoryItem & { location: { name: string } | null })[];
  equipment: Equipment[];
  auditLogs: (AuditLog & { user: { email: string } })[];
  teams: (Team & { members: User[] })[];
  inventoryAlerts: number;
  storageLocations: (StorageLocation & {
    children: StorageLocation[];
    items: { id: string; name: string }[];
  })[];
  currentUser?: { id: string; email: string; role: Role };
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'text-foreground bg-muted border-border',
  PI: 'text-foreground bg-muted border-violet-500/30',
  RESEARCHER: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/30',
  VIEWER: 'text-muted-foreground bg-muted border-border',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  COMPLETED: 'text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/30',
  ARCHIVED: 'text-muted-foreground bg-muted border-border',
};

// ─── Projects & PIs Tab ────────────────────────────────────────────────────────

function ProjectsTab({
  projects,
  orgUsers,
  currentUser,
}: {
  projects: ProjectWithLead[];
  orgUsers: (User & { createdAt: Date })[];
  currentUser?: { id: string; email: string; role: Role };
}) {
  const canManage = currentUser?.role === 'PI' || currentUser?.role === 'ADMIN';
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [localProjects, setLocalProjects] = useState(projects);
  const [statusPending, setStatusPending] = useState<string | null>(null);

  const handleLeadChange = (projectId: string) => {
    startTransition(async () => {
      const result = await updateProjectLead(projectId, selectedLeadId || null);
      if (result.success) {
        const newLead = orgUsers.find((u) => u.id === selectedLeadId) ?? null;
        setLocalProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, leadId: selectedLeadId || null, lead: newLead ? { id: newLead.id, email: newLead.email, role: newLead.role } : null }
              : p
          )
        );
        setEditingLeadId(null);
        setSelectedLeadId('');
      }
    });
  };

  const handleStatusChange = (projectId: string, status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED') => {
    setStatusPending(projectId);
    startTransition(async () => {
      const result = await updateProjectStatus(projectId, status);
      if (result.success) {
        setLocalProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, status } : p))
        );
      }
      setStatusPending(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Research Projects</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each project has a designated Principal Investigator (PI) / Lead Scientist.
          </p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted border border-border rounded-lg px-3 py-1.5">
          {localProjects.length} project{localProjects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {localProjects.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <FolderOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No projects yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create one from the sidebar — use the project switcher at the top left.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {localProjects.map((project) => (
            <div
              key={project.id}
              className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:border-border/80 transition-colors"
            >
              <div className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1 p-1.5 rounded-lg bg-muted border border-border/60 shrink-0">
                    <FolderOpen className="w-3.5 h-3.5 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
                      {project.code && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5">
                          {project.code}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_COLORS[project.status] ?? STATUS_COLORS['ACTIVE']}`}
                      >
                        {project.status}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {project._count.trials} trial{project._count.trials !== 1 ? 's' : ''} ·{' '}
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Status actions (PI/Admin only) */}
                {canManage && project.status === 'ACTIVE' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStatusChange(project.id, 'COMPLETED')}
                      disabled={statusPending === project.id}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                    >
                      {statusPending === project.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                      Complete
                    </button>
                    <button
                      onClick={() => handleStatusChange(project.id, 'ARCHIVED')}
                      disabled={statusPending === project.id}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-border text-muted-foreground bg-muted hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      <Archive className="w-2.5 h-2.5" />
                      Archive
                    </button>
                  </div>
                )}
                {canManage && project.status !== 'ACTIVE' && (
                  <button
                    onClick={() => handleStatusChange(project.id, 'ACTIVE')}
                    disabled={statusPending === project.id}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 shrink-0"
                  >
                    Reactivate
                  </button>
                )}
              </div>

              {/* Lead assignment row */}
              <div className="border-t border-border/50 bg-muted/20 px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">Project PI / Lead</span>
                  {project.lead ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-foreground">
                      <UserIcon className="w-3 h-3 text-muted-foreground" />
                      {project.lead?.email?.split('@')?.[0] ?? 'Lead'}
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ml-1 ${ROLE_COLORS[project.lead.role] ?? ROLE_COLORS['VIEWER']}`}>
                        {project.lead.role}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Unassigned</span>
                  )}
                </div>

                {canManage && (
                  <div>
                    {editingLeadId === project.id ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={selectedLeadId}
                          onChange={(e) => setSelectedLeadId(e.target.value)}
                          className="text-xs px-2 py-1 rounded border border-border bg-background text-foreground focus:outline-none focus:border-primary/60"
                        >
                          <option value="">— Remove lead —</option>
                          {orgUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.email?.split('@')?.[0] ?? 'User'} ({u.role})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleLeadChange(project.id)}
                          disabled={isPending}
                          className="text-[10px] px-2 py-1 rounded bg-foreground text-background hover:bg-foreground/90 font-medium transition-colors disabled:opacity-50"
                        >
                          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                        </button>
                        <button
                          onClick={() => { setEditingLeadId(null); setSelectedLeadId(''); }}
                          className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingLeadId(project.id);
                          setSelectedLeadId(project.lead?.id ?? '');
                        }}
                        className="text-[10px] text-muted-foreground hover:text-indigo-600 dark:hover:text-muted-foreground transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        {project.lead ? 'Reassign' : 'Assign Lead'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main AdminTabs Component ──────────────────────────────────────────────────

export function AdminTabs({
  orgName,
  org,
  orgUsers,
  projectsWithLeads,
  trials,
  inventory,
  equipment,
  auditLogs,
  teams,
  inventoryAlerts,
  storageLocations,
  currentUser,
}: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',  label: 'Overview',   icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'projects',  label: 'Projects',   icon: <FolderOpen className="w-3.5 h-3.5" /> },
    { id: 'protocols', label: 'Protocols',  icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'inventory', label: 'Inventory',  icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'equipment', label: 'Equipment',  icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'teams',     label: 'Teams',      icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'audit',     label: 'Audit Logs', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { id: 'settings',  label: 'Settings',   icon: <Settings2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-background overflow-y-auto h-full w-full">
      {/* Top nav bar */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-8 py-0">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb + title row */}
          <div className="flex items-center gap-4 pt-5 pb-3">
            <Link
              href="/app"
              prefetch={true}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Notebook
            </Link>
            <span className="text-border">|</span>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-foreground text-sm font-semibold leading-none">{orgName}</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                  Lab Operations &amp; Settings
                </p>
              </div>
              {currentUser && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    ROLE_COLORS[currentUser.role] ?? ROLE_COLORS['VIEWER']
                  }`}
                >
                  {currentUser.role === 'PI' ? '★ ' : ''}{currentUser.role}
                </span>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === t.id
                    ? 'border-primary text-foreground font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {t.icon}
                {t.label}
                {t.id === 'inventory' && inventoryAlerts > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {inventoryAlerts}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-8 py-8">

        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Team Members',
                  value: orgUsers.length,
                  icon: <Users className="w-4 h-4" />,
                  onClick: () => setActiveTab('teams'),
                  alert: false,
                },
                {
                  label: 'Projects',
                  value: projectsWithLeads.length,
                  icon: <FolderOpen className="w-4 h-4" />,
                  onClick: () => setActiveTab('projects'),
                  alert: false,
                },
                {
                  label: 'Total Trials',
                  value: trials,
                  icon: <BookOpen className="w-4 h-4" />,
                  onClick: undefined,
                  alert: false,
                },
                {
                  label: 'Low Stock Alerts',
                  value: inventoryAlerts,
                  icon: <AlertTriangle className="w-4 h-4" />,
                  onClick: () => setActiveTab('inventory'),
                  alert: inventoryAlerts > 0,
                },
              ].map((stat) => (
                <button
                  key={stat.label}
                  onClick={stat.onClick}
                  disabled={!stat.onClick}
                  className={`text-left bg-card border rounded-xl p-4 flex flex-col gap-2 shadow-sm transition-colors ${
                    stat.alert
                      ? 'border-amber-500/40 hover:border-amber-500/70'
                      : stat.onClick
                      ? 'border-border hover:border-border cursor-pointer'
                      : 'border-border cursor-default'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 text-xs font-medium ${
                      stat.alert ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                    }`}
                  >
                    {stat.icon}
                    {stat.label}
                  </div>
                  <p className="text-3xl font-bold text-foreground tabular-nums">{stat.value}</p>
                </button>
              ))}
            </div>

            {/* Team + Projects */}
            <div className="grid grid-cols-3 gap-6">
              {/* Team table */}
              <div className="col-span-2 bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/40">
                  <h2 className="text-sm font-semibold text-foreground">Team Members</h2>
                  <button
                    onClick={() => setActiveTab('teams')}
                    className="text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-muted-foreground transition-colors"
                  >
                    Manage →
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                      <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                        <td className="px-5 py-3 text-sm text-foreground font-mono">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${ROLE_COLORS[u.role] ?? ROLE_COLORS['VIEWER']}`}>
                            {u.role === 'PI' ? '★ ' : ''}{u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground font-mono">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Projects quick view */}
              <div className="bg-card border border-border rounded-xl overflow-hidden h-fit shadow-sm">
                <div className="px-5 py-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Projects</h2>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-muted-foreground transition-colors"
                  >
                    Manage →
                  </button>
                </div>
                <div className="divide-y divide-border/40">
                  {projectsWithLeads.map((p) => (
                    <div key={p.id} className="flex items-start justify-between px-5 py-3 gap-2">
                      <div className="min-w-0">
                        <span className="text-sm text-foreground font-medium truncate block">{p.name}</span>
                        {p.lead && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <UserIcon className="w-2.5 h-2.5 shrink-0" />
                            {p.lead?.email?.split('@')?.[0] ?? 'Lead'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">
                        {p._count.trials}
                      </span>
                    </div>
                  ))}
                  {projectsWithLeads.length === 0 && (
                    <p className="px-5 py-5 text-sm text-muted-foreground">No projects yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Manage Inventory', desc: `${inventory.length} reagents tracked`, tab: 'inventory' as TabId, icon: <Box className="w-5 h-5 text-foreground" /> },
                { label: 'Equipment Calibration', desc: `${equipment.length} instruments registered`, tab: 'equipment' as TabId, icon: <Wrench className="w-5 h-5 text-foreground" /> },
                { label: 'Audit Logs', desc: `${auditLogs.length} recent events`, tab: 'audit' as TabId, icon: <ClipboardList className="w-5 h-5 text-foreground" /> },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.tab)}
                  className="text-left bg-card border border-border hover:border-border rounded-xl p-4 flex items-start gap-3 transition-colors group shadow-sm"
                >
                  <div className="mt-0.5 p-2 rounded-lg bg-muted border border-border/60 group-hover:bg-primary/90/20 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── PROJECTS ─────────────────────────────────────────────── */}
        {activeTab === 'projects' && (
          <ProjectsTab
            projects={projectsWithLeads}
            orgUsers={orgUsers}
            currentUser={currentUser}
          />
        )}

        {/* ── PROTOCOLS ────────────────────────────────────────────── */}
        {activeTab === 'protocols' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <ProtocolLibrary
              currentUserRole={currentUser?.role ?? 'VIEWER'}
              onEditProtocol={(_id) => {
                window.location.href = '/app/protocols';
              }}
            />
          </div>
        )}

        {/* ── INVENTORY ────────────────────────────────────────────── */}
        {activeTab === 'inventory' && (
          <div className="space-y-8">
            <InventoryManager items={inventory} locations={storageLocations} />
            <StorageManager locations={storageLocations} />
          </div>
        )}

        {/* ── EQUIPMENT ────────────────────────────────────────────── */}
        {activeTab === 'equipment' && <EquipmentManager items={equipment} />}

        {/* ── TEAMS ────────────────────────────────────────────────── */}
        {activeTab === 'teams' && (
          <TeamManager
            teams={teams}
            orgUsers={orgUsers}
            currentUser={currentUser}
            organizationName={orgName}
          />
        )}

        {/* ── AUDIT LOGS ───────────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border bg-muted/40">
              <h2 className="text-sm font-semibold text-foreground">Audit Log</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Immutable chronological ledger of all lab activity.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {['Timestamp', 'User', 'Action', 'Details'].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-sm text-foreground">{log.user.email}</td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-border bg-muted text-foreground font-mono whitespace-nowrap">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground max-w-xs truncate">
                        {typeof log.details === 'object' && log.details !== null
                          ? ((log.details as Record<string, unknown>).message as string) ?? JSON.stringify(log.details)
                          : String(log.details ?? '')}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No audit events yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SETTINGS ─────────────────────────────────────────────── */}
        {activeTab === 'settings' && <LabSettings org={org} />}
      </div>
    </div>
  );
}
