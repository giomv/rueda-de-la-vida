'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  JournalSession,
  SessionWithRelations,
  SessionListItem,
  CreateSessionInput,
  UpdateSessionInput,
  SessionListFilters,
  SessionConflictInfo,
} from '@/lib/types/journal';

// ============================================================
// CREATE SESSION
// ============================================================

export async function createSession(input: CreateSessionInput): Promise<JournalSession> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Validate required fields
  const type = (input.type || '').trim();
  if (!type) throw new Error('Selecciona un tipo de sesión');
  if (type.length > 60) throw new Error('El tipo no puede superar 60 caracteres');
  if (!input.date) throw new Error('La fecha es requerida');

  // Shared session validations
  if (input.sharedSpaceId) {
    if (input.visibility === 'PRIVATE') {
      throw new Error('Las sesiones privadas no se pueden compartir');
    }

    // Verify user is member of the space
    const { data: membership } = await supabase
      .from('shared_space_members')
      .select('id')
      .eq('space_id', input.sharedSpaceId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .maybeSingle();

    if (!membership) throw new Error('No tienes acceso a este espacio');
  }

  // Insert session
  const { data: session, error: sessionError } = await supabase
    .from('journal_sessions')
    .insert({
      user_id: user.id,
      type,
      date: input.date,
      title: input.title?.trim() || null,
      provider_name: input.provider_name?.trim() || null,
      notes: input.notes?.trim() || null,
      duration_minutes: input.duration_minutes || null,
      domain_id: input.domain_id || null,
      goal_id: input.goal_id || null,
      visibility: input.sharedSpaceId ? 'DEFAULT' : (input.visibility || 'DEFAULT'),
      shared_space_id: input.sharedSpaceId || null,
      last_edited_by: user.id,
    })
    .select()
    .single();

  if (sessionError) throw new Error(sessionError.message);

  // Insert children in parallel
  const validInsights = input.insights.filter((i) => i.text.trim());
  const validActions = input.actions.filter((a) => a.text.trim());
  const validAttachments = input.attachments.filter((a) => a.url?.trim());

  const childInserts = [];

  if (validInsights.length > 0) {
    childInserts.push(
      supabase.from('session_insights').insert(
        validInsights.map((insight) => ({
          session_id: session.id,
          user_id: user.id,
          text: insight.text.trim(),
          note: insight.note?.trim() || null,
          is_primary: insight.is_primary || false,
          is_shared: insight.is_shared ?? true,
          domain_id: insight.domain_id || null,
          goal_id: insight.goal_id || null,
          order_index: insight.order_index,
        }))
      ).then(({ error }) => { if (error) throw new Error(error.message); })
    );
  }

  if (validActions.length > 0) {
    childInserts.push(
      supabase.from('session_actions').insert(
        validActions.map((action) => ({
          session_id: session.id,
          user_id: user.id,
          text: action.text.trim(),
          frequency_type: action.frequency_type || null,
          frequency_value: action.frequency_value || 1,
          target_date: action.target_date || null,
          is_shared: action.is_shared ?? true,
          domain_id: action.domain_id || null,
          goal_id: action.goal_id || null,
          order_index: action.order_index,
        }))
      ).then(({ error }) => { if (error) throw new Error(error.message); })
    );
  }

  if (validAttachments.length > 0) {
    childInserts.push(
      supabase.from('session_attachments').insert(
        validAttachments.map((att) => ({
          session_id: session.id,
          user_id: user.id,
          type: att.type || 'LINK',
          url: att.url?.trim() || null,
          label: att.label?.trim() || null,
          is_shared: att.is_shared ?? true,
        }))
      ).then(({ error }) => { if (error) throw new Error(error.message); })
    );
  }

  await Promise.all(childInserts);

  return session as JournalSession;
}

// ============================================================
// GET SESSION WITH RELATIONS
// ============================================================

