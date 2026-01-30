'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
