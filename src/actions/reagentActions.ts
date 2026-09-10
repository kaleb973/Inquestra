"use server";
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ReagentSchema = z.object({
  chemical: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
  trialId: z.string().uuid(),
});

export type ReagentPayload = z.infer<typeof ReagentSchema>;

export async function deductReagent(payload: ReagentPayload) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const validated = ReagentSchema.parse(payload);
  
  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found in DB');

  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: {
      name: {
        equals: validated.chemical,
        mode: 'insensitive',
      },
      organizationId: dbUser.organizationId
    },
  });

  if (!inventoryItem) {
    const newItem = await prisma.inventoryItem.create({
      data: {
        name: validated.chemical,
        type: 'CHEMICAL',
        quantity: -validated.quantity,
        unit: validated.unit,
        thresholdValue: 0,
        organizationId: dbUser.organizationId
      },
    });
    
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
        action: 'REAGENT_DEDUCTED',
        entityType: 'InventoryItem',
        entityId: newItem.id,
        details: { message: `Deficit logged for ${validated.chemical}` }
      },
    });

    return { success: true, alert: true, message: 'Reagent not in inventory - deficit logged.' };
  }

  const newQuantity = inventoryItem.quantity - validated.quantity;
  const shouldAlert = newQuantity < inventoryItem.thresholdValue;

  await prisma.inventoryItem.update({
    where: { id: inventoryItem.id },
    data: {
      quantity: newQuantity,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: inventoryItem.organizationId,
      action: 'REAGENT_DEDUCTED',
      entityType: 'InventoryItem',
      entityId: inventoryItem.id,
      details: {
        message: `Deducted ${validated.quantity} ${validated.unit} for Trial ${validated.trialId}. Remaining: ${newQuantity}`
      }
    },
  });

  return {
    success: true,
    alert: shouldAlert,
    remaining: newQuantity,
    unit: inventoryItem.unit,
    chemical: validated.chemical,
  };
}
