'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityForm } from '@/components/lifeplan';
import { syncLifePlanActivities } from '@/lib/actions/import-actions';
import { getGoalsWithYears } from '@/lib/actions/dashboard-actions';
import { getActiveWheelDomains } from '@/lib/actions/domain-actions';
import type { LifeDomain } from '@/lib/types';
import type { GoalWithYear } from '@/lib/types/dashboard';

export default function NuevaActividadPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<LifeDomain[]>([]);
  const [goals, setGoals] = useState<GoalWithYear[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Sync goals from wheel and odyssey before loading
      await syncLifePlanActivities();

      // Fetch domains and goals with year information in parallel
      const [domainsData, goalsResponse] = await Promise.all([
        getActiveWheelDomains(),
        getGoalsWithYears(),
      ]);

      setDomains(domainsData);
      setGoals(goalsResponse.goals);
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-40 bg-muted rounded-lg w-full" />
          <div className="h-40 bg-muted rounded-lg w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Nueva Acción</h1>
      </div>

      {/* Form */}
      <ActivityForm domains={domains} goals={goals} />
    </div>
  );
}