export async function getSession(sessionId: string): Promise<SessionWithRelations> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // RLS handles access control (own sessions + shared sessions)
  const [
    { data: session, error: sessionError },
    { data: insights, error: insightsError },
    { data: actions, error: actionsError },
    { data: attachments, error: attachmentsError },
  ] = await Promise.all([
    supabase
      .from('journal_sessions')
      .select('*')
      .eq('id', sessionId)
      .single(),
    supabase
      .from('session_insights')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index'),
    supabase
      .from('session_actions')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index'),
    supabase
      .from('session_attachments')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at'),
  ]);

  if (sessionError) throw new Error('No tienes acceso a esta sesión');
  if (insightsError) throw new Error(insightsError.message);
  if (actionsError) throw new Error(actionsError.message);
  if (attachmentsError) throw new Error(attachmentsError.message);

  // Fetch domain and goal names if set
  let domain = null;
  let goal = null;

  if (session.domain_id) {
    const { data } = await supabase
      .from('life_domains')
      .select('id, name, icon')
      .eq('id', session.domain_id)
      .single();
    domain = data;
  }

  if (session.goal_id) {
    const { data } = await supabase
      .from('goals')
      .select('id, title')
      .eq('id', session.goal_id)
      .single();
    goal = data;
  }

  // Fetch shared space info if applicable
  let sharedSpaceName: string | null = null;
  let createdByName: string | null = null;
  let lastEditedByName: string | null = null;

  if (session.shared_space_id) {
    const { data: space } = await supabase
      .from('shared_spaces')
      .select('name')
      .eq('id', session.shared_space_id)
      .single();
    sharedSpaceName = space?.name || null;
  }

  // Collect all user_ids from session + child items for name resolution
  const namesToFetch = new Set<string>();
  namesToFetch.add(session.user_id);
  if (session.last_edited_by) namesToFetch.add(session.last_edited_by);
  (insights || []).forEach((i: { user_id: string }) => namesToFetch.add(i.user_id));
  (actions || []).forEach((a: { user_id: string }) => namesToFetch.add(a.user_id));
  (attachments || []).forEach((a: { user_id: string }) => namesToFetch.add(a.user_id));

  const nameIds = [...namesToFetch];
  const nameMap = new Map<string, string>();

  if (nameIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', nameIds);
    (profiles || []).forEach((p: { id: string; display_name: string | null }) => {
      nameMap.set(p.id, p.display_name || 'Usuario');
    });
  }

  createdByName = nameMap.get(session.user_id) || null;
  lastEditedByName = session.last_edited_by ? (nameMap.get(session.last_edited_by) || null) : null;

  // Enrich child items with createdByName (only for shared sessions with multiple contributors)
  const isSharedSession = !!session.shared_space_id;
  const enrichedInsights = (insights || []).map((i: Record<string, unknown>) => ({
    ...i,
    createdByName: isSharedSession ? (nameMap.get(i.user_id as string) || null) : null,
  }));
  const enrichedActions = (actions || []).map((a: Record<string, unknown>) => ({
    ...a,
    createdByName: isSharedSession ? (nameMap.get(a.user_id as string) || null) : null,
  }));
  const enrichedAttachments = (attachments || []).map((a: Record<string, unknown>) => ({
    ...a,
    createdByName: isSharedSession ? (nameMap.get(a.user_id as string) || null) : null,
  }));

  // Compute canAddItems: owner always can, collaborator needs canEdit
  let canAddItems = session.user_id === user.id;
  if (!canAddItems && session.shared_space_id) {
    const { data: membership } = await supabase
      .from('shared_space_members')
      .select('permissions')
      .eq('space_id', session.shared_space_id)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .maybeSingle();
    canAddItems = !!(membership?.permissions as { canEdit?: boolean })?.canEdit;
  }

  // Check archived state for current user
  let isArchived = false;
  if (session.shared_space_id) {
    const { data: userState } = await supabase
      .from('journal_session_user_states')
      .select('archived_at')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle();
    isArchived = !!userState?.archived_at;
  }

  return {
    ...session,
    insights: enrichedInsights,
    actions: enrichedActions,
    attachments: enrichedAttachments,
    domain,
    goal,
    sharedSpaceName,
    createdByName,
    lastEditedByName,
    lockVersion: session.lock_version,
    isOwner: session.user_id === user.id,
    isArchived,
    canAddItems,
    currentUserId: user.id,
  } as SessionWithRelations;
}

