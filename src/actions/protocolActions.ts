'use server';
// src/actions/protocolActions.ts
// Server actions for the Protocol & SOP Library.
// All mutations are org-scoped, Zod-validated, and audit-logged.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import DOMPurify from 'isomorphic-dompurify';
import { STANDARD_PROTOCOLS, buildTipTapProtocolDoc } from '@/lib/protocols/standardProtocols';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized: active session required.');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User profile not found in database.');
  return dbUser;
}

// ─── Validation Schemas ────────────────────────────────────────────────────────

const ProtocolCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Protocol name is required.')
    .max(200)
    .transform((v) => DOMPurify.sanitize(v.trim())),
  description: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v ? DOMPurify.sanitize(v.trim()) : undefined)),
});

// ─── Server Actions ────────────────────────────────────────────────────────────

/**
 * List all protocol templates for the current user's organization.
 * Returns published first, then drafts, ordered by name.
 */
export async function listProtocols() {
  const dbUser = await getAuthenticatedUser();

  return prisma.protocolTemplate.findMany({
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
}

/**
 * Retrieve the full content of a single protocol template.
 */
export async function getProtocol(protocolId: string) {
  const dbUser = await getAuthenticatedUser();

  return prisma.protocolTemplate.findFirst({
    where: { id: protocolId, organizationId: dbUser.organizationId },
  });
}

/**
 * Create a new (draft) protocol template with an empty TipTap document body.
 */
export async function createProtocol(input: { name: string; description?: string }) {
  const dbUser = await getAuthenticatedUser();
  if (dbUser.role === 'VIEWER') {
    throw new Error('Permission denied: viewers cannot create protocol templates.');
  }

  const validated = ProtocolCreateSchema.parse(input);

  const protocol = await prisma.protocolTemplate.create({
    data: {
      name: validated.name,
      description: validated.description,
      content: { type: 'doc', content: [] } as Prisma.InputJsonValue,
      version: 1,
      isPublished: false,
      organizationId: dbUser.organizationId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: 'PROTOCOL_CREATED',
      entityType: 'ProtocolTemplate',
      entityId: protocol.id,
      details: { name: validated.name },
    },
  });

  revalidatePath('/app/protocols');
  return { success: true, protocolId: protocol.id };
}

/**
 * Save the TipTap JSON content of a protocol template.
 * Increments the version on every save to maintain a clear edit history.
 */
export async function updateProtocolContent(
  protocolId: string,
  content: Record<string, unknown>,
  name: string
) {
  const dbUser = await getAuthenticatedUser();
  if (dbUser.role === 'VIEWER') {
    throw new Error('Permission denied: viewers cannot modify protocol templates.');
  }

  const protocol = await prisma.protocolTemplate.findFirst({
    where: { id: protocolId, organizationId: dbUser.organizationId },
  });
  if (!protocol) throw new Error('Protocol not found.');

  const validName = z.string().min(1).max(200).parse(name);
  const { sanitizeTipTapAST } = await import('@/lib/security/trialImportSanitizer');
  const sanitizedContent = sanitizeTipTapAST(content) ?? { type: 'doc', content: [] };
  const contentValue = sanitizedContent as Prisma.InputJsonValue;

  const updated = await prisma.protocolTemplate.update({
    where: { id: protocolId },
    data: {
      name: DOMPurify.sanitize(validName, { ALLOWED_TAGS: [] }),
      content: contentValue,
      version: { increment: 1 },
    },
  });

  revalidatePath('/app/protocols');
  return { success: true, version: updated.version };
}

/**
 * Toggle publish state of a protocol template.
 * Only PI and ADMIN roles may publish/unpublish protocols.
 */
export async function toggleProtocolPublished(protocolId: string) {
  const dbUser = await getAuthenticatedUser();

  if (dbUser.role !== 'PI' && dbUser.role !== 'ADMIN') {
    throw new Error('Only Lab PIs and Admins may publish protocol templates.');
  }

  const protocol = await prisma.protocolTemplate.findFirst({
    where: { id: protocolId, organizationId: dbUser.organizationId },
  });
  if (!protocol) throw new Error('Protocol not found.');

  const updated = await prisma.protocolTemplate.update({
    where: { id: protocolId },
    data: { isPublished: !protocol.isPublished },
  });

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: updated.isPublished ? 'PROTOCOL_PUBLISHED' : 'PROTOCOL_UNPUBLISHED',
      entityType: 'ProtocolTemplate',
      entityId: protocolId,
      details: { name: protocol.name, version: protocol.version },
    },
  });

  revalidatePath('/app/protocols');
  return { success: true, isPublished: updated.isPublished };
}

/**
 * Permanently delete a protocol template.
 * Only PI/ADMIN may delete. Cannot delete if the protocol is referenced by active trials.
 */
