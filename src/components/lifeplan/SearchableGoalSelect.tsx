'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Plus, Check, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Goal, SourceType } from '@/lib/types/lifeplan';

interface SearchableGoalSelectProps {
  goals: Goal[];
  value: string | null;
  onChange: (value: string | null) => void;
  onNewGoal: () => void;
  placeholder?: string;
  className?: string;
}

const MIN_SEARCH_CHARS = 3;
const THROTTLE_MS = 3000;

const getOriginSuffix = (origin: SourceType): string => {
  switch (origin) {
    case 'ODYSSEY':
      return ' (PV)';
    case 'WHEEL':
      return ' (RV)';
    default:
      return '';
  }
};

export function SearchableGoalSelect({
  goals,
  value,
  onChange,
  onNewGoal,
  placeholder = 'Seleccionar meta',
  className,
}: SearchableGoalSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [throttledSearchTerm, setThrottledSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastThrottleTimeRef = useRef<number>(0);

  // Find selected goal
  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === value),
    [goals, value]
  );

  // Throttle search term updates (3 seconds)
  useEffect(() => {
    if (searchTerm.length < MIN_SEARCH_CHARS) {
      // Reset immediately when below threshold
      setThrottledSearchTerm('');
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      return;
    }

    const now = Date.now();
    const timeSinceLastThrottle = now - lastThrottleTimeRef.current;

    if (timeSinceLastThrottle >= THROTTLE_MS) {
      // Enough time has passed, update immediately
      setThrottledSearchTerm(searchTerm);
      lastThrottleTimeRef.current = now;
    } else {
      // Schedule update for remaining time
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      throttleTimerRef.current = setTimeout(() => {
        setThrottledSearchTerm(searchTerm);
        lastThrottleTimeRef.current = Date.now();
      }, THROTTLE_MS - timeSinceLastThrottle);
    }

    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Filter goals based on throttled search term
  const filteredGoals = useMemo(() => {
    if (throttledSearchTerm.length < MIN_SEARCH_CHARS) {
      return goals;
    }
    const lowerSearch = throttledSearchTerm.toLowerCase();
    return goals.filter((goal) =>
      goal.title.toLowerCase().includes(lowerSearch)
    );
  }, [goals, throttledSearchTerm]);

  // Build display items: "Sin meta" + "Nueva meta" + filtered goals
  const displayItems = useMemo(() => {
    const items: Array<{ type: 'none' | 'new' | 'goal'; goal?: Goal }> = [
      { type: 'none' },
      { type: 'new' },
    ];
    filteredGoals.forEach((goal) => {
      items.push({ type: 'goal', goal });
    });
    return items;
  }, [filteredGoals]);

  // Check if we're in search mode and have no results
  const isSearching = searchTerm.length >= MIN_SEARCH_CHARS;
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
      const items = listRef.current.querySelectorAll('[data-item]');
      const item = items[highlightedIndex] as HTMLElement | undefined;
      if (item && typeof item.scrollIntoView === 'function') {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = useCallback(
    (item: (typeof displayItems)[number]) => {
      if (item.type === 'none') {
        onChange(null);
      } else if (item.type === 'new') {
        onNewGoal();
      } else if (item.goal) {
        onChange(item.goal.id);
      }
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
    },
    [onChange, onNewGoal]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      const maxIndex = hasNoResults ? 1 : displayItems.length - 1;

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
          if (highlightedIndex >= 0 && highlightedIndex < displayItems.length) {
            handleSelect(displayItems[highlightedIndex]);
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
    [isOpen, displayItems, highlightedIndex, handleSelect, hasNoResults]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
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
          {selectedGoal
            ? `${selectedGoal.title}${getOriginSuffix(selectedGoal.origin)}`
            : placeholder}
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
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar meta..."
              className={cn(
                'flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
              )}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="rounded-sm p-0.5 hover:bg-accent"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Helper hint when <3 chars */}
          {searchTerm.length > 0 && searchTerm.length < MIN_SEARCH_CHARS && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Escribe al menos 3 letras para buscar.
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1"
          >
            {/* Sin meta option */}
            <div
              data-item
              role="option"
              aria-selected={value === null}
              onClick={() => handleSelect({ type: 'none' })}
              className={cn(
                'relative flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none',
                'hover:bg-accent hover:text-accent-foreground',
                highlightedIndex === 0 && 'bg-accent text-accent-foreground',
                value === null && 'font-medium'
              )}
            >
              Sin meta
              {value === null && (
                <span className="absolute right-2">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </div>

            {/* Separator */}
            <div className="my-1 h-px bg-border" />

            {/* Nueva meta option */}
            <div
              data-item
              role="option"
              onClick={() => handleSelect({ type: 'new' })}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none',
                'hover:bg-accent hover:text-accent-foreground',
                highlightedIndex === 1 && 'bg-accent text-accent-foreground'
              )}
            >
              <Plus className="h-4 w-4" />
              Nueva meta
            </div>

            {/* Separator */}
            <div className="my-1 h-px bg-border" />

            {/* No results message */}
            {hasNoResults ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No se encontraron metas.
              </div>
            ) : (
              /* Goals list */
              <>
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Metas actuales
                </div>
                {filteredGoals.map((goal, index) => {
                  const itemIndex = index + 2; // Account for "Sin meta" and "Nueva meta"
                  const isSelected = value === goal.id;
                  return (
                    <div
                      key={goal.id}
                      data-item
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect({ type: 'goal', goal })}
                      className={cn(
                        'relative flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none',
                        'hover:bg-accent hover:text-accent-foreground',
                        highlightedIndex === itemIndex &&
                          'bg-accent text-accent-foreground',
                        isSelected && 'font-medium'
                      )}
                    >
                      <span className="truncate">
                        {goal.title}
                        {getOriginSuffix(goal.origin)}
                      </span>
                      {isSelected && (
                        <span className="absolute right-2">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
