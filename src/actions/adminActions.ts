"use server";
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Role, Prisma } from '@prisma/client';

async function logAuditAction(
  userId: string,
  organizationId: string,
  action: string,
  details: string,
  entityType: string = "AdminAction",
  entityId: string = "global"
) {
  try {
    await prisma.auditLog.create({
      data: { 
        userId, 
        organizationId, 
        action, 
        details: { message: details },
        entityType,
        entityId
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

async function verifyAdminAccess() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', user: null, dbUser: null };

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
  });

  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'PI')) {
    return { error: 'Forbidden', user: null, dbUser: null };
  }

  return { error: null, user, dbUser };
}

async function getAuthenticatedDbUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', user: null, dbUser: null };

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { organization: true, team: true },
  });

  if (!dbUser) return { error: 'User record not found', user: null, dbUser: null };

  return { error: null, user, dbUser };
}

import DOMPurify from 'isomorphic-dompurify';

export async function addInventoryItem(formData: FormData) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const name = DOMPurify.sanitize(formData.get('name') as string);
  const type = formData.get('type') as any || "CHEMICAL";
  const lotNumber = DOMPurify.sanitize(formData.get('lotNumber') as string || '');
  const barcode = DOMPurify.sanitize(formData.get('barcode') as string || '');
  const quantity = parseFloat(formData.get('quantity') as string);
  const unit = DOMPurify.sanitize(formData.get('unit') as string);
  const thresholdValue = parseFloat(formData.get('thresholdValue') as string || '0');
  
  const expDateStr = formData.get('expirationDate') as string;
  const expirationDate = expDateStr ? new Date(expDateStr) : null;
  
  const locationId = formData.get('locationId') as string || null;

  try {
    await prisma.inventoryItem.create({
      data: {
        name,
        type,
        lotNumber: lotNumber || null,
        barcode: barcode || null,
        quantity,
        unit,
        thresholdValue,
        expirationDate,
        locationId,
        organizationId: dbUser.organizationId,
      },
    });
    await logAuditAction(dbUser.id, dbUser.organizationId, 'INVENTORY_ADDED', `Added ${quantity} ${unit} of ${name}`);
    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addStorageLocation(formData: FormData) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const name = DOMPurify.sanitize(formData.get('name') as string);
  const type = DOMPurify.sanitize(formData.get('type') as string);
  const barcode = DOMPurify.sanitize(formData.get('barcode') as string || '');
  const parentId = formData.get('parentId') as string || null;

  try {
    await prisma.storageLocation.create({
      data: {
        name,
        type,
        barcode: barcode || null,
        parentId,
        organizationId: dbUser.organizationId,
      },
    });
    await logAuditAction(dbUser.id, dbUser.organizationId, 'LOCATION_ADDED', `Added storage location ${name}`);
    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getStorageLocations() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
  });
  if (!dbUser) return [];

  return await prisma.storageLocation.findMany({
    where: { organizationId: dbUser.organizationId },
    include: {
      children: true, // simplified fetch for tree construction
      items: {
        select: { id: true, name: true }
      }
    },
    orderBy: { name: 'asc' }
  });
}

