/**
 * Type tests for odyssey-related types
 * These tests verify the structure and constraints of our TypeScript interfaces
 */

import type {
  OdysseyFeedback,
  OdysseyMilestone,
  OdysseyPrototype,
  PlanWithMilestones,
  LifeDomain,
} from '@/lib/types';

describe('OdysseyFeedback type', () => {
  it('accepts valid feedback object', () => {
    const feedback: OdysseyFeedback = {
      id: 'feedback-123',
      plan_id: 'plan-456',
      person_name: 'Juan Garcia',
      feedback_text: 'This is great feedback!',
      order_position: 0,
      created_at: new Date().toISOString(),
    };

    expect(feedback.id).toBe('feedback-123');
    expect(feedback.person_name).toBe('Juan Garcia');
    expect(feedback.feedback_text).toBe('This is great feedback!');
  });

  it('accepts empty person_name', () => {
    const feedback: OdysseyFeedback = {
      id: 'feedback-123',
      plan_id: 'plan-456',
      person_name: '',
      feedback_text: 'Anonymous feedback',
      order_position: 0,
      created_at: new Date().toISOString(),
    };

    expect(feedback.person_name).toBe('');
  });
});

describe('OdysseyMilestone type', () => {
  it('accepts milestone with domain_id', () => {
    const milestone: OdysseyMilestone = {
      id: 'milestone-123',
      plan_id: 'plan-456',
      year: 1,
      category: null,
      domain_id: 'domain-789',
      title: 'Complete project',
      description: 'A detailed description',
      tag: 'normal',
      order_position: 0,
      created_at: new Date().toISOString(),
    };

    expect(milestone.domain_id).toBe('domain-789');
    expect(milestone.category).toBeNull();
  });

  it('accepts milestone with category (legacy)', () => {
    const milestone: OdysseyMilestone = {
      id: 'milestone-123',
      plan_id: 'plan-456',
      year: 2,
      category: 'career',
      domain_id: null,
      title: 'Get promotion',
      description: null,
      tag: null,
      order_position: 1,
      created_at: new Date().toISOString(),
    };

    expect(milestone.category).toBe('career');
    expect(milestone.domain_id).toBeNull();
  });

  it('accepts all valid categories', () => {
    const categories: Array<OdysseyMilestone['category']> = [
      'personal',
      'career',
      'health',
      'finance',
      'couple',
      'other',
      null,
    ];

    categories.forEach((category) => {
      const milestone: OdysseyMilestone = {
        id: 'test',
        plan_id: 'test',
        year: 1,
        category,
        domain_id: null,
        title: 'Test',
        description: null,
        tag: null,
        order_position: 0,
        created_at: new Date().toISOString(),
      };

      expect(milestone.category).toBe(category);
    });
  });

  it('accepts all valid tags', () => {
    const tags: Array<OdysseyMilestone['tag']> = [
      'normal',
      'wild',
      'experiment',
      null,
    ];

    tags.forEach((tag) => {
      const milestone: OdysseyMilestone = {
        id: 'test',
        plan_id: 'test',
        year: 1,
        category: null,
        domain_id: null,
        title: 'Test',
        description: null,
        tag,
        order_position: 0,
        created_at: new Date().toISOString(),
      };

      expect(milestone.tag).toBe(tag);
    });
  });

  it('accepts years 1-5', () => {
    [1, 2, 3, 4, 5].forEach((year) => {
      const milestone: OdysseyMilestone = {
        id: 'test',
        plan_id: 'test',
        year,
        category: null,
        domain_id: null,
        title: 'Test',
        description: null,
        tag: null,
        order_position: 0,
        created_at: new Date().toISOString(),
      };

      expect(milestone.year).toBe(year);
    });
  });
});

describe('OdysseyPrototype type', () => {
  it('accepts prototype with target_milestone_id', () => {
    const prototype: OdysseyPrototype = {
      id: 'proto-123',
      odyssey_id: 'odyssey-456',
      plan_id: 'plan-789',
      target_milestone_id: 'milestone-abc',
      start_date: '2024-01-01',
      status: 'active',
      reflection_learned: null,
      reflection_adjust: null,
      reflection_next_step: null,
      created_at: new Date().toISOString(),
    };

    expect(prototype.target_milestone_id).toBe('milestone-abc');
  });

  it('accepts prototype without target_milestone_id', () => {
    const prototype: OdysseyPrototype = {
      id: 'proto-123',
      odyssey_id: 'odyssey-456',
      plan_id: 'plan-789',
      target_milestone_id: null,
      start_date: '2024-01-01',
      status: 'active',
      reflection_learned: null,
      reflection_adjust: null,
      reflection_next_step: null,
      created_at: new Date().toISOString(),
    };

    expect(prototype.target_milestone_id).toBeNull();
  });

  it('accepts all valid statuses', () => {
    const statuses: Array<OdysseyPrototype['status']> = [
      'active',
      'completed',
      'abandoned',
    ];

    statuses.forEach((status) => {
      const prototype: OdysseyPrototype = {
        id: 'test',
        odyssey_id: 'test',
        plan_id: 'test',
        target_milestone_id: null,
        start_date: '2024-01-01',
        status,
        reflection_learned: null,
        reflection_adjust: null,
        reflection_next_step: null,
        created_at: new Date().toISOString(),
      };

      expect(prototype.status).toBe(status);
    });
  });
});

describe('PlanWithMilestones type', () => {
  it('includes feedback array', () => {
    const plan: PlanWithMilestones = {
      id: 'plan-123',
      odyssey_id: 'odyssey-456',
      plan_number: 1,
      headline: 'My Plan',
      energy_score: 8,
      confidence_score: 7,
      resources_score: 6,
      excitement_text: 'Very excited!',
      concern_text: 'Some concerns',
      year_names: { '1': 'Foundation' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      milestones: [],
      feedback: [],
    };

    expect(plan.feedback).toBeDefined();
    expect(Array.isArray(plan.feedback)).toBe(true);
  });
});

describe('LifeDomain type', () => {
  it('accepts valid domain object', () => {
    const domain: LifeDomain = {
      id: 'domain-123',
      user_id: 'user-456',
      name: 'Personal',
      slug: 'personal',
      icon: '🌱',
      order_position: 0,
      created_at: new Date().toISOString(),
    };

    expect(domain.id).toBe('domain-123');
    expect(domain.name).toBe('Personal');
    expect(domain.slug).toBe('personal');
    expect(domain.icon).toBe('🌱');
  });

  it('accepts domain with null icon', () => {
    const domain: LifeDomain = {
      id: 'domain-123',
      user_id: 'user-456',
      name: 'Custom Domain',
      slug: 'custom-domain',
      icon: null,
      order_position: 0,
      created_at: new Date().toISOString(),
    };

    expect(domain.icon).toBeNull();
  });
});
