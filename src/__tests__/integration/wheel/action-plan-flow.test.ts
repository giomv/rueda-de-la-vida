/**
 * Integration tests for Action Plan CRUD operations
 * Tests the complete flow of creating, reading, updating, and deleting action plans
 * with frequency, goal, and domain associations
 */

import { useWizardStore } from '@/lib/stores/wizard-store';
import type { ActionItem, ActionPlan, Domain } from '@/lib/types';
import { FREQUENCY_OPTIONS } from '@/lib/types';

describe('Action Plan Flow Integration', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
    useWizardStore.getState().setWheelId('wheel-123');
  });

  /**
   * Helper to create a mock domain
   */
  function createMockDomain(overrides: Partial<Domain> = {}): Domain {
    return {
      id: crypto.randomUUID(),
      wheel_id: 'wheel-123',
      name: 'Test Domain',
      icon: '🎯',
      order_position: 0,
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Helper to create a mock action item
   */
  function createMockAction(overrides: Partial<ActionItem> = {}): ActionItem {
    return {
      id: crypto.randomUUID(),
      text: 'Test action',
      completed: false,
      frequency_type: 'WEEKLY',
      goal_id: null,
      domain_id: null,
      ...overrides,
    };
  }

  describe('Create Action Plan', () => {
    it('should create a basic action plan', () => {
      const domainId = 'domain-salud';

      useWizardStore.getState().updateActionPlan(domainId, {
        goal_text: 'Mejorar mi salud física',
        target_score: 8,
        actions: [],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans).toHaveLength(1);
      expect(state.actionPlans[0].domain_id).toBe(domainId);
      expect(state.actionPlans[0].goal_text).toBe('Mejorar mi salud física');
    });

    it('should create action plan with actions', () => {
      const domainId = 'domain-salud';
      const actions: ActionItem[] = [
        createMockAction({ text: 'Hacer ejercicio' }),
        createMockAction({ text: 'Comer saludable' }),
      ];

      useWizardStore.getState().updateActionPlan(domainId, {
        goal_text: 'Meta de salud',
        target_score: 9,
        actions,
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions).toHaveLength(2);
    });

    it('should create multiple action plans for different domains', () => {
      useWizardStore.getState().updateActionPlan('domain-salud', {
        goal_text: 'Meta de salud',
        target_score: 8,
        actions: [],
      });

      useWizardStore.getState().updateActionPlan('domain-trabajo', {
        goal_text: 'Meta de trabajo',
        target_score: 7,
        actions: [],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans).toHaveLength(2);
    });
  });

  describe('Action Frequency Types', () => {
    it('should support DAILY frequency', () => {
      const action = createMockAction({
        text: 'Meditar 10 minutos',
        frequency_type: 'DAILY',
      });

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Bienestar mental',
        target_score: 8,
        actions: [action],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].frequency_type).toBe('DAILY');
    });

    it('should support WEEKLY frequency', () => {
      const action = createMockAction({
        text: 'Ir al gimnasio',
        frequency_type: 'WEEKLY',
      });

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Condición física',
        target_score: 8,
        actions: [action],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].frequency_type).toBe('WEEKLY');
    });

    it('should support MONTHLY frequency', () => {
      const action = createMockAction({
        text: 'Revisión de progreso',
        frequency_type: 'MONTHLY',
      });

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Seguimiento',
        target_score: 8,
        actions: [action],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].frequency_type).toBe('MONTHLY');
    });

    it('should support ONCE frequency', () => {
      const action = createMockAction({
        text: 'Comprar equipo',
        frequency_type: 'ONCE',
      });

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Equipamiento',
        target_score: 8,
        actions: [action],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].frequency_type).toBe('ONCE');
    });

    it('should validate all frequency options exist', () => {
      const frequencyKeys = FREQUENCY_OPTIONS.map(f => f.key);

      expect(frequencyKeys).toContain('DAILY');
      expect(frequencyKeys).toContain('WEEKLY');
      expect(frequencyKeys).toContain('MONTHLY');
      expect(frequencyKeys).toContain('ONCE');
      expect(frequencyKeys).toHaveLength(4);
    });

    it('should filter actions by frequency type', () => {
      const actions: ActionItem[] = [
        createMockAction({ id: '1', text: 'Daily 1', frequency_type: 'DAILY' }),
        createMockAction({ id: '2', text: 'Daily 2', frequency_type: 'DAILY' }),
        createMockAction({ id: '3', text: 'Weekly 1', frequency_type: 'WEEKLY' }),
        createMockAction({ id: '4', text: 'Monthly 1', frequency_type: 'MONTHLY' }),
        createMockAction({ id: '5', text: 'Once 1', frequency_type: 'ONCE' }),
      ];

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Mixed frequencies',
        target_score: 8,
        actions,
      });

      const state = useWizardStore.getState();
      const planActions = state.actionPlans[0].actions;

      const dailyActions = planActions.filter(a => a.frequency_type === 'DAILY');
      const weeklyActions = planActions.filter(a => a.frequency_type === 'WEEKLY');
      const monthlyActions = planActions.filter(a => a.frequency_type === 'MONTHLY');
      const onceActions = planActions.filter(a => a.frequency_type === 'ONCE');

      expect(dailyActions).toHaveLength(2);
      expect(weeklyActions).toHaveLength(1);
      expect(monthlyActions).toHaveLength(1);
      expect(onceActions).toHaveLength(1);
    });
  });

  describe('Action Goal Association', () => {
    it('should associate action with a goal', () => {
      const goalId = 'goal-fitness-123';
      const action = createMockAction({
        text: 'Correr 5km',
        goal_id: goalId,
      });

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Meta principal',
        target_score: 9,
        actions: [action],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].goal_id).toBe(goalId);
    });

    it('should allow action without goal association', () => {
      const action = createMockAction({
        text: 'Acción sin meta',
        goal_id: null,
      });

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Meta principal',
        target_score: 8,
        actions: [action],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].goal_id).toBeNull();
    });

    it('should group actions by goal_id', () => {
      const actions: ActionItem[] = [
        createMockAction({ id: '1', text: 'Goal A - Action 1', goal_id: 'goal-a' }),
        createMockAction({ id: '2', text: 'Goal A - Action 2', goal_id: 'goal-a' }),
        createMockAction({ id: '3', text: 'Goal B - Action 1', goal_id: 'goal-b' }),
        createMockAction({ id: '4', text: 'No goal', goal_id: null }),
      ];

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Mixed goals',
        target_score: 8,
        actions,
      });

      const state = useWizardStore.getState();
      const planActions = state.actionPlans[0].actions;

      const goalAActions = planActions.filter(a => a.goal_id === 'goal-a');
      const goalBActions = planActions.filter(a => a.goal_id === 'goal-b');
      const noGoalActions = planActions.filter(a => a.goal_id === null);

      expect(goalAActions).toHaveLength(2);
      expect(goalBActions).toHaveLength(1);
      expect(noGoalActions).toHaveLength(1);
    });
  });

  describe('Action Domain Association', () => {
    it('should associate action with a domain', () => {
      const domainId = 'domain-salud';
      const action = createMockAction({
        text: 'Ejercicio matutino',
        domain_id: domainId,
      });

      useWizardStore.getState().updateActionPlan(domainId, {
        goal_text: 'Salud',
        target_score: 8,
        actions: [action],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].domain_id).toBe(domainId);
    });

    it('should allow action without domain association', () => {
      const action = createMockAction({
        text: 'Acción general',
        domain_id: null,
      });

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Meta',
        target_score: 7,
        actions: [action],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].domain_id).toBeNull();
    });

    it('should inherit domain from action plan context', () => {
      const domain = createMockDomain({ id: 'domain-salud', name: 'Salud' });
      useWizardStore.getState().addDomain(domain);

      // Actions created in a domain's action plan should reference that domain
      const action = createMockAction({
        text: 'Acción de salud',
        domain_id: domain.id,
      });

      useWizardStore.getState().updateActionPlan(domain.id, {
        goal_text: 'Meta de salud',
        target_score: 8,
        actions: [action],
      });

      const state = useWizardStore.getState();
      const plan = state.actionPlans.find(p => p.domain_id === domain.id);
      expect(plan?.actions[0].domain_id).toBe(domain.id);
    });
  });

  describe('Update Action Plan', () => {
    beforeEach(() => {
      // Setup initial action plan
      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Meta inicial',
        target_score: 5,
        actions: [
          createMockAction({ id: 'action-1', text: 'Acción inicial' }),
        ],
      });
    });

    it('should update goal text', () => {
      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Meta actualizada',
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].goal_text).toBe('Meta actualizada');
    });

    it('should update target score', () => {
      useWizardStore.getState().updateActionPlan('domain-1', {
        target_score: 9,
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].target_score).toBe(9);
    });

    it('should add new actions to existing plan', () => {
      const currentPlan = useWizardStore.getState().actionPlans[0];
      const newActions = [
        ...currentPlan.actions,
        createMockAction({ id: 'action-2', text: 'Nueva acción' }),
      ];

      useWizardStore.getState().updateActionPlan('domain-1', {
        actions: newActions,
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions).toHaveLength(2);
    });

    it('should remove actions from plan', () => {
      useWizardStore.getState().updateActionPlan('domain-1', {
        actions: [],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions).toHaveLength(0);
    });

    it('should update action frequency', () => {
      const currentPlan = useWizardStore.getState().actionPlans[0];
      const updatedActions = currentPlan.actions.map(a => ({
        ...a,
        frequency_type: 'DAILY' as const,
      }));

      useWizardStore.getState().updateActionPlan('domain-1', {
        actions: updatedActions,
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].frequency_type).toBe('DAILY');
    });

    it('should update action goal association', () => {
      const currentPlan = useWizardStore.getState().actionPlans[0];
      const updatedActions = currentPlan.actions.map(a => ({
        ...a,
        goal_id: 'new-goal-123',
      }));

      useWizardStore.getState().updateActionPlan('domain-1', {
        actions: updatedActions,
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].goal_id).toBe('new-goal-123');
    });

    it('should mark action as completed', () => {
      const currentPlan = useWizardStore.getState().actionPlans[0];
      const updatedActions = currentPlan.actions.map(a => ({
        ...a,
        completed: true,
      }));

      useWizardStore.getState().updateActionPlan('domain-1', {
        actions: updatedActions,
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].completed).toBe(true);
    });
  });

  describe('Read Action Plans', () => {
    beforeEach(() => {
      // Setup multiple action plans
      useWizardStore.getState().updateActionPlan('domain-salud', {
        goal_text: 'Meta de salud',
        target_score: 8,
        actions: [
          createMockAction({ text: 'Ejercicio', frequency_type: 'DAILY', domain_id: 'domain-salud' }),
          createMockAction({ text: 'Dormir bien', frequency_type: 'DAILY', domain_id: 'domain-salud' }),
        ],
      });

      useWizardStore.getState().updateActionPlan('domain-trabajo', {
        goal_text: 'Meta de trabajo',
        target_score: 7,
        actions: [
          createMockAction({ text: 'Revisar tareas', frequency_type: 'DAILY', domain_id: 'domain-trabajo' }),
        ],
      });
    });

    it('should get all action plans', () => {
      const state = useWizardStore.getState();
      expect(state.actionPlans).toHaveLength(2);
    });

    it('should get action plan by domain_id', () => {
      const state = useWizardStore.getState();
      const saludPlan = state.actionPlans.find(p => p.domain_id === 'domain-salud');

      expect(saludPlan).toBeDefined();
      expect(saludPlan?.goal_text).toBe('Meta de salud');
    });

    it('should count total actions across all plans', () => {
      const state = useWizardStore.getState();
      const totalActions = state.actionPlans.reduce(
        (sum, plan) => sum + plan.actions.length,
        0
      );

      expect(totalActions).toBe(3);
    });

    it('should get completed vs pending actions', () => {
      // Mark one action as completed
      const currentPlan = useWizardStore.getState().actionPlans[0];
      const updatedActions = currentPlan.actions.map((a, i) => ({
        ...a,
        completed: i === 0,
      }));

      useWizardStore.getState().updateActionPlan('domain-salud', {
        actions: updatedActions,
      });

      const state = useWizardStore.getState();
      const allActions = state.actionPlans.flatMap(p => p.actions);
      const completed = allActions.filter(a => a.completed);
      const pending = allActions.filter(a => !a.completed);

      expect(completed).toHaveLength(1);
      expect(pending).toHaveLength(2);
    });
  });

  describe('Delete Operations', () => {
    beforeEach(() => {
      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Meta',
        target_score: 8,
        actions: [
          createMockAction({ id: 'action-1', text: 'Acción 1' }),
          createMockAction({ id: 'action-2', text: 'Acción 2' }),
          createMockAction({ id: 'action-3', text: 'Acción 3' }),
        ],
      });
    });

    it('should remove a single action', () => {
      const currentPlan = useWizardStore.getState().actionPlans[0];
      const filteredActions = currentPlan.actions.filter(a => a.id !== 'action-2');

      useWizardStore.getState().updateActionPlan('domain-1', {
        actions: filteredActions,
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions).toHaveLength(2);
      expect(state.actionPlans[0].actions.find(a => a.id === 'action-2')).toBeUndefined();
    });

    it('should clear all actions from plan', () => {
      useWizardStore.getState().updateActionPlan('domain-1', {
        actions: [],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty goal text', () => {
      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: '',
        target_score: 5,
        actions: [],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].goal_text).toBe('');
    });

    it('should handle null goal text', () => {
      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: null as unknown as string,
        target_score: 5,
        actions: [],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].goal_text).toBeNull();
    });

    it('should handle target score at boundaries', () => {
      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Min score',
        target_score: 1,
        actions: [],
      });

      useWizardStore.getState().updateActionPlan('domain-2', {
        goal_text: 'Max score',
        target_score: 10,
        actions: [],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].target_score).toBe(1);
      expect(state.actionPlans[1].target_score).toBe(10);
    });

    it('should handle very long action text', () => {
      const longText = 'A'.repeat(500);
      const action = createMockAction({ text: longText });

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Meta',
        target_score: 8,
        actions: [action],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].text).toBe(longText);
    });

    it('should handle special characters in action text', () => {
      const specialText = 'Acción con émojis 🎯 & símbolos <> "quotes"';
      const action = createMockAction({ text: specialText });

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Meta',
        target_score: 8,
        actions: [action],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions[0].text).toBe(specialText);
    });

    it('should handle many actions (100+)', () => {
      const manyActions: ActionItem[] = [];
      for (let i = 0; i < 100; i++) {
        manyActions.push(createMockAction({ id: `action-${i}`, text: `Action ${i}` }));
      }

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Many actions',
        target_score: 8,
        actions: manyActions,
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions).toHaveLength(100);
    });
  });

  describe('Action Plan with Full Context', () => {
    it('should create complete action plan with all fields', () => {
      const domain = createMockDomain({ id: 'domain-salud', name: 'Salud', icon: '💪' });
      useWizardStore.getState().addDomain(domain);

      const goalId = 'goal-fitness';
      const actions: ActionItem[] = [
        {
          id: 'action-1',
          text: 'Correr 30 minutos',
          completed: false,
          frequency_type: 'DAILY',
          goal_id: goalId,
          domain_id: domain.id,
        },
        {
          id: 'action-2',
          text: 'Ir al gimnasio',
          completed: false,
          frequency_type: 'WEEKLY',
          goal_id: goalId,
          domain_id: domain.id,
        },
        {
          id: 'action-3',
          text: 'Chequeo médico',
          completed: false,
          frequency_type: 'ONCE',
          goal_id: null,
          domain_id: domain.id,
        },
      ];

      useWizardStore.getState().updateActionPlan(domain.id, {
        goal_text: 'Perder 5 kilos en 3 meses haciendo ejercicio regular',
        target_score: 9,
        actions,
      });

      const state = useWizardStore.getState();
      const plan = state.actionPlans[0];

      // Verify plan structure
      expect(plan.domain_id).toBe(domain.id);
      expect(plan.goal_text).toContain('5 kilos');
      expect(plan.target_score).toBe(9);
      expect(plan.actions).toHaveLength(3);

      // Verify actions
      const dailyActions = plan.actions.filter(a => a.frequency_type === 'DAILY');
      const weeklyActions = plan.actions.filter(a => a.frequency_type === 'WEEKLY');
      const oneTimeActions = plan.actions.filter(a => a.frequency_type === 'ONCE');
      const actionsWithGoal = plan.actions.filter(a => a.goal_id === goalId);

      expect(dailyActions).toHaveLength(1);
      expect(weeklyActions).toHaveLength(1);
      expect(oneTimeActions).toHaveLength(1);
      expect(actionsWithGoal).toHaveLength(2);
    });
  });
});
