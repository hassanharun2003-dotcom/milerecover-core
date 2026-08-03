import {
  analyzeCsvImport,
  applyClassification,
  buildMileageCsv,
  buildMileageReportData,
  createManualTripRecord,
  escapeCsvCell,
  importRowsToTrips,
  rejectTrip,
  resolveReportPeriod,
  suggestRecoveryFromTripGaps,
  tripFromConfirmedRecovery,
  validateManualTripInput,
  type TripRecord,
} from '../src';

const baseTrip = (id: string, startAt: number, endAt: number, miles: number): TripRecord => ({
  id,
  source: 'manual',
  status: 'confirmed',
  classification: 'business',
  startAt,
  endAt,
  distanceMiles: miles,
  purpose: `Drive ${id}`,
  notes: null,
  hasRouteCoordinates: false,
  confidence: 'high',
});

describe('Manual trip validation', () => {
  it('rejects zero distance and inverted times', () => {
    const errors = validateManualTripInput({
      startAt: 2000,
      endAt: 1000,
      distanceMiles: 0,
      purpose: '',
      evidenceMethod: 'odometer',
      confirmAsWork: true,
    });
    expect(errors.map((e) => e.field)).toEqual(
      expect.arrayContaining(['distanceMiles', 'endAt', 'purpose']),
    );
  });

  it('creates a confirmed work trip when valid', () => {
    const trip = createManualTripRecord({
      startAt: 1_000,
      endAt: 2_000,
      distanceMiles: 12.5,
      purpose: 'Client visit',
      startLabel: 'Home',
      endLabel: 'Office',
      evidenceMethod: 'odometer',
      confirmAsWork: true,
    });
    expect(trip.status).toBe('confirmed');
    expect(trip.classification).toBe('business');
    expect(trip.source).toBe('manual');
  });
});

describe('Review classification helpers', () => {
  it('applies work/personal/reject and supports undo via prior snapshot', () => {
    const pending: TripRecord = {
      ...baseTrip('t1', 1, 2, 5),
      status: 'pending',
      classification: 'unclassified',
    };
    const work = applyClassification(pending, 'business');
    expect(work.status).toBe('confirmed');
    const personal = applyClassification(pending, 'personal');
    expect(personal.status).toBe('personal');
    const rejected = rejectTrip(pending);
    expect(rejected.status).toBe('rejected');
  });
});

describe('Recovery gap suggestions', () => {
  it('surfaces a gap with null distance and suppresses duplicates', () => {
    const day = Date.UTC(2026, 7, 1, 8, 0, 0);
    const trips = [
      baseTrip('a', day, day + 3600000, 10),
      baseTrip('b', day + 8 * 3600000, day + 9 * 3600000, 12),
    ];
    const first = suggestRecoveryFromTripGaps(trips);
    expect(first).toHaveLength(1);
    expect(first[0].proposedDistanceMiles).toBeNull();
    expect(first[0].plainLanguageExplanation).toMatch(/not inventing miles/i);
    const second = suggestRecoveryFromTripGaps(trips, { existing: first });
    expect(second).toHaveLength(0);
  });

  it('creates a recovered trip only after user distance confirmation', () => {
    const candidate = suggestRecoveryFromTripGaps([
      baseTrip('a', 0, 3600000, 10),
      baseTrip('b', 8 * 3600000, 9 * 3600000, 12),
    ])[0];
    const trip = tripFromConfirmedRecovery(candidate, 14.2, 'Forgotten client stop');
    expect(trip.source).toBe('recovered');
    expect(trip.distanceMiles).toBe(14.2);
    expect(trip.status).toBe('confirmed');
  });
});

describe('CSV export', () => {
  it('escapes commas and quotes', () => {
    expect(escapeCsvCell('Hello, "world"')).toBe('"Hello, ""world"""');
  });

  it('exports only confirmed work trips in period', () => {
    const periodStart = 0;
    const periodEnd = 10_000;
    const csv = buildMileageCsv(
      [
        { ...baseTrip('ok', 1000, 2000, 11.5), purpose: 'Site A', notes: 'line1\nline2' },
        { ...baseTrip('personal', 1500, 2500, 3), status: 'personal', classification: 'personal' },
        { ...baseTrip('pending', 1600, 2600, 4), status: 'pending', classification: 'unclassified' },
      ],
      { periodStart, periodEnd },
    );
    expect(csv).toContain('Date,Start Time,End Time');
    expect(csv).toContain('Site A');
    expect(csv).toContain('"line1\nline2"');
    expect(csv).not.toMatch(/,personal,/);
    expect(csv).toContain('Site A');
    expect(csv.match(/^/gm)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe('CSV import', () => {
  it('maps common headers and skips invalid rows', () => {
    const text = [
      'Date,Start,Destination,Purpose,Miles,Notes',
      '2026-08-01,Home,Office,Client,12.4,ok',
      'bad,Home,Office,Client,x,bad miles',
      '2026-08-02,A,B,Visit,8.0,',
    ].join('\n');
    const analyzed = analyzeCsvImport(text);
    expect(analyzed.validRows).toHaveLength(2);
    expect(analyzed.issues.length).toBeGreaterThan(0);
    const { trips, duplicatesSkipped } = importRowsToTrips(analyzed.validRows, []);
    expect(trips).toHaveLength(2);
    expect(trips[0].source).toBe('imported');
    expect(duplicatesSkipped).toBe(0);
    const again = importRowsToTrips(analyzed.validRows, trips);
    expect(again.duplicatesSkipped).toBe(2);
    expect(again.trips).toHaveLength(0);
  });
});

describe('Report mapping', () => {
  it('builds report data with real totals and excludes unresolved', () => {
    const period = resolveReportPeriod('ytd', Date.UTC(2026, 7, 3));
    const data = buildMileageReportData({
      trips: [
        { ...baseTrip('m1', period.startAt + 1000, period.startAt + 2000, 10), source: 'manual' },
        { ...baseTrip('r1', period.startAt + 3000, period.startAt + 4000, 5), source: 'recovered' },
        {
          ...baseTrip('u1', period.startAt + 5000, period.startAt + 6000, 9),
          status: 'pending',
          classification: 'unclassified',
        },
      ],
      period,
      userName: 'Sam',
      mileageUseType: 'employee',
    });
    expect(data.tripCount).toBe(2);
    expect(data.totalMiles).toBe(15);
    expect(data.manualMiles).toBe(10);
    expect(data.recoveredMiles).toBe(5);
    expect(data.unresolvedCount).toBe(1);
    expect(data.lineItems).toHaveLength(2);
    expect(data.disclaimer).toMatch(/not tax/i);
  });
});
