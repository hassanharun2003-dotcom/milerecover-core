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
  /** Minimum start-to-end displacement for a legitimate auto trip. */
  minNetDisplacementMeters: number;
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
  /** Short, slow buffers under this path length are treated as walking noise. */
  walkingNoiseMaxDistanceMeters: number;
  /** Median speed below this suggests non-vehicle movement. */
  walkingMedianSpeedMps: number;
  /** Max speed below this suggests non-vehicle movement. */
  walkingMaxSpeedMps: number;
  /** Short buffers with low displacement are not surfaced as review trips. */
  shortLowDisplacementDurationMs: number;
  /** Start-to-end displacement below this is too weak for short buffers. */
  shortLowDisplacementMeters: number;
  /** Discard quiet buffers when too many raw samples were poor accuracy. */
  maxPoorAccuracySampleFraction: number;
  /** Mark surfaced trips below this path length low-confidence. */
  lowConfidenceDistanceMeters: number;
  /** Mark surfaced trips below this displacement low-confidence. */
  lowConfidenceNetDisplacementMeters: number;
  /** Mark surfaced trips below this duration low-confidence. */
  lowConfidenceDurationMs: number;
}

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  minTripDistanceMeters: 150,
  minNetDisplacementMeters: 100,
  minTripDurationMs: 90_000,
  stopQuietMs: 180_000,
  maxSpeedMps: 50,
  maxAccuracyMeters: 80,
  movingSpeedMps: 1.5,
  movingDistanceMeters: 20,
  walkingNoiseMaxDistanceMeters: 805,
  walkingMedianSpeedMps: 2.5,
  walkingMaxSpeedMps: 4,
  shortLowDisplacementDurationMs: 120_000,
  shortLowDisplacementMeters: 175,
  maxPoorAccuracySampleFraction: 0.45,
  lowConfidenceDistanceMeters: 805,
  lowConfidenceNetDisplacementMeters: 250,
  lowConfidenceDurationMs: 180_000,
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

