/** Development-only subscription fixtures — display-only until store products resolve. */
export type PlanTier = 'free' | 'plus' | 'pro';

export interface PlanFixture {
  id: PlanTier;
  name: string;
  tagline: string;
  monthlyPrice: string;
  annualPrice: string;
  /** Max concise outcome bullets shown in Plans UI */
  features: string[];
  highlighted?: boolean;
  /** Approximate annual savings vs 12× monthly (for annual toggle copy) */
  annualSavingsLabel?: string;
}

export interface RescueOptionFixture {
  id: string;
  name: string;
  price: string;
  description: string;
}

/** Locked to Figma Plans / Compare (file 5y8p0axQChkYVBcM7tgHDj). */
export const PLAN_FIXTURES: PlanFixture[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Free stays useful. Upgrade only when you need more automation or reporting.',
    monthlyPrice: '$0',
    annualPrice: '$0',
    features: [
      '40 automatic trips/month',
      '1 vehicle',
      '1 missing scan/month',
      'Unlimited manual trips',
      'Basic CSV export',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'Unlimited automation when Free limits aren’t enough.',
    monthlyPrice: '$9.99',
    annualPrice: '$95.90',
    annualSavingsLabel: 'Save 20%',
    highlighted: true,
    features: [
      'Unlimited automatic trips',
      'Unlimited missing scans',
      'PDF reports',
      'More vehicles',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Everything in Plus with advanced reports and priority support.',
    monthlyPrice: '$19.99',
    annualPrice: '$191.90',
    annualSavingsLabel: 'Save 20%',
    features: [
      'Everything in Plus',
      'Advanced reports',
      'Extra recovery tools',
      'Priority support',
    ],
  },
];

export const RESCUE_OPTIONS: RescueOptionFixture[] = [
  {
    id: 'rescue-90',
    name: '90-Day Rescue',
    price: '$29.99',
    description: 'Catch up on up to 90 days—organized and ready to review.',
  },
  {
    id: 'rescue-year',
    name: 'Full-Year Rescue',
    price: '$59.99',
    description: 'A full year cleaned up and ready to share—no subscription required.',
  },
];
