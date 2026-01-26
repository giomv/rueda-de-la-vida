'use server';

import { createClient } from '@/lib/supabase/server';
import type { ImportResult } from '@/lib/types/lifeplan';

// Import activities from a specific wheel's action plans
export async function importFromWheel(wheelId: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get the wheel with its action plans and related domains
  const { data: wheel, error: wheelError } = await supabase
    .from('wheels')
    .select('id, user_id')
    .eq('id', wheelId)
    .eq('user_id', user.id)
    .single();

  if (wheelError || !wheel) return 0;

  // Get action plans for this wheel
  const { data: actionPlans, error: plansError } = await supabase
    .from('action_plans')
    .select('*, domains(id, name)')
    .eq('wheel_id', wheelId);

  if (plansError || !actionPlans?.length) return 0;

  // Get user's life domains for mapping
  const { data: lifeDomains } = await supabase
    .from('life_domains')
    .select('id, slug, name')
    .eq('user_id', user.id);

  let importedCount = 0;

  for (const plan of actionPlans) {
    // Try to match domain by name (case insensitive)
    const domainName = plan.domains?.name?.toLowerCase();
    const matchedDomain = lifeDomains?.find(
      (d) => d.name.toLowerCase() === domainName || d.slug === domainName
    );

    // Create or find goal from goal_text
    let goalId: string | null = null;
    if (plan.goal_text) {
      // Check if goal already exists from this wheel
      const { data: existingGoal } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_wheel_id', wheelId)
        .eq('title', plan.goal_text)
        .single();

      if (existingGoal) {
        goalId = existingGoal.id;
      } else {
        const { data: newGoal } = await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            title: plan.goal_text,
            domain_id: matchedDomain?.id || null,
            origin: 'WHEEL',
            source_wheel_id: wheelId,
            target_date: null,
          })
          .select()
          .single();

        goalId = newGoal?.id || null;
      }
    }

    // Import each action as an activity
    const actions = plan.actions || [];
    for (const action of actions) {
      if (!action.text) continue;

      // Check if activity already exists (deduplication by source)
      const sourceId = `${wheelId}_${plan.domain_id}_${action.id}`;
      const { data: existing } = await supabase
        .from('lifeplan_activities')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_type', 'WHEEL')
        .eq('source_id', sourceId)
        .single();

      if (existing) continue;

      // Create activity
      const { error: activityError } = await supabase
        .from('lifeplan_activities')
        .insert({
          user_id: user.id,
          title: action.text,
          domain_id: matchedDomain?.id || null,
          goal_id: goalId,
          source_type: 'WHEEL',
          source_id: sourceId,
          frequency_type: 'WEEKLY',
          frequency_value: 1,
        });

      if (!activityError) importedCount++;
    }
  }

  return importedCount;
}

// Import activities from an odyssey prototype
export async function importFromOdyssey(prototypeId: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get prototype with steps
  const { data: prototype, error: protoError } = await supabase
    .from('odyssey_prototypes')
    .select(`
      id,
      odyssey_id,
      target_milestone_id,
      odysseys(user_id)
    `)
    .eq('id', prototypeId)
    .single();

  const odysseyData = Array.isArray(prototype?.odysseys)
    ? prototype?.odysseys[0] as { user_id: string } | undefined
    : prototype?.odysseys as { user_id: string } | undefined;
  if (protoError || !prototype || odysseyData?.user_id !== user.id) return 0;

  // Get prototype steps
  const { data: steps, error: stepsError } = await supabase
    .from('odyssey_prototype_steps')
    .select('*')
    .eq('prototype_id', prototypeId);

  if (stepsError || !steps?.length) return 0;

  // Get target milestone to find domain
  let domainId: string | null = null;
  if (prototype.target_milestone_id) {
    const { data: milestone } = await supabase
      .from('odyssey_milestones')
      .select('domain_id')
      .eq('id', prototype.target_milestone_id)
      .single();
    domainId = milestone?.domain_id || null;
  }

  let importedCount = 0;

  for (const step of steps) {
    // Check if activity already exists (deduplication by source)
    const { data: existing } = await supabase
      .from('lifeplan_activities')
      .select('id')
      .eq('user_id', user.id)
      .eq('source_type', 'ODYSSEY')
      .eq('source_id', step.id)
      .single();

    if (existing) continue;

    // Map step type to frequency
    let frequencyType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE' = 'WEEKLY';
    if (step.step_type === 'conversation') {
      frequencyType = 'ONCE';
    } else if (step.step_type === 'experiment') {
      frequencyType = 'ONCE';
    } else if (step.step_type === 'skill') {
      frequencyType = 'WEEKLY';
    }

    // Create activity
    const { error: activityError } = await supabase
      .from('lifeplan_activities')
      .insert({
        user_id: user.id,
        title: step.title,
        notes: step.description,
        domain_id: domainId,
        source_type: 'ODYSSEY',
        source_id: step.id,
        frequency_type: frequencyType,
        frequency_value: 1,
      });

    if (!activityError) importedCount++;
  }

  return importedCount;
}

// Sync all activities from Wheel and Odyssey sources
export async function syncLifePlanActivities(): Promise<ImportResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const results: ImportResult = { fromWheel: 0, fromOdyssey: 0 };

  // Get all user's wheels with action plans
  const { data: wheels } = await supabase
    .from('wheels')
    .select('id')
    .eq('user_id', user.id);

  if (wheels?.length) {
    for (const wheel of wheels) {
      results.fromWheel += await importFromWheel(wheel.id);
    }
  }

  // Get active odyssey prototype
  const { data: prototype } = await supabase
    .from('odyssey_prototypes')
    .select('id, odysseys!inner(user_id)')
    .eq('odysseys.user_id', user.id)
    .eq('status', 'active')
    .single();

  if (prototype) {
    results.fromOdyssey = await importFromOdyssey(prototype.id);
  }

  return results;
}

// Get import status (how many items from each source)
export async function getImportStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const [
    { count: wheelCount },
    { count: odysseyCount },
    { count: manualCount },
  ] = await Promise.all([
    supabase
      .from('lifeplan_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('source_type', 'WHEEL'),
    supabase
      .from('lifeplan_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('source_type', 'ODYSSEY'),
    supabase
      .from('lifeplan_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('source_type', 'MANUAL'),
  ]);

  return {
    fromWheel: wheelCount || 0,
    fromOdyssey: odysseyCount || 0,
    manual: manualCount || 0,
  };
}
