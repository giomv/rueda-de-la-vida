'use server';

import { createClient } from '@/lib/supabase/server';
import type { ImportResult, ImportSources } from '@/lib/types/lifeplan';
import type { PlanGoal } from '@/lib/types';

// Import activities from a specific wheel's action plans
export async function importFromWheel(wheelId: string): Promise<number> {
  console.log('[importFromWheel] Starting with wheelId:', wheelId);
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

  console.log('[importFromWheel] wheel:', wheel, 'error:', wheelError);
  if (wheelError || !wheel) return 0;

  // Get action plans for this wheel
  const { data: actionPlans, error: plansError } = await supabase
    .from('action_plans')
    .select('*, domains(id, name)')
    .eq('wheel_id', wheelId);

  console.log('[importFromWheel] actionPlans count:', actionPlans?.length, 'error:', plansError);
  if (actionPlans?.length) {
    for (const plan of actionPlans) {
      console.log('[importFromWheel] plan domain:', plan.domains?.name, 'goal:', plan.goal_text, 'actions:', JSON.stringify(plan.actions));
    }
  }
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

    // Build goals list: prefer goals array, fall back to goal_text
    const planGoals: PlanGoal[] = (plan.goals as PlanGoal[] | null)?.length
      ? (plan.goals as PlanGoal[])
      : plan.goal_text
        ? [{ id: 'legacy', text: plan.goal_text }]
        : [];

    // Create or find goals and build a map of wheel-goal-id -> lifeplan-goal-id
    const goalIdMap: Record<string, string> = {};
    for (const pg of planGoals) {
      if (!pg.text) continue;

      const { data: existingGoal } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_wheel_id', wheelId)
        .eq('title', pg.text)
        .single();

      if (existingGoal) {
        goalIdMap[pg.id] = existingGoal.id;
      } else {
        const { data: newGoal } = await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            title: pg.text,
            domain_id: matchedDomain?.id || null,
            origin: 'WHEEL',
            source_wheel_id: wheelId,
            target_date: null,
          })
          .select()
          .single();

        if (newGoal) goalIdMap[pg.id] = newGoal.id;
      }
    }

    // Fallback goal id: first goal in the map
    const fallbackGoalId = Object.values(goalIdMap)[0] || null;

    // Import each action as an activity
    const actions = plan.actions || [];
    console.log('[importFromWheel] Processing', actions.length, 'actions for domain:', plan.domains?.name);
    for (const action of actions) {
      if (!action.text) {
        console.log('[importFromWheel] Skipping action without text:', action);
        continue;
      }

      // Resolve goal_id: use action's goal_id to look up lifeplan goal, fallback to first goal
      const resolvedGoalId = action.goal_id && goalIdMap[action.goal_id]
        ? goalIdMap[action.goal_id]
        : fallbackGoalId;

      // Check if activity already exists (deduplication by source)
      const sourceId = `${wheelId}_${plan.domain_id}_${action.id}`;
      const { data: existing } = await supabase
        .from('lifeplan_activities')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_type', 'WHEEL')
        .eq('source_id', sourceId)
        .single();

      if (existing) {
        console.log('[importFromWheel] Already exists, skipping:', action.text, 'sourceId:', sourceId);
        continue;
      }

      console.log('[importFromWheel] Inserting activity:', action.text, 'sourceId:', sourceId);
      // Create activity
      const { error: activityError } = await supabase
        .from('lifeplan_activities')
        .insert({
          user_id: user.id,
          title: action.text,
          domain_id: matchedDomain?.id || null,
          goal_id: resolvedGoalId,
          source_type: 'WHEEL',
          source_id: sourceId,
          frequency_type: action.frequency_type || 'WEEKLY',
          frequency_value: 1,
        });

      if (activityError) {
        console.log('[importFromWheel] Insert error:', activityError);
      } else {
        importedCount++;
      }
    }
  }

  console.log('[importFromWheel] Done. Total imported:', importedCount);
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

