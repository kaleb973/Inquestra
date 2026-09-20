'use server';
// src/actions/authActions.ts
// Supabase Auth Server Actions — sign up, sign in, sign out.
// All mutations go through the server to keep anon key off the client bundle.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://inquestra.org'}/app/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { success: 'Check your email to confirm your account.' };
  } catch (err: any) {
    return { error: 'Server configuration error: ' + (err.message || String(err)) };
  }
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return { error: error?.message || 'Login failed' };
    }

    // --- Just-in-time Prisma User Provisioning ---
    // If this is the first time the user logs in, ensure they have a Prisma User record.
    const dbUser = await prisma.user.findUnique({
      where: { authId: data.user.id },
    });

    if (!dbUser) {
      // Multi-tenant Self-Serve:
      // When an independent user signs up without an invite, they get their OWN Lab and become the PI.
      const orgName = data.user.email?.split('@')[0] ? `${data.user.email?.split('@')[0]}'s Lab` : 'My BME Lab';
      
      await prisma.organization.create({
        data: {
          name: orgName,
          users: {
            create: {
              authId: data.user.id,
              email: data.user.email!,
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

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { error: 'Server configuration error: ' + (err.message || String(err)) };
  }
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/app/login');
}
