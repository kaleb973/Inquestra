'use server';
// src/actions/syncActions.ts
// Cloud sync Server Action — creates a default project + trial on first save,
// then updates on subsequent saves. Stores cloud IDs client-side in Zustand.

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { saveTrial } from '@/actions/trialActions';
import { sanitizeTipTapAST } from '@/lib/security/trialImportSanitizer';
import DOMPurify from 'isomorphic-dompurify';

interface SyncPayload {
  title: string;
  content: Record<string, unknown>;
  status: 'DRAFT' | 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED' | 'FAILED';
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

    if (dbUser.role === 'VIEWER') {
      return { success: false, error: 'Permission denied: viewers cannot sync or create cloud trials.' };
    }

    if (payload.status === 'COMPLETED') {
      return {
        success: false,
        error: 'Trials can only reach COMPLETED status through cryptographic sealing.',
      };
    }

    let cloudProjectId = payload.cloudProjectId;

    // Verify tenant boundary for existing project or auto-provision default project
    if (cloudProjectId) {
      const existingProject = await prisma.project.findFirst({
        where: { id: cloudProjectId, organizationId: dbUser.organizationId },
      });
      if (!existingProject) {
        return { success: false, error: 'Project not found or access denied.' };
      }
    } else {
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

    const cleanTitle = DOMPurify.sanitize(payload.title?.trim() || 'Untitled Trial', { ALLOWED_TAGS: [] }).slice(0, 255);

    const sanitizedAst =
      typeof payload.content === 'object' && payload.content !== null
        ? sanitizeTipTapAST(payload.content)
        : null;
    const cleanDoc = sanitizedAst ?? { type: 'doc', content: [] };
    const contentValue = cleanDoc as Prisma.InputJsonValue;

    // Create or update
    if (payload.cloudTrialId) {
      const saveResult = await saveTrial({
        trialId: payload.cloudTrialId,
        title: cleanTitle,
        content: cleanDoc,
        status: payload.status,
        metadata: payload.metadata,
        createRevision: true,
        revisionNote: 'Manual cloud sync',
      });

      if (!saveResult.success) {
        return { success: false, error: saveResult.error };
      }

      revalidatePath('/app');
      return { success: true, cloudTrialId: payload.cloudTrialId, cloudProjectId };
    } else {
      const trial = await prisma.trial.create({
        data: {
          title: cleanTitle,
          content: contentValue,
          status: payload.status,
          projectId: cloudProjectId,
          userId: dbUser.id,
          metadata: {
            create: (payload.metadata || [])
              .filter((m) => m.key.trim().length > 0 && m.value.trim().length > 0)
              .map((m) => ({
                key: DOMPurify.sanitize(m.key.trim(), { ALLOWED_TAGS: [] }).slice(0, 100),
                value: DOMPurify.sanitize(m.value.trim(), { ALLOWED_TAGS: [] }).slice(0, 500),
              })),
          },
        },
      });

      // Initial revision snapshot
      await prisma.trialRevision.create({
        data: {
          trialId: trial.id,
          title: cleanTitle,
          content: contentValue,
          savedById: dbUser.id,
          note: 'Initial cloud sync',
        },
      });

      revalidatePath('/app');
      return { success: true, cloudTrialId: trial.id, cloudProjectId };
    }
  } catch (err) {
    console.error('syncTrialToCloud error:', err);
    return {
      success: false,
      error: 'Database sync failed.',
    };
  }
}
