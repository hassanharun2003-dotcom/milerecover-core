import {
  DEFAULT_TRACKING_CONFIG,
  evaluateSampleBuffer,
  overlapsExistingAutoTrip,
  sampleIndicatesMovement,
  type LocationSample,
  type TripRecord,
} from '../src';

function sample(
  i: number,
  overrides: Partial<LocationSample> = {},
): LocationSample {
  return {
    latitude: 37.77 + i * 0.001,
    longitude: -122.42,
    accuracyMeters: 12,
    speedMps: 8,
    timestamp: 1_700_000_000_000 + i * 20_000,
    ...overrides,
  };
}

describe('Tracking pipeline rules', () => {
  it('discards quiet buffers that lack trip evidence instead of leaving noise', () => {
    const samples = [sample(0, { speedMps: 0 }), sample(1, { speedMps: 0, latitude: 37.77001 })];
    const now = samples[1].timestamp + DEFAULT_TRACKING_CONFIG.stopQuietMs + 1;
    const result = evaluateSampleBuffer(samples, now);
    expect(result.action).toBe('discard');
    if (result.action === 'discard') {
      expect(result.consumedUntil).toBe(samples[1].timestamp);
    }
  });

  it('closes a real trip from recorded points only', () => {
    const samples = Array.from({ length: 20 }, (_, i) => sample(i));
    const now = samples[19].timestamp + DEFAULT_TRACKING_CONFIG.stopQuietMs + 1;
    const result = evaluateSampleBuffer(samples, now);
    expect(result.action).toBe('close');
    if (result.action === 'close') {
      expect(result.trip.distanceMiles).toBeGreaterThan(0);
      expect(result.trip.routePreview?.length).toBeGreaterThan(1);
      expect(result.trip.startLabel).toBeNull();
    }
  });

  it('does not treat missing speed alone as movement', () => {
    const previous = sample(0, { speedMps: null });
    const next = sample(1, {
      speedMps: null,
      latitude: previous.latitude + 0.00001,
      timestamp: previous.timestamp + 5_000,
    });
    expect(sampleIndicatesMovement(next, previous)).toBe(false);
  });

  it('treats clear displacement without speed as movement', () => {
    const previous = sample(0, { speedMps: null });
    const next = sample(5, {
      speedMps: null,
      timestamp: previous.timestamp + 30_000,
    });
    expect(sampleIndicatesMovement(next, previous)).toBe(true);
  });

  it('detects overlapping auto trips', () => {
    const existing: TripRecord[] = [
      {
        id: 'a',
        source: 'auto_detected',
        status: 'pending',
        classification: 'unclassified',
        startAt: 1000,
        endAt: 5000,
        distanceMiles: 2,
        purpose: null,
        notes: null,
        hasRouteCoordinates: true,
        confidence: 'medium',
      },
    ];
    const candidate: TripRecord = {
      ...existing[0],
      id: 'b',
      startAt: 4000,
      endAt: 8000,
    };
    expect(overlapsExistingAutoTrip(candidate, existing)).toBe(true);
  });
});
