import { calculateProofSummary, type ProofSummary } from '@milerecover/domain';
import type { MileRecoverAppState } from '../store/types';

export function selectProofViewModel(state: MileRecoverAppState): ProofSummary {
  return calculateProofSummary({
    period: state.reportingPeriod,
    trips: state.trips,
    unresolvedReviewCount: state.reviewItems.length,
    configuredRate: state.mileageRate,
    dataStale: state.dataStale,
  });
}
