"use server";
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Role, Prisma, InventoryType } from '@prisma/client';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const InventoryTypeSchema = z.enum([
  'CHEMICAL',
  'BIOLOGICAL',
  'REAGENT',
  'PLASMID',
  'CELL_LINE',
  'CONSUMABLE',
]);
const EquipmentStatusSchema = z.enum(['OPERATIONAL', 'MAINTENANCE', 'BROKEN']);
const MemberRoleSchema = z.enum(['PI', 'ADMIN', 'RESEARCHER', 'VIEWER']);
const StorageTypeSchema = z.enum(['FREEZER', 'RACK', 'BOX', 'SHELF', 'ROOM']);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export async function addInventoryItem(formData: FormData) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const name = DOMPurify.sanitize((formData.get('name') as string) || '', { ALLOWED_TAGS: [] }).trim();
  if (!name) return { success: false, error: 'Item name is required.' };

  const parsedType = InventoryTypeSchema.safeParse((formData.get('type') as string) || 'CHEMICAL');
  if (!parsedType.success) {
    return { success: false, error: 'Invalid inventory type.' };
  }
  const type: InventoryType = parsedType.data;

  const lotNumber = DOMPurify.sanitize((formData.get('lotNumber') as string) || '', { ALLOWED_TAGS: [] }).trim();
  const barcode = DOMPurify.sanitize((formData.get('barcode') as string) || '', { ALLOWED_TAGS: [] }).trim();
  const quantity = parseFloat(formData.get('quantity') as string);
  const unit = DOMPurify.sanitize((formData.get('unit') as string) || '', { ALLOWED_TAGS: [] }).trim();
  if (!unit) return { success: false, error: 'Unit is required.' };

  const thresholdValue = parseFloat((formData.get('thresholdValue') as string) || '0');

  if (isNaN(quantity) || !Number.isFinite(quantity) || quantity < 0) {
    return { success: false, error: 'Quantity must be a non-negative finite number.' };
  }
  if (isNaN(thresholdValue) || !Number.isFinite(thresholdValue) || thresholdValue < 0) {
    return { success: false, error: 'Threshold value must be a non-negative finite number.' };
  }

  const expDateStr = (formData.get('expirationDate') as string | null)?.trim() || '';
  const expirationDate = expDateStr ? new Date(expDateStr) : null;
  if (expirationDate && isNaN(expirationDate.getTime())) {
    return { success: false, error: 'Invalid expiration date.' };
  }

  const rawLocationId = (formData.get('locationId') as string | null)?.trim() || '';
  const locationId = rawLocationId || null;

  try {
    if (locationId) {
      if (!UUID_REGEX.test(locationId)) {
        return { success: false, error: 'Invalid storage location identifier.' };
      }
      const loc = await prisma.storageLocation.findFirst({
        where: { id: locationId, organizationId: dbUser.organizationId },
        select: { id: true },
      });
      if (!loc) {
        return { success: false, error: 'Selected storage location was not found in your organization.' };
      }
    }

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
  } catch (err: unknown) {
    console.error('[adminActions.addInventoryItem]', err);
    return { success: false, error: 'Failed to add inventory item.' };
  }
}

