'use server';
// src/actions/reagentActions.ts
// Phase 4 — Autonomous reagent inventory deduction triggered by /reagent slash command.

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

/**
 * Deducts reagent from the Inventory table.
 * Sets alertFlag if remaining stock < thresholdValue.
 */
export async function deductReagent(payload: ReagentPayload) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const validated = ReagentSchema.parse(payload);

  // Find the inventory record (scoped to org via RLS)
  const inventory = await prisma.inventory.findFirst({
    where: {
      chemical: {
        equals: validated.chemical,
        mode: 'insensitive',
      },
    },
  });

  if (!inventory) {
    // Create a new inventory record if not found
    await prisma.inventory.create({
      data: {
        chemical: validated.chemical,
        quantity: -validated.quantity, // Negative = deficit, triggers alert
        unit: validated.unit,
        thresholdValue: 0,
        alertFlag: true,
      },
    });
    return { success: true, alert: true, message: 'Reagent not in inventory — deficit logged.' };
  }

  const newQuantity = inventory.quantity - validated.quantity;
  const shouldAlert = newQuantity < inventory.thresholdValue;

  await prisma.inventory.update({
    where: { id: inventory.id },
    data: {
      quantity: newQuantity,
      alertFlag: shouldAlert,
    },
  });

  return {
    success: true,
    alert: shouldAlert,
    remaining: newQuantity,
    unit: inventory.unit,
    chemical: validated.chemical,
  };
}
