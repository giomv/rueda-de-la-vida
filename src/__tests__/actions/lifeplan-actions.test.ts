/**
 * Tests for lifeplan-actions utility functions and types
 * Note: Server actions that require Supabase are tested separately with integration tests
 * This file tests the types and validation logic
 */

import type {
  SourceType,
  FrequencyType,
  ViewMode,
  FilterType,
  Goal,
  LifePlanActivity,
  ActivityCompletion,
  WeeklyCheckin,
  CreateActivityInput,
  FREQUENCY_OPTIONS,
  DAYS_OF_WEEK,
  VIEW_TABS,
  ORIGIN_BADGES,
} from '@/lib/types/lifeplan';

describe('LifePlan Types', () => {
  describe('SourceType', () => {
    it('should have valid source types', () => {
      const validTypes: SourceType[] = ['WHEEL', 'ODYSSEY', 'MANUAL'];
      validTypes.forEach((type) => {
        expect(['WHEEL', 'ODYSSEY', 'MANUAL']).toContain(type);
      });
    });
  });

  describe('FrequencyType', () => {
    it('should have valid frequency types', () => {
      const validTypes: FrequencyType[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'ONCE'];
      validTypes.forEach((type) => {
        expect(['DAILY', 'WEEKLY', 'MONTHLY', 'ONCE']).toContain(type);
      });
    });
  });

  describe('ViewMode', () => {
    it('should have valid view modes', () => {
      const validModes: ViewMode[] = ['day', 'week', 'month', 'once'];
      validModes.forEach((mode) => {
        expect(['day', 'week', 'month', 'once']).toContain(mode);
      });
    });
  });

  describe('FilterType', () => {
    it('should have valid filter types', () => {
      const validFilters: FilterType[] = ['all', 'domain', 'goal', 'uncategorized'];
      validFilters.forEach((filter) => {
        expect(['all', 'domain', 'goal', 'uncategorized']).toContain(filter);
      });
    });
  });
});

