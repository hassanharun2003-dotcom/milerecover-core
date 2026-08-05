import type { PermissionSnapshot } from '../permissions/types';
import { permissionFixPriority } from '../permissions/types';
import { calculateProtectionHealth } from './calculate';
import type { ProtectionHealthInput, ProtectionHealthLevel, TrackingEngineState } from './types';

/**
 * User-facing protection status for Home + Protection Center.
 *
 * Protected | Needs attention | Tracking paused | Setup incomplete | Manual-only
 */
export type ProtectionStatus =
  | 'protected'
  | 'needs_attention'
  | 'tracking_paused'
  | 'setup_incomplete'
  | 'manual_only';

/** @deprecated Prefer `manual_only` / `tracking_paused` / `setup_incomplete`. Kept for migration. */
export type LegacyProtectionStatus = ProtectionStatus | 'off' | 'limited';

export type ProtectionPrimaryAction =
  | 'open_location_settings'
  | 'open_battery_settings'
  | 'enable_watching'
  | 'finish_setup'
  | 'review_trips'
  | 'see_plans'
  | 'none';

export interface ProtectionStatusView {
  status: ProtectionStatus;
  title: string;
  detail: string;
  /** Plain-language last successful tracking check, or null when never. */
  lastCheckLabel: string | null;
  /** Whether automatic tracking is currently dependable. */
  automaticDependable: boolean;
  primaryIssue: {
    what: string;
    why: string;
    actionLabel: string;
    action: ProtectionPrimaryAction;
  } | null;
  /** Ordered repair steps from permissionFixPriority (+ watching). */
  repairSteps: string[];
  level: ProtectionHealthLevel;
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
  now?: number;
  /** Free monthly automatic allowance reached — keep existing trips, pause new auto capture. */
  automaticAllowanceExhausted?: boolean;
}

