"use server";
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function logAuditAction(userId: string, organizationId: string, action: string, details: string) {
  try {
    await prisma.auditLog.create({
      data: { 
        userId, 
        organizationId, 
        action, 
        details: { message: details },
        entityType: "AdminAction",
        entityId: "global"
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

export async function addInventoryItem(formData: FormData) {
  const { dbUser, error } = await verifyAdminAccess();
  if (error || !dbUser) return { success: false, error };

  const chemical = formData.get('chemical') as string;
  const quantity = parseFloat(formData.get('quantity') as string);
  const unit = formData.get('unit') as string;

  try {
    await prisma.inventoryItem.create({
      data: {
        name: chemical,
        type: "CHEMICAL",
        quantity,
        unit,
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
