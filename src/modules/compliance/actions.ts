"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateTrialHash } from "@/lib/provenance";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DOMPurify from "isomorphic-dompurify";

export async function signAndSealTrial(data: {
  trialId: string;
  userId?: string;
  organizationId?: string;
  role: "AUTHOR" | "WITNESS" | "PI_APPROVAL";
  meaning: string;
}) {
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

  // Tenant-isolated trial verification
  const trial = await prisma.trial.findFirst({
    where: {
      id: data.trialId,
      project: { organizationId: dbUser.organizationId },
    },
    include: { metadata: true },
  });

  if (!trial) {
    throw new Error("Trial not found or access denied.");
  }

  const cleanMeaning = DOMPurify.sanitize(data.meaning.trim());
  if (!cleanMeaning) {
    throw new Error("Signature meaning/justification is required.");
  }

  // Derive acting user and organization strictly from verified server session
  const activeUserId = dbUser.id;
  const activeOrgId = dbUser.organizationId;

  if (trial.status === "COMPLETED" && trial.checksum) {
    // If it's already sealed, add witness or approval signature
    await prisma.signature.create({
      data: {
        trialId: trial.id,
        userId: activeUserId,
        role: data.role,
        meaning: cleanMeaning,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "SIGNATURE_ADDED",
        entityType: "Trial",
        entityId: trial.id,
        details: { role: data.role, meaning: cleanMeaning },
        userId: activeUserId,
        organizationId: activeOrgId,
      },
    });

    revalidatePath("/app/admin");
    return { success: true, message: "Witness signature applied." };
  }

  // Primary author sealing
  const timestamp = new Date().toISOString();
  const checksum = generateTrialHash(trial.content, trial.metadata, timestamp);

  await prisma.$transaction([
    prisma.trial.update({
      where: { id: trial.id },
      data: {
        status: "COMPLETED",
        checksum,
        sealedAt: timestamp,
        sealedBy: activeUserId,
      },
    }),
    prisma.signature.create({
      data: {
        trialId: trial.id,
        userId: activeUserId,
        role: data.role,
        meaning: cleanMeaning,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "TRIAL_SEALED",
        entityType: "Trial",
        entityId: trial.id,
        details: { checksum, role: data.role },
        userId: activeUserId,
        organizationId: activeOrgId,
      },
    }),
  ]);

  revalidatePath("/app/admin");
  return { success: true, checksum };
}

export async function verifyTrialSeal(trialId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let orgFilter: { project?: { organizationId: string } } = {};
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { organizationId: true },
    });
    if (dbUser) {
      orgFilter = { project: { organizationId: dbUser.organizationId } };
    }
  }

  const trial = await prisma.trial.findFirst({
    where: { id: trialId, ...orgFilter },
    include: { metadata: true },
  });

  if (!trial || !trial.sealedAt || !trial.checksum) return false;

  const recomputed = generateTrialHash(
    trial.content,
    trial.metadata,
    trial.sealedAt.toISOString()
  );
  return recomputed === trial.checksum;
}