export async function fetchInventoryForSearch(query: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
  });
  if (!dbUser) return [];

  const trimmed = query.trim();

  return await prisma.inventoryItem.findMany({
    where: {
      organizationId: dbUser.organizationId,
      ...(trimmed
        ? {
            OR: [
              { name: { contains: trimmed, mode: 'insensitive' } },
              { lotNumber: { contains: trimmed, mode: 'insensitive' } },
              { barcode: { contains: trimmed, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      location: { select: { name: true, type: true } }
    },
    take: 15,
    orderBy: trimmed ? { name: 'asc' } : { updatedAt: 'desc' }
  });
}

export async function updateInventoryStock(id: string, newQuantity: number) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  try {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (item?.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: newQuantity,
      },
    });
    await logAuditAction(dbUser.id, dbUser.organizationId, 'INVENTORY_UPDATED', `Updated ${item.name} stock to ${newQuantity}`);
    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateInventoryBarcode(id: string, newBarcode: string) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const sanitized = DOMPurify.sanitize(newBarcode).trim();

  try {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (item?.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: {
        barcode: sanitized || null,
      },
    });
    await logAuditAction(dbUser.id, dbUser.organizationId, 'INVENTORY_BARCODE_UPDATED', `Updated barcode for ${item.name} to ${sanitized || 'None'}`);
    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteInventoryItem(id: string) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  try {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (item?.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Unauthorized' };
    }
    await prisma.inventoryItem.delete({ where: { id } });
    await logAuditAction(dbUser.id, dbUser.organizationId, 'INVENTORY_DELETED', `Deleted ${item.name}`);
    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addEquipment(formData: FormData) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const name = DOMPurify.sanitize(formData.get('name') as string);
  const serialNumber = DOMPurify.sanitize(formData.get('serialNumber') as string || '');
  const barcode = DOMPurify.sanitize(formData.get('barcode') as string || '');
  const lastCalibrated = new Date(formData.get('lastCalibrated') as string);
  const calibrationFreq = parseInt(formData.get('calibrationFreq') as string, 10);
  const status = DOMPurify.sanitize(formData.get('status') as string);

  try {
    await prisma.equipment.create({
      data: {
        name,
        serialNumber: serialNumber || null,
        barcode: barcode || null,
        lastCalibrated,
        calibrationFreq,
        status,
        organizationId: dbUser.organizationId,
      },
    });
    await logAuditAction(dbUser.id, dbUser.organizationId, 'EQUIPMENT_ADDED', `Added equipment ${name}`);
    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateEquipmentStatus(id: string, status: string, calibratedNow: boolean = false) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  try {
    const item = await prisma.equipment.findUnique({ where: { id } });
    if (item?.organizationId !== dbUser.organizationId) return { success: false, error: 'Unauthorized' };

    await prisma.equipment.update({
      where: { id },
      data: {
        status,
        ...(calibratedNow ? { lastCalibrated: new Date() } : {}),
      },
    });
    
    await logAuditAction(dbUser.id, dbUser.organizationId, 'EQUIPMENT_UPDATED', `Updated ${item.name}`);
    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateStrictMode(enabled: boolean) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  try {
    await prisma.organization.update({
      where: { id: dbUser.organizationId },
      data: { strictMode: enabled }
    });
    await logAuditAction(dbUser.id, dbUser.organizationId, 'STRICT_MODE', `Strict mode ${enabled}`);
    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function checkLabCompliance() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { compliant: true };

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { organization: true }
  });

  if (!dbUser || !dbUser.organization.strictMode) return { compliant: true };

  const brokenEquipment = await prisma.equipment.findMany({
    where: {
      organizationId: dbUser.organizationId,
      status: { in: ['BROKEN', 'NEEDS_CALIBRATION'] }
    }
  });

  if (brokenEquipment.length > 0) {
    return { compliant: false, reason: `Blocked: ${brokenEquipment.length} broken/overdue items.` };
  }
  return { compliant: true };
}

// ── TEAM & SQUAD MANAGEMENT ──────────────────────────────────────────

export async function createTeam(formData: FormData) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const rawName = formData.get('name') as string;
  const rawDescription = formData.get('description') as string | null;

  if (!rawName || !rawName.trim()) {
    return { success: false, error: 'Squad name is required.' };
  }

  const name = DOMPurify.sanitize(rawName.trim());
  const description = rawDescription ? DOMPurify.sanitize(rawDescription.trim()) : null;

  try {
    const team = await prisma.team.create({
      data: {
        name,
        description,
        organizationId: dbUser.organizationId,
      },
    });

    await logAuditAction(
      dbUser.id,
      dbUser.organizationId,
      'TEAM_CREATED',
      `Created research squad: ${name}`,
      'Team',
      team.id
    );

    revalidatePath('/app/admin');
    return { success: true, teamId: team.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create squad.';
    return { success: false, error: message };
  }
}

export async function updateTeam(teamId: string, name: string, description: string | null) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const cleanName = DOMPurify.sanitize(name.trim());
  const cleanDescription = description ? DOMPurify.sanitize(description.trim()) : null;

  if (!cleanName) {
    return { success: false, error: 'Squad name cannot be empty.' };
  }

  try {
    const existing = await prisma.team.findUnique({ where: { id: teamId } });
    if (!existing || existing.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Squad not found or unauthorized.' };
    }

    await prisma.team.update({
      where: { id: teamId },
      data: {
        name: cleanName,
        description: cleanDescription,
      },
    });

    await logAuditAction(
      dbUser.id,
      dbUser.organizationId,
      'TEAM_UPDATED',
      `Updated research squad: ${cleanName}`,
      'Team',
      teamId
    );

    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update squad.';
    return { success: false, error: message };
  }
}

export async function deleteTeam(teamId: string) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  try {
    const existing = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });
    if (!existing || existing.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Squad not found or unauthorized.' };
    }

    // Safely unassign all squad members to the general lab pool
    await prisma.user.updateMany({
      where: { teamId },
      data: { teamId: null },
    });

    await prisma.team.delete({
      where: { id: teamId },
    });

    await logAuditAction(
      dbUser.id,
      dbUser.organizationId,
      'TEAM_DELETED',
      `Deleted squad ${existing.name}. ${existing.members.length} members unassigned.`,
      'Team',
      teamId
    );

    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete squad.';
    return { success: false, error: message };
  }
}

