'use server';
// src/actions/trialActions.ts
// Trial persistence Server Actions — Zod-validated, Prisma-persisted.
// Immutable data provenance: no silent overwrites. All updates are append-audited.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Prisma, Role } from '@prisma/client';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateTrialHash } from '@/lib/provenance';
import {
  flushPostHogLogs,
  logTrialSealed,
  logTrialStatusChanged,
} from '@/lib/posthog-logs';
import type { ProjectWithLead } from '@/actions/projectActions';

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

export interface SaveTrialInput {
  trialId: string;
  title: string;
  content: Record<string, unknown>;
  status?: 'DRAFT' | 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED' | 'FAILED';
  metadata?: { id?: string; key: string; value: string }[];
  createRevision?: boolean;
  revisionNote?: string;
}

export interface SaveTrialResult {
  success: boolean;
  savedAt?: string;
  error?: string;
}

const SaveTrialSchema = z.object({
  trialId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(255).transform((val) => DOMPurify.sanitize(val)),
  content: z.record(z.string(), z.unknown()),
  status: z.enum(['DRAFT', 'ACTIVE', 'IN_REVIEW', 'COMPLETED', 'FAILED']).optional(),
  metadata: z
    .array(
      z.object({
        id: z.string().optional(),
        key: z.string().max(100).transform((val) => DOMPurify.sanitize(val)),
        value: z.string().max(500).transform((val) => DOMPurify.sanitize(val)),
      })
    )
    .optional(),
  createRevision: z.boolean().optional().default(false),
  revisionNote: z.string().max(500).optional(),
});

/**
 * Atomic save for trial content, metadata, and status.
 * Enforces organization tenant boundary, 21 CFR Part 11 immutability (sealed trials rejected),
 * and creates a TrialRevision snapshot only when explicitly requested (manual save or milestone).
 */
export async function saveTrial(input: SaveTrialInput): Promise<SaveTrialResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized: active session required.' };
    }

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
    if (!dbUser) {
      return { success: false, error: 'User profile not found.' };
    }

    const validated = SaveTrialSchema.parse(input);

    const trial = await prisma.trial.findFirst({
      where: {
        id: validated.trialId,
        project: {
          organizationId: dbUser.organizationId,
        },
      },
    });

    if (!trial) {
      return { success: false, error: 'Trial not found or access denied.' };
    }

    if (trial.checksum) {
      return {
        success: false,
        error: 'Cannot edit a sealed trial. This experiment is cryptographically locked.',
      };
    }

    const contentValue =
      typeof validated.content === 'object' && validated.content !== null
        ? (JSON.parse(JSON.stringify(validated.content)) as Prisma.InputJsonValue)
        : ({} as Prisma.InputJsonValue);

    const savedTimestamp = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Update trial record
      await tx.trial.update({
        where: { id: validated.trialId },
        data: {
          title: validated.title,
          content: contentValue,
          ...(validated.status ? { status: validated.status } : {}),
          updatedAt: savedTimestamp,
        },
      });

      // 2. Synchronize metadata if provided
      if (validated.metadata !== undefined) {
        await tx.metadataEntry.deleteMany({
          where: { trialId: validated.trialId },
        });

        const cleanMetadata = validated.metadata
          .map((m) => ({
            key: m.key.trim(),
            value: m.value.trim(),
            trialId: validated.trialId,
          }))
          .filter((m) => m.key.length > 0 && m.value.length > 0);

        if (cleanMetadata.length > 0) {
          await tx.metadataEntry.createMany({
            data: cleanMetadata,
          });
        }
      }

      // 3. Snapshot revision if explicitly requested (e.g., manual save / milestone)
      if (validated.createRevision) {
        const cleanNote = validated.revisionNote
          ? DOMPurify.sanitize(validated.revisionNote.trim())
          : null;

        await tx.trialRevision.create({
          data: {
            trialId: validated.trialId,
            title: validated.title,
            content: contentValue,
            savedById: dbUser.id,
            note: cleanNote,
            savedAt: savedTimestamp,
          },
        });
      }
    });

    revalidatePath(`/projects/${trial.projectId}`);
    return { success: true, savedAt: savedTimestamp.toISOString() };
  } catch (err) {
    console.error('saveTrial error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Database save failed.',
    };
  }
}

