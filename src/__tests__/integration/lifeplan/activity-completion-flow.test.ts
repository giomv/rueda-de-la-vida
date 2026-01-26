/**
 * Integration tests for Activity Completion tracking
 * Tests the complete flow of marking activities as complete/incomplete
 */

import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import type { ActivityWithCompletions, ActivityCompletion } from '@/lib/types/lifeplan';

const createMockActivity = (id: string): ActivityWithCompletions => ({
  id,
  user_id: 'user-123',
  title: 'Test Activity',
  notes: null,
  domain_id: null,
  goal_id: null,
  source_type: 'MANUAL',
  source_id: null,
  frequency_type: 'DAILY',
  frequency_value: 1,
  scheduled_days: null,
  time_of_day: null,
  order_position: 0,
  is_archived: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  completions: [],
});

const createMockCompletion = (
  activityId: string,
  date: string,
  completed: boolean
): ActivityCompletion => ({
  id: `completion-${Date.now()}`,
  activity_id: activityId,
  date,
  completed,
  completed_at: completed ? new Date().toISOString() : null,
  notes: null,
});

describe('Activity Completion Flow', () => {
  beforeEach(() => {
    useLifePlanStore.getState().reset();
  });

  describe('Mark Complete', () => {
    it('should add completion when marking activity complete', () => {
      const activity = createMockActivity('activity-1');
      useLifePlanStore.getState().setActivities([activity]);

      const completion = createMockCompletion('activity-1', '2024-01-15', true);
      useLifePlanStore.getState().toggleActivityCompletion('activity-1', '2024-01-15', completion);

      const state = useLifePlanStore.getState();
      expect(state.activities[0].completions).toHaveLength(1);
      expect(state.activities[0].completions[0].completed).toBe(true);
      expect(state.activities[0].completions[0].date).toBe('2024-01-15');
    });

    it('should set completed_at timestamp when marking complete', () => {
      const activity = createMockActivity('activity-1');
      useLifePlanStore.getState().setActivities([activity]);

      const completion = createMockCompletion('activity-1', '2024-01-15', true);
      useLifePlanStore.getState().toggleActivityCompletion('activity-1', '2024-01-15', completion);

      const state = useLifePlanStore.getState();
      expect(state.activities[0].completions[0].completed_at).not.toBeNull();
    });
  });

  describe('Toggle Complete', () => {
    it('should toggle from complete to incomplete', () => {
      const activity: ActivityWithCompletions = {
        ...createMockActivity('activity-1'),
        completions: [createMockCompletion('activity-1', '2024-01-15', true)],
      };
      useLifePlanStore.getState().setActivities([activity]);

      const updatedCompletion = createMockCompletion('activity-1', '2024-01-15', false);
      useLifePlanStore.getState().toggleActivityCompletion('activity-1', '2024-01-15', updatedCompletion);

      const state = useLifePlanStore.getState();
      expect(state.activities[0].completions[0].completed).toBe(false);
    });

    it('should clear completed_at when marking incomplete', () => {
      const activity: ActivityWithCompletions = {
        ...createMockActivity('activity-1'),
        completions: [createMockCompletion('activity-1', '2024-01-15', true)],
      };
      useLifePlanStore.getState().setActivities([activity]);

      const updatedCompletion: ActivityCompletion = {
        ...activity.completions[0],
        completed: false,
        completed_at: null,
      };
      useLifePlanStore.getState().toggleActivityCompletion('activity-1', '2024-01-15', updatedCompletion);

      const state = useLifePlanStore.getState();
      expect(state.activities[0].completions[0].completed_at).toBeNull();
    });
  });

  describe('Completion Rate', () => {
    it('should calculate 0% when no activities completed', () => {
      const activity1 = createMockActivity('activity-1');
      const activity2 = createMockActivity('activity-2');
      useLifePlanStore.getState().setActivities([activity1, activity2]);

      const rate = useLifePlanStore.getState().getCompletionRate('2024-01-15');
      expect(rate.completed).toBe(0);
      expect(rate.total).toBe(2);
    });

    it('should calculate 50% when half completed', () => {
      const activity1: ActivityWithCompletions = {
        ...createMockActivity('activity-1'),
        completions: [createMockCompletion('activity-1', '2024-01-15', true)],
      };
      const activity2 = createMockActivity('activity-2');
      useLifePlanStore.getState().setActivities([activity1, activity2]);

      const rate = useLifePlanStore.getState().getCompletionRate('2024-01-15');
      expect(rate.completed).toBe(1);
      expect(rate.total).toBe(2);
    });

    it('should calculate 100% when all completed', () => {
      const activity1: ActivityWithCompletions = {
        ...createMockActivity('activity-1'),
        completions: [createMockCompletion('activity-1', '2024-01-15', true)],
      };
      const activity2: ActivityWithCompletions = {
        ...createMockActivity('activity-2'),
        completions: [createMockCompletion('activity-2', '2024-01-15', true)],
      };
      useLifePlanStore.getState().setActivities([activity1, activity2]);

      const rate = useLifePlanStore.getState().getCompletionRate('2024-01-15');
      expect(rate.completed).toBe(2);
      expect(rate.total).toBe(2);
    });

    it('should only count completions for the specific date', () => {
      const activity: ActivityWithCompletions = {
        ...createMockActivity('activity-1'),
        completions: [
          createMockCompletion('activity-1', '2024-01-14', true),
          createMockCompletion('activity-1', '2024-01-15', false),
        ],
      };
      useLifePlanStore.getState().setActivities([activity]);

      // Check Jan 14 - should be complete
      const rate14 = useLifePlanStore.getState().getCompletionRate('2024-01-14');
      expect(rate14.completed).toBe(1);

      // Check Jan 15 - should not be complete
      const rate15 = useLifePlanStore.getState().getCompletionRate('2024-01-15');
      expect(rate15.completed).toBe(0);
    });
  });

  describe('Multiple Days', () => {
    it('should track completions across multiple days independently', () => {
      const activity = createMockActivity('activity-1');
      useLifePlanStore.getState().setActivities([activity]);

      // Complete on day 1
      const completion1 = createMockCompletion('activity-1', '2024-01-15', true);
      useLifePlanStore.getState().toggleActivityCompletion('activity-1', '2024-01-15', completion1);

      // Complete on day 2
      const completion2 = createMockCompletion('activity-1', '2024-01-16', true);
      useLifePlanStore.getState().toggleActivityCompletion('activity-1', '2024-01-16', completion2);

      const state = useLifePlanStore.getState();
      expect(state.activities[0].completions).toHaveLength(2);
      expect(state.activities[0].completions.find(c => c.date === '2024-01-15')?.completed).toBe(true);
      expect(state.activities[0].completions.find(c => c.date === '2024-01-16')?.completed).toBe(true);
    });

    it('should allow different completion states on different days', () => {
      const activity = createMockActivity('activity-1');
      useLifePlanStore.getState().setActivities([activity]);

      // Complete on day 1
      const completion1 = createMockCompletion('activity-1', '2024-01-15', true);
      useLifePlanStore.getState().toggleActivityCompletion('activity-1', '2024-01-15', completion1);

      // Not complete on day 2
      const completion2 = createMockCompletion('activity-1', '2024-01-16', false);
      useLifePlanStore.getState().toggleActivityCompletion('activity-1', '2024-01-16', completion2);

      const state = useLifePlanStore.getState();
      expect(state.activities[0].completions.find(c => c.date === '2024-01-15')?.completed).toBe(true);
      expect(state.activities[0].completions.find(c => c.date === '2024-01-16')?.completed).toBe(false);
    });
  });

  describe('ONCE Frequency', () => {
    it('should not show ONCE activity after completion', () => {
      const onceActivity: ActivityWithCompletions = {
        ...createMockActivity('activity-1'),
        frequency_type: 'ONCE',
        completions: [createMockCompletion('activity-1', '2024-01-14', true)],
      };
      useLifePlanStore.getState().setActivities([onceActivity]);

      // Activity was completed on Jan 14, should not show on Jan 15
      const activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(0);
    });

    it('should show ONCE activity if not yet completed', () => {
      const onceActivity: ActivityWithCompletions = {
        ...createMockActivity('activity-1'),
        frequency_type: 'ONCE',
        completions: [],
      };
      useLifePlanStore.getState().setActivities([onceActivity]);

      const activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(1);
    });
  });
});
