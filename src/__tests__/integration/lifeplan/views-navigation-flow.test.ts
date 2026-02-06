/**
 * Integration tests for LifePlan Views Navigation
 * Tests the Hoy/Semana/Mes views and data consistency across views
 */

import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import type { ActivityWithCompletions, ViewMode } from '@/lib/types/lifeplan';

// Helper function to format date in Spanish (same as in hoy/page.tsx)
function formatDateSpanish(date: Date): string {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month}, ${year}`;
}

const createMockActivity = (
  id: string,
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE',
  scheduledDays?: string[]
): ActivityWithCompletions => ({
  id,
  user_id: 'user-123',
  title: `Activity ${id}`,
  notes: null,
  domain_id: null,
  goal_id: null,
  source_type: 'MANUAL',
  source_id: null,
  frequency_type: frequency,
  frequency_value: 1,
  scheduled_days: scheduledDays || null,
  time_of_day: null,
  order_position: 0,
  is_archived: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  completions: [],
});

describe('Views Navigation Flow', () => {
  beforeEach(() => {
    useLifePlanStore.getState().reset();
  });

  describe('View Mode Switching', () => {
    it('should start in day view mode', () => {
      const state = useLifePlanStore.getState();
      expect(state.viewMode).toBe('day');
    });

    it('should switch to week view', () => {
      useLifePlanStore.getState().setViewMode('week');

      expect(useLifePlanStore.getState().viewMode).toBe('week');
    });

    it('should switch to month view', () => {
      useLifePlanStore.getState().setViewMode('month');

      expect(useLifePlanStore.getState().viewMode).toBe('month');
    });

    it('should preserve activities when switching views', () => {
      const activity = createMockActivity('activity-1', 'DAILY');
      useLifePlanStore.getState().setActivities([activity]);

      // Switch through all views
      useLifePlanStore.getState().setViewMode('week');
      expect(useLifePlanStore.getState().activities).toHaveLength(1);

      useLifePlanStore.getState().setViewMode('month');
      expect(useLifePlanStore.getState().activities).toHaveLength(1);

      useLifePlanStore.getState().setViewMode('day');
      expect(useLifePlanStore.getState().activities).toHaveLength(1);
    });
  });

  describe('Date Navigation', () => {
    it('should initialize with current date', () => {
      const state = useLifePlanStore.getState();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const viewDate = new Date(state.viewDate);
      viewDate.setHours(0, 0, 0, 0);

      expect(viewDate.toDateString()).toBe(today.toDateString());
    });

    it('should navigate to specific date', () => {
      const targetDate = new Date('2024-06-15');
      useLifePlanStore.getState().setViewDate(targetDate);

      const state = useLifePlanStore.getState();
      expect(state.viewDate.toDateString()).toBe(targetDate.toDateString());
    });

    it('should preserve view mode when navigating dates', () => {
      useLifePlanStore.getState().setViewMode('week');
      useLifePlanStore.getState().setViewDate(new Date('2024-06-15'));

      expect(useLifePlanStore.getState().viewMode).toBe('week');
    });
  });

  describe('Day View (Hoy)', () => {
    it('should show daily activities', () => {
      const dailyActivity = createMockActivity('daily', 'DAILY');
      useLifePlanStore.getState().setActivities([dailyActivity]);
      useLifePlanStore.getState().setViewMode('day');

      const activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(1);
    });

    it('should show weekly activities on scheduled days', () => {
      // L = Monday
      const weeklyActivity = createMockActivity('weekly', 'WEEKLY', ['L', 'X', 'V']);
      useLifePlanStore.getState().setActivities([weeklyActivity]);
      useLifePlanStore.getState().setViewMode('day');

      // 2024-01-15 is Monday (L)
      const mondayActivities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(mondayActivities).toHaveLength(1);

      // 2024-01-16 is Tuesday (M) - not scheduled
      const tuesdayActivities = useLifePlanStore.getState().getActivitiesForDate('2024-01-16');
      expect(tuesdayActivities).toHaveLength(0);
    });

    it('should show all non-archived activities for the day', () => {
      const activity1 = createMockActivity('a1', 'DAILY');
      const activity2 = createMockActivity('a2', 'DAILY');
      const archivedActivity = { ...createMockActivity('a3', 'DAILY'), is_archived: true };

      useLifePlanStore.getState().setActivities([activity1, activity2, archivedActivity]);

      const activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(2);
    });
  });

  describe('Week View (Semana)', () => {
    it('should show activities for all 7 days of the week', () => {
      const dailyActivity = createMockActivity('daily', 'DAILY');
      useLifePlanStore.getState().setActivities([dailyActivity]);
      useLifePlanStore.getState().setViewMode('week');

      // Check each day of the week (Mon Jan 15 - Sun Jan 21, 2024)
      for (let day = 15; day <= 21; day++) {
        const activities = useLifePlanStore.getState().getActivitiesForDate(`2024-01-${day}`);
        expect(activities).toHaveLength(1);
      }
    });

    it('should correctly show weekly activities on their scheduled days', () => {
      const weeklyMWF = createMockActivity('weekly', 'WEEKLY', ['L', 'X', 'V']);
      useLifePlanStore.getState().setActivities([weeklyMWF]);
      useLifePlanStore.getState().setViewMode('week');

      // Monday (L) - should show
      expect(useLifePlanStore.getState().getActivitiesForDate('2024-01-15')).toHaveLength(1);
      // Tuesday (M) - should not show
      expect(useLifePlanStore.getState().getActivitiesForDate('2024-01-16')).toHaveLength(0);
      // Wednesday (X) - should show
      expect(useLifePlanStore.getState().getActivitiesForDate('2024-01-17')).toHaveLength(1);
      // Thursday (J) - should not show
      expect(useLifePlanStore.getState().getActivitiesForDate('2024-01-18')).toHaveLength(0);
      // Friday (V) - should show
      expect(useLifePlanStore.getState().getActivitiesForDate('2024-01-19')).toHaveLength(1);
    });
  });

  describe('Month View (Mes)', () => {
    it('should show monthly activities on Mondays', () => {
      const monthlyActivity = createMockActivity('monthly', 'MONTHLY');
      useLifePlanStore.getState().setActivities([monthlyActivity]);
      useLifePlanStore.getState().setViewMode('month');

      // Monday Jan 15
      expect(useLifePlanStore.getState().getActivitiesForDate('2024-01-15')).toHaveLength(1);
      // Tuesday Jan 16
      expect(useLifePlanStore.getState().getActivitiesForDate('2024-01-16')).toHaveLength(0);
      // Monday Jan 22
      expect(useLifePlanStore.getState().getActivitiesForDate('2024-01-22')).toHaveLength(1);
    });
  });

  describe('Data Consistency Across Views', () => {
    it('should maintain completion data when switching views', () => {
      const activity: ActivityWithCompletions = {
        ...createMockActivity('a1', 'DAILY'),
        completions: [{
          id: 'c1',
          activity_id: 'a1',
          date: '2024-01-15',
          completed: true,
          completed_at: new Date().toISOString(),
          notes: null,
        }],
      };

      useLifePlanStore.getState().setActivities([activity]);

      // Check in day view
      useLifePlanStore.getState().setViewMode('day');
      let rate = useLifePlanStore.getState().getCompletionRate('2024-01-15');
      expect(rate.completed).toBe(1);

      // Check in week view
      useLifePlanStore.getState().setViewMode('week');
      rate = useLifePlanStore.getState().getCompletionRate('2024-01-15');
      expect(rate.completed).toBe(1);

      // Check in month view
      useLifePlanStore.getState().setViewMode('month');
      rate = useLifePlanStore.getState().getCompletionRate('2024-01-15');
      expect(rate.completed).toBe(1);
    });

    it('should maintain filter settings when switching views', () => {
      useLifePlanStore.getState().setFilter('domain');
      useLifePlanStore.getState().setSelectedDomainId('domain-1');

      useLifePlanStore.getState().setViewMode('week');
      expect(useLifePlanStore.getState().filter).toBe('domain');
      expect(useLifePlanStore.getState().selectedDomainId).toBe('domain-1');

      useLifePlanStore.getState().setViewMode('month');
      expect(useLifePlanStore.getState().filter).toBe('domain');
      expect(useLifePlanStore.getState().selectedDomainId).toBe('domain-1');
    });
  });

  describe('Filter Persistence', () => {
    it('should apply filter across all views', () => {
      const healthActivity = { ...createMockActivity('health', 'DAILY'), domain_id: 'domain-health' };
      const workActivity = { ...createMockActivity('work', 'DAILY'), domain_id: 'domain-work' };

      useLifePlanStore.getState().setActivities([healthActivity, workActivity]);
      useLifePlanStore.getState().setFilter('domain');
      useLifePlanStore.getState().setSelectedDomainId('domain-health');

      // Day view
      useLifePlanStore.getState().setViewMode('day');
      expect(useLifePlanStore.getState().getActivitiesForDate('2024-01-15')).toHaveLength(1);

      // Week view
      useLifePlanStore.getState().setViewMode('week');
      expect(useLifePlanStore.getState().getActivitiesForDate('2024-01-15')).toHaveLength(1);

      // Month view
      useLifePlanStore.getState().setViewMode('month');
      expect(useLifePlanStore.getState().getActivitiesForDate('2024-01-15')).toHaveLength(1);
    });
  });

  describe('Hoy Tab Date Display', () => {
    it('should format date in Spanish correctly', () => {
      // Test various dates
      expect(formatDateSpanish(new Date(2026, 1, 2))).toBe('2 de febrero, 2026');
      expect(formatDateSpanish(new Date(2024, 0, 15))).toBe('15 de enero, 2024');
      expect(formatDateSpanish(new Date(2024, 11, 25))).toBe('25 de diciembre, 2024');
    });

    it('should navigate to previous day correctly', () => {
      const initialDate = new Date(2024, 5, 15); // June 15, 2024
      useLifePlanStore.getState().setViewDate(initialDate);

      // Simulate goToPreviousDay
      const prev = new Date(useLifePlanStore.getState().viewDate);
      prev.setDate(prev.getDate() - 1);
      useLifePlanStore.getState().setViewDate(prev);

      const newDate = useLifePlanStore.getState().viewDate;
      expect(newDate.getDate()).toBe(14);
      expect(newDate.getMonth()).toBe(5); // June
    });

    it('should navigate to next day correctly', () => {
      const initialDate = new Date(2024, 5, 15); // June 15, 2024
      useLifePlanStore.getState().setViewDate(initialDate);

      // Simulate goToNextDay
      const next = new Date(useLifePlanStore.getState().viewDate);
      next.setDate(next.getDate() + 1);
      useLifePlanStore.getState().setViewDate(next);

      const newDate = useLifePlanStore.getState().viewDate;
      expect(newDate.getDate()).toBe(16);
      expect(newDate.getMonth()).toBe(5); // June
    });

    it('should preserve filters when navigating days', () => {
      // Set up filter
      useLifePlanStore.getState().setFilter('domain');
      useLifePlanStore.getState().setSelectedDomainId('domain-1');

      // Navigate to a different day
      const newDate = new Date(2024, 5, 20);
      useLifePlanStore.getState().setViewDate(newDate);

      // Verify filters are preserved
      expect(useLifePlanStore.getState().filter).toBe('domain');
      expect(useLifePlanStore.getState().selectedDomainId).toBe('domain-1');
    });

    it('should update activities list when navigating days', () => {
      const dailyActivity = createMockActivity('daily', 'DAILY');
      useLifePlanStore.getState().setActivities([dailyActivity]);
      useLifePlanStore.getState().setViewMode('day');

      // Check activities for two different dates
      const date1Activities = useLifePlanStore.getState().getActivitiesForDate('2024-06-15');
      const date2Activities = useLifePlanStore.getState().getActivitiesForDate('2024-06-16');

      // Daily activities should appear on both days
      expect(date1Activities).toHaveLength(1);
      expect(date2Activities).toHaveLength(1);
    });
  });

  describe('View-Specific Date Navigation', () => {
    it('should only show date navigation in day view (Hoy tab)', () => {
      // This test documents the expected behavior:
      // - Day view (Hoy): shows date navigation with arrows
      // - Week view (Semana): no date navigation
      // - Month view (Mes): no date navigation
      // - Once view (1 vez): no date navigation

      // The viewDate state is shared, but navigation UI is only shown in day view
      useLifePlanStore.getState().setViewMode('day');
      expect(useLifePlanStore.getState().viewMode).toBe('day');

      // Changing view mode shouldn't change the viewDate
      const currentDate = useLifePlanStore.getState().viewDate;

      useLifePlanStore.getState().setViewMode('week');
      expect(useLifePlanStore.getState().viewDate).toBe(currentDate);

      useLifePlanStore.getState().setViewMode('month');
      expect(useLifePlanStore.getState().viewDate).toBe(currentDate);

      useLifePlanStore.getState().setViewMode('once');
      expect(useLifePlanStore.getState().viewDate).toBe(currentDate);
    });
  });
});
