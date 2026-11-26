"use server";
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ReagentSchema = z.object({
  chemical: z.string().min(1).max(200),
  quantity: z.number().positive().finite().max(1_000_000),
  unit: z.string().min(1).max(20),
  trialId: z.string().min(1).max(128),
});

export type ReagentPayload = z.infer<typeof ReagentSchema>;

export async function deductReagent(payload: ReagentPayload) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const validated = ReagentSchema.parse(payload);
  const cleanChemical = DOMPurify.sanitize(validated.chemical.trim(), { ALLOWED_TAGS: [] });
  const cleanUnit = DOMPurify.sanitize(validated.unit.trim(), { ALLOWED_TAGS: [] });
  if (!cleanChemical || !cleanUnit) {
    return { success: false, error: 'Valid chemical name and unit are required.' };
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { organization: { select: { id: true, strictMode: true } } },
  });
  if (!dbUser) throw new Error('User not found in DB');

  if (dbUser.role === 'VIEWER') {
    return { success: false, error: 'Permission denied: viewers cannot deduct lab inventory.' };
  }

  // Validate target trial ownership & immutability BEFORE modifying stock
  const isCloudTrial = Boolean(validated.trialId && validated.trialId !== 'local');
  if (isCloudTrial) {
    const trial = await prisma.trial.findFirst({
      where: {
        id: validated.trialId,
        project: { organizationId: dbUser.organizationId },
      },
      select: { id: true, status: true, checksum: true },
    });
    if (!trial) {
      return { success: false, error: 'Target trial not found in your organization.' };
    }
    if (trial.status === 'COMPLETED' || trial.checksum !== null) {
      return {
        success: false,
        error: 'Immutable Record: Cannot log reagent deductions onto a sealed or completed trial.',
      };
    }
  }

  const isStrictMode = !!dbUser.organization.strictMode;

  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: {
      name: {
        equals: cleanChemical,
        mode: 'insensitive',
      },
      organizationId: dbUser.organizationId,
    },
  });

  if (!inventoryItem) {
    if (isStrictMode) {
      return {
        success: false,
        error: `Strict Mode Enforcement: "${cleanChemical}" is not in approved lab inventory. Unregistered reagents cannot be logged under strict compliance mode.`,
      };
    }

    const newItem = await prisma.$transaction(async (tx) => {
      const created = await tx.inventoryItem.create({
        data: {
          name: cleanChemical,
          type: 'CHEMICAL',
          quantity: -validated.quantity,
          unit: cleanUnit,
          thresholdValue: 0,
          organizationId: dbUser.organizationId,
        },
      });

      if (isCloudTrial) {
        await tx.trialInventory.upsert({
          where: {
            trialId_inventoryItemId: {
              trialId: validated.trialId,
              inventoryItemId: created.id,
            },
          },
          create: {
            trialId: validated.trialId,
            inventoryItemId: created.id,
            quantityUsed: validated.quantity,
            unit: cleanUnit,
          },
          update: {
            quantityUsed: { increment: validated.quantity },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: dbUser.id,
          organizationId: dbUser.organizationId,
          action: 'REAGENT_DEDUCTED',
          entityType: 'InventoryItem',
          entityId: created.id,
          details: { message: `Deficit logged for ${cleanChemical}` },
        },
      });

      return created;
    });

    return {
      success: true,
      alert: true,
      remaining: newItem.quantity,
      unit: cleanUnit,
      chemical: cleanChemical,
      message: 'Reagent not in inventory - deficit logged.',
    };
  }

  // Atomic stock deduction inside transaction (prevents TOCTOU overdrafts in strict mode)
  const txResult = await prisma.$transaction(async (tx) => {
    let updatedItemQuantity: number;

    if (isStrictMode) {
      const decremented = await tx.inventoryItem.updateMany({
        where: {
          id: inventoryItem.id,
          organizationId: dbUser.organizationId,
          quantity: { gte: validated.quantity },
        },
        data: {
          quantity: { decrement: validated.quantity },
        },
      });

      if (decremented.count === 0) {
        const fresh = await tx.inventoryItem.findUnique({
          where: { id: inventoryItem.id },
          select: { quantity: true, unit: true, name: true },
        });
        return {
          overdraft: true as const,
          available: fresh?.quantity ?? inventoryItem.quantity,
          unit: fresh?.unit ?? inventoryItem.unit,
          name: fresh?.name ?? inventoryItem.name,
        };
      }

      const fresh = await tx.inventoryItem.findUniqueOrThrow({
        where: { id: inventoryItem.id },
        select: { quantity: true },
      });
      updatedItemQuantity = fresh.quantity;
    } else {
      const updated = await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          quantity: { decrement: validated.quantity },
        },
        select: { quantity: true },
      });
      updatedItemQuantity = updated.quantity;
    }

    if (isCloudTrial) {
      await tx.trialInventory.upsert({
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
          unit: cleanUnit,
        },
        update: {
          quantityUsed: {
            increment: validated.quantity,
          },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: dbUser.id,
        organizationId: inventoryItem.organizationId,
        action: 'REAGENT_DEDUCTED',
        entityType: 'InventoryItem',
        entityId: inventoryItem.id,
        details: {
          message: `Deducted ${validated.quantity} ${cleanUnit} for Trial ${validated.trialId}. Remaining: ${updatedItemQuantity}`,
        },
      },
    });

    return {
      overdraft: false as const,
      newQuantity: updatedItemQuantity,
    };
  });

  if (txResult.overdraft) {
    return {
      success: false,
      error: `Strict Mode Enforcement: Overdraft blocked for "${txResult.name}". Requested ${validated.quantity} ${cleanUnit}, but only ${txResult.available} ${txResult.unit} remain in approved stock.`,
    };
  }

  const shouldAlert = txResult.newQuantity < inventoryItem.thresholdValue;

  return {
    success: true,
    alert: shouldAlert,
    remaining: txResult.newQuantity,
    unit: inventoryItem.unit,
    chemical: cleanChemical,
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
