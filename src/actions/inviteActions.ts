'use server';
// src/actions/inviteActions.ts
// Lab member invite system — PI/Admin generates one-time signed links.
// New members join with a designated role scoped to the organization.

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateInviteToken, verifyInviteToken } from '@/lib/inviteToken';
import { formatAuthError } from '@/lib/utils';
import type { Role } from '@prisma/client';
import DOMPurify from 'isomorphic-dompurify';

// ─── Generate an invite link ─────────────────────────────────────────────────

export async function createInviteLink(
  role: Role,
  expiresInHours: number
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return { success: false, error: 'User record not found.' };
  if (dbUser.role !== 'PI' && dbUser.role !== 'ADMIN') {
    return { success: false, error: 'Only Lab PIs and Admins can create invite links.' };
  }

  // PIs can invite any role; Admins cannot invite another PI.
  if (role === 'PI' && dbUser.role !== 'PI') {
    return { success: false, error: 'Only a Lab PI can invite another PI.' };
  }

  const token = await generateInviteToken(dbUser.organizationId, role, expiresInHours);

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: 'INVITE_CREATED',
      entityType: 'Invite',
      entityId: 'invite',
      details: {
        message: `Invite link created for role ${role}, valid for ${expiresInHours}h.`,
      },
    },
  });

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  return { success: true, url: `${base}/app/join?token=${token}` };
}

// ─── Peek at invite info before accepting ───────────────────────────────────

export async function previewInvite(token: string): Promise<{
  valid: true;
  orgName: string;
  role: Role;
} | { valid: false; error: string }> {
  try {
    const { orgId, role } = await verifyInviteToken(token);
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return { valid: false, error: 'Lab not found.' };
    return { valid: true, orgName: org.name, role };
  } catch {
    return { valid: false, error: 'This invite link has expired or is invalid.' };
  }
}

// ─── Accept invite & create account ─────────────────────────────────────────

export async function acceptInvite(
  token: string,
  email: string,
  password: string
): Promise<{ success: true } | { success: false; error: string }> {
  const cleanEmail = DOMPurify.sanitize(email.trim().toLowerCase());

  let orgId: string;
  let role: Role;
  try {
    const payload = await verifyInviteToken(token);
    orgId = payload.orgId;
    role = payload.role;
  } catch {
    return { success: false, error: 'This invite link has expired or is invalid.' };
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return { success: false, error: 'Lab organization not found.' };

  // Check email not already registered
  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) return { success: false, error: 'An account with this email already exists.' };

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/app/callback`,
    },
  });

  if (error || !data.user) {
    return { success: false, error: formatAuthError(error?.message ?? 'Sign-up failed.') };
  }

  // Create Prisma user record immediately with the designated org and role
  await prisma.user.create({
    data: {
      authId: data.user.id,
      email: cleanEmail,
      role,
      organizationId: orgId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: data.user.id,
      organizationId: orgId,
      action: 'MEMBER_JOINED_VIA_INVITE',
      entityType: 'User',
      entityId: data.user.id,
      details: {
        message: `${cleanEmail} joined as ${role} via invite link.`,
      },
    },
  });

  revalidatePath('/app/admin');
  return { success: true };
}
