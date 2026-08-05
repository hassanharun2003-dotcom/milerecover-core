/** Development-only subscription fixtures — not production commerce. */
export type PlanTier = 'free' | 'plus' | 'pro';

export interface PlanFixture {
  id: PlanTier;
  name: string;
  tagline: string;
  monthlyPrice: string;
  annualPrice: string;
  /** Max 3 concise outcome bullets shown in Plans UI */
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

export const PLAN_FIXTURES: PlanFixture[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Manual work-drive logging stays available',
    monthlyPrice: '$0',
    annualPrice: '$0',
    features: [
      'Unlimited manual trips',
      '40 automatic trips per month',
      'One vehicle · CSV export · tracking health',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'Never lose another reimbursable mile.',
    monthlyPrice: '$8.99',
    annualPrice: '$89.99',
    annualSavingsLabel: 'Save 17%',
    highlighted: true,
    features: [
      'Unlimited automatic tracking',
      'Missed-drive review',
      'Share-ready PDF reports',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Stronger records when work, clients, or taxes demand more.',
    monthlyPrice: '$14.99',
    annualPrice: '$119.99',
    annualSavingsLabel: 'Save about $60/year vs monthly',
    features: [
      'Everything in Plus',
      'Deeper history recovery',
      'Advanced organization and reporting',
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
