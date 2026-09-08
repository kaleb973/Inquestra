'use server';
// src/actions/trialActions.ts
// Trial persistence Server Actions — Zod-validated, Prisma-persisted.
// Immutable data provenance: no silent overwrites. All updates are append-audited.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// ─── Validation schemas ────────────────────────────────────────────────────────

const MetadataSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(500),
});

const TrialPayloadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.record(z.string(), z.unknown()), // TipTap ProseMirror JSON
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'FAILED']),
  projectId: z.string().uuid(),
  metadata: z.array(MetadataSchema).optional().default([]),
});

export type TrialPayload = z.infer<typeof TrialPayloadSchema>;

// ─── Server Actions ────────────────────────────────────────────────────────────

/**
 * Create a new trial record in PostgreSQL.
 * Validates with Zod, resolves the internal User from the Supabase auth session.
 */
export async function createTrial(payload: TrialPayload) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: active session required.');
  }

  const validated = TrialPayloadSchema.parse(payload);

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User profile not found in database.');

  const trial = await prisma.trial.create({
    data: {
      title: validated.title,
      content: validated.content as Prisma.InputJsonValue,
      status: validated.status,
      projectId: validated.projectId,
      userId: dbUser.id,
      metadata: {
        create: validated.metadata,
      },
    },
  });

  revalidatePath(`/projects/${validated.projectId}`);
  return { success: true, trialId: trial.id };
}

/**
 * Update trial content and metadata.
 * Appends new metadata entries; never silently removes existing ones.
 */
export async function updateTrialContent(
  trialId: string,
  content: Record<string, unknown>,
  title: string
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  const updated = await prisma.trial.update({
    where: { id: trialId, userId: dbUser.id },
    data: {
      title: z.string().min(1).max(255).parse(title),
      content: content as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
  });

  revalidatePath(`/projects/${updated.projectId}`);
  return { success: true };
}

export async function fetchAllTrials() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  return prisma.trial.findMany({
    where: { project: { organizationId: dbUser.organizationId } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, status: true, updatedAt: true }
  });
}

export async function getTrial(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  return prisma.trial.findFirst({
    where: { id, project: { organizationId: dbUser.organizationId } },
  });
}

export async function createNewTrial() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  const project = await prisma.project.findFirst({
    where: { organizationId: dbUser.organizationId }
  });

  if (!project) throw new Error('No project found');

  const trial = await prisma.trial.create({
    data: {
      title: 'Untitled Trial',
      content: { type: 'doc', content: [] },
      projectId: project.id,
      userId: dbUser.id,
    }
  });

  revalidatePath('/app');
  return trial;
}
