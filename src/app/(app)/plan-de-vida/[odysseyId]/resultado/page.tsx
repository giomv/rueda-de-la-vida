'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Map } from 'lucide-react';
import { OdysseyExportButton } from '@/components/odyssey/OdysseyExportButton';
import { ComparisonGrid } from '@/components/odyssey/ComparisonGrid';
import { ComparisonInsights } from '@/components/odyssey/ComparisonInsights';
import { getOdysseyData } from '@/lib/actions/odyssey-actions';
import { PLAN_TYPES, PROTOTYPE_STEP_TYPES } from '@/lib/types';
import type { FullOdysseyData, PlanWithMilestones } from '@/lib/types';

export default function ResultadoPage() {
  const params = useParams();
  const router = useRouter();
  const odysseyId = params.odysseyId as string;
  const [data, setData] = useState<FullOdysseyData | null>(null);
  const [loading, setLoading] = useState(true);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const result = await getOdysseyData(odysseyId);
      setData(result);
      setLoading(false);
    }
    load();
  }, [odysseyId]);

  if (loading || !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const { odyssey, plans, prototype, prototypeSteps, weeklyChecks } = data;
  const activePlan = plans.find((p) => p.plan_number === odyssey.active_plan_number);
  const planType = odyssey.active_plan_number ? PLAN_TYPES.find((p) => p.number === odyssey.active_plan_number) : null;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/plan-de-vida')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{odyssey.title}</h1>
            <p className="text-xs text-muted-foreground">
              {new Date(odyssey.created_at).toLocaleDateString('es')}
              {planType && ` · Plan activo: ${planType.title}`}
            </p>
          </div>
        </div>
        <OdysseyExportButton targetRef={exportRef} filename={`plan-${odyssey.title}`} />
      </div>

      <div ref={exportRef}>
        <Tabs defaultValue="comparacion" className="space-y-4">
          <TabsList>
            <TabsTrigger value="comparacion">Comparación</TabsTrigger>
            <TabsTrigger value="planes">Planes</TabsTrigger>
            <TabsTrigger value="prototipo">Prototipo</TabsTrigger>
          </TabsList>

          <TabsContent value="comparacion" className="space-y-4">
            <ComparisonGrid
              plans={plans}
              activePlanNumber={odyssey.active_plan_number}
              onSelectPlan={() => {}}
            />
            <ComparisonInsights plans={plans} />
          </TabsContent>

          <TabsContent value="planes" className="space-y-4">
            {plans.map((plan) => {
              const type = PLAN_TYPES.find((p) => p.number === plan.plan_number);
              return (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      Plan {plan.plan_number}: {type?.title}
                      {odyssey.active_plan_number === plan.plan_number && (
                        <Badge variant="default" className="text-xs">Activo</Badge>
                      )}
                    </CardTitle>
                    {plan.headline && (
                      <p className="text-sm text-muted-foreground">{plan.headline}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {plan.milestones.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2">Metas:</p>
                        <div className="space-y-1">
                          {plan.milestones.map((m) => (
                            <p key={m.id} className="text-sm">
                              <span className="text-muted-foreground">Año {m.year}:</span> {m.title}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {plan.feedback.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2">Retroalimentación:</p>
                        <div className="space-y-1">
                          {plan.feedback.map((f) => (
                            <p key={f.id} className="text-sm text-muted-foreground">
                              {f.person_name && <span className="font-medium">{f.person_name}: </span>}
                              {f.feedback_text}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="prototipo" className="space-y-4">
            {prototype ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Prototipo de 30 días</span>
                      <Badge variant={prototype.status === 'completed' ? 'default' : 'outline'}>
                        {prototype.status === 'completed' ? 'Completado' : prototype.status === 'active' ? 'Activo' : 'Abandonado'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {prototypeSteps.map((step) => {
                      const typeInfo = PROTOTYPE_STEP_TYPES.find((t) => t.key === step.step_type);
                      return (
                        <div key={step.id} className="flex items-start gap-2">
                          <span>{typeInfo?.icon}</span>
                          <div>
                            <p className="text-sm font-medium">{step.title}</p>
                            {step.description && (
                              <p className="text-xs text-muted-foreground">{step.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Weekly progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Progreso Semanal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((week) => {
                        const check = weeklyChecks.find((c) => c.week_number === week);
                        const completed = check?.conversation_done && check?.experiment_done && check?.skill_done;
                        return (
                          <div
                            key={week}
                            className={`text-center p-2 rounded ${completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}
                          >
                            <p className="text-xs font-medium">S{week}</p>
                            <p className="text-xs text-muted-foreground">
                              {check ? `${[check.conversation_done, check.experiment_done, check.skill_done].filter(Boolean).length}/3` : '0/3'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Reflections */}
                {(prototype.reflection_learned || prototype.reflection_adjust || prototype.reflection_next_step) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Reflexiones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {prototype.reflection_learned && (
                        <div>
                          <p className="text-xs font-medium mb-1">Lo que aprendí:</p>
                          <p className="text-sm text-muted-foreground">{prototype.reflection_learned}</p>
                        </div>
                      )}
                      {prototype.reflection_adjust && (
                        <div>
                          <p className="text-xs font-medium mb-1">Lo que ajustaría:</p>
                          <p className="text-sm text-muted-foreground">{prototype.reflection_adjust}</p>
                        </div>
                      )}
                      {prototype.reflection_next_step && (
                        <div>
                          <p className="text-xs font-medium mb-1">Mi siguiente paso:</p>
                          <p className="text-sm text-muted-foreground">{prototype.reflection_next_step}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Map className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aún no has iniciado un prototipo para este plan.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
