/**
 * Single pricing source-of-truth for MileRecover catalog display.
 *
 * Store / RevenueCat localized prices override these when billing is available.
 * When the store is unavailable, UI must show these fixtures (never invent
 * live store availability). Yearly prices are monthly × 12 × (1 − discount).
 */

export type CatalogPlanId = 'free' | 'plus' | 'pro';

export const YEARLY_DISCOUNT_PERCENT = 20;

export interface CatalogPlanPrice {
  id: CatalogPlanId;
  name: string;
  tagline: string;
  /** Monthly list price in USD dollars (display). Free is 0. */
  monthlyUsd: number;
  features: string[];
  highlighted?: boolean;
}

export const CATALOG_PLANS: CatalogPlanPrice[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Free stays useful. Upgrade only when you need more automation or reporting.',
    monthlyUsd: 0,
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
    monthlyUsd: 9.99,
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
    monthlyUsd: 19.99,
    features: [
      'Everything in Plus',
      'Advanced reports',
      'Extra recovery tools',
      'Priority support',
    ],
  },
];

export const RESCUE_CATALOG = [
  {
    id: 'rescue-90',
    name: '90-Day Rescue',
    priceUsd: 29.99,
    description: 'Catch up on up to 90 days—organized and ready to review.',
  },
  {
    id: 'rescue-year',
    name: 'Full-Year Rescue',
    priceUsd: 59.99,
    description: 'A full year cleaned up and ready to share—no subscription required.',
  },
] as const;

export function formatUsdPrice(amount: number): string {
  if (amount === 0) return '$0';
  return `$${amount.toFixed(2)}`;
}

/** Annual list = monthly × 12 × (1 − YEARLY_DISCOUNT_PERCENT/100), rounded to cents. */
export function annualUsdFromMonthly(monthlyUsd: number): number {
  if (monthlyUsd <= 0) return 0;
  const raw = monthlyUsd * 12 * (1 - YEARLY_DISCOUNT_PERCENT / 100);
  return Math.round(raw * 100) / 100;
}

export function yearlySavingsLabel(discountPercent = YEARLY_DISCOUNT_PERCENT): string {
  return `Save ${discountPercent}%`;
}

export function catalogMonthlyLabel(planId: CatalogPlanId): string {
  const plan = CATALOG_PLANS.find((p) => p.id === planId);
  return formatUsdPrice(plan?.monthlyUsd ?? 0);
}

export function catalogAnnualLabel(planId: CatalogPlanId): string {
  const plan = CATALOG_PLANS.find((p) => p.id === planId);
  return formatUsdPrice(annualUsdFromMonthly(plan?.monthlyUsd ?? 0));
}
