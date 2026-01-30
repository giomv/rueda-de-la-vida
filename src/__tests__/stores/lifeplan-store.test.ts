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
        period_key: '2024-01-15',
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
          period_key: '2024-01-15',
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
        period_key: '2024-01-15',
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
          period_key: '2024-01-15',
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

  describe('getCompletionRateForView', () => {
    const createActivityWithCompletion = (
      id: string,
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE',
      completed: boolean,
      periodKey: string,
    ): ActivityWithCompletions => ({
      id,
      user_id: 'user-123',
      title: `${frequency} activity ${id}`,
      notes: null,
      domain_id: null,
      goal_id: null,
      source_type: 'MANUAL',
      source_id: null,
      frequency_type: frequency,
      frequency_value: 1,
      scheduled_days: frequency === 'WEEKLY' ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : null,
      time_of_day: null,
      order_position: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completions: completed ? [{
        id: `c-${id}`,
        activity_id: id,
        date: '2024-01-15',
        period_key: periodKey,
        completed: true,
        completed_at: new Date().toISOString(),
        notes: null,
      }] : [],
    });

    it('should calculate completion rate for day view - ONLY DAILY activities', () => {
      // Day view shows daily + carryovers, but counter should ONLY count DAILY
      useLifePlanStore.getState().setActivities([
        createActivityWithCompletion('daily-1', 'DAILY', true, '2024-01-15'),
        createActivityWithCompletion('daily-2', 'DAILY', false, ''),
        createActivityWithCompletion('weekly-1', 'WEEKLY', false, ''), // Carryover - should NOT be counted
        createActivityWithCompletion('monthly-1', 'MONTHLY', false, ''), // Carryover - should NOT be counted
        createActivityWithCompletion('once-1', 'ONCE', false, ''), // Carryover - should NOT be counted
      ]);

      const viewDate = new Date(2024, 0, 15); // Jan 15, 2024
      const rate = useLifePlanStore.getState().getCompletionRateForView('day', viewDate);

      expect(rate.total).toBe(2); // ONLY 2 daily activities
      expect(rate.completed).toBe(1); // Only daily-1 is completed
      expect(rate.pending).toBe(1);
    });

    it('should calculate completion rate for week view - ONLY WEEKLY activities', () => {
      // Week view shows weekly + carryovers, but counter should ONLY count WEEKLY
      useLifePlanStore.getState().setActivities([
        createActivityWithCompletion('weekly-1', 'WEEKLY', true, '2024-W03'),
        createActivityWithCompletion('weekly-2', 'WEEKLY', false, ''),
        createActivityWithCompletion('monthly-1', 'MONTHLY', false, ''), // Carryover - should NOT be counted
        createActivityWithCompletion('once-1', 'ONCE', false, ''), // Carryover - should NOT be counted
        createActivityWithCompletion('daily-1', 'DAILY', true, '2024-01-15'), // Not shown in week view
      ]);

      const viewDate = new Date(2024, 0, 15); // Jan 15, 2024
      const rate = useLifePlanStore.getState().getCompletionRateForView('week', viewDate);

      expect(rate.total).toBe(2); // ONLY 2 weekly activities
      expect(rate.completed).toBe(1); // Only weekly-1 is completed
      expect(rate.pending).toBe(1);
    });

    it('should calculate completion rate for month view - ONLY MONTHLY activities', () => {
      // Month view shows monthly + carryovers, but counter should ONLY count MONTHLY
      useLifePlanStore.getState().setActivities([
        createActivityWithCompletion('monthly-1', 'MONTHLY', true, '2024-01'),
        createActivityWithCompletion('monthly-2', 'MONTHLY', false, ''),
        createActivityWithCompletion('once-1', 'ONCE', false, ''), // Carryover - should NOT be counted
        createActivityWithCompletion('weekly-1', 'WEEKLY', true, '2024-W03'), // Not shown in month view
      ]);

      const viewDate = new Date(2024, 0, 15);
      const rate = useLifePlanStore.getState().getCompletionRateForView('month', viewDate);

      expect(rate.total).toBe(2); // ONLY 2 monthly activities
      expect(rate.completed).toBe(1); // monthly-1 is completed
      expect(rate.pending).toBe(1);
    });

    it('should calculate completion rate for once view - ONLY ONCE activities', () => {
      useLifePlanStore.getState().setActivities([
        createActivityWithCompletion('once-1', 'ONCE', true, 'ONCE'),
        createActivityWithCompletion('once-2', 'ONCE', false, ''),
        createActivityWithCompletion('once-3', 'ONCE', true, 'ONCE'),
        createActivityWithCompletion('daily-1', 'DAILY', true, '2024-01-15'), // Should not be counted
        createActivityWithCompletion('weekly-1', 'WEEKLY', true, '2024-W03'), // Should not be counted
      ]);

      const viewDate = new Date(2024, 0, 15);
      const rate = useLifePlanStore.getState().getCompletionRateForView('once', viewDate);

      expect(rate.total).toBe(3); // ONLY 3 once activities
      expect(rate.completed).toBe(2); // once-1 and once-3
      expect(rate.pending).toBe(1);
    });

    it('should return zero when no native activities exist (0 native actions edge case)', () => {
      // Day view with no DAILY activities, only carryovers
      useLifePlanStore.getState().setActivities([
        createActivityWithCompletion('weekly-1', 'WEEKLY', false, ''),
        createActivityWithCompletion('monthly-1', 'MONTHLY', false, ''),
        createActivityWithCompletion('once-1', 'ONCE', false, ''),
      ]);

      const viewDate = new Date(2024, 0, 15);
      const rate = useLifePlanStore.getState().getCompletionRateForView('day', viewDate);

      // Should show 0/0 (no DAILY activities)
      expect(rate.total).toBe(0);
      expect(rate.completed).toBe(0);
      expect(rate.pending).toBe(0);
    });

    it('should show 100% green when all native actions completed (carryovers pending)', () => {
      // Day view: all DAILY completed, but carryovers pending
      useLifePlanStore.getState().setActivities([
        createActivityWithCompletion('daily-1', 'DAILY', true, '2024-01-15'),
        createActivityWithCompletion('daily-2', 'DAILY', true, '2024-01-15'),
        createActivityWithCompletion('weekly-1', 'WEEKLY', false, ''), // Carryover pending - should NOT affect counter
        createActivityWithCompletion('once-1', 'ONCE', false, ''), // Carryover pending - should NOT affect counter
      ]);

      const viewDate = new Date(2024, 0, 15);
      const rate = useLifePlanStore.getState().getCompletionRateForView('day', viewDate);

      // All DAILY activities completed = 100% (even with pending carryovers)
      expect(rate.total).toBe(2);
      expect(rate.completed).toBe(2);
      expect(rate.pending).toBe(0);
    });

    it('should return zero for empty activities', () => {
      const viewDate = new Date(2024, 0, 15);
      const rate = useLifePlanStore.getState().getCompletionRateForView('week', viewDate);

      expect(rate.completed).toBe(0);
      expect(rate.total).toBe(0);
      expect(rate.pending).toBe(0);
    });
  });

  describe('getGroupedActivitiesForDate', () => {
    // Create activities with different frequencies for testing ordering
    const createActivity = (
      id: string,
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE',
      timeOfDay: string | null,
      createdAt: string,
    ): ActivityWithCompletions => ({
      id,
      user_id: 'user-123',
      title: `${frequency} activity ${id}`,
      notes: null,
      domain_id: null,
      goal_id: null,
      source_type: 'MANUAL',
      source_id: null,
      frequency_type: frequency,
      frequency_value: 1,
      scheduled_days: frequency === 'WEEKLY' ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : null,
      time_of_day: timeOfDay,
      order_position: 0,
      is_archived: false,
      created_at: createdAt,
      updated_at: createdAt,
      completions: [],
    });

    it('should group activities by frequency in order: DAILY → WEEKLY → MONTHLY → ONCE', () => {
      // Add activities in random order
      useLifePlanStore.getState().setActivities([
        createActivity('once-1', 'ONCE', null, '2024-01-01T10:00:00Z'),
        createActivity('daily-1', 'DAILY', null, '2024-01-01T10:00:00Z'),
        createActivity('monthly-1', 'MONTHLY', null, '2024-01-01T10:00:00Z'),
        createActivity('weekly-1', 'WEEKLY', null, '2024-01-01T10:00:00Z'),
      ]);

      const groups = useLifePlanStore.getState().getGroupedActivitiesForDate('2024-01-15');

      expect(groups).toHaveLength(4);
      expect(groups[0].frequency).toBe('DAILY');
      expect(groups[0].label).toBe('Diarias');
      expect(groups[1].frequency).toBe('WEEKLY');
      expect(groups[1].label).toBe('Semanales');
      expect(groups[2].frequency).toBe('MONTHLY');
      expect(groups[2].label).toBe('Mensuales');
      expect(groups[3].frequency).toBe('ONCE');
      expect(groups[3].label).toBe('Única vez');
    });

    it('should only include non-empty groups', () => {
      useLifePlanStore.getState().setActivities([
        createActivity('daily-1', 'DAILY', null, '2024-01-01T10:00:00Z'),
        createActivity('once-1', 'ONCE', null, '2024-01-01T10:00:00Z'),
      ]);

      const groups = useLifePlanStore.getState().getGroupedActivitiesForDate('2024-01-15');

      expect(groups).toHaveLength(2);
      expect(groups[0].frequency).toBe('DAILY');
      expect(groups[1].frequency).toBe('ONCE');
    });

    it('should sort activities within a group by time_of_day (earliest first)', () => {
      useLifePlanStore.getState().setActivities([
        createActivity('daily-3', 'DAILY', '15:00', '2024-01-01T10:00:00Z'),
        createActivity('daily-1', 'DAILY', '07:00', '2024-01-01T10:00:00Z'),
        createActivity('daily-2', 'DAILY', '12:00', '2024-01-01T10:00:00Z'),
      ]);

      const groups = useLifePlanStore.getState().getGroupedActivitiesForDate('2024-01-15');

      expect(groups).toHaveLength(1);
      expect(groups[0].activities[0].time_of_day).toBe('07:00');
      expect(groups[0].activities[1].time_of_day).toBe('12:00');
      expect(groups[0].activities[2].time_of_day).toBe('15:00');
    });

    it('should sort activities with null time_of_day after those with times', () => {
      useLifePlanStore.getState().setActivities([
        createActivity('daily-1', 'DAILY', null, '2024-01-01T10:00:00Z'),
        createActivity('daily-2', 'DAILY', '08:00', '2024-01-01T12:00:00Z'),
      ]);

      const groups = useLifePlanStore.getState().getGroupedActivitiesForDate('2024-01-15');

      expect(groups[0].activities[0].time_of_day).toBe('08:00');
      expect(groups[0].activities[1].time_of_day).toBeNull();
    });

    it('should sort by created_at (oldest first) when time_of_day is equal', () => {
      useLifePlanStore.getState().setActivities([
        createActivity('daily-2', 'DAILY', '08:00', '2024-01-02T10:00:00Z'),
        createActivity('daily-1', 'DAILY', '08:00', '2024-01-01T10:00:00Z'),
        createActivity('daily-3', 'DAILY', '08:00', '2024-01-03T10:00:00Z'),
      ]);

      const groups = useLifePlanStore.getState().getGroupedActivitiesForDate('2024-01-15');

      expect(groups[0].activities[0].id).toBe('daily-1'); // oldest
      expect(groups[0].activities[1].id).toBe('daily-2');
      expect(groups[0].activities[2].id).toBe('daily-3'); // newest
    });

    it('should return empty array when no activities', () => {
      const groups = useLifePlanStore.getState().getGroupedActivitiesForDate('2024-01-15');
      expect(groups).toHaveLength(0);
    });
  });

  describe('getGroupedActivitiesForView', () => {
    const createActivity = (
      id: string,
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE',
      timeOfDay: string | null,
      createdAt: string,
    ): ActivityWithCompletions => ({
      id,
      user_id: 'user-123',
      title: `${frequency} activity ${id}`,
      notes: null,
      domain_id: null,
      goal_id: null,
      source_type: 'MANUAL',
      source_id: null,
      frequency_type: frequency,
      frequency_value: 1,
      scheduled_days: frequency === 'WEEKLY' ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : null,
      time_of_day: timeOfDay,
      order_position: 0,
      is_archived: false,
      created_at: createdAt,
      updated_at: createdAt,
      completions: [],
    });

    beforeEach(() => {
      // Set up activities with all frequency types
      useLifePlanStore.getState().setActivities([
        createActivity('daily-1', 'DAILY', '08:00', '2024-01-01T10:00:00Z'),
        createActivity('weekly-1', 'WEEKLY', '09:00', '2024-01-01T10:00:00Z'),
        createActivity('monthly-1', 'MONTHLY', '10:00', '2024-01-01T10:00:00Z'),
        createActivity('once-1', 'ONCE', '11:00', '2024-01-01T10:00:00Z'),
      ]);
    });

    it('week view: should show groups in order WEEKLY → MONTHLY → ONCE (no DAILY)', () => {
      const viewDate = new Date('2024-01-15');
      const groups = useLifePlanStore.getState().getGroupedActivitiesForView('week', viewDate);

      // Week view excludes DAILY
      expect(groups).toHaveLength(3);
      expect(groups[0].frequency).toBe('WEEKLY');
      expect(groups[1].frequency).toBe('MONTHLY');
      expect(groups[2].frequency).toBe('ONCE');
    });

    it('month view: should show groups in order MONTHLY → ONCE (no DAILY or WEEKLY)', () => {
      const viewDate = new Date('2024-01-15');
      const groups = useLifePlanStore.getState().getGroupedActivitiesForView('month', viewDate);

      // Month view excludes DAILY and WEEKLY
      expect(groups).toHaveLength(2);
      expect(groups[0].frequency).toBe('MONTHLY');
      expect(groups[1].frequency).toBe('ONCE');
    });

    it('once view: should show only ONCE activities', () => {
      const viewDate = new Date('2024-01-15');
      const groups = useLifePlanStore.getState().getGroupedActivitiesForView('once', viewDate);

      expect(groups).toHaveLength(1);
      expect(groups[0].frequency).toBe('ONCE');
      expect(groups[0].activities).toHaveLength(1);
    });

    it('day view: should show all groups in order DAILY → WEEKLY → MONTHLY → ONCE', () => {
      const viewDate = new Date('2024-01-15'); // Monday
      const groups = useLifePlanStore.getState().getGroupedActivitiesForView('day', viewDate);

      expect(groups).toHaveLength(4);
      expect(groups[0].frequency).toBe('DAILY');
      expect(groups[1].frequency).toBe('WEEKLY');
      expect(groups[2].frequency).toBe('MONTHLY');
      expect(groups[3].frequency).toBe('ONCE');
    });

    it('should maintain within-group sorting in all views', () => {
      // Add more weekly activities to test sorting
      useLifePlanStore.getState().setActivities([
        createActivity('weekly-3', 'WEEKLY', '16:00', '2024-01-01T10:00:00Z'),
        createActivity('weekly-1', 'WEEKLY', '08:00', '2024-01-01T10:00:00Z'),
        createActivity('weekly-2', 'WEEKLY', '12:00', '2024-01-01T10:00:00Z'),
      ]);

      const viewDate = new Date('2024-01-15');
      const groups = useLifePlanStore.getState().getGroupedActivitiesForView('week', viewDate);

      expect(groups[0].activities[0].time_of_day).toBe('08:00');
      expect(groups[0].activities[1].time_of_day).toBe('12:00');
      expect(groups[0].activities[2].time_of_day).toBe('16:00');
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
