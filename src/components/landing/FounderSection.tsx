'use client';

import type { FounderContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: FounderContent;
}

export function FounderSection({ content }: Props) {
  return (
    <Section id={content.id}>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
        {content.title}
      </h2>

      <div className="max-w-2xl mx-auto space-y-4 text-sm leading-relaxed">
        {content.paragraphs.map((p, i) => (
          <p key={i} className="text-muted-foreground whitespace-pre-line">
            {p}
          </p>
        ))}

        <p className="font-medium pt-2">{content.listTitle}</p>
        <ul className="space-y-1 pl-4">
          {content.listItems.map((item) => (
            <li key={item} className="text-muted-foreground">
              – {item}
            </li>
          ))}
        </ul>

        {content.closing.slice(0, 2).map((line, i) => (
          <p key={i} className="text-muted-foreground whitespace-pre-line">
            {line}
          </p>
        ))}

        <p className="font-medium pt-2">{content.understandingTitle}</p>
        <ul className="space-y-1 pl-4">
          {content.understandingItems.map((item) => (
            <li key={item} className="text-muted-foreground">
              – {item}
            </li>
          ))}
        </ul>

        {content.closing.slice(2).map((line, i) => (
          <p key={i} className="text-muted-foreground whitespace-pre-line font-medium">
            {line}
          </p>
        ))}
      </div>
    </Section>
  );
}
