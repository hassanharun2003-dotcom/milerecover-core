import {
  FREE_AUTOMATIC_TRIP_LIMIT,
  FREE_MISSING_SCAN_LIMIT,
  applyVehicleFieldUpdate,
  buildProofIssues,
  calendarPeriodKey,
  canCaptureAutomaticTrip,
  canRunMissingScan,
  capabilitiesForEntitlement,
  countAutomaticTripsInPeriod,
  createFreeEntitlement,
  createTripRateSnapshot,
  filterSample,
  isImpossibleJump,
  localeProfileFromCountry,
  mapEngineRuntimeToShell,
  proofFixCtaLabel,
  remainingAutomaticTrips,
  resolveTripEstimatedValue,
  suggestedNickname,
  transitionTripMachine,
  vehicleDisplaySubtitle,
  vehicleDisplayTitle,
  type LocationSample,
  type TripRecord,
} from '../src';

function autoTrip(partial: Partial<TripRecord> & { startAt: number }): TripRecord {
  const { startAt, ...rest } = partial;
  return {
    id: rest.id ?? `auto-${startAt}`,
    source: 'auto_detected',
    status: 'pending',
    classification: 'unclassified',
    startAt,
    endAt: startAt + 600_000,
    distanceMiles: 5,
    purpose: null,
    notes: null,
    hasRouteCoordinates: true,
    confidence: 'medium',
    ...rest,
  };
}

describe('Free entitlement allowances', () => {
  it('allows Free automatic capture with a 40/month limit', () => {
    const free = createFreeEntitlement();
    const caps = capabilitiesForEntitlement(free);
    expect(caps.canUseAutomaticCapture).toBe(true);
    expect(caps.automaticTripLimit).toBe(FREE_AUTOMATIC_TRIP_LIMIT);
    expect(caps.missingScanLimit).toBe(FREE_MISSING_SCAN_LIMIT);
    expect(caps.csvExportEnabled).toBe(true);
    expect(caps.pdfExportEnabled).toBe(false);
  });

  it('counts auto trips in the calendar month and blocks at 40', () => {
    const now = new Date(2026, 3, 15).getTime(); // April 2026
    const period = calendarPeriodKey(now);
    const trips = Array.from({ length: 40 }, (_, i) =>
      autoTrip({ startAt: new Date(2026, 3, 1 + (i % 28)).getTime(), id: `a-${i}` }),
    );
    expect(countAutomaticTripsInPeriod(trips, period)).toBe(40);
    expect(canCaptureAutomaticTrip(createFreeEntitlement(now), trips, now)).toBe(false);
    expect(remainingAutomaticTrips(createFreeEntitlement(now), trips, now)).toBe(0);
  });

  it('does not count rejected auto trips against the Free allowance', () => {
    const now = new Date(2026, 3, 15).getTime();
    const trips = [
      autoTrip({ startAt: now, status: 'rejected' }),
      autoTrip({ startAt: now - 1000, id: 'ok' }),
    ];
    expect(countAutomaticTripsInPeriod(trips, calendarPeriodKey(now))).toBe(1);
  });

  it('enforces one missing scan per month on Free', () => {
    const free = createFreeEntitlement();
    expect(canRunMissingScan(free, 0)).toBe(true);
    expect(canRunMissingScan(free, 1)).toBe(false);
  });

  it('gives Plus unlimited automatic trips when store-verified', () => {
    const plus = {
      ...createFreeEntitlement(),
      planId: 'plus' as const,
      status: 'plusActive' as const,
      storeVerified: true,
      source: 'store' as const,
    };
    const caps = capabilitiesForEntitlement(plus);
    expect(caps.automaticTripLimit).toBeNull();
    expect(caps.missingScanLimit).toBeNull();
    expect(caps.pdfExportEnabled).toBe(true);
  });
});

describe('Rate snapshot immutability', () => {
  it('uses rateSnapshot for accepted work trips even when live rate changes', () => {
    const locale = localeProfileFromCountry('US', { centsPerMile: 70, now: 1_000 });
    const trip: TripRecord = {
      id: 't1',
      source: 'manual',
      status: 'confirmed',
      classification: 'business',
      startAt: 2_000,
      endAt: 3_000,
      distanceMiles: 10,
      purpose: 'Client',
      notes: null,
      hasRouteCoordinates: false,
      confidence: 'high',
      rateSnapshot: createTripRateSnapshot(locale, 2_000),
    };
    const laterLocale = localeProfileFromCountry('US', { centsPerMile: 99, now: 9_000 });
    const value = resolveTripEstimatedValue(trip, laterLocale);
    expect(value.source).toBe('rate_snapshot');
    expect(value.estimatedValueCents).toBe(700); // 10 * 70
    expect(value.missingHistoricalRate).toBe(false);
  });

  it('surfaces missing historical rate when snapshot has null cents', () => {
    const locale = localeProfileFromCountry('US', { centsPerMile: 70 });
    const trip: TripRecord = {
      id: 't2',
      source: 'manual',
      status: 'confirmed',
      classification: 'business',
      startAt: 2_000,
      endAt: 3_000,
      distanceMiles: 10,
      purpose: 'Client',
      notes: null,
      hasRouteCoordinates: false,
      confidence: 'high',
      rateSnapshot: {
        centsPerMile: null,
        currencyCode: 'USD',
        distanceUnit: 'mi',
        countryCode: 'US',
        effectiveAt: 2_000,
        label: null,
      },
    };
    const value = resolveTripEstimatedValue(trip, locale);
    expect(value.missingHistoricalRate).toBe(true);
    expect(value.estimatedValueCents).toBeNull();
  });
});

