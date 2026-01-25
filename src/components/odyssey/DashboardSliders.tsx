'use client';

import { Slider } from '@/components/ui/slider';
import { DASHBOARD_SLIDERS } from '@/lib/types';
import type { OdysseyPlan } from '@/lib/types';

interface DashboardSlidersProps {
  plan: OdysseyPlan;
  onChange: (key: 'energy_score' | 'confidence_score' | 'resources_score', value: number) => void;
}

export function DashboardSliders({ plan, onChange }: DashboardSlidersProps) {
  return (
    <div className="space-y-6">
      {DASHBOARD_SLIDERS.map((slider) => {
        const value = plan[slider.key] ?? 5;
        return (
          <div key={slider.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{slider.label}</p>
                <p className="text-xs text-muted-foreground">{slider.description}</p>
              </div>
              <span className="text-lg font-bold text-primary w-8 text-right">{value}</span>
            </div>
            <Slider
              value={[value]}
              onValueChange={([v]) => onChange(slider.key, v)}
              min={0}
              max={10}
              step={1}
              className="w-full"
            />
          </div>
        );
      })}
    </div>
  );
}
