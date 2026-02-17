'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function registerAction(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const displayName = formData.get('displayName') as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      display_name: displayName,
    });
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function recoverPasswordAction(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Se ha enviado un correo de recuperación.' };
}

export async function migrateGuestWheel(guestToken: string, userId: string) {
  const supabase = await createClient();

  const { data: guestSession } = await supabase
    .from('guest_sessions')
    .select('wheel_id')
    .eq('session_token', guestToken)
    .single();

  if (guestSession?.wheel_id) {
    await supabase
      .from('wheels')
      .update({ user_id: userId, is_guest: false, guest_token: null })
      .eq('id', guestSession.wheel_id);

    await supabase
      .from('guest_sessions')
      .delete()
      .eq('session_token', guestToken);
  }
}
