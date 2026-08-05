import type { TripRecord } from '../trips/types';
import type { CapabilitySet, EntitlementSnapshot } from './types';
import { capabilitiesForEntitlement } from './types';

/** Calendar month key YYYY-MM in local device time. */
export function calendarPeriodKey(at = Date.now()): string {
  const d = new Date(at);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Count auto-captured trips in the current calendar month.
 * Uses trip startAt (observed drive time), not createdAt, so re-imports of history
 * do not inflate the Free allowance for past months incorrectly.
 */
export function countAutomaticTripsInPeriod(
  trips: TripRecord[],
  periodKey: string,
): number {
  return trips.filter((trip) => {
    if (trip.source !== 'auto_detected') return false;
    if (trip.status === 'rejected') return false;
    return calendarPeriodKey(trip.startAt) === periodKey;
  }).length;
}

export function remainingAutomaticTrips(
  entitlement: EntitlementSnapshot,
  trips: TripRecord[],
  now = Date.now(),
): number | null {
  const caps = capabilitiesForEntitlement(entitlement);
  if (caps.automaticTripLimit == null) return null; // unlimited
  const used = countAutomaticTripsInPeriod(trips, calendarPeriodKey(now));
  return Math.max(0, caps.automaticTripLimit - used);
}

export function canCaptureAutomaticTrip(
  entitlement: EntitlementSnapshot,
  trips: TripRecord[],
  now = Date.now(),
): boolean {
  const caps = capabilitiesForEntitlement(entitlement);
  if (!caps.canUseAutomaticCapture) return false;
  const remaining = remainingAutomaticTrips(entitlement, trips, now);
  return remaining == null || remaining > 0;
}

export function canRunMissingScan(
  entitlement: EntitlementSnapshot,
  scansUsedThisPeriod: number,
): boolean {
  const caps = capabilitiesForEntitlement(entitlement);
  if (!caps.canUseGapDetection) return false;
  if (caps.missingScanLimit == null) return true;
  return scansUsedThisPeriod < caps.missingScanLimit;
}

export function missingScansRemaining(
  entitlement: EntitlementSnapshot,
  scansUsedThisPeriod: number,
): number | null {
  const caps = capabilitiesForEntitlement(entitlement);
  if (caps.missingScanLimit == null) return null;
  return Math.max(0, caps.missingScanLimit - scansUsedThisPeriod);
}

export function describeAutomaticAllowance(
  entitlement: EntitlementSnapshot,
  trips: TripRecord[],
  now = Date.now(),
): { used: number; limit: number | null; remaining: number | null } {
  const caps = capabilitiesForEntitlement(entitlement);
  const used = countAutomaticTripsInPeriod(trips, calendarPeriodKey(now));
  const limit = caps.automaticTripLimit;
  return {
    used,
    limit,
    remaining: limit == null ? null : Math.max(0, limit - used),
  };
}

export type { CapabilitySet };
