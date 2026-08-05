import type { TripRecord } from '../trips/types';
import { haversineMeters, hasVisibleRouteGap, isImpossibleJump } from './gpsQuality';

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
  /** Speed above which a sample counts as moving (default 1.5 m/s). */
  movingSpeedMps: number;
  /** Minimum meters between samples to infer movement when speed is null. */
  movingDistanceMeters: number;
}

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  minTripDistanceMeters: 150,
  minTripDurationMs: 90_000,
  stopQuietMs: 180_000,
  maxSpeedMps: 50,
  maxAccuracyMeters: 80,
  movingSpeedMps: 1.5,
  movingDistanceMeters: 20,
};

export function filterSample(sample: LocationSample, config = DEFAULT_TRACKING_CONFIG): boolean {
  if (sample.accuracyMeters != null && sample.accuracyMeters > config.maxAccuracyMeters) {
    return false;
  }
  if (sample.speedMps != null && sample.speedMps > config.maxSpeedMps) {
    return false;
  }
  return true;
}

/**
 * Conservative movement signal — never treats missing speed as movement by itself.
 * When speed is null, require a real displacement from the previous accepted sample.
 */
export function sampleIndicatesMovement(
  sample: LocationSample,
  previous: LocationSample | null,
  config = DEFAULT_TRACKING_CONFIG,
): boolean {
  if (sample.speedMps != null) {
    return sample.speedMps >= config.movingSpeedMps;
  }
  if (!previous) return false;
  if (isImpossibleJump(previous, sample, { maxSpeedMps: config.maxSpeedMps })) return false;
  const meters = haversineMeters(previous, sample);
  const dtSec = (sample.timestamp - previous.timestamp) / 1000;
  if (dtSec <= 0) return false;
  return meters >= config.movingDistanceMeters && meters / dtSec >= 0.8;
}

export function pathDistanceMeters(samples: LocationSample[]): number {
  let sum = 0;
  for (let i = 1; i < samples.length; i += 1) {
    if (isImpossibleJump(samples[i - 1], samples[i])) continue;
    sum += haversineMeters(samples[i - 1], samples[i]);
  }
  return sum;
}

/** Keep a short observed polyline for map preview — never invents midpoints. */
export function downsampleRoutePreview(
  samples: LocationSample[],
  maxPoints = 40,
): Array<{ latitude: number; longitude: number }> {
  if (samples.length === 0) return [];
  if (samples.length <= maxPoints) {
    return samples.map((s) => ({ latitude: s.latitude, longitude: s.longitude }));
  }
  const out: Array<{ latitude: number; longitude: number }> = [];
  const step = (samples.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i += 1) {
    const sample = samples[Math.round(i * step)];
    out.push({ latitude: sample.latitude, longitude: sample.longitude });
  }
  return out;
}

export type SampleBufferEvaluation =
  | { action: 'wait' }
  | { action: 'close'; trip: TripRecord; consumedUntil: number }
  | { action: 'discard'; consumedUntil: number; reason: 'insufficient_evidence' };

/**
 * Evaluate an open buffer after samples arrive.
 * Quiet + insufficient evidence discards the quiet window so noise cannot merge into a later drive.
 * Never invents coordinates.
 */
export function evaluateSampleBuffer(
  samples: LocationSample[],
  now = Date.now(),
  config = DEFAULT_TRACKING_CONFIG,
): SampleBufferEvaluation {
  const clean = samples
    .filter((s) => filterSample(s, config))
    .sort((a, b) => a.timestamp - b.timestamp);
  if (clean.length < 2) return { action: 'wait' };
  const first = clean[0];
  const last = clean[clean.length - 1];
  if (now - last.timestamp < config.stopQuietMs) return { action: 'wait' };

  const duration = last.timestamp - first.timestamp;
  const meters = pathDistanceMeters(clean);
  if (duration < config.minTripDurationMs || meters < config.minTripDistanceMeters) {
    return { action: 'discard', consumedUntil: last.timestamp, reason: 'insufficient_evidence' };
  }

  const miles = meters / 1609.344;
  const hasGap =
    hasVisibleRouteGap(clean, 120_000) ||
    clean.some((s) => s.accuracyMeters != null && s.accuracyMeters > 40);

  const routePreview = downsampleRoutePreview(clean);
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
    hasRouteCoordinates: routePreview.length >= 2,
    routePreview: routePreview.length >= 2 ? routePreview : null,
    confidence: hasGap ? 'low' : 'medium',
    startLabel: null,
    endLabel: null,
    vehicleId: null,
    evidenceMethod: 'map_estimate',
    createdAt: now,
    updatedAt: now,
  };
  return { action: 'close', trip, consumedUntil: last.timestamp };
}

/**
 * Segment an open buffer into a completed trip candidate when quiet time elapsed.
 * @deprecated Prefer evaluateSampleBuffer — this wrapper returns null for wait/discard.
 */
export function maybeCloseTripFromSamples(
  samples: LocationSample[],
  now = Date.now(),
  config = DEFAULT_TRACKING_CONFIG,
): { trip: TripRecord; consumedUntil: number } | null {
  const result = evaluateSampleBuffer(samples, now, config);
  if (result.action !== 'close') return null;
  return { trip: result.trip, consumedUntil: result.consumedUntil };
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

/** Prevent overlapping auto sessions (start inside another auto trip window). */
export function overlapsExistingAutoTrip(candidate: TripRecord, existing: TripRecord[]): boolean {
  return existing.some((t) => {
    if (t.source !== 'auto_detected') return false;
    if (t.status === 'rejected') return false;
    return candidate.startAt < t.endAt && candidate.endAt > t.startAt;
  });
}