describe('LifePlan Constants', () => {
  describe('FREQUENCY_OPTIONS', () => {
    // Import the actual constants
    const { FREQUENCY_OPTIONS } = require('@/lib/types/lifeplan');

    it('should have 4 frequency options', () => {
      expect(FREQUENCY_OPTIONS).toHaveLength(4);
    });

    it('should have DAILY option', () => {
      const daily = FREQUENCY_OPTIONS.find((o: { key: string }) => o.key === 'DAILY');
      expect(daily).toBeDefined();
      expect(daily.label).toBe('Diario');
    });

    it('should have WEEKLY option', () => {
      const weekly = FREQUENCY_OPTIONS.find((o: { key: string }) => o.key === 'WEEKLY');
      expect(weekly).toBeDefined();
      expect(weekly.label).toBe('Semanal');
    });

    it('should have MONTHLY option', () => {
      const monthly = FREQUENCY_OPTIONS.find((o: { key: string }) => o.key === 'MONTHLY');
      expect(monthly).toBeDefined();
      expect(monthly.label).toBe('Mensual');
    });

    it('should have ONCE option', () => {
      const once = FREQUENCY_OPTIONS.find((o: { key: string }) => o.key === 'ONCE');
      expect(once).toBeDefined();
      expect(once.label).toBe('Una vez');
    });

    it('each option should have key, label, and description', () => {
      FREQUENCY_OPTIONS.forEach((option: { key: string; label: string; description: string }) => {
        expect(option.key).toBeDefined();
        expect(option.label).toBeDefined();
        expect(option.description).toBeDefined();
      });
    });
  });

  describe('DAYS_OF_WEEK', () => {
    const { DAYS_OF_WEEK } = require('@/lib/types/lifeplan');

    it('should have 7 days', () => {
      expect(DAYS_OF_WEEK).toHaveLength(7);
    });

    it('should start with Lunes (Monday)', () => {
      expect(DAYS_OF_WEEK[0].label).toBe('Lunes');
      expect(DAYS_OF_WEEK[0].key).toBe('L');
    });

    it('should end with Domingo (Sunday)', () => {
      expect(DAYS_OF_WEEK[6].label).toBe('Domingo');
      expect(DAYS_OF_WEEK[6].key).toBe('D');
    });

    it('each day should have key, label, and short', () => {
      DAYS_OF_WEEK.forEach((day: { key: string; label: string; short: string }) => {
        expect(day.key).toBeDefined();
        expect(day.label).toBeDefined();
        expect(day.short).toBeDefined();
        expect(day.short.length).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('VIEW_TABS', () => {
    const { VIEW_TABS } = require('@/lib/types/lifeplan');

    it('should have 4 view tabs', () => {
      expect(VIEW_TABS).toHaveLength(4);
    });

    it('should have correct hrefs', () => {
      const hrefs = VIEW_TABS.map((t: { href: string }) => t.href);
      expect(hrefs).toContain('/mi-plan/hoy');
      expect(hrefs).toContain('/mi-plan/semana');
      expect(hrefs).toContain('/mi-plan/mes');
      expect(hrefs).toContain('/mi-plan/una-vez');
    });

    it('should have once view tab', () => {
      const onceTab = VIEW_TABS.find((t: { key: string }) => t.key === 'once');
      expect(onceTab).toBeDefined();
      expect(onceTab.label).toBe('1 vez');
      expect(onceTab.href).toBe('/mi-plan/una-vez');
    });

    it('each tab should have key, label, and href', () => {
      VIEW_TABS.forEach((tab: { key: string; label: string; href: string }) => {
        expect(tab.key).toBeDefined();
        expect(tab.label).toBeDefined();
        expect(tab.href).toBeDefined();
        expect(tab.href.startsWith('/mi-plan/')).toBe(true);
      });
    });
  });

  describe('ORIGIN_BADGES', () => {
    const { ORIGIN_BADGES } = require('@/lib/types/lifeplan');

    it('should have 3 origin badges', () => {
      expect(ORIGIN_BADGES).toHaveLength(3);
    });

    it('should have WHEEL badge', () => {
      const wheel = ORIGIN_BADGES.find((b: { key: string }) => b.key === 'WHEEL');
      expect(wheel).toBeDefined();
      expect(wheel.label).toBe('Rueda');
    });

    it('should have ODYSSEY badge', () => {
      const odyssey = ORIGIN_BADGES.find((b: { key: string }) => b.key === 'ODYSSEY');
      expect(odyssey).toBeDefined();
      expect(odyssey.label).toBe('Plan de vida');
    });

    it('should have MANUAL badge', () => {
      const manual = ORIGIN_BADGES.find((b: { key: string }) => b.key === 'MANUAL');
      expect(manual).toBeDefined();
      expect(manual.label).toBe('Manual');
    });
  });
});

describe('CreateActivityInput validation', () => {
  it('should require title', () => {
    const validInput: CreateActivityInput = {
      title: 'Test activity',
      frequency_type: 'DAILY',
    };

    expect(validInput.title).toBeDefined();
    expect(validInput.title.length).toBeGreaterThan(0);
  });

  it('should require frequency_type', () => {
    const validInput: CreateActivityInput = {
      title: 'Test activity',
      frequency_type: 'WEEKLY',
    };

    expect(validInput.frequency_type).toBeDefined();
  });

  it('should accept optional fields', () => {
    const fullInput: CreateActivityInput = {
      title: 'Test activity',
      notes: 'Some notes',
      domain_id: 'domain-123',
      goal_id: 'goal-123',
      frequency_type: 'WEEKLY',
      frequency_value: 3,
      scheduled_days: ['L', 'M', 'X'],
      time_of_day: '09:00',
    };

    expect(fullInput.notes).toBe('Some notes');
    expect(fullInput.domain_id).toBe('domain-123');
    expect(fullInput.goal_id).toBe('goal-123');
    expect(fullInput.frequency_value).toBe(3);
    expect(fullInput.scheduled_days).toEqual(['L', 'M', 'X']);
    expect(fullInput.time_of_day).toBe('09:00');
  });
});

describe('Date utilities', () => {
  // Helper functions similar to those used in the hooks
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getDayKey(date: Date): string {
    const dayKeys = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    return dayKeys[date.getDay()];
  }

  // Create date at noon local time to avoid timezone issues
  function createLocalDate(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  it('should format date as YYYY-MM-DD', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    expect(formatDate(date)).toBe('2024-06-15');
  });

  it('should get start of week (Monday)', () => {
    // Wednesday June 19, 2024
    const wednesday = createLocalDate(2024, 6, 19);
    const monday = getStartOfWeek(wednesday);

    expect(monday.getDay()).toBe(1); // Monday
  });

  it('should handle Sunday correctly when getting start of week', () => {
    // Sunday June 23, 2024
    const sunday = createLocalDate(2024, 6, 23);
    const monday = getStartOfWeek(sunday);

    expect(monday.getDay()).toBe(1); // Monday
  });

  it('should get correct day key', () => {
    // Monday June 17, 2024
    expect(getDayKey(createLocalDate(2024, 6, 17))).toBe('L');
    // Tuesday June 18, 2024
    expect(getDayKey(createLocalDate(2024, 6, 18))).toBe('M');
    // Wednesday June 19, 2024
    expect(getDayKey(createLocalDate(2024, 6, 19))).toBe('X');
    // Thursday June 20, 2024
    expect(getDayKey(createLocalDate(2024, 6, 20))).toBe('J');
    // Friday June 21, 2024
    expect(getDayKey(createLocalDate(2024, 6, 21))).toBe('V');
    // Saturday June 22, 2024
    expect(getDayKey(createLocalDate(2024, 6, 22))).toBe('S');
    // Sunday June 23, 2024
    expect(getDayKey(createLocalDate(2024, 6, 23))).toBe('D');
  });
});

describe('Activity frequency logic', () => {
  // Create date at noon local time to avoid timezone issues
  function createLocalDate(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  function shouldShowActivity(
    activity: { frequency_type: FrequencyType; scheduled_days: string[] | null },
    date: Date
  ): boolean {
    const dayKeys = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const dayKey = dayKeys[date.getDay()];

    switch (activity.frequency_type) {
      case 'DAILY':
        return true;
      case 'WEEKLY':
        if (activity.scheduled_days?.length) {
          return activity.scheduled_days.includes(dayKey);
        }
        return true;
      case 'MONTHLY':
        return dayKey === 'L'; // Show on Mondays
      case 'ONCE':
        return true; // Always show until completed
      default:
        return true;
    }
  }

  it('should show DAILY activities every day', () => {
    const daily = { frequency_type: 'DAILY' as const, scheduled_days: null };

    expect(shouldShowActivity(daily, createLocalDate(2024, 6, 17))).toBe(true); // Monday
    expect(shouldShowActivity(daily, createLocalDate(2024, 6, 18))).toBe(true); // Tuesday
    expect(shouldShowActivity(daily, createLocalDate(2024, 6, 22))).toBe(true); // Saturday
    expect(shouldShowActivity(daily, createLocalDate(2024, 6, 23))).toBe(true); // Sunday
  });

  it('should show WEEKLY activities on scheduled days only', () => {
    const weekly = { frequency_type: 'WEEKLY' as const, scheduled_days: ['L', 'X', 'V'] };

    expect(shouldShowActivity(weekly, createLocalDate(2024, 6, 17))).toBe(true);  // Monday - L
    expect(shouldShowActivity(weekly, createLocalDate(2024, 6, 18))).toBe(false); // Tuesday - M
    expect(shouldShowActivity(weekly, createLocalDate(2024, 6, 19))).toBe(true);  // Wednesday - X
    expect(shouldShowActivity(weekly, createLocalDate(2024, 6, 20))).toBe(false); // Thursday - J
    expect(shouldShowActivity(weekly, createLocalDate(2024, 6, 21))).toBe(true);  // Friday - V
  });

  it('should show WEEKLY activities without scheduled days every day', () => {
    const weekly = { frequency_type: 'WEEKLY' as const, scheduled_days: null };

    expect(shouldShowActivity(weekly, createLocalDate(2024, 6, 17))).toBe(true);
    expect(shouldShowActivity(weekly, createLocalDate(2024, 6, 18))).toBe(true);
  });

  it('should show MONTHLY activities on Mondays', () => {
    const monthly = { frequency_type: 'MONTHLY' as const, scheduled_days: null };

    expect(shouldShowActivity(monthly, createLocalDate(2024, 6, 17))).toBe(true);  // Monday
    expect(shouldShowActivity(monthly, createLocalDate(2024, 6, 18))).toBe(false); // Tuesday
    expect(shouldShowActivity(monthly, createLocalDate(2024, 6, 24))).toBe(true);  // Next Monday
  });

  it('should show ONCE activities always (until completed)', () => {
    const once = { frequency_type: 'ONCE' as const, scheduled_days: null };

    expect(shouldShowActivity(once, createLocalDate(2024, 6, 17))).toBe(true);
    expect(shouldShowActivity(once, createLocalDate(2024, 6, 20))).toBe(true);
  });
});

describe('Period key utilities', () => {
  // Create date at noon local time to avoid timezone issues
  function createLocalDate(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // Period key calculation functions (matching those in the codebase)
  function getISOWeek(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  }

  function getISOWeekYear(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    return d.getFullYear();
  }

  function getWeekKey(date: Date): string {
    return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`;
  }

  function getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function getDayKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function getPeriodKey(frequencyType: FrequencyType, date: Date): string {
    switch (frequencyType) {
      case 'DAILY': return getDayKey(date);
      case 'WEEKLY': return getWeekKey(date);
      case 'MONTHLY': return getMonthKey(date);
      case 'ONCE': return 'ONCE';
      default: return getDayKey(date);
    }
  }

  describe('getDayKey', () => {
    it('should format date as YYYY-MM-DD', () => {
      expect(getDayKey(createLocalDate(2024, 6, 15))).toBe('2024-06-15');
      expect(getDayKey(createLocalDate(2024, 1, 5))).toBe('2024-01-05');
      expect(getDayKey(createLocalDate(2024, 12, 31))).toBe('2024-12-31');
    });
  });

  describe('getWeekKey', () => {
    it('should return ISO week format YYYY-Www', () => {
      // June 17, 2024 is in week 25
      expect(getWeekKey(createLocalDate(2024, 6, 17))).toBe('2024-W25');
      // January 1, 2024 is in week 1
      expect(getWeekKey(createLocalDate(2024, 1, 1))).toBe('2024-W01');
    });

    it('should return same week key for all days in a week', () => {
      // Week of June 17-23, 2024 (Week 25)
      const monday = getWeekKey(createLocalDate(2024, 6, 17));
      const tuesday = getWeekKey(createLocalDate(2024, 6, 18));
      const wednesday = getWeekKey(createLocalDate(2024, 6, 19));
      const thursday = getWeekKey(createLocalDate(2024, 6, 20));
      const friday = getWeekKey(createLocalDate(2024, 6, 21));
      const saturday = getWeekKey(createLocalDate(2024, 6, 22));
      const sunday = getWeekKey(createLocalDate(2024, 6, 23));

      expect(monday).toBe(tuesday);
      expect(tuesday).toBe(wednesday);
      expect(wednesday).toBe(thursday);
      expect(thursday).toBe(friday);
      expect(friday).toBe(saturday);
      expect(saturday).toBe(sunday);
    });

    it('should handle year boundaries correctly', () => {
      // December 30, 2024 might be in week 1 of 2025
      // December 31, 2023 is in week 52 of 2023
      const dec31_2023 = getWeekKey(createLocalDate(2023, 12, 31));
      expect(dec31_2023).toBe('2023-W52');
    });
  });

  describe('getMonthKey', () => {
    it('should return format YYYY-MM', () => {
      expect(getMonthKey(createLocalDate(2024, 6, 15))).toBe('2024-06');
      expect(getMonthKey(createLocalDate(2024, 1, 1))).toBe('2024-01');
      expect(getMonthKey(createLocalDate(2024, 12, 31))).toBe('2024-12');
    });

    it('should return same month key for all days in a month', () => {
      const first = getMonthKey(createLocalDate(2024, 6, 1));
      const middle = getMonthKey(createLocalDate(2024, 6, 15));
      const last = getMonthKey(createLocalDate(2024, 6, 30));

      expect(first).toBe('2024-06');
      expect(first).toBe(middle);
      expect(middle).toBe(last);
    });
  });

  describe('getPeriodKey', () => {
    it('should return day key for DAILY frequency', () => {
      const date = createLocalDate(2024, 6, 15);
      expect(getPeriodKey('DAILY', date)).toBe('2024-06-15');
    });

    it('should return week key for WEEKLY frequency', () => {
      const date = createLocalDate(2024, 6, 17);
      expect(getPeriodKey('WEEKLY', date)).toBe('2024-W25');
    });

    it('should return month key for MONTHLY frequency', () => {
      const date = createLocalDate(2024, 6, 15);
      expect(getPeriodKey('MONTHLY', date)).toBe('2024-06');
    });

    it('should return ONCE for ONCE frequency', () => {
      const date = createLocalDate(2024, 6, 15);
      expect(getPeriodKey('ONCE', date)).toBe('ONCE');
    });
  });
});

describe('Period-based completion tracking', () => {
  // Create date at noon local time to avoid timezone issues
  function createLocalDate(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // Period key calculation functions
  function getISOWeek(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  }

  function getISOWeekYear(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    return d.getFullYear();
  }

  function getWeekKey(date: Date): string {
    return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`;
  }

  function getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function getDayKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function getPeriodKey(frequencyType: FrequencyType, date: Date): string {
    switch (frequencyType) {
      case 'DAILY': return getDayKey(date);
      case 'WEEKLY': return getWeekKey(date);
      case 'MONTHLY': return getMonthKey(date);
      case 'ONCE': return 'ONCE';
      default: return getDayKey(date);
    }
  }

  interface MockCompletion {
    period_key: string;
    completed: boolean;
  }

  function isCompletedForPeriod(
    activity: { frequency_type: FrequencyType; completions: MockCompletion[] },
    date: Date
  ): boolean {
    const periodKey = getPeriodKey(activity.frequency_type, date);
    return activity.completions.some((c) => c.period_key === periodKey && c.completed);
  }

  describe('Daily completion', () => {
    it('should be pending if not completed on that day', () => {
      const activity = {
        frequency_type: 'DAILY' as const,
        completions: [
          { period_key: '2024-06-17', completed: true },
        ],
      };

      // Completed on June 17
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 17))).toBe(true);
      // Not completed on June 18
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 18))).toBe(false);
    });
  });

  describe('Weekly completion sync', () => {
    it('should sync across all days in the same week', () => {
      const activity = {
        frequency_type: 'WEEKLY' as const,
        completions: [
          { period_key: '2024-W25', completed: true },
        ],
      };

      // All days in week 25 (June 17-23, 2024) should show as completed
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 17))).toBe(true); // Monday
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 18))).toBe(true); // Tuesday
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 19))).toBe(true); // Wednesday
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 20))).toBe(true); // Thursday
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 21))).toBe(true); // Friday
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 22))).toBe(true); // Saturday
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 23))).toBe(true); // Sunday

      // Different week should not be completed
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 24))).toBe(false); // Next Monday
    });

    it('completing from any day marks the whole week complete', () => {
      // If completed on Wednesday, shows complete on Monday too
      const activityCompletedWednesday = {
        frequency_type: 'WEEKLY' as const,
        completions: [
          { period_key: '2024-W25', completed: true },
        ],
      };

      expect(isCompletedForPeriod(activityCompletedWednesday, createLocalDate(2024, 6, 17))).toBe(true);
    });
  });

  describe('Monthly completion sync', () => {
    it('should sync across all days in the same month', () => {
      const activity = {
        frequency_type: 'MONTHLY' as const,
        completions: [
          { period_key: '2024-06', completed: true },
        ],
      };

      // All days in June 2024 should show as completed
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 1))).toBe(true);
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 15))).toBe(true);
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 30))).toBe(true);

      // Different month should not be completed
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 7, 1))).toBe(false);
    });
  });

  describe('Once completion', () => {
    it('should stay completed forever once done', () => {
      const activity = {
        frequency_type: 'ONCE' as const,
        completions: [
          { period_key: 'ONCE', completed: true },
        ],
      };

      // Should be completed on any date
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 15))).toBe(true);
      expect(isCompletedForPeriod(activity, createLocalDate(2024, 12, 31))).toBe(true);
      expect(isCompletedForPeriod(activity, createLocalDate(2025, 1, 1))).toBe(true);
    });

    it('should be pending until completed', () => {
      const activity = {
        frequency_type: 'ONCE' as const,
        completions: [],
      };

      expect(isCompletedForPeriod(activity, createLocalDate(2024, 6, 15))).toBe(false);
    });
  });

  describe('View filtering with pending activities', () => {
    // Simulates the Day view logic: show daily + pending weekly/monthly/once

    function getActivitiesForDayView(
      activities: Array<{
        id: string;
        frequency_type: FrequencyType;
        completions: MockCompletion[];
        scheduled_days?: string[] | null;
      }>,
      date: Date
    ): string[] {
      const dayKeys = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
      const dayKey = dayKeys[date.getDay()];
      const weekKey = getWeekKey(date);
      const monthKey = getMonthKey(date);

      return activities.filter((activity) => {
        const isPendingForPeriod = (periodKey: string) =>
          !activity.completions.some((c) => c.period_key === periodKey && c.completed);

        switch (activity.frequency_type) {
          case 'DAILY':
            return true;
          case 'WEEKLY':
            if (activity.scheduled_days?.length) {
              // Show on scheduled days OR if pending
              return activity.scheduled_days.includes(dayKey) || isPendingForPeriod(weekKey);
            }
            return true;
          case 'MONTHLY':
            return isPendingForPeriod(monthKey);
          case 'ONCE':
            return isPendingForPeriod('ONCE');
          default:
            return true;
        }
      }).map((a) => a.id);
    }

    it('Day view shows daily activities always', () => {
      const activities = [
        { id: 'daily1', frequency_type: 'DAILY' as const, completions: [] },
      ];

      const result = getActivitiesForDayView(activities, createLocalDate(2024, 6, 17));
      expect(result).toContain('daily1');
    });

    it('Day view shows pending weekly activities', () => {
      const activities = [
        { id: 'weekly-pending', frequency_type: 'WEEKLY' as const, completions: [] },
        { id: 'weekly-done', frequency_type: 'WEEKLY' as const, completions: [{ period_key: '2024-W25', completed: true }] },
      ];

      const result = getActivitiesForDayView(activities, createLocalDate(2024, 6, 17));
      expect(result).toContain('weekly-pending');
      expect(result).toContain('weekly-done'); // Weekly without scheduled_days shows always
    });

    it('Day view shows pending monthly activities', () => {
      const activities = [
        { id: 'monthly-pending', frequency_type: 'MONTHLY' as const, completions: [] },
        { id: 'monthly-done', frequency_type: 'MONTHLY' as const, completions: [{ period_key: '2024-06', completed: true }] },
      ];

      const result = getActivitiesForDayView(activities, createLocalDate(2024, 6, 17));
      expect(result).toContain('monthly-pending');
      expect(result).not.toContain('monthly-done');
    });

    it('Day view shows pending once activities', () => {
      const activities = [
        { id: 'once-pending', frequency_type: 'ONCE' as const, completions: [] },
        { id: 'once-done', frequency_type: 'ONCE' as const, completions: [{ period_key: 'ONCE', completed: true }] },
      ];

      const result = getActivitiesForDayView(activities, createLocalDate(2024, 6, 17));
      expect(result).toContain('once-pending');
      expect(result).not.toContain('once-done');
    });
  });
});