export async function assignUserToTeam(userId: string, teamId: string | null) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Target user not found or unauthorized.' };
    }

    let teamName = 'Unassigned pool';
    if (teamId) {
      const targetTeam = await prisma.team.findUnique({ where: { id: teamId } });
      if (!targetTeam || targetTeam.organizationId !== dbUser.organizationId) {
        return { success: false, error: 'Target squad does not exist.' };
      }
      teamName = targetTeam.name;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { teamId },
    });

    await logAuditAction(
      dbUser.id,
      dbUser.organizationId,
      'USER_TEAM_ASSIGNED',
      `Assigned ${targetUser.email} to squad: ${teamName}`,
      'User',
      userId
    );

    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to assign squad.';
    return { success: false, error: message };
  }
}

export async function updateUserRole(userId: string, newRole: Role) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Target user not found or unauthorized.' };
    }

    // Role Hierarchy Security Rule:
    // Only a PI can elevate another user to PI, or demote an existing PI.
    if ((newRole === 'PI' || targetUser.role === 'PI') && dbUser.role !== 'PI') {
      return {
        success: false,
        error: 'Principal Investigator role actions require an active PI credentials sign-off.',
      };
    }

    // Self-demotion guard
    if (targetUser.id === dbUser.id && (targetUser.role === 'PI' || targetUser.role === 'ADMIN') && newRole !== targetUser.role) {
      const remainingAdmins = await prisma.user.count({
        where: {
          organizationId: dbUser.organizationId,
          role: { in: ['ADMIN', 'PI'] },
        },
      });
      if (remainingAdmins <= 1) {
        return {
          success: false,
          error: 'Cannot demote the last remaining Lab Administrator/PI.',
        };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    await logAuditAction(
      dbUser.id,
      dbUser.organizationId,
      'ROLE_UPDATED',
      `Elevated/adjusted role for ${targetUser.email} from ${targetUser.role} to ${newRole}`,
      'User',
      userId
    );

    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update role.';
    return { success: false, error: message };
  }
}

// ── AUTHORIZATIONS & ESCALATION WORKFLOW ("ASK HIGHER-UP") ───────────

export interface AuthorizationRequest {
  id: string; // AuditLog ID
  requestId: string;
  requesterId: string;
  requesterEmail: string;
  requesterRole: Role;
  requestType: 'ROLE_ELEVATION' | 'OVERDRAFT_OVERRIDE' | 'TRIAL_SEAL_OVERRIDE' | 'CUSTOM';
  requestedRole: Role | null;
  justification: string;
  targetEntity: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  createdAt: string;
}

export async function submitAuthorizationRequest(params: {
  requestType: 'ROLE_ELEVATION' | 'OVERDRAFT_OVERRIDE' | 'TRIAL_SEAL_OVERRIDE' | 'CUSTOM';
  requestedRole?: Role | null;
  justification: string;
  targetEntity?: string | null;
}) {
  const { dbUser, error } = await getAuthenticatedDbUser();
  if (error || !dbUser) return { success: false, error: error || 'Authentication required.' };

  const cleanJustification = DOMPurify.sanitize(params.justification.trim());
  if (!cleanJustification) {
    return { success: false, error: 'Operational justification is required for escalation.' };
  }

  const requestId = crypto.randomUUID();

  try {
    const detailsJson: Prisma.JsonObject = {
      requestId,
      requesterId: dbUser.id,
      requesterEmail: dbUser.email,
      requesterRole: dbUser.role,
      requestType: params.requestType,
      requestedRole: params.requestedRole || null,
      justification: cleanJustification,
      targetEntity: params.targetEntity ? DOMPurify.sanitize(params.targetEntity) : null,
      status: 'PENDING',
    };

    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
        action: 'AUTHORIZATION_REQUEST',
        entityType: 'PermissionRequest',
        entityId: requestId,
        details: detailsJson,
      },
    });

    revalidatePath('/app/admin');
    return { success: true, requestId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit authorization request.';
    return { success: false, error: message };
  }
}

