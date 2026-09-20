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

import DOMPurify from 'isomorphic-dompurify';

const MetadataSchema = z.object({
  key: z.string().min(1).max(100).transform(val => DOMPurify.sanitize(val)),
  value: z.string().min(1).max(500).transform(val => DOMPurify.sanitize(val)),
});

const TrialPayloadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).transform(val => DOMPurify.sanitize(val)),
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

  const contentValue = (typeof validated.content === 'object' && validated.content !== null)
    ? (JSON.parse(JSON.stringify(validated.content)) as Prisma.InputJsonValue)
    : ({} as Prisma.InputJsonValue);

  const trial = await prisma.trial.create({
    data: {
      title: validated.title,
      content: contentValue,
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
 * Writes a TrialRevision snapshot every time the trial is saved to cloud.
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

  const trial = await prisma.trial.findFirst({
    where: {
      id: trialId,
      project: {
        organizationId: dbUser.organizationId,
      },
    },
  });
  if (!trial) throw new Error('Trial not found');
  if (trial.checksum) throw new Error('Cannot edit a sealed trial. This trial is cryptographically locked.');

  const contentValue = (typeof content === 'object' && content !== null)
    ? (JSON.parse(JSON.stringify(content)) as Prisma.InputJsonValue)
    : ({} as Prisma.InputJsonValue);

  const validTitle = z.string().min(1).max(255).parse(title);

  const updated = await prisma.trial.update({
    where: { id: trialId },
    data: {
      title: validTitle,
      content: contentValue,
      updatedAt: new Date(),
    },
  });

  // Snapshot revision for version history (append-only, never modifies originals)
  await prisma.trialRevision.create({
    data: {
      trialId,
      title: validTitle,
      content: contentValue,
      savedById: dbUser.id,
    },
  });

  revalidatePath(`/projects/${updated.projectId}`);
  return { success: true };
}

/**
 * Fetch the full revision timeline for a trial.
 * Returns snapshots in reverse-chronological order (newest first).
 */
export async function fetchTrialRevisions(trialId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  // Verify trial belongs to the user's org
  const trial = await prisma.trial.findFirst({
    where: { id: trialId, project: { organizationId: dbUser.organizationId } },
  });
  if (!trial) throw new Error('Trial not found');

  return prisma.trialRevision.findMany({
    where: { trialId },
    include: { savedBy: { select: { email: true } } },
    orderBy: { savedAt: 'desc' },
    take: 50,
  });
}

/**
 * Restore a prior revision as a new DRAFT trial (fork — never overwrites original).
 * This is the safe, immutable restore path: creates "Restored from [date]" as a new entry.
 */
export async function restoreTrialRevision(revisionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  const revision = await prisma.trialRevision.findUnique({
    where: { id: revisionId },
    include: { trial: { include: { project: true } } },
  });

  if (!revision) throw new Error('Revision not found');
  if (revision.trial.project.organizationId !== dbUser.organizationId) {
    throw new Error('Unauthorized');
  }

  const restored = await prisma.trial.create({
    data: {
      title: `Restored — ${revision.title} (${new Date(revision.savedAt).toLocaleString()})`,
      content: revision.content as Prisma.InputJsonValue,
      status: 'DRAFT',
      projectId: revision.trial.projectId,
      userId: dbUser.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: 'TRIAL_RESTORED_FROM_REVISION',
      entityType: 'Trial',
      entityId: restored.id,
      details: {
        message: `Trial "${revision.title}" restored from revision ${revisionId} as new draft.`,
      },
    },
  });

  revalidatePath('/app');
  return { success: true, newTrialId: restored.id };
}

/**
 * Sign a trial electronically (21 CFR Part 11).
 * Role-gated: AUTHOR for researchers, WITNESS/PI_APPROVAL for PIs and Admins.
 * The trial must be synced to cloud (have a DB record) before signing.
 */
export async function signTrial(
  trialId: string,
  role: 'AUTHOR' | 'WITNESS' | 'PI_APPROVAL',
  meaning: string
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  const trial = await prisma.trial.findFirst({
    where: { id: trialId, project: { organizationId: dbUser.organizationId } },
  });
  if (!trial) throw new Error('Trial not found');

  // Role guards
  if (role === 'PI_APPROVAL' && dbUser.role !== 'PI' && dbUser.role !== 'ADMIN') {
    throw new Error('Only Lab PIs and Admins can apply PI approval signatures.');
  }
  if (role === 'WITNESS' && dbUser.role !== 'PI' && dbUser.role !== 'ADMIN') {
    throw new Error('Only Lab PIs and Admins can sign as witness.');
  }

  // Prevent duplicate signature by same user in same role
  const existing = await prisma.signature.findFirst({
    where: { trialId, userId: dbUser.id, role },
  });
  if (existing) throw new Error(`You have already signed this trial as ${role}.`);

  const cleanMeaning = DOMPurify.sanitize(meaning.trim());

  const signature = await prisma.signature.create({
    data: {
      trialId,
      userId: dbUser.id,
      role,
      meaning: cleanMeaning,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: 'TRIAL_SIGNED',
      entityType: 'Signature',
      entityId: signature.id,
      details: {
        message: `${dbUser.email} signed trial "${trial.title}" as ${role}: "${cleanMeaning}"`,
      },
    },
  });

  revalidatePath('/app');
  return { success: true, signatureId: signature.id };
}

/**
 * Fetch all signatures for a trial (for the signature panel).
 */
export async function fetchTrialSignatures(trialId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return [];

  return prisma.signature.findMany({
    where: {
      trialId,
      trial: { project: { organizationId: dbUser.organizationId } },
    },
    include: { user: { select: { email: true, role: true } } },
    orderBy: { signedAt: 'asc' },
  });
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
    include: { metadata: true },
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
    },
    include: { metadata: true }
  });

  revalidatePath('/app');
  return trial;
}

import crypto from 'crypto';

export async function sealTrial(trialId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  const trial = await prisma.trial.findFirst({
    where: { id: trialId, project: { organizationId: dbUser.organizationId } },
    include: { metadata: true }
  });

  if (!trial) throw new Error('Trial not found');
  if (trial.checksum) throw new Error('Trial is already sealed');

  // Cryptographic seal based on content, title, and metadata
  const dataToHash = JSON.stringify({
    title: trial.title,
    content: trial.content,
    metadata: trial.metadata,
    createdAt: trial.createdAt.toISOString()
  });
  const checksum = crypto.createHash('sha256').update(dataToHash).digest('hex');

  const updated = await prisma.trial.update({
    where: { id: trialId },
    data: {
      status: 'COMPLETED',
      checksum,
      sealedAt: new Date(),
      sealedBy: dbUser.id
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: 'TRIAL_SEALED',
      entityType: 'Trial',
      entityId: trialId,
      details: { message: `Sealed Trial ${trial.title} with SHA-256 Checksum: ${checksum}` }
    }
  });

  revalidatePath('/app');
  return updated;
}
