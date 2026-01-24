'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { WheelWithDomains } from '@/lib/types';

export function useWheel(wheelId: string | null) {
  const [wheel, setWheel] = useState<WheelWithDomains | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wheelId) {
      setLoading(false);
      return;
    }

    async function fetchWheel() {
      const supabase = createClient();
      setLoading(true);

      const { data: wheelData, error: wheelError } = await supabase
        .from('wheels')
        .select('*')
        .eq('id', wheelId)
        .single();

      if (wheelError) {
        setError(wheelError.message);
        setLoading(false);
        return;
      }

      const [
        { data: domains },
        { data: scores },
        { data: priorities },
      ] = await Promise.all([
        supabase
          .from('domains')
          .select('*')
          .eq('wheel_id', wheelId)
          .order('order_position'),
        supabase.from('scores').select('*').eq('wheel_id', wheelId),
        supabase.from('priorities').select('*').eq('wheel_id', wheelId),
      ]);

      setWheel({
        ...wheelData,
        domains: domains || [],
        scores: scores || [],
        priorities: priorities || [],
      });
      setLoading(false);
    }

    fetchWheel();
  }, [wheelId]);

  return { wheel, loading, error };
}

export function useWheelList() {
  const [wheels, setWheels] = useState<WheelWithDomains[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWheels() {
      const supabase = createClient();

      const { data } = await supabase
        .from('wheels')
        .select(`
          *,
          domains (*),
          scores (*),
          priorities (*)
        `)
        .order('created_at', { ascending: false });

      setWheels((data as WheelWithDomains[]) || []);
      setLoading(false);
    }

    fetchWheels();
  }, []);

  return { wheels, loading };
}