export async function fetchPendingAuthorizationRequests(): Promise<{
  success: boolean;
  requests: AuthorizationRequest[];
  error?: string;
}> {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, requests: [], error };

  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        organizationId: dbUser.organizationId,
        action: 'AUTHORIZATION_REQUEST',
        entityType: 'PermissionRequest',
      },
      include: {
        user: { select: { email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const requests: AuthorizationRequest[] = [];

    for (const log of logs) {
      if (!log.details || typeof log.details !== 'object') continue;
      const d = log.details as Record<string, unknown>;

      const req: AuthorizationRequest = {
        id: log.id,
        requestId: (d.requestId as string) || log.entityId,
        requesterId: (d.requesterId as string) || log.userId,
        requesterEmail: (d.requesterEmail as string) || log.user?.email || 'Unknown User',
        requesterRole: (d.requesterRole as Role) || log.user?.role || 'VIEWER',
        requestType: (d.requestType as AuthorizationRequest['requestType']) || 'CUSTOM',
        requestedRole: (d.requestedRole as Role) || null,
        justification: (d.justification as string) || '',
        targetEntity: (d.targetEntity as string) || null,
        status: (d.status as AuthorizationRequest['status']) || 'PENDING',
        resolvedBy: d.resolvedBy as string | undefined,
        resolvedAt: d.resolvedAt as string | undefined,
        resolutionNote: d.resolutionNote as string | undefined,
        createdAt: log.createdAt.toISOString(),
      };

      requests.push(req);
    }

    return { success: true, requests };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch authorizations.';
    return { success: false, requests: [], error: message };
  }
}

export async function resolveAuthorizationRequest(
  requestId: string,
  decision: 'APPROVED' | 'REJECTED',
  resolutionNote?: string
) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  try {
    const log = await prisma.auditLog.findFirst({
      where: {
        organizationId: dbUser.organizationId,
        action: 'AUTHORIZATION_REQUEST',
        entityId: requestId,
      },
    });

    if (!log) {
      return { success: false, error: 'Authorization request not found.' };
    }

    const currentDetails = (log.details as Record<string, unknown>) || {};
    const requesterId = currentDetails.requesterId as string;
    const requestType = currentDetails.requestType as string;
    const requestedRole = currentDetails.requestedRole as Role | null;

    // Hierarchy check: Only PIs can approve elevation to PI
    if (decision === 'APPROVED' && requestType === 'ROLE_ELEVATION' && requestedRole === 'PI' && dbUser.role !== 'PI') {
      return {
        success: false,
        error: 'Only a Principal Investigator can approve elevation to PI.',
      };
    }

    // Update log status
    const updatedDetails: Prisma.JsonObject = {
      ...currentDetails,
      status: decision,
      resolvedBy: dbUser.email,
      resolvedAt: new Date().toISOString(),
      resolutionNote: resolutionNote ? DOMPurify.sanitize(resolutionNote.trim()) : null,
    };

    await prisma.auditLog.update({
      where: { id: log.id },
      data: {
        details: updatedDetails,
      },
    });

    // If approved and request was ROLE_ELEVATION, execute the promotion
    if (decision === 'APPROVED' && requestType === 'ROLE_ELEVATION' && requestedRole && requesterId) {
      await prisma.user.update({
        where: { id: requesterId },
        data: { role: requestedRole },
      });

      await logAuditAction(
        dbUser.id,
        dbUser.organizationId,
        'ROLE_ELEVATED_BY_APPROVAL',
        `Approved elevation for user ${requesterId} to ${requestedRole}`,
        'User',
        requesterId
      );
    }

    await logAuditAction(
      dbUser.id,
      dbUser.organizationId,
      'AUTHORIZATION_RESOLVED',
      `Decision [${decision}] on request ${requestId} by ${dbUser.email}`,
      'PermissionRequest',
      requestId
    );

    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resolve request.';
    return { success: false, error: message };
  }
}

// ── CURRENT USER PROFILE & CLEARANCE ────────────────────────────────

export async function getCurrentUserProfile() {
  const { dbUser, error } = await getAuthenticatedDbUser();
  if (error || !dbUser) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    organizationId: dbUser.organizationId,
    orgName: dbUser.organization.name,
    strictMode: dbUser.organization.strictMode,
    teamId: dbUser.teamId,
    teamName: dbUser.team?.name || null,
  };
}
