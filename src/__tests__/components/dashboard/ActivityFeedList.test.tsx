/**
 * Tests for ActivityFeedList component
 * Tests pagination, empty states, and "Ver más" functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityFeedList } from '@/components/dashboard/ActivityFeed/ActivityFeedList';
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

describe('ActivityFeedList', () => {
  describe('empty state', () => {
    it('should show empty message when no items', () => {
      render(<ActivityFeedList items={[]} />);

      expect(screen.getByText('Aún no tienes actividad reciente.')).toBeTruthy();
    });

    it('should not show "Ver más" button when empty', () => {
      render(<ActivityFeedList items={[]} hasMore={true} onLoadMore={jest.fn()} />);

      expect(screen.queryByText('Ver más')).toBeNull();
    });
  });

  describe('initial render', () => {
    it('should render exactly 10 items initially', () => {
      const items = createActivityItems(10);
      render(<ActivityFeedList items={items} />);

      // Check that all 10 items are rendered
      items.forEach(item => {
        expect(screen.getByText(item.title)).toBeTruthy();
      });
    });

    it('should render items in order', () => {
      const items = createActivityItems(5);
      render(<ActivityFeedList items={items} />);

      const activityElements = screen.getAllByText(/Activity \d/);
      expect(activityElements).toHaveLength(5);
    });
  });

  describe('Ver más button', () => {
    it('should show "Ver más" button when hasMore is true', () => {
      const items = createActivityItems(10);
      const onLoadMore = jest.fn();

      render(
        <ActivityFeedList
          items={items}
          hasMore={true}
          onLoadMore={onLoadMore}
        />
      );

      expect(screen.getByText('Ver más')).toBeTruthy();
    });

    it('should call onLoadMore when "Ver más" is clicked', () => {
      const items = createActivityItems(10);
      const onLoadMore = jest.fn();

      render(
        <ActivityFeedList
          items={items}
          hasMore={true}
          onLoadMore={onLoadMore}
        />
      );

      fireEvent.click(screen.getByText('Ver más'));
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when isLoadingMore is true', () => {
      const items = createActivityItems(10);
      const onLoadMore = jest.fn();

      render(
        <ActivityFeedList
          items={items}
          hasMore={true}
          isLoadingMore={true}
          onLoadMore={onLoadMore}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveProperty('disabled', true);
      expect(screen.getByText('Cargando...')).toBeTruthy();
    });

    it('should hide "Ver más" when hasMore is false', () => {
      const items = createActivityItems(10);

      render(
        <ActivityFeedList
          items={items}
          hasMore={false}
          onLoadMore={jest.fn()}
        />
      );

      expect(screen.queryByText('Ver más')).toBeNull();
    });
  });

  describe('end state', () => {
    it('should show end message when hasMore is false and has items', () => {
      const items = createActivityItems(10);

      render(
        <ActivityFeedList
          items={items}
          hasMore={false}
        />
      );

      expect(screen.getByText('No hay más actividad.')).toBeTruthy();
    });

    it('should not show end message when list is empty', () => {
      render(
        <ActivityFeedList
          items={[]}
          hasMore={false}
        />
      );

      expect(screen.queryByText('No hay más actividad.')).toBeNull();
    });
  });

  describe('loading more items', () => {
    it('should append new items when loading more', () => {
      // Initial 10 items
      const initialItems = createActivityItems(10);
      const { rerender } = render(
        <ActivityFeedList
          items={initialItems}
          hasMore={true}
          onLoadMore={jest.fn()}
        />
      );

      expect(screen.getAllByText(/Activity \d/).length).toBe(10);

      // After loading more - 20 items total
      const moreItems = createActivityItems(20);
      rerender(
        <ActivityFeedList
          items={moreItems}
          hasMore={true}
          onLoadMore={jest.fn()}
        />
      );

      expect(screen.getAllByText(/Activity \d+/).length).toBe(20);
    });
  });
});
