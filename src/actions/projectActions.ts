'use server';
// src/actions/projectActions.ts
// Project lifecycle server actions — create, fetch, update, delete.
// All writes are append-audited for immutable data provenance.

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Role } from '@prisma/client';
import DOMPurify from 'isomorphic-dompurify';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectWithLead {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  status: string;
  organizationId: string;
  leadId: string | null;
  lead: {
    id: string;
    email: string;
    role: Role;
  } | null;
  _count: {
    trials: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' as const, dbUser: null };

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { organization: true },
  });
  if (!dbUser) return { error: 'User record not found' as const, dbUser: null };

  return { error: null, dbUser };
}

async function requireAdminOrPi() {
  const { error, dbUser } = await getAuthenticatedUser();
  if (error || !dbUser) return { error: error ?? 'Unauthorized', dbUser: null };
  if (dbUser.role !== 'ADMIN' && dbUser.role !== 'PI') {
    return { error: 'Only Lab PIs and Admins can manage projects.', dbUser: null };
  }
  return { error: null, dbUser };
}

// ─── Server Actions ─────────────────────────────────────────────────────────────

/**
 * Fetch all projects in the current user's organization, including their
 * designated Project PI / Lead and trial count.
 */
export async function fetchProjectsWithLeads(): Promise<ProjectWithLead[]> {
  const { error, dbUser } = await getAuthenticatedUser();
  if (error || !dbUser) return [];

  const projects = await prisma.project.findMany({
    where: { organizationId: dbUser.organizationId },
    include: {
      lead: {
        select: { id: true, email: true, role: true },
      },
      _count: {
        select: { trials: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return projects as ProjectWithLead[];
}

/**
 * Create a new project, optionally designating a Project PI / Lead.
 * Automatically logs project creation to the immutable audit trail.
 */
export async function createProject(params: {
  name: string;
  description?: string;
  code?: string;
  leadId?: string;
}) {
  const { error, dbUser } = await requireAdminOrPi();
  if (error || !dbUser) return { success: false, error };

  const name = DOMPurify.sanitize(params.name.trim());
  if (!name) return { success: false, error: 'Project name is required.' };

  const code = params.code ? DOMPurify.sanitize(params.code.trim()) : null;
  const description = params.description
    ? DOMPurify.sanitize(params.description.trim())
    : null;

  // Validate lead belongs to the same org
  if (params.leadId) {
    const leadUser = await prisma.user.findUnique({
      where: { id: params.leadId },
    });
    if (!leadUser || leadUser.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Selected project lead is not in this lab.' };
    }
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        code,
        organizationId: dbUser.organizationId,
        leadId: params.leadId ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: project.id,
        details: {
          message: `Project "${name}" created${code ? ` (${code})` : ''}.${params.leadId ? ` Lead assigned: ${params.leadId}` : ''}`,
        },
      },
    });

    revalidatePath('/app');
    revalidatePath('/app/admin');
    return { success: true, projectId: project.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create project.';
    return { success: false, error: message };
  }
}

/**
 * Update a project's PI / Lead Scientist designation.
 * Only Lab PIs and Admins can reassign project leads.
 */
export async function updateProjectLead(projectId: string, leadId: string | null) {
  const { error, dbUser } = await requireAdminOrPi();
  if (error || !dbUser) return { success: false, error };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.organizationId !== dbUser.organizationId) {
    return { success: false, error: 'Project not found or unauthorized.' };
  }

  if (leadId) {
    const leadUser = await prisma.user.findUnique({ where: { id: leadId } });
    if (!leadUser || leadUser.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Selected lead is not a member of this lab.' };
    }
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { leadId },
    });

    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
        action: 'PROJECT_LEAD_UPDATED',
        entityType: 'Project',
        entityId: projectId,
        details: {
          message: leadId
            ? `Project lead updated to user ID: ${leadId}`
            : `Project lead removed from "${project.name}".`,
        },
      },
    });

    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update project lead.';
    return { success: false, error: message };
  }
}

/**
 * Archive or restore a project (soft lifecycle change, not hard delete).
 * Hard deletion is intentionally not exposed — immutable provenance.
 */
export async function updateProjectStatus(
  projectId: string,
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'
) {
  const { error, dbUser } = await requireAdminOrPi();
  if (error || !dbUser) return { success: false, error };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.organizationId !== dbUser.organizationId) {
    return { success: false, error: 'Project not found or unauthorized.' };
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
        action: 'PROJECT_STATUS_UPDATED',
        entityType: 'Project',
        entityId: projectId,
        details: { message: `Project "${project.name}" status changed to ${status}.` },
      },
    });

    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update project status.';
    return { success: false, error: message };
  }
}

/**
 * Fetch all lab members eligible to be a Project PI / Lead (i.e., all members
 * in the organization). Used by the project creation / assignment selector.
 */
export async function fetchLabMembersForLeadSelector(): Promise<
  { id: string; email: string; role: Role }[]
> {
  const { error, dbUser } = await getAuthenticatedUser();
  if (error || !dbUser) return [];

  return prisma.user.findMany({
    where: { organizationId: dbUser.organizationId },
    select: { id: true, email: true, role: true },
    orderBy: { email: 'asc' },
  });
}
