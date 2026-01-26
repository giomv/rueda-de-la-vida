'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityForm } from '@/components/lifeplan';
import { createClient } from '@/lib/supabase/client';
import type { LifeDomain, Goal } from '@/lib/types';

export default function NuevaActividadPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<LifeDomain[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/iniciar-sesion');
        return;
      }

      const [{ data: domainsData }, { data: goalsData }] = await Promise.all([
        supabase
          .from('life_domains')
          .select('*')
          .eq('user_id', user.id)
          .order('order_position'),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('created_at', { ascending: false }),
      ]);

      setDomains(domainsData || []);
      setGoals(goalsData || []);
      setLoading(false);
    }

    loadData();
  }, [router]);

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
        <h1 className="text-xl font-bold">Nueva Actividad</h1>
      </div>

      {/* Form */}
      <ActivityForm domains={domains} goals={goals} />
    </div>
  );
}
