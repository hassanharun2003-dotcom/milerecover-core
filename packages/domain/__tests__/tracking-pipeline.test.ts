import {
  DEFAULT_TRACKING_CONFIG,
  calendarPeriodKey,
  canCaptureAutomaticTrip,
  countAutomaticTripsInPeriod,
  createFreeEntitlement,
  evaluateSampleBuffer,
  overlapsExistingAutoTrip,
  sampleIndicatesMovement,
  type LocationSample,
  type TripRecord,
} from '../src';

const BASE_LATITUDE = 37.77;
const BASE_LONGITUDE = -122.42;
const BASE_TIMESTAMP = 1_700_000_000_000;
const METERS_PER_DEGREE_LATITUDE = 111_111;
const METERS_PER_DEGREE_LONGITUDE =
  METERS_PER_DEGREE_LATITUDE * Math.cos((BASE_LATITUDE * Math.PI) / 180);

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

function sampleAt(
  offsetMs: number,
  eastMeters: number,
  northMeters = 0,
  overrides: Partial<LocationSample> = {},
): LocationSample {
  return {
    latitude: BASE_LATITUDE + northMeters / METERS_PER_DEGREE_LATITUDE,
    longitude: BASE_LONGITUDE + eastMeters / METERS_PER_DEGREE_LONGITUDE,
    accuracyMeters: 12,
    speedMps: 8,
    timestamp: BASE_TIMESTAMP + offsetMs,
    ...overrides,
  };
}

function quietNow(samples: LocationSample[]): number {
  return samples[samples.length - 1].timestamp + DEFAULT_TRACKING_CONFIG.stopQuietMs + 1;
}

function autoTrip(partial: Partial<TripRecord> & { id: string; startAt: number }): TripRecord {
  return {
    source: 'auto_detected',
    status: 'pending',
    classification: 'unclassified',
    endAt: partial.startAt + 600_000,
    distanceMiles: 5,
    purpose: null,
    notes: null,
    hasRouteCoordinates: true,
    confidence: 'medium',
    ...partial,
  };
}

