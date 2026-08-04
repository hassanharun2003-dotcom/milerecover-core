import type { TripRecord } from '../trips/types';

export interface LocationSample {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  speedMps: number | null;
  timestamp: number;
}

export interface TrackingConfig {
  /** Minimum meters from start to consider a trip (default 150m). */
  minTripDistanceMeters: number;
  /** Minimum duration ms (default 90s). */
  minTripDurationMs: number;
  /** Stop after this quiet period (default 3 minutes). */
  stopQuietMs: number;
  /** Ignore samples faster than this (default 50 m/s ~ 112 mph). */
  maxSpeedMps: number;
  /** Ignore samples with worse accuracy (default 80m). */
  maxAccuracyMeters: number;
}

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  minTripDistanceMeters: 150,
  minTripDurationMs: 90_000,
  stopQuietMs: 180_000,
  maxSpeedMps: 50,
  maxAccuracyMeters: 80,
};

function haversineMeters(a: LocationSample, b: LocationSample): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function filterSample(sample: LocationSample, config = DEFAULT_TRACKING_CONFIG): boolean {
  if (sample.accuracyMeters != null && sample.accuracyMeters > config.maxAccuracyMeters) {
    return false;
  }
  if (sample.speedMps != null && sample.speedMps > config.maxSpeedMps) {
    return false;
  }
  return true;
}

export function pathDistanceMeters(samples: LocationSample[]): number {
  let sum = 0;
  for (let i = 1; i < samples.length; i += 1) {
    sum += haversineMeters(samples[i - 1], samples[i]);
  }
  return sum;
}

/**
 * Segment an open buffer into a completed trip candidate when quiet time elapsed.
 * Never invents coordinates — returns null when evidence is insufficient.
 */
export function maybeCloseTripFromSamples(
  samples: LocationSample[],
  now = Date.now(),
  config = DEFAULT_TRACKING_CONFIG,
): { trip: TripRecord; consumedUntil: number } | null {
  const clean = samples.filter((s) => filterSample(s, config)).sort((a, b) => a.timestamp - b.timestamp);
  if (clean.length < 2) return null;
  const first = clean[0];
  const last = clean[clean.length - 1];
  if (now - last.timestamp < config.stopQuietMs) return null;
  const duration = last.timestamp - first.timestamp;
  const meters = pathDistanceMeters(clean);
  if (duration < config.minTripDurationMs || meters < config.minTripDistanceMeters) {
    return null;
  }
  const miles = meters / 1609.344;
  const hasGap =
    clean.some((s, i) => i > 0 && s.timestamp - clean[i - 1].timestamp > 120_000) ||
    clean.some((s) => s.accuracyMeters != null && s.accuracyMeters > 40);

  const trip: TripRecord = {
    id: `trip-auto-${first.timestamp}-${last.timestamp}`,
    source: 'auto_detected',
    status: 'pending',
    classification: 'unclassified',
    startAt: first.timestamp,
    endAt: last.timestamp,
    distanceMiles: Math.round(miles * 10) / 10,
    purpose: null,
    notes: hasGap
      ? 'Automatic capture with GPS gaps or reduced accuracy — confirm in Review. Miles are from recorded points only.'
      : 'Automatic capture — confirm work vs personal in Review.',
    hasRouteCoordinates: true,
    confidence: hasGap ? 'low' : 'medium',
    startLabel: null,
    endLabel: null,
    vehicleId: null,
    evidenceMethod: 'map_estimate',
    createdAt: now,
    updatedAt: now,
  };
  return { trip, consumedUntil: last.timestamp };
}

export function isDuplicateAutoTrip(candidate: TripRecord, existing: TripRecord[]): boolean {
  return existing.some(
    (t) =>
      t.source === 'auto_detected' &&
      Math.abs(t.startAt - candidate.startAt) < 120_000 &&
      Math.abs(t.endAt - candidate.endAt) < 120_000 &&
      Math.abs(t.distanceMiles - candidate.distanceMiles) < 0.3,
  );
}
