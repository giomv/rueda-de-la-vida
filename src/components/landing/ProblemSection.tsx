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

        <div className="space-y-3 text-center max-w-md mx-auto mb-8">
          {content.painPoints.map((point) => (
            <p key={point} className="text-muted-foreground text-sm">
              {point}
            </p>
          ))}
        </div>

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

        <p className="font-semibold text-lg">{content.close}</p>
      </div>
    </Section>
  );
}
