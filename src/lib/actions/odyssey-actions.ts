'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  Odyssey,
  OdysseyMilestone,
  OdysseyFeedback,
  OdysseyPrototype,
  FullOdysseyData,
  PlanWithMilestones,
} from '@/lib/types';

// --- CRUD ---

export async function createOdyssey(title: string, mode: 'individual' | 'pareja' = 'individual') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: odyssey, error } = await supabase
    .from('odysseys')
    .insert({ title, mode, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Create 3 empty plans
  const plans = [1, 2, 3].map((plan_number) => ({
    odyssey_id: odyssey.id,
    plan_number,
  }));

  const { error: plansError } = await supabase
    .from('odyssey_plans')
    .insert(plans);

  if (plansError) throw new Error(plansError.message);

  return odyssey as Odyssey;
}

export async function getOdysseyList() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('odysseys')
    .select('*, odyssey_plans(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getOdysseyData(odysseyId: string): Promise<FullOdysseyData> {
  const supabase = await createClient();

  const [
    { data: odyssey },
    { data: plans },
    { data: milestones },
    { data: feedback },
    { data: prototype },
    { data: prototypeSteps },
    { data: prototypeActions },
    { data: weeklyChecks },
  ] = await Promise.all([
    supabase.from('odysseys').select('*').eq('id', odysseyId).single(),
    supabase.from('odyssey_plans').select('*').eq('odyssey_id', odysseyId).order('plan_number'),
    supabase.from('odyssey_milestones').select('*').in(
      'plan_id',
      (await supabase.from('odyssey_plans').select('id').eq('odyssey_id', odysseyId)).data?.map(p => p.id) || []
    ).order('order_position'),
    supabase.from('odyssey_feedback').select('*').in(
      'plan_id',
      (await supabase.from('odyssey_plans').select('id').eq('odyssey_id', odysseyId)).data?.map(p => p.id) || []
    ).order('order_position'),
    supabase.from('odyssey_prototypes').select('*').eq('odyssey_id', odysseyId).maybeSingle(),
    supabase.from('odyssey_prototype_steps').select('*').in(
      'prototype_id',
      (await supabase.from('odyssey_prototypes').select('id').eq('odyssey_id', odysseyId)).data?.map(p => p.id) || []
    ),
    supabase.from('odyssey_prototype_actions').select('*').in(
      'prototype_id',
      (await supabase.from('odyssey_prototypes').select('id').eq('odyssey_id', odysseyId)).data?.map(p => p.id) || []
    ),
    supabase.from('odyssey_weekly_checks').select('*').in(
      'prototype_id',
      (await supabase.from('odyssey_prototypes').select('id').eq('odyssey_id', odysseyId)).data?.map(p => p.id) || []
    ).order('week_number'),
  ]);

  if (!odyssey) throw new Error('Odyssey no encontrado');

  // Group milestones and feedback by plan
  const plansWithData: PlanWithMilestones[] = (plans || []).map((plan) => ({
    ...plan,
    milestones: (milestones || []).filter((m) => m.plan_id === plan.id),
    feedback: (feedback || []).filter((f) => f.plan_id === plan.id),
  }));

  return {
    odyssey,
    plans: plansWithData,
    prototype: prototype || null,
    prototypeSteps: prototypeSteps || [],
    prototypeActions: prototypeActions || [],
    weeklyChecks: weeklyChecks || [],
  };
}

export async function updateOdyssey(odysseyId: string, updates: Partial<Pick<Odyssey, 'title' | 'mode' | 'active_plan_number' | 'current_step'>>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('odysseys')
    .update(updates)
    .eq('id', odysseyId);

  if (error) throw new Error(error.message);
}

export async function deleteOdyssey(odysseyId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('odysseys')
    .delete()
    .eq('id', odysseyId);

  if (error) throw new Error(error.message);
}

export async function duplicateOdyssey(odysseyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const data = await getOdysseyData(odysseyId);

  // Create new odyssey
  const { data: newOdyssey, error } = await supabase
    .from('odysseys')
    .insert({
      title: `${data.odyssey.title} (copia)`,
      mode: data.odyssey.mode,
      user_id: user.id,
    })
    .select()
    .single();

  if (error || !newOdyssey) throw new Error('Error al duplicar');

  // Create plans with data
  for (const plan of data.plans) {
    const { data: newPlan } = await supabase
      .from('odyssey_plans')
      .insert({
        odyssey_id: newOdyssey.id,
        plan_number: plan.plan_number,
        headline: plan.headline,
        energy_score: plan.energy_score,
        confidence_score: plan.confidence_score,
        resources_score: plan.resources_score,
        excitement_text: plan.excitement_text,
        concern_text: plan.concern_text,
      })
      .select()
      .single();

    if (newPlan && plan.milestones.length > 0) {
      await supabase.from('odyssey_milestones').insert(
        plan.milestones.map((m) => ({
          plan_id: newPlan.id,
          year: m.year,
          category: m.category,
          title: m.title,
          description: m.description,
          tag: m.tag,
          order_position: m.order_position,
        }))
      );
    }

    if (newPlan && plan.feedback && plan.feedback.length > 0) {
      await supabase.from('odyssey_feedback').insert(
        plan.feedback.map((f) => ({
          plan_id: newPlan.id,
          person_name: f.person_name,
          feedback_text: f.feedback_text,
          order_position: f.order_position,
        }))
      );
    }
  }

  return newOdyssey as Odyssey;
}

// --- Plans ---

export async function savePlanHeadline(planId: string, headline: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('odyssey_plans')
    .update({ headline })
    .eq('id', planId);

  if (error) throw new Error(error.message);
}

export async function savePlanDashboard(planId: string, data: {
  energy_score?: number;
  confidence_score?: number;
  resources_score?: number;
  excitement_text?: string;
  concern_text?: string;
  year_names?: Record<string, string>;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('odyssey_plans')
    .update(data)
    .eq('id', planId);

  if (error) throw new Error(error.message);
}

export async function duplicatePlan(odysseyId: string, sourcePlanNumber: number, targetPlanNumber: number) {
  const supabase = await createClient();

  // Get source plan
  const { data: sourcePlan } = await supabase
    .from('odyssey_plans')
    .select('*')
    .eq('odyssey_id', odysseyId)
    .eq('plan_number', sourcePlanNumber)
    .single();

  if (!sourcePlan) throw new Error('Plan origen no encontrado');

  // Get target plan
  const { data: targetPlan } = await supabase
    .from('odyssey_plans')
    .select('*')
    .eq('odyssey_id', odysseyId)
    .eq('plan_number', targetPlanNumber)
    .single();

  if (!targetPlan) throw new Error('Plan destino no encontrado');

  // Copy data to target
  await supabase
    .from('odyssey_plans')
    .update({
      headline: sourcePlan.headline,
      energy_score: sourcePlan.energy_score,
      confidence_score: sourcePlan.confidence_score,
      resources_score: sourcePlan.resources_score,
      excitement_text: sourcePlan.excitement_text,
      concern_text: sourcePlan.concern_text,
    })
    .eq('id', targetPlan.id);

  // Delete existing milestones in target
  await supabase.from('odyssey_milestones').delete().eq('plan_id', targetPlan.id);

  // Copy milestones
  const { data: sourceMilestones } = await supabase
    .from('odyssey_milestones')
    .select('*')
    .eq('plan_id', sourcePlan.id);

  if (sourceMilestones && sourceMilestones.length > 0) {
    await supabase.from('odyssey_milestones').insert(
      sourceMilestones.map((m) => ({
        plan_id: targetPlan.id,
        year: m.year,
        category: m.category,
        domain_id: m.domain_id,
        title: m.title,
        description: m.description,
        tag: m.tag,
        order_position: m.order_position,
      }))
    );
  }
}

export async function selectActivePlan(odysseyId: string, planNumber: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('odysseys')
    .update({ active_plan_number: planNumber })
    .eq('id', odysseyId);

  if (error) throw new Error(error.message);
}

// --- Milestones ---

export async function saveMilestones(planId: string, milestones: Omit<OdysseyMilestone, 'id' | 'created_at'>[]) {
  const supabase = await createClient();

  await supabase.from('odyssey_milestones').delete().eq('plan_id', planId);

  if (milestones.length > 0) {
    const { error } = await supabase
      .from('odyssey_milestones')
      .insert(milestones.map((m, i) => ({
        plan_id: planId,
        year: m.year,
        category: m.category || null,
        domain_id: m.domain_id || null,
        title: m.title,
        description: m.description,
        tag: m.tag,
        order_position: i,
      })));

    if (error) throw new Error(error.message);
  }
}

export async function addMilestone(planId: string, data: {
  year: number;
  category?: string | null;
  domain_id?: string | null;
  title: string;
  description?: string;
  tag?: string;
}) {
  const supabase = await createClient();

  // Get current max order
  const { data: existing } = await supabase
    .from('odyssey_milestones')
    .select('order_position')
    .eq('plan_id', planId)
    .order('order_position', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].order_position + 1 : 0;

  const { data: milestone, error } = await supabase
    .from('odyssey_milestones')
    .insert({
      plan_id: planId,
      year: data.year,
      category: data.category || null,
      domain_id: data.domain_id || null,
      title: data.title,
      description: data.description,
      tag: data.tag,
      order_position: nextOrder,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return milestone as OdysseyMilestone;
}

export async function updateMilestone(milestoneId: string, updates: Partial<Pick<OdysseyMilestone, 'year' | 'category' | 'domain_id' | 'title' | 'description' | 'tag'>>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('odyssey_milestones')
    .update(updates)
    .eq('id', milestoneId);

  if (error) throw new Error(error.message);
}

export async function deleteMilestone(milestoneId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('odyssey_milestones')
    .delete()
    .eq('id', milestoneId);

  if (error) throw new Error(error.message);
}

// --- Feedback ---

export async function saveFeedback(planId: string, feedback: { person_name: string; feedback_text: string }[]) {
  const supabase = await createClient();

  await supabase.from('odyssey_feedback').delete().eq('plan_id', planId);

  if (feedback.length > 0) {
    const { error } = await supabase
      .from('odyssey_feedback')
      .insert(feedback.map((f, i) => ({
        plan_id: planId,
        person_name: f.person_name,
        feedback_text: f.feedback_text,
        order_position: i,
      })));

    if (error) throw new Error(error.message);
  }
}

// Legacy alias for backwards compatibility
export async function saveQuestions(planId: string, questions: string[]) {
  return saveFeedback(planId, questions.map(q => ({ person_name: '', feedback_text: q })));
}

// --- Prototype ---

export async function createPrototype(odysseyId: string, planId: string, targetMilestoneId?: string | null) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('odyssey_prototypes')
    .insert({
      odyssey_id: odysseyId,
      plan_id: planId,
      target_milestone_id: targetMilestoneId || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as OdysseyPrototype;
}

export async function updatePrototypeMilestone(prototypeId: string, milestoneId: string | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('odyssey_prototypes')
    .update({ target_milestone_id: milestoneId })
    .eq('id', prototypeId);

  if (error) throw new Error(error.message);
}

export async function savePrototypeSteps(
  prototypeId: string,
  steps: { step_type: string; title: string; description?: string }[],
  milestoneId?: string | null
) {
  const supabase = await createClient();

  // Delete existing steps for this milestone (or null milestone for legacy)
  if (milestoneId) {
    await supabase
      .from('odyssey_prototype_steps')
      .delete()
      .eq('prototype_id', prototypeId)
      .eq('milestone_id', milestoneId);
  } else {
    await supabase
      .from('odyssey_prototype_steps')
      .delete()
      .eq('prototype_id', prototypeId)
      .is('milestone_id', null);
  }

  if (steps.length > 0) {
    const { error } = await supabase
      .from('odyssey_prototype_steps')
      .insert(steps.map((s) => ({ ...s, prototype_id: prototypeId, milestone_id: milestoneId || null })));

    if (error) throw new Error(error.message);
  }
}

export async function savePrototypeActions(
  prototypeId: string,
  actions: { text: string; frequency_type: string }[],
  milestoneId?: string | null
) {
  const supabase = await createClient();

  // Delete existing actions for this milestone
  if (milestoneId) {
    await supabase
      .from('odyssey_prototype_actions')
      .delete()
      .eq('prototype_id', prototypeId)
      .eq('milestone_id', milestoneId);
  } else {
    await supabase
      .from('odyssey_prototype_actions')
      .delete()
      .eq('prototype_id', prototypeId)
      .is('milestone_id', null);
  }

  if (actions.length > 0) {
    const { error } = await supabase
      .from('odyssey_prototype_actions')
      .insert(actions.map((a) => ({
        ...a,
        prototype_id: prototypeId,
        milestone_id: milestoneId || null,
      })));

    if (error) throw new Error(error.message);
  }
}

export async function saveWeeklyCheck(prototypeId: string, weekNumber: number, data: {
  conversation_done?: boolean;
  experiment_done?: boolean;
  skill_done?: boolean;
  notes?: string;
}) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('odyssey_weekly_checks')
    .select('id')
    .eq('prototype_id', prototypeId)
    .eq('week_number', weekNumber)
    .single();

  const allDone = data.conversation_done && data.experiment_done && data.skill_done;

  if (existing) {
    await supabase
      .from('odyssey_weekly_checks')
      .update({ ...data, completed_at: allDone ? new Date().toISOString() : null })
      .eq('id', existing.id);
  } else {
    await supabase.from('odyssey_weekly_checks').insert({
      prototype_id: prototypeId,
      week_number: weekNumber,
      ...data,
      completed_at: allDone ? new Date().toISOString() : null,
    });
  }
}

export async function savePrototypeReflection(prototypeId: string, data: {
  reflection_learned?: string;
  reflection_adjust?: string;
  reflection_next_step?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('odyssey_prototypes')
    .update(data)
    .eq('id', prototypeId);

  if (error) throw new Error(error.message);
}

export async function completePrototype(prototypeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('odyssey_prototypes')
    .update({ status: 'completed' })
    .eq('id', prototypeId);

  if (error) throw new Error(error.message);
}

// --- Partner ---

export async function shareOdyssey(partnershipId: string, odysseyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('shared_odysseys')
    .insert({ partnership_id: partnershipId, odyssey_id: odysseyId, shared_by: user.id });

  if (error) throw new Error(error.message);
}

export async function getPartnerOdysseys(partnershipId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shared_odysseys')
    .select('*, odysseys(*, odyssey_plans(*))')
    .eq('partnership_id', partnershipId);

  if (error) throw new Error(error.message);
  return data || [];
}
