import {
  assertProtectionInvariants,
  resolveProtectionStatus,
  type PermissionSnapshot,
  type ProtectionStatusInput,
  type ProtectionStatusView,
} from '../src';

const NOW = 1_800_000_000_000;

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
    lastConfirmedCaptureAt: NOW - 60_000,
    lastSyncAt: NOW - 30_000,
    pendingReviewCount: 0,
    setupIncomplete: false,
    offline: false,
    now: NOW,
    ...partial,
  };
}

describe('Protection status model', () => {
  it('reports PROTECTED only when watching, permissions, engine, battery, and verified capture are healthy', () => {
    const view = resolveProtectionStatus(base());
    expect(view.state).toBe('PROTECTED');
    expect(view.title).toMatch(/protected/i);
    expect(view.severity).toBe('success');
    expect(view.timestamp).toBe(NOW - 60_000);
    expect(view.primaryAction.action).toBe('none');
    expect(view.lastCheckLabel).toMatch(/Last successful check/);
    expect(view.message).not.toMatch(/Last successful check/);
    assertProtectionInvariants(view);
  });

  it('reports CONFIGURED_WAITING when setup is healthy but no drive has been verified', () => {
    const view = resolveProtectionStatus(base({ lastConfirmedCaptureAt: null, lastSyncAt: null }));
    expect(view.state).toBe('CONFIGURED_WAITING');
    expect(view.title).toBe('Ready for your first drive');
    expect(view.title).not.toMatch(/protected/i);
    expect(view.message).toMatch(/first drive/i);
    expect(view.message).not.toMatch(/protected/i);
    expect(view.reasonCodes).toContain('no_verified_capture');
    expect(view.lastCheckLabel).toBeNull();
    assertProtectionInvariants(view);
  });

  it('reports OFF when watching is disabled by the user', () => {
    const view = resolveProtectionStatus(base({ trackingEnabled: false }));
    expect(view.state).toBe('OFF');
    expect(view.primaryAction.action).toBe('enable_watching');
    expect(view.severity).toBe('neutral');
    assertProtectionInvariants(view);
  });

  it('reports MANUAL_ONLY when automatic capture is unavailable', () => {
    const view = resolveProtectionStatus(base({ canUseAutomaticCapture: false }));
    expect(view.state).toBe('MANUAL_ONLY');
    expect(view.title).toBe('Manual tracking');
    expect(view.message).toMatch(/manual/i);
    expect(view.primaryAction.action).toBe('none');
    assertProtectionInvariants(view);
  });

  it('reports MANUAL_ONLY with plan action when automatic allowance is exhausted', () => {
    const view = resolveProtectionStatus(base({ automaticAllowanceExhausted: true }));
    expect(view.state).toBe('MANUAL_ONLY');
    expect(view.primaryAction.action).toBe('see_plans');
    expect(view.reasonCodes).toContain('automatic_allowance_exhausted');
    assertProtectionInvariants(view);
  });

  it('keeps unfinished setup out of PROTECTED until a capture is verified', () => {
    const view = resolveProtectionStatus(
      base({ setupIncomplete: true, lastConfirmedCaptureAt: null, lastSyncAt: null }),
    );
    expect(view.state).toBe('CONFIGURED_WAITING');
    expect(view.reasonCodes).toContain('finish_protection_setup');
    expect(view.primaryAction.action).toBe('finish_setup');
    expect(view.title).not.toMatch(/protected/i);
    assertProtectionInvariants(view);
  });

  it('surfaces foreground location as NEEDS_PERMISSION', () => {
    const view = resolveProtectionStatus(
      base({
        permissions: { ...granted, location: 'denied' },
      }),
    );
    expect(view.state).toBe('NEEDS_PERMISSION');
    expect(view.primaryAction.action).toBe('open_location_settings');
    expect(view.message).toMatch(/Allow location/);
    expect(view.reasonCodes).toContain('location_missing');
    assertProtectionInvariants(view);
  });

  it('surfaces background location as NEEDS_PERMISSION', () => {
    const view = resolveProtectionStatus(
      base({
        permissions: { ...granted, backgroundLocation: 'denied' },
      }),
    );
    expect(view.state).toBe('NEEDS_PERMISSION');
    expect(view.primaryAction.action).toBe('open_location_settings');
    expect(view.message).toMatch(/background location/i);
    expect(view.reasonCodes).toContain('background_location_missing');
    assertProtectionInvariants(view);
  });

  it('treats background not_applicable as OK for platform N/A', () => {
    const view = resolveProtectionStatus(
      base({
        permissions: { ...granted, backgroundLocation: 'not_applicable' },
      }),
    );
    expect(view.state).toBe('PROTECTED');
    assertProtectionInvariants(view);
  });

  it('surfaces battery restrictions as BATTERY_LIMITED when permissions are granted', () => {
    const view = resolveProtectionStatus(
      base({
        permissions: { ...granted, batteryOptimizationRestricted: true },
      }),
    );
    expect(view.state).toBe('BATTERY_LIMITED');
    expect(view.primaryAction.action).toBe('open_battery_settings');
    expect(view.reasonCodes).toContain('battery_restricted');
    assertProtectionInvariants(view);
  });

  it('prioritizes permission repair before battery limits when both are present', () => {
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
    expect(view.state).toBe('NEEDS_PERMISSION');
    expect(view.primaryAction.action).toBe('open_location_settings');
    expect(view.state).not.toBe('BATTERY_LIMITED');
    expect(view.state).not.toBe('PROTECTED');
    assertProtectionInvariants(view);
  });

  it('marks offline as ERROR without claiming protected', () => {
    const view = resolveProtectionStatus(base({ offline: true }));
    expect(view.state).toBe('ERROR');
    expect(view.title).not.toBe('Protected');
    expect(view.reasonCodes).toContain('offline');
    assertProtectionInvariants(view);
  });

  it('marks controller failures as ERROR while tracking is configured', () => {
    const view = resolveProtectionStatus(base({ trackingEngineState: 'unavailable' }));
    expect(view.state).toBe('ERROR');
    expect(view.primaryAction.action).toBe('finish_setup');
    expect(view.reasonCodes).toContain('engine_error');
    assertProtectionInvariants(view);
  });

  it('uses CHECKING while a new configured engine is starting and no capture is verified', () => {
    const view = resolveProtectionStatus(
      base({ trackingEngineState: 'starting', lastConfirmedCaptureAt: null }),
    );
    expect(view.state).toBe('CHECKING');
    expect(view.reasonCodes).toContain('checking_engine');
    assertProtectionInvariants(view);
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
    expect(view.state).toBe('NEEDS_PERMISSION');
    expect(view.state).not.toBe('PROTECTED');
    assertProtectionInvariants(view);
  });

  it('does not claim protected merely because permissions are granted', () => {
    const view = resolveProtectionStatus(base({ lastConfirmedCaptureAt: null }));
    expect(view.state).toBe('CONFIGURED_WAITING');
    expect(view.title).not.toMatch(/Your drives are protected/i);
    assertProtectionInvariants(view);
  });

  it('reports STALE when a previously verified capture is outside the freshness window', () => {
    const view = resolveProtectionStatus(
      base({
        lastConfirmedCaptureAt: NOW - 24 * 60 * 60 * 1000 - 1,
        lastSyncAt: NOW - 24 * 60 * 60 * 1000 - 1,
      }),
    );
    expect(view.state).toBe('STALE');
    expect(view.reasonCodes).toContain('health_stale');
    expect(view.lastCheckLabel).toMatch(/not checked in/);
    assertProtectionInvariants(view);
  });

  it('exposes supporting facts and reason codes for the Protection Center', () => {
    const view = resolveProtectionStatus(
      base({
        permissions: { ...granted, backgroundLocation: 'denied', batteryOptimizationRestricted: true },
        trackingEnabled: false,
      }),
    );
    expect(view.supportingFacts).toEqual(
      expect.arrayContaining([
        'Location: on',
        'Background location: off',
        'Battery restrictions: on',
        'Automatic protection: off',
      ]),
    );
    expect(view.reasonCodes).toContain('enable_background_location');
    expect(view.reasonCodes).toContain('disable_battery_optimization');
    expect(view.reasonCodes).toContain('tracking_off');
    assertProtectionInvariants(view);
  });

  it('uses the invariant helper to reject impossible protected+battery states', () => {
    const invalid: ProtectionStatusView = {
      ...resolveProtectionStatus(base()),
      reasonCodes: ['battery_restricted'],
    };

    expect(() => assertProtectionInvariants(invalid)).toThrow(/PROTECTED cannot include battery_restricted/);
  });
});
