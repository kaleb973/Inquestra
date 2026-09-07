'use server';
// src/actions/syncActions.ts
// Cloud sync Server Action — creates a default project + trial on first save,
// then updates on subsequent saves. Stores cloud IDs client-side in Zustand.

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface SyncPayload {
  title: string;
  content: Record<string, unknown>;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  metadata: { key: string; value: string }[];
  cloudTrialId?: string;   // undefined on first save
  cloudProjectId?: string; // undefined on first save
}

export interface SyncResult {
  success: boolean;
  cloudTrialId?: string;
  cloudProjectId?: string;
  error?: string;
}

export async function syncTrialToCloud(payload: SyncPayload): Promise<SyncResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Please sign in first to sync to cloud.' };
    }

    // Resolve internal DB user
    let dbUser = await prisma.user.findUnique({ where: { authId: user.id } });

    // Auto-provision: create Organization + User record on first cloud sync
    if (!dbUser) {
      const org = await prisma.organization.create({
        data: { name: `${user.email?.split('@')[0] ?? 'Lab'}'s Organization` },
      });
      dbUser = await prisma.user.create({
        data: {
          authId: user.id,
          email: user.email ?? '',
          role: 'PI',
          organizationId: org.id,
        },
      });
    }

    let cloudProjectId = payload.cloudProjectId;

    // Auto-provision default project on first sync
    if (!cloudProjectId) {
      const defaultProject = await prisma.project.findFirst({
        where: { organizationId: dbUser.organizationId, name: 'Default Project' },
      });
      if (defaultProject) {
        cloudProjectId = defaultProject.id;
      } else {
        const created = await prisma.project.create({
          data: {
            name: 'Default Project',
            description: 'Auto-created on first cloud sync.',
            organizationId: dbUser.organizationId,
          },
        });
        cloudProjectId = created.id;
      }
    }

    const contentValue = payload.content as Prisma.InputJsonValue;

    // Create or update
    if (payload.cloudTrialId) {
      await prisma.trial.update({
        where: { id: payload.cloudTrialId, userId: dbUser.id },
        data: {
          title: payload.title,
          content: contentValue,
          status: payload.status,
          updatedAt: new Date(),
        },
      });
      revalidatePath(`/projects/${cloudProjectId}`);
      return { success: true, cloudTrialId: payload.cloudTrialId, cloudProjectId };
    } else {
      const trial = await prisma.trial.create({
        data: {
          title: payload.title,
          content: contentValue,
          status: payload.status,
          projectId: cloudProjectId,
          userId: dbUser.id,
          metadata: {
            create: payload.metadata,
          },
        },
      });
      revalidatePath(`/projects/${cloudProjectId}`);
      return { success: true, cloudTrialId: trial.id, cloudProjectId };
    }
  } catch (err) {
    console.error('syncTrialToCloud error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Database sync failed.',
    };
  }
}
