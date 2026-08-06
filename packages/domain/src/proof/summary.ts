import type { TripRecord } from '../trips/types';
import { confirmedBusinessMiles } from '../trips/types';

export type ProofCompleteness = 'complete' | 'needs_review' | 'insufficient_data';

export interface ProofPeriod {
  id: string;
  label: string;
  startAt: number;
  endAt: number;
}

export interface MileageRateConfig {
  id: string;
  label: string;
  centsPerMile: number;
}

export interface ProofSummaryInput {
  period: ProofPeriod;
  trips: TripRecord[];
  unresolvedReviewCount: number;
  configuredRate: MileageRateConfig | null;
  dataStale: boolean;
}

export interface ProofSummary {
  periodLabel: string;
  confirmedBusinessMiles: number;
  estimatedDeductionCents: number | null;
  estimatedDeductionLabel: string | null;
  completeness: ProofCompleteness;
  unresolvedReviewCount: number;
  exportAvailable: false;
  staleDataWarning: string | null;
}

export function calculateProofSummary(input: ProofSummaryInput): ProofSummary {
  const miles = confirmedBusinessMiles(input.trips);
  let completeness: ProofCompleteness = 'complete';
  if (input.dataStale) {
    completeness = 'insufficient_data';
  } else if (input.unresolvedReviewCount > 0) {
    completeness = 'needs_review';
  }

  const estimatedDeductionCents =
    input.configuredRate != null ? Math.round(miles * input.configuredRate.centsPerMile) : null;

  return {
    periodLabel: input.period.label,
    confirmedBusinessMiles: miles,
    estimatedDeductionCents,
    estimatedDeductionLabel:
      input.configuredRate != null
        ? `Estimated at ${input.configuredRate.label} (${input.configuredRate.centsPerMile}¢/mi)`
        : null,
    completeness,
    unresolvedReviewCount: input.unresolvedReviewCount,
    exportAvailable: false,
    staleDataWarning: input.dataStale ? 'Some records may be out of date.' : null,
  };
}
