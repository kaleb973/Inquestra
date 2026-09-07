import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { Shield, Users, FlaskConical, AlertTriangle, Box, Wrench } from 'lucide-react';
import { InventoryManager } from '@/components/admin/InventoryManager';
import { EquipmentManager } from '@/components/admin/EquipmentManager';
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

  const [orgUsers, projects, trials, inventory, equipment] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: dbUser.organizationId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.findMany({
      where: { organizationId: dbUser.organizationId },
      include: { _count: { select: { trials: true } } },
    }),
    prisma.trial.count({
      where: { project: { organizationId: dbUser.organizationId } },
    }),
    prisma.inventory.findMany({
      where: { organizationId: dbUser.organizationId },
      orderBy: { chemical: 'asc' },
    }),
    prisma.equipment.findMany({
      where: { organizationId: dbUser.organizationId },
      orderBy: { name: 'asc' },
    }),
  ]);

  const inventoryAlerts = inventory.filter(i => i.alertFlag).length;

  const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'text-red-400 bg-red-950/40 border-red-900',
    PI: 'text-purple-400 bg-purple-950/40 border-purple-900',
    RESEARCHER: 'text-emerald-400 bg-emerald-950/40 border-emerald-900',
    VIEWER: 'text-neutral-400 bg-neutral-800 border-neutral-700',
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Shield className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <Box className="w-4 h-4" /> },
    { id: 'equipment', label: 'Equipment', icon: <Wrench className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 p-8 overflow-y-auto h-full w-full relative z-0">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-white text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-neutral-500 text-sm">{dbUser.organization.name}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-neutral-800 mb-8">
          {tabs.map(t => (
            <Link
              key={t.id}
              href={`/admin?tab=${t.id}`}
              className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id ? 'border-purple-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
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
                  className={`bg-neutral-900 border rounded-lg p-4 ${
                    stat.alert ? 'border-amber-900' : 'border-neutral-800'
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-2 ${stat.alert ? 'text-amber-400' : 'text-neutral-400'}`}>
                    {stat.icon}
                    <span className="text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-8">
              {/* Team table */}
              <div className="col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-neutral-800">
                  <h2 className="text-sm font-semibold text-white">Team Members</h2>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/50">
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgUsers.map((u) => (
                      <tr key={u.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
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
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden h-fit">
                <div className="px-5 py-3 border-b border-neutral-800">
                  <h2 className="text-sm font-semibold text-white">Projects</h2>
                </div>
                <div className="divide-y divide-neutral-800/50">
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-neutral-200">{p.name}</span>
                      <span className="text-xs text-neutral-500 font-mono">{p._count.trials} trials</span>
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

        {tab === 'inventory' && <InventoryManager items={inventory} />}
        {tab === 'equipment' && <EquipmentManager items={equipment} />}
      </div>
    </div>
  );
}
