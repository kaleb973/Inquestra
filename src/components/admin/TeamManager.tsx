'use client';
// src/components/admin/TeamManager.tsx
// Unified Lab Squads, Granular Role Management, & Authorizations Inbox ("Ask Higher-Up").
// Enforces hierarchical RBAC (PI > Admin > Researcher > Viewer) and audit-logged squad allocation.

import { useState, useTransition, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  Search,
  Check,
  X,
  AlertCircle,
  Loader2,
  Trash2,
  UserCheck,
  UserPlus,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import type { Team, User, Role } from '@prisma/client';
import {
  createTeam,
  updateTeam,
  deleteTeam,
  assignUserToTeam,
  updateUserRole,
  fetchPendingAuthorizationRequests,
  resolveAuthorizationRequest,
  submitAuthorizationRequest,
  type AuthorizationRequest,
} from '@/actions/adminActions';
import { createInviteLink } from '@/actions/inviteActions';
import { LabClearanceDossier, type ClearanceProfile } from '@/components/admin/LabClearanceDossier';

interface TeamWithMembers extends Team {
  members: User[];
}

interface UserWithTeam extends User {
  team?: { id: string; name: string } | null;
}

interface TeamManagerProps {
  teams: TeamWithMembers[];
  orgUsers: UserWithTeam[];
  currentUser?: { id: string; email: string; role: Role };
  organizationName: string;
}

const ROLE_BADGES: Record<Role, { label: string; badgeClass: string; level: number }> = {
  PI: { label: 'Principal Investigator', badgeClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30', level: 4 },
  ADMIN: { label: 'Lab Operations Manager', badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30', level: 3 },
  RESEARCHER: { label: 'Bench Researcher', badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30', level: 2 },
  VIEWER: { label: 'Audit Observer', badgeClass: 'bg-muted text-muted-foreground border-border', level: 1 },
};

export function TeamManager({ teams, orgUsers, currentUser, organizationName }: TeamManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'squads' | 'roster' | 'authorizations'>('squads');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals state
  const [showCreateSquadModal, setShowCreateSquadModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingSquad, setEditingSquad] = useState<TeamWithMembers | null>(null);
  const [dossierUser, setDossierUser] = useState<ClearanceProfile | null>(null);
  const [showManualEscalateModal, setShowManualEscalateModal] = useState(false);

  // Authorizations state
  const [authRequests, setAuthRequests] = useState<AuthorizationRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Transitions
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load pending authorizations
  const loadAuthorizations = async () => {
    setLoadingRequests(true);
    const res = await fetchPendingAuthorizationRequests();
    if (res.success && res.requests) {
      setAuthRequests(res.requests);
    }
    setLoadingRequests(false);
  };

  useEffect(() => {
    loadAuthorizations();
  }, []);

  const pendingCount = authRequests.filter((r) => r.status === 'PENDING').length;
  const isPI = currentUser?.role === 'PI';

  // --- Handlers ---
  const handleCreateSquad = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createTeam(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create squad.');
      } else {
        setShowCreateSquadModal(false);
        setSuccessMsg('Research squad created successfully.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  const handleUpdateSquadMetadata = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSquad) return;
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const desc = formData.get('description') as string;

    startTransition(async () => {
      const res = await updateTeam(editingSquad.id, name, desc);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update squad.');
      } else {
        setSuccessMsg('Squad metadata updated.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  const handleToggleMemberSquad = (userId: string, currentTeamId: string | null) => {
    if (!editingSquad) return;
    const newTeamId = currentTeamId === editingSquad.id ? null : editingSquad.id;

    startTransition(async () => {
      const res = await assignUserToTeam(userId, newTeamId);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update squad member.');
      }
    });
  };

  const handleDeleteSquad = (teamId: string) => {
    if (!confirm('Are you sure you want to disband this squad? Members will be safely unassigned to the general lab pool.')) {
      return;
    }

    startTransition(async () => {
      const res = await deleteTeam(teamId);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to delete squad.');
      } else {
        setEditingSquad(null);
        setSuccessMsg('Squad disbanded.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  const handleAssignUserSquad = (userId: string, newTeamId: string) => {
    startTransition(async () => {
      const targetTeamId = newTeamId === 'UNASSIGNED' ? null : newTeamId;
      const res = await assignUserToTeam(userId, targetTeamId);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to reassign squad.');
      }
    });
  };

  const handleRoleChange = (userId: string, newRole: Role) => {
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole);
      if (!res.success) {
        setErrorMsg(res.error || 'Role elevation denied.');
      } else {
        setSuccessMsg('Member role updated.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  const handleResolveAuth = (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    startTransition(async () => {
      const res = await resolveAuthorizationRequest(requestId, decision);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to resolve request.');
      } else {
        await loadAuthorizations();
        setSuccessMsg(`Request marked as ${decision}.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  // Filtered users for roster
  const filteredUsers = orgUsers.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-950/40 text-red-400 border border-red-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-indigo-950/40 text-indigo-300 border border-indigo-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="bg-muted/60 border border-border rounded-xl p-1.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('squads')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'squads'
                ? 'bg-background text-foreground shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            Research Squads ({teams.length})
          </button>

          <button
            onClick={() => setActiveSubTab('roster')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'roster'
                ? 'bg-background text-foreground shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-500" />
            Lab Personnel & RBAC ({orgUsers.length})
          </button>

          <button
            onClick={() => setActiveSubTab('authorizations')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'authorizations'
                ? 'bg-background text-foreground shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            Authorizations Inbox
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-600 text-white font-bold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {activeSubTab === 'squads' && (
          <button
            onClick={() => setShowCreateSquadModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Research Squad
          </button>
        )}
      </div>

      {/* ── 1. SQUADS GRID ─────────────────────────────────────────── */}
      {activeSubTab === 'squads' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t) => (
              <div
                key={t.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-colors shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground tracking-tight">{t.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {t.description || 'No mission statement provided.'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shrink-0">
                      {t.members.length} {t.members.length === 1 ? 'Scientist' : 'Scientists'}
                    </span>
                  </div>

                  {/* Members Avatars Stack */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex -space-x-2 overflow-hidden">
                      {t.members.map((m) => (
                        <div
                          key={m.id}
                          className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-card flex items-center justify-center text-[9px] font-mono font-bold text-white shadow"
                          title={`${m.email} (${m.role})`}
                        >
                          {m.email.substring(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {t.members.length === 0 && (
                        <span className="text-xs text-muted-foreground">No scientists assigned</span>
                      )}
                    </div>

                    <button
                      onClick={() => setEditingSquad(t)}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                    >
                      Manage Squad →
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {teams.length === 0 && (
              <div className="col-span-full p-12 text-center rounded-xl bg-card border border-border shadow-sm">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-medium text-foreground">No Research Squads Created</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Organize your laboratory into dedicated squads (e.g. Tissue Engineering Core, Electrophysiology) to streamline trial tracking.
                </p>
                <button
                  onClick={() => setShowCreateSquadModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Squad
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 2. LAB PERSONNEL & RBAC ROSTER ─────────────────────────── */}
      {activeSubTab === 'roster' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {/* Filter Bar */}
          <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/30">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search personnel by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-muted-foreground">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-indigo-500 shadow-sm"
              >
                <option value="ALL">All Roles</option>
                <option value="PI">Principal Investigator</option>
                <option value="ADMIN">Lab Operations Manager</option>
                <option value="RESEARCHER">Bench Researcher</option>
                <option value="VIEWER">Audit Observer</option>
              </select>

              {(currentUser?.role === 'PI' || currentUser?.role === 'ADMIN') && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite Researcher
                </button>
              )}
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-mono text-[10px] uppercase">
                  <th className="py-3 px-4">Scientist</th>
                  <th className="py-3 px-4">Clearance / Role</th>
                  <th className="py-3 px-4">Assigned Squad</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filteredUsers.map((u) => {
                  const badge = ROLE_BADGES[u.role] || ROLE_BADGES.VIEWER;
                  const currentTeam = teams.find((t) => t.id === u.teamId);

                  return (
                    <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-neutral-800 border border-indigo-200 dark:border-neutral-700 flex items-center justify-center font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            {u.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{u.email}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              ID: {u.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${badge.badgeClass}`}>
                            LVL {badge.level} · {u.role}
                          </span>
                          {/* Role Selector */}
                          <select
                            value={u.role}
                            disabled={isPending || (!isPI && (u.role === 'PI'))}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                            className="text-[11px] bg-background border border-border rounded px-2 py-0.5 text-foreground focus:outline-none focus:border-indigo-500 disabled:opacity-50 shadow-sm"
                            title={!isPI ? 'Only a PI can elevate or demote PI roles' : 'Change role'}
                          >
                            <option value="VIEWER">Viewer (Lvl 1)</option>
                            <option value="RESEARCHER">Researcher (Lvl 2)</option>
                            <option value="ADMIN">Admin (Lvl 3)</option>
                            <option value="PI" disabled={!isPI}>
                              PI (Lvl 4) {!isPI ? '[Locked - PI sign-off needed]' : ''}
                            </option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={u.teamId || 'UNASSIGNED'}
                          disabled={isPending}
                          onChange={(e) => handleAssignUserSquad(u.id, e.target.value)}
                          className="text-xs bg-background border border-border rounded px-2.5 py-1 text-foreground focus:outline-none focus:border-indigo-500 shadow-sm"
                        >
                          <option value="UNASSIGNED">General Lab Pool (Unassigned)</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            setDossierUser({
                              id: u.id,
                              email: u.email,
                              role: u.role,
                              orgName: organizationName,
                              squadName: currentTeam?.name || null,
                            })
                          }
                          className="px-2.5 py-1 rounded bg-muted hover:bg-accent text-foreground text-xs font-medium border border-border transition-colors shadow-sm"
                        >
                          Inspect Clearance
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                      No personnel match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 3. AUTHORIZATIONS INBOX ("ASK HIGHER-UP") ───────────────── */}
      {activeSubTab === 'authorizations' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm space-y-0">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Authorizations & Escalation Inbox</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permission elevations and operational overrides submitted by bench scientists.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowManualEscalateModal(true)}
                className="px-3 py-1.5 rounded text-xs font-medium bg-muted hover:bg-accent text-foreground border border-border transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3 h-3" />
                Submit Test Escalation
              </button>
              <button
                onClick={loadAuthorizations}
                disabled={loadingRequests}
                className="px-3 py-1.5 rounded text-xs font-medium bg-muted hover:bg-accent text-foreground border border-border transition-colors shadow-sm"
              >
                {loadingRequests ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="divide-y divide-border">
            {authRequests.map((req) => {
              const isPendingReq = req.status === 'PENDING';
              return (
                <div
                  key={req.id}
                  className={`p-5 transition-colors ${
                    isPendingReq ? 'bg-indigo-50/50 dark:bg-indigo-950/10 hover:bg-indigo-50 dark:hover:bg-indigo-950/20' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            isPendingReq
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : req.status === 'APPROVED'
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                              : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                          }`}
                        >
                          {req.status}
                        </span>

                        <span className="text-xs font-semibold text-foreground font-mono">
                          {req.requestType.replace('_', ' ')}
                        </span>

                        {req.requestedRole && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-300 font-mono">
                            → Target: {req.requestedRole}
                          </span>
                        )}

                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(req.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{req.requesterEmail}</span> (Current Role:{' '}
                        <span className="font-mono text-muted-foreground">{req.requesterRole}</span>)
                      </div>

                      <div className="p-3 rounded-lg bg-background border border-border text-xs text-foreground max-w-2xl shadow-sm">
                        <span className="text-muted-foreground font-mono text-[10px] uppercase block mb-0.5">
                          Operational Justification:
                        </span>
                        &ldquo;{req.justification}&rdquo;
                      </div>

                      {req.resolvedBy && (
                        <div className="text-[11px] text-muted-foreground font-mono">
                          Resolved by {req.resolvedBy} on {new Date(req.resolvedAt || '').toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {isPendingReq && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleResolveAuth(req.requestId, 'APPROVED')}
                          disabled={isPending}
                          className="px-3.5 py-1.5 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleResolveAuth(req.requestId, 'REJECTED')}
                          disabled={isPending}
                          className="px-3.5 py-1.5 rounded text-xs font-medium bg-muted hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/60 dark:hover:text-red-300 text-foreground border border-border transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <X className="w-3.5 h-3.5" />
                          Deny
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {authRequests.length === 0 && !loadingRequests && (
              <div className="p-12 text-center text-muted-foreground text-xs">
                No authorization requests or escalations logged.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE SQUAD MODAL ──────────────────────────────────────── */}
      {showCreateSquadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-foreground">Create Research Squad</h3>
              </div>
              <button
                onClick={() => setShowCreateSquadModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSquad} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Squad Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Electrophysiology Core"
                  className="w-full px-3 py-2 rounded bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Mission / Focus Area</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="e.g. High-throughput neural impedance sensing and microfluidic patch clamping."
                  className="w-full px-3 py-2 rounded bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateSquadModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MANAGE SQUAD MODAL (MEMBER CHECKLIST + EDIT) ───────────── */}
      {editingSquad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-card border border-border rounded-xl p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Manage Squad: {editingSquad.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update squad metadata and toggle scientist roster assignments.
                </p>
              </div>
              <button onClick={() => setEditingSquad(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Squad Details Form */}
            <form onSubmit={handleUpdateSquadMetadata} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Squad Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingSquad.name}
                  required
                  className="w-full px-3 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Mission Statement</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingSquad.description || ''}
                  className="w-full px-3 py-1.5 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-muted hover:bg-accent text-foreground border border-border shadow-sm"
                >
                  Save Metadata
                </button>
              </div>
            </form>

            {/* Squad Member Toggle Checklist */}
            <div className="space-y-2 pt-3 border-t border-border">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                Squad Roster Members
              </label>
              <div className="divide-y divide-border border border-border rounded-lg max-h-48 overflow-y-auto bg-muted/20">
                {orgUsers.map((u) => {
                  const isMember = u.teamId === editingSquad.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleToggleMemberSquad(u.id, u.teamId)}
                      className="p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isMember
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'border-border bg-background'
                          }`}
                        >
                          {isMember && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-foreground">{u.email}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">Role: {u.role}</div>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-muted-foreground">
                        {isMember ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Assigned</span>
                        ) : u.teamId ? (
                          'Other Squad'
                        ) : (
                          'Unassigned'
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Disband Squad Safeguard */}
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleDeleteSquad(editingSquad.id)}
                disabled={isPending}
                className="px-3 py-1.5 rounded text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Disband Squad
              </button>

              <button
                type="button"
                onClick={() => setEditingSquad(null)}
                className="px-4 py-1.5 rounded text-xs font-medium bg-muted hover:bg-accent text-foreground border border-border shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANUAL ESCALATION SUBMISSION MODAL ──────────────────────── */}
      {showManualEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-foreground">Ask Higher-Up: Escalation</h3>
              </div>
              <button
                onClick={() => setShowManualEscalateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const reqType = formData.get('requestType') as any;
                const reqRole = formData.get('requestedRole') as any;
                const just = formData.get('justification') as string;

                startTransition(async () => {
                  const res = await submitAuthorizationRequest({
                    requestType: reqType,
                    requestedRole: reqRole ? (reqRole as Role) : null,
                    justification: just,
                  });
                  if (!res.success) {
                    setErrorMsg(res.error || 'Failed to submit request.');
                  } else {
                    setShowManualEscalateModal(false);
                    loadAuthorizations();
                    setSuccessMsg('Authorization request submitted to PI inbox.');
                    setTimeout(() => setSuccessMsg(null), 3000);
                  }
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Request Type</label>
                <select
                  name="requestType"
                  className="w-full px-3 py-2 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-indigo-500 shadow-sm"
                >
                  <option value="ROLE_ELEVATION">Role Elevation</option>
                  <option value="OVERDRAFT_OVERRIDE">Reagent Overdraft Override</option>
                  <option value="TRIAL_SEAL_OVERRIDE">Trial Seal Sign-off</option>
                  <option value="CUSTOM">Custom Operational Escalation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Target Role (If applicable)</label>
                <select
                  name="requestedRole"
                  className="w-full px-3 py-2 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-indigo-500 shadow-sm"
                >
                  <option value="RESEARCHER">Bench Researcher (Lvl 2)</option>
                  <option value="ADMIN">Lab Operations Manager (Lvl 3)</option>
                  <option value="PI">Principal Investigator (Lvl 4)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Justification</label>
                <textarea
                  name="justification"
                  required
                  rows={3}
                  placeholder="Explain why this authorization is necessary for research continuity..."
                  className="w-full px-3 py-2 rounded bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowManualEscalateModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LAB CLEARANCE DOSSIER MODAL ────────────────────────────── */}
      {dossierUser && (
        <LabClearanceDossier
          user={dossierUser}
          isOpen={!!dossierUser}
          onClose={() => setDossierUser(null)}
          currentUserRole={currentUser?.role}
          onRequestSubmitted={loadAuthorizations}
        />
      )}

      {/* ── INVITE MODAL ─────────────────────────────────────────── */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}

// ─── Inline Invite Modal Component ─────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState<Role>('RESEARCHER');
  const [expiry, setExpiry] = useState<number>(72); // hours
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createInviteLink(role, expiry);
      if (res.success) {
        setLink(res.url);
      } else {
        setError(res.error);
      }
    });
  };

  const handleCopy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-foreground">Invite Lab Member</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded">
            {error}
          </div>
        )}

        {!link ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Clearance Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-2 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-indigo-500 shadow-sm"
              >
                <option value="RESEARCHER">Bench Researcher (Standard)</option>
                <option value="VIEWER">Audit Observer (Read-only)</option>
                <option value="ADMIN">Lab Operations Manager</option>
                <option value="PI">Principal Investigator</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Link Expiry</label>
              <select
                value={expiry}
                onChange={(e) => setExpiry(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-indigo-500 shadow-sm"
              >
                <option value={24}>24 Hours</option>
                <option value={72}>72 Hours</option>
                <option value={168}>7 Days</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 rounded text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                Generate Secure Link
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Copy this secure, one-time link and send it to the new member. They will be automatically assigned the <strong>{role}</strong> role upon joining.
            </p>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={link} 
                className="w-full px-3 py-2 rounded bg-muted text-xs font-mono text-muted-foreground border border-border outline-none" 
              />
              <button 
                onClick={handleCopy}
                className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold whitespace-nowrap transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
