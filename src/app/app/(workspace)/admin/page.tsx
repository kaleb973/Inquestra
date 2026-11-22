import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { AdminTabs } from '@/components/admin/AdminTabs';

interface AdminPageProps {
  searchParams?: Promise<{ tab?: string; id?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = searchParams ? await searchParams : {};
  const initialTab = params.tab;
  const targetId = params.id;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/app/login');

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { organization: true },
  });

  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'PI')) {
    redirect('/app');
  }

  // Fetch all data in parallel — lean projections only for fast response.
  const [
    orgUsers,
    projectsWithLeads,
    trialCount,
    inventory,
    equipment,
    auditLogs,
    teams,
    storageLocations,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: dbUser.organizationId },
      select: {
        id: true,
        email: true,
        role: true,
        teamId: true,
        organizationId: true,
        authId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.findMany({
      where: { organizationId: dbUser.organizationId },
      include: {
        lead: { select: { id: true, email: true, role: true } },
        _count: { select: { trials: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.trial.count({
      where: { project: { organizationId: dbUser.organizationId } },
    }),
    prisma.inventoryItem.findMany({
      where: { organizationId: dbUser.organizationId },
      include: { location: { select: { name: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.equipment.findMany({
      where: { organizationId: dbUser.organizationId },
      orderBy: { name: 'asc' },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: dbUser.organizationId },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.team.findMany({
      where: { organizationId: dbUser.organizationId },
      include: {
        members: {
          select: {
            id: true,
            email: true,
            role: true,
            teamId: true,
            organizationId: true,
            authId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.storageLocation.findMany({
      where: { organizationId: dbUser.organizationId },
      include: { children: true, items: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    }),
  ]);

  const inventoryAlerts = inventory.filter((i) => i.quantity < i.thresholdValue).length;

  return (
    <AdminTabs
      orgName={dbUser.organization.name}
      org={dbUser.organization}
      orgUsers={orgUsers as Parameters<typeof AdminTabs>[0]['orgUsers']}
      projectsWithLeads={projectsWithLeads as Parameters<typeof AdminTabs>[0]['projectsWithLeads']}
      trials={trialCount}
      inventory={inventory}
      equipment={equipment}
      auditLogs={auditLogs as Parameters<typeof AdminTabs>[0]['auditLogs']}
      teams={teams as Parameters<typeof AdminTabs>[0]['teams']}
      inventoryAlerts={inventoryAlerts}
      storageLocations={storageLocations as Parameters<typeof AdminTabs>[0]['storageLocations']}
      currentUser={{ id: dbUser.id, email: dbUser.email, role: dbUser.role }}
      initialTab={initialTab}
      targetId={targetId}
    />
  );
}
