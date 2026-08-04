import type { TripRecord } from '../trips/types';

export type ProofReadiness =
  | 'ready'
  | 'missing_purpose'
  | 'incomplete_route'
  | 'user_corrected'
  | 'recovered'
  | 'imported'
  | 'needs_attention';

export function proofReadinessForTrip(trip: TripRecord): ProofReadiness {
  if (trip.status !== 'confirmed' || trip.classification !== 'business') {
    return 'needs_attention';
  }
  if (!trip.purpose?.trim()) return 'missing_purpose';
  if (trip.distanceMiles <= 0) return 'incomplete_route';
  if (!trip.startLabel && !trip.endLabel) return 'incomplete_route';
  if (trip.confidence === 'low') return 'needs_attention';
  if (trip.notes?.includes('[user_corrected]')) return 'user_corrected';
  if (trip.source === 'recovered') return 'recovered';
  if (trip.source === 'imported') return 'imported';
  return 'ready';
}

/** Aggregate Proof tab readiness for a set of confirmed work trips. */
export type ProofPeriodReadiness =
  | 'ready_to_submit'
  | 'needs_review'
  | 'missing_details'
  | 'no_trips_yet';

export function resolveProofPeriodReadiness(input: {
  confirmedWorkTripCount: number;
  unresolvedReviewCount: number;
  missingDetailsCount: number;
}): ProofPeriodReadiness {
  if (input.confirmedWorkTripCount === 0) return 'no_trips_yet';
  if (input.unresolvedReviewCount > 0) return 'needs_review';
  if (input.missingDetailsCount > 0) return 'missing_details';
  return 'ready_to_submit';
}

export function proofPeriodReadinessLabel(status: ProofPeriodReadiness): string {
  switch (status) {
    case 'ready_to_submit':
      return 'Ready to submit';
    case 'needs_review':
      return 'Needs review';
    case 'missing_details':
      return 'Missing details';
    case 'no_trips_yet':
      return 'No trips yet';
  }
}

export function proofReadinessLabel(status: ProofReadiness): string {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'missing_purpose':
      return 'Missing purpose';
    case 'incomplete_route':
      return 'Incomplete details';
    case 'user_corrected':
      return 'Corrected';
    case 'recovered':
      return 'Recovered';
    case 'imported':
      return 'Imported';
    case 'needs_attention':
      return 'Needs attention';
  }
}
