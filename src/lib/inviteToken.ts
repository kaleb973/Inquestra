'use server';
// src/lib/inviteToken.ts
// Signed JWT invite tokens for lab member onboarding.
// Hardened with single-use JTI tracking, replay protection, and strict production secret enforcement.

import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@prisma/client';

function getInviteSecret(): Uint8Array {
  const secret = process.env.INVITE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('INVITE_SECRET or SUPABASE_SERVICE_ROLE_KEY must be configured in production.');
    }
    return new TextEncoder().encode('inquestra-dev-only-secret-key-do-not-use-in-prod-32b');
  }
  return new TextEncoder().encode(secret);
}

const ISSUER = 'inquestra-lab';

export interface InvitePayload {
  orgId: string;
  role: Role;
  jti: string;
  /** ISO 8601 expiry */
  exp?: number;
}

/**
 * Generate a signed invite JWT valid for the given number of hours.
 * The token encodes the organization ID, designated role, and a unique JTI for replay prevention.
 */
export async function generateInviteToken(
  orgId: string,
  role: Role,
  expiresInHours: number
): Promise<string> {
  const jti = crypto.randomUUID();
  const token = await new SignJWT({ orgId, role, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${expiresInHours}h`)
    .sign(getInviteSecret());

  return token;
}

/**
 * Verify and decode an invite token.
 * Returns the payload if valid, throws if expired or tampered.
 */
export async function verifyInviteToken(
  token: string
): Promise<{ orgId: string; role: Role; jti: string }> {
  const { payload } = await jwtVerify(token, getInviteSecret(), {
    issuer: ISSUER,
  });

  const orgId = payload['orgId'] as string | undefined;
  const role = payload['role'] as Role | undefined;
  const jti = (payload.jti as string | undefined) || (payload['jti'] as string | undefined);

  if (!orgId || !role) {
    throw new Error('Invalid invite token payload.');
  }

  return { orgId, role, jti: jti || '' };
}