describe('Vehicle canonicalization', () => {
  it('keeps nickname stable once user-set while make/model change', () => {
    const base = {
      id: 'v1',
      nickname: 'Work sedan',
      year: '2020',
      make: 'Honda',
      model: 'Civic',
      nicknameUserSet: true,
    };
    const next = applyVehicleFieldUpdate(base, { make: 'Toyota', model: 'Camry' });
    expect(next.nickname).toBe('Work sedan');
    expect(next.make).toBe('Toyota');
    expect(next.model).toBe('Camry');
    expect(vehicleDisplayTitle(next)).toBe('Work sedan');
    expect(vehicleDisplaySubtitle(next)).toBe('2020 Toyota Camry');
  });

  it('auto-updates nickname until user edits it', () => {
    const base = {
      id: 'v1',
      nickname: suggestedNickname({ year: '2020', make: 'Honda', model: 'Civic' }),
      year: '2020',
      make: 'Honda',
      model: 'Civic',
      nicknameUserSet: false,
    };
    const next = applyVehicleFieldUpdate(base, { make: 'Hyundai', model: 'Elantra' });
    expect(next.nickname).toBe('2020 Hyundai Elantra');
    expect(vehicleDisplayTitle(next)).toBe('2020 Hyundai Elantra');
    expect(vehicleDisplaySubtitle(next)).toBeNull();
  });
});

describe('Proof issue CTA counts', () => {
  it('separates required from recommended and labels CTAs correctly', () => {
    const trips: TripRecord[] = [
      {
        id: 't1',
        source: 'manual',
        status: 'confirmed',
        classification: 'business',
        startAt: 1,
        endAt: 2,
        distanceMiles: 10,
        purpose: '',
        notes: null,
        hasRouteCoordinates: false,
        confidence: 'high',
        startLabel: null,
        endLabel: null,
      },
    ];
    const issues = buildProofIssues({
      confirmedWorkTrips: trips,
      unresolvedCount: 0,
      vehiclesExist: true,
      valueRequested: true,
      rateOk: false,
    });
    expect(issues.required.length).toBeGreaterThanOrEqual(2); // purpose + rate
    expect(issues.recommended.some((i) => i.id === 'route')).toBe(true);
    expect(proofFixCtaLabel(2, 1)).toBe('Fix 2 required items');
    expect(proofFixCtaLabel(1, 0)).toBe('Fix next issue');
    expect(proofFixCtaLabel(0, 0)).toBe('Preview report');
  });
});

describe('Trip state machine', () => {
  it('follows IDLE → POSSIBLE_MOVEMENT → TRACKING → POSSIBLE_STOP → FINALIZING → NEEDS_REVIEW', () => {
    let state = transitionTripMachine('IDLE', { type: 'SAMPLE_ACCEPTED', moving: true }).next;
    expect(state).toBe('POSSIBLE_MOVEMENT');
    state = transitionTripMachine(state, { type: 'SAMPLE_ACCEPTED', moving: true }).next;
    expect(state).toBe('TRACKING');
    state = transitionTripMachine(state, { type: 'QUIET_ELAPSED' }).next;
    expect(state).toBe('POSSIBLE_STOP');
    state = transitionTripMachine(state, { type: 'QUIET_ELAPSED' }).next;
    expect(state).toBe('FINALIZING');
    state = transitionTripMachine(state, { type: 'EVIDENCE_SUFFICIENT' }).next;
    expect(state).toBe('NEEDS_REVIEW');
  });

  it('maps engine runtime into AppContext shell states', () => {
    expect(mapEngineRuntimeToShell('foreground_background')).toBe('active');
    expect(mapEngineRuntimeToShell('idle')).toBe('idle');
    expect(mapEngineRuntimeToShell('permission_denied')).toBe('unavailable');
  });
});

describe('GPS quality', () => {
  it('rejects impossible jumps without inventing points', () => {
    const a: LocationSample = {
      latitude: 37.77,
      longitude: -122.42,
      accuracyMeters: 10,
      speedMps: 10,
      timestamp: 1_000,
    };
    const b: LocationSample = {
      latitude: 40.71,
      longitude: -74.0,
      accuracyMeters: 10,
      speedMps: 10,
      timestamp: 2_000, // 1 second later, coast-to-coast
    };
    expect(isImpossibleJump(a, b)).toBe(true);
    expect(filterSample(a)).toBe(true);
  });
});
