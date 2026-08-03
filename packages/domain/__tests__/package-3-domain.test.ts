import {
  calculateProtectionHealth,
  STALE_CAPTURE_MS,
  type ProtectionHealthInput,
} from '../src/protection-health/types';
import { applyRecoveryTransition } from '../src/recovery/transitions';
import {
  advanceOnboarding,
  initialOnboardingProgress,
  isOnboardingComplete,
} from '../src/onboarding/progression';
import { calculateProofSummary } from '../src/proof/summary';
import {
  buildReviewItemFromRecovery,
  buildReviewItemFromTrip,
  prioritizeReviewItems,
} from '../src/review/types';
import { applyClassification, confirmedBusinessMiles, rejectTrip } from '../src/trips/types';
import { assessDataFreshness } from '../src/store/types';
import { isAutomaticCapturePossible } from '../src/permissions/types';

const NOW = 1_700_000_000_000;

function baseHealth(overrides: Partial<ProtectionHealthInput> = {}): ProtectionHealthInput {
  return {
    permissions: {
      location: 'granted',
      backgroundLocation: 'granted',
      motion: 'not_applicable',
      batteryOptimizationRestricted: false,
    },
    trackingEngineState: 'active',
    lastConfirmedCaptureAt: NOW - 1000,
    lastSyncAt: null,
    now: NOW,
    pendingReviewCount: 0,
    ...overrides,
  };
}

describe('Protection Health', () => {
  it('reports protected when permissions and engine are healthy', () => {
    const result = calculateProtectionHealth(baseHealth());
    expect(result.level).toBe('protected');
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.userLabel).not.toMatch(/100%/);
  });

  it('never reports protected when location denied', () => {
    const result = calculateProtectionHealth(
      baseHealth({
        permissions: {
          location: 'denied',
          backgroundLocation: 'denied',
          motion: 'not_applicable',
          batteryOptimizationRestricted: false,
        },
      })
    );
    expect(result.level).toBe('limited');
  });

  it('escalates when background location denied', () => {
    const result = calculateProtectionHealth(
      baseHealth({
        permissions: {
          location: 'granted',
          backgroundLocation: 'denied',
          motion: 'not_applicable',
          batteryOptimizationRestricted: false,
        },
      })
    );
    expect(result.level).toBe('at_risk');
    expect(result.primaryAction).toBe('fix_permissions');
  });

  it('flags attention for stale capture', () => {
    const result = calculateProtectionHealth(
      baseHealth({
        lastConfirmedCaptureAt: NOW - STALE_CAPTURE_MS - 1,
        trackingEngineState: 'idle',
      })
    );
    expect(['attention', 'at_risk']).toContain(result.level);
    expect(result.reasons.some((r) => r.includes('recent'))).toBe(true);
  });
});

describe('Review prioritization', () => {
  it('ranks missing trips above classification', () => {
    const tripItem = buildReviewItemFromTrip({
      id: 't1',
      source: 'auto_detected',
      status: 'pending',
      classification: 'unclassified',
      startAt: NOW - 3600000,
      endAt: NOW,
      distanceMiles: 12,
      purpose: null,
      notes: null,
      hasRouteCoordinates: true,
      confidence: 'high',
    })!;
    const recoveryItem = buildReviewItemFromRecovery({
      id: 'r1',
      state: 'inferred',
      confidence: 'medium',
      evidence: [{ kind: 'gap', summary: 'Gap between known trips' }],
      proposedStartAt: NOW - 7200000,
      proposedEndAt: NOW - 3600000,
      proposedDistanceMiles: 8,
      plainLanguageExplanation: 'We noticed a likely unlogged drive.',
    })!;
    const ordered = prioritizeReviewItems([tripItem, recoveryItem]);
    expect(ordered[0].kind).toBe('possible_missing_trip');
  });
});

