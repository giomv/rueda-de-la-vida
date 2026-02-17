'use server';

import { createClient } from '@/lib/supabase/server';
import type { SharedSpace, SharedSpaceMember, PendingInvitation } from '@/lib/types/journal';

// ============================================================
// CREATE SHARED SPACE
// ============================================================

export async function createSharedSpace(input: {
  name: string;
  inviteEmail: string;
}): Promise<SharedSpace> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const name = input.name.trim();
  const email = input.inviteEmail.trim().toLowerCase();

  // Validation
  if (!name) throw new Error('El nombre del espacio es obligatorio');
  if (name.length > 60) throw new Error('El nombre no puede superar 60 caracteres');
  if (!email) throw new Error('Ingresa el email de la persona que deseas invitar');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ingresa un email válido');
  if (email === user.email) throw new Error('No puedes invitarte a ti mismo');

  // Create space (trigger auto-adds owner as member)
  const { data: space, error: spaceError } = await supabase
    .from('shared_spaces')
    .insert({ name, owner_id: user.id })
    .select()
    .single();

  if (spaceError) throw new Error(spaceError.message);

  // Check if invited email belongs to an existing user
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  // Add invited member
  const { error: memberError } = await supabase
    .from('shared_space_members')
    .insert({
      space_id: space.id,
      user_id: existingUser?.id || null,
      invited_email: email,
      role: 'collaborator',
      status: 'pending',
      permissions: { canEdit: true },
    });

  if (memberError) throw new Error(memberError.message);

  // Fetch complete space with members
  return getSharedSpace(space.id);
}

// ============================================================
// LIST SHARED SPACES
// ============================================================

export async function listSharedSpaces(): Promise<SharedSpace[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get spaces where user is owner or accepted member (RLS handles this)
  const { data: spaces, error } = await supabase
    .from('shared_spaces')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!spaces || spaces.length === 0) return [];

  // Get members for all spaces
  const spaceIds = spaces.map((s) => s.id);
  const { data: members } = await supabase
    .from('shared_space_members')
    .select('*')
    .in('space_id', spaceIds);

  // Get user names for members
  const userIds = [...new Set((members || []).filter(m => m.user_id).map(m => m.user_id))];
  const userNameMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);
    (profiles || []).forEach((p: { id: string; display_name: string | null }) => {
      userNameMap.set(p.id, p.display_name || 'Usuario');
    });
  }

  return spaces.map((s) => ({
    id: s.id,
    name: s.name,
    ownerId: s.owner_id,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    members: (members || [])
      .filter((m) => m.space_id === s.id)
      .map((m) => ({
        id: m.id,
        spaceId: m.space_id,
        userId: m.user_id,
        invitedEmail: m.invited_email,
        role: m.role,
        status: m.status,
        permissions: m.permissions,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        userName: m.user_id ? userNameMap.get(m.user_id) : undefined,
      })),
  }));
}

// ============================================================
// GET SHARED SPACE
// ============================================================

export async function getSharedSpace(spaceId: string): Promise<SharedSpace> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: space, error } = await supabase
    .from('shared_spaces')
    .select('*')
    .eq('id', spaceId)
    .single();

  if (error || !space) throw new Error('Espacio no encontrado');

  const { data: members } = await supabase
    .from('shared_space_members')
    .select('*')
    .eq('space_id', spaceId);

  // Get user names
  const userIds = [...new Set((members || []).filter(m => m.user_id).map(m => m.user_id))];
  const userNameMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);
    (profiles || []).forEach((p: { id: string; display_name: string | null }) => {
      userNameMap.set(p.id, p.display_name || 'Usuario');
    });
  }

  return {
    id: space.id,
    name: space.name,
    ownerId: space.owner_id,
    createdAt: space.created_at,
    updatedAt: space.updated_at,
    members: (members || []).map((m) => ({
      id: m.id,
      spaceId: m.space_id,
      userId: m.user_id,
      invitedEmail: m.invited_email,
      role: m.role,
      status: m.status,
      permissions: m.permissions,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      userName: m.user_id ? userNameMap.get(m.user_id) : undefined,
    })),
  };
}

// ============================================================
// RENAME SHARED SPACE
// ============================================================

export async function renameSharedSpace(spaceId: string, name: string): Promise<SharedSpace> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const trimmed = name.trim();
  if (!trimmed) throw new Error('El nombre del espacio es obligatorio');
  if (trimmed.length > 60) throw new Error('El nombre no puede superar 60 caracteres');

  // RLS ensures only owner can update
  const { error } = await supabase
    .from('shared_spaces')
    .update({ name: trimmed })
    .eq('id', spaceId);

  if (error) throw new Error(error.message);

  return getSharedSpace(spaceId);
}

// ============================================================
// DELETE SHARED SPACE
// ============================================================

