"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getInventoryLocations(organizationId: string) {
  return await prisma.storageLocation.findMany({
    where: { organizationId, parentId: null },
    include: {
      children: {
        include: {
          children: true
        }
      }
    }
  });
}

export async function getInventoryItems(organizationId: string) {
  return await prisma.inventoryItem.findMany({
    where: { organizationId },
    include: { location: true },
    orderBy: { updatedAt: "desc" }
  });
}

export async function createInventoryItem(data: {
  name: string;
  type: "CHEMICAL" | "BIOLOGICAL" | "REAGENT" | "PLASMID" | "CELL_LINE" | "CONSUMABLE";
  quantity: number;
  unit: string;
  organizationId: string;
  locationId?: string;
  userId: string;
}) {
  const item = await prisma.inventoryItem.create({
    data: {
      name: data.name,
      type: data.type,
      quantity: data.quantity,
      unit: data.unit,
      organizationId: data.organizationId,
      locationId: data.locationId
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "INVENTORY_CREATED",
      entityType: "InventoryItem",
      entityId: item.id,
      details: { name: item.name, quantity: item.quantity, unit: item.unit },
      userId: data.userId,
      organizationId: data.organizationId
    }
  });

  revalidatePath("/app/admin");
  return item;
}

export async function deductInventory(data: {
  itemId: string;
  amount: number;
  trialId: string;
  userId: string;
  organizationId: string;
}) {
  const item = await prisma.inventoryItem.findUnique({ where: { id: data.itemId } });
  if (!item) throw new Error("Item not found");
  if (item.quantity < data.amount) throw new Error("Insufficient quantity");

  const updated = await prisma.inventoryItem.update({
    where: { id: data.itemId },
    data: { quantity: item.quantity - data.amount }
  });

  await prisma.trialInventory.create({
    data: {
      trialId: data.trialId,
      inventoryItemId: data.itemId,
      quantityUsed: data.amount,
      unit: item.unit
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "INVENTORY_DEDUCTED",
      entityType: "InventoryItem",
      entityId: item.id,
      details: { amount: data.amount, trial: data.trialId },
      userId: data.userId,
      organizationId: data.organizationId
    }
  });

  revalidatePath("/app/admin");
  return updated;
}
