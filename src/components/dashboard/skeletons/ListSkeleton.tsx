'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ListSkeletonProps {
  count?: number;
}

export function ListSkeleton({ count = 3 }: ListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
