/** Development-only subscription fixtures — not production commerce. */
export type PlanTier = 'free' | 'plus' | 'pro';

export interface PlanFixture {
  id: PlanTier;
  name: string;
  tagline: string;
  monthlyPrice: string;
  annualPrice: string;
  features: string[];
  highlighted?: boolean;
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
    tagline: 'Start covering your work miles',
    monthlyPrice: '$0',
    annualPrice: '$0',
    features: [
      'Never lose the miles you log by hand',
      'One vehicle, kept simple',
      'Calm review when something needs you',
      'CSV when you need a basic share',
      'Your data stays on this device first',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'Never lose another reimbursable mile',
    monthlyPrice: '$8.99',
    annualPrice: '$89.99',
    highlighted: true,
    features: [
      'We’ll warn you before forgotten trips become lost money',
      'Everyday coverage for every work drive',
      'Catch quiet gaps before they disappear',
      'Multiple vehicles and familiar places',
      'PDF ready when work asks',
      'Cleaner imports from what you already have',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Your reports are ready when work asks',
    monthlyPrice: '$14.99',
    annualPrice: '$119.99',
    features: [
      'Deeper help catching up older history',
      'Stronger reports you can share with confidence',
      'Reimbursement settings that match how you work',
      'Advanced exports without the scramble',
      'Priority help when something’s unclear',
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
