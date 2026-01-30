'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface FeedSkeletonProps {
  count?: number;
}

export function FeedSkeleton({ count = 5 }: FeedSkeletonProps) {
  return (
    <Card>
      <CardContent className="py-3 space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-2">
            <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
