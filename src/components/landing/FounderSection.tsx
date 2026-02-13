'use client';

import Image from 'next/image';
import type { FounderContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: FounderContent;
}

export function FounderSection({ content }: Props) {
  return (
    <Section id={content.id}>
      <div className="flex flex-col md:flex-row items-start gap-10 md:gap-14">
        {/* Text side */}
        <div className="flex-1 space-y-5 text-sm leading-relaxed">
          <h2 className="text-2xl md:text-3xl font-bold">
            {content.title}
          </h2>

          {content.paragraphs.map((p, i) => (
            <p key={i} className="text-muted-foreground whitespace-pre-line">
              {p}
            </p>
          ))}

          <p className="font-medium pt-1">{content.listTitle}</p>
          <ul className="space-y-1 pl-4">
            {content.listItems.map((item) => (
              <li key={item} className="text-muted-foreground">
                – {item}
              </li>
            ))}
          </ul>

          {content.closing.map((line, i) => (
            <p key={i} className="text-muted-foreground whitespace-pre-line">
              {line}
            </p>
          ))}
        </div>

        {/* Image side */}
        {content.image && (
          <div className="flex-1 w-full">
            <div className="relative w-full overflow-hidden rounded-2xl bg-muted/40 aspect-[3/4]">
              <Image
                src={content.image.src}
                alt={content.image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
