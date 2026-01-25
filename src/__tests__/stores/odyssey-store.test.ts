import { useOdysseyStore } from '@/lib/stores/odyssey-store';
import type { OdysseyFeedback, LifeDomain, OdysseyMilestone } from '@/lib/types';

describe('odyssey-store', () => {
  beforeEach(() => {
    // Reset the store before each test
    useOdysseyStore.getState().reset();
  });

  describe('feedback state', () => {
    const planId = 'plan-123';

    it('should initialize with empty feedback', () => {
      const state = useOdysseyStore.getState();
      expect(state.feedback).toEqual({});
    });

    it('should set feedback for a plan', () => {
      const feedback: OdysseyFeedback[] = [
        {
          id: 'feedback-1',
          plan_id: planId,
          person_name: 'Juan',
          feedback_text: 'Great plan!',
          order_position: 0,
          created_at: new Date().toISOString(),
        },
      ];

      useOdysseyStore.getState().setFeedback(planId, feedback);

      const state = useOdysseyStore.getState();
      expect(state.feedback[planId]).toEqual(feedback);
    });

    it('should add feedback to a plan', () => {
      useOdysseyStore.getState().addFeedback(planId);

      const state = useOdysseyStore.getState();
      expect(state.feedback[planId]).toHaveLength(1);
      expect(state.feedback[planId][0].person_name).toBe('');
      expect(state.feedback[planId][0].feedback_text).toBe('');
      expect(state.isDirty).toBe(true);
    });

    it('should update feedback at specific index', () => {
      // First add feedback
      useOdysseyStore.getState().addFeedback(planId);

      // Then update it
      useOdysseyStore.getState().updateFeedback(planId, 0, {
        person_name: 'Maria',
        feedback_text: 'Very insightful',
      });

      const state = useOdysseyStore.getState();
      expect(state.feedback[planId][0].person_name).toBe('Maria');
      expect(state.feedback[planId][0].feedback_text).toBe('Very insightful');
    });

    it('should remove feedback at specific index', () => {
      // Add two feedback items
      useOdysseyStore.getState().addFeedback(planId);
      useOdysseyStore.getState().addFeedback(planId);

      // Update first one to identify it
      useOdysseyStore.getState().updateFeedback(planId, 0, { person_name: 'First' });
      useOdysseyStore.getState().updateFeedback(planId, 1, { person_name: 'Second' });

      // Remove first one
      useOdysseyStore.getState().removeFeedback(planId, 0);

      const state = useOdysseyStore.getState();
      expect(state.feedback[planId]).toHaveLength(1);
      expect(state.feedback[planId][0].person_name).toBe('Second');
    });
  });

  describe('domains state', () => {
    it('should initialize with empty domains', () => {
      const state = useOdysseyStore.getState();
      expect(state.domains).toEqual([]);
    });

    it('should set domains', () => {
      const domains: LifeDomain[] = [
        {
          id: 'domain-1',
          user_id: 'user-123',
          name: 'Personal',
          slug: 'personal',
          icon: '🌱',
          order_position: 0,
          created_at: new Date().toISOString(),
        },
        {
          id: 'domain-2',
          user_id: 'user-123',
          name: 'Carrera',
          slug: 'carrera',
          icon: '💼',
          order_position: 1,
          created_at: new Date().toISOString(),
        },
      ];

      useOdysseyStore.getState().setDomains(domains);

      const state = useOdysseyStore.getState();
      expect(state.domains).toEqual(domains);
      expect(state.domains).toHaveLength(2);
    });
  });

  describe('milestones with domain_id', () => {
    const planId = 'plan-123';

    it('should add milestone with domain_id', () => {
      const milestone: OdysseyMilestone = {
        id: 'milestone-1',
        plan_id: planId,
        year: 1,
        category: null,
        domain_id: 'domain-1',
        title: 'Launch business',
        description: 'Start my own company',
        tag: 'normal',
        order_position: 0,
        created_at: new Date().toISOString(),
      };

      useOdysseyStore.getState().addMilestone(planId, milestone);

      const state = useOdysseyStore.getState();
      expect(state.milestones[planId]).toHaveLength(1);
      expect(state.milestones[planId][0].domain_id).toBe('domain-1');
      expect(state.milestones[planId][0].category).toBeNull();
    });

    it('should update milestone domain_id', () => {
      const milestone: OdysseyMilestone = {
        id: 'milestone-1',
        plan_id: planId,
        year: 1,
        category: 'personal',
        domain_id: null,
        title: 'Learn new skill',
        description: null,
        tag: null,
        order_position: 0,
        created_at: new Date().toISOString(),
      };

      useOdysseyStore.getState().addMilestone(planId, milestone);
      useOdysseyStore.getState().updateMilestone('milestone-1', {
        domain_id: 'domain-2',
        category: null,
      });

      const state = useOdysseyStore.getState();
      expect(state.milestones[planId][0].domain_id).toBe('domain-2');
      expect(state.milestones[planId][0].category).toBeNull();
    });
  });

  describe('hydrate', () => {
    it('should hydrate feedback data', () => {
      const planId = 'plan-123';
      const feedback: OdysseyFeedback[] = [
        {
          id: 'feedback-1',
          plan_id: planId,
          person_name: 'Test Person',
          feedback_text: 'Test feedback',
          order_position: 0,
          created_at: new Date().toISOString(),
        },
      ];

      useOdysseyStore.getState().hydrate({
        feedback: { [planId]: feedback },
      });

      const state = useOdysseyStore.getState();
      expect(state.feedback[planId]).toEqual(feedback);
      expect(state.isDirty).toBe(false);
    });
  });
});
