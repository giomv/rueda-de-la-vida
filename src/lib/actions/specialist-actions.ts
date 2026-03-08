'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  SpecialistUserListItem,
  SpecialistSessionNoteWithUser,
  CreateSpecialistSessionNoteInput,
  UpdateSpecialistSessionNoteInput,
  SpecialistSessionListFilters,
  SpecialistSessionNote,
} from '@/lib/types/specialist';

// ============================================================
// AUTH HELPER
// ============================================================

async function requireSpecialist() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'specialist') throw new Error('No autorizado');
  return user;
}

// ============================================================
// RELATIONS
// ============================================================

export async function inviteUser(email: string) {
  const specialist = await requireSpecialist();
  const supabase = await createClient();

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { error: 'El correo es requerido.' };

  // Check if relation already exists (active or invited)
  const { data: existing } = await supabase
    .from('specialist_user_relations')
    .select('id, status')
    .eq('specialist_id', specialist.id)
    .eq('invited_email', normalizedEmail)
    .in('status', ['invited', 'active'])
    .maybeSingle();

  if (existing) {
    return { error: existing.status === 'active'
      ? 'Este usuario ya esta vinculado contigo.'
      : 'Ya existe una invitacion pendiente para este correo.' };
  }

  // Resolve user_id if email exists in profiles
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  const { error: insertError } = await supabase
    .from('specialist_user_relations')
    .insert({
      specialist_id: specialist.id,
      user_id: existingProfile?.id || null,
      invited_email: normalizedEmail,
      status: 'invited',
    });

  if (insertError) {
    return { error: 'Error al crear la invitacion.' };
  }

  return { success: true };
}

export async function revokeRelation(relationId: string) {
  const specialist = await requireSpecialist();
  const supabase = await createClient();

  const { error } = await supabase
    .from('specialist_user_relations')
    .update({
      status: 'revoked',
      revoked_by: specialist.id,
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', relationId)
    .eq('specialist_id', specialist.id);

  if (error) return { error: 'Error al revocar la relacion.' };
  return { success: true };
}

export async function listMyUsers(): Promise<SpecialistUserListItem[]> {
  const specialist = await requireSpecialist();
  const supabase = await createClient();

  const { data: relations } = await supabase
    .from('specialist_user_relations')
    .select('*')
    .eq('specialist_id', specialist.id)
    .order('created_at', { ascending: false });

  if (!relations || relations.length === 0) return [];

  // Get user profiles and session stats in parallel
  const userIds = relations.map(r => r.user_id).filter(Boolean) as string[];

  const [profilesResult, notesResult] = await Promise.all([
    userIds.length > 0
      ? supabase.from('profiles').select('id, display_name, email').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string | null; email: string | null }[] }),
    supabase.from('specialist_session_notes')
      .select('user_id, session_date')
      .eq('specialist_id', specialist.id),
  ]);

  const profileMap = new Map<string, { display_name: string | null; email: string | null }>();
  (profilesResult.data || []).forEach((p: { id: string; display_name: string | null; email: string | null }) => {
    profileMap.set(p.id, { display_name: p.display_name, email: p.email });
  });

  const notes = notesResult.data;

  const sessionCountMap = new Map<string, number>();
  const lastSessionMap = new Map<string, string>();
  (notes || []).forEach((n: { user_id: string; session_date: string }) => {
    sessionCountMap.set(n.user_id, (sessionCountMap.get(n.user_id) || 0) + 1);
    const current = lastSessionMap.get(n.user_id);
    if (!current || n.session_date > current) {
      lastSessionMap.set(n.user_id, n.session_date);
    }
  });

  return relations.map((r) => {
    const profile = r.user_id ? profileMap.get(r.user_id) : null;
    return {
      relation: r,
      user_name: profile?.display_name || null,
      user_email: profile?.email || r.invited_email,
      last_session_date: r.user_id ? (lastSessionMap.get(r.user_id) || null) : null,
      session_count: r.user_id ? (sessionCountMap.get(r.user_id) || 0) : 0,
    };
  });
}

export async function searchMyUsers(query: string): Promise<SpecialistUserListItem[]> {
  const allUsers = await listMyUsers();
  if (!query.trim()) return allUsers;

  const term = query.trim().toLowerCase();
  return allUsers.filter(u =>
    u.user_name?.toLowerCase().includes(term) ||
    u.user_email.toLowerCase().includes(term)
  );
}

// ============================================================
// SESSION NOTES
// ============================================================

