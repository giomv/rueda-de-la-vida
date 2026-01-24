'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Partnership, Profile } from '@/lib/types';

export function usePartner() {
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPartnership() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('partnerships')
        .select('*')
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq('status', 'active')
        .single();

      if (data) {
        setPartnership(data);
        const partnerId = data.user_a_id === user.id ? data.user_b_id : data.user_a_id;
        if (partnerId) {
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', partnerId)
            .single();
          setPartner(partnerProfile);
        }
      }
      setLoading(false);
    }

    fetchPartnership();
  }, []);

  return { partnership, partner, loading };
}
