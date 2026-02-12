'use client';

import type { ProblemContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: ProblemContent;
}

export function ProblemSection({ content }: Props) {
  return (
    <Section id={content.id} alt>
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">
          {content.title}
        </h2>

        <div className="space-y-1 mb-8">
          {content.negations.map((line) => (
            <p key={line} className="text-muted-foreground">
              {line}
            </p>
          ))}
          <p className="font-semibold text-foreground pt-2">
            {content.revelation}
          </p>
        </div>

        <ul className="space-y-3 text-left max-w-md mx-auto mb-8">
          {content.painPoints.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2 text-muted-foreground text-sm"
            >
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
              {point}
            </li>
          ))}
        </ul>

        <p className="font-semibold text-lg">{content.close}</p>
      </div>
    </Section>
  );
}
