/**
 * Integration tests for the Wheel of Life wizard flow
 * Tests the complete end-to-end flow from domain selection to action planning
 */

import { useWizardStore } from '@/lib/stores/wizard-store';
import type { Domain, Score, Priority, Reflection, IdealLife, ActionPlan, ActionItem } from '@/lib/types';
import { SUGGESTED_DOMAINS, REFLECTION_QUESTIONS, IDEAL_LIFE_PROMPTS } from '@/lib/types';

describe('Wheel Wizard Flow Integration', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
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

  describe('Step 0: Domain Selection (dominios)', () => {
    it('should allow selecting suggested domains', () => {
      useWizardStore.getState().setWheelId('wheel-123');

      SUGGESTED_DOMAINS.slice(0, 8).forEach((suggested, index) => {
        const domain = createMockDomain({
          name: suggested.name,
          icon: suggested.icon,
          order_position: index,
        });
        useWizardStore.getState().addDomain(domain);
      });

      const state = useWizardStore.getState();
      expect(state.domains).toHaveLength(8);
      expect(state.domains.map(d => d.name)).toContain('Salud');
      expect(state.domains.map(d => d.name)).toContain('Trabajo');
    });

    it('should allow creating custom domains', () => {
      useWizardStore.getState().setWheelId('wheel-123');

      const customDomain = createMockDomain({
        name: 'Mi Dominio Personalizado',
        icon: '⭐',
      });
      useWizardStore.getState().addDomain(customDomain);

      const state = useWizardStore.getState();
      expect(state.domains[0].name).toBe('Mi Dominio Personalizado');
    });

    it('should enforce minimum 4 and maximum 10 domains', () => {
      useWizardStore.getState().setWheelId('wheel-123');

      // Add 4 domains (minimum)
      for (let i = 0; i < 4; i++) {
        useWizardStore.getState().addDomain(
          createMockDomain({ name: `Domain ${i}`, order_position: i })
        );
      }

      let state = useWizardStore.getState();
      expect(state.domains.length >= 4).toBe(true);

      // Add up to 10 domains (maximum)
      for (let i = 4; i < 10; i++) {
        useWizardStore.getState().addDomain(
          createMockDomain({ name: `Domain ${i}`, order_position: i })
        );
      }

      state = useWizardStore.getState();
      expect(state.domains.length <= 10).toBe(true);
    });

    it('should allow reordering domains', () => {
      useWizardStore.getState().setWheelId('wheel-123');

      const domains = ['Salud', 'Trabajo', 'Familia'].map((name, i) =>
        createMockDomain({ id: `domain-${i}`, name, order_position: i })
      );

      useWizardStore.getState().setDomains(domains);

      // Reorder: Familia first, then Salud, then Trabajo
      const reordered = [
        { ...domains[2], order_position: 0 },
        { ...domains[0], order_position: 1 },
        { ...domains[1], order_position: 2 },
      ];

      useWizardStore.getState().reorderDomains(reordered);

      const state = useWizardStore.getState();
      expect(state.domains[0].name).toBe('Familia');
      expect(state.domains[1].name).toBe('Salud');
      expect(state.domains[2].name).toBe('Trabajo');
    });
  });

  describe('Step 1: Scoring (puntajes)', () => {
    beforeEach(() => {
      useWizardStore.getState().setWheelId('wheel-123');
      const domains = SUGGESTED_DOMAINS.slice(0, 6).map((d, i) =>
        createMockDomain({ id: `domain-${i}`, name: d.name, icon: d.icon, order_position: i })
      );
      useWizardStore.getState().setDomains(domains);
    });

    it('should score all domains from 0 to 10', () => {
      const domains = useWizardStore.getState().domains;

      domains.forEach((domain, index) => {
        const score = (index % 11); // 0-10
        useWizardStore.getState().updateScore(domain.id, score);
      });

      const state = useWizardStore.getState();
      expect(state.scores).toHaveLength(6);
      state.scores.forEach(s => {
        expect(s.score >= 0 && s.score <= 10).toBe(true);
      });
    });

    it('should add notes to scores', () => {
      const domains = useWizardStore.getState().domains;

      useWizardStore.getState().updateScore(domains[0].id, 3, 'Necesito mejorar mucho');
      useWizardStore.getState().updateScore(domains[1].id, 8, 'Estoy satisfecho');

      const state = useWizardStore.getState();
      const lowScore = state.scores.find(s => s.domain_id === domains[0].id);
      const highScore = state.scores.find(s => s.domain_id === domains[1].id);

      expect(lowScore?.notes).toBe('Necesito mejorar mucho');
      expect(highScore?.notes).toBe('Estoy satisfecho');
    });

    it('should calculate average score', () => {
      const domains = useWizardStore.getState().domains;
      const testScores = [5, 7, 3, 8, 6, 4];

      domains.forEach((domain, index) => {
        useWizardStore.getState().updateScore(domain.id, testScores[index]);
      });

      const state = useWizardStore.getState();
      const average = state.scores.reduce((sum, s) => sum + s.score, 0) / state.scores.length;

      expect(average).toBeCloseTo(5.5, 1);
    });
  });

  describe('Step 2: Results visualization (resultado)', () => {
    beforeEach(() => {
      useWizardStore.getState().setWheelId('wheel-123');
      const domains = SUGGESTED_DOMAINS.slice(0, 6).map((d, i) =>
        createMockDomain({ id: `domain-${i}`, name: d.name, icon: d.icon, order_position: i })
      );
      useWizardStore.getState().setDomains(domains);

      // Add scores
      const scores = [8, 6, 4, 7, 5, 9];
      domains.forEach((domain, i) => {
        useWizardStore.getState().updateScore(domain.id, scores[i]);
      });
    });

    it('should identify lowest scored domains', () => {
      const state = useWizardStore.getState();

      const sortedByScore = [...state.scores].sort((a, b) => a.score - b.score);
      const lowestThree = sortedByScore.slice(0, 3);

      expect(lowestThree[0].score).toBe(4);
      expect(lowestThree[1].score).toBe(5);
      expect(lowestThree[2].score).toBe(6);
    });

    it('should identify highest scored domains', () => {
      const state = useWizardStore.getState();

      const sortedByScore = [...state.scores].sort((a, b) => b.score - a.score);
      const highestThree = sortedByScore.slice(0, 3);

      expect(highestThree[0].score).toBe(9);
      expect(highestThree[1].score).toBe(8);
      expect(highestThree[2].score).toBe(7);
    });

    it('should prepare data for radar chart visualization', () => {
      const state = useWizardStore.getState();

      const chartData = state.domains.map(domain => {
        const score = state.scores.find(s => s.domain_id === domain.id);
        return {
          name: domain.name,
          icon: domain.icon,
          score: score?.score ?? 0,
        };
      });

      expect(chartData).toHaveLength(6);
      chartData.forEach(item => {
        expect(item.name).toBeDefined();
        expect(item.score >= 0 && item.score <= 10).toBe(true);
      });
    });
  });

  describe('Step 3: Priorities selection (prioridades)', () => {
    beforeEach(() => {
      useWizardStore.getState().setWheelId('wheel-123');
      const domains = SUGGESTED_DOMAINS.slice(0, 6).map((d, i) =>
        createMockDomain({ id: `domain-${i}`, name: d.name, icon: d.icon, order_position: i })
      );
      useWizardStore.getState().setDomains(domains);
    });

    it('should rank all domains by priority', () => {
      const domains = useWizardStore.getState().domains;

      domains.forEach((domain, index) => {
        useWizardStore.getState().updatePriority(domain.id, index + 1, index < 3);
      });

      const state = useWizardStore.getState();
      expect(state.priorities).toHaveLength(6);
    });

    it('should select 1-3 focus domains', () => {
      const domains = useWizardStore.getState().domains;

      // Select first 2 as focus
      useWizardStore.getState().updatePriority(domains[0].id, 1, true);
      useWizardStore.getState().updatePriority(domains[1].id, 2, true);

      // Rest are not focus
      for (let i = 2; i < domains.length; i++) {
        useWizardStore.getState().updatePriority(domains[i].id, i + 1, false);
      }

      const state = useWizardStore.getState();
      const focusDomains = state.priorities.filter(p => p.is_focus);

      expect(focusDomains.length >= 1 && focusDomains.length <= 3).toBe(true);
    });

    it('should get focus domain details', () => {
      const domains = useWizardStore.getState().domains;

      useWizardStore.getState().updatePriority(domains[0].id, 1, true);
      useWizardStore.getState().updatePriority(domains[2].id, 2, true);

      const state = useWizardStore.getState();
      const focusPriorities = state.priorities.filter(p => p.is_focus);
      const focusDomainDetails = focusPriorities.map(p =>
        state.domains.find(d => d.id === p.domain_id)
      );

      expect(focusDomainDetails).toHaveLength(2);
      focusDomainDetails.forEach(d => {
        expect(d).toBeDefined();
        expect(d?.name).toBeDefined();
      });
    });
  });

  describe('Step 4: Reflection (reflexion)', () => {
    beforeEach(() => {
      useWizardStore.getState().setWheelId('wheel-123');
    });

    it('should answer all reflection questions', () => {
      const answers: Record<string, string> = {
        surprise: 'Me sorprendió mi bajo puntaje en salud',
        patterns: 'Descuido las áreas personales por el trabajo',
        lowest: 'Falta de tiempo y prioridades',
        highest: 'Dedico tiempo a mis relaciones',
        oneChange: 'Empezar a hacer ejercicio',
        sixMonths: 'Más equilibrada, especialmente en salud',
      };

      Object.entries(answers).forEach(([key, value]) => {
        useWizardStore.getState().updateReflection(key, value);
      });

      const state = useWizardStore.getState();
      expect(state.reflections).toHaveLength(6);

      REFLECTION_QUESTIONS.forEach(q => {
        const reflection = state.reflections.find(r => r.question_key === q.key);
        expect(reflection).toBeDefined();
        expect(reflection?.answer_text).toBeTruthy();
      });
    });

    it('should allow updating existing reflections', () => {
      useWizardStore.getState().updateReflection('surprise', 'Primera respuesta');
      useWizardStore.getState().updateReflection('surprise', 'Respuesta actualizada');

      const state = useWizardStore.getState();
      expect(state.reflections).toHaveLength(1);
      expect(state.reflections[0].answer_text).toBe('Respuesta actualizada');
    });

    it('should handle empty reflections gracefully', () => {
      useWizardStore.getState().updateReflection('surprise', '');

      const state = useWizardStore.getState();
      expect(state.reflections[0].answer_text).toBe('');
    });
  });

  describe('Step 5: Ideal Life Vision (vida-ideal)', () => {
    beforeEach(() => {
      useWizardStore.getState().setWheelId('wheel-123');
      const domains = SUGGESTED_DOMAINS.slice(0, 3).map((d, i) =>
        createMockDomain({ id: `domain-${i}`, name: d.name, icon: d.icon, order_position: i })
      );
      useWizardStore.getState().setDomains(domains);

      // Set as focus domains
      domains.forEach((d, i) => {
        useWizardStore.getState().updatePriority(d.id, i + 1, true);
      });
    });

    it('should create vision for each focus domain', () => {
      const state = useWizardStore.getState();
      const focusDomains = state.priorities.filter(p => p.is_focus);

      focusDomains.forEach(p => {
        useWizardStore.getState().updateIdealLife(p.domain_id, {
          vision_text: `Mi visión para ${p.domain_id}`,
        });
      });

      const updatedState = useWizardStore.getState();
      expect(updatedState.idealLife).toHaveLength(focusDomains.length);
    });

    it('should answer all prompts for each domain', () => {
      const domains = useWizardStore.getState().domains;

      const promptAnswers: Record<string, string> = {
        feel: 'Me siento energético y motivado',
        do: 'Hago ejercicio cada mañana',
        who: 'Mi familia me ayudó a llegar aquí',
      };

      useWizardStore.getState().updateIdealLife(domains[0].id, {
        vision_text: 'Mi vida ideal en salud',
        prompts_answers: promptAnswers,
      });

      const state = useWizardStore.getState();
      const vision = state.idealLife.find(il => il.domain_id === domains[0].id);

      IDEAL_LIFE_PROMPTS.forEach(prompt => {
        expect(vision?.prompts_answers[prompt.key]).toBeDefined();
      });
    });

    it('should allow vision_text without prompts', () => {
      const domains = useWizardStore.getState().domains;

      useWizardStore.getState().updateIdealLife(domains[0].id, {
        vision_text: 'Solo texto de visión',
      });

      const state = useWizardStore.getState();
      const vision = state.idealLife[0];

      expect(vision.vision_text).toBe('Solo texto de visión');
      expect(Object.keys(vision.prompts_answers).length).toBe(0);
    });
  });

  describe('Step 6: Action Plan (plan)', () => {
    beforeEach(() => {
      useWizardStore.getState().setWheelId('wheel-123');
      const domains = SUGGESTED_DOMAINS.slice(0, 2).map((d, i) =>
        createMockDomain({ id: `domain-${i}`, name: d.name, icon: d.icon, order_position: i })
      );
      useWizardStore.getState().setDomains(domains);

      // Set as focus
      domains.forEach((d, i) => {
        useWizardStore.getState().updatePriority(d.id, i + 1, true);
      });
    });

    it('should create action plan for each focus domain', () => {
      const state = useWizardStore.getState();
      const focusDomains = state.priorities.filter(p => p.is_focus);

      focusDomains.forEach(p => {
        useWizardStore.getState().updateActionPlan(p.domain_id, {
          goal_text: `Meta para ${p.domain_id}`,
          target_score: 8,
          actions: [],
        });
      });

      const updatedState = useWizardStore.getState();
      expect(updatedState.actionPlans).toHaveLength(focusDomains.length);
    });

    it('should set SMART goals with target scores', () => {
      const domains = useWizardStore.getState().domains;

      useWizardStore.getState().updateActionPlan(domains[0].id, {
        goal_text: 'Perder 5 kilos en 3 meses',
        target_score: 8,
      });

      const state = useWizardStore.getState();
      const plan = state.actionPlans[0];

      expect(plan.goal_text).toContain('5 kilos');
      expect(plan.goal_text).toContain('3 meses');
      expect(plan.target_score).toBe(8);
    });

    it('should add actions with different frequencies', () => {
      const domains = useWizardStore.getState().domains;

      const actions: ActionItem[] = [
        createMockAction({
          text: 'Meditar 10 minutos',
          frequency_type: 'DAILY',
          domain_id: domains[0].id,
        }),
        createMockAction({
          text: 'Ir al gimnasio',
          frequency_type: 'WEEKLY',
          domain_id: domains[0].id,
        }),
        createMockAction({
          text: 'Revisión de progreso',
          frequency_type: 'MONTHLY',
          domain_id: domains[0].id,
        }),
        createMockAction({
          text: 'Comprar equipo de ejercicio',
          frequency_type: 'ONCE',
          domain_id: domains[0].id,
        }),
      ];

      useWizardStore.getState().updateActionPlan(domains[0].id, {
        goal_text: 'Mejorar mi salud',
        target_score: 8,
        actions,
      });

      const state = useWizardStore.getState();
      const plan = state.actionPlans[0];

      expect(plan.actions).toHaveLength(4);

      const frequencies = plan.actions.map(a => a.frequency_type);
      expect(frequencies).toContain('DAILY');
      expect(frequencies).toContain('WEEKLY');
      expect(frequencies).toContain('MONTHLY');
      expect(frequencies).toContain('ONCE');
    });

    it('should link actions to goals', () => {
      const domains = useWizardStore.getState().domains;
      const goalId = 'goal-salud-123';

      const actions: ActionItem[] = [
        createMockAction({
          text: 'Acción vinculada a meta',
          goal_id: goalId,
          domain_id: domains[0].id,
        }),
        createMockAction({
          text: 'Acción sin meta',
          goal_id: null,
          domain_id: domains[0].id,
        }),
      ];

      useWizardStore.getState().updateActionPlan(domains[0].id, {
        goal_text: 'Mi meta SMART',
        target_score: 9,
        actions,
      });

      const state = useWizardStore.getState();
      const plan = state.actionPlans[0];

      const linkedActions = plan.actions.filter(a => a.goal_id !== null);
      const unlinkedActions = plan.actions.filter(a => a.goal_id === null);

      expect(linkedActions).toHaveLength(1);
      expect(unlinkedActions).toHaveLength(1);
    });

    it('should mark actions as completed', () => {
      const domains = useWizardStore.getState().domains;

      const actions: ActionItem[] = [
        createMockAction({ id: 'action-1', text: 'Acción 1', completed: false }),
        createMockAction({ id: 'action-2', text: 'Acción 2', completed: true }),
      ];

      useWizardStore.getState().updateActionPlan(domains[0].id, { actions });

      const state = useWizardStore.getState();
      const plan = state.actionPlans[0];

      const completedActions = plan.actions.filter(a => a.completed);
      const pendingActions = plan.actions.filter(a => !a.completed);

      expect(completedActions).toHaveLength(1);
      expect(pendingActions).toHaveLength(1);
    });
  });

  describe('Complete Wizard Flow', () => {
    it('should complete all 8 steps successfully', () => {
      // Step 0: Initialize wheel and add domains
      useWizardStore.getState().setWheelId('wheel-complete-test');
      useWizardStore.getState().setTitle('Mi Rueda de la Vida Completa');
      useWizardStore.getState().setCurrentStep(0);

      const domains = SUGGESTED_DOMAINS.slice(0, 6).map((d, i) =>
        createMockDomain({ id: `d-${i}`, name: d.name, icon: d.icon, order_position: i })
      );
      useWizardStore.getState().setDomains(domains);

      expect(useWizardStore.getState().domains).toHaveLength(6);

      // Step 1: Score all domains
      useWizardStore.getState().setCurrentStep(1);
      const scores = [7, 5, 8, 4, 6, 9];
      domains.forEach((d, i) => {
        useWizardStore.getState().updateScore(d.id, scores[i]);
      });

      expect(useWizardStore.getState().scores).toHaveLength(6);

      // Step 2: View results (no state changes needed)
      useWizardStore.getState().setCurrentStep(2);

      // Step 3: Set priorities and focus areas
      useWizardStore.getState().setCurrentStep(3);
      domains.forEach((d, i) => {
        useWizardStore.getState().updatePriority(d.id, i + 1, i < 2); // First 2 are focus
      });

      expect(useWizardStore.getState().priorities.filter(p => p.is_focus)).toHaveLength(2);

      // Step 4: Add reflections
      useWizardStore.getState().setCurrentStep(4);
      REFLECTION_QUESTIONS.forEach(q => {
        useWizardStore.getState().updateReflection(q.key, `Respuesta para ${q.key}`);
      });

      expect(useWizardStore.getState().reflections).toHaveLength(6);

      // Step 5: Add ideal life visions for focus domains
      useWizardStore.getState().setCurrentStep(5);
      const focusDomains = useWizardStore.getState().priorities.filter(p => p.is_focus);
      focusDomains.forEach(p => {
        useWizardStore.getState().updateIdealLife(p.domain_id, {
          vision_text: `Mi visión ideal para este dominio`,
          prompts_answers: { feel: 'Feliz', do: 'Cosas positivas' },
        });
      });

      expect(useWizardStore.getState().idealLife).toHaveLength(2);

      // Step 6: Create action plans
      useWizardStore.getState().setCurrentStep(6);
      focusDomains.forEach(p => {
        useWizardStore.getState().updateActionPlan(p.domain_id, {
          goal_text: 'Meta SMART',
          target_score: 9,
          actions: [
            createMockAction({
              text: 'Acción diaria',
              frequency_type: 'DAILY',
              domain_id: p.domain_id,
            }),
            createMockAction({
              text: 'Acción semanal',
              frequency_type: 'WEEKLY',
              domain_id: p.domain_id,
            }),
          ],
        });
      });

      expect(useWizardStore.getState().actionPlans).toHaveLength(2);

      // Step 7: Seguimiento (final step)
      useWizardStore.getState().setCurrentStep(7);

      // Verify final state
      const finalState = useWizardStore.getState();
      expect(finalState.currentStep).toBe(7);
      expect(finalState.title).toBe('Mi Rueda de la Vida Completa');
      expect(finalState.domains).toHaveLength(6);
      expect(finalState.scores).toHaveLength(6);
      expect(finalState.priorities).toHaveLength(6);
      expect(finalState.reflections).toHaveLength(6);
      expect(finalState.idealLife).toHaveLength(2);
      expect(finalState.actionPlans).toHaveLength(2);
      expect(finalState.isDirty).toBe(true);
    });

    it('should allow navigating back to edit previous steps', () => {
      // Setup basic wheel
      useWizardStore.getState().setWheelId('wheel-123');
      useWizardStore.getState().setCurrentStep(5);

      const domain = createMockDomain({ id: 'domain-1' });
      useWizardStore.getState().setDomains([domain]);
      useWizardStore.getState().updateScore('domain-1', 5);

      // Navigate back to step 1 (scores)
      useWizardStore.getState().setCurrentStep(1);

      // Edit the score
      useWizardStore.getState().updateScore('domain-1', 8);

      const state = useWizardStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.scores[0].score).toBe(8);
    });

    it('should track dirty state through all modifications', () => {
      useWizardStore.getState().setWheelId('wheel-123');
      expect(useWizardStore.getState().isDirty).toBe(false);

      // Each modification should mark as dirty
      useWizardStore.getState().setTitle('Test');
      expect(useWizardStore.getState().isDirty).toBe(true);

      useWizardStore.getState().markClean();
      expect(useWizardStore.getState().isDirty).toBe(false);

      useWizardStore.getState().addDomain(createMockDomain());
      expect(useWizardStore.getState().isDirty).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle wheel with minimum domains (4)', () => {
      useWizardStore.getState().setWheelId('wheel-min');

      for (let i = 0; i < 4; i++) {
        useWizardStore.getState().addDomain(
          createMockDomain({ id: `d-${i}`, name: `Domain ${i}`, order_position: i })
        );
      }

      const state = useWizardStore.getState();
      expect(state.domains).toHaveLength(4);
    });

    it('should handle wheel with maximum domains (10)', () => {
      useWizardStore.getState().setWheelId('wheel-max');

      for (let i = 0; i < 10; i++) {
        useWizardStore.getState().addDomain(
          createMockDomain({ id: `d-${i}`, name: `Domain ${i}`, order_position: i })
        );
      }

      const state = useWizardStore.getState();
      expect(state.domains).toHaveLength(10);
    });

    it('should handle all scores at 0', () => {
      useWizardStore.getState().setWheelId('wheel-zeros');

      const domains = ['A', 'B', 'C', 'D'].map((name, i) =>
        createMockDomain({ id: `d-${i}`, name, order_position: i })
      );
      useWizardStore.getState().setDomains(domains);

      domains.forEach(d => {
        useWizardStore.getState().updateScore(d.id, 0);
      });

      const state = useWizardStore.getState();
      state.scores.forEach(s => {
        expect(s.score).toBe(0);
      });
    });

    it('should handle all scores at 10', () => {
      useWizardStore.getState().setWheelId('wheel-tens');

      const domains = ['A', 'B', 'C', 'D'].map((name, i) =>
        createMockDomain({ id: `d-${i}`, name, order_position: i })
      );
      useWizardStore.getState().setDomains(domains);

      domains.forEach(d => {
        useWizardStore.getState().updateScore(d.id, 10);
      });

      const state = useWizardStore.getState();
      state.scores.forEach(s => {
        expect(s.score).toBe(10);
      });
    });

    it('should handle empty action plans', () => {
      useWizardStore.getState().setWheelId('wheel-123');

      useWizardStore.getState().updateActionPlan('domain-1', {
        goal_text: 'Meta sin acciones',
        target_score: 7,
        actions: [],
      });

      const state = useWizardStore.getState();
      expect(state.actionPlans[0].actions).toHaveLength(0);
    });

    it('should handle special characters in domain names', () => {
      useWizardStore.getState().setWheelId('wheel-special');

      const domain = createMockDomain({
        name: 'Crecimiento & Desarrollo (Personal)',
        icon: '🌱',
      });

      useWizardStore.getState().addDomain(domain);

      const state = useWizardStore.getState();
      expect(state.domains[0].name).toBe('Crecimiento & Desarrollo (Personal)');
    });

    it('should handle very long text in reflections', () => {
      useWizardStore.getState().setWheelId('wheel-long');

      const longText = 'A'.repeat(1000);
      useWizardStore.getState().updateReflection('surprise', longText);

      const state = useWizardStore.getState();
      expect(state.reflections[0].answer_text).toBe(longText);
    });
  });
});
