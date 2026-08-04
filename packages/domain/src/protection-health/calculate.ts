import type { PermissionSnapshot } from '../permissions/types';
import {
  CRITICAL_STALE_MS,
  STALE_CAPTURE_MS,
  type ProtectionHealthFactor,
  type ProtectionHealthInput,
  type ProtectionHealthLevel,
  type ProtectionHealthResult,
  type TrackingEngineState,
} from './types';

function locationPoints(state: PermissionSnapshot['location']): ProtectionHealthFactor {
  const map = { granted: 25, restricted: 10, denied: 0, not_determined: 0 } as const;
  return {
    id: 'location',
    label: 'Location access',
    points: map[state],
    maxPoints: 25,
  };
}

function backgroundPoints(state: PermissionSnapshot['backgroundLocation']): ProtectionHealthFactor {
  if (state === 'not_applicable') {
    return { id: 'background_location', label: 'Background location', points: 0, maxPoints: 30 };
  }
  const map = { granted: 30, restricted: 8, denied: 0, not_determined: 0 } as const;
  return {
    id: 'background_location',
    label: 'Background location',
    points: map[state],
    maxPoints: 30,
  };
}

function motionPoints(state: PermissionSnapshot['motion']): ProtectionHealthFactor {
  if (state === 'not_applicable' || state === 'granted') {
    return { id: 'motion', label: 'Motion activity', points: 10, maxPoints: 10 };
  }
  if (state === 'restricted') {
    return { id: 'motion', label: 'Motion activity', points: 5, maxPoints: 10 };
  }
  return { id: 'motion', label: 'Motion activity', points: 3, maxPoints: 10 };
}

function enginePoints(
  engine: TrackingEngineState,
  lastCapture: number | null,
  now: number
): ProtectionHealthFactor {
  if (engine === 'active') {
    return { id: 'engine', label: 'Tracking engine', points: 25, maxPoints: 25 };
  }
  if (engine === 'idle' && lastCapture != null && now - lastCapture <= STALE_CAPTURE_MS) {
    return { id: 'engine', label: 'Tracking engine', points: 18, maxPoints: 25 };
  }
  if (engine === 'idle') {
    return { id: 'engine', label: 'Tracking engine', points: 8, maxPoints: 25 };
  }
  return { id: 'engine', label: 'Tracking engine', points: 0, maxPoints: 25 };
}

function batteryPoints(restricted: boolean): ProtectionHealthFactor {
  return {
    id: 'battery',
    label: 'Battery optimization',
    points: restricted ? 0 : 10,
    maxPoints: 10,
  };
}

function deriveLevel(
  input: ProtectionHealthInput,
  score: number,
  factors: ProtectionHealthFactor[]
): ProtectionHealthLevel {
  const { permissions, trackingEngineState, lastConfirmedCaptureAt, now } = input;

  if (permissions.location === 'denied') {
    return 'limited';
  }

  const bg = permissions.backgroundLocation;
  if (bg === 'denied' || bg === 'restricted') {
    return 'at_risk';
  }

  if (trackingEngineState === 'stopped' || trackingEngineState === 'unavailable') {
    return 'at_risk';
  }

  if (
    lastConfirmedCaptureAt != null &&
    now - lastConfirmedCaptureAt > CRITICAL_STALE_MS &&
    (trackingEngineState === 'active' || trackingEngineState === 'idle')
  ) {
    return 'at_risk';
  }

  if (
    score >= 85 &&
    permissions.location === 'granted' &&
    permissions.backgroundLocation === 'granted' &&
    (trackingEngineState === 'active' || trackingEngineState === 'idle')
  ) {
    return 'protected';
  }

  if (score < 50) {
    return 'at_risk';
  }

  return 'attention';
}

function buildReasons(input: ProtectionHealthInput, factors: ProtectionHealthFactor[]): string[] {
  const reasons: string[] = [];
  const { permissions, lastConfirmedCaptureAt, now, pendingReviewCount } = input;

  if (permissions.location !== 'granted') {
    reasons.push('Location permission is not fully enabled.');
  }
  if (permissions.backgroundLocation === 'denied') {
    reasons.push('Background location is off — trips may be missed.');
  }
  if (permissions.backgroundLocation === 'restricted') {
    reasons.push('Background location is restricted.');
  }
  if (permissions.batteryOptimizationRestricted) {
    reasons.push('Battery optimization may pause tracking.');
  }
  if (permissions.motion === 'denied') {
    reasons.push('Motion access off — detection may be less reliable.');
  }
  if (input.trackingEngineState === 'stopped') {
    reasons.push('Tracking is not currently running.');
  }
  if (lastConfirmedCaptureAt == null) {
    reasons.push('No confirmed drive activity yet.');
  } else if (now - lastConfirmedCaptureAt > STALE_CAPTURE_MS) {
    reasons.push('No recent confirmed capture.');
  }
  if (pendingReviewCount > 0) {
    reasons.push(`${pendingReviewCount} item(s) need review.`);
  }

  const underperforming = factors.filter((f) => f.points < f.maxPoints);
  if (underperforming.length > 0 && reasons.length === 0) {
    reasons.push('Some protection factors need attention.');
  }

  return reasons;
}

function labelsForLevel(level: ProtectionHealthLevel): { userLabel: string; userDetail: string } {
  switch (level) {
    case 'protected':
      return {
        userLabel: 'Protection active',
        userDetail: 'Automatic capture is enabled. Review any flagged trips when ready.',
      };
    case 'attention':
      return {
        userLabel: 'Needs attention',
        userDetail: 'Something may limit protection or review. Tap for details.',
      };
    case 'at_risk':
      return {
        userLabel: 'At risk',
        userDetail: 'Trips may be missed until you fix tracking settings.',
      };
    case 'limited':
      return {
        userLabel: 'Limited protection',
        userDetail: 'Enable location to automatically protect work miles.',
      };
  }
}

function primaryAction(
  level: ProtectionHealthLevel,
  pendingReviewCount: number
): ProtectionHealthResult['primaryAction'] {
  if (level === 'limited' || level === 'at_risk') return 'fix_permissions';
  if (pendingReviewCount > 0) return 'review_trips';
  if (level === 'attention') return 'open_tracking_status';
  return 'none';
}

export function calculateProtectionHealth(input: ProtectionHealthInput): ProtectionHealthResult {
  const factors = [
    locationPoints(input.permissions.location),
    backgroundPoints(input.permissions.backgroundLocation),
    motionPoints(input.permissions.motion),
    enginePoints(input.trackingEngineState, input.lastConfirmedCaptureAt, input.now),
    batteryPoints(input.permissions.batteryOptimizationRestricted),
  ];

  const score = Math.min(100, factors.reduce((sum, f) => sum + f.points, 0));
  const level = deriveLevel(input, score, factors);
  const reasons = buildReasons(input, factors);
  const { userLabel, userDetail } = labelsForLevel(level);

  return {
    level,
    score,
    factors,
    reasons,
    primaryAction: primaryAction(level, input.pendingReviewCount),
    userLabel,
    userDetail,
  };
}
