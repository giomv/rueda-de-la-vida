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
import { getWheelData, saveActionPlan } from '@/lib/actions/wheel-actions';
import { ChevronRight, ChevronLeft, Plus, X } from 'lucide-react';
import type { Domain, ActionItem } from '@/lib/types';

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
                  <Label className="text-sm">Meta</Label>
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
