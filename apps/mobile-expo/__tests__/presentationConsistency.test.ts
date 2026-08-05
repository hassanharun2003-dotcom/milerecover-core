import {
  canCaptureAutomaticTrip,
  createFreeEntitlement,
  createManualTripRecord,
} from '@milerecover/domain';
import { createInitialProductUiState } from '../src/product/types';
import {
  selectAllowance,
  selectHomePeriodSummary,
  selectPendingReviewCount,
  selectProtectionView,
} from '../src/product/presentation';
import { createInitialAppState } from '../src/store/types';

describe('Canonical presentation consistency', () => {
  it('aligns Home period value with rate honesty', () => {
    const locale = createInitialProductUiState().localeProfile;
    const trip = createManualTripRecord({
      distanceMiles: 10,
      startAt: Date.now() - 60_000,
      endAt: Date.now(),
      classification: 'business',
      status: 'confirmed',
      purpose: 'Client visit',
      confirmAsWork: true,
    });
    const summary = selectHomePeriodSummary({
      trips: [{ ...trip, status: 'confirmed', classification: 'business' }],
      locale: { ...locale, activeRateNeedsReview: true, rates: [] },
      preferredName: null,
      primaryGoal: 'employee_reimbursement',
      periodKind: 'this_week',
    });
    expect(summary.estimatedValueLabel).toMatch(/Review rate|—/);
  });

  it('uses the same pending review count source for protection', () => {
    const app = { ...createInitialAppState(), trackingEngineState: 'active' as const };
    const product = createInitialProductUiState();
    const permissions = {
      location: 'granted' as const,
      backgroundLocation: 'granted' as const,
      motion: 'granted' as const,
      batteryOptimizationRestricted: false,
    };
    const pending = selectPendingReviewCount(app, product, permissions, true);
    const protection = selectProtectionView({
      app,
      product: { ...product, trackingEnabled: true, protectionSetupState: 'configured' },
      permissions,
      automaticCaptureAvailable: true,
      pendingReviewCount: pending,
    });
    expect(pending).toBe(0);
    expect(protection.status).toBe('configured_waiting');
    expect(protection.title).toMatch(/waiting for first drive/i);
  });

  it('counts Free automatic allowance from auto_detected trips only', () => {
    const product = {
      ...createInitialProductUiState(),
      entitlement: createFreeEntitlement(),
    };
    const auto = createManualTripRecord({
      distanceMiles: 5,
      startAt: Date.now(),
      endAt: Date.now() + 60_000,
      classification: 'business',
      status: 'confirmed',
      purpose: 'Work',
      confirmAsWork: true,
    });
    const app = {
      ...createInitialAppState(),
      trips: [{ ...auto, source: 'auto_detected' as const }],
    };
    const allowance = selectAllowance(app, product);
    expect(allowance.used).toBe(1);
    expect(allowance.limit).toBe(40);
    expect(canCaptureAutomaticTrip(product.entitlement, app.trips)).toBe(true);
  });
});