describe('Tracking pipeline rules', () => {
  it('discards quiet buffers that lack trip evidence instead of leaving noise', () => {
    const samples = [sample(0, { speedMps: 0 }), sample(1, { speedMps: 0, latitude: 37.77001 })];
    const result = evaluateSampleBuffer(samples, quietNow(samples));
    expect(result.action).toBe('discard');
    if (result.action === 'discard') {
      expect(result.consumedUntil).toBe(samples[1].timestamp);
      expect(result.reason).toBe('insufficient_evidence');
    }
  });

  it('discards stationary GPS drift even when jitter accumulates path distance', () => {
    const offsets = [30, -30, 30, -30, 30, -30, 30, -30];
    const samples = offsets.map((eastMeters, i) =>
      sampleAt(i * 30_000, eastMeters, 0, { speedMps: 0.4 }),
    );
    const result = evaluateSampleBuffer(samples, quietNow(samples));
    expect(result.action).toBe('discard');
    if (result.action === 'discard') {
      expect(result.reason).toBe('stationary_drift');
    }
  });

  it('discards short walking-speed movement instead of surfacing an ordinary drive', () => {
    const samples = Array.from({ length: 8 }, (_, i) =>
      sampleAt(i * 30_000, i * 65, 0, { speedMps: 2 }),
    );
    const result = evaluateSampleBuffer(samples, quietNow(samples));
    expect(result.action).toBe('discard');
    if (result.action === 'discard') {
      expect(result.reason).toBe('walking_noise');
    }
  });

  it('discards short parking-lot movement with too little trip evidence', () => {
    const samples = Array.from({ length: 4 }, (_, i) =>
      sampleAt(i * 25_000, i * 55, 0, { speedMps: 5 }),
    );
    const result = evaluateSampleBuffer(samples, quietNow(samples));
    expect(result.action).toBe('discard');
    if (result.action === 'discard') {
      expect(result.reason).toBe('insufficient_evidence');
    }
  });

  it('discards buffers dominated by poor-accuracy samples', () => {
    const samples = Array.from({ length: 6 }, (_, i) =>
      sampleAt(i * 30_000, i * 120, 0, {
        accuracyMeters: i < 4 ? 125 : 12,
        speedMps: 10,
      }),
    );
    const result = evaluateSampleBuffer(samples, quietNow(samples));
    expect(result.action).toBe('discard');
    if (result.action === 'discard') {
      expect(result.reason).toBe('poor_accuracy');
    }
  });

  it('closes a genuine short vehicle drive as low confidence', () => {
    const samples = Array.from({ length: 5 }, (_, i) =>
      sampleAt(i * 30_000, i * 85, 0, { speedMps: 7 }),
    );
    const result = evaluateSampleBuffer(samples, quietNow(samples));
    expect(result.action).toBe('close');
    if (result.action === 'close') {
      expect(result.trip.distanceMiles).toBeGreaterThan(0.1);
      expect(result.trip.confidence).toBe('low');
      expect(result.trip.notes).toContain('short distance');
    }
  });

  it('closes a normal commute from recorded points only', () => {
    const samples = Array.from({ length: 20 }, (_, i) =>
      sampleAt(i * 30_000, i * 250, 0, { speedMps: 14 }),
    );
    const result = evaluateSampleBuffer(samples, quietNow(samples));
    expect(result.action).toBe('close');
    if (result.action === 'close') {
      expect(result.trip.distanceMiles).toBeGreaterThan(0);
      expect(result.trip.routePreview?.length).toBeGreaterThan(1);
      expect(result.trip.startLabel).toBeNull();
      expect(result.trip.confidence).toBe('medium');
    }
  });

  it('keeps stoplight pauses in one buffered trip candidate when both sides remain buffered', () => {
    const samples = [
      sampleAt(0, 0, 0, { speedMps: 12 }),
      sampleAt(30_000, 150, 0, { speedMps: 12 }),
      sampleAt(60_000, 300, 0, { speedMps: 10 }),
      sampleAt(90_000, 450, 0, { speedMps: 0 }),
      sampleAt(180_000, 600, 0, { speedMps: 10 }),
      sampleAt(210_000, 750, 0, { speedMps: 12 }),
      sampleAt(240_000, 900, 0, { speedMps: 12 }),
      sampleAt(270_000, 1050, 0, { speedMps: 12 }),
    ];
    const result = evaluateSampleBuffer(samples, quietNow(samples));
    expect(result.action).toBe('close');
    if (result.action === 'close') {
      expect(result.trip.startAt).toBe(samples[0].timestamp);
      expect(result.trip.endAt).toBe(samples[samples.length - 1].timestamp);
      expect(result.trip.distanceMiles).toBeGreaterThan(0.5);
    }
  });

  it('filters impossible jumps before computing trip distance', () => {
    const impossibleJump = sampleAt(20_000, 4_000_000, 0, { speedMps: 12 });
    const samples = [
      sampleAt(0, 0, 0, { speedMps: 12 }),
      impossibleJump,
      sampleAt(40_000, 75, 0, { speedMps: 12 }),
      sampleAt(70_000, 200, 0, { speedMps: 12 }),
      sampleAt(100_000, 350, 0, { speedMps: 12 }),
      sampleAt(130_000, 500, 0, { speedMps: 12 }),
    ];
    const result = evaluateSampleBuffer(samples, quietNow(samples));
    expect(result.action).toBe('close');
    if (result.action === 'close') {
      expect(result.trip.distanceMiles).toBeLessThan(1);
      expect(result.trip.routePreview).not.toContainEqual({
        latitude: impossibleJump.latitude,
        longitude: impossibleJump.longitude,
      });
    }
  });

  it('does not turn two stationary noise fragments around the same place into trips', () => {
    const makeFragment = (baseOffsetMs: number) =>
      [25, -25, 25, -25, 25, -25].map((eastMeters, i) =>
        sampleAt(baseOffsetMs + i * 30_000, eastMeters, 0, { speedMps: 0.5 }),
      );

    for (const fragment of [makeFragment(0), makeFragment(900_000)]) {
      const result = evaluateSampleBuffer(fragment, quietNow(fragment));
      expect(result.action).toBe('discard');
      if (result.action === 'discard') {
        expect(result.reason).toBe('stationary_drift');
      }
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

  it('counts only surfaced automatic trips against the Free allowance', () => {
    const now = new Date(2026, 3, 15).getTime();
    const period = calendarPeriodKey(now);
    const surfaced = Array.from({ length: 39 }, (_, i) =>
      autoTrip({ id: `pending-${i}`, startAt: now + i * 1000 }),
    );
    const notSurfaced = [
      autoTrip({ id: 'rejected-noise', startAt: now, status: 'rejected' }),
      autoTrip({ id: 'draft-noise', startAt: now, status: 'draft' }),
    ];

    expect(countAutomaticTripsInPeriod([...surfaced, ...notSurfaced], period)).toBe(39);
    expect(canCaptureAutomaticTrip(createFreeEntitlement(now), [...surfaced, ...notSurfaced], now)).toBe(true);

    const atLimit = [
      ...surfaced,
      autoTrip({ id: 'personal-surfaced', startAt: now, status: 'personal' }),
      ...notSurfaced,
    ];
    expect(countAutomaticTripsInPeriod(atLimit, period)).toBe(40);
    expect(canCaptureAutomaticTrip(createFreeEntitlement(now), atLimit, now)).toBe(false);
  });
});
