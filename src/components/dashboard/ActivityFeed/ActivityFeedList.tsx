'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ActivityFeedItem } from './ActivityFeedItem';
import type { ActivityFeedItem as ActivityFeedItemType } from '@/lib/types/dashboard';

interface ActivityFeedListProps {
  items: ActivityFeedItemType[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export function ActivityFeedList({
  items,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: ActivityFeedListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aún no tienes actividad reciente.</p>
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

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="px-4 pb-4">
          <Button
            variant="ghost"
            className="w-full"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              'Ver más'
            )}
          </Button>
        </div>
      )}

      {/* End State */}
      {!hasMore && items.length > 0 && (
        <div className="px-4 pb-4 text-center text-sm text-muted-foreground">
          No hay más actividad.
        </div>
      )}
    </Card>
  );
}
