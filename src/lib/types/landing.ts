/* ------------------------------------------------------------------ */
/*  Landing page – Type definitions                                    */
/* ------------------------------------------------------------------ */

export interface CtaConfig {
  label: string;
  href: string;
  variant: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** If set, smooth-scrolls to this anchor before following href */
  scrollTo?: string;
}

export interface HeroContent {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  tagline: string;
  ctas: CtaConfig[];
}

export interface ProblemContent {
  id: string;
  title: string;
  negations: string[];
  revelation: string;
  painPoints: string[];
  close: string;
}

export interface DimensionCardImage {
  src: string;
  alt: string;
  aspectRatio?: string;
  fit?: 'contain' | 'cover';
}

export interface DimensionCard {
  id: string;
  title: string;
  description: string;
  footer: string;
  image?: DimensionCardImage;
}

export interface FinanceCallout {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  image?: DimensionCardImage;
}

export interface DimensionsContent {
  id: string;
  title: string;
  cards: DimensionCard[];
  finance: FinanceCallout;
}

export interface PositioningContent {
  id: string;
  negations: string[];
  affirmation: string;
}

export interface HowItWorksContent {
  id: string;
  title: string;
  steps: string[];
  close: string[];
}

export interface WhoItsForContent {
  id: string;
  title: string;
  intro: string;
  bullets: string[];
}

export interface Testimonial {
  quote: string;
  body: string;
  author: string;
  role: string;
}

export interface TestimonialsContent {
  id: string;
  title: string;
  items: Testimonial[];
}

export interface PricingFeature {
  text: string;
}

export interface PricingCard {
  id: string;
  icon: string;
  name: string;
  description?: string;
  features: PricingFeature[];
  ideal: string;
  price: string;
  priceLabel: string;
  note?: string;
  cta: CtaConfig;
  highlighted?: boolean;
  /** Extra session features for mentorship card */
  sessionTitle?: string;
  sessionFeatures?: PricingFeature[];
}

export interface PricingContent {
  id: string;
  title: string;
  cards: PricingCard[];
}

export interface FounderImage {
  src: string;
  alt: string;
}

export interface FounderContent {
  id: string;
  title: string;
  paragraphs: string[];
  listTitle: string;
  listItems: string[];
  closing: string[];
  image?: FounderImage;
}

export interface FounderClosingContent {
  id: string;
  title: string;
  items: string[];
  closing: string[];
}

export interface OutcomesContent {
  id: string;
  title: string;
  bullets: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqContent {
  id: string;
  title: string;
  items: FaqItem[];
}

export interface FinalCtaContent {
  id: string;
  copy: string[];
  ctas: CtaConfig[];
  note: string;
}

export interface ScholarshipFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'textarea' | 'country-select' | 'phone';
  required: boolean;
  placeholder?: string;
}

export interface ScholarshipImage {
  src: string;
  alt: string;
  aspectRatio?: string;
  fit?: 'contain' | 'cover';
}

export interface ScholarshipContent {
  id: string;
  title: string;
  subtitle: string;
  intro: string[];
  includesTitle: string;
  includes: string[];
  includesNote: string;
  includeImage?: ScholarshipImage;
  audienceTitle: string;
  audienceIntro: string;
  audienceBullets: string[];
  processTitle: string;
  processIntro: string;
  formFields: ScholarshipFormField[];
  processNote: string;
  cta: CtaConfig;
}

export interface LandingContent {
  hero: HeroContent;
  problem: ProblemContent;
  dimensions: DimensionsContent;
  positioning: PositioningContent;
  howItWorks: HowItWorksContent;
  whoItsFor: WhoItsForContent;
  testimonials: TestimonialsContent;
  pricing: PricingContent;
  founder: FounderContent;
  founderClosing: FounderClosingContent;
  outcomes: OutcomesContent;
  faq: FaqContent;
  finalCta: FinalCtaContent;
  scholarship: ScholarshipContent;
  whatsAppLinks: {
    access: string;
    mentorship: string;
  };
}
