/**
 * Integration tests for LifePlan Views Navigation
 * Tests the Hoy/Semana/Mes views and data consistency across views
 */

import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import type { ActivityWithCompletions, ViewMode } from '@/lib/types/lifeplan';

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
});
