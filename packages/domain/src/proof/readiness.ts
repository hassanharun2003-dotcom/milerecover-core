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
  if (trip.source === 'recovered') return 'recovered';
  if (trip.source === 'imported') return 'imported';
  if (!trip.purpose?.trim()) return 'missing_purpose';
  if (trip.confidence === 'low') return 'needs_attention';
  if (!trip.startLabel && !trip.endLabel && trip.distanceMiles <= 0) return 'incomplete_route';
  return 'ready';
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
