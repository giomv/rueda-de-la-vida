'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { OdysseyProgress } from '@/components/odyssey/OdysseyProgress';
import { TimelineBuilder } from '@/components/odyssey/TimelineBuilder';
import { PlanHeadline } from '@/components/odyssey/PlanHeadline';
import { InspireButton } from '@/components/odyssey/InspireButton';
import { DuplicatePlanButton } from '@/components/odyssey/DuplicatePlanButton';
import { FeedbackList } from '@/components/odyssey/FeedbackList';
import { DashboardSliders } from '@/components/odyssey/DashboardSliders';
import { ExcitementConcern } from '@/components/odyssey/ExcitementConcern';
import { useOdysseyStore } from '@/lib/stores/odyssey-store';
import { useOdysseyAutoSave } from '@/hooks/use-odyssey-auto-save';
import { getOdysseyData, savePlanHeadline, saveMilestones, savePlanDashboard, saveFeedback, updateOdyssey, duplicatePlan } from '@/lib/actions/odyssey-actions';
import { getOrCreateDomains } from '@/lib/actions/domain-actions';
import { PLAN_TYPES, CREATIVE_PROMPTS_PLAN2 } from '@/lib/types';
import type { MilestoneCategory, MilestoneTag, OdysseyFeedback } from '@/lib/types';

