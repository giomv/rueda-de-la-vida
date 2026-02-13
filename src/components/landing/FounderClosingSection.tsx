'use client';

import type { FounderClosingContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: FounderClosingContent;
}

export function FounderClosingSection({ content }: Props) {
  return (
    <Section id={content.id}>
      <div className="max-w-2xl mx-auto text-center space-y-5 text-sm leading-relaxed">
        <p className="font-medium">{content.title}</p>
        <ul className="space-y-1 list-none">
          {content.items.map((item) => (
            <li key={item} className="text-muted-foreground">
              – {item}
            </li>
          ))}
        </ul>

        {content.closing.map((line, i) => (
          <p key={i} className="text-muted-foreground whitespace-pre-line font-medium">
            {line}
          </p>
        ))}
      </div>
    </Section>
  );
}
