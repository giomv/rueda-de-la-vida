'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function GridSkeleton() {
  return (
    <div className="space-y-4">
      {/* Daily Grid Skeleton */}
      <div className="rounded-lg border bg-card p-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-24 flex-shrink-0" />
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, j) => (
                  <Skeleton key={j} className="h-3 w-3 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly + Monthly Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-24 flex-shrink-0" />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-3 w-3 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-24 flex-shrink-0" />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-3 w-3 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Once Grid Skeleton */}
      <div className="rounded-lg border bg-card p-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-24 flex-shrink-0" />
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
