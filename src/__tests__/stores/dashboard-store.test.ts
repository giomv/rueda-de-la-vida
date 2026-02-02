/**
 * Tests for dashboard store
 * Tests activity feed pagination state management
 */

import { useDashboardStore } from '@/lib/stores/dashboard-store';
import type { ActivityFeedItem } from '@/lib/types/dashboard';

// Mock activity items factory
function createActivityItems(count: number, startIndex = 0): ActivityFeedItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${startIndex + i}`,
    type: 'action_completed' as const,
    title: `Activity ${startIndex + i}`,
    timestamp: new Date(Date.now() - (startIndex + i) * 1000 * 60 * 60).toISOString(),
  }));
}

describe('dashboard-store', () => {
  beforeEach(() => {
    useDashboardStore.getState().reset();
  });

  describe('initialization', () => {
    it('should initialize with empty activity feed', () => {
      const state = useDashboardStore.getState();
      expect(state.activityFeed).toEqual([]);
      expect(state.activityNextCursor).toBeNull();
      expect(state.activityHasMore).toBe(false);
      expect(state.isLoadingMoreActivity).toBe(false);
    });
  });

  describe('activity feed pagination', () => {
    it('should set activity feed with initial items', () => {
      const items = createActivityItems(10);
      useDashboardStore.getState().setActivityFeed(items);

      const state = useDashboardStore.getState();
      expect(state.activityFeed).toHaveLength(10);
      expect(state.activityFeed[0].id).toBe('item-0');
    });

    it('should set activity cursor', () => {
      const cursor = '2024-01-15T12:00:00.000Z';
      useDashboardStore.getState().setActivityNextCursor(cursor);

      const state = useDashboardStore.getState();
      expect(state.activityNextCursor).toBe(cursor);
    });

    it('should set activity hasMore flag', () => {
      useDashboardStore.getState().setActivityHasMore(true);
      expect(useDashboardStore.getState().activityHasMore).toBe(true);

      useDashboardStore.getState().setActivityHasMore(false);
      expect(useDashboardStore.getState().activityHasMore).toBe(false);
    });

    it('should append activity items', () => {
      // Set initial items
      const initialItems = createActivityItems(10);
      useDashboardStore.getState().setActivityFeed(initialItems);

      // Append more items
      const moreItems = createActivityItems(10, 10);
      useDashboardStore.getState().appendActivityFeed(moreItems);

      const state = useDashboardStore.getState();
      expect(state.activityFeed).toHaveLength(20);
      expect(state.activityFeed[0].id).toBe('item-0');
      expect(state.activityFeed[10].id).toBe('item-10');
      expect(state.activityFeed[19].id).toBe('item-19');
    });

    it('should set loading more activity flag', () => {
      useDashboardStore.getState().setIsLoadingMoreActivity(true);
      expect(useDashboardStore.getState().isLoadingMoreActivity).toBe(true);

      useDashboardStore.getState().setIsLoadingMoreActivity(false);
      expect(useDashboardStore.getState().isLoadingMoreActivity).toBe(false);
    });
  });

  describe('hydrate', () => {
    it('should hydrate activity feed with pagination state', () => {
      const items = createActivityItems(10);
      const cursor = '2024-01-15T12:00:00.000Z';

      useDashboardStore.getState().hydrate({
        activityFeed: items,
        activityNextCursor: cursor,
        activityHasMore: true,
      });

      const state = useDashboardStore.getState();
      expect(state.activityFeed).toHaveLength(10);
      expect(state.activityNextCursor).toBe(cursor);
      expect(state.activityHasMore).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset activity pagination state', () => {
      // Set some state
      useDashboardStore.getState().setActivityFeed(createActivityItems(10));
      useDashboardStore.getState().setActivityNextCursor('cursor');
      useDashboardStore.getState().setActivityHasMore(true);
      useDashboardStore.getState().setIsLoadingMoreActivity(true);

      // Reset
      useDashboardStore.getState().reset();

      const state = useDashboardStore.getState();
      expect(state.activityFeed).toEqual([]);
      expect(state.activityNextCursor).toBeNull();
      expect(state.activityHasMore).toBe(false);
      expect(state.isLoadingMoreActivity).toBe(false);
    });
  });

  describe('filters reset pagination', () => {
    it('should maintain correct order after filter change', () => {
      // When filters change, the activity feed is completely replaced
      // This simulates the behavior in useDashboard hook
      const items = createActivityItems(10);
      useDashboardStore.getState().hydrate({
        activityFeed: items,
        activityNextCursor: 'some-cursor',
        activityHasMore: true,
      });

      // Simulate filter change by hydrating with new data
      const newItems = createActivityItems(5, 100);
      useDashboardStore.getState().hydrate({
        activityFeed: newItems,
        activityNextCursor: 'new-cursor',
        activityHasMore: false,
      });

      const state = useDashboardStore.getState();
      expect(state.activityFeed).toHaveLength(5);
      expect(state.activityFeed[0].id).toBe('item-100');
      expect(state.activityNextCursor).toBe('new-cursor');
      expect(state.activityHasMore).toBe(false);
    });
  });
});
