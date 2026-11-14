'use server';
// src/lib/inviteToken.ts
// Signed JWT invite tokens for lab member onboarding.
// Uses the jose library (already a Supabase transitive dependency — no new installs).

import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@prisma/client';

const INVITE_SECRET = new TextEncoder().encode(
  process.env.INVITE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'inquestra-invite-fallback-key'
);

const ISSUER = 'inquestra-lab';

export interface InvitePayload {
  orgId: string;
  role: Role;
  /** ISO 8601 expiry */
  exp?: number;
}

/**
 * Generate a signed invite JWT valid for the given number of hours.
 * The token encodes the organization ID and the designated role.
 */
export async function generateInviteToken(
  orgId: string,
  role: Role,
  expiresInHours: number
): Promise<string> {
  const token = await new SignJWT({ orgId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${expiresInHours}h`)
    .sign(INVITE_SECRET);

  return token;
}

/**
 * Verify and decode an invite token.
 * Returns the payload if valid, throws if expired or tampered.
 */
export async function verifyInviteToken(
  token: string
): Promise<{ orgId: string; role: Role }> {
  const { payload } = await jwtVerify(token, INVITE_SECRET, {
    issuer: ISSUER,
  });

  const orgId = payload['orgId'] as string | undefined;
  const role = payload['role'] as Role | undefined;

  if (!orgId || !role) {
    throw new Error('Invalid invite token payload.');
  }

  return { orgId, role };
}