export default function Plan2Page() {
  const params = useParams();
  const router = useRouter();
  const odysseyId = params.odysseyId as string;
  const [loading, setLoading] = useState(true);

  const {
    plans, milestones, feedback, domains, setOdysseyId, hydrate, setDomains, updatePlanHeadline, updatePlanDashboard,
    addMilestone, updateMilestone, moveMilestone, removeMilestone,
    updateFeedback, addFeedback, removeFeedback, isDirty,
  } = useOdysseyStore();

  const plan = plans.find((p) => p.plan_number === 2);
  const planId = plan?.id || '';
  const planMilestones = milestones[planId] || [];
  const planFeedback = feedback[planId] || [];

  useEffect(() => {
    async function load() {
      const [data, userDomains] = await Promise.all([
        getOdysseyData(odysseyId),
        getOrCreateDomains(),
      ]);
      setOdysseyId(odysseyId);
      setDomains(userDomains);
      hydrate({
        plans: data.plans,
        milestones: Object.fromEntries(data.plans.map((p) => [p.id, p.milestones])),
        feedback: Object.fromEntries(data.plans.map((p) => [p.id, p.feedback])),
        activePlanNumber: data.odyssey.active_plan_number,
        prototype: data.prototype,
        prototypeSteps: data.prototypeSteps,
        weeklyChecks: data.weeklyChecks,
      });
      setLoading(false);
    }
    load();
  }, [odysseyId]);

  const handleYearNameChange = (year: number, name: string) => {
    if (!planId) return;
    const currentNames = plan?.year_names || {};
    updatePlanDashboard(planId, { year_names: { ...currentNames, [String(year)]: name } });
  };

  const saveFn = useCallback(async () => {
    if (!planId) return;
    const state = useOdysseyStore.getState();
    const currentPlan = state.plans.find((p) => p.plan_number === 2);
    await savePlanHeadline(planId, currentPlan?.headline || '');
    await savePlanDashboard(planId, {
      year_names: currentPlan?.year_names,
      energy_score: currentPlan?.energy_score ?? undefined,
      confidence_score: currentPlan?.confidence_score ?? undefined,
      resources_score: currentPlan?.resources_score ?? undefined,
      excitement_text: currentPlan?.excitement_text ?? undefined,
      concern_text: currentPlan?.concern_text ?? undefined,
    });
    const currentMilestones = state.milestones[planId] || [];
    await saveMilestones(planId, currentMilestones.map((m) => ({
      plan_id: planId,
      year: m.year,
      category: m.category,
      domain_id: m.domain_id,
      title: m.title,
      description: m.description,
      tag: m.tag,
      order_position: m.order_position,
    })));
    const currentFeedback = state.feedback[planId] || [];
    const feedbackToSave = currentFeedback
      .filter((f) => f.person_name.trim() || f.feedback_text.trim())
      .map((f) => ({ person_name: f.person_name, feedback_text: f.feedback_text }));
    await saveFeedback(planId, feedbackToSave);
  }, [planId]);

  const { isSaving } = useOdysseyAutoSave(saveFn);

  const handleContinue = async () => {
    await saveFn();
    await updateOdyssey(odysseyId, { current_step: 'plan-3' });
    router.push(`/plan-de-vida/${odysseyId}/plan-3`);
  };

  const handleSkip = async () => {
    await saveFn();
    await updateOdyssey(odysseyId, { current_step: 'plan-3' });
    router.push(`/plan-de-vida/${odysseyId}/plan-3`);
  };

  const handleDuplicate = async (sourcePlan: number) => {
    await duplicatePlan(odysseyId, sourcePlan, 2);
    const data = await getOdysseyData(odysseyId);
    hydrate({
      plans: data.plans,
      milestones: Object.fromEntries(data.plans.map((p) => [p.id, p.milestones])),
      feedback: Object.fromEntries(data.plans.map((p) => [p.id, p.feedback])),
    });
  };

  const handleAddMilestone = (data: { title: string; description: string; category: MilestoneCategory | null; domain_id: string | null; tag: MilestoneTag; year: number }) => {
    if (!planId) return;
    addMilestone(planId, {
      id: crypto.randomUUID(),
      plan_id: planId,
      year: data.year,
      category: data.category,
      domain_id: data.domain_id,
      title: data.title,
      description: data.description,
      tag: data.tag,
      order_position: planMilestones.length,
      created_at: new Date().toISOString(),
    });
  };

  const handleEditMilestone = (milestoneId: string, data: { title: string; description: string; category: MilestoneCategory | null; domain_id: string | null; tag: MilestoneTag; year: number }) => {
    updateMilestone(milestoneId, {
      title: data.title,
      description: data.description,
      category: data.category,
      domain_id: data.domain_id,
      tag: data.tag,
      year: data.year,
    });
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    if (!planId) return;
    removeMilestone(planId, milestoneId);
  };

  const handleMoveMilestone = (milestoneId: string, newYear: number) => {
    moveMilestone(milestoneId, newYear);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const planType = PLAN_TYPES[1];

  return (
    <div className="flex flex-col h-full">
      <OdysseyProgress currentStep="plan-2" />

      <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold">
              Plan 2: {planType.title}
            </h1>
            <div className="flex gap-2">
              <DuplicatePlanButton currentPlanNumber={2} onDuplicate={handleDuplicate} />
              <InspireButton
                prompts={CREATIVE_PROMPTS_PLAN2}
                onSelect={(prompt) => {
                  if (plan) updatePlanHeadline(planId, prompt);
                }}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{planType.subtitle}</p>
        </div>

        <PlanHeadline
          value={plan?.headline || ''}
          onChange={(v) => updatePlanHeadline(planId, v)}
          placeholder="Resume tu Plan 2 en una frase..."
        />

        <div>
          <h2 className="text-sm font-semibold mb-3">Hitos a 5 años</h2>
          <TimelineBuilder
            milestones={planMilestones}
            yearNames={plan?.year_names || {}}
            onAdd={handleAddMilestone}
            onEdit={handleEditMilestone}
            onDelete={handleDeleteMilestone}
            onYearNameChange={handleYearNameChange}
            onMoveMilestone={handleMoveMilestone}
            domains={domains}
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3">Retroalimentación</h2>
          <p className="text-xs text-muted-foreground mb-3">Muéstrale tu plan a diferentes personas (que aprecies mucho, que estén viviendo eso que tú quieres, etc.) y pon aquí su retroalimentación.</p>
          <FeedbackList
            feedback={planFeedback}
            onChange={(index, updates) => updateFeedback(planId, index, updates)}
            onAdd={() => addFeedback(planId)}
            onRemove={(index) => removeFeedback(planId, index)}
          />
        </div>

        {plan && (
          <div>
            <h2 className="text-sm font-semibold mb-3">Indicadores</h2>
            <DashboardSliders
              plan={plan}
              onChange={(key, value) => updatePlanDashboard(planId, { [key]: value })}
            />
          </div>
        )}

        {plan && (
          <div>
            <h2 className="text-sm font-semibold mb-3">Emociones</h2>
            <ExcitementConcern
              excitement={plan.excitement_text || ''}
              concern={plan.concern_text || ''}
              onExcitementChange={(v) => updatePlanDashboard(planId, { excitement_text: v })}
              onConcernChange={(v) => updatePlanDashboard(planId, { concern_text: v })}
            />
          </div>
        )}

        {isSaving && (
          <p className="text-xs text-muted-foreground">Guardando...</p>
        )}
      </div>

      <div className="sticky bottom-16 md:bottom-0 border-t bg-background p-4">
        <div className="max-w-6xl mx-auto flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/plan-de-vida/${odysseyId}/plan-1`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Plan 1
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip} disabled={isSaving}>
              Saltar
              <SkipForward className="h-4 w-4 ml-2" />
            </Button>
            <Button onClick={handleContinue} disabled={isDirty || isSaving}>
              Continuar al Plan 3
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
