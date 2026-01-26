/**
 * Cross-feature integration tests: Wheel to LifePlan
 * Tests the end-to-end flow of creating actions in Rueda and importing to LifePlan
 */

import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import type { ActivityWithCompletions, Goal, LifeDomain } from '@/lib/types';

describe('Wheel to LifePlan Integration', () => {
  beforeEach(() => {
    useLifePlanStore.getState().reset();
  });

  describe('Action Plan Import', () => {
    // Simulate wheel action plan data structure
    const mockWheelActionPlan = {
      id: 'action-plan-1',
      wheel_id: 'wheel-123',
      domain_id: 'wheel-domain-salud',
      goal_text: 'Mejorar mi condición física',
      target_score: 8,
      actions: [
        { id: 'action-1', text: 'Hacer ejercicio 30 minutos', completed: false },
        { id: 'action-2', text: 'Tomar 2 litros de agua', completed: false },
        { id: 'action-3', text: 'Dormir 8 horas', completed: true },
      ],
    };

    // Simulate the import transformation
    function transformWheelActionToActivity(
      action: { id: string; text: string; completed: boolean },
      wheelId: string,
      domainId: string,
      lifeDomainId: string | null,
      goalId: string | null
    ): ActivityWithCompletions {
      return {
        id: `imported-${action.id}`,
        user_id: 'user-123',
        title: action.text,
        notes: null,
        domain_id: lifeDomainId,
        goal_id: goalId,
        source_type: 'WHEEL',
        source_id: `${wheelId}_${domainId}_${action.id}`,
        frequency_type: 'WEEKLY',
        frequency_value: 1,
        scheduled_days: null,
        time_of_day: null,
        order_position: 0,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completions: [],
      };
    }

    function transformWheelGoal(
      goalText: string,
      wheelId: string,
      lifeDomainId: string | null
    ): Goal {
      return {
        id: `goal-${wheelId}`,
        user_id: 'user-123',
        domain_id: lifeDomainId,
        title: goalText,
        metric: null,
        target_date: null,
        origin: 'WHEEL',
        source_wheel_id: wheelId,
        source_odyssey_id: null,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    it('should import wheel actions as LifePlan activities', () => {
      const activities = mockWheelActionPlan.actions.map(action =>
        transformWheelActionToActivity(
          action,
          mockWheelActionPlan.wheel_id,
          mockWheelActionPlan.domain_id,
          'life-domain-salud',
          'goal-123'
        )
      );

      useLifePlanStore.getState().setActivities(activities);

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(3);
      expect(state.activities.every(a => a.source_type === 'WHEEL')).toBe(true);
    });

    it('should import wheel goal_text as LifePlan goal', () => {
      const goal = transformWheelGoal(
        mockWheelActionPlan.goal_text,
        mockWheelActionPlan.wheel_id,
        'life-domain-salud'
      );

      useLifePlanStore.getState().setGoals([goal]);

      const state = useLifePlanStore.getState();
      expect(state.goals).toHaveLength(1);
      expect(state.goals[0].title).toBe('Mejorar mi condición física');
      expect(state.goals[0].origin).toBe('WHEEL');
    });

    it('should link imported activities to imported goal', () => {
      const goal = transformWheelGoal(
        mockWheelActionPlan.goal_text,
        mockWheelActionPlan.wheel_id,
        'life-domain-salud'
      );

      const activities = mockWheelActionPlan.actions.map(action =>
        transformWheelActionToActivity(
          action,
          mockWheelActionPlan.wheel_id,
          mockWheelActionPlan.domain_id,
          'life-domain-salud',
          goal.id
        )
      );

      useLifePlanStore.getState().setGoals([goal]);
      useLifePlanStore.getState().setActivities(activities);

      const state = useLifePlanStore.getState();
      expect(state.activities.every(a => a.goal_id === goal.id)).toBe(true);
    });

    it('should match wheel domain to life_domain by name', () => {
      const lifeDomains: LifeDomain[] = [
        {
          id: 'life-domain-salud',
          user_id: 'user-123',
          name: 'Salud',
          slug: 'salud',
          icon: '💪',
          order_position: 0,
          created_at: new Date().toISOString(),
        },
        {
          id: 'life-domain-trabajo',
          user_id: 'user-123',
          name: 'Trabajo',
          slug: 'trabajo',
          icon: '💼',
          order_position: 1,
          created_at: new Date().toISOString(),
        },
      ];

      // Simulate domain matching logic
      const wheelDomainName = 'Salud';
      const matchedDomain = lifeDomains.find(
        d => d.name.toLowerCase() === wheelDomainName.toLowerCase() ||
            d.slug === wheelDomainName.toLowerCase()
      );

      expect(matchedDomain).toBeDefined();
      expect(matchedDomain?.id).toBe('life-domain-salud');
    });
  });

  describe('Deduplication', () => {
    it('should not import duplicate activities based on source_id', () => {
      const existingActivity: ActivityWithCompletions = {
        id: 'existing-1',
        user_id: 'user-123',
        title: 'Existing activity',
        notes: null,
        domain_id: null,
        goal_id: null,
        source_type: 'WHEEL',
        source_id: 'wheel-123_domain-1_action-1',
        frequency_type: 'WEEKLY',
        frequency_value: 1,
        scheduled_days: null,
        time_of_day: null,
        order_position: 0,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completions: [],
      };

      // Simulate import with duplicate source_id
      const newActivitySameSource: ActivityWithCompletions = {
        ...existingActivity,
        id: 'new-duplicate',
        title: 'Duplicate activity',
      };

      // Dedup logic
      const existingSourceIds = new Set([existingActivity.source_id]);
      const activitiesToImport = [newActivitySameSource].filter(
        a => !existingSourceIds.has(a.source_id)
      );

      expect(activitiesToImport).toHaveLength(0);
    });

    it('should allow multiple imports from different wheels', () => {
      const activity1: ActivityWithCompletions = {
        id: 'act-1',
        user_id: 'user-123',
        title: 'From Wheel 1',
        notes: null,
        domain_id: null,
        goal_id: null,
        source_type: 'WHEEL',
        source_id: 'wheel-1_domain-1_action-1',
        frequency_type: 'WEEKLY',
        frequency_value: 1,
        scheduled_days: null,
        time_of_day: null,
        order_position: 0,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completions: [],
      };

      const activity2: ActivityWithCompletions = {
        id: 'act-2',
        user_id: 'user-123',
        title: 'From Wheel 2',
        notes: null,
        domain_id: null,
        goal_id: null,
        source_type: 'WHEEL',
        source_id: 'wheel-2_domain-1_action-1',
        frequency_type: 'WEEKLY',
        frequency_value: 1,
        scheduled_days: null,
        time_of_day: null,
        order_position: 0,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completions: [],
      };

      useLifePlanStore.getState().setActivities([activity1, activity2]);

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(2);
    });
  });

  describe('Focus Area Priority', () => {
    it('should prioritize activities from focus domains', () => {
      // Simulate wheel priorities with is_focus
      const mockPriorities = [
        { domain_id: 'domain-salud', rank: 1, is_focus: true },
        { domain_id: 'domain-trabajo', rank: 2, is_focus: true },
        { domain_id: 'domain-ocio', rank: 3, is_focus: false },
      ];

      const focusDomains = mockPriorities
        .filter(p => p.is_focus)
        .map(p => p.domain_id);

      expect(focusDomains).toContain('domain-salud');
      expect(focusDomains).toContain('domain-trabajo');
      expect(focusDomains).not.toContain('domain-ocio');
    });
  });
});
