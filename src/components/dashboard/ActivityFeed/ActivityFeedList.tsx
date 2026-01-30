'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ActivityFeedItem } from './ActivityFeedItem';
import type { ActivityFeedItem as ActivityFeedItemType } from '@/lib/types/dashboard';

interface ActivityFeedListProps {
  items: ActivityFeedItemType[];
}

export function ActivityFeedList({ items }: ActivityFeedListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Sin actividad reciente</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="py-3 divide-y">
        {items.map((item) => (
          <ActivityFeedItem key={item.id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}
