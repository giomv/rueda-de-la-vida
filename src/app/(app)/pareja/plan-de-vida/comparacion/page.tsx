'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePartner } from '@/hooks/use-partner';
import { getPartnerOdysseys } from '@/lib/actions/odyssey-actions';
import { useOdysseyList } from '@/hooks/use-odyssey';
import { PLAN_TYPES } from '@/lib/types';

export default function ParejaComparacionPage() {
  const router = useRouter();
  const { partnership, partner, loading: partnerLoading } = usePartner();
  const { odysseys: myOdysseys, loading: myLoading } = useOdysseyList();
  const [partnerOdysseys, setPartnerOdysseys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPartner() {
      if (!partnership?.id) return;
      const data = await getPartnerOdysseys(partnership.id);
      setPartnerOdysseys(data);
      setLoading(false);
    }
    if (partnership) fetchPartner();
    else setLoading(false);
  }, [partnership]);

  if (partnerLoading || myLoading || loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const myActivePlan = myOdysseys[0];
  const myPlanType = myActivePlan?.active_plan_number
    ? PLAN_TYPES.find((p) => p.number === myActivePlan.active_plan_number)
    : null;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/pareja/plan-de-vida')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Comparar Planes de Vida</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mi plan</CardTitle>
          </CardHeader>
          <CardContent>
            {myActivePlan ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">{myActivePlan.title}</p>
                {myPlanType && (
                  <p className="text-xs text-muted-foreground">
                    Plan activo: {myPlanType.title}
                  </p>
                )}
                {myActivePlan.plans?.map((plan: any) => (
                  <div key={plan.id} className="text-xs">
                    <span className="font-medium">Plan {plan.plan_number}:</span>{' '}
                    <span className="text-muted-foreground">{plan.headline || 'Sin headline'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tienes un plan activo.</p>
            )}
          </CardContent>
        </Card>

        {/* Partner's plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Plan de {partner?.display_name || 'tu pareja'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {partnerOdysseys.length > 0 ? (
              <div className="space-y-2">
                {partnerOdysseys.map((shared) => (
                  <div key={shared.id} className="space-y-1">
                    <p className="text-sm font-medium">{shared.odysseys?.title || 'Plan'}</p>
                    {shared.odysseys?.odyssey_plans?.map((plan: any) => (
                      <div key={plan.id} className="text-xs">
                        <span className="font-medium">Plan {plan.plan_number}:</span>{' '}
                        <span className="text-muted-foreground">{plan.headline || 'Sin headline'}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tu pareja no ha compartido planes aún.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
