'use client';

import { landingContent } from '@/lib/landing-content';
import {
  Hero,
  ProblemSection,
  DimensionsGrid,
  PositioningSection,
  HowItWorksSection,
  WhoItsForSection,
  TestimonialList,
  PricingCards,
  FounderSection,
  FounderClosingSection,
  OutcomesSection,
  FaqSection,
  FinalCtaSection,
  ScholarshipSection,
  StickyCta,
} from '@/components/landing';

const c = landingContent;

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <Hero content={c.hero} />
      <ProblemSection content={c.problem} />
      <DimensionsGrid content={c.dimensions} />
      <PositioningSection content={c.positioning} />
      <HowItWorksSection content={c.howItWorks} />
      <WhoItsForSection content={c.whoItsFor} />
      <TestimonialList content={c.testimonials} />
      <PricingCards content={c.pricing} />
      <FounderSection content={c.founder} />
      <FounderClosingSection content={c.founderClosing} />
      <OutcomesSection content={c.outcomes} />
      <FaqSection content={c.faq} />
      <FinalCtaSection content={c.finalCta} />
      <ScholarshipSection content={c.scholarship} />

      <StickyCta
        accessHref={c.whatsAppLinks.access}
        mentorshipHref={c.whatsAppLinks.mentorship}
      />
    </div>
  );
}