export async function createSessionNote(
  input: CreateSpecialistSessionNoteInput
): Promise<SpecialistSessionNote> {
  const specialist = await requireSpecialist();
  const supabase = await createClient();

  // Validate active relation
  const { data: relation } = await supabase
    .from('specialist_user_relations')
    .select('id, status')
    .eq('id', input.relation_id)
    .eq('specialist_id', specialist.id)
    .single();

  if (!relation || relation.status !== 'active') {
    throw new Error('La relacion no esta activa');
  }

  if (!input.session_date) throw new Error('La fecha es requerida');

  const { data: note, error } = await supabase
    .from('specialist_session_notes')
    .insert({
      specialist_id: specialist.id,
      user_id: input.user_id,
      relation_id: input.relation_id,
      session_type: input.session_type?.trim() || null,
      session_date: input.session_date,
      duration_minutes: input.duration_minutes || null,
      private_notes: input.private_notes.filter(n => n.text.trim()),
      private_followup: input.private_followup?.trim() || null,
      shared_recommendations: input.shared_recommendations.filter(r => r.text.trim()),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return note as SpecialistSessionNote;
}

export async function getSessionNote(noteId: string): Promise<SpecialistSessionNoteWithUser> {
  const specialist = await requireSpecialist();
  const supabase = await createClient();

  const { data: note, error } = await supabase
    .from('specialist_session_notes')
    .select('*')
    .eq('id', noteId)
    .eq('specialist_id', specialist.id)
    .single();

  if (error || !note) throw new Error('Nota no encontrada');

  // Get user info
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', note.user_id)
    .single();

  return {
    ...note,
    user_name: profile?.display_name || null,
    user_email: profile?.email || '',
  } as SpecialistSessionNoteWithUser;
}

export async function updateSessionNote(
  noteId: string,
  input: UpdateSpecialistSessionNoteInput
): Promise<SpecialistSessionNote> {
  const specialist = await requireSpecialist();
  const supabase = await createClient();

  // Fetch current note
  const { data: existing, error: fetchError } = await supabase
    .from('specialist_session_notes')
    .select('*')
    .eq('id', noteId)
    .eq('specialist_id', specialist.id)
    .single();

  if (fetchError || !existing) throw new Error('Nota no encontrada');

  // Optimistic locking
  if (input.lock_version !== existing.lock_version) {
    throw new Error('La nota fue modificada por otra sesion. Recarga la pagina.');
  }

  const updates: Record<string, unknown> = {
    lock_version: existing.lock_version + 1,
    updated_at: new Date().toISOString(),
  };

  if (input.session_type !== undefined) updates.session_type = input.session_type?.trim() || null;
  if (input.session_date !== undefined) updates.session_date = input.session_date;
  if (input.duration_minutes !== undefined) updates.duration_minutes = input.duration_minutes || null;
  if (input.private_notes !== undefined) updates.private_notes = input.private_notes.filter(n => n.text.trim());
  if (input.private_followup !== undefined) updates.private_followup = input.private_followup?.trim() || null;
  if (input.shared_recommendations !== undefined) {
    updates.shared_recommendations = input.shared_recommendations.filter(r => r.text.trim());
  }

  const { data: note, error } = await supabase
    .from('specialist_session_notes')
    .update(updates)
    .eq('id', noteId)
    .eq('specialist_id', specialist.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return note as SpecialistSessionNote;
}

export async function deleteSessionNote(noteId: string): Promise<void> {
  const specialist = await requireSpecialist();
  const supabase = await createClient();

  // Check not published
  const { data: note } = await supabase
    .from('specialist_session_notes')
    .select('shared_published_at')
    .eq('id', noteId)
    .eq('specialist_id', specialist.id)
    .single();

  if (!note) throw new Error('Nota no encontrada');
  if (note.shared_published_at) {
    throw new Error('No se puede eliminar una nota con recomendaciones publicadas');
  }

  const { error } = await supabase
    .from('specialist_session_notes')
    .delete()
    .eq('id', noteId)
    .eq('specialist_id', specialist.id);

  if (error) throw new Error(error.message);
}

export async function listSessionNotes(filters: SpecialistSessionListFilters): Promise<{
  items: SpecialistSessionNoteWithUser[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const specialist = await requireSpecialist();
  const supabase = await createClient();

  const limit = filters.limit || 20;

  let query = supabase
    .from('specialist_session_notes')
    .select('*')
    .eq('specialist_id', specialist.id)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.ilike('session_type', term);
  }
  if (filters.cursor) {
    query = query.lt('created_at', filters.cursor);
  }

  const { data: notes, error } = await query;
  if (error) throw new Error(error.message);

  const hasMore = (notes?.length || 0) > limit;
  const items = (notes || []).slice(0, limit);

  if (items.length === 0) {
    return { items: [], nextCursor: null, hasMore: false };
  }

  // Resolve user names
  const userIds = [...new Set(items.map(n => n.user_id))];
  const profileMap = new Map<string, { display_name: string | null; email: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .in('id', userIds);
    (profiles || []).forEach((p: { id: string; display_name: string | null; email: string | null }) => {
      profileMap.set(p.id, { display_name: p.display_name, email: p.email });
    });
  }

  const enriched = items.map(n => {
    const profile = profileMap.get(n.user_id);
    return {
      ...n,
      user_name: profile?.display_name || null,
      user_email: profile?.email || '',
    } as SpecialistSessionNoteWithUser;
  });

  return {
    items: enriched,
    nextCursor: hasMore ? items[items.length - 1]?.created_at || null : null,
    hasMore,
  };
}

export async function publishRecommendations(noteId: string): Promise<void> {
  const specialist = await requireSpecialist();
  const supabase = await createClient();

  // Fetch note
  const { data: note, error: fetchError } = await supabase
    .from('specialist_session_notes')
    .select('*')
    .eq('id', noteId)
    .eq('specialist_id', specialist.id)
    .single();

  if (fetchError || !note) throw new Error('Nota no encontrada');

  const recommendations = note.shared_recommendations || [];
  if (recommendations.length === 0) {
    throw new Error('No hay recomendaciones para publicar');
  }

  const now = new Date().toISOString();

  // Update note status
  const { error: updateError } = await supabase
    .from('specialist_session_notes')
    .update({
      shared_published_at: now,
      visibility_to_user: 'recommendations_only',
      updated_at: now,
    })
    .eq('id', noteId)
    .eq('specialist_id', specialist.id);

  if (updateError) throw new Error(updateError.message);

  // Upsert bitacora entry (idempotent - keyed on specialist_session_note_id which is UNIQUE)
  const { error: upsertError } = await supabase
    .from('specialist_bitacora_entries')
    .upsert({
      user_id: note.user_id,
      specialist_id: specialist.id,
      specialist_session_note_id: noteId,
      title: note.session_type ? `Sesion: ${note.session_type}` : 'Recomendaciones de especialista',
      date: note.session_date,
      shared_recommendations_snapshot: recommendations,
      updated_at: now,
    }, {
      onConflict: 'specialist_session_note_id',
    });

  if (upsertError) throw new Error(upsertError.message);
}

export async function getTypeSuggestions(input: { query: string }): Promise<string[]> {
  const specialist = await requireSpecialist();
  const supabase = await createClient();

  const term = input.query.trim();

  let query = supabase
    .from('specialist_session_notes')
    .select('session_type')
    .eq('specialist_id', specialist.id)
    .not('session_type', 'is', null);

  if (term) {
    query = query.ilike('session_type', `${term}%`);
  }

  const { data: types } = await query;

  const freqMap = new Map<string, number>();
  (types || []).forEach((row: { session_type: string | null }) => {
    if (row.session_type) {
      freqMap.set(row.session_type, (freqMap.get(row.session_type) || 0) + 1);
    }
  });

  return [...freqMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([type]) => type);
}

// ============================================================
// DASHBOARD DATA
// ============================================================

export async function getSpecialistDashboard() {
  const specialist = await requireSpecialist();
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  // Run all independent queries in parallel
  const [activeResult, sessionsResult, recentNotesResult, specialistProfileResult] = await Promise.all([
    supabase
      .from('specialist_user_relations')
      .select('id', { count: 'exact', head: true })
      .eq('specialist_id', specialist.id)
      .eq('status', 'active'),
    supabase
      .from('specialist_session_notes')
      .select('id', { count: 'exact', head: true })
      .eq('specialist_id', specialist.id)
      .gte('session_date', monthStart),
    supabase
      .from('specialist_session_notes')
      .select('user_id, session_date')
      .eq('specialist_id', specialist.id)
      .order('session_date', { ascending: false })
      .limit(50),
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', specialist.id)
      .single(),
  ]);

  // Extract recent unique users
  const seenUsers = new Set<string>();
  const recentUserIds: string[] = [];
  (recentNotesResult.data || []).forEach((n: { user_id: string }) => {
    if (!seenUsers.has(n.user_id) && recentUserIds.length < 5) {
      seenUsers.add(n.user_id);
      recentUserIds.push(n.user_id);
    }
  });

  let recentUsers: { id: string; display_name: string | null; email: string | null }[] = [];
  if (recentUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .in('id', recentUserIds);
    recentUsers = (profiles || []) as { id: string; display_name: string | null; email: string | null }[];
  }

  return {
    displayName: specialistProfileResult.data?.display_name || 'Especialista',
    activeUsersCount: activeResult.count || 0,
    sessionsThisMonth: sessionsResult.count || 0,
    recentUsers,
  };
}
