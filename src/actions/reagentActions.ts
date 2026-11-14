"use server";
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ReagentSchema = z.object({
  chemical: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
  trialId: z.string(),
});

export type ReagentPayload = z.infer<typeof ReagentSchema>;

export async function deductReagent(payload: ReagentPayload) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const validated = ReagentSchema.parse(payload);
  
  const dbUser = await prisma.user.findUnique({ 
    where: { authId: user.id },
    include: { organization: { select: { id: true, strictMode: true } } }
  });
  if (!dbUser) throw new Error('User not found in DB');

  const isStrictMode = !!dbUser.organization.strictMode;

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
    if (isStrictMode) {
      return {
        success: false,
        error: `Strict Mode Enforcement: "${validated.chemical}" is not in approved lab inventory. Unregistered reagents cannot be logged under strict compliance mode.`
      };
    }

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

  // If item exists, check for overdraft in Strict Mode
  if (isStrictMode && inventoryItem.quantity < validated.quantity) {
    return {
      success: false,
      error: `Strict Mode Enforcement: Overdraft blocked for "${inventoryItem.name}". Requested ${validated.quantity} ${validated.unit}, but only ${inventoryItem.quantity} ${inventoryItem.unit} remain in approved stock.`
    };
  }

  const newQuantity = inventoryItem.quantity - validated.quantity;
  const shouldAlert = newQuantity < inventoryItem.thresholdValue;

  await prisma.inventoryItem.update({
    where: { id: inventoryItem.id },
    data: {
      quantity: newQuantity,
    },
  });

  // Link deduction to TrialInventory for traceability if trialId is valid
  if (validated.trialId && validated.trialId !== 'local') {
    const trialExists = await prisma.trial.findUnique({
      where: { id: validated.trialId }
    });
    if (trialExists) {
      await prisma.trialInventory.upsert({
        where: {
          trialId_inventoryItemId: {
            trialId: validated.trialId,
            inventoryItemId: inventoryItem.id,
          },
        },
        create: {
          trialId: validated.trialId,
          inventoryItemId: inventoryItem.id,
          quantityUsed: validated.quantity,
          unit: validated.unit,
        },
        update: {
          quantityUsed: {
            increment: validated.quantity,
          },
        },
      });
    }
  }

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

export async function getTrialInventory(trialId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return [];

  // Security: Ensure the trial belongs to the user's org
  const trial = await prisma.trial.findFirst({
    where: {
      id: trialId,
      project: {
        organizationId: dbUser.organizationId
      }
    }
  });

  if (!trial) return [];

  return await prisma.trialInventory.findMany({
    where: { trialId },
    include: {
      inventoryItem: {
        include: {
          location: { select: { name: true } }
        }
      }
    },
    orderBy: { inventoryItem: { name: 'asc' } }
  });
}