const TITLES: Record<ProtectionStatus, string> = {
  protected: 'Your drives are protected',
  needs_attention: 'One setting needs attention',
  tracking_paused: 'Drive protection is off',
  setup_incomplete: 'Finish drive protection setup',
  manual_only: 'Drive protection is off',
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

function repairStepsFor(input: ProtectionStatusInput): string[] {
  const steps = permissionFixPriority(input.permissions);
  if (input.setupIncomplete) steps.unshift('finish_protection_setup');
  if (input.canUseAutomaticCapture && !input.trackingEnabled) steps.push('enable_watching');
  return steps;
}

export function resolveProtectionStatus(input: ProtectionStatusInput): ProtectionStatusView {
  const now = input.now ?? Date.now();
  const lastCheckLabel = formatLastCheck(input.lastConfirmedCaptureAt, now);
  const repairSteps = repairStepsFor(input);

  if (input.offline) {
    return {
      status: 'needs_attention',
      title: TITLES.needs_attention,
      detail: 'You’re offline. Saved miles stay on this device.',
      lastCheckLabel,
      automaticDependable: false,
      primaryIssue: {
        what: 'No network connection',
        why: 'New sync can’t run, but local miles remain safe.',
        actionLabel: 'OK',
        action: 'none',
      },
      repairSteps,
      level: 'attention',
    };
  }

  if (!input.canUseAutomaticCapture) {
    return {
      status: 'manual_only',
      title: TITLES.manual_only,
      detail: 'Turn it on to capture future drives automatically.',
      lastCheckLabel,
      automaticDependable: false,
      primaryIssue: {
        what: 'Automatic capture needs an upgrade',
        why: 'You can still add drives manually anytime.',
        actionLabel: 'See plans',
        action: 'see_plans',
      },
      repairSteps,
      level: 'limited',
    };
  }

  if (input.automaticAllowanceExhausted) {
    return {
      status: 'tracking_paused',
      title: 'Monthly automatic limit reached',
      detail: 'Future automatic capture needs Plus, or add drives manually. Saved trips stay.',
      lastCheckLabel,
      automaticDependable: false,
      primaryIssue: {
        what: 'Free includes 40 automatic trips per month',
        why: 'Your captured trips remain. Upgrade for unlimited automatic tracking.',
        actionLabel: 'See plans',
        action: 'see_plans',
      },
      repairSteps,
      level: 'limited',
    };
  }

  if (input.setupIncomplete || input.permissions.location === 'not_determined') {
    return {
      status: 'setup_incomplete',
      title: TITLES.setup_incomplete,
      detail: 'Take a short drive and MileRecover will confirm that tracking works.',
      lastCheckLabel,
      automaticDependable: false,
      primaryIssue: {
        what: 'Protection setup is incomplete',
        why: 'Without setup, MileRecover can’t tell when you’re on a work drive.',
        actionLabel: 'Finish setup',
        action: 'finish_setup',
      },
      repairSteps,
      level: 'limited',
    };
  }

  if (!input.trackingEnabled) {
    return {
      status: 'tracking_paused',
      title: TITLES.tracking_paused,
      detail: 'Turn it on to capture future drives automatically.',
      lastCheckLabel,
      automaticDependable: false,
      primaryIssue: {
        what: 'Drive protection is off',
        why: 'MileRecover won’t capture drives until you turn protection on.',
        actionLabel: 'Turn on protection',
        action: 'enable_watching',
      },
      repairSteps,
      level: 'limited',
    };
  }

  const healthInput: ProtectionHealthInput = {
    permissions: input.permissions,
    trackingEngineState: input.trackingEngineState,
    lastConfirmedCaptureAt: input.lastConfirmedCaptureAt,
    lastSyncAt: input.lastSyncAt,
    now,
    pendingReviewCount: input.pendingReviewCount,
  };
  const health = calculateProtectionHealth(healthInput);

  let primaryIssue: ProtectionStatusView['primaryIssue'] = null;
  if (input.permissions.location !== 'granted') {
    primaryIssue = {
      what: 'Location is off',
      why: 'Automatic tracking may miss drives without location while you use the app.',
      actionLabel: 'Allow location',
      action: 'open_location_settings',
    };
  } else if (
    input.permissions.backgroundLocation === 'denied' ||
    input.permissions.backgroundLocation === 'restricted'
  ) {
    primaryIssue = {
      what: 'Background location is off',
      why: 'Your phone may stop MileRecover when the app is closed.',
      actionLabel: 'Allow background location',
      action: 'open_location_settings',
    };
  } else if (input.permissions.batteryOptimizationRestricted) {
    primaryIssue = {
      what: 'Battery restrictions may stop MileRecover',
      why: 'Some phones pause apps in the background to save power.',
      actionLabel: 'Fix battery settings',
      action: 'open_battery_settings',
    };
  } else if (health.level === 'at_risk' || health.level === 'attention') {
    primaryIssue = {
      what: 'Automatic tracking may miss drives',
      why: health.userDetail || 'A recent check suggests protection needs a look.',
      actionLabel: 'Review protection',
      action: 'finish_setup',
    };
  } else if (input.pendingReviewCount > 0) {
    primaryIssue = {
      what: `${input.pendingReviewCount} trip${input.pendingReviewCount === 1 ? '' : 's'} need a look`,
      why: 'Nothing uncertain enters Proof until you decide.',
      actionLabel: 'Review trips',
      action: 'review_trips',
    };
  }

  const status: ProtectionStatus =
    primaryIssue && primaryIssue.action !== 'review_trips' ? 'needs_attention' : 'protected';
  const automaticDependable =
    status === 'protected' &&
    input.permissions.location === 'granted' &&
    input.permissions.backgroundLocation === 'granted' &&
    !input.permissions.batteryOptimizationRestricted;

  return {
    status,
    title: status === 'protected' ? TITLES.protected : TITLES.needs_attention,
    detail:
      status === 'protected'
        ? lastCheckLabel ?? 'Last successful check: waiting for your next drive.'
        : primaryIssue?.what ?? health.userDetail ?? health.userLabel,
    lastCheckLabel,
    automaticDependable,
    primaryIssue,
    repairSteps,
    level: health.level,
  };
}
