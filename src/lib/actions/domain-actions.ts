'use server';

import { createClient } from '@/lib/supabase/server';
import type { LifeDomain } from '@/lib/types';

// --- Utility function to normalize text to slug ---
function normalizeToSlug(input: string): string {
  const accentMap: Record<string, string> = {
    'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
    'ñ': 'n', 'ç': 'c',
    'Á': 'a', 'À': 'a', 'Â': 'a', 'Ã': 'a', 'Ä': 'a',
    'É': 'e', 'È': 'e', 'Ê': 'e', 'Ë': 'e',
    'Í': 'i', 'Ì': 'i', 'Î': 'i', 'Ï': 'i',
    'Ó': 'o', 'Ò': 'o', 'Ô': 'o', 'Õ': 'o', 'Ö': 'o',
    'Ú': 'u', 'Ù': 'u', 'Û': 'u', 'Ü': 'u',
    'Ñ': 'n', 'Ç': 'c',
  };

  return input
    .split('')
    .map(char => accentMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// --- Get all domains for the current user ---
export async function getUserDomains(): Promise<LifeDomain[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('life_domains')
    .select('*')
    .eq('user_id', user.id)
    .order('order_position');

  if (error) throw new Error(error.message);
  return data || [];
}

// --- Create a new domain ---
export async function createDomain(name: string, icon?: string): Promise<LifeDomain> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const slug = normalizeToSlug(name);

  // Get current max order
  const { data: existing } = await supabase
    .from('life_domains')
    .select('order_position')
    .eq('user_id', user.id)
    .order('order_position', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].order_position + 1 : 0;

  const { data, error } = await supabase
    .from('life_domains')
    .insert({
      user_id: user.id,
      name,
      slug,
      icon: icon || null,
      order_position: nextOrder,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un dominio con ese nombre');
    }
    throw new Error(error.message);
  }
  return data as LifeDomain;
}

// --- Update a domain ---
export async function updateDomain(domainId: string, updates: { name?: string; icon?: string }): Promise<void> {
  const supabase = await createClient();

  const updateData: Record<string, string | null> = {};
  if (updates.name) {
    updateData.name = updates.name;
    updateData.slug = normalizeToSlug(updates.name);
  }
  if (updates.icon !== undefined) {
    updateData.icon = updates.icon || null;
  }

  const { error } = await supabase
    .from('life_domains')
    .update(updateData)
    .eq('id', domainId);

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un dominio con ese nombre');
    }
    throw new Error(error.message);
  }
}

// --- Delete a domain ---
export async function deleteDomain(domainId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('life_domains')
    .delete()
    .eq('id', domainId);

  if (error) throw new Error(error.message);
}

// --- Reorder domains ---
export async function reorderDomains(domainIds: string[]): Promise<void> {
  const supabase = await createClient();

  const updates = domainIds.map((id, index) => ({
    id,
    order_position: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('life_domains')
      .update({ order_position: update.order_position })
      .eq('id', update.id);

    if (error) throw new Error(error.message);
  }
}

// --- Create default domains for a new user ---
export async function createDefaultDomains(): Promise<LifeDomain[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Check if user already has domains
  const { data: existing } = await supabase
    .from('life_domains')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return getUserDomains();
  }

  const defaultDomains = [
    { name: 'Personal', icon: '🌱', slug: 'personal' },
    { name: 'Carrera', icon: '💼', slug: 'carrera' },
    { name: 'Salud', icon: '💪', slug: 'salud' },
    { name: 'Finanzas', icon: '💰', slug: 'finanzas' },
    { name: 'Pareja', icon: '❤️', slug: 'pareja' },
    { name: 'Otro', icon: '✨', slug: 'otro' },
  ];

  const { data, error } = await supabase
    .from('life_domains')
    .insert(
      defaultDomains.map((d, i) => ({
        user_id: user.id,
        name: d.name,
        slug: d.slug,
        icon: d.icon,
        order_position: i,
      }))
    )
    .select();

  if (error) throw new Error(error.message);
  return data as LifeDomain[];
}

// --- Get or create default domains ---
export async function getOrCreateDomains(): Promise<LifeDomain[]> {
  const domains = await getUserDomains();
  if (domains.length === 0) {
    return createDefaultDomains();
  }
  return domains;
}

// --- Get life_domains filtered by active wheel domains ---
export async function getActiveWheelDomains(): Promise<LifeDomain[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get the active wheel
  const { data: activeWheel } = await supabase
    .from('wheels')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!activeWheel) {
    // No active wheel — fall back to all user domains
    return getUserDomains();
  }

  // Get wheel domains
  const { data: wheelDomains } = await supabase
    .from('domains')
    .select('name')
    .eq('wheel_id', activeWheel.id)
    .order('order_position');

  if (!wheelDomains || wheelDomains.length === 0) {
    return getUserDomains();
  }

  // Compute slugs from wheel domain names
  const wheelSlugs = wheelDomains.map(d => normalizeToSlug(d.name));

  // Get life_domains filtered by those slugs
  const { data: lifeDomains, error } = await supabase
    .from('life_domains')
    .select('*')
    .eq('user_id', user.id)
    .in('slug', wheelSlugs)
    .order('order_position');

  if (error) throw new Error(error.message);

  if (!lifeDomains || lifeDomains.length === 0) {
    return getUserDomains();
  }

  return lifeDomains;
}

// --- Get a single domain by ID ---
export async function getDomainById(domainId: string): Promise<LifeDomain | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('life_domains')
    .select('*')
    .eq('id', domainId)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data || null;
}

// --- Find domain by slug (for fuzzy matching) ---
export async function findDomainBySlug(slug: string): Promise<LifeDomain | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const normalizedSlug = normalizeToSlug(slug);

  const { data, error } = await supabase
    .from('life_domains')
    .select('*')
    .eq('user_id', user.id)
    .eq('slug', normalizedSlug)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data || null;
}