describe('Recovery transitions', () => {
  it('blocks low-confidence auto-confirm', () => {
    const result = applyRecoveryTransition('unresolved', 'user_confirm', 'low');
    expect(result.ok).toBe(false);
  });

  it('allows confirm at medium confidence', () => {
    const result = applyRecoveryTransition('unresolved', 'user_confirm', 'medium');
    expect(result.ok).toBe(true);
    expect(result.nextState).toBe('user_confirmed');
  });
});

describe('Classification', () => {
  it('confirms business trips', () => {
    const trip = applyClassification(
      {
        id: '1',
        source: 'auto_detected',
        status: 'pending',
        classification: 'unclassified',
        startAt: 0,
        endAt: 1,
        distanceMiles: 5,
        purpose: null,
        notes: null,
        hasRouteCoordinates: false,
        confidence: 'high',
      },
      'business'
    );
    expect(trip.status).toBe('confirmed');
  });

  it('rejects trip without deleting id', () => {
    const trip = rejectTrip({
      id: 'x',
      source: 'manual',
      status: 'pending',
      classification: 'unclassified',
      startAt: 0,
      endAt: 1,
      distanceMiles: 1,
      purpose: null,
      notes: null,
      hasRouteCoordinates: false,
      confidence: null,
    });
    expect(trip.status).toBe('rejected');
  });
});

describe('Proof summary', () => {
  it('uses confirmed business miles only', () => {
    const trips = [
      {
        id: '1',
        source: 'auto_detected' as const,
        status: 'confirmed' as const,
        classification: 'business' as const,
        startAt: 0,
        endAt: 1,
        distanceMiles: 10,
        purpose: null,
        notes: null,
        hasRouteCoordinates: true,
        confidence: 'high' as const,
      },
      {
        id: '2',
        source: 'auto_detected' as const,
        status: 'pending' as const,
        classification: 'unclassified' as const,
        startAt: 0,
        endAt: 1,
        distanceMiles: 99,
        purpose: null,
        notes: null,
        hasRouteCoordinates: false,
        confidence: null,
      },
    ];
    expect(confirmedBusinessMiles(trips)).toBe(10);
    const summary = calculateProofSummary({
      period: { id: 'p1', label: '2026 YTD', startAt: 0, endAt: NOW },
      trips,
      unresolvedReviewCount: 1,
      configuredRate: { id: 'irs', label: 'IRS standard rate', centsPerMile: 67 },
      dataStale: false,
    });
    expect(summary.confirmedBusinessMiles).toBe(10);
    expect(summary.estimatedDeductionCents).toBe(670);
    expect(summary.exportAvailable).toBe(false);
    expect(summary.completeness).toBe('needs_review');
  });
});

describe('Onboarding', () => {
  it('progresses through steps', () => {
    let p = initialOnboardingProgress();
    p = advanceOnboarding(p, 'next');
    expect(p.currentStep).toBe('location_permission');
    p = advanceOnboarding(p, 'next');
    expect(p.currentStep).toBe('motion_permission');
    p = advanceOnboarding(p, 'skip_motion');
    expect(p.skippedMotion).toBe(true);
    expect(p.currentStep).toBe('ready_check');
    expect(isOnboardingComplete(p)).toBe(false);
    p = advanceOnboarding(p, 'next');
    expect(isOnboardingComplete(p)).toBe(true);
  });
});

describe('Permissions', () => {
  it('requires background for automatic capture', () => {
    expect(
      isAutomaticCapturePossible({
        location: 'granted',
        backgroundLocation: 'denied',
        motion: 'not_applicable',
        batteryOptimizationRestricted: false,
      })
    ).toBe(false);
  });
});

describe('Data freshness', () => {
  it('detects stale snapshots', () => {
    expect(
      assessDataFreshness(
        { trips: [], recoveryCandidates: [], lastLoadedAt: NOW - 100000, loadError: null },
        NOW,
        50000
      )
    ).toBe('stale');
  });
});
