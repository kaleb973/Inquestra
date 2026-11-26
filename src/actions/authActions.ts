'use server';
// src/actions/authActions.ts
// Supabase Auth Server Actions — sign up, sign in (with MFA support), sign out.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

/** Resolve the canonical app base URL — prefers the env var, falls back to localhost for dev. */
function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

import { formatAuthError } from '@/lib/utils';
import { checkRateLimit } from '@/lib/rateLimit';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function signUp(formData: FormData) {
  const email = ((formData.get('email') as string | null) ?? '').trim().toLowerCase();
  const password = (formData.get('password') as string | null) ?? '';
  const fullName = (formData.get('fullName') as string | null)?.trim() ?? '';
  const labType = (formData.get('labType') as string | null)?.trim() ?? '';
  const termsAccepted = formData.get('termsAccepted');

  if (!termsAccepted || (termsAccepted !== 'true' && termsAccepted !== 'on')) {
    return {
      error: 'You must certify that you are at least 18 years of age and agree to the Terms of Service and Privacy Policy.',
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getAppUrl()}/app/callback`,
        data: {
          full_name: fullName || null,
          lab_type: labType || null,
        },
      },
    });

    if (error) return { error: formatAuthError(error.message) };

    return { success: 'Check your email to confirm your account.' };
  } catch (err: unknown) {
    console.error('[authActions.signUp] Unexpected error:', err);
    return { error: 'Unable to complete registration right now. Please try again.' };
  }
}

/** Ensure a Prisma record exists for a logged-in Supabase user. */
export async function provisionUserRecord(user: {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; lab_type?: string; [key: string]: unknown };
}): Promise<void> {
  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
  });

  if (!dbUser && user.email) {
    const fullName = user.user_metadata?.full_name as string | undefined;
    const labType = user.user_metadata?.lab_type as string | undefined;

    const nameBase = fullName ?? user.email.split('@')[0] ?? 'Researcher';
    const orgName = labType
      ? `${nameBase}'s ${labType}`
      : `${nameBase}'s Lab`;

    await prisma.organization.create({
      data: {
        name: orgName,
        users: {
          create: {
            authId: user.id,
            email: user.email,
            role: 'PI',
          },
        },
        projects: {
          create: {
            name: 'Default Workspace',
            description: 'Initial project for research trials.',
          },
        },
      },
    });
  }
}

export type SignInResult =
  | { success: true }
  | { mfaRequired: true; factorId: string }
  | { error: string };

export async function signIn(formData: FormData): Promise<SignInResult> {
  const email = ((formData.get('email') as string | null) ?? '').trim().toLowerCase();
  const password = (formData.get('password') as string | null) ?? '';

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return { error: formatAuthError(error?.message ?? 'Login failed') };
    }

    // --- Just-in-time Prisma User Provisioning ---
    await provisionUserRecord(data.user);

    // --- MFA Check ---
    // If user has an active verified TOTP factor, require a second step.
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const verifiedFactor = factorsData?.totp?.find((f) => f.status === 'verified');

    if (verifiedFactor) {
      return { mfaRequired: true, factorId: verifiedFactor.id };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: unknown) {
    console.error('[authActions.signIn] Unexpected error:', err);
    return { error: 'Authentication service is temporarily unavailable. Please try again.' };
  }
}

export type VerifyMfaResult = { success: true } | { error: string };

export async function verifyMfaLogin(
  factorId: string,
  code: string
): Promise<VerifyMfaResult> {
  if (!UUID_REGEX.test(factorId.trim())) {
    return { error: 'Invalid MFA factor identifier.' };
  }
  const cleanFactorId = factorId.trim();

  const cleanCode = code.trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    return { error: 'Verification code must be 6 digits.' };
  }

  // Rate-limit: max 5 attempts per 5 minutes per MFA factor to prevent brute-force guessing
  const rateLimitResult = checkRateLimit(`mfa:${cleanFactorId}`, 5, 5 * 60 * 1000);
  if (!rateLimitResult.success) {
    return {
      error: `Too many failed MFA attempts. Please wait ${rateLimitResult.retryAfterSeconds || 60} seconds before retrying.`,
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();
    if (sessionError || !user) {
      return { error: 'Active session expired. Please sign in again.' };
    }

    // Verify caller owns this verified factor
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const ownedFactor = factorsData?.totp?.find(
      (f) => f.id === cleanFactorId && f.status === 'verified'
    );
    if (!ownedFactor) {
      return { error: 'MFA factor not found or not verified for this account.' };
    }

    // Create a challenge then verify in one action to keep it atomic
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: cleanFactorId });

    if (challengeError || !challengeData) {
      return { error: 'Unable to initiate authenticator challenge. Please retry.' };
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: cleanFactorId,
      challengeId: challengeData.id,
      code: cleanCode,
    });

    if (verifyError) {
      return { error: 'Incorrect code. Please check your authenticator app and try again.' };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: unknown) {
    console.error('[authActions.verifyMfaLogin] Unexpected error:', err);
    return { error: 'Unable to verify authenticator code right now.' };
  }
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/app/login');
}