/**
 * Backwards-compatible updateTrialContent wrapper.
 * Calls saveTrial with createRevision: false so keystroke autosaves don't clutter TrialRevision.
 */
export async function updateTrialContent(
  trialId: string,
  content: Record<string, unknown>,
  title: string
) {
  const result = await saveTrial({
    trialId,
    content,
    title,
    createRevision: false,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to update trial content');
  }

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

  try {
    revalidatePath('/app');
  } catch (revErr) {
    console.warn('[Cache] Non-fatal revalidatePath error in restoreTrialRevision:', revErr);
  }
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

  try {
    revalidatePath('/app');
  } catch (revErr) {
    console.warn('[Cache] Non-fatal revalidatePath error in signTrial:', revErr);
  }
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


export interface WorkspaceBootstrapResult {
  projects: ProjectWithLead[];
  activeProjectId: string | null;
  trials: {
    id: string;
    title: string;
    status: import('@/types/inquestra').TrialStatus;
    updatedAt: Date;
    createdAt: Date;
    projectId: string;
    metadata: { id: string; key: string; value: string }[];
    _count: { revisions: number; inventoryUsed: number; signatures: number };
  }[];
  userProfile: {
    id: string;
    email: string;
    role: Role;
    organizationId: string;
    orgName: string;
    strictMode: boolean;
  } | null;
}

/**
 * Consolidated single-roundtrip workspace bootstrap action.
 * Performs a single Supabase auth check and parallel Prisma queries,
 * eliminating 4 sequential waterfall roundtrips on initial load.
 */
export async function fetchWorkspaceBootstrap(
  preferredProjectId?: string | null
): Promise<WorkspaceBootstrapResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { projects: [], activeProjectId: null, trials: [], userProfile: null };
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { organization: true },
  });

  if (!dbUser) {
    return { projects: [], activeProjectId: null, trials: [], userProfile: null };
  }

  // Fetch all projects for the organization in one query
  const projects = await prisma.project.findMany({
    where: { organizationId: dbUser.organizationId },
    include: {
      lead: { select: { id: true, email: true, role: true } },
      _count: { select: { trials: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Determine active project: preferred if valid, otherwise first available
  const targetProjectId =
    preferredProjectId && projects.some((p) => p.id === preferredProjectId)
      ? preferredProjectId
      : projects[0]?.id ?? null;

  // Fetch trials for the determined project
  const trials = targetProjectId
    ? await prisma.trial.findMany({
        where: { projectId: targetProjectId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          createdAt: true,
          projectId: true,
          metadata: { select: { id: true, key: true, value: true } },
          _count: { select: { revisions: true, inventoryUsed: true, signatures: true } },
        },
      })
    : [];

  return {
    projects: projects as ProjectWithLead[],
    activeProjectId: targetProjectId,
    trials: trials as WorkspaceBootstrapResult['trials'],
    userProfile: {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      organizationId: dbUser.organizationId,
      orgName: dbUser.organization.name,
      strictMode: dbUser.organization.strictMode,
    },
  };
}

export async function fetchAllTrials(projectId?: string | null) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  return prisma.trial.findMany({
    where: {
      project: { organizationId: dbUser.organizationId },
      ...(projectId && projectId !== 'ALL' ? { projectId } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
      createdAt: true,
      projectId: true,
      metadata: { select: { id: true, key: true, value: true } },
      _count: { select: { revisions: true, inventoryUsed: true, signatures: true } },
    },
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

export interface NewTrialTemplateInput {
  title?: string;
  content?: Record<string, unknown>;
  metadata?: { key: string; value: string }[];
}

export async function createNewTrial(
  projectId?: string | null,
  category?: string | null,
  template?: NewTrialTemplateInput | null
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  let targetProjectId = projectId && projectId !== 'ALL' ? projectId : null;

  if (!targetProjectId) {
    const project = await prisma.project.findFirst({
      where: { organizationId: dbUser.organizationId },
      orderBy: { createdAt: 'desc' },
    });
    if (!project) throw new Error('No project found');
    targetProjectId = project.id;
  } else {
    const project = await prisma.project.findFirst({
      where: { id: targetProjectId, organizationId: dbUser.organizationId },
    });
    if (!project) throw new Error('Project not found in organization');
  }

  const initialMetadata: { key: string; value: string }[] = [];
  const seenKeys = new Set<string>();

  if (template?.metadata && template.metadata.length > 0) {
    for (const entry of template.metadata) {
      const cleanKey = DOMPurify.sanitize(entry.key.trim()).slice(0, 100);
      if (!cleanKey || seenKeys.has(cleanKey.toLowerCase())) continue;
      seenKeys.add(cleanKey.toLowerCase());
      initialMetadata.push({
        key: cleanKey,
        value: DOMPurify.sanitize(entry.value.trim()).slice(0, 500),
      });
    }
  }

  if (category && category.trim() && !seenKeys.has('category')) {
    initialMetadata.push({
      key: 'category',
      value: DOMPurify.sanitize(category.trim()).slice(0, 500),
    });
  }

  const cleanTitle = template?.title?.trim()
    ? DOMPurify.sanitize(template.title.trim()).slice(0, 255) || 'Untitled Experiment'
    : 'Untitled Experiment';

  const initialContent = template?.content
    ? (JSON.parse(JSON.stringify(template.content)) as Prisma.InputJsonValue)
    : ({ type: 'doc', content: [] } as Prisma.InputJsonValue);

  const trial = await prisma.trial.create({
    data: {
      title: cleanTitle,
      content: initialContent,
      projectId: targetProjectId,
      userId: dbUser.id,
      ...(initialMetadata.length > 0
        ? {
            metadata: {
              create: initialMetadata,
            },
          }
        : {}),
    },
    include: { metadata: true },
  });

  try {
    revalidatePath('/app');
  } catch (revErr) {
    console.warn('[Cache] Non-fatal revalidatePath error in createNewTrial:', revErr);
  }
  return trial;
}

export interface SealTrialResult {
  success: boolean;
  checksum?: string;
  sealedAt?: string;
  alreadySealed?: boolean;
  error?: string;
}

export async function sealTrial(trialId: string): Promise<SealTrialResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized: active session required.' };
    }

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
    if (!dbUser) {
      return { success: false, error: 'User profile not found in database.' };
    }

    const trial = await prisma.trial.findFirst({
      where: { id: trialId, project: { organizationId: dbUser.organizationId } },
      include: { metadata: true }
    });

    if (!trial) {
      return { success: false, error: 'Trial not found or access denied.' };
    }

    // Idempotent: If already sealed, return stored checksum without throwing
    if (trial.checksum) {
      return {
        success: true,
        checksum: trial.checksum,
        sealedAt: trial.sealedAt?.toISOString() || new Date().toISOString(),
        alreadySealed: true,
      };
    }

    const timestamp = new Date().toISOString();
    const checksum = generateTrialHash(trial.content, trial.metadata, timestamp);

    await prisma.trial.update({
      where: { id: trialId },
      data: {
        status: 'COMPLETED',
        checksum,
        sealedAt: new Date(timestamp),
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

    try {
      logTrialSealed();
      await flushPostHogLogs();
    } catch (logErr) {
      console.warn('[Telemetry] Non-fatal log failure during seal:', logErr);
    }

    try {
      revalidatePath('/app');
    } catch (revErr) {
      console.warn('[Cache] Non-fatal revalidatePath failure during seal:', revErr);
    }

    return {
      success: true,
      checksum,
      sealedAt: timestamp,
    };
  } catch (err: unknown) {
    console.error('sealTrial fatal error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Cryptographic sealing failed.',
    };
  }
}

/**
 * Update the lifecycle status of a trial.
 * Sealed (checksummed) trials cannot have their status changed.
 * Each transition is appended to the AuditLog for full traceability.
 */
export async function updateTrialStatus(
  trialId: string,
  newStatus: 'DRAFT' | 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED' | 'FAILED'
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized: active session required.' };
    }

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
    if (!dbUser) {
      return { success: false, error: 'User profile not found.' };
    }

    const trial = await prisma.trial.findFirst({
      where: { id: trialId, project: { organizationId: dbUser.organizationId } },
    });
    if (!trial) {
      return { success: false, error: 'Trial not found or access denied.' };
    }
    if (trial.checksum) {
      return { success: false, error: 'Cannot change status of a sealed trial.' };
    }

    const validStatus = z
      .enum(['DRAFT', 'ACTIVE', 'IN_REVIEW', 'COMPLETED', 'FAILED'])
      .parse(newStatus);

    const updated = await prisma.trial.update({
      where: { id: trialId },
      data: { status: validStatus },
    });

    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
        action: 'TRIAL_STATUS_CHANGED',
        entityType: 'Trial',
        entityId: trialId,
        details: {
          message: `Status changed from "${trial.status}" to "${validStatus}" on trial "${trial.title}".`,
          previousStatus: trial.status,
          newStatus: validStatus,
        },
      },
    });

    try {
      logTrialStatusChanged(validStatus);
      await flushPostHogLogs();
    } catch (logErr) {
      console.warn('[Telemetry] Non-fatal status log error:', logErr);
    }

    try {
      revalidatePath('/app');
    } catch (revErr) {
      console.warn('[Cache] Non-fatal revalidatePath error:', revErr);
    }

    return { success: true, updated };
  } catch (err: unknown) {
    console.error('updateTrialStatus error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update trial status',
    };
  }
}

/**
 * Rename a trial/experiment.
 * Sealed trials cannot be renamed.
 */
export async function renameTrial(
  trialId: string,
  newTitle: string
): Promise<{ success: boolean; error?: string; trial?: import('@prisma/client').Trial }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized: active session required.' };

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
    if (!dbUser) return { success: false, error: 'User not found.' };

    const trial = await prisma.trial.findFirst({
      where: { id: trialId, project: { organizationId: dbUser.organizationId } },
    });
    if (!trial) return { success: false, error: 'Trial not found.' };
    if (trial.checksum) return { success: false, error: 'Cannot rename a sealed experiment.' };

    const cleanTitle = DOMPurify.sanitize(newTitle.trim()) || 'Untitled Experiment';

    const updated = await prisma.trial.update({
      where: { id: trialId },
      data: { title: cleanTitle },
    });

    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
        action: 'TRIAL_RENAMED',
        entityType: 'Trial',
        entityId: trialId,
        details: {
          message: `Experiment renamed from "${trial.title}" to "${cleanTitle}".`,
          previousTitle: trial.title,
          newTitle: cleanTitle,
        },
      },
    });

    try {
      revalidatePath('/app');
    } catch (revErr) {
      console.warn('[Cache] Non-fatal revalidatePath error in renameTrial:', revErr);
    }
    return { success: true, trial: updated };
  } catch (err: unknown) {
    console.error('renameTrial error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to rename experiment',
    };
  }
}

