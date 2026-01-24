'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { WizardProgress } from '@/components/app/WizardProgress';
import { getWheelData } from '@/lib/actions/wheel-actions';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, CheckCircle, Calendar, Trophy } from 'lucide-react';
import type { Domain, ActionItem } from '@/lib/types';

interface HabitEntry {
  id: string;
  name: string;
  domainName: string;
  domainIcon: string;
  completed: boolean;
}

export default function SeguimientoPage() {
  const params = useParams();
  const router = useRouter();
  const wheelId = params.wheelId as string;

  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const data = await getWheelData(wheelId);
      const focusIds = data.priorities
        .filter((p) => p.is_focus)
        .map((p) => p.domain_id);

      const allHabits: HabitEntry[] = [];
      data.actionPlans
        .filter((ap) => focusIds.includes(ap.domain_id))
        .forEach((ap) => {
          const domain = data.domains.find((d) => d.id === ap.domain_id);
          const actions = (ap.actions as ActionItem[]) || [];
          actions.forEach((action) => {
            allHabits.push({
              id: action.id,
              name: action.text,
              domainName: domain?.name || '',
              domainIcon: domain?.icon || '',
              completed: action.completed,
            });
          });
        });

      setHabits(allHabits);
      setLoading(false);
    }
    load();
  }, [wheelId]);

  const handleToggle = (habitId: string) => {
    setCompletedToday((prev) => {
      const next = new Set(prev);
      if (next.has(habitId)) {
        next.delete(habitId);
      } else {
        next.add(habitId);
      }
      return next;
    });
  };

  const completionRate = habits.length > 0
    ? Math.round((completedToday.size / habits.length) * 100)
    : 0;

  const today = new Date().toLocaleDateString('es', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <WizardProgress currentStep={7} completedSteps={[0, 1, 2, 3, 4, 5, 6]} />

      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Seguimiento diario</h1>
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
        </div>

        {/* Progress card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{completionRate}%</p>
                  <p className="text-xs text-muted-foreground">completado hoy</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">
                  {completedToday.size}/{habits.length}
                </p>
                <p className="text-xs text-muted-foreground">hábitos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Habits list */}
        {habits.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No tienes acciones definidas aún. Vuelve al plan para crear tus hábitos.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => router.push(`/rueda/${wheelId}/plan`)}
              >
                Ir al plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Mis hábitos de hoy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={completedToday.has(habit.id)}
                    onCheckedChange={() => handleToggle(habit.id)}
                  />
                  <span className="text-lg">{habit.domainIcon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${completedToday.has(habit.id) ? 'line-through text-muted-foreground' : ''}`}>
                      {habit.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{habit.domainName}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Finish button */}
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold mb-2">Has completado el ejercicio</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Puedes volver cuando quieras para registrar tu progreso diario.
            </p>
            <Button onClick={() => router.push('/mis-ruedas')}>
              Ver mis ruedas
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-16 md:bottom-0 p-4 border-t border-border bg-background">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push(`/rueda/${wheelId}/plan`)}
            className="w-full"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver al plan
          </Button>
        </div>
      </div>
    </div>
  );
}
