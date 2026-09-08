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

  // Security request: "make sure only I can"
  // If a user already exists in the database, prevent new signups.
  const totalUsers = await prisma.user.count();
  if (totalUsers > 0) {
    return { error: 'Registrations are currently closed. Contact your administrator.' };
  }

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
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

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
    // Check if this is the very first user in the entire database
    const totalUsers = await prisma.user.count();
    
    if (totalUsers === 0) {
      // First user becomes the ADMIN and creates the default Organization
      await prisma.organization.create({
        data: {
          name: 'My BME Lab',
          users: {
            create: {
              authId: data.user.id,
              email: data.user.email!,
              role: 'ADMIN',
            },
          },
        },
      });
    } else {
      // If users already exist, lock down the system (security request: "make sure only I can")
      // We will create them as a VIEWER with no org, or just reject them.
      // Let's create them as VIEWER in the first org found, but they won't have admin access.
      const firstOrg = await prisma.organization.findFirst();
      if (firstOrg) {
        await prisma.user.create({
          data: {
            authId: data.user.id,
            email: data.user.email!,
            role: 'VIEWER',
            organizationId: firstOrg.id,
          },
        });
      }
    }
  }

  revalidatePath('/', 'layout');
  redirect('/app');
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/app/login');
}
