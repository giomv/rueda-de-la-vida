'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { FaqContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: FaqContent;
}

export function FaqSection({ content }: Props) {
  return (
    <Section id={content.id}>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
        {content.title}
      </h2>
      <div className="max-w-2xl mx-auto">
        <Accordion type="single" collapsible>
          {content.items.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
