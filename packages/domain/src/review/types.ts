import type { RecoveryCandidate } from '../recovery/types';
import type { TripRecord } from '../trips/types';

export type ReviewItemKind =
  | 'classification_needed'
  | 'possible_missing_trip'
  | 'low_confidence_trip'
  | 'conflicted_trip';

export interface ReviewItemBase {
  id: string;
  kind: ReviewItemKind;
  priority: number;
  createdAt: number;
  title: string;
  subtitle: string;
  distanceMiles: number | null;
  confidence: 'high' | 'medium' | 'low' | null;
  reason: string;
}

export interface TripReviewItem extends ReviewItemBase {
  kind: 'classification_needed' | 'low_confidence_trip' | 'conflicted_trip';
  tripId: string;
}

export interface MissingTripReviewItem extends ReviewItemBase {
  kind: 'possible_missing_trip';
  recoveryCandidateId: string;
}

export type ReviewItem = TripReviewItem | MissingTripReviewItem;

const KIND_PRIORITY: Record<ReviewItemKind, number> = {
  possible_missing_trip: 100,
  conflicted_trip: 80,
  low_confidence_trip: 60,
  classification_needed: 40,
};

export function buildReviewItemFromTrip(trip: TripRecord): ReviewItem | null {
  if (trip.status === 'confirmed' || trip.status === 'personal' || trip.status === 'rejected') {
    return null;
  }
  if (trip.confidence === 'low') {
    return {
      id: `review-trip-${trip.id}`,
      kind: 'low_confidence_trip',
      tripId: trip.id,
      priority: KIND_PRIORITY.low_confidence_trip,
      createdAt: trip.endAt,
      title: 'Review low-confidence trip',
      subtitle: 'Distance or route may need your confirmation',
      distanceMiles: trip.distanceMiles,
      confidence: 'low',
      reason: 'Low confidence detection',
    };
  }
  return {
    id: `review-trip-${trip.id}`,
    kind: 'classification_needed',
    tripId: trip.id,
    priority: KIND_PRIORITY.classification_needed,
    createdAt: trip.endAt,
    title: 'Classify trip',
    subtitle: 'Business or personal?',
    distanceMiles: trip.distanceMiles,
    confidence: trip.confidence,
    reason: 'Pending classification',
  };
}

export function buildReviewItemFromRecovery(candidate: RecoveryCandidate): MissingTripReviewItem | null {
  if (candidate.state === 'rejected' || candidate.state === 'user_confirmed') {
    return null;
  }
  return {
    id: `review-recovery-${candidate.id}`,
    kind: 'possible_missing_trip',
    recoveryCandidateId: candidate.id,
    priority: KIND_PRIORITY.possible_missing_trip,
    createdAt: candidate.proposedStartAt,
    title: 'Possible missing trip',
    subtitle: candidate.plainLanguageExplanation,
    distanceMiles: candidate.proposedDistanceMiles,
    confidence:
      candidate.confidence === 'high' ? 'high' : candidate.confidence === 'medium' ? 'medium' : 'low',
    reason: candidate.evidence.map((e) => e.summary).join('; '),
  };
}

export function prioritizeReviewItems(items: ReviewItem[]): ReviewItem[] {
  return [...items].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.createdAt - a.createdAt;
  });
}