export async function addStorageLocation(formData: FormData) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const name = DOMPurify.sanitize((formData.get('name') as string) || '', { ALLOWED_TAGS: [] }).trim();
  if (!name) return { success: false, error: 'Location name is required.' };

  const parsedType = StorageTypeSchema.safeParse(((formData.get('type') as string) || 'FREEZER').trim());
  if (!parsedType.success) {
    return { success: false, error: 'Invalid storage location type.' };
  }
  const type = parsedType.data;

  const barcode = DOMPurify.sanitize((formData.get('barcode') as string) || '', { ALLOWED_TAGS: [] }).trim();
  const rawParentId = (formData.get('parentId') as string | null)?.trim() || '';
  const parentId = rawParentId || null;

  try {
    if (parentId) {
      if (!UUID_REGEX.test(parentId)) {
        return { success: false, error: 'Invalid parent location identifier.' };
      }
      const parentLoc = await prisma.storageLocation.findFirst({
        where: { id: parentId, organizationId: dbUser.organizationId },
        select: { id: true },
      });
      if (!parentLoc) {
        return { success: false, error: 'Parent storage location not found in your organization.' };
      }
    }

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
  } catch (err: unknown) {
    console.error('[adminActions.addStorageLocation]', err);
    return { success: false, error: 'Failed to add storage location.' };
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

  if (typeof newQuantity !== 'number' || isNaN(newQuantity) || !Number.isFinite(newQuantity) || newQuantity < 0) {
    return { success: false, error: 'Stock quantity must be a non-negative finite number.' };
  }

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
  } catch (err: unknown) {
    console.error('[adminActions.updateInventoryStock]', err);
    return { success: false, error: 'Failed to update stock quantity.' };
  }
}

export async function updateInventoryBarcode(id: string, newBarcode: string) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const sanitized = DOMPurify.sanitize(newBarcode, { ALLOWED_TAGS: [] }).trim();

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
  } catch (err: unknown) {
    console.error('[adminActions.updateInventoryBarcode]', err);
    return { success: false, error: 'Failed to update inventory barcode.' };
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
  } catch (err: unknown) {
    console.error('[adminActions.deleteInventoryItem]', err);
    return { success: false, error: 'Failed to delete inventory item.' };
  }
}

export async function addEquipment(formData: FormData) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const name = DOMPurify.sanitize((formData.get('name') as string) || '', { ALLOWED_TAGS: [] }).trim();
  if (!name) return { success: false, error: 'Equipment name is required.' };

  const serialNumber = DOMPurify.sanitize((formData.get('serialNumber') as string) || '', { ALLOWED_TAGS: [] }).trim();
  const barcode = DOMPurify.sanitize((formData.get('barcode') as string) || '', { ALLOWED_TAGS: [] }).trim();
  const lastCalibrated = new Date(formData.get('lastCalibrated') as string);
  if (isNaN(lastCalibrated.getTime())) {
    return { success: false, error: 'Invalid calibration date.' };
  }

  const calibrationFreq = parseInt(formData.get('calibrationFreq') as string, 10);
  const parsedStatus = EquipmentStatusSchema.safeParse(((formData.get('status') as string) || 'OPERATIONAL').trim());
  if (!parsedStatus.success) {
    return { success: false, error: 'Invalid equipment status.' };
  }
  const status = parsedStatus.data;

  if (isNaN(calibrationFreq) || calibrationFreq < 1 || calibrationFreq > 3650) {
    return { success: false, error: 'Calibration frequency must be an integer between 1 and 3650 days.' };
  }

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
  } catch (err: unknown) {
    console.error('[adminActions.addEquipment]', err);
    return { success: false, error: 'Failed to register equipment.' };
  }
}

export async function updateEquipmentStatus(id: string, status: string, calibratedNow: boolean = false) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const parsedStatus = EquipmentStatusSchema.safeParse(status);
  if (!parsedStatus.success) {
    return { success: false, error: 'Invalid equipment status.' };
  }

  try {
    const item = await prisma.equipment.findUnique({ where: { id } });
    if (item?.organizationId !== dbUser.organizationId) return { success: false, error: 'Unauthorized' };

    await prisma.equipment.update({
      where: { id },
      data: {
        status: parsedStatus.data,
        ...(calibratedNow ? { lastCalibrated: new Date() } : {}),
      },
    });

    await logAuditAction(dbUser.id, dbUser.organizationId, 'EQUIPMENT_UPDATED', `Updated ${item.name}`);
    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: unknown) {
    console.error('[adminActions.updateEquipmentStatus]', err);
    return { success: false, error: 'Failed to update equipment status.' };
  }
}

