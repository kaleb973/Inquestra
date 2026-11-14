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

  const protocol = await prisma.protocolTemplate.findFirst({
    where: { id: protocolId, organizationId: dbUser.organizationId },
  });
  if (!protocol) throw new Error('Protocol not found.');

  const validName = z.string().min(1).max(200).parse(name);
  const contentValue = JSON.parse(JSON.stringify(content)) as Prisma.InputJsonValue;

  const updated = await prisma.protocolTemplate.update({
    where: { id: protocolId },
    data: {
      name: DOMPurify.sanitize(validName),
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
