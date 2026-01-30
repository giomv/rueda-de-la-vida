'use client';

import { useState } from 'react';
import { DomainCard } from './DomainCard';
import { DomainDetailSheet } from './DomainDetailSheet';
import type { DomainProgress } from '@/lib/types/dashboard';

interface DomainsListProps {
  domains: DomainProgress[];
}

export function DomainsList({ domains }: DomainsListProps) {
  const [selectedDomain, setSelectedDomain] = useState<DomainProgress | null>(null);

  if (domains.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Sin dominios configurados</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {domains.map((domain) => (
          <DomainCard
            key={domain.domain.id}
            data={domain}
            onClick={() => setSelectedDomain(domain)}
          />
        ))}
      </div>

      <DomainDetailSheet
        data={selectedDomain}
        open={!!selectedDomain}
        onOpenChange={(open) => !open && setSelectedDomain(null)}
      />
    </>
  );
}
