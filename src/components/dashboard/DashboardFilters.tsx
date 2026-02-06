'use client';

import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MONTH_NAMES } from '@/lib/types/finances';
import { SearchableGoalFilter } from './SearchableGoalFilter';
import type { GoalWithYear } from '@/lib/types/dashboard';

interface DashboardFiltersProps {
  className?: string;
}

export function DashboardFilters({ className }: DashboardFiltersProps) {
  const store = useDashboardStore();
  const { year, month, domainId, goalId, domains, goals } = store;

  const hasFilters = domainId || goalId;

  const handlePrevMonth = () => {
    if (month === 1) {
      store.setYear(year - 1);
      store.setMonth(12);
    } else {
      store.setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      store.setYear(year + 1);
      store.setMonth(1);
    } else {
      store.setMonth(month + 1);
    }
  };

  const handleDomainChange = (value: string) => {
    if (value === 'all') {
      store.setDomainId(null);
      store.setGoalId(null);
    } else {
      store.setDomainId(value);
      // Clear goal if it doesn't belong to new domain
      if (goalId) {
        const goal = goals.find(g => g.id === goalId);
        if (goal && goal.domain_id !== value) {
          store.setGoalId(null);
        }
      }
    }
  };

  const handleGoalChange = (goalId: string | null) => {
    store.setGoalId(goalId);
  };

  const handleGoalSelected = (goal: GoalWithYear) => {
    // Auto-select domain if goal has one
    if (goal.domain_id && goal.domain_id !== domainId) {
      store.setDomainId(goal.domain_id);
    }
  };

  const filteredGoals = domainId
    ? goals.filter(g => g.domain_id === domainId)
    : goals;

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Month navigation */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePrevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-sm font-medium min-w-[120px] text-center">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Domain filter */}
      <Select value={domainId || 'all'} onValueChange={handleDomainChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos los dominios" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los dominios</SelectItem>
          {domains.map((domain) => (
            <SelectItem key={domain.id} value={domain.id}>
              {domain.icon && <span className="mr-2">{domain.icon}</span>}
              {domain.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Goal filter - searchable */}
      <SearchableGoalFilter
        goals={filteredGoals}
        value={goalId}
        onChange={handleGoalChange}
        onGoalSelected={handleGoalSelected}
        disabled={filteredGoals.length === 0}
      />

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-muted-foreground"
          onClick={() => store.clearFilters()}
        >
          <X className="h-4 w-4 mr-1" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
