'use client';

import { cn } from '@/lib/utils';
import { useAnimateOnScroll } from '@/hooks/use-animate-on-scroll';

interface SectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  /** Apply alternate background */
  alt?: boolean;
}

export function Section({ id, className, children, alt }: SectionProps) {
  const { ref, isVisible } = useAnimateOnScroll();

  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        'py-16 md:py-24 px-4 transition-all duration-700 ease-out',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6',
        alt && 'bg-muted/30',
        className,
      )}
    >
      <div className="container mx-auto max-w-4xl">{children}</div>
    </section>
  );
}
