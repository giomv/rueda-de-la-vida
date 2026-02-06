/**
 * Integration tests for Dashboard Metas Summary
 * Tests the metas section which shows Plan de Vida milestones with metrics
 */

import { useDashboardStore } from '@/lib/stores/dashboard-store';
import type { MetasSummaryResponse, MetaSummaryItem } from '@/lib/types/dashboard';

const createMockMetaSummaryItem = (
  id: string,
  yearIndex: number,
  overrides?: Partial<MetaSummaryItem>
): MetaSummaryItem => ({
  id,
  milestoneId: id,
  goalId: `goal-${id}`,
  title: `Meta ${id}`,
  yearIndex,
  domainId: 'domain-1',
  domainName: 'Salud',
  actionsDoneCount: 5,
  actionsPendingCount: 3,
  spentTotal: 100,
  savedTotal: 50,
  ...overrides,
});

const createMockMetasSummaryResponse = (
  yearIndex: number = 1,
  metas?: MetaSummaryItem[]
): MetasSummaryResponse => ({
  planId: 'plan-123',
  odysseyId: 'odyssey-123',
  odysseyTitle: 'Mi Plan de Vida',
  availableYears: [1, 2, 3, 4, 5],
  selectedYearIndex: yearIndex,
  metas: metas !== undefined ? metas : [
    createMockMetaSummaryItem('meta-1', yearIndex),
    createMockMetaSummaryItem('meta-2', yearIndex),
  ],
});

