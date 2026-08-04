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
  });

  it('reports Off when watching is disabled', () => {
    const view = resolveProtectionStatus(base({ trackingEnabled: false }));
    expect(view.status).toBe('off');
    expect(view.primaryIssue?.action).toBe('enable_watching');
  });

  it('reports Off / limited when automatic capture is unavailable', () => {
    const view = resolveProtectionStatus(base({ canUseAutomaticCapture: false }));
    expect(view.status).toBe('off');
    expect(view.detail).toMatch(/Manual/);
  });

  it('surfaces background location as the primary issue', () => {
    const view = resolveProtectionStatus(
      base({
        permissions: { ...granted, backgroundLocation: 'denied' },
      }),
    );
    expect(view.status).toBe('needs_attention');
    expect(view.primaryIssue?.what).toMatch(/Background location/i);
    expect(view.primaryIssue?.actionLabel).toBe('Open settings');
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
    expect(view.status).toBe('off');
    expect(view.detail).toMatch(/Manual drives always work/i);
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
    expect(view.status).not.toBe('protected');
  });
});
