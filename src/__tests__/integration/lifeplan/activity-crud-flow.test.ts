/**
 * Integration tests for LifePlan Activity CRUD operations
 * These tests verify the complete flow of creating, reading, updating, and deleting activities
 * Note: These tests mock Supabase interactions
 */

import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import type { LifePlanActivity, ActivityWithCompletions, CreateActivityInput } from '@/lib/types/lifeplan';

// Mock data
const mockUser = { id: 'user-123' };

const createMockActivity = (overrides: Partial<LifePlanActivity> = {}): ActivityWithCompletions => ({
  id: `activity-${Date.now()}`,
  user_id: mockUser.id,
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
  ...overrides,
});

describe('Activity CRUD Flow', () => {
  beforeEach(() => {
    useLifePlanStore.getState().reset();
  });

  describe('Create Activity', () => {
    it('should create a basic activity with required fields', () => {
      const input: CreateActivityInput = {
        title: 'Meditar 10 minutos',
        frequency_type: 'DAILY',
      };

      const activity = createMockActivity({
        title: input.title,
        frequency_type: input.frequency_type,
      });

      useLifePlanStore.getState().addActivity(activity);

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(1);
      expect(state.activities[0].title).toBe('Meditar 10 minutos');
      expect(state.activities[0].frequency_type).toBe('DAILY');
    });

    it('should create activity with all optional fields', () => {
      const activity = createMockActivity({
        title: 'Ejercicio semanal',
        notes: 'Correr en el parque',
        domain_id: 'domain-health',
        goal_id: 'goal-fitness',
        frequency_type: 'WEEKLY',
        frequency_value: 3,
        scheduled_days: ['L', 'X', 'V'],
        time_of_day: '07:00',
      });

      useLifePlanStore.getState().addActivity(activity);

      const state = useLifePlanStore.getState();
      expect(state.activities[0].notes).toBe('Correr en el parque');
      expect(state.activities[0].domain_id).toBe('domain-health');
      expect(state.activities[0].goal_id).toBe('goal-fitness');
      expect(state.activities[0].frequency_value).toBe(3);
      expect(state.activities[0].scheduled_days).toEqual(['L', 'X', 'V']);
      expect(state.activities[0].time_of_day).toBe('07:00');
    });

    it('should initialize with empty completions', () => {
      const activity = createMockActivity();
      useLifePlanStore.getState().addActivity(activity);

      const state = useLifePlanStore.getState();
      expect(state.activities[0].completions).toEqual([]);
    });

    it('should mark store as dirty after create', () => {
      const activity = createMockActivity();
      useLifePlanStore.getState().addActivity(activity);

      expect(useLifePlanStore.getState().isDirty).toBe(true);
    });
  });

  describe('Read Activities', () => {
    it('should get activities for a specific date (DAILY)', () => {
      const dailyActivity = createMockActivity({
        id: 'activity-daily',
        frequency_type: 'DAILY',
      });

      useLifePlanStore.getState().setActivities([dailyActivity]);

      const activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(1);
    });

    it('should get activities for a specific date (WEEKLY with scheduled days)', () => {
      // Monday = L
      const weeklyActivity = createMockActivity({
        id: 'activity-weekly',
        frequency_type: 'WEEKLY',
        scheduled_days: ['L', 'X', 'V'],
      });

      useLifePlanStore.getState().setActivities([weeklyActivity]);

      // 2024-01-15 is a Monday
      const mondayActivities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(mondayActivities).toHaveLength(1);

      // 2024-01-16 is a Tuesday - not scheduled
      const tuesdayActivities = useLifePlanStore.getState().getActivitiesForDate('2024-01-16');
      expect(tuesdayActivities).toHaveLength(0);
    });

    it('should not return archived activities', () => {
      const archivedActivity = createMockActivity({
        is_archived: true,
      });

      useLifePlanStore.getState().setActivities([archivedActivity]);

      const activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(0);
    });

    it('should filter activities by domain', () => {
      const healthActivity = createMockActivity({
        id: 'activity-health',
        domain_id: 'domain-health',
      });
      const workActivity = createMockActivity({
        id: 'activity-work',
        domain_id: 'domain-work',
      });

      useLifePlanStore.getState().setActivities([healthActivity, workActivity]);
      useLifePlanStore.getState().setFilter('domain');
      useLifePlanStore.getState().setSelectedDomainId('domain-health');

      const activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(1);
      expect(activities[0].id).toBe('activity-health');
    });

    it('should filter activities by goal', () => {
      const goalActivity = createMockActivity({
        id: 'activity-with-goal',
        goal_id: 'goal-fitness',
      });
      const noGoalActivity = createMockActivity({
        id: 'activity-no-goal',
        goal_id: null,
      });

      useLifePlanStore.getState().setActivities([goalActivity, noGoalActivity]);
      useLifePlanStore.getState().setFilter('goal');
      useLifePlanStore.getState().setSelectedGoalId('goal-fitness');

      const activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(1);
      expect(activities[0].id).toBe('activity-with-goal');
    });

    it('should filter uncategorized activities', () => {
      const categorizedActivity = createMockActivity({
        id: 'activity-categorized',
        domain_id: 'domain-health',
      });
      const uncategorizedActivity = createMockActivity({
        id: 'activity-uncategorized',
        domain_id: null,
        goal_id: null,
      });

      useLifePlanStore.getState().setActivities([categorizedActivity, uncategorizedActivity]);
      useLifePlanStore.getState().setFilter('uncategorized');

      const activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(1);
      expect(activities[0].id).toBe('activity-uncategorized');
    });
  });

  describe('Update Activity', () => {
    it('should update activity title', () => {
      const activity = createMockActivity({ id: 'activity-1', title: 'Original Title' });
      useLifePlanStore.getState().setActivities([activity]);

      useLifePlanStore.getState().updateActivity('activity-1', { title: 'Updated Title' });

      const state = useLifePlanStore.getState();
      expect(state.activities[0].title).toBe('Updated Title');
    });

    it('should update activity frequency', () => {
      const activity = createMockActivity({
        id: 'activity-1',
        frequency_type: 'DAILY',
        scheduled_days: null,
      });
      useLifePlanStore.getState().setActivities([activity]);

      useLifePlanStore.getState().updateActivity('activity-1', {
        frequency_type: 'WEEKLY',
        scheduled_days: ['L', 'V'],
      });

      const state = useLifePlanStore.getState();
      expect(state.activities[0].frequency_type).toBe('WEEKLY');
      expect(state.activities[0].scheduled_days).toEqual(['L', 'V']);
    });

    it('should update activity domain and goal', () => {
      const activity = createMockActivity({
        id: 'activity-1',
        domain_id: null,
        goal_id: null,
      });
      useLifePlanStore.getState().setActivities([activity]);

      useLifePlanStore.getState().updateActivity('activity-1', {
        domain_id: 'domain-health',
        goal_id: 'goal-fitness',
      });

      const state = useLifePlanStore.getState();
      expect(state.activities[0].domain_id).toBe('domain-health');
      expect(state.activities[0].goal_id).toBe('goal-fitness');
    });

    it('should mark store as dirty after update', () => {
      const activity = createMockActivity({ id: 'activity-1' });
      useLifePlanStore.getState().setActivities([activity]);
      useLifePlanStore.getState().markClean();

      useLifePlanStore.getState().updateActivity('activity-1', { title: 'New Title' });

      expect(useLifePlanStore.getState().isDirty).toBe(true);
    });
  });

  describe('Archive Activity', () => {
    it('should archive activity (soft delete)', () => {
      const activity = createMockActivity({ id: 'activity-1', is_archived: false });
      useLifePlanStore.getState().setActivities([activity]);

      useLifePlanStore.getState().updateActivity('activity-1', { is_archived: true });

      const state = useLifePlanStore.getState();
      expect(state.activities[0].is_archived).toBe(true);
    });

    it('should not show archived activities in getActivitiesForDate', () => {
      const activity = createMockActivity({ id: 'activity-1', is_archived: false });
      useLifePlanStore.getState().setActivities([activity]);

      // Before archiving
      let activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(1);

      // After archiving
      useLifePlanStore.getState().updateActivity('activity-1', { is_archived: true });
      activities = useLifePlanStore.getState().getActivitiesForDate('2024-01-15');
      expect(activities).toHaveLength(0);
    });
  });

  describe('Delete Activity', () => {
    it('should remove activity from store', () => {
      const activity = createMockActivity({ id: 'activity-1' });
      useLifePlanStore.getState().setActivities([activity]);

      expect(useLifePlanStore.getState().activities).toHaveLength(1);

      useLifePlanStore.getState().removeActivity('activity-1');

      expect(useLifePlanStore.getState().activities).toHaveLength(0);
    });

    it('should mark store as dirty after delete', () => {
      const activity = createMockActivity({ id: 'activity-1' });
      useLifePlanStore.getState().setActivities([activity]);
      useLifePlanStore.getState().markClean();

      useLifePlanStore.getState().removeActivity('activity-1');

      expect(useLifePlanStore.getState().isDirty).toBe(true);
    });
  });
});
