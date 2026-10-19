// src/app/api/auth/login/route.ts
// Edge-First Pre-Auth Risk Scoring & Bcrypt CPU Shield Route Handler for Inquestra.
// Enforces 3-Tier Pipeline (ALLOW, CHALLENGE, DROP) and Bcrypt Concurrency Semaphore.

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { evaluateLoginRisk, extractClientIp } from '@/lib/security/risk-engine';
import { verifyChallengeToken } from '@/lib/security/challenge-verifier';
import {
  executeWithBcryptLimit,
  ConcurrencyLimitExceededError,
} from '@/lib/security/concurrency-semaphore';
import {
  recordFailedAttempt,
  clearFailedAttempts,
} from '@/lib/security/failure-tracker';
import {
  createDeviceTrustCookie,
  getDeviceTrustCookieConfig,
} from '@/lib/security/device-trust';

// Pre-computed bcrypt hash (cost 12) used to prevent user enumeration via timing discrepancies
const DUMMY_BCRYPT_HASH =
  '$2a$12$e8N4YgU68oO3kH9zZ1Yv6.lV3n6aD5L9P7m3p1j6q2W0s9r4t7y8u';

interface LoginRequestBody {
  email?: string;
  password?: string;
  challengeToken?: string;
}

export async function POST(req: NextRequest) {
  const clientIp = extractClientIp(req);

  // Parse minimal payload safely
  let email = '';
  let password = '';
  let challengeToken: string | null = req.headers.get('x-turnstile-token');

  const contentType = req.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const json: LoginRequestBody = await req.json();
      email = typeof json.email === 'string' ? json.email.trim() : '';
      password = typeof json.password === 'string' ? json.password : '';
      if (!challengeToken && typeof json.challengeToken === 'string') {
        challengeToken = json.challengeToken;
      }
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await req.formData();
      email = (formData.get('email') as string | null)?.trim() ?? '';
      password = (formData.get('password') as string | null) ?? '';
      if (!challengeToken) {
        challengeToken = formData.get('challengeToken') as string | null;
      }
    }
  } catch {
    return NextResponse.json({ error: 'Malformed request payload' }, { status: 400 });
  }

  // ── Stage 1: Evaluate Pre-Auth Risk (~0.1ms, zero DB, zero bcrypt) ──
  const risk = await evaluateLoginRisk(req, email);

  // ── Stage 2: High Risk (DROP) — Immediate 403 Forbidden ──
  if (risk.tier === 'DROP') {
    return NextResponse.json(
      {
        error: 'Access denied: high threat score detected',
        code: 'ACCESS_DENIED',
        ...(process.env.NODE_ENV !== 'production'
          ? { riskScore: risk.score, reasons: risk.reasons }
          : {}),
      },
      { status: 403 }
    );
  }

  // ── Stage 3: Medium Risk (CHALLENGE) — Verify or Return 428 Precondition Required ──
  if (risk.tier === 'CHALLENGE') {
    const challengeVerification = await verifyChallengeToken(challengeToken, clientIp);

    if (!challengeVerification.valid) {
      return NextResponse.json(
        {
          code: 'CHALLENGE_REQUIRED',
          status: 'CHALLENGE_REQUIRED',
          message: 'Human verification required due to risk telemetry.',
          ...(process.env.NODE_ENV !== 'production'
            ? { riskScore: risk.score, reasons: risk.reasons }
            : {}),
        },
        { status: 428 }
      );
    }
  }

  // Input validation before expensive cryptographic operations
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

interface AuthSuccessUser {
  id: string;
  email: string;
  role?: string;
}

type AuthCheckResult =
  | { success: true; user: AuthSuccessUser; mfaRequired?: false; factorId?: undefined }
  | { success: true; user: AuthSuccessUser; mfaRequired: true; factorId: string }
  | { success: false; user?: undefined };

  // ── Stage 4: Concurrency-Protected Bcrypt & DB Verification ──
  try {
    const authResult = await executeWithBcryptLimit<AuthCheckResult>(async () => {
      // 1. Primary lookup in PostgreSQL via Prisma
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      // If user has a local bcrypt password hash
      if (user && user.passwordHash) {
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (isValid) {
          return { success: true, user };
        }
      }

      // If Supabase Auth is enabled, attempt Supabase password verification
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        try {
          const supabase = await createSupabaseServerClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!error && data.user) {
            // Check if user has an active verified TOTP MFA factor
            const { data: factorsData } = await supabase.auth.mfa.listFactors();
            const verifiedFactor = factorsData?.totp?.find((f) => f.status === 'verified');
            if (verifiedFactor) {
              return {
                success: true,
                mfaRequired: true,
                factorId: verifiedFactor.id,
                user: { id: data.user.id, email: data.user.email ?? email, role: 'RESEARCHER' as const },
              };
            }

            // Ensure local user record is in sync
            const localUser =
              user ||
              (await prisma.user.findUnique({
                where: { authId: data.user.id },
              }));

            return {
              success: true,
              user: localUser || {
                id: data.user.id,
                email: data.user.email ?? email,
                role: 'RESEARCHER' as const,
              },
            };
          }
        } catch {
          // Supabase call failed or timed out; proceed to dummy comparison
        }
      }

      // If no valid user or password mismatch, run dummy bcrypt to neutralize timing side-channels
      if (!user || !user.passwordHash) {
        await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
      }

      return { success: false };
    });

    // ── Stage 5: Credential Failure Handling ──
    if (!authResult.success || !authResult.user) {
      recordFailedAttempt(clientIp, risk.fingerprintId, email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Clear velocity counters for this client and account
    clearFailedAttempts(clientIp, risk.fingerprintId, email);

    if (authResult.mfaRequired) {
      return NextResponse.json(
        {
          success: true,
          mfaRequired: true,
          factorId: authResult.factorId,
        },
        { status: 200 }
      );
    }

    // Issue HMAC-signed device trust cookie for frictionless future logins
    const userAgent = req.headers.get('user-agent') || '';
    const trustToken = await createDeviceTrustCookie(userAgent);
    const cookieConfig = getDeviceTrustCookieConfig();

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          role: authResult.user.role,
        },
      },
      { status: 200 }
    );

    response.cookies.set(cookieConfig.name, trustToken, cookieConfig.options);
    return response;
  } catch (err: unknown) {
    if (err instanceof ConcurrencyLimitExceededError) {
      return NextResponse.json(
        { error: 'Authentication service busy. Please try again momentarily.' },
        { status: 503 }
      );
    }

    const message = err instanceof Error ? err.message : 'Internal authentication error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
