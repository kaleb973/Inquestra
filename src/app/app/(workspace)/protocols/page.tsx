// src/app/app/(workspace)/protocols/page.tsx
// Protocol & SOP Library — full-page view.
// Pre-fetches organization protocols directly on the server for instant zero-latency loading.

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { ProtocolManager } from '@/components/protocols/ProtocolManager';
import type { ProtocolSummary } from '@/components/protocols/ProtocolLibrary';

export const metadata = {
  title: 'Protocol & SOP Library | Inquestra',
  description: 'Standard Operating Procedures, lab protocols, and verified assay templates.',
};

export default async function ProtocolsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/app/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { organization: true },
  });

  if (!dbUser) {
    redirect('/app');
  }

  // Pre-fetch all protocol templates on the server in a single fast query
  const rawProtocols = await prisma.protocolTemplate.findMany({
    where: { organizationId: dbUser.organizationId },
    orderBy: [{ isPublished: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      name: true,
      description: true,
      version: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <ProtocolManager
      initialProtocols={rawProtocols as unknown as ProtocolSummary[]}
      orgName={dbUser.organization.name}
      currentUserRole={dbUser.role}
    />
  );
}
