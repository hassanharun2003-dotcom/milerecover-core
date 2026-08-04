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

  it('keeps Free manual records usable while Plus unlocks automatic capture only when verified', () => {
    const free = capabilitiesForEntitlement(createFreeEntitlement());
    expect(free.canUseAutomaticCapture).toBe(false);
    expect(free.canUseStandardPdf).toBe(false);
    expect(free.canUseGapDetection).toBe(true);
    expect(free.canAddVehicle).toBe(true);
    expect(free.maxVehicles).toBe(1);
    expect(free.maxWorkplaces).toBe(2);
    // Free CSV remains usable in product policy even though PDF is Plus-gated.

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
    expect(plusCaps.canUseStandardPdf).toBe(true);
    expect(plusCaps.canUseGapDetection).toBe(true);

    const unverifiedPlus: EntitlementSnapshot = {
      ...plus,
      storeVerified: false,
      source: 'cache',
    };
    expect(capabilitiesForEntitlement(unverifiedPlus).canUseAutomaticCapture).toBe(false);
  });
});