// ============================================================
// UPDATE SESSION (replace strategy for children)
// ============================================================

export async function updateSession(
  sessionId: string,
  input: UpdateSessionInput
): Promise<JournalSession> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Fetch current session (RLS enforces access)
  const { data: existing, error: existError } = await supabase
    .from('journal_sessions')
    .select('id, user_id, shared_space_id, lock_version, last_edited_by')
    .eq('id', sessionId)
    .single();

  if (existError || !existing) throw new Error('Sesión no encontrada');

  // Permission check: owner can do everything, collaborator needs canEdit
  const isOwner = existing.user_id === user.id;
  if (!isOwner) {
    if (!existing.shared_space_id) {
      throw new Error('Solo el creador puede editar esta sesión');
    }
    const { data: membership } = await supabase
      .from('shared_space_members')
      .select('permissions')
      .eq('space_id', existing.shared_space_id)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .maybeSingle();
    if (!(membership?.permissions as { canEdit?: boolean })?.canEdit) {
      throw new Error('No tienes permiso para editar esta sesión');
    }
  }

  // Lock version check for shared sessions
  if (existing.shared_space_id && input.lockVersion !== undefined) {
    if (input.lockVersion !== existing.lock_version) {
      // Fetch last editor name for conflict info
      let lastEditedByName = 'otro usuario';
      if (existing.last_edited_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', existing.last_edited_by)
          .single();
        lastEditedByName = profile?.display_name || 'otro usuario';
      }

      const conflictInfo: SessionConflictInfo = {
        currentVersion: existing.lock_version,
        lastEditedBy: existing.last_edited_by || '',
        lastEditedByName,
        lastEditedAt: new Date().toISOString(),
      };
      throw new Error(`CONFLICT:${JSON.stringify(conflictInfo)}`);
    }
  }

  // Build update object — always bump lock_version and last_edited_by
  const updates: Record<string, unknown> = {
    last_edited_by: user.id,
    lock_version: existing.lock_version + 1,
  };
  // Only owner can update session-level fields
  if (isOwner) {
    if (input.type !== undefined) updates.type = (input.type || '').trim();
    if (input.date !== undefined) updates.date = input.date;
    if (input.title !== undefined) updates.title = input.title?.trim() || null;
    if (input.provider_name !== undefined) updates.provider_name = input.provider_name?.trim() || null;
    if (input.notes !== undefined) updates.notes = input.notes?.trim() || null;
    if (input.duration_minutes !== undefined) updates.duration_minutes = input.duration_minutes || null;
    if (input.domain_id !== undefined) updates.domain_id = input.domain_id || null;
    if (input.goal_id !== undefined) updates.goal_id = input.goal_id || null;
    if (input.visibility !== undefined) updates.visibility = input.visibility;
  }

  // Update session fields (RLS allows owner or shared-editable)
  const { data: session, error: updateError } = await supabase
    .from('journal_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  // Replace current user's children if provided (delete own + re-insert)
  if (input.insights !== undefined) {
    await supabase.from('session_insights').delete().eq('session_id', sessionId).eq('user_id', user.id);
    const validInsights = input.insights.filter((i) => i.text.trim());
    if (validInsights.length > 0) {
      const { error: insError } = await supabase.from('session_insights').insert(
        validInsights.map((insight) => ({
          session_id: sessionId,
          user_id: user.id,
          text: insight.text.trim(),
          note: insight.note?.trim() || null,
          is_primary: insight.is_primary || false,
          is_shared: insight.is_shared ?? true,
          domain_id: insight.domain_id || null,
          goal_id: insight.goal_id || null,
          order_index: insight.order_index,
        }))
      );
      if (insError) throw new Error(insError.message);
    }
  }

  if (input.actions !== undefined) {
    await supabase.from('session_actions').delete().eq('session_id', sessionId).eq('user_id', user.id);
    const validActions = input.actions.filter((a) => a.text.trim());
    if (validActions.length > 0) {
      const { error: actError } = await supabase.from('session_actions').insert(
        validActions.map((action) => ({
          session_id: sessionId,
          user_id: user.id,
          text: action.text.trim(),
          frequency_type: action.frequency_type || null,
          frequency_value: action.frequency_value || 1,
          target_date: action.target_date || null,
          is_shared: action.is_shared ?? true,
          domain_id: action.domain_id || null,
          goal_id: action.goal_id || null,
          order_index: action.order_index,
        }))
      );
      if (actError) throw new Error(actError.message);
    }
  }

  if (input.attachments !== undefined) {
    await supabase.from('session_attachments').delete().eq('session_id', sessionId).eq('user_id', user.id);
    const validAttachments = input.attachments.filter((a) => a.url?.trim());
    if (validAttachments.length > 0) {
      const { error: attError } = await supabase.from('session_attachments').insert(
        validAttachments.map((att) => ({
          session_id: sessionId,
          user_id: user.id,
          type: att.type || 'LINK',
          url: att.url?.trim() || null,
          label: att.label?.trim() || null,
          is_shared: att.is_shared ?? true,
        }))
      );
      if (attError) throw new Error(attError.message);
    }
  }

  return session as JournalSession;
}

