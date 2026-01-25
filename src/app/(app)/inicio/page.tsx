'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingSlider } from '@/components/onboarding/OnboardingSlider';
import { InfoAccordion } from '@/components/onboarding/InfoAccordion';
import { RadarChart } from '@/components/wheel/RadarChart';
import { Plus, CircleDot, TrendingUp, Map } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { WheelWithDomains } from '@/lib/types';
import { calculateAverage, calculateBalance } from '@/lib/utils/wheel-insights';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [wheels, setWheels] = useState<WheelWithDomains[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from('wheels')
        .select('*, domains(*), scores(*), priorities(*)')
        .order('created_at', { ascending: false })
        .limit(5);

      setWheels((data as WheelWithDomains[]) || []);
      setLoading(false);
    }
    fetch();
  }, []);

  const latestWheel = wheels[0];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inicio</h1>
        <Link href="/rueda/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva rueda
          </Button>
        </Link>
      </div>

      {wheels.length === 0 ? (
        /* Empty state */
        <div className="space-y-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CircleDot className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                Comienza tu primera rueda
              </h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Evalúa las áreas de tu vida, visualiza tu equilibrio y crea un plan de acción.
              </p>
              <Button onClick={() => setShowOnboarding(true)}>
                Empezar
              </Button>
            </CardContent>
          </Card>

          <InfoAccordion />

          <OnboardingSlider
            open={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            onStart={() => {
              setShowOnboarding(false);
              router.push('/rueda/nueva');
            }}
          />
        </div>
      ) : (
        /* Dashboard with data */
        <div className="space-y-6">
          {latestWheel && latestWheel.scores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{latestWheel.title}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {new Date(latestWheel.created_at).toLocaleDateString('es')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadarChart
                  domains={latestWheel.domains}
                  scores={latestWheel.scores}
                  height={300}
                />
                <div className="flex justify-center gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{calculateAverage(latestWheel.scores)}</p>
                    <p className="text-xs text-muted-foreground">Promedio</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{calculateBalance(latestWheel.scores)}%</p>
                    <p className="text-xs text-muted-foreground">Equilibrio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Link href="/plan-de-vida">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Map className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Plan de Vida</p>
                  <p className="text-xs text-muted-foreground">
                    Diseña 3 planes alternativos a 5 años
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {wheels.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ruedas recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {wheels.slice(0, 5).map((wheel) => (
                    <Link
                      key={wheel.id}
                      href={`/rueda/${wheel.id}/resultado`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{wheel.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {wheel.domains.length} dominios
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(wheel.created_at).toLocaleDateString('es')}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
