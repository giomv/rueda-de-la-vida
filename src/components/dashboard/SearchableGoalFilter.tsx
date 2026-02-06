'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GoalWithYear } from '@/lib/types/dashboard';

interface SearchableGoalFilterProps {
  goals: GoalWithYear[];
  value: string | null;
  onChange: (goalId: string | null) => void;
  onGoalSelected?: (goal: GoalWithYear) => void;
  disabled?: boolean;
  className?: string;
}

// Group goals by year for display
interface GoalGroup {
  yearIndex: number | null;
  label: string;
  goals: GoalWithYear[];
}

export function SearchableGoalFilter({
  goals,
  value,
  onChange,
  onGoalSelected,
  disabled = false,
  className,
}: SearchableGoalFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Find selected goal
  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === value),
    [goals, value]
  );

  // Filter goals based on search term (immediate, case-insensitive, substring)
  const filteredGoals = useMemo(() => {
    if (!searchTerm.trim()) {
      return goals;
    }
    const lowerSearch = searchTerm.toLowerCase().trim();
    return goals.filter((goal) =>
      goal.title.toLowerCase().includes(lowerSearch)
    );
  }, [goals, searchTerm]);

  // Group filtered goals by year
  const groupedGoals = useMemo(() => {
    const groups: GoalGroup[] = [];
    const yearMap = new Map<number | null, GoalWithYear[]>();

    // Group goals by yearIndex
    filteredGoals.forEach((goal) => {
      const key = goal.yearIndex;
      if (!yearMap.has(key)) {
        yearMap.set(key, []);
      }
      yearMap.get(key)!.push(goal);
    });

    // Convert to array and sort by year (nulls last)
    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => {
      if (a === null && b === null) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    });

    sortedYears.forEach((yearIndex) => {
      const yearGoals = yearMap.get(yearIndex)!;
      const label = yearIndex !== null ? `Año ${yearIndex}` : 'Sin año asignado';
      groups.push({ yearIndex, label, goals: yearGoals });
    });

    return groups;
  }, [filteredGoals]);

  // Build flat list of navigable items for keyboard navigation
  // Items: "Todas las metas" + (header, goal, goal, header, goal, ...)
  type DisplayItem =
    | { type: 'all' }
    | { type: 'header'; label: string; yearIndex: number | null }
    | { type: 'goal'; goal: GoalWithYear };

  const displayItems = useMemo(() => {
    const items: DisplayItem[] = [{ type: 'all' }];

    groupedGoals.forEach((group) => {
      // Add header for each group
      items.push({ type: 'header', label: group.label, yearIndex: group.yearIndex });
      // Add goals in the group
      group.goals.forEach((goal) => {
        items.push({ type: 'goal', goal });
      });
    });

    return items;
  }, [groupedGoals]);

  // Get selectable items only (for keyboard navigation)
  const selectableItems = useMemo(() => {
    return displayItems.filter((item): item is { type: 'all' } | { type: 'goal'; goal: GoalWithYear } =>
      item.type === 'all' || item.type === 'goal'
    );
  }, [displayItems]);

  // Check if we're searching and have no results
  const isSearching = searchTerm.trim().length > 0;
  const hasNoResults = isSearching && filteredGoals.length === 0;

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-selectable]');
      const item = items[highlightedIndex] as HTMLElement | undefined;
      if (item && typeof item.scrollIntoView === 'function') {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSearchChange = useCallback((newValue: string) => {
    setSearchTerm(newValue);
    setHighlightedIndex(-1); // Reset highlighted index when search changes
  }, []);

  const handleSelect = useCallback(
    (item: { type: 'all' } | { type: 'goal'; goal: GoalWithYear }) => {
      if (item.type === 'all') {
        onChange(null);
      } else if (item.goal) {
        onChange(item.goal.id);
        onGoalSelected?.(item.goal);
      }
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
    },
    [onChange, onGoalSelected]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (!disabled) {
            setIsOpen(true);
          }
        }
        return;
      }

      // When no results, only "Todas las metas" is navigable
      const maxIndex = hasNoResults ? 0 : selectableItems.length - 1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < maxIndex ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : maxIndex
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < selectableItems.length) {
            handleSelect(selectableItems[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
        case 'Tab':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, selectableItems, highlightedIndex, handleSelect, hasNoResults, disabled]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
    },
    [onChange]
  );

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Build a map of goal id to selectable index for highlighting
  const goalToSelectableIndex = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 1; // Start at 1 since "Todas las metas" is 0
    groupedGoals.forEach((group) => {
      group.goals.forEach((goal) => {
        map.set(goal.id, idx++);
      });
    });
    return map;
  }, [groupedGoals]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'flex w-[180px] items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-input/30 dark:hover:bg-input/50',
          'h-9'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            'truncate',
            !selectedGoal && 'text-muted-foreground'
          )}
        >
          {selectedGoal ? selectedGoal.title : 'Todas las metas'}
        </span>
        <div className="flex items-center gap-1">
          {selectedGoal && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e as unknown as React.MouseEvent);
                }
              }}
              aria-label="Limpiar selección"
              className="rounded-sm p-0.5 hover:bg-accent cursor-pointer"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 opacity-50 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 border-b p-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar meta…"
              className={cn(
                'flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
              )}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="rounded-sm p-0.5 hover:bg-accent"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1"
          >
            {/* "Todas las metas" option */}
            <div
              data-selectable
              role="option"
              aria-selected={value === null}
              onClick={() => handleSelect({ type: 'all' })}
              className={cn(
                'relative flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none',
                'hover:bg-accent hover:text-accent-foreground',
                highlightedIndex === 0 && 'bg-accent text-accent-foreground',
                value === null && 'font-medium'
              )}
            >
              Todas las metas
              {value === null && (
                <span className="absolute right-2">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </div>

            {/* Separator */}
            {(groupedGoals.length > 0 || hasNoResults) && (
              <div className="my-1 h-px bg-border" />
            )}

            {/* No results message */}
            {hasNoResults ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No se encontraron metas.
              </div>
            ) : (
              /* Goals list grouped by year */
              groupedGoals.map((group) => (
                <div key={group.yearIndex ?? 'no-year'}>
                  {/* Year header */}
                  <div
                    data-item
                    className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {group.label}
                  </div>
                  {/* Goals in this year */}
                  {group.goals.map((goal) => {
                    const selectableIdx = goalToSelectableIndex.get(goal.id) ?? -1;
                    const isSelected = value === goal.id;
                    return (
                      <div
                        key={goal.id}
                        data-selectable
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect({ type: 'goal', goal })}
                        className={cn(
                          'relative flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-4 text-sm outline-none',
                          'hover:bg-accent hover:text-accent-foreground',
                          highlightedIndex === selectableIdx &&
                            'bg-accent text-accent-foreground',
                          isSelected && 'font-medium'
                        )}
                      >
                        <span className="truncate">{goal.title}</span>
                        {isSelected && (
                          <span className="absolute right-2">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
