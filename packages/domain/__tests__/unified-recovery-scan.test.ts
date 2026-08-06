import { runUnifiedRecoveryScan, type TripRecord } from '../src';

function workTrip(partial: Partial<TripRecord> & Pick<TripRecord, 'id' | 'startAt' | 'endAt'>): TripRecord {
  return {
    source: 'manual',
    status: 'confirmed',
    classification: 'business',
    distanceMiles: 10,
    purpose: 'Client visit',
    notes: null,
    hasRouteCoordinates: false,
    confidence: 'high',
    startLabel: 'A',
    endLabel: 'B',
    ...partial,
  };
}

describe('Unified recovery scan', () => {
  it('never invents distance for gap suggestions', () => {
    const day = Date.parse('2026-08-01T09:00:00.000Z');
    const trips = [
      workTrip({ id: 'a', startAt: day, endAt: day + 3600000 }),
      workTrip({
        id: 'b',
        startAt: day + 8 * 3600000,
        endAt: day + 9 * 3600000,
        purpose: 'Return visit',
      }),
    ];
    const out = runUnifiedRecoveryScan({ trips, now: day + 10 * 3600000 });
    expect(out.length).toBeGreaterThan(0);
    for (const candidate of out) {
      if (candidate.id.startsWith('recovery-gap-')) {
        expect(candidate.proposedDistanceMiles).toBeNull();
        expect(candidate.plainLanguageExplanation).toMatch(/not inventing/i);
      }
    }
  });

  it('surfaces incomplete imported records without inventing miles', () => {
    const trip = workTrip({
      id: 'imp',
      source: 'imported',
      startAt: 1,
      endAt: 2,
      distanceMiles: 0,
      purpose: '',
      status: 'pending',
      classification: 'unclassified',
    });
    const out = runUnifiedRecoveryScan({ trips: [trip], now: 10 });
    expect(out.some((c) => c.id === 'recovery-import-imp')).toBe(true);
    expect(out.find((c) => c.id === 'recovery-import-imp')?.proposedDistanceMiles).toBeNull();
  });

  it('includes manual miss reports as confirmation-required suggestions', () => {
    const out = runUnifiedRecoveryScan({
      trips: [],
      manualMissReports: [{ id: 'm1', startAt: 1000, endAt: 2000, note: 'Forgot morning drive' }],
      now: 3000,
    });
    expect(out).toHaveLength(1);
    expect(out[0].evidence[0].kind).toBe('manual_report');
    expect(out[0].proposedDistanceMiles).toBeNull();
  });
});
