'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WizardProgress } from '@/components/app/WizardProgress';
import { RadarChart } from '@/components/wheel/RadarChart';
import { ExportButton } from '@/components/wheel/ExportButton';
import { getWheelData } from '@/lib/actions/wheel-actions';
import { generateInsights, calculateAverage, calculateBalance } from '@/lib/utils/wheel-insights';
import { ChevronRight, ChevronLeft, TrendingUp, TrendingDown, AlertTriangle, Star } from 'lucide-react';
import type { Domain, Score, Priority } from '@/lib/types';

export default function ResultadoPage() {
  const params = useParams();
  const router = useRouter();
  const wheelId = params.wheelId as string;
  const chartRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [wheelTitle, setWheelTitle] = useState('');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [createdAt, setCreatedAt] = useState('');

  useEffect(() => {
    async function load() {
      const data = await getWheelData(wheelId);
      if (data.wheel) {
        setWheelTitle(data.wheel.title);
        setCreatedAt(data.wheel.created_at);
      }
      setDomains(data.domains);
      setScores(data.scores);
      setPriorities(data.priorities);
      setLoading(false);
    }
    load();
  }, [wheelId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const insights = generateInsights(domains, scores, priorities);
  const average = calculateAverage(scores);
  const balance = calculateBalance(scores);

  const insightIcons = {
    highest: TrendingUp,
    lowest: TrendingDown,
    gap: AlertTriangle,
    focus: Star,
  };

  return (
    <div className="flex flex-col h-full">
      <WizardProgress currentStep={2} completedSteps={[0, 1]} />

      <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold mb-1">Tu Rueda de la Vida</h1>
            <p className="text-sm text-muted-foreground">
              {wheelTitle} - {createdAt && new Date(createdAt).toLocaleDateString('es')}
            </p>
          </div>
          <ExportButton targetRef={chartRef} filename={wheelTitle || 'rueda-de-la-vida'} />
        </div>

        {/* Chart */}
        <div ref={chartRef} className="bg-card rounded-xl p-4 border border-border">
          <RadarChart domains={domains} scores={scores} height={350} />
          <div className="flex justify-center gap-8 mt-2">
            <div className="text-center">
              <p className="text-2xl font-bold">{average}</p>
              <p className="text-xs text-muted-foreground">Promedio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{balance}%</p>
              <p className="text-xs text-muted-foreground">Equilibrio</p>
            </div>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight, i) => {
                const Icon = insightIcons[insight.type];
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Score breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalle por dominio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {domains.map((domain) => {
                const score = scores.find((s) => s.domain_id === domain.id)?.score ?? 0;
                return (
                  <div key={domain.id} className="flex items-center gap-3">
                    <span>{domain.icon}</span>
                    <span className="text-sm flex-1">{domain.name}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono w-6 text-right">{score}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-16 md:bottom-0 p-4 border-t border-border bg-background">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/rueda/${wheelId}/puntajes`)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Puntajes
          </Button>
          <Button
            onClick={() => router.push(`/rueda/${wheelId}/prioridades`)}
            className="flex-1"
          >
            Definir prioridades
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
