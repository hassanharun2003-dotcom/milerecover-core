import {
  resolveProtectionStatus,
  type PermissionSnapshot,
  type ProtectionStatusInput,
} from '../src';

const granted: PermissionSnapshot = {
  location: 'granted',
  backgroundLocation: 'granted',
  motion: 'not_applicable',
  batteryOptimizationRestricted: false,
};

function base(partial: Partial<ProtectionStatusInput> = {}): ProtectionStatusInput {
  return {
    permissions: granted,
    trackingEnabled: true,
    canUseAutomaticCapture: true,
    trackingEngineState: 'active',
    lastConfirmedCaptureAt: Date.now() - 60_000,
    lastSyncAt: Date.now() - 30_000,
    pendingReviewCount: 0,
    setupIncomplete: false,
    offline: false,
    now: Date.now(),
    ...partial,
  };
}

describe('Protection status model', () => {
  it('reports Protected when watching and permissions are healthy', () => {
    const view = resolveProtectionStatus(base());
    expect(view.status).toBe('protected');
    expect(view.title).toBe('Protected');
    expect(view.automaticDependable).toBe(true);
    expect(view.lastCheckLabel).toMatch(/Last successful check/);
  });

  it('reports Tracking paused when watching is disabled', () => {
    const view = resolveProtectionStatus(base({ trackingEnabled: false }));
    expect(view.status).toBe('tracking_paused');
    expect(view.primaryIssue?.action).toBe('enable_watching');
  });

  it('reports Manual-only when automatic capture is unavailable', () => {
    const view = resolveProtectionStatus(base({ canUseAutomaticCapture: false }));
    expect(view.status).toBe('manual_only');
    expect(view.detail).toMatch(/Manual tracking is active/i);
    expect(view.primaryIssue?.action).toBe('see_plans');
  });

  it('reports Setup incomplete when protection setup was never finished', () => {
    const view = resolveProtectionStatus(base({ setupIncomplete: true }));
    expect(view.status).toBe('setup_incomplete');
    expect(view.primaryIssue?.action).toBe('finish_setup');
  });

  it('surfaces background location as the primary issue', () => {
    const view = resolveProtectionStatus(
      base({
        permissions: { ...granted, backgroundLocation: 'denied' },
      }),
    );
    expect(view.status).toBe('needs_attention');
    expect(view.primaryIssue?.what).toMatch(/Background location/i);
    expect(view.automaticDependable).toBe(false);
  });

  it('surfaces battery restrictions when location is granted', () => {
    const view = resolveProtectionStatus(
      base({
        permissions: { ...granted, batteryOptimizationRestricted: true },
      }),
    );
    expect(view.primaryIssue?.what).toMatch(/Battery/i);
    expect(view.primaryIssue?.action).toBe('open_battery_settings');
  });

  it('handles multiple simultaneous failures with one primary issue', () => {
    const view = resolveProtectionStatus(
      base({
        permissions: {
          location: 'denied',
          backgroundLocation: 'denied',
          motion: 'denied',
          batteryOptimizationRestricted: true,
        },
        pendingReviewCount: 3,
      }),
    );
    expect(view.primaryIssue?.what).toMatch(/Location is off/);
    expect(view.status).not.toBe('protected');
  });

  it('marks offline as needs attention without claiming protected', () => {
    const view = resolveProtectionStatus(base({ offline: true }));
    expect(view.status).toBe('needs_attention');
    expect(view.title).not.toBe('Protected');
  });

  it('supports manual-only fallback language when capture is unavailable', () => {
    const view = resolveProtectionStatus(
      base({ canUseAutomaticCapture: false, trackingEnabled: false }),
    );
    expect(view.status).toBe('manual_only');
    expect(view.detail).toMatch(/Manual tracking is active/i);
  });

  it('does not claim protected merely because permission was requested', () => {
    const view = resolveProtectionStatus(
      base({
        permissions: {
          location: 'not_determined',
          backgroundLocation: 'not_determined',
          motion: 'not_applicable',
          batteryOptimizationRestricted: false,
        },
      }),
    );
    expect(view.status).toBe('setup_incomplete');
    expect(view.status).not.toBe('protected');
  });

  it('exposes ordered repair steps for the Protection Center', () => {
    const view = resolveProtectionStatus(
      base({
        permissions: { ...granted, backgroundLocation: 'denied', batteryOptimizationRestricted: true },
        trackingEnabled: false,
      }),
    );
    expect(view.repairSteps).toContain('enable_background_location');
    expect(view.repairSteps).toContain('disable_battery_optimization');
    expect(view.repairSteps).toContain('enable_watching');
  });
});
