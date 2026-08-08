import { estimatedValueCents, type LocaleProfile, rateForTimestamp } from '../localization/types';
import type { TripRecord } from '../trips/types';

export type TripValueSource = 'rate_snapshot' | 'live_rate' | 'missing';

export interface TripValueResult {
  estimatedValueCents: number | null;
  centsPerMile: number | null;
  currencyCode: string | null;
  source: TripValueSource;
  /** True when an accepted work trip has no usable historical rate. */
  missingHistoricalRate: boolean;
}

/**
 * Single source of truth for trip estimated value.
 * Prefer immutable rateSnapshot on accepted trips; never silently rewrite history.
 */
export function resolveTripEstimatedValue(
  trip: TripRecord,
  locale: Pick<LocaleProfile, 'rates' | 'currencyCode' | 'activeRateNeedsReview'> | null,
): TripValueResult {
  const snap = trip.rateSnapshot;
  if (snap && snap.centsPerMile != null && snap.centsPerMile > 0) {
    return {
      estimatedValueCents: estimatedValueCents(trip.distanceMiles, snap.centsPerMile),
      centsPerMile: snap.centsPerMile,
      currencyCode: snap.currencyCode,
      source: 'rate_snapshot',
      missingHistoricalRate: false,
    };
  }

  // Accepted/confirmed work trips without a snapshot: do not invent from a later live rate.
  const isAcceptedWork =
    trip.status === 'confirmed' && trip.classification === 'business';
  if (isAcceptedWork && (snap == null || snap.centsPerMile == null || snap.centsPerMile <= 0)) {
    // If snapshot explicitly missing cents, surface missing historical rate.
    // Only fall back to live rate for non-accepted (pending) estimates.
    if (snap != null) {
      return {
        estimatedValueCents: null,
        centsPerMile: null,
        currencyCode: snap.currencyCode ?? locale?.currencyCode ?? null,
        source: 'missing',
        missingHistoricalRate: true,
      };
    }
  }

  if (!locale || locale.activeRateNeedsReview) {
    return {
      estimatedValueCents: null,
      centsPerMile: null,
      currencyCode: locale?.currencyCode ?? null,
      source: 'missing',
      missingHistoricalRate: isAcceptedWork,
    };
  }

  const live = rateForTimestamp(locale.rates, trip.startAt);
  if (!live || !(live.centsPerMile > 0)) {
    return {
      estimatedValueCents: null,
      centsPerMile: null,
      currencyCode: locale.currencyCode,
      source: 'missing',
      missingHistoricalRate: isAcceptedWork,
    };
  }

  // Live rate only for pending / non-accepted estimates, or legacy accepted trips
  // that predate snapshots (honest fallback — still prefer snapshot when present).
  return {
    estimatedValueCents: estimatedValueCents(trip.distanceMiles, live.centsPerMile),
    centsPerMile: live.centsPerMile,
    currencyCode: live.currencyCode || locale.currencyCode,
    source: snap == null && isAcceptedWork ? 'live_rate' : 'live_rate',
    missingHistoricalRate: false,
  };
}

export function sumEstimatedValueCents(
  trips: TripRecord[],
  locale: Pick<LocaleProfile, 'rates' | 'currencyCode' | 'activeRateNeedsReview'> | null,
): number | null {
  let total: number | null = null;
  for (const trip of trips) {
    const value = resolveTripEstimatedValue(trip, locale);
    if (value.estimatedValueCents != null) {
      total = (total ?? 0) + value.estimatedValueCents;
    }
  }
  return total;
}
