'use server';

import { createClient } from '@/lib/supabase/server';

export async function createInvite() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('No autenticado');

  const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase();

  const { data, error } = await supabase
    .from('partnerships')
    .insert({
      user_a_id: user.id,
      invite_code: inviteCode,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function acceptInvite(inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('No autenticado');

  const { data: partnership, error: findError } = await supabase
    .from('partnerships')
    .select('*')
    .eq('invite_code', inviteCode)
    .eq('status', 'pending')
    .single();

  if (findError || !partnership) {
    throw new Error('Código de invitación no válido o ya utilizado');
  }

  if (partnership.user_a_id === user.id) {
    throw new Error('No puedes aceptar tu propia invitación');
  }

  const { error } = await supabase
    .from('partnerships')
    .update({
      user_b_id: user.id,
      status: 'active',
    })
    .eq('id', partnership.id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function endPartnership(partnershipId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('partnerships')
    .update({ status: 'ended' })
    .eq('id', partnershipId);

  if (error) throw new Error(error.message);
}

export async function updatePrivacyLevel(partnershipId: string, level: 'full' | 'scores_only' | 'priorities' | 'none') {
  const supabase = await createClient();

  const { error } = await supabase
    .from('partnerships')
    .update({ privacy_level: level })
    .eq('id', partnershipId);

  if (error) throw new Error(error.message);
}

export async function shareWheel(partnershipId: string, wheelId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('shared_wheels')
    .insert({
      partnership_id: partnershipId,
      wheel_id: wheelId,
      shared_by: user.id,
    });

  if (error) throw new Error(error.message);
}

export async function getPartnerWheels(partnershipId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('No autenticado');

  const { data: partnership } = await supabase
    .from('partnerships')
    .select('*')
    .eq('id', partnershipId)
    .single();

  if (!partnership) throw new Error('Pareja no encontrada');

  const partnerId = partnership.user_a_id === user.id ? partnership.user_b_id : partnership.user_a_id;

  const { data: sharedWheels } = await supabase
    .from('shared_wheels')
    .select('*, wheels(*)')
    .eq('partnership_id', partnershipId)
    .eq('shared_by', partnerId);

  return sharedWheels || [];
}
