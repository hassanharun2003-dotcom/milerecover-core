import type { PermissionSnapshot } from '../permissions/types';
import { permissionFixPriority } from '../permissions/types';
import { STALE_CAPTURE_MS, type TrackingEngineState } from './types';

/**
 * Canonical user-facing protection state for Home + Protection Center.
 */
export type ProtectionState =
  | 'CHECKING'
  | 'MANUAL_ONLY'
  | 'OFF'
  | 'NEEDS_PERMISSION'
  | 'BATTERY_LIMITED'
  | 'CONFIGURED_WAITING'
  | 'PROTECTED'
  | 'STALE'
  | 'ERROR';

export type ProtectionSeverity = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export type ProtectionPrimaryAction =
  | 'open_location_settings'
  | 'open_battery_settings'
  | 'enable_watching'
  | 'finish_setup'
  | 'review_trips'
  | 'see_plans'
  | 'none';

export interface ProtectionAction {
  label: string;
  action: ProtectionPrimaryAction;
}

export interface ProtectionStatusView {
  state: ProtectionState;
  title: string;
  message: string;
  severity: ProtectionSeverity;
  primaryAction: ProtectionAction;
  secondaryAction: ProtectionAction | null;
  supportingFacts: string[];
  /** Timestamp of the last verified automatic capture check, or null when never. */
  timestamp: number | null;
  reasonCodes: string[];
  /** Plain-language last successful tracking check, or null when never. */
  lastCheckLabel: string | null;
}

export interface ProtectionStatusInput {
  permissions: PermissionSnapshot;
  trackingEnabled: boolean;
  canUseAutomaticCapture: boolean;
  trackingEngineState: TrackingEngineState;
  lastConfirmedCaptureAt: number | null;
  lastSyncAt: number | null;
  pendingReviewCount: number;
  /** True when protection/onboarding watching setup was never finished. */
  setupIncomplete?: boolean;
  offline?: boolean;
  /** True when the user explicitly chose manual capture over automatic watching. */
  manualMode?: boolean;
  now?: number;
  /** Free monthly automatic allowance reached — keep existing trips, pause new auto capture. */
  automaticAllowanceExhausted?: boolean;
}

const TITLES: Record<ProtectionState, string> = {
  CHECKING: 'Checking protection',
  MANUAL_ONLY: 'Manual tracking',
  OFF: 'Drive protection is off',
  NEEDS_PERMISSION: 'Protection needs permission',
  BATTERY_LIMITED: 'Battery settings may limit protection',
  CONFIGURED_WAITING: 'Ready for your first drive',
  PROTECTED: 'Your drives are protected',
  STALE: 'Protection needs a fresh check',
  ERROR: 'Protection needs attention',
};

