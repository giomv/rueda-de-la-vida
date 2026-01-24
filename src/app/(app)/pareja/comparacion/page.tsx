'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PartnerComparison } from '@/components/partner/PartnerComparison';
import { usePartner } from '@/hooks/use-partner';
import { createClient } from '@/lib/supabase/client';
import { getPartnerWheels } from '@/lib/actions/partner-actions';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { WheelWithDomains } from '@/lib/types';

export default function ComparacionPage() {
  const router = useRouter();
  const { partnership, partner } = usePartner();
  const [myWheels, setMyWheels] = useState<WheelWithDomains[]>([]);
  const [partnerWheels, setPartnerWheels] = useState<WheelWithDomains[]>([]);
  const [myWheelId, setMyWheelId] = useState('');
  const [partnerWheelId, setPartnerWheelId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('wheels')
        .select('*, domains(*), scores(*), priorities(*)')
        .order('created_at', { ascending: false });
      setMyWheels((data as WheelWithDomains[]) || []);

      if (partnership) {
        try {
          const shared = await getPartnerWheels(partnership.id);
          // Extract wheel data from shared wheels
          const pWheels = shared
            .filter((sw: { wheels: WheelWithDomains }) => sw.wheels)
            .map((sw: { wheels: WheelWithDomains }) => sw.wheels);
          setPartnerWheels(pWheels);
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    }
    load();
  }, [partnership]);

  const selectedMy = myWheels.find((w) => w.id === myWheelId);
  const selectedPartner = partnerWheels.find((w) => w.id === partnerWheelId);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/pareja')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Comparar con {partner?.display_name || 'pareja'}</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tu rueda</label>
          <Select value={myWheelId} onValueChange={setMyWheelId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {myWheels.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Rueda de {partner?.display_name || 'pareja'}</label>
          <Select value={partnerWheelId} onValueChange={setPartnerWheelId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {partnerWheels.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedMy && selectedPartner && selectedMy.scores.length > 0 && selectedPartner.scores.length > 0 ? (
        <PartnerComparison
          domains={selectedMy.domains}
          myScores={selectedMy.scores}
          partnerScores={selectedPartner.scores}
          myName="Tú"
          partnerName={partner?.display_name || 'Pareja'}
        />
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Selecciona una rueda de cada lado para comparar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