// Import actions from odyssey prototype actions (not steps)
export async function importActionsFromOdyssey(prototypeId: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get prototype to verify ownership
  const { data: prototype, error: protoError } = await supabase
    .from('odyssey_prototypes')
    .select(`
      id,
      odyssey_id,
      odysseys(user_id)
    `)
    .eq('id', prototypeId)
    .single();

  const odysseyData = Array.isArray(prototype?.odysseys)
    ? prototype?.odysseys[0] as { user_id: string } | undefined
    : prototype?.odysseys as { user_id: string } | undefined;
  if (protoError || !prototype || odysseyData?.user_id !== user.id) return 0;

  // Get prototype actions
  const { data: prototypeActions, error: actionsError } = await supabase
    .from('odyssey_prototype_actions')
    .select('*, odyssey_milestones(domain_id, title)')
    .eq('prototype_id', prototypeId);

  if (actionsError || !prototypeActions?.length) return 0;

  // Get user's life domains for mapping
  const { data: lifeDomains } = await supabase
    .from('life_domains')
    .select('id, slug, name')
    .eq('user_id', user.id);

  // Get domains for milestone matching
  const { data: allDomains } = await supabase
    .from('domains')
    .select('id, name');

  let importedCount = 0;

  for (const action of prototypeActions) {
    // Check if activity already exists (deduplication by source)
    const { data: existing } = await supabase
      .from('lifeplan_activities')
      .select('id')
      .eq('user_id', user.id)
      .eq('source_type', 'ODYSSEY')
      .eq('source_id', action.id)
      .single();

    if (existing) continue;

    // Get domain from milestone if available
    let domainId: string | null = null;
    let goalId: string | null = null;

    const milestoneData = Array.isArray(action.odyssey_milestones)
      ? action.odyssey_milestones[0]
      : action.odyssey_milestones;

    if (milestoneData) {
      // Get the domain name from the wheel domain
      const wheelDomain = allDomains?.find((d) => d.id === milestoneData.domain_id);
      if (wheelDomain) {
        // Match to life domain by name
        const matchedDomain = lifeDomains?.find(
          (d) => d.name.toLowerCase() === wheelDomain.name.toLowerCase() || d.slug === wheelDomain.name.toLowerCase()
        );
        domainId = matchedDomain?.id || null;
      }

      // Create or find goal from milestone title
      if (milestoneData.title) {
        const { data: existingGoal } = await supabase
          .from('goals')
          .select('id')
          .eq('user_id', user.id)
          .eq('origin', 'ODYSSEY')
          .eq('source_odyssey_id', prototype.odyssey_id)
          .eq('title', milestoneData.title)
          .single();

        if (existingGoal) {
          goalId = existingGoal.id;
        } else {
          const { data: newGoal } = await supabase
            .from('goals')
            .insert({
              user_id: user.id,
              title: milestoneData.title,
              domain_id: domainId,
              origin: 'ODYSSEY',
              source_odyssey_id: prototype.odyssey_id,
            })
            .select()
            .single();

          goalId = newGoal?.id || null;
        }
      }
    }

    // Create activity
    const { error: activityError } = await supabase
      .from('lifeplan_activities')
      .insert({
        user_id: user.id,
        title: action.text,
        domain_id: domainId,
        goal_id: goalId,
        source_type: 'ODYSSEY',
        source_id: action.id,
        frequency_type: action.frequency_type || 'WEEKLY',
        frequency_value: 1,
      });

    if (!activityError) importedCount++;
  }

  return importedCount;
}

