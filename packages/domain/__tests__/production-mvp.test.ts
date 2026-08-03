import {
  applyStorePurchaseResult,
  capabilitiesForEntitlement,
  createEmptyOnboardingState,
  createFreeEntitlement,
  CURRENT_ONBOARDING_VERSION,
  DEFAULT_TRACKING_CONFIG,
  expireTrialIfNeeded,
  invalidateStaleOnboardingCompletion,
  isDuplicateAutoTrip,
  isOnboardingMinimumComplete,
  isOnboardingVersionStale,
  maybeCloseTripFromSamples,
  nextIncompleteStep,
  shouldOfferTrial,
  type LocationSample,
  type TripRecord,
} from '../src';

describe('Onboarding completeness', () => {
  it('requires goal, pain points, next action, and current version stamp', () => {
    const empty = createEmptyOnboardingState();
    expect(isOnboardingMinimumComplete(empty)).toBe(false);
    expect(nextIncompleteStep(empty)).toBe('welcome');
    const complete = {
      ...empty,
      primaryGoal: 'employee_reimbursement' as const,
      selectedPainPoints: ['forget_to_track' as const],
      drivingPattern: 'regular_locations' as const,
      protectionEducationAcknowledged: true,
      nextActionSelected: 'add_first_drive' as const,
      completedAt: 1,
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
    };
    expect(isOnboardingMinimumComplete(complete)).toBe(true);
    expect(nextIncompleteStep(complete)).toBeNull();
  });

  it('treats older completed versions as stale and invalidates without wiping answers', () => {
    const stale = {
      ...createEmptyOnboardingState(),
      primaryGoal: 'gig_delivery' as const,
      selectedPainPoints: ['tracker_misses' as const],
      nextActionSelected: 'start_protection' as const,
      completedAt: 99,
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION - 1,
    };
    expect(isOnboardingVersionStale(stale)).toBe(true);
    const next = invalidateStaleOnboardingCompletion(stale, 1000);
    expect(next.completedAt).toBeNull();
    expect(next.completedOnboardingVersion).toBeNull();
    expect(next.primaryGoal).toBe('gig_delivery');
    expect(next.selectedPainPoints).toEqual(['tracker_misses']);
    expect(next.currentStep).toBe('ready');
  });
});

describe('Entitlements', () => {
  it('keeps Free usable and never grants Plus from UI alone', () => {
    const free = createFreeEntitlement();
    const caps = capabilitiesForEntitlement(free);
    expect(caps.canUseAutomaticCapture).toBe(false);
    expect(caps.canUseStandardPdf).toBe(false);
    expect(caps.maxVehicles).toBe(1);
  });

  it('activates trial only from store-verified purchase result', () => {
    const after = applyStorePurchaseResult(createFreeEntitlement(), {
      ok: true,
      planId: 'plus',
      trial: true,
      trialEndsAt: Date.now() + 7 * 86400000,
      monthlyPriceLocalized: '$8.99',
    });
    expect(after.status).toBe('trialActive');
    expect(after.storeVerified).toBe(true);
    expect(capabilitiesForEntitlement(after).canUseAutomaticCapture).toBe(true);
  });

  it('expires trial to Free without inventing renewal', () => {
    const active = applyStorePurchaseResult(createFreeEntitlement(), {
      ok: true,
      planId: 'plus',
      trial: true,
      trialEndsAt: Date.now() - 1000,
    });
    const expired = expireTrialIfNeeded(active, Date.now());
    expect(expired.status).toBe('expired');
    expect(expired.planId).toBe('free');
    expect(capabilitiesForEntitlement(expired).canUseAutomaticCapture).toBe(false);
  });

  it('caps trial offers', () => {
    const ent = { ...createFreeEntitlement(), status: 'trialEligible' as const };
    expect(
      shouldOfferTrial(ent, 'first_confirmed_work_drive', {
        lastOfferAt: Date.now(),
        dismissedSession: false,
      }),
    ).toBe(false);
    expect(
      shouldOfferTrial(ent, 'first_confirmed_work_drive', {
        lastOfferAt: null,
        dismissedSession: false,
      }),
    ).toBe(true);
  });
});

describe('Tracking segmentation', () => {
  it('closes a trip from samples without inventing points', () => {
    const start = Date.now() - 600_000;
    const samples: LocationSample[] = [];
    for (let i = 0; i < 20; i += 1) {
      samples.push({
        latitude: 37.77 + i * 0.001,
        longitude: -122.42,
        accuracyMeters: 12,
        speedMps: 8,
        timestamp: start + i * 20_000,
      });
    }
    const closed = maybeCloseTripFromSamples(samples, start + 20 * 20_000 + DEFAULT_TRACKING_CONFIG.stopQuietMs + 1);
    expect(closed).not.toBeNull();
    expect(closed!.trip.source).toBe('auto_detected');
    expect(closed!.trip.status).toBe('pending');
    expect(closed!.trip.distanceMiles).toBeGreaterThan(0);
  });

  it('suppresses duplicate auto trips', () => {
    const trip: TripRecord = {
      id: 'a',
      source: 'auto_detected',
      status: 'pending',
      classification: 'unclassified',
      startAt: 1000,
      endAt: 2000,
      distanceMiles: 3.2,
      purpose: null,
      notes: null,
      hasRouteCoordinates: true,
      confidence: 'medium',
    };
    expect(isDuplicateAutoTrip({ ...trip, id: 'b' }, [trip])).toBe(true);
  });
});
