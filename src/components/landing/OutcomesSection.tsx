'use client';

import { Check } from 'lucide-react';
import type { OutcomesContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: OutcomesContent;
}

export function OutcomesSection({ content }: Props) {
  return (
    <Section id={content.id} alt>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
        {content.title}
      </h2>
      <ul className="space-y-4 max-w-lg mx-auto">
        {content.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-3 text-sm">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
