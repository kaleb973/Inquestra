"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: active session required.");
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, organizationId: true, role: true },
  });

  if (!dbUser) {
    throw new Error("User record not found.");
  }

  return dbUser;
}

export async function getInventoryLocations(_organizationId?: string) {
  const dbUser = await getAuthenticatedUser();

  return await prisma.storageLocation.findMany({
    where: { organizationId: dbUser.organizationId, parentId: null },
    include: {
      children: {
        include: {
          children: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getInventoryItems(_organizationId?: string) {
  const dbUser = await getAuthenticatedUser();

  return await prisma.inventoryItem.findMany({
    where: { organizationId: dbUser.organizationId },
    include: { location: true },
    orderBy: { updatedAt: "desc" },
  });
}

const CreateInventorySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum([
    "CHEMICAL",
    "BIOLOGICAL",
    "REAGENT",
    "PLASMID",
    "CELL_LINE",
    "CONSUMABLE",
  ]),
  quantity: z.number().finite().nonnegative(),
  unit: z.string().min(1).max(30),
  locationId: z.string().uuid().optional().nullable(),
});

export async function createInventoryItem(data: {
  name: string;
  type: "CHEMICAL" | "BIOLOGICAL" | "REAGENT" | "PLASMID" | "CELL_LINE" | "CONSUMABLE";
  quantity: number;
  unit: string;
  organizationId?: string;
  locationId?: string | null;
  userId?: string;
}) {
  const dbUser = await getAuthenticatedUser();
  if (dbUser.role === "VIEWER") {
    throw new Error("Permission denied: viewers cannot create inventory items.");
  }
  const validated = CreateInventorySchema.parse(data);

  const cleanName = DOMPurify.sanitize(validated.name.trim());
  const cleanUnit = DOMPurify.sanitize(validated.unit.trim());

  if (validated.locationId) {
    const loc = await prisma.storageLocation.findFirst({
      where: {
        id: validated.locationId,
        organizationId: dbUser.organizationId,
      },
    });
    if (!loc) {
      throw new Error("Target storage location not found in this organization.");
    }
  }

  const item = await prisma.inventoryItem.create({
    data: {
      name: cleanName,
      type: validated.type,
      quantity: validated.quantity,
      unit: cleanUnit,
      organizationId: dbUser.organizationId,
      locationId: validated.locationId || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "INVENTORY_CREATED",
      entityType: "InventoryItem",
      entityId: item.id,
      details: { name: item.name, quantity: item.quantity, unit: item.unit },
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
    },
  });

  revalidatePath("/app/admin");
  return item;
}

const DeductInventorySchema = z.object({
  itemId: z.string().uuid(),
  amount: z.number().positive().finite(),
  trialId: z.string(),
});

export async function deductInventory(data: {
  itemId: string;
  amount: number;
  trialId: string;
  userId?: string;
  organizationId?: string;
}) {
  const dbUser = await getAuthenticatedUser();
  if (dbUser.role === "VIEWER") {
    throw new Error("Permission denied: viewers cannot deduct lab inventory.");
  }
  const validated = DeductInventorySchema.parse(data);

  const item = await prisma.inventoryItem.findFirst({
    where: {
      id: validated.itemId,
      organizationId: dbUser.organizationId,
    },
  });
  if (!item) throw new Error("Item not found or access denied.");

  // Verify trial ownership & immutability if not local
  const isCloudTrial = Boolean(validated.trialId && validated.trialId !== "local");
  if (isCloudTrial) {
    const trial = await prisma.trial.findFirst({
      where: {
        id: validated.trialId,
        project: { organizationId: dbUser.organizationId },
      },
      select: { id: true, status: true, checksum: true },
    });
    if (!trial) {
      throw new Error("Target trial not found in this organization.");
    }
    if (trial.status === "COMPLETED" || trial.checksum !== null) {
      throw new Error("Immutable Record: Cannot deduct inventory onto a completed or sealed trial.");
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const decremented = await tx.inventoryItem.updateMany({
      where: {
        id: item.id,
        organizationId: dbUser.organizationId,
        quantity: { gte: validated.amount },
      },
      data: { quantity: { decrement: validated.amount } },
    });
    if (decremented.count === 0) {
      throw new Error("Insufficient quantity in stock.");
    }

    const freshItem = await tx.inventoryItem.findUniqueOrThrow({
      where: { id: item.id },
    });

    if (isCloudTrial) {
      await tx.trialInventory.upsert({
        where: {
          trialId_inventoryItemId: {
            trialId: validated.trialId,
            inventoryItemId: item.id,
          },
        },
        create: {
          trialId: validated.trialId,
          inventoryItemId: item.id,
          quantityUsed: validated.amount,
          unit: item.unit,
        },
        update: {
          quantityUsed: { increment: validated.amount },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "INVENTORY_DEDUCTED",
        entityType: "InventoryItem",
        entityId: item.id,
        details: {
          amount: validated.amount,
          trial: validated.trialId,
          remaining: freshItem.quantity,
        },
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
      },
    });

    return freshItem;
  });

  revalidatePath("/app/admin");
  return updated;
}
