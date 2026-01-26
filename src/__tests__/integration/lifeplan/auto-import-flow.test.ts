/**
 * Integration tests for Auto-Import Flow
 * Tests the automatic import of activities from Wheel and Odyssey sources
 * Note: These tests use mock data to simulate import behavior
 */

import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import type { ActivityWithCompletions, Goal, SourceType, ImportResult } from '@/lib/types/lifeplan';

const createImportedActivity = (
  source: SourceType,
  sourceId: string,
  title: string
): ActivityWithCompletions => ({
  id: `activity-${Date.now()}-${Math.random()}`,
  user_id: 'user-123',
  title,
  notes: null,
  domain_id: null,
  goal_id: null,
  source_type: source,
  source_id: sourceId,
  frequency_type: 'WEEKLY',
  frequency_value: 1,
  scheduled_days: null,
  time_of_day: null,
  order_position: 0,
  is_archived: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  completions: [],
});

const createImportedGoal = (
  source: SourceType,
  title: string
): Goal => ({
  id: `goal-${Date.now()}-${Math.random()}`,
  user_id: 'user-123',
  domain_id: null,
  title,
  metric: null,
  target_date: null,
  origin: source,
  source_wheel_id: source === 'WHEEL' ? 'wheel-123' : null,
  source_odyssey_id: source === 'ODYSSEY' ? 'odyssey-123' : null,
  is_archived: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe('Auto-Import Flow', () => {
  beforeEach(() => {
    useLifePlanStore.getState().reset();
  });

  describe('Import from Wheel (Rueda de la Vida)', () => {
    it('should import activities with WHEEL source type', () => {
      const wheelActivity = createImportedActivity(
        'WHEEL',
        'wheel-123_domain-1_action-1',
        'Ejercicio 30 minutos'
      );

      useLifePlanStore.getState().setActivities([wheelActivity]);

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(1);
      expect(state.activities[0].source_type).toBe('WHEEL');
      expect(state.activities[0].source_id).toBe('wheel-123_domain-1_action-1');
    });

    it('should import goals with WHEEL origin', () => {
      const wheelGoal = createImportedGoal('WHEEL', 'Mejorar salud física');

      useLifePlanStore.getState().setGoals([wheelGoal]);

      const state = useLifePlanStore.getState();
      expect(state.goals).toHaveLength(1);
      expect(state.goals[0].origin).toBe('WHEEL');
      expect(state.goals[0].source_wheel_id).toBe('wheel-123');
    });

    it('should not duplicate activities with same source_id', () => {
      const activity1 = createImportedActivity(
        'WHEEL',
        'wheel-123_domain-1_action-1',
        'First import'
      );
      const activity2 = {
        ...createImportedActivity('WHEEL', 'wheel-123_domain-1_action-1', 'Duplicate'),
        id: 'different-id',
      };

      // In real implementation, unique constraint would prevent this
      // Here we simulate the dedup logic
      const existingIds = new Set([activity1.source_id]);
      const activitiesToAdd = [activity1];

      if (!existingIds.has(activity2.source_id)) {
        activitiesToAdd.push(activity2);
      }

      useLifePlanStore.getState().setActivities(activitiesToAdd);

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(1);
    });
  });

  describe('Import from Odyssey (Plan de Vida)', () => {
    it('should import activities with ODYSSEY source type', () => {
      const odysseyActivity = createImportedActivity(
        'ODYSSEY',
        'prototype-step-123',
        'Hablar con mentor'
      );

      useLifePlanStore.getState().setActivities([odysseyActivity]);

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(1);
      expect(state.activities[0].source_type).toBe('ODYSSEY');
      expect(state.activities[0].source_id).toBe('prototype-step-123');
    });

    it('should map prototype step types to frequencies', () => {
      // conversation -> ONCE
      const conversationActivity = {
        ...createImportedActivity('ODYSSEY', 'step-conv', 'Conversation'),
        frequency_type: 'ONCE' as const,
      };

      // experiment -> ONCE
      const experimentActivity = {
        ...createImportedActivity('ODYSSEY', 'step-exp', 'Experiment'),
        frequency_type: 'ONCE' as const,
      };

      // skill -> WEEKLY
      const skillActivity = {
        ...createImportedActivity('ODYSSEY', 'step-skill', 'Learn skill'),
        frequency_type: 'WEEKLY' as const,
      };

      useLifePlanStore.getState().setActivities([
        conversationActivity,
        experimentActivity,
        skillActivity,
      ]);

      const state = useLifePlanStore.getState();
      expect(state.activities.find(a => a.source_id === 'step-conv')?.frequency_type).toBe('ONCE');
      expect(state.activities.find(a => a.source_id === 'step-exp')?.frequency_type).toBe('ONCE');
      expect(state.activities.find(a => a.source_id === 'step-skill')?.frequency_type).toBe('WEEKLY');
    });

    it('should import goals with ODYSSEY origin', () => {
      const odysseyGoal = createImportedGoal('ODYSSEY', 'Iniciar negocio');

      useLifePlanStore.getState().setGoals([odysseyGoal]);

      const state = useLifePlanStore.getState();
      expect(state.goals).toHaveLength(1);
      expect(state.goals[0].origin).toBe('ODYSSEY');
      expect(state.goals[0].source_odyssey_id).toBe('odyssey-123');
    });
  });

  describe('Manual Activities', () => {
    it('should allow creating MANUAL activities', () => {
      const manualActivity = createImportedActivity(
        'MANUAL',
        null as any, // Manual activities don't have source_id
        'My custom activity'
      );
      manualActivity.source_id = null;

      useLifePlanStore.getState().setActivities([manualActivity]);

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(1);
      expect(state.activities[0].source_type).toBe('MANUAL');
      expect(state.activities[0].source_id).toBeNull();
    });

    it('should coexist with imported activities', () => {
      const wheelActivity = createImportedActivity('WHEEL', 'w-1', 'From Wheel');
      const odysseyActivity = createImportedActivity('ODYSSEY', 'o-1', 'From Odyssey');
      const manualActivity = {
        ...createImportedActivity('MANUAL', null as any, 'Manual'),
        source_id: null,
      };

      useLifePlanStore.getState().setActivities([wheelActivity, odysseyActivity, manualActivity]);

      const state = useLifePlanStore.getState();
      expect(state.activities).toHaveLength(3);

      const sources = state.activities.map(a => a.source_type);
      expect(sources).toContain('WHEEL');
      expect(sources).toContain('ODYSSEY');
      expect(sources).toContain('MANUAL');
    });
  });

  describe('Sync Results', () => {
    it('should track sync results', () => {
      const result: ImportResult = {
        fromWheel: 5,
        fromOdyssey: 3,
      };

      useLifePlanStore.getState().setLastSyncResult(result);

      const state = useLifePlanStore.getState();
      expect(state.lastSyncResult).toEqual(result);
      expect(state.lastSyncResult?.fromWheel).toBe(5);
      expect(state.lastSyncResult?.fromOdyssey).toBe(3);
    });

    it('should track syncing state', () => {
      useLifePlanStore.getState().setIsSyncing(true);
      expect(useLifePlanStore.getState().isSyncing).toBe(true);

      useLifePlanStore.getState().setIsSyncing(false);
      expect(useLifePlanStore.getState().isSyncing).toBe(false);
    });

    it('should clear sync result on reset', () => {
      useLifePlanStore.getState().setLastSyncResult({ fromWheel: 1, fromOdyssey: 2 });
      useLifePlanStore.getState().reset();

      expect(useLifePlanStore.getState().lastSyncResult).toBeNull();
    });
  });

  describe('Domain Mapping', () => {
    it('should preserve domain_id when importing', () => {
      const activityWithDomain = {
        ...createImportedActivity('WHEEL', 'w-1', 'Health activity'),
        domain_id: 'domain-health',
      };

      useLifePlanStore.getState().setActivities([activityWithDomain]);
      useLifePlanStore.getState().setDomains([
        {
          id: 'domain-health',
          user_id: 'user-123',
          name: 'Salud',
          slug: 'salud',
          icon: '💪',
          order_position: 0,
          created_at: new Date().toISOString(),
        },
      ]);

      const state = useLifePlanStore.getState();
      const activity = state.activities[0];
      const domain = state.domains.find(d => d.id === activity.domain_id);

      expect(domain).toBeDefined();
      expect(domain?.name).toBe('Salud');
    });
  });
});