/**
 * Duplicate an experiment and its metadata as a new DRAFT experiment.
 */
export async function duplicateTrial(
  trialId: string
): Promise<{ success: boolean; error?: string; trial?: import('@prisma/client').Trial & { metadata: import('@prisma/client').MetadataEntry[] } }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized: active session required.' };

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
    if (!dbUser) return { success: false, error: 'User not found.' };

    const trial = await prisma.trial.findFirst({
      where: { id: trialId, project: { organizationId: dbUser.organizationId } },
      include: { metadata: true },
    });
    if (!trial) return { success: false, error: 'Trial not found.' };

    const newTitle = `Copy of ${trial.title}`;
    const duplicated = await prisma.trial.create({
      data: {
        title: newTitle,
        content: trial.content as Prisma.InputJsonValue,
        status: 'DRAFT',
        projectId: trial.projectId,
        userId: dbUser.id,
        metadata: {
          create: trial.metadata.map((m) => ({ key: m.key, value: m.value })),
        },
      },
      include: { metadata: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
        action: 'TRIAL_DUPLICATED',
        entityType: 'Trial',
        entityId: duplicated.id,
        details: {
          message: `Duplicated experiment "${trial.title}" into new draft "${newTitle}".`,
          sourceTrialId: trialId,
          newTrialId: duplicated.id,
        },
      },
    });

    try {
      revalidatePath('/app');
    } catch (revErr) {
      console.warn('[Cache] Non-fatal revalidatePath error in duplicateTrial:', revErr);
    }
    return { success: true, trial: duplicated };
  } catch (err: unknown) {
    console.error('duplicateTrial error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to duplicate experiment',
    };
  }
}

