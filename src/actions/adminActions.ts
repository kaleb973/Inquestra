'use server';
// src/actions/adminActions.ts

import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper to log audit actions
async function logAuditAction(userId: string, organizationId: string, action: string, details: string) {
  try {
    await prisma.auditLog.create({
      data: { userId, organizationId, action, details },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// Helper to verify admin/PI access
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

// -- Inventory Actions --

export async function addInventoryItem(formData: FormData) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const chemical = formData.get('chemical') as string;
  const quantity = parseFloat(formData.get('quantity') as string);
  const unit = formData.get('unit') as string;
  const thresholdValue = parseFloat(formData.get('thresholdValue') as string);

  try {
    await prisma.inventory.create({
      data: {
        chemical,
        quantity,
        unit,
        thresholdValue,
        organizationId: dbUser.organizationId,
      },
    });
    await logAuditAction(dbUser.id, dbUser.organizationId, 'INVENTORY_ADDED', `Added ${quantity} ${unit} of ${chemical}`);
    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateInventoryStock(id: string, newQuantity: number) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  try {
    const item = await prisma.inventory.findUnique({ where: { id } });
    if (item?.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.inventory.update({
      where: { id },
      data: {
        quantity: newQuantity,
        alertFlag: newQuantity <= (item.thresholdValue ?? 0),
      },
    });
    await logAuditAction(dbUser.id, dbUser.organizationId, 'INVENTORY_UPDATED', `Updated ${item.chemical} stock from ${item.quantity} to ${newQuantity}`);
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
    const item = await prisma.inventory.findUnique({ where: { id } });
    if (item?.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Unauthorized' };
    }
    await prisma.inventory.delete({ where: { id } });
    await logAuditAction(dbUser.id, dbUser.organizationId, 'INVENTORY_DELETED', `Deleted ${item.chemical} from inventory`);
    revalidatePath('/app/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -- Equipment Actions --

export async function addEquipment(formData: FormData) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const name = formData.get('name') as string;
  const serialNumber = formData.get('serialNumber') as string;
  const lastCalibrated = new Date(formData.get('lastCalibrated') as string);
  const calibrationFreq = parseInt(formData.get('calibrationFreq') as string, 10);
  const status = formData.get('status') as string;

  try {
    await prisma.equipment.create({
      data: {
        name,
        serialNumber,
        lastCalibrated,
        calibrationFreq,
        status,
        organizationId: dbUser.organizationId,
      },
    });
    await logAuditAction(dbUser.id, dbUser.organizationId, 'EQUIPMENT_ADDED', `Added equipment ${name} (SN: ${serialNumber})`);
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
    if (item?.organizationId !== dbUser.organizationId) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.equipment.update({
      where: { id },
      data: {
        status,
        ...(calibratedNow ? { lastCalibrated: new Date() } : {}),
      },
    });
    const details = calibratedNow ? `Calibrated equipment ${item.name} and set status to ${status}` : `Updated equipment ${item.name} status to ${status}`;
    await logAuditAction(dbUser.id, dbUser.organizationId, 'EQUIPMENT_UPDATED', details);
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
    await logAuditAction(dbUser.id, dbUser.organizationId, 'STRICT_MODE_TOGGLED', `Set strictMode to ${enabled}`);
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

  // Also check if any equipment is overdue
  const now = new Date();
  const equipment = await prisma.equipment.findMany({
    where: { organizationId: dbUser.organizationId }
  });
  const overdue = equipment.filter(e => {
    const nextDue = new Date(e.lastCalibrated);
    nextDue.setDate(nextDue.getDate() + e.calibrationFreq);
    return now > nextDue;
  });

  if (brokenEquipment.length > 0 || overdue.length > 0) {
    return {
      compliant: false,
      reason: `Strict Mode: Data acquisition blocked. ${brokenEquipment.length + overdue.length} equipment item(s) are broken or overdue for calibration.`
    };
  }

  return { compliant: true };
}
