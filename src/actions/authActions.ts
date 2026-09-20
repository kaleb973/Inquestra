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

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = (formData.get('fullName') as string | null)?.trim() ?? '';
  const labType = (formData.get('labType') as string | null)?.trim() ?? '';

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
    const msg = err instanceof Error ? err.message : String(err);
    return { error: 'Server configuration error: ' + msg };
  }
}

/** Ensure a Prisma record exists for a logged-in Supabase user. */
export async function provisionUserRecord(user: {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; lab_type?: string; [key: string]: any };
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
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

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
    const msg = err instanceof Error ? err.message : String(err);
    return { error: 'Server configuration error: ' + msg };
  }
}

export type VerifyMfaResult = { success: true } | { error: string };

export async function verifyMfaLogin(
  factorId: string,
  code: string
): Promise<VerifyMfaResult> {
  try {
    const supabase = await createSupabaseServerClient();

    // Create a challenge then verify in one action to keep it atomic
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError || !challengeData) {
      return { error: challengeError?.message ?? 'Challenge creation failed.' };
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      return { error: 'Incorrect code. Please check your authenticator app and try again.' };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: 'Verification error: ' + msg };
  }
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/app/login');
}