// Import goals from odyssey milestones (active plan only)
export async function importGoalsFromOdyssey(odysseyId: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Verify odyssey belongs to user
  const { data: odyssey } = await supabase
    .from('odysseys')
    .select('id, active_plan_number')
    .eq('id', odysseyId)
    .eq('user_id', user.id)
    .single();

  if (!odyssey || !odyssey.active_plan_number) return 0;

  // Get the active plan
  const { data: activePlan } = await supabase
    .from('odyssey_plans')
    .select('id')
    .eq('odyssey_id', odysseyId)
    .eq('plan_number', odyssey.active_plan_number)
    .single();

  if (!activePlan) return 0;

  // Get milestones from active plan
  const { data: milestones } = await supabase
    .from('odyssey_milestones')
    .select('id, title, domain_id, year')
    .eq('plan_id', activePlan.id)
    .order('year', { ascending: true })
    .order('order_position', { ascending: true });

  if (!milestones?.length) return 0;

  let importedCount = 0;

  for (const milestone of milestones) {
    // Check if goal already exists from this odyssey with same title
    const { data: existingGoal } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', user.id)
      .eq('origin', 'ODYSSEY')
      .eq('source_odyssey_id', odysseyId)
      .eq('title', milestone.title)
      .single();

    if (existingGoal) continue;

    // Create goal from milestone
    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: milestone.title,
        domain_id: milestone.domain_id || null,
        metric: `Año ${milestone.year}`,
        origin: 'ODYSSEY',
        source_odyssey_id: odysseyId,
      });

    if (!error) importedCount++;
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

  // Import goals from odyssey milestones
  const { data: odysseys } = await supabase
    .from('odysseys')
    .select('id')
    .eq('user_id', user.id);

  if (odysseys?.length) {
    for (const odyssey of odysseys) {
      await importGoalsFromOdyssey(odyssey.id);
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
    // Import both steps (as activities) and actions
    results.fromOdyssey = await importFromOdyssey(prototype.id);
    results.fromOdyssey += await importActionsFromOdyssey(prototype.id);
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

// Get available import sources (wheels and odysseys) for the selection UI
export async function getImportSources(): Promise<ImportSources> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Fetch wheels (id, title, created_at) ordered by newest first
  const { data: wheels } = await supabase
    .from('wheels')
    .select('id, title, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch odysseys with their active plan info
  const { data: odysseys } = await supabase
    .from('odysseys')
    .select('id, title, active_plan_number')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const odysseySources = [];
  if (odysseys?.length) {
    for (const odyssey of odysseys) {
      let activePlanHeadline: string | null = null;
      let hasPrototype = false;

      if (odyssey.active_plan_number) {
        // Get the active plan headline
        const { data: activePlan } = await supabase
          .from('odyssey_plans')
          .select('id, headline')
          .eq('odyssey_id', odyssey.id)
          .eq('plan_number', odyssey.active_plan_number)
          .single();

        activePlanHeadline = activePlan?.headline || null;

        // Check if an active prototype exists for this odyssey
        if (activePlan) {
          const { count } = await supabase
            .from('odyssey_prototypes')
            .select('id', { count: 'exact', head: true })
            .eq('odyssey_id', odyssey.id)
            .eq('status', 'active');

          hasPrototype = (count || 0) > 0;
        }
      }

      odysseySources.push({
        id: odyssey.id,
        title: odyssey.title,
        active_plan_number: odyssey.active_plan_number,
        active_plan_headline: activePlanHeadline,
        has_prototype: hasPrototype,
      });
    }
  }

  return {
    wheels: wheels || [],
    odysseys: odysseySources,
  };
}

// Import from specific selected sources
export async function importSelectedSources(
  wheelId?: string | null,
  odysseyId?: string | null
): Promise<ImportResult> {
  console.log('[importSelectedSources] Called with wheelId:', wheelId, 'odysseyId:', odysseyId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const results: ImportResult = { fromWheel: 0, fromOdyssey: 0 };

  // Import from selected wheel
  if (wheelId) {
    console.log('[importSelectedSources] Importing from wheel:', wheelId);
    results.fromWheel = await importFromWheel(wheelId);
    console.log('[importSelectedSources] Wheel result:', results.fromWheel);
  }

  // Import from selected odyssey
  if (odysseyId) {
    // Import goals from milestones
    await importGoalsFromOdyssey(odysseyId);

    // Find the active prototype for this odyssey
    const { data: prototype } = await supabase
      .from('odyssey_prototypes')
      .select('id, odysseys!inner(user_id)')
      .eq('odyssey_id', odysseyId)
      .eq('odysseys.user_id', user.id)
      .eq('status', 'active')
      .single();

    if (prototype) {
      results.fromOdyssey = await importFromOdyssey(prototype.id);
      results.fromOdyssey += await importActionsFromOdyssey(prototype.id);
    }
  }

  return results;
}
