/**
 * Development-only subscription fixtures — display-only until store products resolve.
 * Prices derive from `constants/pricing.ts` (single source of truth).
 */
import {
  CATALOG_PLANS,
  RESCUE_CATALOG,
  catalogAnnualLabel,
  catalogMonthlyLabel,
  yearlySavingsLabel,
  type CatalogPlanId,
} from '../constants/pricing';

export type PlanTier = CatalogPlanId;

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

/** Locked catalog — always mirrors constants/pricing.ts. */
export const PLAN_FIXTURES: PlanFixture[] = CATALOG_PLANS.map((plan) => ({
  id: plan.id,
  name: plan.name,
  tagline: plan.tagline,
  monthlyPrice: catalogMonthlyLabel(plan.id),
  annualPrice: catalogAnnualLabel(plan.id),
  features: [...plan.features],
  highlighted: plan.highlighted,
  annualSavingsLabel: plan.id === 'free' ? undefined : yearlySavingsLabel(),
}));

export const RESCUE_OPTIONS: RescueOptionFixture[] = RESCUE_CATALOG.map((option) => ({
  id: option.id,
  name: option.name,
  price: `$${option.priceUsd.toFixed(2)}`,
  description: option.description,
}));
