import type { LocationSample } from './segmentation';

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(a: LocationSample, b: LocationSample): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Reject impossible jumps (teleportation) between consecutive accepted samples.
 * Does not invent intermediate geometry — caller simply drops the bad point.
 */
export function isImpossibleJump(
  previous: LocationSample,
  next: LocationSample,
  options?: { maxSpeedMps?: number },
): boolean {
  const maxSpeed = options?.maxSpeedMps ?? 55; // ~123 mph hard ceiling
  const dtSec = (next.timestamp - previous.timestamp) / 1000;
  if (dtSec <= 0) return true;
  const meters = haversineMeters(previous, next);
  const implied = meters / dtSec;
  return implied > maxSpeed;
}

/** Mark gaps when consecutive samples are farther apart in time than threshold. */
export function hasVisibleRouteGap(
  samples: LocationSample[],
  gapMs = 120_000,
): boolean {
  for (let i = 1; i < samples.length; i += 1) {
    if (samples[i].timestamp - samples[i - 1].timestamp > gapMs) return true;
  }
  return false;
}

/**
 * Smooth path by dropping rejected points only — never interpolates new coordinates.
 */
export function filterPathWithoutInvention(
  samples: LocationSample[],
  accept: (sample: LocationSample, previous: LocationSample | null) => boolean,
): LocationSample[] {
  const out: LocationSample[] = [];
  for (const sample of samples) {
    const previous = out[out.length - 1] ?? null;
    if (accept(sample, previous)) out.push(sample);
  }
  return out;
}
