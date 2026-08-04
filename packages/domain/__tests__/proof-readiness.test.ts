import { proofReadinessForTrip, proofReadinessLabel, type TripRecord } from '../src';

function trip(partial: Partial<TripRecord> = {}): TripRecord {
  return {
    id: 't1',
    source: 'manual',
    status: 'confirmed',
    classification: 'business',
    startAt: 1,
    endAt: 2,
    distanceMiles: 12,
    purpose: 'Client visit',
    notes: null,
    hasRouteCoordinates: false,
    confidence: 'high',
    startLabel: 'Home',
    endLabel: 'Office',
    ...partial,
  };
}

describe('Proof readiness', () => {
  it('marks confirmed work trips ready', () => {
    expect(proofReadinessForTrip(trip())).toBe('ready');
    expect(proofReadinessLabel('ready')).toBe('Ready');
  });

  it('flags missing purpose and recovered/imported provenance', () => {
    expect(proofReadinessForTrip(trip({ purpose: '' }))).toBe('missing_purpose');
    expect(proofReadinessForTrip(trip({ source: 'recovered' }))).toBe('recovered');
    expect(proofReadinessForTrip(trip({ source: 'imported' }))).toBe('imported');
  });

  it('flags incomplete routes and low confidence', () => {
    expect(
      proofReadinessForTrip(
        trip({ startLabel: null, endLabel: null, distanceMiles: 0, purpose: 'Work' }),
      ),
    ).toBe('incomplete_route');
    expect(proofReadinessForTrip(trip({ confidence: 'low' }))).toBe('needs_attention');
  });

  it('keeps non-work trips out of ready proof', () => {
    expect(proofReadinessForTrip(trip({ status: 'pending', classification: 'unclassified' }))).toBe(
      'needs_attention',
    );
  });
});