export async function updateStrictMode(enabled: boolean) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  if (typeof enabled !== 'boolean') {
    return { success: false, error: 'Invalid strict mode flag.' };
  }

  try {
    await prisma.organization.update({
      where: { id: dbUser.organizationId },
      data: { strictMode: enabled },
    });
    await logAuditAction(dbUser.id, dbUser.organizationId, 'STRICT_MODE', `Strict mode ${enabled}`);
    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: unknown) {
    console.error('[adminActions.updateStrictMode]', err);
    return { success: false, error: 'Failed to update strict compliance mode.' };
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

  const parsedRole = MemberRoleSchema.safeParse(newRole);
  if (!parsedRole.success) {
    return { success: false, error: 'Invalid role requested.' };
  }
  const validatedRole = parsedRole.data;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Target user not found or unauthorized.' };
    }

    // Role Hierarchy Security Rule:
    // Only a PI can elevate another user to PI, or demote an existing PI.
    if ((validatedRole === 'PI' || targetUser.role === 'PI') && dbUser.role !== 'PI') {
      return {
        success: false,
        error: 'Principal Investigator role actions require an active PI credentials sign-off.',
      };
    }

    // Self-demotion guard
    if (targetUser.id === dbUser.id && (targetUser.role === 'PI' || targetUser.role === 'ADMIN') && validatedRole !== targetUser.role) {
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
      data: { role: validatedRole },
    });

    await logAuditAction(
      dbUser.id,
      dbUser.organizationId,
      'ROLE_UPDATED',
      `Elevated/adjusted role for ${targetUser.email} from ${targetUser.role} to ${validatedRole}`,
      'User',
      userId
    );

    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: unknown) {
    console.error('[adminActions.updateUserRole]', err);
    return { success: false, error: 'Failed to update role.' };
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
    const [requestLogs, resolutionLogs] = await Promise.all([
      prisma.auditLog.findMany({
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
      }),
      prisma.auditLog.findMany({
        where: {
          organizationId: dbUser.organizationId,
          action: 'AUTHORIZATION_RESOLVED',
          entityType: 'PermissionRequest',
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const resolutionMap = new Map<
      string,
      { status: 'APPROVED' | 'REJECTED'; resolvedBy?: string; resolvedAt?: string; resolutionNote?: string }
    >();
    for (const rLog of resolutionLogs) {
      if (resolutionMap.has(rLog.entityId)) continue;
      const d = (rLog.details as Record<string, unknown>) || {};
      const decision = d.status === 'APPROVED' || d.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
      resolutionMap.set(rLog.entityId, {
        status: decision,
        resolvedBy: typeof d.resolvedBy === 'string' ? d.resolvedBy : undefined,
        resolvedAt: typeof d.resolvedAt === 'string' ? d.resolvedAt : rLog.createdAt.toISOString(),
        resolutionNote: typeof d.resolutionNote === 'string' ? d.resolutionNote : undefined,
      });
    }

    const requests: AuthorizationRequest[] = [];

    for (const log of requestLogs) {
      if (!log.details || typeof log.details !== 'object') continue;
      const d = log.details as Record<string, unknown>;
      const reqId = (d.requestId as string) || log.entityId;
      const resolved = resolutionMap.get(reqId);

      const req: AuthorizationRequest = {
        id: log.id,
        requestId: reqId,
        requesterId: (d.requesterId as string) || log.userId,
        requesterEmail: (d.requesterEmail as string) || log.user?.email || 'Unknown User',
        requesterRole: (d.requesterRole as Role) || log.user?.role || 'VIEWER',
        requestType: (d.requestType as AuthorizationRequest['requestType']) || 'CUSTOM',
        requestedRole: (d.requestedRole as Role) || null,
        justification: (d.justification as string) || '',
        targetEntity: (d.targetEntity as string) || null,
        status: resolved?.status ?? ((d.status as AuthorizationRequest['status']) || 'PENDING'),
        resolvedBy: resolved?.resolvedBy ?? (d.resolvedBy as string | undefined),
        resolvedAt: resolved?.resolvedAt ?? (d.resolvedAt as string | undefined),
        resolutionNote: resolved?.resolutionNote ?? (d.resolutionNote as string | undefined),
        createdAt: log.createdAt.toISOString(),
      };

      requests.push(req);
    }

    return { success: true, requests };
  } catch (err: unknown) {
    console.error('[adminActions.fetchPendingAuthorizationRequests]', err);
    return { success: false, requests: [], error: 'Failed to fetch authorizations.' };
  }
}

export async function resolveAuthorizationRequest(
  requestId: string,
  decision: 'APPROVED' | 'REJECTED',
  resolutionNote?: string
) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  if (decision !== 'APPROVED' && decision !== 'REJECTED') {
    return { success: false, error: 'Invalid decision.' };
  }

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

    // Append-only ledger check: verify this request has not already been resolved
    const alreadyResolved = await prisma.auditLog.findFirst({
      where: {
        organizationId: dbUser.organizationId,
        action: 'AUTHORIZATION_RESOLVED',
        entityType: 'PermissionRequest',
        entityId: requestId,
      },
    });
    const currentDetails = (log.details as Record<string, unknown>) || {};
    if (alreadyResolved || (currentDetails.status && currentDetails.status !== 'PENDING')) {
      return { success: false, error: 'This authorization request has already been resolved.' };
    }

    const requesterId = currentDetails.requesterId as string;
    const requestType = currentDetails.requestType as string;
    const rawRequestedRole = currentDetails.requestedRole;
    const parsedRequestedRole = rawRequestedRole ? MemberRoleSchema.safeParse(rawRequestedRole) : null;
    const requestedRole = parsedRequestedRole?.success ? parsedRequestedRole.data : null;

    // Hierarchy check: Only PIs can approve elevation to PI
    if (decision === 'APPROVED' && requestType === 'ROLE_ELEVATION' && requestedRole === 'PI' && dbUser.role !== 'PI') {
      return {
        success: false,
        error: 'Only a Principal Investigator can approve elevation to PI.',
      };
    }

    const cleanResolutionNote = resolutionNote
      ? DOMPurify.sanitize(resolutionNote.trim(), { ALLOWED_TAGS: [] }).slice(0, 1000)
      : null;
    const resolvedAt = new Date().toISOString();

    await prisma.$transaction(async (tx) => {
      // Double-check inside transaction against concurrent resolution
      const concurrentResolution = await tx.auditLog.findFirst({
        where: {
          organizationId: dbUser.organizationId,
          action: 'AUTHORIZATION_RESOLVED',
          entityType: 'PermissionRequest',
          entityId: requestId,
        },
      });
      if (concurrentResolution) {
        throw new Error('Authorization request was already resolved.');
      }

      if (decision === 'APPROVED' && requestType === 'ROLE_ELEVATION' && requestedRole && requesterId) {
        const updatedUser = await tx.user.updateMany({
          where: { id: requesterId, organizationId: dbUser.organizationId },
          data: { role: requestedRole },
        });
        if (updatedUser.count === 0) {
          throw new Error('Requester no longer belongs to this organization.');
        }

        await tx.auditLog.create({
          data: {
            userId: dbUser.id,
            organizationId: dbUser.organizationId,
            action: 'ROLE_ELEVATED_BY_APPROVAL',
            entityType: 'User',
            entityId: requesterId,
            details: {
              message: `Approved elevation for user ${requesterId} to ${requestedRole}`,
            },
          },
        });
      }

      // Append-only resolution event (never mutates prior AuditLog rows)
      await tx.auditLog.create({
        data: {
          userId: dbUser.id,
          organizationId: dbUser.organizationId,
          action: 'AUTHORIZATION_RESOLVED',
          entityType: 'PermissionRequest',
          entityId: requestId,
          details: {
            message: `Decision [${decision}] on request ${requestId} by ${dbUser.email}`,
            requestId,
            decision,
            status: decision,
            resolvedBy: dbUser.email,
            resolvedAt,
            resolutionNote: cleanResolutionNote,
          },
        },
      });
    });

    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: unknown) {
    console.error('[adminActions.resolveAuthorizationRequest]', err);
    return { success: false, error: 'Failed to resolve request.' };
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
