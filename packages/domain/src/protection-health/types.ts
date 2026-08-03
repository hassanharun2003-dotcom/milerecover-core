import type { PermissionSnapshot } from '../permissions/types';

export type TrackingEngineState = 'active' | 'idle' | 'stopped' | 'unavailable';

export type ProtectionHealthLevel = 'protected' | 'attention' | 'at_risk' | 'limited';

export interface ProtectionHealthInput {
  permissions: PermissionSnapshot;
  trackingEngineState: TrackingEngineState;
  lastConfirmedCaptureAt: number | null;
  lastSyncAt: number | null;
  now: number;
  pendingReviewCount: number;
}

export interface ProtectionHealthFactor {
  id: string;
  label: string;
  points: number;
  maxPoints: number;
}

export interface ProtectionHealthResult {
  level: ProtectionHealthLevel;
  /** Explainable 0–100 score — not shown as “98% protected” on Home. */
  score: number;
  factors: ProtectionHealthFactor[];
  reasons: string[];
  primaryAction: 'none' | 'fix_permissions' | 'review_trips' | 'open_tracking_status';
  userLabel: string;
  userDetail: string;
}

/** @see architecture/Package 3 Protection Health.md */
export const STALE_CAPTURE_MS = 24 * 60 * 60 * 1000;
export const CRITICAL_STALE_MS = 72 * 60 * 60 * 1000;

export { calculateProtectionHealth } from './calculate';
