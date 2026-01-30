'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import type { PendingItem } from '@/lib/types/dashboard';

interface PendingCardProps {
  item: PendingItem;
}

export function PendingCard({ item }: PendingCardProps) {
  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <h4 className="font-medium text-sm">{item.title}</h4>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              {item.description}
            </p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href={item.ctaHref}>
              {item.ctaLabel}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
