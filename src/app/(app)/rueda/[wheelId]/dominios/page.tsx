'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WizardProgress } from '@/components/app/WizardProgress';
import { DomainList } from '@/components/wheel/DomainList';
import { useWizardStore } from '@/lib/stores/wizard-store';
import { useAutoSave } from '@/hooks/use-auto-save';
import { saveDomains, getWheelData } from '@/lib/actions/wheel-actions';
import { ChevronRight, Save } from 'lucide-react';
import type { Domain } from '@/lib/types';

export default function DominiosPage() {
  const params = useParams();
  const router = useRouter();
  const wheelId = params.wheelId as string;
  const [loading, setLoading] = useState(true);

  const {
    domains,
    setDomains,
    addDomain,
    removeDomain,
    updateDomain,
    setWheelId,
    hydrate,
  } = useWizardStore();

  useEffect(() => {
    async function load() {
      const data = await getWheelData(wheelId);
      setWheelId(wheelId);
      if (data.domains.length > 0) {
        hydrate({ domains: data.domains, scores: data.scores });
      }
      setLoading(false);
    }
    load();
  }, [wheelId, setWheelId, hydrate]);

  const saveFn = useCallback(async () => {
    if (domains.length === 0) return;
    await saveDomains(
      wheelId,
      domains.map((d, i) => ({
        wheel_id: wheelId,
        name: d.name,
        icon: d.icon,
        order_position: i,
      }))
    );
  }, [wheelId, domains]);

  const { isSaving, lastSaved } = useAutoSave(saveFn);

  const handleAdd = (name: string, icon: string) => {
    const newDomain: Domain = {
      id: crypto.randomUUID(),
      wheel_id: wheelId,
      name,
      icon,
      order_position: domains.length,
      created_at: new Date().toISOString(),
    };
    addDomain(newDomain);
  };

  const handleContinue = async () => {
    await saveFn();
    router.push(`/rueda/${wheelId}/puntajes`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <WizardProgress currentStep={0} />

      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Define tus dominios</h1>
          <p className="text-sm text-muted-foreground">
            Elige entre 4 y 10 áreas de tu vida que quieras evaluar.
          </p>
        </div>

        <DomainList
          domains={domains}
          onAdd={handleAdd}
          onRemove={removeDomain}
          onRename={(id, name) => updateDomain(id, { name })}
        />

        {/* Save indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isSaving && (
            <>
              <Save className="h-3 w-3 animate-pulse" />
              Guardando...
            </>
          )}
          {lastSaved && !isSaving && (
            <>
              <Save className="h-3 w-3" />
              Guardado
            </>
          )}
        </div>
      </div>

      {/* Bottom action */}
      <div className="sticky bottom-16 md:bottom-0 p-4 border-t border-border bg-background">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleContinue}
            className="w-full"
            disabled={domains.length < 4}
          >
            Continuar a puntajes
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