// ============================================================
// PER-ITEM ADD/DELETE ACTIONS (for collaborators)
// ============================================================

export async function addInsightToSession(input: {
  sessionId: string;
  text: string;
  note?: string;
  is_primary?: boolean;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const text = input.text.trim();
  if (!text) throw new Error('El texto es requerido');

  // Get next order_index
  const { data: existing } = await supabase
    .from('session_insights')
    .select('order_index')
    .eq('session_id', input.sessionId)
    .order('order_index', { ascending: false })
    .limit(1);
  const nextIndex = (existing?.[0]?.order_index ?? -1) + 1;

  const { error } = await supabase.from('session_insights').insert({
    session_id: input.sessionId,
    user_id: user.id,
    text,
    note: input.note?.trim() || null,
    is_primary: input.is_primary || false,
    is_shared: true,
    order_index: nextIndex,
  });
  if (error) throw new Error(error.message);

  // Bump lock_version
  const { data: session } = await supabase
    .from('journal_sessions')
    .select('lock_version')
    .eq('id', input.sessionId)
    .single();
  if (session) {
    await supabase
      .from('journal_sessions')
      .update({ lock_version: session.lock_version + 1, last_edited_by: user.id })
      .eq('id', input.sessionId);
  }
}

export async function addActionToSession(input: {
  sessionId: string;
  text: string;
  frequency_type?: string | null;
  frequency_value?: number | null;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const text = input.text.trim();
  if (!text) throw new Error('El texto es requerido');

  const { data: existing } = await supabase
    .from('session_actions')
    .select('order_index')
    .eq('session_id', input.sessionId)
    .order('order_index', { ascending: false })
    .limit(1);
  const nextIndex = (existing?.[0]?.order_index ?? -1) + 1;

  const { error } = await supabase.from('session_actions').insert({
    session_id: input.sessionId,
    user_id: user.id,
    text,
    frequency_type: input.frequency_type || null,
    frequency_value: input.frequency_value || 1,
    is_shared: true,
    order_index: nextIndex,
  });
  if (error) throw new Error(error.message);

  const { data: session } = await supabase
    .from('journal_sessions')
    .select('lock_version')
    .eq('id', input.sessionId)
    .single();
  if (session) {
    await supabase
      .from('journal_sessions')
      .update({ lock_version: session.lock_version + 1, last_edited_by: user.id })
      .eq('id', input.sessionId);
  }
}

export async function addAttachmentToSession(input: {
  sessionId: string;
  url: string;
  label?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const url = input.url.trim();
  if (!url) throw new Error('La URL es requerida');

  const { error } = await supabase.from('session_attachments').insert({
    session_id: input.sessionId,
    user_id: user.id,
    type: 'LINK',
    url,
    label: input.label?.trim() || null,
    is_shared: true,
  });
  if (error) throw new Error(error.message);

  const { data: session } = await supabase
    .from('journal_sessions')
    .select('lock_version')
    .eq('id', input.sessionId)
    .single();
  if (session) {
    await supabase
      .from('journal_sessions')
      .update({ lock_version: session.lock_version + 1, last_edited_by: user.id })
      .eq('id', input.sessionId);
  }
}

export async function updateInsightInSession(
  insightId: string,
  input: { text: string }
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const text = input.text.trim();
  if (!text) throw new Error('El texto es requerido');

  const { data: existing } = await supabase
    .from('session_insights')
    .select('id, user_id')
    .eq('id', insightId)
    .single();

  if (!existing) throw new Error('Insight no encontrado');
  if (existing.user_id !== user.id) throw new Error('Solo puedes editar tus propios insights');

  const { error } = await supabase
    .from('session_insights')
    .update({ text })
    .eq('id', insightId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function deleteInsightFromSession(insightId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // RLS enforces user_id = auth.uid()
  const { error } = await supabase
    .from('session_insights')
    .delete()
    .eq('id', insightId);
  if (error) throw new Error(error.message);
}

export async function updateActionInSession(
  actionId: string,
  input: { text: string; frequency_type?: string | null }
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const text = input.text.trim();
  if (!text) throw new Error('El texto es requerido');

  // Only update own actions (RLS + explicit check)
  const { data: existing } = await supabase
    .from('session_actions')
    .select('id, user_id, session_id')
    .eq('id', actionId)
    .single();

  if (!existing) throw new Error('Acción no encontrada');
  if (existing.user_id !== user.id) throw new Error('Solo puedes editar tus propias acciones');

  const updates: Record<string, unknown> = { text };
  if (input.frequency_type !== undefined) {
    updates.frequency_type = input.frequency_type || null;
  }

  const { error } = await supabase
    .from('session_actions')
    .update(updates)
    .eq('id', actionId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function deleteActionFromSession(actionId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('session_actions')
    .delete()
    .eq('id', actionId);
  if (error) throw new Error(error.message);
}

export async function updateAttachmentInSession(
  attachmentId: string,
  input: { url?: string; label?: string }
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: existing } = await supabase
    .from('session_attachments')
    .select('id, user_id')
    .eq('id', attachmentId)
    .single();

  if (!existing) throw new Error('Adjunto no encontrado');
  if (existing.user_id !== user.id) throw new Error('Solo puedes editar tus propios adjuntos');

  const updates: Record<string, unknown> = {};
  if (input.url !== undefined) {
    const url = input.url.trim();
    if (!url) throw new Error('La URL es requerida');
    updates.url = url;
  }
  if (input.label !== undefined) {
    updates.label = input.label.trim() || null;
  }

  const { error } = await supabase
    .from('session_attachments')
    .update(updates)
    .eq('id', attachmentId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function deleteAttachmentFromSession(attachmentId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('session_attachments')
    .delete()
    .eq('id', attachmentId);
  if (error) throw new Error(error.message);
}

// ============================================================
// DELETE SESSION
// ============================================================

export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Check if shared session - only owner can delete
  const { data: session } = await supabase
    .from('journal_sessions')
    .select('user_id, shared_space_id')
    .eq('id', sessionId)
    .single();

  if (!session) throw new Error('Sesión no encontrada');

  if (session.shared_space_id && session.user_id !== user.id) {
    throw new Error('Solo el creador puede eliminar sesiones compartidas');
  }

  const { error } = await supabase
    .from('journal_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ============================================================
// LIST SESSIONS (with filters, search, pagination)
// ============================================================

export async function listSessions(filters: SessionListFilters): Promise<{
  items: SessionListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const limit = filters.limit || 20;

  // RLS handles visibility (own + shared sessions)
  let query = supabase
    .from('journal_sessions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  // Ownership filter
  if (filters.ownership === 'mine') {
    query = query.eq('user_id', user.id).is('shared_space_id', null);
  } else if (filters.ownership === 'shared') {
    query = query.not('shared_space_id', 'is', null);
    if (filters.spaceId) {
      query = query.eq('shared_space_id', filters.spaceId);
    }
  } else {
    // 'all' or undefined: RLS returns own + shared sessions
  }

  // Apply filters
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.domain_id) {
    query = query.eq('domain_id', filters.domain_id);
  }
  if (filters.goal_id) {
    query = query.eq('goal_id', filters.goal_id);
  }
  if (filters.date_from) {
    query = query.gte('date', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('date', filters.date_to);
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`title.ilike.${term},provider_name.ilike.${term},notes.ilike.${term}`);
  }
  if (filters.cursor) {
    query = query.lt('created_at', filters.cursor);
  }

  const { data: sessions, error } = await query;
  if (error) throw new Error(error.message);

  const hasMore = (sessions?.length || 0) > limit;
  let items = (sessions || []).slice(0, limit);

  if (items.length === 0) {
    return { items: [], nextCursor: null, hasMore: false };
  }

  // Filter out archived sessions (per-user) unless explicitly requesting archived
  if (!filters.archived) {
    const sessionIds = items.map((s) => s.id);
    const { data: archivedStates } = await supabase
      .from('journal_session_user_states')
      .select('session_id')
      .eq('user_id', user.id)
      .in('session_id', sessionIds)
      .not('archived_at', 'is', null);

    if (archivedStates && archivedStates.length > 0) {
      const archivedIds = new Set(archivedStates.map((s) => s.session_id));
      items = items.filter((s) => !archivedIds.has(s.id));
    }
  } else {
    // Only show archived
    const sessionIds = items.map((s) => s.id);
    const { data: archivedStates } = await supabase
      .from('journal_session_user_states')
      .select('session_id')
      .eq('user_id', user.id)
      .in('session_id', sessionIds)
      .not('archived_at', 'is', null);

    const archivedIds = new Set((archivedStates || []).map((s) => s.session_id));
    items = items.filter((s) => archivedIds.has(s.id));
  }

  // Get insight and action counts
  const sessionIds = items.map((s) => s.id);

  const [
    { data: insightCounts },
    { data: actionCounts },
  ] = await Promise.all([
    supabase
      .from('session_insights')
      .select('session_id')
      .in('session_id', sessionIds),
    supabase
      .from('session_actions')
      .select('session_id')
      .in('session_id', sessionIds),
  ]);

  // Count per session
  const insightCountMap = new Map<string, number>();
  const actionCountMap = new Map<string, number>();
  (insightCounts || []).forEach((row: { session_id: string }) => {
    insightCountMap.set(row.session_id, (insightCountMap.get(row.session_id) || 0) + 1);
  });
  (actionCounts || []).forEach((row: { session_id: string }) => {
    actionCountMap.set(row.session_id, (actionCountMap.get(row.session_id) || 0) + 1);
  });

  // Get domain and goal info for sessions that have them
  const domainIds = [...new Set(items.map((s) => s.domain_id).filter(Boolean))];
  const goalIds = [...new Set(items.map((s) => s.goal_id).filter(Boolean))];

  const domainMap = new Map<string, { name: string; icon: string | null }>();
  const goalMap = new Map<string, { title: string }>();

  if (domainIds.length > 0) {
    const { data: domains } = await supabase
      .from('life_domains')
      .select('id, name, icon')
      .in('id', domainIds);
    (domains || []).forEach((d: { id: string; name: string; icon: string | null }) => {
      domainMap.set(d.id, { name: d.name, icon: d.icon });
    });
  }

  if (goalIds.length > 0) {
    const { data: goals } = await supabase
      .from('goals')
      .select('id, title')
      .in('id', goalIds);
    (goals || []).forEach((g: { id: string; title: string }) => {
      goalMap.set(g.id, { title: g.title });
    });
  }

  // Get shared space names and creator names for shared sessions
  const sharedSpaceIds = [...new Set(items.filter(s => s.shared_space_id).map(s => s.shared_space_id))];
  const creatorIds = [...new Set(items.filter(s => s.shared_space_id).map(s => s.user_id))];

  const spaceNameMap = new Map<string, string>();
  const creatorNameMap = new Map<string, string>();

  if (sharedSpaceIds.length > 0) {
    const { data: spaces } = await supabase
      .from('shared_spaces')
      .select('id, name')
      .in('id', sharedSpaceIds);
    (spaces || []).forEach((s: { id: string; name: string }) => {
      spaceNameMap.set(s.id, s.name);
    });
  }

  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', creatorIds);
    (profiles || []).forEach((p: { id: string; display_name: string | null }) => {
      creatorNameMap.set(p.id, p.display_name || 'Usuario');
    });
  }

  const listItems: SessionListItem[] = items.map((s) => {
    const domain = s.domain_id ? domainMap.get(s.domain_id) : null;
    const goal = s.goal_id ? goalMap.get(s.goal_id) : null;
    const isShared = !!s.shared_space_id;
    return {
      id: s.id,
      type: s.type,
      title: s.title,
      date: s.date,
      provider_name: s.provider_name,
      visibility: s.visibility,
      domain_name: domain?.name || null,
      domain_icon: domain?.icon || null,
      goal_title: goal?.title || null,
      insight_count: insightCountMap.get(s.id) || 0,
      action_count: actionCountMap.get(s.id) || 0,
      created_at: s.created_at,
      shared_space_id: s.shared_space_id || null,
      sharedSpaceName: s.shared_space_id ? (spaceNameMap.get(s.shared_space_id) || null) : null,
      createdByName: isShared ? (creatorNameMap.get(s.user_id) || null) : null,
      isShared,
    };
  });

  return {
    items: listItems,
    nextCursor: hasMore ? items[items.length - 1]?.created_at || null : null,
    hasMore,
  };
}

// ============================================================
// ARCHIVE / UNARCHIVE SESSION (per-user)
// ============================================================

export async function archiveSessionForMe(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('journal_session_user_states')
    .upsert({
      session_id: sessionId,
      user_id: user.id,
      archived_at: new Date().toISOString(),
    }, {
      onConflict: 'session_id,user_id',
    });

  if (error) throw new Error(error.message);
}

export async function unarchiveSessionForMe(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('journal_session_user_states')
    .update({ archived_at: null })
    .eq('session_id', sessionId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ============================================================
// GET TYPE SUGGESTIONS
// ============================================================

export async function getTypeSuggestions(input: {
  query: string;
  spaceId?: string | null;
}): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const term = input.query.trim();

  // Get user's own session types
  let query = supabase
    .from('journal_sessions')
    .select('type')
    .eq('user_id', user.id);

  if (term) {
    query = query.ilike('type', `${term}%`);
  }

  const { data: ownTypes } = await query;

  // Get space session types if spaceId provided
  let spaceTypes: { type: string }[] = [];
  if (input.spaceId) {
    let spaceQuery = supabase
      .from('journal_sessions')
      .select('type')
      .eq('shared_space_id', input.spaceId);

    if (term) {
      spaceQuery = spaceQuery.ilike('type', `${term}%`);
    }

    const { data } = await spaceQuery;
    spaceTypes = data || [];
  }

  // Combine and count frequency
  const freqMap = new Map<string, number>();
  [...(ownTypes || []), ...spaceTypes].forEach((row) => {
    const t = row.type;
    freqMap.set(t, (freqMap.get(t) || 0) + 1);
  });

  // Sort by frequency DESC, limit to 10
  return [...freqMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([type]) => type);
}

// ============================================================
// SEND ACTION TO LIFEPLAN
// ============================================================

export async function sendActionToLifePlan(sessionActionId: string): Promise<{
  activityId: string;
  alreadyExists: boolean;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Fetch the action and its parent session
  const { data: action, error: actionError } = await supabase
    .from('session_actions')
    .select('*')
    .eq('id', sessionActionId)
    .single();

  if (actionError || !action) throw new Error('Acción no encontrada');

  // Verify session access via RLS (works for both own and shared sessions)
  const { data: session, error: sessionError } = await supabase
    .from('journal_sessions')
    .select('user_id, domain_id, goal_id')
    .eq('id', action.session_id)
    .single();

  if (sessionError || !session) throw new Error('Sesión no encontrada');

  // Check if already created
  if (action.lifeplan_activity_id) {
    return { activityId: action.lifeplan_activity_id, alreadyExists: true };
  }

  // Also check by unique constraint
  const { data: existing } = await supabase
    .from('lifeplan_activities')
    .select('id')
    .eq('user_id', user.id)
    .eq('source_type', 'JOURNAL')
    .eq('source_id', sessionActionId)
    .maybeSingle();

  if (existing) {
    // Update the backlink
    await supabase
      .from('session_actions')
      .update({ lifeplan_activity_id: existing.id })
      .eq('id', sessionActionId);
    return { activityId: existing.id, alreadyExists: true };
  }

  // Resolve domain and goal (action override > session)
  const resolvedDomainId = action.domain_id || session.domain_id || null;
  const resolvedGoalId = action.goal_id || session.goal_id || null;

  // Create the activity for CURRENT USER (not session owner)
  const { data: activity, error: createError } = await supabase
    .from('lifeplan_activities')
    .insert({
      user_id: user.id,
      title: action.text,
      domain_id: resolvedDomainId,
      goal_id: resolvedGoalId,
      source_type: 'JOURNAL',
      source_id: sessionActionId,
      frequency_type: action.frequency_type || 'WEEKLY',
      frequency_value: action.frequency_value || 1,
      order_position: 0,
      is_archived: false,
    })
    .select()
    .single();

  if (createError) throw new Error(createError.message);

  // Update the backlink
  await supabase
    .from('session_actions')
    .update({ lifeplan_activity_id: activity.id })
    .eq('id', sessionActionId);

  return { activityId: activity.id, alreadyExists: false };
}

// ============================================================
// GET SESSIONS BY CONTEXT (for dashboard integration)
// ============================================================

export async function getSessionsByContext(params: {
  domain_id?: string;
  goal_id?: string;
  limit?: number;
}): Promise<SessionListItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const limit = params.limit || 5;

  let query = supabase
    .from('journal_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit);

  if (params.domain_id) {
    query = query.eq('domain_id', params.domain_id);
  }
  if (params.goal_id) {
    query = query.eq('goal_id', params.goal_id);
  }

  const { data: sessions, error } = await query;
  if (error) throw new Error(error.message);

  return (sessions || []).map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    date: s.date,
    provider_name: s.provider_name,
    visibility: s.visibility,
    domain_name: null,
    domain_icon: null,
    goal_title: null,
    insight_count: 0,
    action_count: 0,
    created_at: s.created_at,
    shared_space_id: s.shared_space_id || null,
    sharedSpaceName: null,
    createdByName: null,
    isShared: !!s.shared_space_id,
  })) as SessionListItem[];
}

// ============================================================
// GET SESSION ID FOR ACTION (for LifePlan → Bitacora link)
// ============================================================

export async function getSessionIdForAction(sourceId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data } = await supabase
    .from('session_actions')
    .select('session_id')
    .eq('id', sourceId)
    .single();

  return data?.session_id || null;
}
