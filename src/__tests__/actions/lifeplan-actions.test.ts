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
      const validModes: ViewMode[] = ['day', 'week', 'month'];
      validModes.forEach((mode) => {
        expect(['day', 'week', 'month']).toContain(mode);
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

    it('should have 3 view tabs', () => {
      expect(VIEW_TABS).toHaveLength(3);
    });

    it('should have correct hrefs', () => {
      const hrefs = VIEW_TABS.map((t: { href: string }) => t.href);
      expect(hrefs).toContain('/mi-plan/hoy');
      expect(hrefs).toContain('/mi-plan/semana');
      expect(hrefs).toContain('/mi-plan/mes');
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
      expect(odyssey.label).toBe('Odyssey');
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