export function pathDistanceMeters(
  samples: LocationSample[],
  options?: { maxSpeedMps?: number },
): number {
  let sum = 0;
  for (let i = 1; i < samples.length; i += 1) {
    if (isImpossibleJump(samples[i - 1], samples[i], options)) continue;
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
  | { action: 'discard'; consumedUntil: number; reason: SampleBufferDiscardReason };

export type SampleBufferDiscardReason =
  | 'insufficient_evidence'
  | 'stationary_drift'
  | 'walking_noise'
  | 'poor_accuracy';

interface SampleBufferEvidence {
  cleanSampleCount: number;
  poorAccuracySampleCount: number;
  poorAccuracyFraction: number;
  durationMs: number;
  pathDistanceMeters: number;
  netDisplacementMeters: number;
  medianSpeedMps: number | null;
  maxSpeedMps: number | null;
}

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
  const observed = samples
    .filter((s) => Number.isFinite(s.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);
  if (observed.length < 2) return { action: 'wait' };
  const observedLast = observed[observed.length - 1];
  if (now - observedLast.timestamp < config.stopQuietMs) return { action: 'wait' };

  const clean = filterCleanPath(observed, config);
  const poorAccuracySampleCount = observed.filter((s) => hasPoorAccuracy(s, config)).length;
  const poorAccuracyFraction = poorAccuracySampleCount / observed.length;
  const consumedUntil = observedLast.timestamp;

  if (
    observed.length >= 4 &&
    poorAccuracyFraction > config.maxPoorAccuracySampleFraction
  ) {
    return { action: 'discard', consumedUntil, reason: 'poor_accuracy' };
  }

  if (clean.length < 2) {
    return { action: 'discard', consumedUntil, reason: 'insufficient_evidence' };
  }
  const first = clean[0];
  const last = clean[clean.length - 1];

  const evidence = summarizeEvidence(clean, {
    poorAccuracySampleCount,
    poorAccuracyFraction,
    maxSpeedMps: config.maxSpeedMps,
  });

  if (
    evidence.netDisplacementMeters < config.minNetDisplacementMeters &&
    evidence.pathDistanceMeters >= config.minTripDistanceMeters
  ) {
    return { action: 'discard', consumedUntil, reason: 'stationary_drift' };
  }

  if (
    (evidence.durationMs < config.minTripDurationMs ||
      evidence.pathDistanceMeters < config.minTripDistanceMeters ||
      evidence.netDisplacementMeters < config.minNetDisplacementMeters) ||
    (evidence.durationMs < config.shortLowDisplacementDurationMs &&
      evidence.netDisplacementMeters < config.shortLowDisplacementMeters)
  ) {
    return { action: 'discard', consumedUntil, reason: 'insufficient_evidence' };
  }

  if (
    evidence.medianSpeedMps != null &&
    evidence.maxSpeedMps != null &&
    evidence.medianSpeedMps < config.walkingMedianSpeedMps &&
    evidence.maxSpeedMps < config.walkingMaxSpeedMps &&
    evidence.pathDistanceMeters < config.walkingNoiseMaxDistanceMeters
  ) {
    return { action: 'discard', consumedUntil, reason: 'walking_noise' };
  }

  const miles = evidence.pathDistanceMeters / 1609.344;
  const hasGap =
    hasVisibleRouteGap(clean, 120_000) ||
    clean.some((s) => s.accuracyMeters != null && s.accuracyMeters > 40);
  const lowConfidenceReasons = lowConfidenceNotes(evidence, hasGap, config);
  const confidence = lowConfidenceReasons.length > 0 ? 'low' : 'medium';

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
    notes:
      confidence === 'low'
        ? `Automatic capture has limited drive evidence (${lowConfidenceReasons.join(', ')}). Confirm in Review; miles are from recorded GPS points only.`
        : 'Automatic capture — confirm work vs personal in Review.',
    hasRouteCoordinates: routePreview.length >= 2,
    routePreview: routePreview.length >= 2 ? routePreview : null,
    confidence,
    startLabel: null,
    endLabel: null,
    vehicleId: null,
    evidenceMethod: 'map_estimate',
    createdAt: now,
    updatedAt: now,
  };
  return { action: 'close', trip, consumedUntil };
}

function filterCleanPath(samples: LocationSample[], config: TrackingConfig): LocationSample[] {
  const out: LocationSample[] = [];
  for (const sample of samples) {
    if (!filterSample(sample, config)) continue;
    const previous = out[out.length - 1] ?? null;
    if (previous && isImpossibleJump(previous, sample, { maxSpeedMps: config.maxSpeedMps })) {
      continue;
    }
    out.push(sample);
  }
  return out;
}

function hasPoorAccuracy(sample: LocationSample, config: TrackingConfig): boolean {
  return sample.accuracyMeters != null && sample.accuracyMeters > config.maxAccuracyMeters;
}

function summarizeEvidence(
  clean: LocationSample[],
  rawQuality: Pick<
    SampleBufferEvidence,
    'poorAccuracySampleCount' | 'poorAccuracyFraction'
  > & { maxSpeedMps: number },
): SampleBufferEvidence {
  const first = clean[0];
  const last = clean[clean.length - 1];
  const speeds = speedEvidence(clean, rawQuality.maxSpeedMps);
  return {
    cleanSampleCount: clean.length,
    poorAccuracySampleCount: rawQuality.poorAccuracySampleCount,
    poorAccuracyFraction: rawQuality.poorAccuracyFraction,
    durationMs: last.timestamp - first.timestamp,
    pathDistanceMeters: pathDistanceMeters(clean, { maxSpeedMps: rawQuality.maxSpeedMps }),
    netDisplacementMeters: haversineMeters(first, last),
    medianSpeedMps: median(speeds),
    maxSpeedMps: speeds.length > 0 ? Math.max(...speeds) : null,
  };
}

function speedEvidence(samples: LocationSample[], maxSpeedMps: number): number[] {
  const observedSpeeds = samples
    .map((sample) => sample.speedMps)
    .filter((speed): speed is number => speed != null && Number.isFinite(speed) && speed >= 0);
  if (observedSpeeds.length >= 2) return observedSpeeds;

  const inferred: number[] = [];
  for (let i = 1; i < samples.length; i += 1) {
    const previous = samples[i - 1];
    const next = samples[i];
    if (isImpossibleJump(previous, next, { maxSpeedMps })) continue;
    const dtSec = (next.timestamp - previous.timestamp) / 1000;
    if (dtSec <= 0) continue;
    inferred.push(haversineMeters(previous, next) / dtSec);
  }
  return inferred;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function lowConfidenceNotes(
  evidence: SampleBufferEvidence,
  hasGap: boolean,
  config: TrackingConfig,
): string[] {
  const notes: string[] = [];
  if (evidence.pathDistanceMeters < config.lowConfidenceDistanceMeters) {
    notes.push('short distance');
  }
  if (evidence.netDisplacementMeters < config.lowConfidenceNetDisplacementMeters) {
    notes.push('limited start-to-end movement');
  }
  if (evidence.durationMs < config.lowConfidenceDurationMs) {
    notes.push('short duration');
  }
  if (hasGap || evidence.poorAccuracyFraction > 0.15) {
    notes.push('GPS gaps or reduced accuracy');
  }
  return [...new Set(notes)];
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
