'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { WizardProgress } from '@/components/app/WizardProgress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getWheelData, saveActionPlan } from '@/lib/actions/wheel-actions';
import { SMARTGoalTooltip } from '@/components/shared/SMARTGoalTooltip';
import { importFromWheel } from '@/lib/actions/import-actions';
import { ChevronRight, ChevronLeft, ChevronDown, Plus, X, Target } from 'lucide-react';
import type { Domain, ActionItem, PlanGoal, Reflection, IdealLife, FrequencyType } from '@/lib/types';
import { REFLECTION_QUESTIONS, IDEAL_LIFE_PROMPTS, FREQUENCY_OPTIONS } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PlanState {
  goals: PlanGoal[];
  targetScore: number;
  actions: ActionItem[];
}

export default function PlanPage() {
  const params = useParams();
  const router = useRouter();
  const wheelId = params.wheelId as string;

  const [loading, setLoading] = useState(true);
  const [focusDomains, setFocusDomains] = useState<Domain[]>([]);
  const [otherDomains, setOtherDomains] = useState<Domain[]>([]);
  const [showOtherDomains, setShowOtherDomains] = useState(false);
  const [openDomains, setOpenDomains] = useState<Set<string>>(new Set());
  const [plans, setPlans] = useState<Record<string, PlanState>>({});
  const [newActionText, setNewActionText] = useState<Record<string, string>>({});
  const [newActionFrequency, setNewActionFrequency] = useState<Record<string, FrequencyType>>({});
  const [newGoalText, setNewGoalText] = useState<Record<string, string>>({});
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [idealLife, setIdealLife] = useState<IdealLife[]>([]);

  useEffect(() => {
    async function load() {
      const data = await getWheelData(wheelId);
      const focusIds = data.priorities
        .filter((p) => p.is_focus)
        .map((p) => p.domain_id);
      const focus = data.domains.filter((d) => focusIds.includes(d.id));
      const other = data.domains.filter((d) => !focusIds.includes(d.id));
      setFocusDomains(focus);
      setOtherDomains(other);

      const planState: Record<string, PlanState> = {};
      const defaultFrequency: Record<string, FrequencyType> = {};
      data.domains.forEach((domain) => {
        const existing = data.actionPlans.find((ap) => ap.domain_id === domain.id);
        // Read goals array, fall back to wrapping goal_text
        let goals: PlanGoal[] = [];
        if (existing?.goals && (existing.goals as PlanGoal[]).length > 0) {
          goals = existing.goals as PlanGoal[];
        } else if (existing?.goal_text) {
          goals = [{ id: crypto.randomUUID(), text: existing.goal_text }];
        }

        planState[domain.id] = {
          goals,
          targetScore: existing?.target_score || 8,
          actions: (existing?.actions as ActionItem[]) || [],
        };
        defaultFrequency[domain.id] = 'WEEKLY';
      });
      setPlans(planState);
      setNewActionFrequency(defaultFrequency);
      setReflections(data.reflections);
      setIdealLife(data.idealLife);
      setLoading(false);
    }
    load();
  }, [wheelId]);

  // Goal handlers
  const handleAddGoal = (domainId: string) => {
    const text = newGoalText[domainId]?.trim();
    if (!text) return;

    const newGoal: PlanGoal = {
      id: crypto.randomUUID(),
      text,
    };

    setPlans((prev) => ({
      ...prev,
      [domainId]: {
        ...prev[domainId],
        goals: [...prev[domainId].goals, newGoal],
      },
    }));
    setNewGoalText((prev) => ({ ...prev, [domainId]: '' }));
  };

  const handleRemoveGoal = (domainId: string, goalId: string) => {
    setPlans((prev) => ({
      ...prev,
      [domainId]: {
        ...prev[domainId],
        goals: prev[domainId].goals.filter((g) => g.id !== goalId),
        // Remove actions linked to this goal or unlink them
        actions: prev[domainId].actions.filter((a) => a.goal_id !== goalId),
      },
    }));
  };

  const handleUpdateGoalText = (domainId: string, goalId: string, text: string) => {
    setPlans((prev) => ({
      ...prev,
      [domainId]: {
        ...prev[domainId],
        goals: prev[domainId].goals.map((g) =>
          g.id === goalId ? { ...g, text } : g
        ),
      },
    }));
  };

  const handleAddAction = (domainId: string, goalId: string) => {
    const key = `${domainId}_${goalId}`;
    const text = newActionText[key]?.trim();
    if (!text) return;

    const newAction: ActionItem = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      frequency_type: newActionFrequency[key] || newActionFrequency[domainId] || 'WEEKLY',
      goal_id: goalId,
      domain_id: domainId,
    };

    setPlans((prev) => ({
      ...prev,
      [domainId]: {
        ...prev[domainId],
        actions: [...prev[domainId].actions, newAction],
      },
    }));
    setNewActionText((prev) => ({ ...prev, [key]: '' }));
    setNewActionFrequency((prev) => ({ ...prev, [key]: 'WEEKLY' }));
  };

  const handleRemoveAction = (domainId: string, actionId: string) => {
    setPlans((prev) => ({
      ...prev,
      [domainId]: {
        ...prev[domainId],
        actions: prev[domainId].actions.filter((a) => a.id !== actionId),
      },
    }));
  };

  const handleToggleAction = (domainId: string, actionId: string) => {
    setPlans((prev) => ({
      ...prev,
      [domainId]: {
        ...prev[domainId],
        actions: prev[domainId].actions.map((a) =>
          a.id === actionId ? { ...a, completed: !a.completed } : a
        ),
      },
    }));
  };

  const toggleDomain = (domainId: string) => {
    setOpenDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) {
        next.delete(domainId);
      } else {
        next.add(domainId);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    for (const [domainId, plan] of Object.entries(plans)) {
      await saveActionPlan(wheelId, {
        domain_id: domainId,
        goal_text: plan.goals[0]?.text || '',
        target_score: plan.targetScore,
        goals: plan.goals,
        actions: plan.actions,
      });
    }

    // Auto-import actions to Mi Plan
    await importFromWheel(wheelId);

    router.push('/mi-plan');
  };

  // Render the goal sections for a domain
  const renderGoalSections = (domainId: string, plan: PlanState) => {
    const goalsToRender = plan.goals;

    return (
      <div className="space-y-4">
        {goalsToRender.map((goal, idx) => {
          const goalActions = plan.actions.filter((a) => a.goal_id === goal.id);
          const actionKey = `${domainId}_${goal.id}`;

          return (
            <div key={goal.id} className="space-y-3 rounded-lg border border-border p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-sm font-medium">Meta {goalsToRender.length > 1 ? idx + 1 : ''}</Label>
                  <SMARTGoalTooltip source="rueda" />
                  {goalsToRender.length > 1 && (
                    <button
                      onClick={() => handleRemoveGoal(domainId, goal.id)}
                      className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                      title="Eliminar meta"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Input
                  placeholder="¿Qué quieres lograr en esta área?"
                  value={goal.text}
                  onChange={(e) => handleUpdateGoalText(domainId, goal.id, e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Acciones</Label>
                <div className="space-y-2">
                  {goalActions.map((action) => {
                    const freqLabel = FREQUENCY_OPTIONS.find(f => f.key === action.frequency_type)?.label || 'Semanal';
                    return (
                      <div key={action.id} className="flex items-start gap-2 group p-2 rounded-md hover:bg-muted/50">
                        <Checkbox
                          checked={action.completed}
                          onCheckedChange={() => handleToggleAction(domainId, action.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {action.text}
                          </span>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded">
                              {freqLabel}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAction(domainId, action.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2 pt-2 border-t border-border">
                  <Input
                    placeholder="Nueva acción..."
                    value={newActionText[actionKey] || ''}
                    onChange={(e) =>
                      setNewActionText((prev) => ({
                        ...prev,
                        [actionKey]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleAddAction(domainId, goal.id)
                    }
                    className="text-sm"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Select
                      value={newActionFrequency[actionKey] || 'WEEKLY'}
                      onValueChange={(val) =>
                        setNewActionFrequency((prev) => ({
                          ...prev,
                          [actionKey]: val as FrequencyType,
                        }))
                      }
                    >
                      <SelectTrigger size="sm" className="w-[120px]">
                        <SelectValue placeholder="Frecuencia" />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.key} value={opt.key}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddAction(domainId, goal.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add goal input */}
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Agregar otra meta..."
            value={newGoalText[domainId] || ''}
            onChange={(e) =>
              setNewGoalText((prev) => ({ ...prev, [domainId]: e.target.value }))
            }
            onKeyDown={(e) => e.key === 'Enter' && handleAddGoal(domainId)}
            className="text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddGoal(domainId)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Meta
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <WizardProgress currentStep={6} completedSteps={[0, 1, 2, 3, 4, 5]} />

      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Plan de acción</h1>
          <p className="text-sm text-muted-foreground">
            Define metas y acciones concretas para cada área de enfoque.
          </p>
        </div>

        {/* Context accordion with reflections and ideal life */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="reflections">
            <AccordionTrigger className="text-sm">
              Mis reflexiones
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm">
                {REFLECTION_QUESTIONS.map((question) => {
                  const answer = reflections.find((r) => r.question_key === question.key);
                  if (!answer?.answer_text) return null;
                  return (
                    <div key={question.key}>
                      <p className="font-medium text-muted-foreground">{question.label}</p>
                      <p className="mt-1">{answer.answer_text}</p>
                    </div>
                  );
                })}
                {reflections.filter((r) => r.answer_text).length === 0 && (
                  <p className="text-muted-foreground italic">No hay reflexiones guardadas.</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ideal-life">
            <AccordionTrigger className="text-sm">
              Mi vida ideal
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 text-sm">
                {focusDomains.map((domain) => {
                  const vision = idealLife.find((il) => il.domain_id === domain.id);
                  if (!vision?.vision_text && !Object.values(vision?.prompts_answers || {}).some(Boolean)) return null;
                  return (
                    <div key={domain.id} className="space-y-2">
                      <p className="font-medium">{domain.icon} {domain.name}</p>
                      {vision?.vision_text && (
                        <p className="text-muted-foreground">{vision.vision_text}</p>
                      )}
                      {vision?.prompts_answers && Object.keys(vision.prompts_answers).length > 0 && (
                        <div className="ml-3 space-y-1">
                          {IDEAL_LIFE_PROMPTS.map((prompt) => {
                            const answer = vision.prompts_answers[prompt.key];
                            if (!answer) return null;
                            return (
                              <p key={prompt.key}>
                                <span className="text-muted-foreground">{prompt.label}</span> {answer}
                              </p>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {idealLife.filter((il) => il.vision_text || Object.values(il.prompts_answers || {}).some(Boolean)).length === 0 && (
                  <p className="text-muted-foreground italic">No hay visión de vida ideal guardada.</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {focusDomains.map((domain) => {
          const plan = plans[domain.id];
          if (!plan) return null;

          return (
            <Card key={domain.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{domain.icon}</span>
                  {domain.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderGoalSections(domain.id, plan)}
              </CardContent>
            </Card>
          );
        })}

        {/* Other domains toggle */}
        {otherDomains.length > 0 && (
          <>
            <Button
              variant="ghost"
              className="w-full justify-center gap-2 text-muted-foreground"
              onClick={() => setShowOtherDomains(!showOtherDomains)}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showOtherDomains ? 'rotate-180' : ''}`} />
              {showOtherDomains ? 'Ocultar otras áreas' : `Mostrar otras áreas (${otherDomains.length})`}
            </Button>

            {showOtherDomains && (
              <div className="space-y-4">
                {otherDomains.map((domain) => {
                  const plan = plans[domain.id];
                  if (!plan) return null;
                  const isOpen = openDomains.has(domain.id);
                  const totalActions = plan.actions.length;

                  return (
                    <Collapsible key={domain.id} open={isOpen} onOpenChange={() => toggleDomain(domain.id)}>
                      <Card>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardTitle className="text-base flex items-center gap-2">
                              <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                              <span>{domain.icon}</span>
                              {domain.name}
                              {totalActions > 0 && (
                                <span className="ml-auto text-xs text-muted-foreground font-normal">
                                  {totalActions} {totalActions === 1 ? 'acción' : 'acciones'}
                                </span>
                              )}
                            </CardTitle>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            {renderGoalSections(domain.id, plan)}
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="sticky bottom-16 md:bottom-0 p-4 border-t border-border bg-background">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/rueda/${wheelId}/vida-ideal`)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Vida ideal
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            Seguimiento de plan
          </Button>
        </div>
      </div>
    </div>
  );
}
