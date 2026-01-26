import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import type { ActivityWithCompletions, Goal, ActivityCompletion } from '@/lib/types/lifeplan';
import type { LifeDomain } from '@/lib/types';

describe('lifeplan-store', () => {
  beforeEach(() => {
    // Reset the store before each test
    useLifePlanStore.getState().reset();
  });

  describe('activities state', () => {
    const mockActivity: ActivityWithCompletions = {
      id: 'activity-1',
      user_id: 'user-123',
      title: 'Meditar 10 minutos',
      notes: 'Por la mañana',
      domain_id: 'domain-1',
      goal_id: null,
      source_type: 'MANUAL',
      source_id: null,
      frequency_type: 'DAILY',
      frequency_value: 1,
      scheduled_days: null,
      time_of_day: '07:00',
      order_position: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completions: [],
    };

    it('should initialize with empty activities', () => {
      const state = useLifePlanStore.getState();
      expect(state.activities).toEqual([]);
    });

    it('should set activities', () => {
      useLifePlanStore.getState().setActivities([mockActivity]);

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(1);
      expect(state.activities[0].title).toBe('Meditar 10 minutos');
    });

    it('should add activity', () => {
      const newActivity = { ...mockActivity, id: 'activity-new', completions: undefined };
      useLifePlanStore.getState().addActivity(newActivity as any);

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(1);
      expect(state.activities[0].completions).toEqual([]);
      expect(state.isDirty).toBe(true);
    });

    it('should update activity', () => {
      useLifePlanStore.getState().setActivities([mockActivity]);
      useLifePlanStore.getState().updateActivity('activity-1', { title: 'Meditar 15 minutos' });

      const state = useLifePlanStore.getState();
      expect(state.activities[0].title).toBe('Meditar 15 minutos');
      expect(state.isDirty).toBe(true);
    });

    it('should remove activity', () => {
      useLifePlanStore.getState().setActivities([mockActivity]);
      useLifePlanStore.getState().removeActivity('activity-1');

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(0);
      expect(state.isDirty).toBe(true);
    });

    it('should toggle activity completion - add new', () => {
      useLifePlanStore.getState().setActivities([mockActivity]);

      const completion: ActivityCompletion = {
        id: 'completion-1',
        activity_id: 'activity-1',
        date: '2024-01-15',
        completed: true,
        completed_at: new Date().toISOString(),
        notes: null,
      };

      useLifePlanStore.getState().toggleActivityCompletion('activity-1', '2024-01-15', completion);

      const state = useLifePlanStore.getState();
      expect(state.activities[0].completions).toHaveLength(1);
      expect(state.activities[0].completions[0].completed).toBe(true);
    });

    it('should toggle activity completion - update existing', () => {
      const activityWithCompletion: ActivityWithCompletions = {
        ...mockActivity,
        completions: [{
          id: 'completion-1',
          activity_id: 'activity-1',
          date: '2024-01-15',
          completed: true,
          completed_at: new Date().toISOString(),
          notes: null,
        }],
      };

      useLifePlanStore.getState().setActivities([activityWithCompletion]);

      const updatedCompletion: ActivityCompletion = {
        id: 'completion-1',
        activity_id: 'activity-1',
        date: '2024-01-15',
        completed: false,
        completed_at: null,
        notes: null,
      };

      useLifePlanStore.getState().toggleActivityCompletion('activity-1', '2024-01-15', updatedCompletion);

      const state = useLifePlanStore.getState();
      expect(state.activities[0].completions[0].completed).toBe(false);
    });
  });

  describe('goals state', () => {
    const mockGoal: Goal = {
      id: 'goal-1',
      user_id: 'user-123',
      domain_id: 'domain-1',
      title: 'Mejorar condición física',
      metric: 'Correr 5km',
      target_date: '2024-06-01',
      origin: 'MANUAL',
      source_wheel_id: null,
      source_odyssey_id: null,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should initialize with empty goals', () => {
      const state = useLifePlanStore.getState();
      expect(state.goals).toEqual([]);
    });

    it('should set goals', () => {
      useLifePlanStore.getState().setGoals([mockGoal]);

      const state = useLifePlanStore.getState();
      expect(state.goals).toHaveLength(1);
      expect(state.goals[0].title).toBe('Mejorar condición física');
    });

    it('should add goal', () => {
      useLifePlanStore.getState().addGoal(mockGoal);

      const state = useLifePlanStore.getState();
      expect(state.goals).toHaveLength(1);
      expect(state.isDirty).toBe(true);
    });

    it('should update goal', () => {
      useLifePlanStore.getState().setGoals([mockGoal]);
      useLifePlanStore.getState().updateGoal('goal-1', { title: 'Correr maratón' });

      const state = useLifePlanStore.getState();
      expect(state.goals[0].title).toBe('Correr maratón');
    });

    it('should remove goal', () => {
      useLifePlanStore.getState().setGoals([mockGoal]);
      useLifePlanStore.getState().removeGoal('goal-1');

      const state = useLifePlanStore.getState();
      expect(state.goals).toHaveLength(0);
    });
  });

  describe('view state', () => {
    it('should set view date', () => {
      const newDate = new Date('2024-06-15');
      useLifePlanStore.getState().setViewDate(newDate);

      const state = useLifePlanStore.getState();
      expect(state.viewDate.toISOString()).toBe(newDate.toISOString());
    });

    it('should set view mode', () => {
      useLifePlanStore.getState().setViewMode('week');

      const state = useLifePlanStore.getState();
      expect(state.viewMode).toBe('week');
    });

    it('should set filter', () => {
      useLifePlanStore.getState().setFilter('domain');

      const state = useLifePlanStore.getState();
      expect(state.filter).toBe('domain');
    });

    it('should set selected domain id', () => {
      useLifePlanStore.getState().setSelectedDomainId('domain-123');

      const state = useLifePlanStore.getState();
      expect(state.selectedDomainId).toBe('domain-123');
    });

    it('should set selected goal id', () => {
      useLifePlanStore.getState().setSelectedGoalId('goal-123');

      const state = useLifePlanStore.getState();
      expect(state.selectedGoalId).toBe('goal-123');
    });
  });

  describe('getActivitiesForDate', () => {
    const mockDailyActivity: ActivityWithCompletions = {
      id: 'activity-daily',
      user_id: 'user-123',
      title: 'Daily activity',
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
    };

    const mockWeeklyActivity: ActivityWithCompletions = {
      id: 'activity-weekly',
      user_id: 'user-123',
      title: 'Weekly activity',
      notes: null,
      domain_id: null,
      goal_id: null,
      source_type: 'MANUAL',
      source_id: null,
      frequency_type: 'WEEKLY',
      frequency_value: 1,
      scheduled_days: ['L', 'X', 'V'], // Monday, Wednesday, Friday
      time_of_day: null,
      order_position: 1,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completions: [],
    };

    it('should return daily activities for any date', () => {
      useLifePlanStore.getState().setActivities([mockDailyActivity]);

      const activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(1);
      expect(activities[0].title).toBe('Daily activity');
    });

    it('should return weekly activities on scheduled days', () => {
      useLifePlanStore.getState().setActivities([mockWeeklyActivity]);

      // Monday (2024-01-15 is a Monday)
      const mondayActivities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(mondayActivities).toHaveLength(1);

      // Tuesday (2024-01-16 is a Tuesday - not scheduled)
      const tuesdayActivities = useLifePlanStore.getState().getActivitiesForDate('2024-01-16');
      expect(tuesdayActivities).toHaveLength(0);
    });

    it('should not return archived activities', () => {
      const archivedActivity = { ...mockDailyActivity, is_archived: true };
      useLifePlanStore.getState().setActivities([archivedActivity]);

      const activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(0);
    });

    it('should filter by domain when filter is set', () => {
      const activityWithDomain = { ...mockDailyActivity, domain_id: 'domain-1' };
      const activityWithoutDomain = { ...mockDailyActivity, id: 'activity-2', domain_id: null };

      useLifePlanStore.getState().setActivities([activityWithDomain, activityWithoutDomain]);
      useLifePlanStore.getState().setFilter('domain');
      useLifePlanStore.getState().setSelectedDomainId('domain-1');

      const activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(1);
      expect(activities[0].domain_id).toBe('domain-1');
    });
  });

  describe('getCompletionRate', () => {
    it('should calculate completion rate correctly', () => {
      const activity1: ActivityWithCompletions = {
        id: 'activity-1',
        user_id: 'user-123',
        title: 'Activity 1',
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
        completions: [{
          id: 'c1',
          activity_id: 'activity-1',
          date: '2024-01-15',
          completed: true,
          completed_at: new Date().toISOString(),
          notes: null,
        }],
      };

      const activity2: ActivityWithCompletions = {
        ...activity1,
        id: 'activity-2',
        title: 'Activity 2',
        completions: [],
      };

      useLifePlanStore.getState().setActivities([activity1, activity2]);

      const rate = useLifePlanStore.getState().getCompletionRate('2024-01-15');
      expect(rate.completed).toBe(1);
      expect(rate.total).toBe(2);
    });

    it('should return zero for empty activities', () => {
      const rate = useLifePlanStore.getState().getCompletionRate('2024-01-15');
      expect(rate.completed).toBe(0);
      expect(rate.total).toBe(0);
    });
  });

  describe('hydrate and reset', () => {
    it('should hydrate store with data', () => {
      const mockGoal: Goal = {
        id: 'goal-1',
        user_id: 'user-123',
        domain_id: null,
        title: 'Test goal',
        metric: null,
        target_date: null,
        origin: 'MANUAL',
        source_wheel_id: null,
        source_odyssey_id: null,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      useLifePlanStore.getState().hydrate({
        goals: [mockGoal],
        viewMode: 'week',
      });

      const state = useLifePlanStore.getState();
      expect(state.goals).toHaveLength(1);
      expect(state.viewMode).toBe('week');
      expect(state.isDirty).toBe(false);
    });

    it('should reset store to initial state', () => {
      useLifePlanStore.getState().setViewMode('month');
      useLifePlanStore.getState().setFilter('goal');

      useLifePlanStore.getState().reset();

      const state = useLifePlanStore.getState();
      expect(state.viewMode).toBe('day');
      expect(state.filter).toBe('all');
      expect(state.activities).toEqual([]);
    });
  });
});
