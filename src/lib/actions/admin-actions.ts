'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('No autorizado');
  return user;
}

export async function sendInvitation(email: string) {
  const admin = await requireAdmin();

  const supabase = await createClient();

  // Check no existing account with this email
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    return { error: 'Ya existe una cuenta con este correo.' };
  }

  // Check no pending (unused, unexpired) invitation
  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('email', email)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existingInvite) {
    return { error: 'Ya existe una invitación pendiente para este correo.' };
  }

  // Generate token
  const token = crypto.randomUUID();

  // Insert invitation
  const { error: insertError } = await supabase
    .from('invitations')
    .insert({
      email,
      token,
      invited_by: admin.id,
    });

  if (insertError) {
    return { error: 'Error al crear la invitación.' };
  }

  // Send email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
  const inviteLink = `${siteUrl}/registro-invitacion?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
        to: email,
        subject: 'Has sido invitado a VIA - Rueda de Vida',
        html: `
          <h2>Bienvenido a VIA</h2>
          <p>Has sido invitado a crear una cuenta en VIA - Rueda de Vida.</p>
          <p>Haz clic en el siguiente enlace para registrarte:</p>
          <a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;">Crear mi cuenta</a>
          <p style="margin-top:16px;color:#666;">Este enlace expira en 7 días.</p>
        `,
      });
    } catch (e) {
      console.error('Error sending email via Resend:', e);
      console.log('Invitation link (fallback):', inviteLink);
    }
  } else {
    // Dev fallback: log the link
    console.log('=== INVITATION LINK (dev mode) ===');
    console.log(inviteLink);
    console.log('==================================');
  }

  return { success: true };
}

export async function validateInvitation(token: string) {
  const supabase = await createClient();

  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !invitation) {
    return { error: 'Invitación inválida o expirada.' };
  }

  return { email: invitation.email };
}

export async function registerWithInvitation(data: {
  token: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
}) {
  // Re-validate token (server-side)
  const supabase = await createClient();

  const { data: invitation, error: invError } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', data.token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (invError || !invitation) {
    return { error: 'Invitación inválida o expirada.' };
  }

  if (invitation.email !== data.email) {
    return { error: 'El correo no coincide con la invitación.' };
  }

  // Sign up user via Supabase Auth
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        display_name: `${data.firstName} ${data.lastName}`,
      },
      emailRedirectTo: `${siteUrl}/auth/callback?type=signup`,
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (signUpData.user) {
    // Update profile with personal data using service client (bypasses RLS)
    const serviceClient = createServiceClient();
    await serviceClient
      .from('profiles')
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        display_name: `${data.firstName} ${data.lastName}`,
        document_type: data.documentType,
        document_number: data.documentNumber,
        birth_date: data.birthDate,
        terms_accepted: true,
      })
      .eq('id', signUpData.user.id);

    // Mark invitation as used
    await serviceClient
      .from('invitations')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invitation.id);
  }

  return { success: true };
}

export async function resendInvitation(invitationId: string) {
  const admin = await requireAdmin();

  const supabase = await createClient();

  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .single();

  if (error || !invitation) {
    return { error: 'Invitación no encontrada.' };
  }

  if (invitation.used_at) {
    return { error: 'Esta invitación ya fue utilizada.' };
  }

  // Generate new token and reset expiration
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await supabase
    .from('invitations')
    .update({ token, expires_at: expiresAt })
    .eq('id', invitationId);

  if (updateError) {
    return { error: 'Error al reenviar la invitación.' };
  }

  // Send email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
  const inviteLink = `${siteUrl}/registro-invitacion?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
        to: invitation.email,
        subject: 'Has sido invitado a VIA - Rueda de Vida',
        html: `
          <h2>Bienvenido a VIA</h2>
          <p>Has sido invitado a crear una cuenta en VIA - Rueda de Vida.</p>
          <p>Haz clic en el siguiente enlace para registrarte:</p>
          <a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;">Crear mi cuenta</a>
          <p style="margin-top:16px;color:#666;">Este enlace expira en 7 días.</p>
        `,
      });
    } catch (e) {
      console.error('Error sending email via Resend:', e);
      console.log('Invitation link (fallback):', inviteLink);
    }
  } else {
    console.log('=== INVITATION LINK (dev mode - resend) ===');
    console.log(inviteLink);
    console.log('============================================');
  }

  return { success: true };
}

export async function getInvitations() {
  await requireAdmin();

  const supabase = await createClient();

  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false });

  return invitations || [];
}

export async function getUsers() {
  await requireAdmin();

  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, first_name, last_name, email, role, created_at')
    .order('created_at', { ascending: false });

  return profiles || [];
}
