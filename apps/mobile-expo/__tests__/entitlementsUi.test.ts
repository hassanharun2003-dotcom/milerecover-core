import {
  capabilitiesForEntitlement,
  createFreeEntitlement,
  shouldOfferTrial,
  type EntitlementSnapshot,
} from '@milerecover/domain';

describe('Entitlements UI smoke', () => {
  it('offers a trial to eligible Free users and frequency caps repeated offers', () => {
    const entitlement = createFreeEntitlement(1000);
    expect(
      shouldOfferTrial(entitlement, 'first_confirmed_work_drive', {
        lastOfferAt: null,
        dismissedSession: false,
        now: 2000,
      }),
    ).toBe(true);
    expect(
      shouldOfferTrial(entitlement, 'first_confirmed_work_drive', {
        lastOfferAt: 2000,
        dismissedSession: false,
        now: 2000 + 3600000,
      }),
    ).toBe(false);
    expect(
      shouldOfferTrial(entitlement, 'first_confirmed_work_drive', {
        lastOfferAt: null,
        dismissedSession: true,
        now: 2000,
      }),
    ).toBe(false);
  });

  it('keeps Free useful forever with capped automatic capture; Plus unlocks unlimited when verified', () => {
    const free = capabilitiesForEntitlement(createFreeEntitlement());
    expect(free.canUseAutomaticCapture).toBe(true);
    expect(free.automaticTripLimit).toBe(40);
    expect(free.missingScanLimit).toBe(1);
    expect(free.canUseStandardPdf).toBe(false);
    expect(free.canUseGapDetection).toBe(true);
    expect(free.canAddVehicle).toBe(true);
    expect(free.maxVehicles).toBe(1);
    expect(free.maxWorkplaces).toBe(2);
    expect(free.csvExportEnabled).toBe(true);

    const plus: EntitlementSnapshot = {
      ...createFreeEntitlement(),
      status: 'plusActive',
      planId: 'plus',
      trialEligible: false,
      storeVerified: true,
      source: 'store',
    };
    const plusCaps = capabilitiesForEntitlement(plus);
    expect(plusCaps.canUseAutomaticCapture).toBe(true);
    expect(plusCaps.automaticTripLimit).toBeNull();
    expect(plusCaps.canUseStandardPdf).toBe(true);
    expect(plusCaps.canUseGapDetection).toBe(true);

    const unverifiedPlus: EntitlementSnapshot = {
      ...plus,
      storeVerified: false,
      source: 'cache',
    };
    // Unverified Plus cache falls back to Free-tier automatic capture (capped), not unlimited.
    const unverifiedCaps = capabilitiesForEntitlement(unverifiedPlus);
    expect(unverifiedCaps.canUseAutomaticCapture).toBe(true);
    expect(unverifiedCaps.automaticTripLimit).toBe(40);
  });
});