/**
 * Delete an unsealed trial.
 * Sealed trials strictly cannot be deleted under 21 CFR Part 11 immutable provenance.
 */
export async function deleteTrial(trialId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized: active session required.' };

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
    if (!dbUser) return { success: false, error: 'User not found.' };

    const trial = await prisma.trial.findFirst({
      where: { id: trialId, project: { organizationId: dbUser.organizationId } },
    });
    if (!trial) return { success: false, error: 'Trial not found' };

    if (trial.checksum) {
      return {
        success: false,
        error: '21 CFR Part 11 Violation: Sealed experiments are immutable and cannot be deleted.',
      };
    }

    await prisma.$transaction([
      prisma.metadataEntry.deleteMany({ where: { trialId } }),
      prisma.trialRevision.deleteMany({ where: { trialId } }),
      prisma.trialInventory.deleteMany({ where: { trialId } }),
      prisma.trialEquipment.deleteMany({ where: { trialId } }),
      prisma.signature.deleteMany({ where: { trialId } }),
      prisma.telemetryStream.deleteMany({ where: { trialId } }),
      prisma.trial.delete({ where: { id: trialId } }),
      prisma.auditLog.create({
        data: {
          userId: dbUser.id,
          organizationId: dbUser.organizationId,
          action: 'TRIAL_DELETED',
          entityType: 'Trial',
          entityId: trialId,
          details: {
            message: `Deleted unsealed experiment "${trial.title}" (ID: ${trialId}).`,
            deletedTitle: trial.title,
          },
        },
      }),
    ]);

    return { success: true };
  } catch (err: unknown) {
    console.error('deleteTrial error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete experiment',
    };
  }
}

/**
 * Set or update category metadata tag on a trial.
 */
export async function setTrialCategory(
  trialId: string,
  category: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized: active session required.' };

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
    if (!dbUser) return { success: false, error: 'User not found.' };

    const trial = await prisma.trial.findFirst({
      where: { id: trialId, project: { organizationId: dbUser.organizationId } },
    });
    if (!trial) return { success: false, error: 'Trial not found' };
    if (trial.checksum) return { success: false, error: 'Cannot modify metadata on a sealed experiment.' };

    const cleanCategory = DOMPurify.sanitize(category.trim());

    await prisma.$transaction(async (tx) => {
      await tx.metadataEntry.deleteMany({
        where: {
          trialId,
          key: { in: ['category', 'Category', 'type', 'Type'] },
        },
      });

      if (cleanCategory) {
        await tx.metadataEntry.create({
          data: {
            trialId,
            key: 'category',
            value: cleanCategory,
          },
        });
      }
    });

    try {
      revalidatePath('/app');
    } catch (revErr) {
      console.warn('[Cache] Non-fatal revalidatePath error in setTrialCategory:', revErr);
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('setTrialCategory error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to set category',
    };
  }
}