describe('Dashboard Metas Summary', () => {
  beforeEach(() => {
    useDashboardStore.getState().reset();
  });

  describe('Store State Management', () => {
    it('should initialize with year index 1 by default', () => {
      const state = useDashboardStore.getState();
      expect(state.metasYearIndex).toBe(1);
    });

    it('should initialize with null metas summary', () => {
      const state = useDashboardStore.getState();
      expect(state.metasSummary).toBeNull();
    });

    it('should update metas year index', () => {
      useDashboardStore.getState().setMetasYearIndex(3);

      expect(useDashboardStore.getState().metasYearIndex).toBe(3);
    });

    it('should set metas summary data', () => {
      const mockData = createMockMetasSummaryResponse(1);
      useDashboardStore.getState().setMetasSummary(mockData);

      const state = useDashboardStore.getState();
      expect(state.metasSummary).toEqual(mockData);
      expect(state.metasSummary?.metas).toHaveLength(2);
    });

    it('should reset metas year index to 1 when clearing filters', () => {
      useDashboardStore.getState().setMetasYearIndex(4);
      useDashboardStore.getState().clearFilters();

      expect(useDashboardStore.getState().metasYearIndex).toBe(1);
    });
  });

  describe('Year Filter Functionality', () => {
    it('should filter metas by year 1 by default', () => {
      const year1Metas = [
        createMockMetaSummaryItem('meta-1', 1),
        createMockMetaSummaryItem('meta-2', 1),
      ];
      const mockData = createMockMetasSummaryResponse(1, year1Metas);
      useDashboardStore.getState().setMetasSummary(mockData);

      const state = useDashboardStore.getState();
      expect(state.metasSummary?.selectedYearIndex).toBe(1);
      expect(state.metasSummary?.metas.every(m => m.yearIndex === 1)).toBe(true);
    });

    it('should switch to different year', () => {
      useDashboardStore.getState().setMetasYearIndex(2);

      const year2Metas = [
        createMockMetaSummaryItem('meta-3', 2),
      ];
      const mockData = createMockMetasSummaryResponse(2, year2Metas);
      useDashboardStore.getState().setMetasSummary(mockData);

      const state = useDashboardStore.getState();
      expect(state.metasYearIndex).toBe(2);
      expect(state.metasSummary?.selectedYearIndex).toBe(2);
    });

    it('should show available years from response', () => {
      const mockData = createMockMetasSummaryResponse(1);
      useDashboardStore.getState().setMetasSummary(mockData);

      const state = useDashboardStore.getState();
      expect(state.metasSummary?.availableYears).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('Metrics Computation', () => {
    it('should have correct action counts per meta', () => {
      const metaWithActions = createMockMetaSummaryItem('meta-1', 1, {
        actionsDoneCount: 10,
        actionsPendingCount: 5,
      });
      const mockData = createMockMetasSummaryResponse(1, [metaWithActions]);
      useDashboardStore.getState().setMetasSummary(mockData);

      const state = useDashboardStore.getState();
      const meta = state.metasSummary?.metas[0];
      expect(meta?.actionsDoneCount).toBe(10);
      expect(meta?.actionsPendingCount).toBe(5);
    });

    it('should have correct financial totals per meta', () => {
      const metaWithFinance = createMockMetaSummaryItem('meta-1', 1, {
        spentTotal: 250,
        savedTotal: 150,
      });
      const mockData = createMockMetasSummaryResponse(1, [metaWithFinance]);
      useDashboardStore.getState().setMetasSummary(mockData);

      const state = useDashboardStore.getState();
      const meta = state.metasSummary?.metas[0];
      expect(meta?.spentTotal).toBe(250);
      expect(meta?.savedTotal).toBe(150);
    });

    it('should handle metas without imported goals', () => {
      const metaWithoutGoal = createMockMetaSummaryItem('meta-1', 1, {
        goalId: null,
        actionsDoneCount: 0,
        actionsPendingCount: 0,
        spentTotal: 0,
        savedTotal: 0,
      });
      const mockData = createMockMetasSummaryResponse(1, [metaWithoutGoal]);
      useDashboardStore.getState().setMetasSummary(mockData);

      const state = useDashboardStore.getState();
      const meta = state.metasSummary?.metas[0];
      expect(meta?.goalId).toBeNull();
      expect(meta?.actionsDoneCount).toBe(0);
      expect(meta?.spentTotal).toBe(0);
    });
  });

  describe('Empty State', () => {
    it('should handle empty metas for selected year', () => {
      const mockData = createMockMetasSummaryResponse(3, []);
      useDashboardStore.getState().setMetasSummary(mockData);

      const state = useDashboardStore.getState();
      expect(state.metasSummary?.metas).toHaveLength(0);
    });

    it('should handle no active Plan de Vida', () => {
      const mockData: MetasSummaryResponse = {
        planId: null,
        odysseyId: null,
        odysseyTitle: null,
        availableYears: [],
        selectedYearIndex: 1,
        metas: [],
      };
      useDashboardStore.getState().setMetasSummary(mockData);

      const state = useDashboardStore.getState();
      expect(state.metasSummary?.odysseyId).toBeNull();
      expect(state.metasSummary?.availableYears).toHaveLength(0);
    });
  });

  describe('Integration with Global Filters', () => {
    it('should preserve metas data when changing global month filter', () => {
      const mockData = createMockMetasSummaryResponse(1);
      useDashboardStore.getState().setMetasSummary(mockData);
      useDashboardStore.getState().setMonth(3);

      // Metas data persists until refetch
      expect(useDashboardStore.getState().metasSummary).not.toBeNull();
    });

    it('should preserve year index when changing global domain filter', () => {
      useDashboardStore.getState().setMetasYearIndex(2);
      useDashboardStore.getState().setDomainId('domain-xyz');

      expect(useDashboardStore.getState().metasYearIndex).toBe(2);
    });

    it('should preserve year index when changing global goal filter', () => {
      useDashboardStore.getState().setMetasYearIndex(3);
      useDashboardStore.getState().setGoalId('goal-123');

      expect(useDashboardStore.getState().metasYearIndex).toBe(3);
    });
  });

  describe('Hydration', () => {
    it('should hydrate metas data along with other dashboard data', () => {
      const mockMetasSummary = createMockMetasSummaryResponse(2);

      useDashboardStore.getState().hydrate({
        metasSummary: mockMetasSummary,
        metasYearIndex: 2,
      });

      const state = useDashboardStore.getState();
      expect(state.metasSummary?.selectedYearIndex).toBe(2);
      expect(state.metasYearIndex).toBe(2);
    });
  });
});

describe('MetaSummaryItem Type', () => {
  it('should have all required fields', () => {
    const meta: MetaSummaryItem = {
      id: 'meta-1',
      milestoneId: 'milestone-1',
      goalId: 'goal-1',
      title: 'Test Meta',
      yearIndex: 1,
      domainId: 'domain-1',
      domainName: 'Salud',
      actionsDoneCount: 0,
      actionsPendingCount: 0,
      spentTotal: 0,
      savedTotal: 0,
    };

    expect(meta.id).toBeDefined();
    expect(meta.milestoneId).toBeDefined();
    expect(meta.title).toBeDefined();
    expect(meta.yearIndex).toBeDefined();
    expect(typeof meta.actionsDoneCount).toBe('number');
    expect(typeof meta.actionsPendingCount).toBe('number');
    expect(typeof meta.spentTotal).toBe('number');
    expect(typeof meta.savedTotal).toBe('number');
  });

  it('should allow null goalId for unimported milestones', () => {
    const meta: MetaSummaryItem = {
      id: 'meta-1',
      milestoneId: 'milestone-1',
      goalId: null,
      title: 'Unimported Meta',
      yearIndex: 1,
      domainId: null,
      domainName: null,
      actionsDoneCount: 0,
      actionsPendingCount: 0,
      spentTotal: 0,
      savedTotal: 0,
    };

    expect(meta.goalId).toBeNull();
    expect(meta.domainId).toBeNull();
  });
});

describe('MetaCard KPI Calculations (Domain-style format)', () => {
  // Helper to calculate completion rate (matches MetaCard implementation)
  const calculateCompletionRate = (done: number, pending: number): number => {
    const total = done + pending;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  // Helper to determine status from completion rate (matches MetaCard implementation)
  const getStatusFromCompletionRate = (rate: number): 'on-track' | 'at-risk' | 'behind' => {
    if (rate >= 80) return 'on-track';
    if (rate >= 50) return 'at-risk';
    return 'behind';
  };

  describe('Completion Rate (% avance)', () => {
    it('should calculate 0% when no actions exist', () => {
      const rate = calculateCompletionRate(0, 0);
      expect(rate).toBe(0);
    });

    it('should calculate 100% when all actions are done', () => {
      const rate = calculateCompletionRate(10, 0);
      expect(rate).toBe(100);
    });

    it('should calculate 0% when no actions are done', () => {
      const rate = calculateCompletionRate(0, 10);
      expect(rate).toBe(0);
    });

    it('should calculate correct percentage for partial completion', () => {
      // 5 done, 3 pending = 5/8 = 62.5% -> rounds to 63%
      const rate = calculateCompletionRate(5, 3);
      expect(rate).toBe(63);
    });

    it('should round to nearest integer', () => {
      // 1 done, 2 pending = 1/3 = 33.33% -> rounds to 33%
      const rate = calculateCompletionRate(1, 2);
      expect(rate).toBe(33);
    });
  });

  describe('Status Badge (matches Domain thresholds)', () => {
    it('should return on-track for rate >= 80%', () => {
      expect(getStatusFromCompletionRate(80)).toBe('on-track');
      expect(getStatusFromCompletionRate(100)).toBe('on-track');
      expect(getStatusFromCompletionRate(85)).toBe('on-track');
    });

    it('should return at-risk for rate >= 50% and < 80%', () => {
      expect(getStatusFromCompletionRate(50)).toBe('at-risk');
      expect(getStatusFromCompletionRate(65)).toBe('at-risk');
      expect(getStatusFromCompletionRate(79)).toBe('at-risk');
    });

    it('should return behind for rate < 50%', () => {
      expect(getStatusFromCompletionRate(0)).toBe('behind');
      expect(getStatusFromCompletionRate(25)).toBe('behind');
      expect(getStatusFromCompletionRate(49)).toBe('behind');
    });
  });

  describe('Actions Display (X/Y format like Domains)', () => {
    it('should display actions in X/Y format', () => {
      const meta = createMockMetaSummaryItem('meta-1', 1, {
        actionsDoneCount: 5,
        actionsPendingCount: 3,
      });
      const total = meta.actionsDoneCount + meta.actionsPendingCount;
      const display = `${meta.actionsDoneCount}/${total} acciones`;
      expect(display).toBe('5/8 acciones');
    });

    it('should handle zero actions', () => {
      const meta = createMockMetaSummaryItem('meta-1', 1, {
        actionsDoneCount: 0,
        actionsPendingCount: 0,
      });
      const total = meta.actionsDoneCount + meta.actionsPendingCount;
      const display = `${meta.actionsDoneCount}/${total} acciones`;
      expect(display).toBe('0/0 acciones');
    });
  });

  describe('Finance Display (S/ currency)', () => {
    it('should have spentTotal and savedTotal for finance KPIs', () => {
      const meta = createMockMetaSummaryItem('meta-1', 1, {
        spentTotal: 150.50,
        savedTotal: 200.00,
      });
      expect(meta.spentTotal).toBe(150.50);
      expect(meta.savedTotal).toBe(200.00);
    });

    it('should handle zero finance values', () => {
      const meta = createMockMetaSummaryItem('meta-1', 1, {
        spentTotal: 0,
        savedTotal: 0,
      });
      expect(meta.spentTotal).toBe(0);
      expect(meta.savedTotal).toBe(0);
    });
  });

  describe('Card Structure Parity with DomainSummaryCard', () => {
    it('should support status calculation like DomainSummaryCard', () => {
      // Meta with 80% completion should be on-track (like domains)
      const meta = createMockMetaSummaryItem('meta-1', 1, {
        actionsDoneCount: 8,
        actionsPendingCount: 2,
      });
      const rate = calculateCompletionRate(meta.actionsDoneCount, meta.actionsPendingCount);
      const status = getStatusFromCompletionRate(rate);
      expect(rate).toBe(80);
      expect(status).toBe('on-track');
    });

    it('should have yearIndex for optional Año label', () => {
      const meta = createMockMetaSummaryItem('meta-1', 3);
      expect(meta.yearIndex).toBe(3);
    });
  });
});

describe('MetasSummaryResponse Type', () => {
  it('should have all required fields', () => {
    const response: MetasSummaryResponse = {
      planId: 'plan-1',
      odysseyId: 'odyssey-1',
      odysseyTitle: 'Test Plan',
      availableYears: [1, 2, 3],
      selectedYearIndex: 1,
      metas: [],
    };

    expect(response.planId).toBeDefined();
    expect(response.odysseyId).toBeDefined();
    expect(response.availableYears).toBeDefined();
    expect(response.selectedYearIndex).toBeDefined();
    expect(response.metas).toBeDefined();
  });

  it('should allow null values when no Plan de Vida exists', () => {
    const response: MetasSummaryResponse = {
      planId: null,
      odysseyId: null,
      odysseyTitle: null,
      availableYears: [],
      selectedYearIndex: 1,
      metas: [],
    };

    expect(response.planId).toBeNull();
    expect(response.odysseyId).toBeNull();
    expect(response.odysseyTitle).toBeNull();
  });
});
