import type { TripRecord } from '../trips/types';

export type ProofReadiness =
  | 'ready'
  | 'missing_purpose'
  | 'incomplete_route'
  | 'user_corrected'
  | 'recovered'
  | 'imported'
  | 'needs_attention'
  | 'missing_rate';

export type ProofIssueSeverity = 'required' | 'recommended';

export interface ProofIssue {
  id: string;
  severity: ProofIssueSeverity;
  label: string;
  detail: string;
  tripId?: string;
  field?: 'purpose' | 'route' | 'vehicle' | 'rate' | 'classification' | 'distance';
}

export function proofReadinessForTrip(trip: TripRecord): ProofReadiness {
  if (trip.status !== 'confirmed' || trip.classification !== 'business') {
    return 'needs_attention';
  }
  if (!trip.purpose?.trim()) return 'missing_purpose';
  if (trip.distanceMiles <= 0) return 'incomplete_route';
  if (!trip.startLabel && !trip.endLabel) return 'incomplete_route';
  if (
    trip.rateSnapshot != null &&
    (trip.rateSnapshot.centsPerMile == null || trip.rateSnapshot.centsPerMile <= 0)
  ) {
    return 'missing_rate';
  }
  if (trip.confidence === 'low') return 'needs_attention';
  if (trip.notes?.includes('[user_corrected]')) return 'user_corrected';
  if (trip.source === 'recovered') return 'recovered';
  if (trip.source === 'imported') return 'imported';
  return 'ready';
}

/**
 * Build layered readiness: required vs recommended.
 * Not every field is universally required (vehicle optional unless vehicles exist).
 */
export function buildProofIssues(input: {
  confirmedWorkTrips: TripRecord[];
  unresolvedCount: number;
  vehiclesExist: boolean;
  valueRequested: boolean;
  rateOk: boolean;
}): { required: ProofIssue[]; recommended: ProofIssue[]; completedIds: string[] } {
  const required: ProofIssue[] = [];
  const recommended: ProofIssue[] = [];
  const completedIds: string[] = [];

  if (input.unresolvedCount > 0) {
    required.push({
      id: 'unresolved',
      severity: 'required',
      label: 'Uncertain drives resolved',
      detail: `${input.unresolvedCount} uncertain drive${input.unresolvedCount === 1 ? '' : 's'} still in Review.`,
      field: 'classification',
    });
  } else {
    completedIds.push('unresolved');
  }

  const missingPurpose = input.confirmedWorkTrips.filter((t) => !t.purpose?.trim());
  if (missingPurpose.length > 0) {
    required.push({
      id: 'purpose',
      severity: 'required',
      label: 'Purpose on every drive',
      detail: `${missingPurpose.length} drive${missingPurpose.length === 1 ? '' : 's'} need a purpose.`,
      tripId: missingPurpose[0].id,
      field: 'purpose',
    });
  } else {
    completedIds.push('purpose');
  }

  const missingDistance = input.confirmedWorkTrips.filter((t) => t.distanceMiles <= 0);
  if (missingDistance.length > 0) {
    required.push({
      id: 'distance',
      severity: 'required',
      label: 'Accepted distance',
      detail: `${missingDistance.length} drive${missingDistance.length === 1 ? '' : 's'} need a distance.`,
      tripId: missingDistance[0].id,
      field: 'distance',
    });
  } else {
    completedIds.push('distance');
  }

  if (input.valueRequested && !input.rateOk) {
    required.push({
      id: 'rate',
      severity: 'required',
      label: 'Mileage rate',
      detail: 'Review or set your mileage rate.',
      field: 'rate',
    });
  } else {
    completedIds.push('rate');
  }

  const missingRoute = input.confirmedWorkTrips.filter(
    (t) => !t.startLabel?.trim() && !t.endLabel?.trim(),
  );
  if (missingRoute.length > 0) {
    recommended.push({
      id: 'route',
      severity: 'recommended',
      label: 'Route or place labels',
      detail: `${missingRoute.length} drive${missingRoute.length === 1 ? '' : 's'} need route labels.`,
      tripId: missingRoute[0].id,
      field: 'route',
    });
  } else {
    completedIds.push('route');
  }

  if (input.vehiclesExist) {
    const missingVehicle = input.confirmedWorkTrips.filter((t) => !t.vehicleId);
    if (missingVehicle.length > 0) {
      recommended.push({
        id: 'vehicle',
        severity: 'recommended',
        label: 'Vehicle assigned',
        detail: `${missingVehicle.length} drive${missingVehicle.length === 1 ? '' : 's'} need a vehicle.`,
        tripId: missingVehicle[0].id,
        field: 'vehicle',
      });
    } else {
      completedIds.push('vehicle');
    }
  } else {
    completedIds.push('vehicle');
  }

  return { required, recommended, completedIds };
}

export function proofFixCtaLabel(requiredCount: number, recommendedCount: number): string {
  if (requiredCount <= 0 && recommendedCount <= 0) return 'Preview report';
  if (requiredCount === 1) return 'Fix next issue';
  if (requiredCount > 1) return `Fix ${requiredCount} required items`;
  if (recommendedCount === 1) return 'Fix next issue';
  return `Improve ${recommendedCount} items`;
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
    case 'missing_rate':
      return 'Missing rate';
  }
}
