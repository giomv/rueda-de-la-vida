'use server';

import { createClient } from '@/lib/supabase/server';
import type { Domain, Score, Priority, Reflection, IdealLife, ActionPlan } from '@/lib/types';

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
  const { error } = await supabase
    .from('wheels')
    .delete()
    .eq('id', wheelId);

  if (error) throw new Error(error.message);
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

export async function saveActionPlan(wheelId: string, plan: { domain_id: string; goal_text: string; target_score: number; actions: { id: string; text: string; completed: boolean }[] }) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('action_plans')
    .select('id')
    .eq('wheel_id', wheelId)
    .eq('domain_id', plan.domain_id)
    .single();

  if (existing) {
    await supabase
      .from('action_plans')
      .update({
        goal_text: plan.goal_text,
        target_score: plan.target_score,
        actions: plan.actions,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('action_plans').insert({
      wheel_id: wheelId,
      domain_id: plan.domain_id,
      goal_text: plan.goal_text,
      target_score: plan.target_score,
      actions: plan.actions,
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
