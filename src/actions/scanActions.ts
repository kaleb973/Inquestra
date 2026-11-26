"use server";
// src/actions/scanActions.ts
// Universal scan and barcode resolution server action.
// Resolves physical QR codes and barcode strings across Inventory, Storage, and Equipment.
// Formats safe public dossiers for mobile camera scans and deep-links for logged-in members.

import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export type ScanResult =
  | {
      found: true;
      kind: 'inventory';
      id: string;
      name: string;
      type: string;
      lotNumber: string | null;
      barcode: string | null;
      quantity: number;
      unit: string;
      isLowStock: boolean;
      expirationDate: string | null;
      isExpired: boolean;
      isExpiringSoon: boolean;
      locationPath: string[];
      organizationName: string;
      isMember: boolean;
      adminUrl: string;
    }
  | {
      found: true;
      kind: 'storage';
      id: string;
      name: string;
      type: string;
      barcode: string | null;
      locationPath: string[];
      organizationName: string;
      containedItemsCount: number;
      containedLocationsCount: number;
      isMember: boolean;
      adminUrl: string;
    }
  | {
      found: true;
      kind: 'equipment';
      id: string;
      name: string;
      serialNumber: string | null;
      barcode: string | null;
      status: string;
      lastCalibrated: string;
      calibrationDueDate: string;
      isCalibrationDue: boolean;
      organizationName: string;
      isMember: boolean;
      adminUrl: string;
    }
  | {
      found: false;
      code: string;
      error?: string;
    };

type NestedLocation = {
  name: string;
  parent?: {
    name: string;
    parent?: {
      name: string;
      parent?: {
        name: string;
      } | null;
    } | null;
  } | null;
};

function extractLocationPath(loc: NestedLocation | null | undefined): string[] {
  if (!loc) return [];
  const path: string[] = [];
  let current: NestedLocation | null | undefined = loc;
  while (current) {
    path.unshift(current.name);
    current = current.parent;
  }
  return path;
}

export async function resolveScanCode(rawCode: string): Promise<ScanResult> {
  const code = rawCode.trim();
  if (!code || code.length > 128) {
    return { found: false, code: code.slice(0, 128), error: 'No valid barcode or identifier provided.' };
  }

  try {
    const reqHeaders = await headers();
    const clientIp = getClientIp(reqHeaders);
    const rate = checkRateLimit(`scan:${clientIp}`, 60, 60_000);
    if (!rate.success) {
      return {
        found: false,
        code,
        error: `Rate limit exceeded. Try again in ${rate.retryAfterSeconds ?? 60} seconds.`,
      };
    }
  } catch {
    // Non-request context fallback
  }

  // Check optional user session for member permissions
  let memberOrgId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
        select: { organizationId: true },
      });
      if (dbUser) {
        memberOrgId = dbUser.organizationId;
      }
    }
  } catch {
    // Unauthenticated request (e.g. anonymous mobile camera scan)
    memberOrgId = null;
  }

  // 1. Search InventoryItem by barcode OR id
  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: {
      OR: [{ barcode: code }, { id: code }],
    },
    include: {
      organization: { select: { id: true, name: true } },
      location: {
        include: {
          parent: {
            include: {
              parent: {
                include: {
                  parent: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (inventoryItem) {
    const isMember = memberOrgId === inventoryItem.organizationId;
    const now = Date.now();
    const expTime = inventoryItem.expirationDate
      ? new Date(inventoryItem.expirationDate).getTime()
      : null;
    const daysUntilExp = expTime !== null ? (expTime - now) / (1000 * 60 * 60 * 24) : null;
    const isExpired = daysUntilExp !== null && daysUntilExp <= 0;
    const isExpiringSoon = daysUntilExp !== null && daysUntilExp > 0 && daysUntilExp <= 30;
    const isLowStock = inventoryItem.quantity < inventoryItem.thresholdValue;

    return {
      found: true,
      kind: 'inventory',
      id: inventoryItem.id,
      name: inventoryItem.name,
      type: inventoryItem.type,
      lotNumber: inventoryItem.lotNumber,
      barcode: inventoryItem.barcode,
      quantity: inventoryItem.quantity,
      unit: inventoryItem.unit,
      isLowStock,
      expirationDate: inventoryItem.expirationDate
        ? inventoryItem.expirationDate.toISOString()
        : null,
      isExpired,
      isExpiringSoon,
      locationPath: extractLocationPath(inventoryItem.location),
      organizationName: inventoryItem.organization.name,
      isMember,
      adminUrl: `/app/admin?tab=inventory&id=${inventoryItem.id}`,
    };
  }

  // 2. Search StorageLocation by barcode OR id
  const storageLocation = await prisma.storageLocation.findFirst({
    where: {
      OR: [{ barcode: code }, { id: code }],
    },
    include: {
      organization: { select: { id: true, name: true } },
      items: { select: { id: true } },
      children: { select: { id: true } },
      parent: {
        include: {
          parent: {
            include: {
              parent: true,
            },
          },
        },
      },
    },
  });

  if (storageLocation) {
    const isMember = memberOrgId === storageLocation.organizationId;
    const locationPath = extractLocationPath(storageLocation);

    return {
      found: true,
      kind: 'storage',
      id: storageLocation.id,
      name: storageLocation.name,
      type: storageLocation.type,
      barcode: storageLocation.barcode,
      locationPath,
      organizationName: storageLocation.organization.name,
      containedItemsCount: storageLocation.items.length,
      containedLocationsCount: storageLocation.children.length,
      isMember,
      adminUrl: `/app/admin?tab=storage&id=${storageLocation.id}`,
    };
  }

  // 3. Search Equipment by barcode OR id
  const equipment = await prisma.equipment.findFirst({
    where: {
      OR: [{ barcode: code }, { id: code }],
    },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  if (equipment) {
    const isMember = memberOrgId === equipment.organizationId;
    const calDate = new Date(equipment.lastCalibrated);
    const dueDate = new Date(calDate.getTime() + equipment.calibrationFreq * 24 * 60 * 60 * 1000);
    const isCalibrationDue = Date.now() > dueDate.getTime();

    return {
      found: true,
      kind: 'equipment',
      id: equipment.id,
      name: equipment.name,
      serialNumber: equipment.serialNumber,
      barcode: equipment.barcode,
      status: equipment.status,
      lastCalibrated: equipment.lastCalibrated.toISOString(),
      calibrationDueDate: dueDate.toISOString(),
      isCalibrationDue,
      organizationName: equipment.organization.name,
      isMember,
      adminUrl: `/app/admin?tab=equipment&id=${equipment.id}`,
    };
  }

  return {
    found: false,
    code,
    error: `No specimen, freezer location, or equipment found matching code "${code}".`,
  };
}