export async function deleteProtocol(protocolId: string) {
  const dbUser = await getAuthenticatedUser();

  if (dbUser.role !== 'PI' && dbUser.role !== 'ADMIN') {
    throw new Error('Only Lab PIs and Admins may delete protocol templates.');
  }

  const protocol = await prisma.protocolTemplate.findFirst({
    where: { id: protocolId, organizationId: dbUser.organizationId },
    include: { _count: { select: { trials: true } } },
  });
  if (!protocol) throw new Error('Protocol not found.');
  if (protocol._count.trials > 0) {
    throw new Error(
      `Cannot delete: this protocol is referenced by ${protocol._count.trials} trial(s). Archive the trials first.`
    );
  }

  await prisma.protocolTemplate.delete({ where: { id: protocolId } });

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: 'PROTOCOL_DELETED',
      entityType: 'ProtocolTemplate',
      entityId: protocolId,
      details: { name: protocol.name },
    },
  });

  revalidatePath('/app/protocols');
  return { success: true };
}

/**
 * Clones a verified standard laboratory SOP into the user's organization ProtocolTemplate table.
 * Automatically publishes it so it is available for all lab researchers.
 */
export async function adoptStandardProtocol(slug: string) {
  const dbUser = await getAuthenticatedUser();
  if (dbUser.role === 'VIEWER') {
    throw new Error('Permission denied: viewers cannot adopt protocol templates.');
  }
  const standard = STANDARD_PROTOCOLS.find((p) => p.slug === slug);
  if (!standard) throw new Error(`Standard protocol '${slug}' not found.`);

  // Check if an existing protocol with the same name exists
  const existing = await prisma.protocolTemplate.findFirst({
    where: {
      organizationId: dbUser.organizationId,
      name: standard.name,
    },
  });

  if (existing) {
    return { success: true, protocolId: existing.id, isExisting: true };
  }

  const contentDoc = buildTipTapProtocolDoc(standard);

  const protocol = await prisma.protocolTemplate.create({
    data: {
      name: standard.name,
      description: standard.description,
      content: contentDoc as unknown as Prisma.InputJsonValue,
      version: 1,
      isPublished: true,
      organizationId: dbUser.organizationId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: 'PROTOCOL_ADOPTED',
      entityType: 'ProtocolTemplate',
      entityId: protocol.id,
      details: { name: standard.name, category: standard.category, slug },
    },
  });

  revalidatePath('/app/protocols');
  return { success: true, protocolId: protocol.id, isExisting: false };
}

/**
 * Creates an active Trial directly from an organization or standard protocol.
 * Immediately ready for bench execution.
 */
export async function createTrialFromProtocol(input: {
  protocolId?: string;
  standardSlug?: string;
  trialTitle?: string;
}) {
  const dbUser = await getAuthenticatedUser();
  if (dbUser.role === 'VIEWER') {
    throw new Error('Permission denied: viewers cannot launch trials from protocols.');
  }

  // Find or create active project
  let project = await prisma.project.findFirst({
    where: { organizationId: dbUser.organizationId, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'General Research & Bench Trials',
        code: 'GEN-01',
        description: 'Default bench workspace for protocol runs and experimental observations.',
        organizationId: dbUser.organizationId,
        leadId: dbUser.id,
        status: 'ACTIVE',
      },
    });
  }

  let title = input.trialTitle ? DOMPurify.sanitize(input.trialTitle.trim()) : '';
  let contentValue: Prisma.InputJsonValue = { type: 'doc', content: [] };
  let linkedProtocolId: string | null = null;

  if (input.protocolId) {
    const protocol = await prisma.protocolTemplate.findFirst({
      where: { id: input.protocolId, organizationId: dbUser.organizationId },
    });
    if (!protocol) throw new Error('Protocol not found.');

    linkedProtocolId = protocol.id;
    if (!title) title = `Run: ${protocol.name} (v${protocol.version})`;
    contentValue = protocol.content as Prisma.InputJsonValue;
  } else if (input.standardSlug) {
    const standard = STANDARD_PROTOCOLS.find((p) => p.slug === input.standardSlug);
    if (!standard) throw new Error(`Standard protocol '${input.standardSlug}' not found.`);

    if (!title) title = `Run: ${standard.name}`;
    contentValue = buildTipTapProtocolDoc(standard) as unknown as Prisma.InputJsonValue;
  } else {
    throw new Error('Either protocolId or standardSlug must be provided.');
  }

  const trial = await prisma.trial.create({
    data: {
      title,
      content: contentValue,
      status: 'ACTIVE',
      projectId: project.id,
      userId: dbUser.id,
      protocolId: linkedProtocolId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: 'TRIAL_CREATED_FROM_PROTOCOL',
      entityType: 'Trial',
      entityId: trial.id,
      details: {
        title,
        protocolId: linkedProtocolId,
        standardSlug: input.standardSlug,
      },
    },
  });

  revalidatePath('/app');
  revalidatePath('/app/protocols');
  return { success: true, trialId: trial.id };
}
