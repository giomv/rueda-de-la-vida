'use client';

import { cn } from '@/lib/utils';
import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import type { FilterType } from '@/lib/types/lifeplan';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterChipsProps {
  className?: string;
}

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'domain', label: 'Por Dominio' },
  { key: 'goal', label: 'Por Meta' },
  { key: 'uncategorized', label: 'Sin categoría' },
];

export function FilterChips({ className }: FilterChipsProps) {
  const {
    filter,
    setFilter,
    selectedDomainId,
    setSelectedDomainId,
    selectedGoalId,
    setSelectedGoalId,
    domains,
    goals,
  } = useLifePlanStore();

  return (
    <div className={cn('flex flex-wrap gap-2 items-center', className)}>
      {/* Filter type chips */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => {
              setFilter(option.key);
              if (option.key !== 'domain') setSelectedDomainId(null);
              if (option.key !== 'goal') setSelectedGoalId(null);
            }}
            className={cn(
              'py-1.5 px-3 text-sm font-medium rounded-md transition-colors',
              filter === option.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Domain selector */}
      {filter === 'domain' && domains.length > 0 && (
        <Select
          value={selectedDomainId || ''}
          onValueChange={(value) => setSelectedDomainId(value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccionar dominio" />
          </SelectTrigger>
          <SelectContent>
            {domains.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.icon && <span className="mr-2">{domain.icon}</span>}
                {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Goal selector */}
      {filter === 'goal' && goals.length > 0 && (
        <Select
          value={selectedGoalId || ''}
          onValueChange={(value) => setSelectedGoalId(value || null)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Seleccionar meta" />
          </SelectTrigger>
          <SelectContent>
            {goals.map((goal) => (
              <SelectItem key={goal.id} value={goal.id}>
                {goal.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
