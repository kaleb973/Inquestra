"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateTrialHash } from "@/lib/provenance";

export async function signAndSealTrial(data: {
  trialId: string;
  userId: string;
  organizationId: string;
  role: "AUTHOR" | "WITNESS" | "PI_APPROVAL";
  meaning: string;
}) {
  const trial = await prisma.trial.findUnique({
    where: { id: data.trialId },
    include: { metadata: true }
  });

  if (!trial) throw new Error("Trial not found");
  if (trial.status === "COMPLETED" && trial.checksum) {
    // If it's already sealed, we might just be adding a witness signature
    await prisma.signature.create({
      data: {
        trialId: trial.id,
        userId: data.userId,
        role: data.role,
        meaning: data.meaning
      }
    });

    await prisma.auditLog.create({
      data: {
        action: "SIGNATURE_ADDED",
        entityType: "Trial",
        entityId: trial.id,
        details: { role: data.role, meaning: data.meaning },
        userId: data.userId,
        organizationId: data.organizationId
      }
    });

    revalidatePath("/app/admin");
    return { success: true, message: "Witness signature applied." };
  }

  // If we are the primary author sealing it
  const timestamp = new Date().toISOString();
  const checksum = generateTrialHash(trial.content, trial.metadata, timestamp);

  await prisma.$transaction([
    prisma.trial.update({
      where: { id: trial.id },
      data: {
        status: "COMPLETED",
        checksum,
        sealedAt: timestamp,
        sealedBy: data.userId
      }
    }),
    prisma.signature.create({
      data: {
        trialId: trial.id,
        userId: data.userId,
        role: data.role,
        meaning: data.meaning
      }
    }),
    prisma.auditLog.create({
      data: {
        action: "TRIAL_SEALED",
        entityType: "Trial",
        entityId: trial.id,
        details: { checksum, role: data.role },
        userId: data.userId,
        organizationId: data.organizationId
      }
    })
  ]);

  revalidatePath("/app/admin");
  return { success: true, checksum };
}

export async function verifyTrialSeal(trialId: string) {
  const trial = await prisma.trial.findUnique({
    where: { id: trialId },
    include: { metadata: true }
  });
  
  if (!trial || !trial.sealedAt || !trial.checksum) return false;

  const recomputed = generateTrialHash(trial.content, trial.metadata, trial.sealedAt.toISOString());
  return recomputed === trial.checksum;
}