function formatLastCheck(lastConfirmedCaptureAt: number | null, now: number): string | null {
  if (lastConfirmedCaptureAt == null) return null;
  const delta = Math.max(0, now - lastConfirmedCaptureAt);
  if (delta < 60_000) return 'Last successful check: just now';
  if (delta < 3_600_000) {
    const mins = Math.max(1, Math.round(delta / 60_000));
    return `Last successful check: ${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (delta < 86_400_000) {
    const hours = Math.max(1, Math.round(delta / 3_600_000));
    return `Last successful check: ${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const when = new Date(lastConfirmedCaptureAt);
  const time = when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `Tracking has not checked in since ${time}`;
}

function reasonCodesFor(input: ProtectionStatusInput): string[] {
  const steps = permissionFixPriority(input.permissions);
  if (input.setupIncomplete) steps.unshift('finish_protection_setup');
  if (input.canUseAutomaticCapture && !input.trackingEnabled) steps.push('tracking_off');
  if (input.offline) steps.push('offline');
  if (input.trackingEngineState === 'stopped' || input.trackingEngineState === 'unavailable') {
    steps.push('engine_error');
  }
  if (input.automaticAllowanceExhausted) steps.push('automatic_allowance_exhausted');
  if (input.manualMode) steps.push('manual_mode_selected');
  if (input.lastConfirmedCaptureAt == null) steps.push('no_verified_capture');
  return steps;
}

function backgroundLocationGrantedOrNotApplicable(snapshot: PermissionSnapshot): boolean {
  return snapshot.backgroundLocation === 'granted' || snapshot.backgroundLocation === 'not_applicable';
}

function hasPermissionGap(snapshot: PermissionSnapshot): boolean {
  return snapshot.location !== 'granted' || !backgroundLocationGrantedOrNotApplicable(snapshot);
}

function formatPermissionFact(label: string, enabled: boolean): string {
  return `${label}: ${enabled ? 'on' : 'off'}`;
}

function supportingFactsFor(input: ProtectionStatusInput): string[] {
  const backgroundReady = backgroundLocationGrantedOrNotApplicable(input.permissions);
  const facts = [
    formatPermissionFact('Location', input.permissions.location === 'granted'),
    input.permissions.backgroundLocation === 'not_applicable'
      ? 'Background location: not needed on this platform'
      : formatPermissionFact('Background location', backgroundReady),
    `Battery restrictions: ${input.permissions.batteryOptimizationRestricted ? 'on' : 'off'}`,
    `Automatic protection: ${input.trackingEnabled ? 'on' : 'off'}`,
  ];

  if (input.pendingReviewCount > 0) {
    facts.push(`${input.pendingReviewCount} trip${input.pendingReviewCount === 1 ? '' : 's'} need review`);
  }

  return facts;
}

function view(input: {
  state: ProtectionState;
  message: string;
  severity: ProtectionSeverity;
  primaryAction: ProtectionAction;
  secondaryAction?: ProtectionAction | null;
  supportingFacts: string[];
  timestamp: number | null;
  reasonCodes: string[];
  lastCheckLabel: string | null;
}): ProtectionStatusView {
  return {
    state: input.state,
    title: TITLES[input.state],
    message: input.message,
    severity: input.severity,
    primaryAction: input.primaryAction,
    secondaryAction: input.secondaryAction ?? null,
    supportingFacts: input.supportingFacts,
    timestamp: input.timestamp,
    reasonCodes: Array.from(new Set(input.reasonCodes)),
    lastCheckLabel: input.lastCheckLabel,
  };
}

export function resolveProtectionStatus(input: ProtectionStatusInput): ProtectionStatusView {
  const now = input.now ?? Date.now();
  const lastCheckLabel = formatLastCheck(input.lastConfirmedCaptureAt, now);
  const supportingFacts = supportingFactsFor(input);
  const baseReasons = reasonCodesFor(input);
  const timestamp = input.lastConfirmedCaptureAt;
  const backgroundReady = backgroundLocationGrantedOrNotApplicable(input.permissions);
  const configured =
    input.trackingEnabled &&
    input.canUseAutomaticCapture &&
    input.permissions.location === 'granted' &&
    backgroundReady &&
    !input.permissions.batteryOptimizationRestricted;
  const controllerHealthy = input.trackingEngineState === 'active' || input.trackingEngineState === 'idle';
  const stale =
    configured &&
    controllerHealthy &&
    input.lastConfirmedCaptureAt != null &&
    now - input.lastConfirmedCaptureAt > STALE_CAPTURE_MS;

  if (!input.canUseAutomaticCapture || input.manualMode || input.automaticAllowanceExhausted) {
    const allowanceLimited = input.automaticAllowanceExhausted === true;
    return view({
      state: 'MANUAL_ONLY',
      message: allowanceLimited
        ? 'Automatic capture is paused for this plan limit. Add drives manually or upgrade for more automatic trips.'
        : 'Add drives manually anytime. Automatic capture is not available for this account or device.',
      severity: 'neutral',
      primaryAction: allowanceLimited
        ? { label: 'See plans', action: 'see_plans' }
        : { label: 'Add drives manually', action: 'none' },
      secondaryAction: allowanceLimited ? { label: 'Add a drive manually', action: 'none' } : null,
      supportingFacts,
      timestamp,
      reasonCodes: [...baseReasons, allowanceLimited ? 'automatic_allowance_exhausted' : 'manual_only'],
      lastCheckLabel,
    });
  }

  if (!input.trackingEnabled) {
    return view({
      state: 'OFF',
      message: 'Turn automatic protection on to capture future drives. Manual drives still work.',
      severity: 'neutral',
      primaryAction: { label: 'Turn on protection', action: 'enable_watching' },
      secondaryAction: { label: 'Add a drive manually', action: 'none' },
      supportingFacts,
      timestamp,
      reasonCodes: [...baseReasons, 'tracking_off'],
      lastCheckLabel,
    });
  }

  if (input.offline || input.trackingEngineState === 'stopped' || input.trackingEngineState === 'unavailable') {
    return view({
      state: 'ERROR',
      message: input.offline
        ? 'MileRecover is offline. Saved miles stay on this device until checks can run again.'
        : 'The automatic tracking engine is not healthy. Review protection before relying on automatic capture.',
      severity: 'danger',
      primaryAction: { label: input.offline ? 'OK' : 'Review protection', action: input.offline ? 'none' : 'finish_setup' },
      supportingFacts,
      timestamp,
      reasonCodes: [...baseReasons, input.offline ? 'offline' : 'engine_error'],
      lastCheckLabel,
    });
  }

  if (hasPermissionGap(input.permissions)) {
    const foregroundMissing = input.permissions.location !== 'granted';
    return view({
      state: 'NEEDS_PERMISSION',
      message: foregroundMissing
        ? 'Allow location so automatic protection can notice when a work drive starts.'
        : 'Allow background location so drives can be captured when the app is closed.',
      severity: 'warning',
      primaryAction: {
        label: foregroundMissing ? 'Allow location' : 'Allow background location',
        action: 'open_location_settings',
      },
      secondaryAction: { label: 'Continue with manual tracking', action: 'none' },
      supportingFacts,
      timestamp,
      reasonCodes: [...baseReasons, foregroundMissing ? 'location_missing' : 'background_location_missing'],
      lastCheckLabel,
    });
  }

  if (input.permissions.batteryOptimizationRestricted) {
    return view({
      state: 'BATTERY_LIMITED',
      message: 'Battery optimization may stop MileRecover in the background, even with permissions enabled.',
      severity: 'warning',
      primaryAction: { label: 'Fix battery settings', action: 'open_battery_settings' },
      secondaryAction: { label: 'Add a drive manually', action: 'none' },
      supportingFacts,
      timestamp,
      reasonCodes: [...baseReasons, 'battery_restricted'],
      lastCheckLabel,
    });
  }

  if (
    (input.trackingEngineState === 'starting' || input.trackingEngineState === 'unknown') &&
    input.lastConfirmedCaptureAt == null
  ) {
    return view({
      state: 'CHECKING',
      message: 'MileRecover is checking automatic protection before showing a final status.',
      severity: 'info',
      primaryAction: { label: 'Check again', action: 'finish_setup' },
      supportingFacts,
      timestamp,
      reasonCodes: [...baseReasons, 'checking_engine'],
      lastCheckLabel,
    });
  }

  if (stale) {
    return view({
      state: 'STALE',
      message: 'Automatic capture worked before, but MileRecover has not verified a recent drive check.',
      severity: 'warning',
      primaryAction: { label: 'Review protection', action: 'finish_setup' },
      secondaryAction: { label: 'Add a drive manually', action: 'none' },
      supportingFacts,
      timestamp,
      reasonCodes: [...baseReasons, 'health_stale'],
      lastCheckLabel,
    });
  }

  if (configured && controllerHealthy && input.lastConfirmedCaptureAt == null) {
    return view({
      state: 'CONFIGURED_WAITING',
      message: 'Take a short drive and MileRecover will confirm automatic capture after your first drive.',
      severity: 'info',
      primaryAction: input.setupIncomplete
        ? { label: 'Finish setup', action: 'finish_setup' }
        : { label: 'OK', action: 'none' },
      secondaryAction: null,
      supportingFacts,
      timestamp,
      reasonCodes: [...baseReasons, 'no_verified_capture'],
      lastCheckLabel,
    });
  }

  if (configured && controllerHealthy && input.lastConfirmedCaptureAt != null) {
    return view({
      state: 'PROTECTED',
      message: 'Automatic capture is enabled and recently verified. Review any flagged trips when ready.',
      severity: 'success',
      primaryAction:
        input.pendingReviewCount > 0
          ? { label: 'Review trips', action: 'review_trips' }
          : { label: 'OK', action: 'none' },
      secondaryAction: null,
      supportingFacts,
      timestamp,
      reasonCodes: input.pendingReviewCount > 0 ? [...baseReasons, 'pending_review'] : baseReasons,
      lastCheckLabel,
    });
  }

  return view({
    state: 'CHECKING',
    message: 'MileRecover is checking automatic protection before showing a final status.',
    severity: 'info',
    primaryAction: { label: 'Check again', action: 'finish_setup' },
    supportingFacts,
    timestamp,
    reasonCodes: [...baseReasons, 'checking'],
    lastCheckLabel,
  });
}

export function assertProtectionInvariants(view: ProtectionStatusView): void {
  const states: ProtectionState[] = [
    'CHECKING',
    'MANUAL_ONLY',
    'OFF',
    'NEEDS_PERMISSION',
    'BATTERY_LIMITED',
    'CONFIGURED_WAITING',
    'PROTECTED',
    'STALE',
    'ERROR',
  ];

  if (!states.includes(view.state)) {
    throw new Error(`Unknown protection state: ${String(view.state)}`);
  }

  if (view.message.includes('Last successful check:')) {
    throw new Error('Protection message must not duplicate lastCheckLabel.');
  }

  if (view.state === 'PROTECTED') {
    const impossible = [
      'battery_restricted',
      'location_missing',
      'background_location_missing',
      'tracking_off',
      'manual_only',
      'automatic_allowance_exhausted',
      'no_verified_capture',
      'health_stale',
      'engine_error',
      'offline',
    ];
    const found = impossible.find((code) => view.reasonCodes.includes(code));
    if (found) {
      throw new Error(`PROTECTED cannot include ${found}.`);
    }
    if (view.severity !== 'success') {
      throw new Error('PROTECTED must use success severity.');
    }
    if (view.timestamp == null || view.lastCheckLabel == null) {
      throw new Error('PROTECTED requires a verified capture timestamp.');
    }
  }

  if (view.state === 'BATTERY_LIMITED' && view.reasonCodes.includes('location_missing')) {
    throw new Error('BATTERY_LIMITED cannot be primary while foreground location is missing.');
  }

  if (view.state === 'CONFIGURED_WAITING' && /protected/i.test(`${view.title} ${view.message}`)) {
    throw new Error('CONFIGURED_WAITING copy must not claim protected.');
  }
}
