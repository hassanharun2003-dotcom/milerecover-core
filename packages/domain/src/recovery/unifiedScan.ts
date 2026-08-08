import type { TripRecord } from '../trips/types';
import type { TrackingEngineState } from '../protection-health/types';
import { suggestRecoveryFromTripGaps, type GapSuggestionOptions, type WorkPlaceHint } from './suggestions';
import type { RecoveryCandidate, RecoveryEvidenceRef } from './types';

export interface UnifiedRecoveryScanInput {
  trips: TripRecord[];
  existing?: RecoveryCandidate[];
  workPlaces?: WorkPlaceHint[];
  /** When tracking was last confirmed healthy. */
  lastConfirmedCaptureAt?: number | null;
  trackingEngineState?: TrackingEngineState;
  /** User-reported missed drive windows (manual). Never invent distance. */
  manualMissReports?: Array<{
    id: string;
    startAt: number;
    endAt: number;
    note?: string;
  }>;
  now?: number;
  gapOptions?: Omit<GapSuggestionOptions, 'existing' | 'workPlaces' | 'now'>;
}

function overlaps(
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

/**
 * Unified recovery scan — conservative, evidence-backed, never invents mileage.
 * Sources: trip gaps, imported incomplete records, tracking-health interruptions,
 * expected work patterns (workplace hints only), manual miss reports.
 */
export function runUnifiedRecoveryScan(input: UnifiedRecoveryScanInput): RecoveryCandidate[] {
  const now = input.now ?? Date.now();
  const existing = input.existing ?? [];
  const collected: RecoveryCandidate[] = [];

  const gapCandidates = suggestRecoveryFromTripGaps(input.trips, {
    ...input.gapOptions,
    existing: [...existing, ...collected],
    workPlaces: input.workPlaces,
    now,
  });
  collected.push(...gapCandidates);

  // Imported records that still need distance or purpose — surface as recovery, not invented miles.
  for (const trip of input.trips) {
    if (trip.source !== 'imported') continue;
    if (trip.status === 'rejected' || trip.status === 'personal') continue;
    if (trip.distanceMiles > 0 && trip.purpose?.trim()) continue;
    const id = `recovery-import-${trip.id}`;
    if (existing.some((c) => c.id === id) || collected.some((c) => c.id === id)) continue;
    const evidence: RecoveryEvidenceRef[] = [
      {
        kind: 'import',
        summary: 'Imported record is incomplete. Confirm distance and purpose before it enters Proof.',
      },
    ];
    collected.push({
      id,
      state: 'detected',
      confidence: 'medium',
      evidence,
      proposedStartAt: trip.startAt,
      proposedEndAt: trip.endAt,
      proposedDistanceMiles: trip.distanceMiles > 0 ? trip.distanceMiles : null,
      plainLanguageExplanation:
        'An imported record looks incomplete. MileRecover will not invent the missing distance — enter what you know, or leave it out.',
    });
  }

  // Tracking-health interruption: long silence while engine was active / degraded.
  const lastCheck = input.lastConfirmedCaptureAt;
  const engine = input.trackingEngineState;
  if (
    lastCheck != null &&
    (engine === 'stopped' || engine === 'unavailable' || engine === 'idle') &&
    now - lastCheck > 6 * 3600000
  ) {
    const start = lastCheck;
    const end = Math.min(now, lastCheck + 12 * 3600000);
    const id = `recovery-tracking-${start}-${end}`;
    if (!overlaps(start, end, [...existing, ...collected])) {
      collected.push({
        id,
        state: 'inferred',
        confidence: 'low',
        evidence: [
          {
            kind: 'tracking_health',
            summary:
              'Automatic tracking had a long quiet period. This may mean a missed drive — or that you were not driving.',
          },
        ],
        proposedStartAt: start,
        proposedEndAt: end,
        proposedDistanceMiles: null,
        plainLanguageExplanation:
          'Tracking has not checked in for a while. If you remember a work drive in that window, add the distance yourself. We never invent miles.',
      });
    }
  }

  // Pattern hint only: workplace exists + confirmed work days — still no invented distance.
  const workLabel = input.workPlaces?.[0]?.label;
  if (workLabel) {
    const confirmed = input.trips
      .filter((t) => t.status === 'confirmed' && t.classification === 'business')
      .slice()
      .sort((a, b) => a.startAt - b.startAt);
    // Look for two confirmed work drives on the same calendar day with a mid-day gap already handled by gap scan.
    // Additional pattern: weekdays with exactly one confirmed work drive and a workplace on file.
    const byDay = new Map<string, TripRecord[]>();
    for (const trip of confirmed) {
      const day = new Date(trip.startAt).toISOString().slice(0, 10);
      const list = byDay.get(day) ?? [];
      list.push(trip);
      byDay.set(day, list);
    }
    for (const [day, dayTrips] of byDay) {
      if (dayTrips.length !== 1) continue;
      const only = dayTrips[0];
      const dayStart = new Date(`${day}T12:00:00.000Z`).getTime();
      // Suggest a possible return/other leg only when the single trip ends early afternoon-ish.
      if (only.endAt > dayStart) continue;
      const start = only.endAt;
      const end = start + 2 * 3600000;
      const id = `recovery-pattern-${only.id}`;
      if (overlaps(start, end, [...existing, ...collected])) continue;
      if (end > now) continue;
      collected.push({
        id,
        state: 'inferred',
        confidence: 'low',
        evidence: [
          {
            kind: 'pattern',
            summary: `You have a saved workplace (${workLabel}) and only one confirmed work drive that day.`,
          },
        ],
        proposedStartAt: start,
        proposedEndAt: end,
        proposedDistanceMiles: null,
        plainLanguageExplanation:
          `Only one work drive is logged near ${workLabel} that day. If you drove again, confirm with your own distance — nothing is invented.`,
      });
    }
  }

  for (const report of input.manualMissReports ?? []) {
    const id = `recovery-manual-${report.id}`;
    if (existing.some((c) => c.id === id) || collected.some((c) => c.id === id)) continue;
    collected.push({
      id,
      state: 'detected',
      confidence: 'medium',
      evidence: [
        {
          kind: 'manual_report',
          summary: report.note?.trim() || 'You reported a missed drive. Distance still needs your entry.',
        },
      ],
      proposedStartAt: report.startAt,
      proposedEndAt: report.endAt,
      proposedDistanceMiles: null,
      plainLanguageExplanation:
        'You said a drive may be missing. Enter the distance only if you remember it — MileRecover will not guess.',
    });
  }

  return collected.sort((a, b) => a.proposedStartAt - b.proposedStartAt || a.id.localeCompare(b.id));
}
