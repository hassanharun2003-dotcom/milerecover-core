import type { TripRecord } from '../trips/types';
import type { RecoveryCandidate, RecoveryConfidence } from './types';

export interface WorkPlaceHint {
  id: string;
  label: string;
}

export interface GapSuggestionOptions {
  /** Minimum quiet gap between confirmed work trips to surface (ms). Default 4h. */
  minGapMs?: number;
  /** Maximum gap to consider (ms). Default 18h — longer is a day off, not a miss. */
  maxGapMs?: number;
  /** Existing candidates — used for duplicate suppression. */
  existing?: RecoveryCandidate[];
  now?: number;
  workPlaces?: WorkPlaceHint[];
}

function confidenceForGap(gapMs: number): RecoveryConfidence {
  if (gapMs >= 6 * 3600000 && gapMs <= 12 * 3600000) return 'medium';
  return 'low';
}

function overlapsExisting(
  start: number,
  end: number,
  existing: RecoveryCandidate[],
): boolean {
  return existing.some((c) => {
    if (c.state === 'rejected' || c.state === 'user_confirmed' || c.state === 'user_corrected') {
      return false;
    }
    return c.proposedStartAt < end && c.proposedEndAt > start;
  });
}

function coveredByTrip(start: number, end: number, trips: TripRecord[]): boolean {
  return trips.some((t) => {
    if (t.status === 'rejected') return false;
    return t.startAt < end && t.endAt > start;
  });
}

/**
 * Deterministic, conservative recovery suggestions from gaps between confirmed work trips.
 * Never invents a distance — proposedDistanceMiles stays null unless evidence supports one.
 */
export function suggestRecoveryFromTripGaps(
  trips: TripRecord[],
  options: GapSuggestionOptions = {},
): RecoveryCandidate[] {
  const minGapMs = options.minGapMs ?? 4 * 3600000;
  const maxGapMs = options.maxGapMs ?? 18 * 3600000;
  const existing = options.existing ?? [];
  const workPlaceLabel = options.workPlaces?.[0]?.label;

  const confirmed = trips
    .filter((t) => t.status === 'confirmed' && t.classification === 'business')
    .slice()
    .sort((a, b) => a.endAt - b.endAt);

  const out: RecoveryCandidate[] = [];

  for (let i = 0; i < confirmed.length - 1; i += 1) {
    const prev = confirmed[i];
    const next = confirmed[i + 1];
    const gapStart = prev.endAt;
    const gapEnd = next.startAt;
    const gapMs = gapEnd - gapStart;
    if (gapMs < minGapMs || gapMs > maxGapMs) continue;
    if (overlapsExisting(gapStart, gapEnd, existing)) continue;
    if (coveredByTrip(gapStart, gapEnd, trips.filter((t) => t.id !== prev.id && t.id !== next.id))) {
      continue;
    }

    const placeHint = workPlaceLabel
      ? ` You have a saved work place (${workPlaceLabel}), which makes a mid-day work drive more plausible—still not proof.`
      : '';

    out.push({
      id: `recovery-gap-${prev.id}-${next.id}`,
      state: 'detected',
      confidence: confidenceForGap(gapMs),
      evidence: [
        {
          kind: 'gap',
          summary: `Quiet stretch of about ${(gapMs / 3600000).toFixed(1)} hours between two confirmed work drives.`,
        },
      ],
      proposedStartAt: gapStart,
      proposedEndAt: gapEnd,
      proposedDistanceMiles: null,
      plainLanguageExplanation:
        `There was a quiet stretch between “${prev.purpose ?? 'a work drive'}” and “${next.purpose ?? 'the next work drive'}”.` +
        ` We are not inventing miles—confirm only if you remember driving.${placeHint}`,
    });
  }

  return out.sort((a, b) => a.proposedStartAt - b.proposedStartAt || a.id.localeCompare(b.id));
}

/** Convert a user-confirmed recovery candidate into a recovered trip (distance required). */
export function tripFromConfirmedRecovery(
  candidate: RecoveryCandidate,
  distanceMiles: number,
  purpose: string,
  now = Date.now(),
): TripRecord {
  return {
    id: `trip-recovered-${candidate.id}`,
    source: 'recovered',
    status: 'confirmed',
    classification: 'business',
    startAt: candidate.proposedStartAt,
    endAt: candidate.proposedEndAt,
    distanceMiles,
    purpose: purpose.trim() || 'Recovered work drive',
    notes: candidate.plainLanguageExplanation,
    hasRouteCoordinates: false,
    confidence: candidate.confidence,
    startLabel: null,
    endLabel: null,
    vehicleId: null,
    evidenceMethod: 'user_estimate',
    createdAt: now,
    updatedAt: now,
  };
}
