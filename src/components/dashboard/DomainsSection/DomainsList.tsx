'use client';

import { useState } from 'react';
import { DomainSummaryCard } from './DomainSummaryCard';
import { DomainDetailSheet } from './DomainDetailSheet';
import { AddDomainDialog } from './AddDomainDialog';
import type { DomainsSummaryResponse, DomainProgress } from '@/lib/types/dashboard';

interface DomainsListProps {
  domainsSummary: DomainsSummaryResponse | null;
  onPinDomain: (domainId: string) => void;
  onUnpinDomain: (domainId: string) => void;
  showAddButton?: boolean;
}

export function DomainsList({
  domainsSummary,
  onPinDomain,
  onUnpinDomain,
  showAddButton = true,
}: DomainsListProps) {
  const [selectedDomain, setSelectedDomain] = useState<DomainProgress | null>(null);

  if (!domainsSummary) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Cargando dominios...</p>
      </div>
    );
  }

  const { prioritizedDomains, pinnedDomains, availableDomains } = domainsSummary;

  if (prioritizedDomains.length === 0 && pinnedDomains.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-muted-foreground">
          <p>Sin dominios configurados</p>
          <p className="text-sm mt-1">
            Crea tu Rueda de la Vida para ver tus prioridades aqui
          </p>
        </div>
        {showAddButton && availableDomains.length > 0 && (
          <AddDomainDialog
            availableDomains={availableDomains}
            onAddDomains={(ids) => ids.forEach(onPinDomain)}
          />
        )}
      </div>
    );
  }

  const handleAddDomains = (domainIds: string[]) => {
    domainIds.forEach(id => onPinDomain(id));
  };

  return (
    <div className="space-y-6">
      {/* Prioritized domains from wheel */}
      {prioritizedDomains.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Prioridades de tu Rueda de la Vida
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prioritizedDomains.map((domain) => (
              <DomainSummaryCard
                key={domain.domain.id}
                data={domain}
                onClick={() => setSelectedDomain(domain)}
                showPinButton={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pinned domains */}
      {pinnedDomains.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Dominios anclados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedDomains.map((domain) => (
              <DomainSummaryCard
                key={domain.domain.id}
                data={domain}
                onClick={() => setSelectedDomain(domain)}
                onUnpin={() => onUnpinDomain(domain.domain.id)}
                showPinButton={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add domain button */}
      {showAddButton && availableDomains.length > 0 && (
        <AddDomainDialog
          availableDomains={availableDomains}
          onAddDomains={handleAddDomains}
        />
      )}

      {/* Detail sheet */}
      <DomainDetailSheet
        data={selectedDomain}
        open={!!selectedDomain}
        onOpenChange={(open) => !open && setSelectedDomain(null)}
      />
    </div>
  );
}
