'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Odyssey, OdysseyWithPlans, FullOdysseyData } from '@/lib/types';

export function useOdyssey(odysseyId: string | null) {
  const [data, setData] = useState<FullOdysseyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!odysseyId) {
      setLoading(false);
      return;
    }

    async function fetchOdyssey() {
      const supabase = createClient();
      setLoading(true);

      const { data: odyssey, error: odysseyError } = await supabase
        .from('odysseys')
        .select('*')
        .eq('id', odysseyId)
        .single();

      if (odysseyError) {
        setError(odysseyError.message);
        setLoading(false);
        return;
      }

      const { data: plans } = await supabase
        .from('odyssey_plans')
        .select('*')
        .eq('odyssey_id', odysseyId)
        .order('plan_number');

      const planIds = (plans || []).map((p) => p.id);

      const [
        { data: milestones },
        { data: questions },
        { data: prototype },
        { data: prototypeSteps },
        { data: prototypeActions },
        { data: weeklyChecks },
      ] = await Promise.all([
        supabase
          .from('odyssey_milestones')
          .select('*')
          .in('plan_id', planIds.length > 0 ? planIds : ['_none_'])
          .order('order_position'),
        supabase
          .from('odyssey_questions')
          .select('*')
          .in('plan_id', planIds.length > 0 ? planIds : ['_none_'])
          .order('order_position'),
        supabase
          .from('odyssey_prototypes')
          .select('*')
          .eq('odyssey_id', odysseyId!)
          .maybeSingle(),
        supabase
          .from('odyssey_prototype_steps')
          .select('*')
          .in('prototype_id',
            (await supabase.from('odyssey_prototypes').select('id').eq('odyssey_id', odysseyId!)).data?.map(p => p.id) || ['_none_']
          ),
        supabase
          .from('odyssey_prototype_actions')
          .select('*')
          .in('prototype_id',
            (await supabase.from('odyssey_prototypes').select('id').eq('odyssey_id', odysseyId!)).data?.map(p => p.id) || ['_none_']
          ),
        supabase
          .from('odyssey_weekly_checks')
          .select('*')
          .in('prototype_id',
            (await supabase.from('odyssey_prototypes').select('id').eq('odyssey_id', odysseyId!)).data?.map(p => p.id) || ['_none_']
          )
          .order('week_number'),
      ]);

      const plansWithData = (plans || []).map((plan) => ({
        ...plan,
        milestones: (milestones || []).filter((m) => m.plan_id === plan.id),
        questions: (questions || []).filter((q) => q.plan_id === plan.id),
      }));

      setData({
        odyssey,
        plans: plansWithData,
        prototype: prototype || null,
        prototypeSteps: prototypeSteps || [],
        prototypeActions: prototypeActions || [],
        weeklyChecks: weeklyChecks || [],
      });
      setLoading(false);
    }

    fetchOdyssey();
  }, [odysseyId]);

  return { data, loading, error };
}

export function useOdysseyList() {
  const [odysseys, setOdysseys] = useState<OdysseyWithPlans[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOdysseys() {
      const supabase = createClient();

      const { data } = await supabase
        .from('odysseys')
        .select('*, odyssey_plans(*)')
        .order('created_at', { ascending: false });

      setOdysseys(
        (data || []).map((o) => ({
          ...o,
          plans: o.odyssey_plans || [],
        }))
      );
      setLoading(false);
    }

    fetchOdysseys();
  }, []);

  return { odysseys, loading };
}
