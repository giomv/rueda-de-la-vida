'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  SpecialistBitacoraEntryListItem,
  SpecialistInvitationWithName,
} from '@/lib/types/specialist';

// ============================================================
// INVITATIONS (user-side)
// ============================================================

export async function listPendingSpecialistInvitations(): Promise<SpecialistInvitationWithName[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const email = user.email;
  if (!email) return [];

  const { data: relations } = await supabase
    .from('specialist_user_relations')
    .select('*')
    .eq('invited_email', email)
    .eq('status', 'invited')
    .order('created_at', { ascending: false });

  if (!relations || relations.length === 0) return [];

  // Resolve specialist names server-side
  const specialistIds = [...new Set(relations.map(r => r.specialist_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', specialistIds);
  const nameMap = new Map<string, string>();
  (profiles || []).forEach((p: { id: string; display_name: string | null }) => {
    nameMap.set(p.id, p.display_name || 'Especialista');
  });

  return relations.map(r => ({
    ...r,
    specialist_name: nameMap.get(r.specialist_id) || 'Especialista',
  })) as SpecialistInvitationWithName[];
}

export async function acceptSpecialistInvitation(relationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('specialist_user_relations')
    .update({
      status: 'active',
      user_id: user.id,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', relationId)
    .eq('status', 'invited');

  if (error) throw new Error('Error al aceptar la invitacion.');
}

export async function rejectSpecialistInvitation(relationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('specialist_user_relations')
    .update({
      status: 'revoked',
      revoked_by: user.id,
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', relationId)
    .eq('status', 'invited');

  if (error) throw new Error('Error al rechazar la invitacion.');
}

// ============================================================
// BITACORA ENTRIES (user-side)
// ============================================================

export async function listMySpecialistBitacoraEntries(params?: {
  cursor?: string;
  limit?: number;
}): Promise<{
  items: SpecialistBitacoraEntryListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const limit = params?.limit || 20;

  let query = supabase
    .from('specialist_bitacora_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (params?.cursor) {
    query = query.lt('created_at', params.cursor);
  }

  const { data: entries, error } = await query;
  if (error) throw new Error(error.message);

  const hasMore = (entries?.length || 0) > limit;
  const items = (entries || []).slice(0, limit);

  if (items.length === 0) {
    return { items: [], nextCursor: null, hasMore: false };
  }

  // Get specialist names
  const specialistIds = [...new Set(items.map(e => e.specialist_id))];
  const nameMap = new Map<string, string>();

  if (specialistIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', specialistIds);
    (profiles || []).forEach((p: { id: string; display_name: string | null }) => {
      nameMap.set(p.id, p.display_name || 'Especialista');
    });
  }

  const enriched: SpecialistBitacoraEntryListItem[] = items.map(e => ({
    ...e,
    specialist_name: nameMap.get(e.specialist_id) || 'Especialista',
    source: 'specialist' as const,
  }));

  return {
    items: enriched,
    nextCursor: hasMore ? items[items.length - 1]?.created_at || null : null,
    hasMore,
  };
}

// ============================================================
// REVOCATION (user-side)
// ============================================================

export async function revokeMySpecialistAccess(relationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('specialist_user_relations')
    .update({
      status: 'revoked',
      revoked_by: user.id,
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', relationId)
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (error) throw new Error('Error al revocar el acceso.');
}

// ============================================================
// CONVERT TO ACTIVITY
// ============================================================

export async function convertRecommendationToActivity(
  entryId: string,
  recommendationText: string
): Promise<{ activityId: string; alreadyExists: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Verify the entry belongs to the user
  const { data: entry, error: entryError } = await supabase
    .from('specialist_bitacora_entries')
    .select('id')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .single();

  if (entryError || !entry) throw new Error('Entrada no encontrada');

  // Check if already exists
  const { data: existing } = await supabase
    .from('lifeplan_activities')
    .select('id')
    .eq('user_id', user.id)
    .eq('source_type', 'SPECIALIST')
    .eq('source_id', entryId)
    .eq('title', recommendationText)
    .maybeSingle();

  if (existing) {
    return { activityId: existing.id, alreadyExists: true };
  }

  const { data: activity, error: createError } = await supabase
    .from('lifeplan_activities')
    .insert({
      user_id: user.id,
      title: recommendationText,
      source_type: 'SPECIALIST',
      source_id: entryId,
      frequency_type: 'WEEKLY',
      frequency_value: 1,
      order_position: 0,
      is_archived: false,
    })
    .select()
    .single();

  if (createError) throw new Error(createError.message);
  return { activityId: activity.id, alreadyExists: false };
}
