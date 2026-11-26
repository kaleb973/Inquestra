'use server';
// src/actions/inviteActions.ts
// Lab member invite system — PI/Admin generates one-time signed links.
// New members join with a designated role scoped to the organization.

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateInviteToken, verifyInviteToken } from '@/lib/inviteToken';
import { formatAuthError } from '@/lib/utils';
import type { Role } from '@prisma/client';
import DOMPurify from 'isomorphic-dompurify';

const InviteRoleSchema = z.enum(['PI', 'ADMIN', 'RESEARCHER', 'VIEWER']);
const InviteEmailSchema = z.string().trim().toLowerCase().email().max(255);
const InvitePasswordSchema = z.string().min(8, 'Password must be at least 8 characters.').max(128, 'Password is too long.');

// ─── Generate an invite link ─────────────────────────────────────────────────

export async function createInviteLink(
  role: Role,
  expiresInHours: number
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const parsedRole = InviteRoleSchema.safeParse(role);
  if (!parsedRole.success) {
    return { success: false, error: 'Invalid role specified for invite.' };
  }
  const validatedRole = parsedRole.data;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return { success: false, error: 'User record not found.' };
  if (dbUser.role !== 'PI' && dbUser.role !== 'ADMIN') {
    return { success: false, error: 'Only Lab PIs and Admins can create invite links.' };
  }

  // PIs can invite any role; Admins cannot invite another PI.
  if (validatedRole === 'PI' && dbUser.role !== 'PI') {
    return { success: false, error: 'Only a Lab PI can invite another PI.' };
  }

  if (typeof expiresInHours !== 'number' || !Number.isInteger(expiresInHours) || expiresInHours < 1 || expiresInHours > 168) {
    return { success: false, error: 'Invite duration must be an integer between 1 and 168 hours (7 days).' };
  }

  const token = await generateInviteToken(dbUser.organizationId, validatedRole, expiresInHours);

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: 'INVITE_CREATED',
      entityType: 'Invite',
      entityId: 'invite',
      details: {
        message: `Invite link created for role ${validatedRole}, valid for ${expiresInHours}h.`,
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
    const { orgId, role, jti } = await verifyInviteToken(token);
    if (jti) {
      const alreadyRedeemed = await prisma.auditLog.findFirst({
        where: { action: 'MEMBER_JOINED_VIA_INVITE', entityId: jti },
      });
      if (alreadyRedeemed) {
        return { valid: false, error: 'This invite link has already been used.' };
      }
    }
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
  password: string,
  termsAccepted?: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  if (!termsAccepted) {
    return {
      success: false,
      error: 'You must certify that you are at least 18 years of age and agree to the Terms of Service and Privacy Policy.',
    };
  }

  const parsedEmail = InviteEmailSchema.safeParse(DOMPurify.sanitize(email, { ALLOWED_TAGS: [] }));
  if (!parsedEmail.success) {
    return { success: false, error: 'Please provide a valid institutional email address.' };
  }
  const cleanEmail = parsedEmail.data;

  const parsedPassword = InvitePasswordSchema.safeParse(password);
  if (!parsedPassword.success) {
    return { success: false, error: parsedPassword.error.issues[0]?.message ?? 'Invalid password.' };
  }

  let orgId: string;
  let role: Role;
  let jti: string;
  try {
    const payload = await verifyInviteToken(token);
    const parsedPayloadRole = InviteRoleSchema.safeParse(payload.role);
    if (!parsedPayloadRole.success) {
      return { success: false, error: 'Invite token carries an invalid role.' };
    }
    orgId = payload.orgId;
    role = parsedPayloadRole.data;
    jti = payload.jti;
  } catch {
    return { success: false, error: 'This invite link has expired or is invalid.' };
  }

  // Enforce single-use token (Replay Attack Prevention)
  if (jti) {
    const alreadyRedeemed = await prisma.auditLog.findFirst({
      where: { action: 'MEMBER_JOINED_VIA_INVITE', entityId: jti },
    });
    if (alreadyRedeemed) {
      return { success: false, error: 'This invite link has already been used.' };
    }
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return { success: false, error: 'Lab organization not found.' };

  // Check email not already registered
  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) return { success: false, error: 'An account with this email already exists.' };

  const supabase = await createSupabaseServerClient();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: parsedPassword.data,
    options: {
      emailRedirectTo: `${baseUrl}/app/callback`,
    },
  });

  if (error || !data.user) {
    return { success: false, error: formatAuthError(error?.message ?? 'Sign-up failed.') };
  }

  const supabaseAuthId = data.user.id;

  // Create Prisma user and immutable audit entry atomically, referencing createdUser.id as FK
  await prisma.$transaction(async (tx) => {
    if (jti) {
      const redeemedInFlight = await tx.auditLog.findFirst({
        where: { action: 'MEMBER_JOINED_VIA_INVITE', entityId: jti },
      });
      if (redeemedInFlight) {
        throw new Error('This invite link has already been used.');
      }
    }

    const createdUser = await tx.user.create({
      data: {
        authId: supabaseAuthId,
        email: cleanEmail,
        role,
        organizationId: orgId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: createdUser.id,
        organizationId: orgId,
        action: 'MEMBER_JOINED_VIA_INVITE',
        entityType: 'User',
        entityId: jti || createdUser.id,
        details: {
          message: `${cleanEmail} joined as ${role} via invite link.`,
          jti,
        },
      },
    });
  });

  revalidatePath('/app/admin');
  return { success: true };
}
