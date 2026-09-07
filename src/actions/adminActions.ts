'use server';
// src/actions/adminActions.ts

import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
    revalidatePath('/admin');
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
    revalidatePath('/admin');
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
    revalidatePath('/admin');
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
    revalidatePath('/admin');
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
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
