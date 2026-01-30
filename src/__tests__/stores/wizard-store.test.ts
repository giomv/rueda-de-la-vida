/**
 * Tests for the Wheel of Life wizard store
 * Tests domain management, scores, priorities, reflections, ideal life, and action plans
 */

import { useWizardStore } from '@/lib/stores/wizard-store';
import type { Domain, Score, Priority, Reflection, IdealLife, ActionPlan, ActionItem } from '@/lib/types';

describe('wizard-store', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = useWizardStore.getState();
      expect(state.wheelId).toBeNull();
      expect(state.title).toBe('');
      expect(state.domains).toEqual([]);
      expect(state.scores).toEqual([]);
      expect(state.priorities).toEqual([]);
      expect(state.reflections).toEqual([]);
      expect(state.idealLife).toEqual([]);
      expect(state.actionPlans).toEqual([]);
      expect(state.currentStep).toBe(0);
      expect(state.isDirty).toBe(false);
    });

    it('should reset to initial state', () => {
      useWizardStore.getState().setTitle('Test Wheel');
      useWizardStore.getState().setCurrentStep(3);

      useWizardStore.getState().reset();

      const state = useWizardStore.getState();
      expect(state.title).toBe('');
      expect(state.currentStep).toBe(0);
    });
  });

  describe('wheel identity', () => {
    it('should set wheel ID', () => {
      useWizardStore.getState().setWheelId('wheel-123');

      const state = useWizardStore.getState();
      expect(state.wheelId).toBe('wheel-123');
    });

    it('should set title and mark dirty', () => {
      useWizardStore.getState().setTitle('Mi Rueda de la Vida');

      const state = useWizardStore.getState();
      expect(state.title).toBe('Mi Rueda de la Vida');
      expect(state.isDirty).toBe(true);
    });
  });

  describe('domains management', () => {
    const mockDomain: Domain = {
      id: 'domain-1',
      wheel_id: 'wheel-123',
      name: 'Salud',
      icon: '💪',
      order_position: 0,
      created_at: new Date().toISOString(),
    };

    it('should set domains', () => {
      useWizardStore.getState().setDomains([mockDomain]);

      const state = useWizardStore.getState();
      expect(state.domains).toHaveLength(1);
      expect(state.domains[0].name).toBe('Salud');
    });

    it('should add a domain', () => {
      useWizardStore.getState().addDomain(mockDomain);

      const state = useWizardStore.getState();
      expect(state.domains).toHaveLength(1);
      expect(state.isDirty).toBe(true);
    });

    it('should add multiple domains', () => {
      const domain2: Domain = { ...mockDomain, id: 'domain-2', name: 'Trabajo', icon: '💼', order_position: 1 };

      useWizardStore.getState().addDomain(mockDomain);
      useWizardStore.getState().addDomain(domain2);

      const state = useWizardStore.getState();
      expect(state.domains).toHaveLength(2);
    });

    it('should remove a domain', () => {
      useWizardStore.getState().setDomains([mockDomain]);
      useWizardStore.getState().removeDomain('domain-1');

      const state = useWizardStore.getState();
      expect(state.domains).toHaveLength(0);
      expect(state.isDirty).toBe(true);
    });

    it('should remove related scores and priorities when removing domain', () => {
      const score: Score = {
        id: 'score-1',
        wheel_id: 'wheel-123',
        domain_id: 'domain-1',
        score: 7,
        notes: null,
        scored_at: new Date().toISOString(),
      };

      const priority: Priority = {
        id: 'priority-1',
        wheel_id: 'wheel-123',
        domain_id: 'domain-1',
        rank: 1,
        is_focus: true,
      };

      useWizardStore.getState().setDomains([mockDomain]);
      useWizardStore.getState().setScores([score]);
      useWizardStore.getState().setPriorities([priority]);

      useWizardStore.getState().removeDomain('domain-1');

      const state = useWizardStore.getState();
      expect(state.domains).toHaveLength(0);
      expect(state.scores).toHaveLength(0);
      expect(state.priorities).toHaveLength(0);
    });

    it('should update a domain', () => {
      useWizardStore.getState().setDomains([mockDomain]);
      useWizardStore.getState().updateDomain('domain-1', { name: 'Bienestar', icon: '🧘' });

      const state = useWizardStore.getState();
      expect(state.domains[0].name).toBe('Bienestar');
      expect(state.domains[0].icon).toBe('🧘');
      expect(state.isDirty).toBe(true);
    });

    it('should reorder domains', () => {
      const domain1 = { ...mockDomain, id: 'domain-1', order_position: 0 };
      const domain2 = { ...mockDomain, id: 'domain-2', name: 'Trabajo', order_position: 1 };

      useWizardStore.getState().setDomains([domain1, domain2]);

      const reordered = [
        { ...domain2, order_position: 0 },
        { ...domain1, order_position: 1 },
      ];

      useWizardStore.getState().reorderDomains(reordered);

      const state = useWizardStore.getState();
      expect(state.domains[0].id).toBe('domain-2');
      expect(state.domains[1].id).toBe('domain-1');
      expect(state.isDirty).toBe(true);
    });
  });

  describe('scores management', () => {
    beforeEach(() => {
      useWizardStore.getState().setWheelId('wheel-123');
    });

    it('should set scores', () => {
      const scores: Score[] = [
        { id: 'score-1', wheel_id: 'wheel-123', domain_id: 'domain-1', score: 7, notes: null, scored_at: new Date().toISOString() },
        { id: 'score-2', wheel_id: 'wheel-123', domain_id: 'domain-2', score: 5, notes: null, scored_at: new Date().toISOString() },
      ];

      useWizardStore.getState().setScores(scores);

      const state = useWizardStore.getState();
      expect(state.scores).toHaveLength(2);
    });

    it('should update existing score', () => {
      const score: Score = {
        id: 'score-1',
        wheel_id: 'wheel-123',
        domain_id: 'domain-1',
        score: 5,
        notes: null,
        scored_at: new Date().toISOString(),
      };

      useWizardStore.getState().setScores([score]);
      useWizardStore.getState().updateScore('domain-1', 8, 'Mejoré mucho');

      const state = useWizardStore.getState();
      expect(state.scores[0].score).toBe(8);
      expect(state.scores[0].notes).toBe('Mejoré mucho');
      expect(state.isDirty).toBe(true);
    });

    it('should create new score if not exists', () => {
      useWizardStore.getState().updateScore('domain-new', 6);

      const state = useWizardStore.getState();
      expect(state.scores).toHaveLength(1);
      expect(state.scores[0].domain_id).toBe('domain-new');
      expect(state.scores[0].score).toBe(6);
    });

    it('should preserve notes when updating only score', () => {
      const score: Score = {
        id: 'score-1',
        wheel_id: 'wheel-123',
        domain_id: 'domain-1',
        score: 5,
        notes: 'Nota original',
        scored_at: new Date().toISOString(),
      };

      useWizardStore.getState().setScores([score]);
      useWizardStore.getState().updateScore('domain-1', 7);

      const state = useWizardStore.getState();
      expect(state.scores[0].score).toBe(7);
      expect(state.scores[0].notes).toBe('Nota original');
    });
  });

  describe('priorities management', () => {
    beforeEach(() => {
      useWizardStore.getState().setWheelId('wheel-123');
    });

    it('should set priorities', () => {
      const priorities: Priority[] = [
        { id: 'priority-1', wheel_id: 'wheel-123', domain_id: 'domain-1', rank: 1, is_focus: true },
        { id: 'priority-2', wheel_id: 'wheel-123', domain_id: 'domain-2', rank: 2, is_focus: true },
        { id: 'priority-3', wheel_id: 'wheel-123', domain_id: 'domain-3', rank: 3, is_focus: false },
      ];

      useWizardStore.getState().setPriorities(priorities);

      const state = useWizardStore.getState();
      expect(state.priorities).toHaveLength(3);
    });

    it('should update existing priority', () => {
      const priority: Priority = {
        id: 'priority-1',
        wheel_id: 'wheel-123',
        domain_id: 'domain-1',
        rank: 3,
        is_focus: false,
      };

      useWizardStore.getState().setPriorities([priority]);
      useWizardStore.getState().updatePriority('domain-1', 1, true);

      const state = useWizardStore.getState();
      expect(state.priorities[0].rank).toBe(1);
      expect(state.priorities[0].is_focus).toBe(true);
      expect(state.isDirty).toBe(true);
    });

    it('should create new priority if not exists', () => {
      useWizardStore.getState().updatePriority('domain-new', 1, true);

      const state = useWizardStore.getState();
      expect(state.priorities).toHaveLength(1);
      expect(state.priorities[0].domain_id).toBe('domain-new');
      expect(state.priorities[0].is_focus).toBe(true);
    });

    it('should default is_focus to false for new priorities', () => {
      useWizardStore.getState().updatePriority('domain-new', 5);

      const state = useWizardStore.getState();
      expect(state.priorities[0].is_focus).toBe(false);
    });

    it('should identify focus domains correctly', () => {
      const priorities: Priority[] = [
        { id: 'p-1', wheel_id: 'wheel-123', domain_id: 'domain-1', rank: 1, is_focus: true },
        { id: 'p-2', wheel_id: 'wheel-123', domain_id: 'domain-2', rank: 2, is_focus: true },
        { id: 'p-3', wheel_id: 'wheel-123', domain_id: 'domain-3', rank: 3, is_focus: false },
      ];

      useWizardStore.getState().setPriorities(priorities);

      const state = useWizardStore.getState();
      const focusDomains = state.priorities.filter(p => p.is_focus);
      expect(focusDomains).toHaveLength(2);
    });
  });

  describe('reflections management', () => {
    beforeEach(() => {
      useWizardStore.getState().setWheelId('wheel-123');
    });

    it('should set reflections', () => {
      const reflections: Reflection[] = [
        { id: 'r-1', wheel_id: 'wheel-123', question_key: 'surprise', answer_text: 'Me sorprendió mi puntaje en salud', created_at: new Date().toISOString() },
      ];

      useWizardStore.getState().setReflections(reflections);

      const state = useWizardStore.getState();
      expect(state.reflections).toHaveLength(1);
    });

    it('should update existing reflection', () => {
      const reflection: Reflection = {
        id: 'r-1',
        wheel_id: 'wheel-123',
        question_key: 'surprise',
        answer_text: 'Respuesta original',
        created_at: new Date().toISOString(),
      };

      useWizardStore.getState().setReflections([reflection]);
      useWizardStore.getState().updateReflection('surprise', 'Nueva respuesta');

      const state = useWizardStore.getState();
      expect(state.reflections[0].answer_text).toBe('Nueva respuesta');
      expect(state.isDirty).toBe(true);
    });

    it('should create new reflection if not exists', () => {
      useWizardStore.getState().updateReflection('patterns', 'Veo un patrón de descuido');

      const state = useWizardStore.getState();
      expect(state.reflections).toHaveLength(1);
      expect(state.reflections[0].question_key).toBe('patterns');
      expect(state.reflections[0].answer_text).toBe('Veo un patrón de descuido');
    });

    it('should handle all reflection questions', () => {
      const questionKeys = ['surprise', 'patterns', 'lowest', 'highest', 'oneChange', 'sixMonths'];

      questionKeys.forEach((key, index) => {
        useWizardStore.getState().updateReflection(key, `Respuesta ${index + 1}`);
      });

      const state = useWizardStore.getState();
      expect(state.reflections).toHaveLength(6);
    });
  });

  describe('ideal life management', () => {
    beforeEach(() => {
      useWizardStore.getState().setWheelId('wheel-123');
    });

    it('should set ideal life visions', () => {
      const idealLife: IdealLife[] = [
        {
          id: 'il-1',
          wheel_id: 'wheel-123',
          domain_id: 'domain-1',
          vision_text: 'Quiero estar en forma',
          prompts_answers: { feel: 'Energético', do: 'Ejercicio diario' },
          created_at: new Date().toISOString(),
        },
      ];

      useWizardStore.getState().setIdealLife(idealLife);

      const state = useWizardStore.getState();
      expect(state.idealLife).toHaveLength(1);
    });

    it('should update existing ideal life', () => {
      const idealLife: IdealLife = {
        id: 'il-1',
        wheel_id: 'wheel-123',
        domain_id: 'domain-1',
        vision_text: 'Visión original',
        prompts_answers: {},
        created_at: new Date().toISOString(),
      };

      useWizardStore.getState().setIdealLife([idealLife]);
      useWizardStore.getState().updateIdealLife('domain-1', {
        vision_text: 'Nueva visión',
        prompts_answers: { feel: 'Feliz' },
      });

      const state = useWizardStore.getState();
      expect(state.idealLife[0].vision_text).toBe('Nueva visión');
      expect(state.idealLife[0].prompts_answers.feel).toBe('Feliz');
      expect(state.isDirty).toBe(true);
    });

    it('should create new ideal life if not exists', () => {
      useWizardStore.getState().updateIdealLife('domain-new', {
        vision_text: 'Mi visión',
      });

      const state = useWizardStore.getState();
      expect(state.idealLife).toHaveLength(1);
      expect(state.idealLife[0].vision_text).toBe('Mi visión');
    });

    it('should handle prompts answers correctly', () => {
      useWizardStore.getState().updateIdealLife('domain-1', {
        prompts_answers: {
          feel: '¿Cómo me siento? Increíble',
          do: '¿Qué Hago? Medito',
          who: '¿Quiénes me ayudaron? Mi familia',
        },
      });

      const state = useWizardStore.getState();
      const prompts = state.idealLife[0].prompts_answers;
      expect(Object.keys(prompts)).toHaveLength(3);
    });
  });

  describe('action plans management', () => {
    beforeEach(() => {
      useWizardStore.getState().setWheelId('wheel-123');
    });

    it('should set action plans', () => {
      const plans: ActionPlan[] = [
        {
          id: 'plan-1',
          wheel_id: 'wheel-123',
          domain_id: 'domain-1',
          goal_text: 'Perder 5 kilos',
          target_score: 8,
          actions: [],
          created_at: new Date().toISOString(),
        },
      ];

      useWizardStore.getState().setActionPlans(plans);

      const state = useWizardStore.getState();
      expect(state.actionPlans).toHaveLength(1);
    });

    it('should update existing action plan', () => {
      const plan: ActionPlan = {
        id: 'plan-1',
        wheel_id: 'wheel-123',
        domain_id: 'domain-1',
        goal_text: 'Meta original',
        target_score: 5,
        actions: [],
        created_at: new Date().toISOString(),
      };

      useWizardStore.getState().setActionPlans([plan]);
      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Nueva meta',
        target_score: 9,
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].goal_text).toBe('Nueva meta');
      expect(state.actionPlans[0].target_score).toBe(9);
      expect(state.isDirty).toBe(true);
    });

    it('should create new action plan if not exists', () => {
      useWizardStore.getState().updateActionPlan('domain-new', {
        goal_text: 'Mi meta',
        target_score: 7,
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans).toHaveLength(1);
      expect(state.actionPlans[0].goal_text).toBe('Mi meta');
    });

    it('should handle actions with frequency, goal_id, and domain_id', () => {
      const actions: ActionItem[] = [
        {
          id: 'action-1',
          text: 'Hacer ejercicio',
          completed: false,
          frequency_type: 'DAILY',
          goal_id: 'goal-123',
          domain_id: 'domain-1',
        },
        {
          id: 'action-2',
          text: 'Revisión semanal',
          completed: false,
          frequency_type: 'WEEKLY',
          goal_id: null,
          domain_id: 'domain-1',
        },
        {
          id: 'action-3',
          text: 'Chequeo médico',
          completed: false,
          frequency_type: 'ONCE',
          goal_id: 'goal-123',
          domain_id: 'domain-1',
        },
      ];

      useWizardStore.getState().updateActionPlan('domain-1', { actions });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions).toHaveLength(3);

      const dailyActions = state.actionPlans[0].actions.filter(a => a.frequency_type === 'DAILY');
      expect(dailyActions).toHaveLength(1);

      const actionsWithGoal = state.actionPlans[0].actions.filter(a => a.goal_id !== null);
      expect(actionsWithGoal).toHaveLength(2);
    });

    it('should support all frequency types', () => {
      const frequencies: ActionItem['frequency_type'][] = ['DAILY', 'WEEKLY', 'MONTHLY', 'ONCE'];

      const actions: ActionItem[] = frequencies.map((freq, index) => ({
        id: `action-${index}`,
        text: `Action ${freq}`,
        completed: false,
        frequency_type: freq,
        goal_id: null,
        domain_id: 'domain-1',
      }));

      useWizardStore.getState().updateActionPlan('domain-1', { actions });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions).toHaveLength(4);

      frequencies.forEach(freq => {
        const found = state.actionPlans[0].actions.find(a => a.frequency_type === freq);
        expect(found).toBeDefined();
      });
    });
  });

  describe('step navigation', () => {
    it('should set current step', () => {
      useWizardStore.getState().setCurrentStep(3);

      const state = useWizardStore.getState();
      expect(state.currentStep).toBe(3);
    });

    it('should navigate through all steps', () => {
      for (let step = 0; step <= 7; step++) {
        useWizardStore.getState().setCurrentStep(step);
        expect(useWizardStore.getState().currentStep).toBe(step);
      }
    });
  });

  describe('dirty state tracking', () => {
    it('should mark state as dirty on changes', () => {
      expect(useWizardStore.getState().isDirty).toBe(false);

      useWizardStore.getState().setTitle('Test');
      expect(useWizardStore.getState().isDirty).toBe(true);
    });

    it('should mark state as clean', () => {
      useWizardStore.getState().setTitle('Test');
      expect(useWizardStore.getState().isDirty).toBe(true);

      useWizardStore.getState().markClean();
      expect(useWizardStore.getState().isDirty).toBe(false);
    });
  });

  describe('hydration', () => {
    it('should hydrate state from data', () => {
      const data = {
        wheelId: 'wheel-123',
        title: 'Mi Rueda',
        currentStep: 5,
        domains: [
          { id: 'domain-1', wheel_id: 'wheel-123', name: 'Salud', icon: '💪', order_position: 0, created_at: new Date().toISOString() },
        ],
      };

      useWizardStore.getState().hydrate(data);

      const state = useWizardStore.getState();
      expect(state.wheelId).toBe('wheel-123');
      expect(state.title).toBe('Mi Rueda');
      expect(state.currentStep).toBe(5);
      expect(state.domains).toHaveLength(1);
      expect(state.isDirty).toBe(false);
    });

    it('should not mark dirty after hydration', () => {
      useWizardStore.getState().hydrate({ title: 'Hydrated' });

      const state = useWizardStore.getState();
      expect(state.isDirty).toBe(false);
    });
  });
});
