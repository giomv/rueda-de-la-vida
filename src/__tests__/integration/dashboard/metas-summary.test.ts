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
