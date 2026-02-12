'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { TestimonialsContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: TestimonialsContent;
}

export function TestimonialList({ content }: Props) {
  return (
    <Section id={content.id}>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
        {content.title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {content.items.map((t) => (
          <Card
            key={t.author}
            className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <CardContent className="pt-6">
              <p className="font-semibold mb-3">&ldquo;{t.quote}&rdquo;</p>
              <p className="text-sm text-muted-foreground mb-4">{t.body}</p>
              <p className="text-xs text-muted-foreground">
                — {t.author}, {t.role}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}
