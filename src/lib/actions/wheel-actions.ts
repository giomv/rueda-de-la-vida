'use server';

import { createClient } from '@/lib/supabase/server';
import type { Domain, Score, Priority, Reflection, IdealLife, ActionPlan, PlanGoal, Wheel } from '@/lib/types';

// --- Utility: normalize text to slug (same as domain-actions.ts) ---
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

// --- Sync wheel domains to life_domains (private helper) ---
async function syncWheelDomainsToLifeDomains(wheelId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Get wheel domains
  const { data: wheelDomains } = await supabase
    .from('domains')
    .select('*')
    .eq('wheel_id', wheelId)
    .order('order_position');

  if (!wheelDomains || wheelDomains.length === 0) return;

  // Get existing life_domains
  const { data: existingLifeDomains } = await supabase
    .from('life_domains')
    .select('*')
    .eq('user_id', user.id);

  const existingSlugs = new Set((existingLifeDomains || []).map(d => d.slug));
  const maxOrder = (existingLifeDomains || []).reduce(
    (max, d) => Math.max(max, d.order_position), -1
  );

  // Create missing life_domains
  const toInsert = [];
  let nextOrder = maxOrder + 1;

  for (const wd of wheelDomains) {
    const slug = normalizeToSlug(wd.name);
    if (!existingSlugs.has(slug)) {
      toInsert.push({
        user_id: user.id,
        name: wd.name,
        slug,
        icon: wd.icon,
        order_position: nextOrder++,
      });
      existingSlugs.add(slug);
    }
  }

  if (toInsert.length > 0) {
    await supabase.from('life_domains').insert(toInsert);
  }
}

// --- Get the active wheel for the current user ---
export async function getActiveWheel(): Promise<Wheel | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('wheels')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  return data as Wheel | null;
}

// --- Set a wheel as active (trigger handles deactivating others) ---
export async function setActiveWheel(wheelId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('wheels')
    .update({ is_active: true })
    .eq('id', wheelId);

  if (error) throw new Error(error.message);

  // Sync domains to life_domains
  await syncWheelDomainsToLifeDomains(wheelId);
}

export async function createWheel(title: string, mode: 'individual' | 'pareja' | 'compartida' = 'individual') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('wheels')
    .insert({
      title,
      mode,
      user_id: user?.id ?? null,
      is_guest: !user,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // If this is the user's only wheel, set it as active
  if (user) {
    const { count } = await supabase
      .from('wheels')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count === 1) {
      await setActiveWheel(data.id);
    }
  }

  return data;
}

export async function updateWheelTitle(wheelId: string, title: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('wheels')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', wheelId);

  if (error) throw new Error(error.message);
}

export async function deleteWheel(wheelId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if this wheel is active before deleting
  const { data: wheel } = await supabase
    .from('wheels')
    .select('is_active, user_id')
    .eq('id', wheelId)
    .single();

  const wasActive = wheel?.is_active;
  const userId = wheel?.user_id ?? user?.id;

  const { error } = await supabase
    .from('wheels')
    .delete()
    .eq('id', wheelId);

  if (error) throw new Error(error.message);

  // If deleted wheel was active, promote the most recent remaining wheel
  if (wasActive && userId) {
    const { data: remaining } = await supabase
      .from('wheels')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (remaining && remaining.length > 0) {
      await supabase
        .from('wheels')
        .update({ is_active: true })
        .eq('id', remaining[0].id);
    }
  }
}

export async function duplicateWheel(wheelId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get original wheel data
  const { data: original } = await supabase
    .from('wheels')
    .select('*, domains(*), scores(*)')
    .eq('id', wheelId)
    .single();

  if (!original) throw new Error('Rueda no encontrada');

  // Create new wheel
  const { data: newWheel } = await supabase
    .from('wheels')
    .insert({
      title: `${original.title} (copia)`,
      mode: original.mode,
      user_id: user?.id,
    })
    .select()
    .single();

  if (!newWheel) throw new Error('Error al crear la copia');

  // Copy domains
  if (original.domains?.length) {
    const newDomains = original.domains.map((d: Domain) => ({
      wheel_id: newWheel.id,
      name: d.name,
      icon: d.icon,
      order_position: d.order_position,
    }));

    await supabase.from('domains').insert(newDomains);
  }

  return newWheel;
}

export async function saveDomains(wheelId: string, domains: Omit<Domain, 'id' | 'created_at'>[]) {
  const supabase = await createClient();

  // Delete existing domains for this wheel
  await supabase.from('domains').delete().eq('wheel_id', wheelId);

  // Insert new domains
  const { data, error } = await supabase
    .from('domains')
    .insert(domains.map((d, i) => ({ ...d, wheel_id: wheelId, order_position: i })))
    .select();

  if (error) throw new Error(error.message);

  // If this wheel is active, sync domains to life_domains
  const { data: wheel } = await supabase
    .from('wheels')
    .select('is_active')
    .eq('id', wheelId)
    .single();

  if (wheel?.is_active) {
    await syncWheelDomainsToLifeDomains(wheelId);
  }

  return data;
}

