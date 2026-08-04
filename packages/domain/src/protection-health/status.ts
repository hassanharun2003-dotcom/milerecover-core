import type { PermissionSnapshot } from '../permissions/types';
import { calculateProtectionHealth } from './calculate';
import type { ProtectionHealthInput, ProtectionHealthLevel, TrackingEngineState } from './types';

/**
 * User-facing protection status for Home + Protection Center.
 * Maps domain health levels to calm product language.
 */
export type ProtectionStatus = 'protected' | 'needs_attention' | 'limited' | 'off';

export interface ProtectionStatusView {
  status: ProtectionStatus;
  title: string;
  detail: string;
  primaryIssue: {
    what: string;
    why: string;
    actionLabel: string;
    action: 'open_location_settings' | 'open_battery_settings' | 'enable_watching' | 'review_trips' | 'none';
  } | null;
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
  offline?: boolean;
  now?: number;
}

function mapStatus(
  level: ProtectionHealthLevel,
  trackingEnabled: boolean,
  canUseAutomaticCapture: boolean,
): ProtectionStatus {
  if (!canUseAutomaticCapture || !trackingEnabled) return 'off';
  switch (level) {
    case 'protected':
      return 'protected';
    case 'attention':
      return 'needs_attention';
    case 'at_risk':
      return 'needs_attention';
    case 'limited':
      return 'limited';
    default:
      return 'off';
  }
}

export function resolveProtectionStatus(input: ProtectionStatusInput): ProtectionStatusView {
  const now = input.now ?? Date.now();

  if (input.offline) {
    return {
      status: 'needs_attention',
      title: 'Needs attention',
      detail: 'You’re offline. Saved miles stay on this device.',
      primaryIssue: {
        what: 'No network connection',
        why: 'New store sync can’t run, but local miles remain safe.',
        actionLabel: 'OK',
        action: 'none',
      },
      level: 'attention',
    };
  }

  if (!input.canUseAutomaticCapture) {
    return {
      status: 'off',
      title: 'Manual tracking',
      detail: 'Automatic watching is available with Plus. Manual drives always work.',
      primaryIssue: {
        what: 'Automatic watching needs Plus',
        why: 'You can still add work drives manually and keep Free forever.',
        actionLabel: 'See plans',
        action: 'none',
      },
      level: 'limited',
    };
  }

  if (!input.trackingEnabled) {
    return {
      status: 'off',
      title: 'Off',
      detail: 'Watching is off. Turn it on when you want automatic coverage.',
      primaryIssue: {
        what: 'Watching is off',
        why: 'MileRecover won’t capture drives until you turn watching on.',
        actionLabel: 'Turn on watching',
        action: 'enable_watching',
      },
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
  const status = mapStatus(health.level, input.trackingEnabled, input.canUseAutomaticCapture);

  let primaryIssue: ProtectionStatusView['primaryIssue'] = null;
  if (input.permissions.location !== 'granted') {
    primaryIssue = {
      what: 'Location is off',
      why: 'MileRecover can’t protect drives without location while you use the app.',
      actionLabel: 'Open settings',
      action: 'open_location_settings',
    };
  } else if (input.permissions.backgroundLocation === 'denied') {
    primaryIssue = {
      what: 'Background location is off',
      why: 'Your phone may stop tracking when MileRecover is closed.',
      actionLabel: 'Open settings',
      action: 'open_location_settings',
    };
  } else if (input.permissions.batteryOptimizationRestricted) {
    primaryIssue = {
      what: 'Battery restrictions may stop tracking',
      why: 'Some phones pause apps in the background to save power.',
      actionLabel: 'Open battery settings',
      action: 'open_battery_settings',
    };
  } else if (input.pendingReviewCount > 0) {
    primaryIssue = {
      what: `${input.pendingReviewCount} trip${input.pendingReviewCount === 1 ? '' : 's'} need a look`,
      why: 'Nothing uncertain enters Proof until you decide.',
      actionLabel: 'Review trips',
      action: 'review_trips',
    };
  }

  const titles: Record<ProtectionStatus, string> = {
    protected: 'Protected',
    needs_attention: 'Needs attention',
    limited: 'Limited',
    off: 'Off',
  };

  return {
    status,
    title: titles[status],
    detail: health.userDetail || health.userLabel,
    primaryIssue,
    level: health.level,
  };
}
