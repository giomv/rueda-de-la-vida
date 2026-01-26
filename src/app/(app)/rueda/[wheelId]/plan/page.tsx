'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { WizardProgress } from '@/components/app/WizardProgress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getWheelData, saveActionPlan } from '@/lib/actions/wheel-actions';
import { ChevronRight, ChevronLeft, Plus, X, Info } from 'lucide-react';
import type { Domain, ActionItem, Reflection, IdealLife } from '@/lib/types';
import { REFLECTION_QUESTIONS, IDEAL_LIFE_PROMPTS } from '@/lib/types';

interface PlanState {
  goalText: string;
  targetScore: number;
  actions: ActionItem[];
}

export default function PlanPage() {
  const params = useParams();
  const router = useRouter();
  const wheelId = params.wheelId as string;

  const [loading, setLoading] = useState(true);
  const [focusDomains, setFocusDomains] = useState<Domain[]>([]);
  const [plans, setPlans] = useState<Record<string, PlanState>>({});
  const [newActionText, setNewActionText] = useState<Record<string, string>>({});
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [idealLife, setIdealLife] = useState<IdealLife[]>([]);

  useEffect(() => {
    async function load() {
      const data = await getWheelData(wheelId);
      const focusIds = data.priorities
        .filter((p) => p.is_focus)
        .map((p) => p.domain_id);
      const focus = data.domains.filter((d) => focusIds.includes(d.id));
      setFocusDomains(focus);

      const planState: Record<string, PlanState> = {};
      focus.forEach((domain) => {
        const existing = data.actionPlans.find((ap) => ap.domain_id === domain.id);
        planState[domain.id] = {
          goalText: existing?.goal_text || '',
          targetScore: existing?.target_score || 8,
          actions: (existing?.actions as ActionItem[]) || [],
        };
      });
      setPlans(planState);
      setReflections(data.reflections);
      setIdealLife(data.idealLife);
      setLoading(false);
    }
    load();
  }, [wheelId]);

  const handleAddAction = (domainId: string) => {
    const text = newActionText[domainId]?.trim();
    if (!text) return;

    setPlans((prev) => ({
      ...prev,
      [domainId]: {
        ...prev[domainId],
        actions: [
          ...prev[domainId].actions,
          { id: crypto.randomUUID(), text, completed: false },
        ],
      },
    }));
    setNewActionText((prev) => ({ ...prev, [domainId]: '' }));
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

  const handleContinue = async () => {
    for (const [domainId, plan] of Object.entries(plans)) {
      await saveActionPlan(wheelId, {
        domain_id: domainId,
        goal_text: plan.goalText,
        target_score: plan.targetScore,
        actions: plan.actions,
      });
    }
    router.push(`/rueda/${wheelId}/seguimiento`);
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
              📝 Mis reflexiones
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
              ✨ Mi vida ideal
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-sm">Meta</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-semibold">Meta SMART = clara y medible.</p>
                        <p className="mt-1">Define qué quieres lograr, cuánto, y para cuándo.</p>
                        <p className="mt-1 text-muted-foreground">Ejemplo: &quot;Ahorrar S/ 500 al mes hasta junio.&quot;</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    placeholder="¿Qué quieres lograr en esta área?"
                    value={plan.goalText}
                    onChange={(e) =>
                      setPlans((prev) => ({
                        ...prev,
                        [domain.id]: { ...prev[domain.id], goalText: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Puntaje objetivo</Label>
                    <span className="text-sm font-medium">{plan.targetScore}/10</span>
                  </div>
                  <Slider
                    value={[plan.targetScore]}
                    onValueChange={([val]) =>
                      setPlans((prev) => ({
                        ...prev,
                        [domain.id]: { ...prev[domain.id], targetScore: val },
                      }))
                    }
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Acciones semanales</Label>
                  <div className="space-y-1.5">
                    {plan.actions.map((action) => (
                      <div key={action.id} className="flex items-center gap-2 group">
                        <Checkbox
                          checked={action.completed}
                          onCheckedChange={() =>
                            handleToggleAction(domain.id, action.id)
                          }
                        />
                        <span className={`text-sm flex-1 ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {action.text}
                        </span>
                        <button
                          onClick={() => handleRemoveAction(domain.id, action.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nueva acción..."
                      value={newActionText[domain.id] || ''}
                      onChange={(e) =>
                        setNewActionText((prev) => ({
                          ...prev,
                          [domain.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleAddAction(domain.id)
                      }
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddAction(domain.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
            Seguimiento
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