export async function deleteSharedSpace(spaceId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Verify ownership
  const { data: space } = await supabase
    .from('shared_spaces')
    .select('owner_id')
    .eq('id', spaceId)
    .single();

  if (!space || space.owner_id !== user.id) {
    throw new Error('Solo el propietario puede eliminar el espacio');
  }

  // Nullify session references first
  await supabase
    .from('journal_sessions')
    .update({ shared_space_id: null })
    .eq('shared_space_id', spaceId);

  // Delete space (CASCADE: members)
  const { error } = await supabase
    .from('shared_spaces')
    .delete()
    .eq('id', spaceId);

  if (error) throw new Error(error.message);
}

// ============================================================
// INVITE TO SPACE
// ============================================================

export async function inviteToSpace(spaceId: string, email: string): Promise<SharedSpaceMember> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) throw new Error('Ingresa el email de la persona que deseas invitar');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) throw new Error('Ingresa un email válido');
  if (trimmedEmail === user.email) throw new Error('No puedes invitarte a ti mismo');

  // Verify ownership
  const { data: space } = await supabase
    .from('shared_spaces')
    .select('owner_id')
    .eq('id', spaceId)
    .single();

  if (!space || space.owner_id !== user.id) {
    throw new Error('Solo el propietario puede invitar miembros');
  }

  // Check member limit (V1: max 2 total)
  const { data: existingMembers } = await supabase
    .from('shared_space_members')
    .select('id')
    .eq('space_id', spaceId);

  if ((existingMembers || []).length >= 2) {
    throw new Error('Este espacio ya tiene el máximo de miembros permitidos');
  }

  // Check if invited email belongs to an existing user
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', trimmedEmail)
    .maybeSingle();

  const { data: member, error } = await supabase
    .from('shared_space_members')
    .insert({
      space_id: spaceId,
      user_id: existingUser?.id || null,
      invited_email: trimmedEmail,
      role: 'collaborator',
      status: 'pending',
      permissions: { canEdit: true },
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe una invitación para este email en este espacio');
    }
    throw new Error(error.message);
  }

  return {
    id: member.id,
    spaceId: member.space_id,
    userId: member.user_id,
    invitedEmail: member.invited_email,
    role: member.role,
    status: member.status,
    permissions: member.permissions,
    createdAt: member.created_at,
    updatedAt: member.updated_at,
  };
}

// ============================================================
// LIST PENDING INVITATIONS
// ============================================================

export async function listPendingInvitations(): Promise<PendingInvitation[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: invitations, error } = await supabase
    .from('shared_space_members')
    .select(`
      id,
      space_id,
      created_at,
      shared_spaces!inner (
        id,
        name,
        owner_id
      )
    `)
    .eq('invited_email', user.email)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
  if (!invitations || invitations.length === 0) return [];

  // Get owner names
  const ownerIds = [...new Set(invitations.map((i: any) => i.shared_spaces.owner_id))];
  const ownerNameMap = new Map<string, { name: string; email: string }>();

  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', ownerIds);
    (profiles || []).forEach((p: { id: string; display_name: string | null }) => {
      ownerNameMap.set(p.id, {
        name: p.display_name || 'Usuario',
        email: '',
      });
    });
  }

  return invitations.map((i: any) => ({
    id: i.id,
    spaceId: i.space_id,
    spaceName: i.shared_spaces.name,
    ownerName: ownerNameMap.get(i.shared_spaces.owner_id)?.name || 'Usuario',
    ownerEmail: ownerNameMap.get(i.shared_spaces.owner_id)?.email || '',
    createdAt: i.created_at,
  }));
}

// ============================================================
// ACCEPT INVITATION
// ============================================================

export async function acceptInvitation(memberId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // RLS handles permission check (only invited user can update pending invites)
  const { error } = await supabase
    .from('shared_space_members')
    .update({
      status: 'accepted',
      user_id: user.id,
    })
    .eq('id', memberId)
    .eq('invited_email', user.email)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
}

// ============================================================
// REJECT INVITATION
// ============================================================

export async function rejectInvitation(memberId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('shared_space_members')
    .update({ status: 'rejected' })
    .eq('id', memberId)
    .eq('invited_email', user.email)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
}

// ============================================================
// REMOVE MEMBER
// ============================================================

export async function removeMember(spaceId: string, memberId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Verify ownership
  const { data: space } = await supabase
    .from('shared_spaces')
    .select('owner_id')
    .eq('id', spaceId)
    .single();

  if (!space || space.owner_id !== user.id) {
    throw new Error('Solo el propietario puede eliminar miembros');
  }

  // Don't allow removing self (owner)
  const { data: member } = await supabase
    .from('shared_space_members')
    .select('role')
    .eq('id', memberId)
    .single();

  if (member?.role === 'owner') {
    throw new Error('No puedes eliminarte como propietario del espacio');
  }

  const { error } = await supabase
    .from('shared_space_members')
    .delete()
    .eq('id', memberId)
    .eq('space_id', spaceId);

  if (error) throw new Error(error.message);
}
