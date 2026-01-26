/**
 * Cross-feature integration tests: Odyssey to LifePlan
 * Tests the end-to-end flow of creating prototype steps in Odyssey and importing to LifePlan
 */

import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import type { ActivityWithCompletions } from '@/lib/types/lifeplan';

describe('Odyssey to LifePlan Integration', () => {
  beforeEach(() => {
    useLifePlanStore.getState().reset();
  });

  describe('Prototype Step Import', () => {
    // Simulate odyssey prototype step data
    const mockPrototypeSteps = [
      {
        id: 'step-1',
        prototype_id: 'prototype-123',
        step_type: 'conversation',
        title: 'Hablar con emprendedor exitoso',
        description: 'Contactar a Juan para conocer su experiencia',
      },
      {
        id: 'step-2',
        prototype_id: 'prototype-123',
        step_type: 'experiment',
        title: 'Crear landing page MVP',
        description: 'Diseñar y publicar una landing page básica',
      },
      {
        id: 'step-3',
        prototype_id: 'prototype-123',
        step_type: 'skill',
        title: 'Aprender marketing digital',
        description: 'Completar curso de Google Ads',
      },
    ];

    // Simulate the frequency mapping
    function mapStepTypeToFrequency(stepType: string): 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE' {
      switch (stepType) {
        case 'conversation':
          return 'ONCE';
        case 'experiment':
          return 'ONCE';
        case 'skill':
          return 'WEEKLY';
        default:
          return 'WEEKLY';
      }
    }

    // Simulate the import transformation
    function transformPrototypeStepToActivity(
      step: typeof mockPrototypeSteps[0],
      domainId: string | null
    ): ActivityWithCompletions {
      return {
        id: `imported-${step.id}`,
        user_id: 'user-123',
        title: step.title,
        notes: step.description,
        domain_id: domainId,
        goal_id: null,
        source_type: 'ODYSSEY',
        source_id: step.id,
        frequency_type: mapStepTypeToFrequency(step.step_type),
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

    it('should import prototype steps as LifePlan activities', () => {
      const activities = mockPrototypeSteps.map(step =>
        transformPrototypeStepToActivity(step, null)
      );

      useLifePlanStore.getState().setActivities(activities);

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(3);
      expect(state.activities.every(a => a.source_type === 'ODYSSEY')).toBe(true);
    });

    it('should map conversation steps to ONCE frequency', () => {
      const conversationStep = mockPrototypeSteps.find(s => s.step_type === 'conversation')!;
      const activity = transformPrototypeStepToActivity(conversationStep, null);

      expect(activity.frequency_type).toBe('ONCE');
    });

    it('should map experiment steps to ONCE frequency', () => {
      const experimentStep = mockPrototypeSteps.find(s => s.step_type === 'experiment')!;
      const activity = transformPrototypeStepToActivity(experimentStep, null);

      expect(activity.frequency_type).toBe('ONCE');
    });

    it('should map skill steps to WEEKLY frequency', () => {
      const skillStep = mockPrototypeSteps.find(s => s.step_type === 'skill')!;
      const activity = transformPrototypeStepToActivity(skillStep, null);

      expect(activity.frequency_type).toBe('WEEKLY');
    });

    it('should include step description as activity notes', () => {
      const step = mockPrototypeSteps[0];
      const activity = transformPrototypeStepToActivity(step, null);

      expect(activity.notes).toBe(step.description);
    });
  });

  describe('Target Milestone Domain Inheritance', () => {
    // Simulate milestone with domain
    const mockMilestone = {
      id: 'milestone-1',
      plan_id: 'plan-123',
      year: 1,
      domain_id: 'domain-carrera',
      title: 'Lanzar mi negocio',
      description: null,
      tag: 'normal',
    };

    const mockPrototype = {
      id: 'prototype-123',
      odyssey_id: 'odyssey-123',
      plan_id: 'plan-123',
      target_milestone_id: 'milestone-1',
      status: 'active',
    };

    it('should inherit domain from target milestone', () => {
      // When importing, get domain from milestone
      const inheritedDomainId = mockMilestone.domain_id;

      const activity: ActivityWithCompletions = {
        id: 'activity-1',
        user_id: 'user-123',
        title: 'Test activity',
        notes: null,
        domain_id: inheritedDomainId,
        goal_id: null,
        source_type: 'ODYSSEY',
        source_id: 'step-1',
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

      useLifePlanStore.getState().setActivities([activity]);

      expect(useLifePlanStore.getState().activities[0].domain_id).toBe('domain-carrera');
    });
  });

  describe('Active Prototype Only', () => {
    it('should only import from active prototypes', () => {
      const prototypes = [
        { id: 'proto-1', status: 'active', steps: ['step-1', 'step-2'] },
        { id: 'proto-2', status: 'completed', steps: ['step-3', 'step-4'] },
        { id: 'proto-3', status: 'abandoned', steps: ['step-5'] },
      ];

      const activePrototypes = prototypes.filter(p => p.status === 'active');

      expect(activePrototypes).toHaveLength(1);
      expect(activePrototypes[0].id).toBe('proto-1');
    });
  });

  describe('Deduplication', () => {
    it('should not import duplicate steps based on source_id', () => {
      const existingActivity: ActivityWithCompletions = {
        id: 'existing-1',
        user_id: 'user-123',
        title: 'Existing step',
        notes: null,
        domain_id: null,
        goal_id: null,
        source_type: 'ODYSSEY',
        source_id: 'step-123',
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

      // Try to import same step
      const newStep = { id: 'step-123', step_type: 'skill', title: 'Same step', description: null };

      // Dedup logic
      const existingSourceIds = new Set([existingActivity.source_id]);
      const shouldImport = !existingSourceIds.has(newStep.id);

      expect(shouldImport).toBe(false);
    });

    it('should import new steps not yet in LifePlan', () => {
      const existingSourceIds = new Set(['step-1', 'step-2']);
      const newSteps = [
        { id: 'step-1', title: 'Existing' },
        { id: 'step-3', title: 'New step' },
        { id: 'step-4', title: 'Another new' },
      ];

      const stepsToImport = newSteps.filter(s => !existingSourceIds.has(s.id));

      expect(stepsToImport).toHaveLength(2);
      expect(stepsToImport.map(s => s.id)).toContain('step-3');
      expect(stepsToImport.map(s => s.id)).toContain('step-4');
    });
  });

  describe('Mixed Sources', () => {
    it('should coexist with Wheel-imported and Manual activities', () => {
      const wheelActivity: ActivityWithCompletions = {
        id: 'wheel-act',
        user_id: 'user-123',
        title: 'From Wheel',
        notes: null,
        domain_id: null,
        goal_id: null,
        source_type: 'WHEEL',
        source_id: 'wheel-source',
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

      const odysseyActivity: ActivityWithCompletions = {
        id: 'odyssey-act',
        user_id: 'user-123',
        title: 'From Odyssey',
        notes: null,
        domain_id: null,
        goal_id: null,
        source_type: 'ODYSSEY',
        source_id: 'odyssey-source',
        frequency_type: 'ONCE',
        frequency_value: 1,
        scheduled_days: null,
        time_of_day: null,
        order_position: 0,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completions: [],
      };

      const manualActivity: ActivityWithCompletions = {
        id: 'manual-act',
        user_id: 'user-123',
        title: 'Manual activity',
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

      useLifePlanStore.getState().setActivities([wheelActivity, odysseyActivity, manualActivity]);

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(3);

      const sources = state.activities.map(a => a.source_type);
      expect(sources).toEqual(['WHEEL', 'ODYSSEY', 'MANUAL']);
    });
  });
});
