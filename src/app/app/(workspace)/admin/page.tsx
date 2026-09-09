import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { Shield, Users, FlaskConical, AlertTriangle, Box, Wrench, ClipboardList } from 'lucide-react';
import { InventoryManager } from '@/components/admin/InventoryManager';
import { EquipmentManager } from '@/components/admin/EquipmentManager';
import { LabSettings } from '@/components/admin/LabSettings';
import Link from 'next/link';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { organization: true },
  });

  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'PI')) {
    redirect('/');
  }

  const { tab = 'overview' } = await searchParams;

  // Optimised conditional data fetching for 4-6s delay fix
  let orgUsers: any[] = [];
  let projects: any[] = [];
  let trials = 0;
  let inventory: any[] = [];
  let equipment: any[] = [];
  let auditLogs: any[] = [];
  let teams: any[] = [];
  let inventoryAlerts = 0;

  if (tab === 'overview') {
    let inventoryAlertsCount: number;
    [orgUsers, projects, trials, inventoryAlertsCount] = await Promise.all([
      prisma.user.findMany({ where: { organizationId: dbUser.organizationId }, orderBy: { createdAt: 'desc' } }),
      prisma.project.findMany({ where: { organizationId: dbUser.organizationId }, include: { _count: { select: { trials: true } } } }),
      prisma.trial.count({ where: { project: { organizationId: dbUser.organizationId } } }),
      prisma.inventory.count({ where: { organizationId: dbUser.organizationId, alertFlag: true } }),
    ]);
    inventoryAlerts = inventoryAlertsCount;
  } else if (tab === 'inventory') {
    inventory = await prisma.inventory.findMany({ where: { organizationId: dbUser.organizationId }, orderBy: { chemical: 'asc' } });
  } else if (tab === 'equipment') {
    equipment = await prisma.equipment.findMany({ where: { organizationId: dbUser.organizationId }, orderBy: { name: 'asc' } });
  } else if (tab === 'audit') {
    auditLogs = await prisma.auditLog.findMany({ where: { organizationId: dbUser.organizationId }, include: { user: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  } else if (tab === 'teams') {
    teams = await prisma.team.findMany({ where: { organizationId: dbUser.organizationId }, include: { members: true }, orderBy: { name: 'asc' } });
  }

  const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'text-red-400 bg-red-950/40 border-red-900',
    PI: 'text-purple-400 bg-purple-950/40 border-purple-900',
    RESEARCHER: 'text-emerald-400 bg-emerald-950/40 border-emerald-900',
    VIEWER: 'text-muted-foreground bg-neutral-800 border-border',
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Shield className="w-4 h-4" /> },
    { id: 'teams', label: 'Teams', icon: <Users className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <Box className="w-4 h-4" /> },
    { id: 'equipment', label: 'Equipment', icon: <Wrench className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Logs', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background p-8 overflow-y-auto h-full w-full relative z-0">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-white text-2xl font-bold">Lab Management Suite</h1>
            <p className="text-muted-foreground text-sm">{dbUser.organization.name} • 21 CFR Part 11 Compliant Environment</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-8">
          {tabs.map(t => (
            <Link
              key={t.id}
              href={`/app/admin?tab=${t.id}`}
              className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id ? 'border-purple-500 text-white' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </Link>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'overview' && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Team Members', value: orgUsers.length, icon: <Users className="w-4 h-4" /> },
                { label: 'Projects', value: projects.length, icon: <FlaskConical className="w-4 h-4" /> },
                { label: 'Total Trials', value: trials, icon: <FlaskConical className="w-4 h-4" /> },
                { label: 'Inventory Alerts', value: inventoryAlerts, icon: <AlertTriangle className="w-4 h-4" />, alert: inventoryAlerts > 0 },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-muted border rounded-lg p-4 ${
                    stat.alert ? 'border-amber-900' : 'border-border'
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-2 ${stat.alert ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    {stat.icon}
                    <span className="text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-8">
              {/* Team table */}
              <div className="col-span-2 bg-muted border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h2 className="text-sm font-semibold text-white">Team Members</h2>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-background/50">
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-neutral-800/30 transition-colors">
                        <td className="px-5 py-3 text-sm text-neutral-200 font-mono">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${ROLE_COLORS[u.role]}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-neutral-600 font-mono">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Projects overview */}
              <div className="bg-muted border border-border rounded-lg overflow-hidden h-fit">
                <div className="px-5 py-3 border-b border-border">
                  <h2 className="text-sm font-semibold text-white">Projects</h2>
                </div>
                <div className="divide-y divide-neutral-800/50">
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-neutral-200">{p.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{p._count.trials} trials</span>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <p className="px-5 py-4 text-sm text-neutral-700">No projects yet.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'teams' && (
          <div className="bg-muted border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="text-sm font-semibold text-white">Lab Teams</h2>
                <p className="text-xs text-muted-foreground mt-1">Organize scientists and restrict access to trial data.</p>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
                <Users className="w-3.5 h-3.5" />
                Create Team
              </button>
            </div>
            <div className="divide-y divide-border">
              {teams.map((t) => (
                <div key={t.id} className="p-5 flex justify-between items-start hover:bg-background/50 transition-colors">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{t.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{t.description || 'No description provided.'}</p>
                    <div className="mt-3 flex -space-x-2">
                      {t.members.map((m: any, i: number) => (
                        <div key={m.id} className="w-6 h-6 rounded-full bg-primary border-2 border-muted flex items-center justify-center text-[8px] font-bold text-primary-foreground" title={m.email}>
                          {m.email.substring(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {t.members.length === 0 && <span className="text-xs text-muted-foreground">No members</span>}
                    </div>
                  </div>
                  <button className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">Manage</button>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No teams created yet.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'inventory' && <InventoryManager items={inventory} />}
        {tab === 'equipment' && <EquipmentManager items={equipment} />}
        {tab === 'settings' && <LabSettings org={dbUser.organization} />}
        {tab === 'audit' && (
          <div className="bg-muted border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="text-sm font-semibold text-white">System Audit Logs</h2>
                <p className="text-xs text-muted-foreground mt-1">Immutable chronological ledger of organization activity.</p>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-neutral-800/30 transition-colors">
                    <td className="px-5 py-3 text-xs text-muted-foreground font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-200">{log.user.email}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-border bg-neutral-800 text-foreground">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{log.details}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