export async function saveScores(wheelId: string, scores: { domain_id: string; score: number; notes?: string }[]) {
  const supabase = await createClient();

  // Upsert scores
  for (const score of scores) {
    const { error } = await supabase
      .from('scores')
      .upsert(
        {
          wheel_id: wheelId,
          domain_id: score.domain_id,
          score: score.score,
          notes: score.notes ?? null,
          scored_at: new Date().toISOString(),
        },
        { onConflict: 'wheel_id,domain_id' }
      );

    if (error) {
      // If upsert fails due to no unique constraint, try delete + insert
      await supabase
        .from('scores')
        .delete()
        .eq('wheel_id', wheelId)
        .eq('domain_id', score.domain_id);

      await supabase.from('scores').insert({
        wheel_id: wheelId,
        domain_id: score.domain_id,
        score: score.score,
        notes: score.notes ?? null,
      });
    }
  }
}

export async function savePriorities(wheelId: string, priorities: { domain_id: string; rank: number; is_focus: boolean }[]) {
  const supabase = await createClient();

  await supabase.from('priorities').delete().eq('wheel_id', wheelId);

  const { error } = await supabase
    .from('priorities')
    .insert(priorities.map((p) => ({ ...p, wheel_id: wheelId })));

  if (error) throw new Error(error.message);
}

export async function saveReflections(wheelId: string, reflections: { question_key: string; answer_text: string }[]) {
  const supabase = await createClient();

  for (const reflection of reflections) {
    const { data: existing } = await supabase
      .from('reflections')
      .select('id')
      .eq('wheel_id', wheelId)
      .eq('question_key', reflection.question_key)
      .single();

    if (existing) {
      await supabase
        .from('reflections')
        .update({ answer_text: reflection.answer_text })
        .eq('id', existing.id);
    } else {
      await supabase.from('reflections').insert({
        wheel_id: wheelId,
        question_key: reflection.question_key,
        answer_text: reflection.answer_text,
      });
    }
  }
}

export async function saveIdealLife(wheelId: string, items: { domain_id: string; vision_text: string; prompts_answers: Record<string, string> }[]) {
  const supabase = await createClient();

  for (const item of items) {
    const { data: existing } = await supabase
      .from('ideal_life')
      .select('id')
      .eq('wheel_id', wheelId)
      .eq('domain_id', item.domain_id)
      .single();

    if (existing) {
      await supabase
        .from('ideal_life')
        .update({ vision_text: item.vision_text, prompts_answers: item.prompts_answers })
        .eq('id', existing.id);
    } else {
      await supabase.from('ideal_life').insert({
        wheel_id: wheelId,
        domain_id: item.domain_id,
        vision_text: item.vision_text,
        prompts_answers: item.prompts_answers,
      });
    }
  }
}

export async function saveActionPlan(wheelId: string, plan: { domain_id: string; goal_text: string; target_score: number; goals?: PlanGoal[]; actions: { id: string; text: string; completed: boolean; goal_id?: string | null }[] }) {
  const supabase = await createClient();

  const goals = plan.goals ?? [];
  // Derive legacy goal_text from first goal for backward compat
  const goalText = goals.length > 0 ? goals[0].text : plan.goal_text;

  const { data: existing } = await supabase
    .from('action_plans')
    .select('id')
    .eq('wheel_id', wheelId)
    .eq('domain_id', plan.domain_id)
    .single();

  const payload = {
    goal_text: goalText,
    goals,
    target_score: plan.target_score,
    actions: plan.actions,
  };

  if (existing) {
    await supabase
      .from('action_plans')
      .update(payload)
      .eq('id', existing.id);
  } else {
    await supabase.from('action_plans').insert({
      wheel_id: wheelId,
      domain_id: plan.domain_id,
      ...payload,
    });
  }
}

export async function getWheelData(wheelId: string) {
  const supabase = await createClient();

  const [
    { data: wheel },
    { data: domains },
    { data: scores },
    { data: priorities },
    { data: reflections },
    { data: idealLife },
    { data: actionPlans },
  ] = await Promise.all([
    supabase.from('wheels').select('*').eq('id', wheelId).single(),
    supabase.from('domains').select('*').eq('wheel_id', wheelId).order('order_position'),
    supabase.from('scores').select('*').eq('wheel_id', wheelId),
    supabase.from('priorities').select('*').eq('wheel_id', wheelId).order('rank'),
    supabase.from('reflections').select('*').eq('wheel_id', wheelId),
    supabase.from('ideal_life').select('*').eq('wheel_id', wheelId),
    supabase.from('action_plans').select('*').eq('wheel_id', wheelId),
  ]);

  return {
    wheel,
    domains: domains || [],
    scores: scores || [],
    priorities: priorities || [],
    reflections: reflections || [],
    idealLife: idealLife || [],
    actionPlans: actionPlans || [],
  };
}
