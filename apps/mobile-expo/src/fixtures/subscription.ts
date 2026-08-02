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
    tagline: 'Start protecting your miles',
    monthlyPrice: '$0',
    annualPrice: '$0',
    features: [
      'Basic mileage log',
      'Limited automatic drives',
      'One vehicle',
      'Basic review',
      'Basic CSV export',
      'Access to your existing data',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'Everyday mileage protection',
    monthlyPrice: '$8.99',
    annualPrice: '$89.99',
    highlighted: true,
    features: [
      'Full everyday mileage protection',
      'Unlimited automatic tracking',
      'Recovery gap detection',
      'Multiple vehicles and work locations',
      'PDF and advanced CSV',
      'Import cleanup',
      'Cloud backup placeholder',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Professional proof and rescue',
    monthlyPrice: '$14.99',
    annualPrice: '$119.99',
    features: [
      'Advanced historical rescue',
      'Professional proof packages',
      'Custom reimbursement settings',
      'Advanced exports and sharing',
      'Priority support',
    ],
  },
];

export const RESCUE_OPTIONS: RescueOptionFixture[] = [
  {
    id: 'rescue-90',
    name: '90-Day Rescue',
    price: '$29.99',
    description: 'Organize and recover up to 90 days of mileage history.',
  },
  {
    id: 'rescue-year',
    name: 'Full-Year Rescue',
    price: '$59.99',
    description: 'Deep cleanup and proof preparation for a full year of records.',
  },
];
