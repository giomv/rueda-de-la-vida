'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Copy } from 'lucide-react';
import { PLAN_TYPES, ODYSSEY_WIZARD_STEPS } from '@/lib/types';
import type { OdysseyWithPlans } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OdysseyCardProps {
  odyssey: OdysseyWithPlans;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function OdysseyCard({ odyssey, onDelete, onDuplicate }: OdysseyCardProps) {
  const stepIndex = ODYSSEY_WIZARD_STEPS.findIndex((s) => s.key === odyssey.current_step);
  const progress = Math.round(((stepIndex + 1) / ODYSSEY_WIZARD_STEPS.length) * 100);
  const activePlan = odyssey.active_plan_number
    ? PLAN_TYPES.find((p) => p.number === odyssey.active_plan_number)
    : null;

  const nextStep = odyssey.current_step || 'plan-1';
  const href = `/plan-de-vida/${odyssey.id}/${nextStep}`;

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={href} className="flex-1 min-w-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{odyssey.title}</h3>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {odyssey.mode === 'pareja' ? 'Pareja' : 'Individual'}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{new Date(odyssey.created_at).toLocaleDateString('es')}</span>
                {activePlan && (
                  <Badge variant="secondary" className="text-xs">
                    {activePlan.title}
                  </Badge>
                )}
              </div>

              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
