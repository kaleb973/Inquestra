import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { LiteratureLibrary, type SavedPaperItem } from '@/components/literature/LiteratureLibrary';

export const metadata = {
  title: 'Literature & Citations | Inquestra',
  description: 'Biomedical literature discovery, peer-reviewed citations, and open-access research library.',
};

export default async function LiteraturePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/app/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: {
      role: true,
      organizationId: true,
      organization: { select: { name: true } },
    },
  });

  if (!dbUser) {
    redirect('/app');
  }

  // Fetch all saved literature papers for this organization
  const papers = await prisma.researchPaper.findMany({
    where: { organizationId: dbUser.organizationId },
    include: {
      trials: {
        select: {
          id: true,
          trialId: true,
          notes: true,
          trial: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <LiteratureLibrary
      initialPapers={papers as unknown as SavedPaperItem[]}
      orgName={dbUser.organization.name}
      currentUserRole={dbUser.role}
    />
  );
}
