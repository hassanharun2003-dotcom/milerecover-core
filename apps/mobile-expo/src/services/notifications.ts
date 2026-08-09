import type { PermissionState } from '@milerecover/domain';

export type NotificationPreferenceKey =
  | 'tripReadyForReview'
  | 'possibleMissedDrive'
  | 'trackingDegraded'
  | 'weeklySummary'
  | 'reportReminder'
  | 'trialEnding'
  | 'paymentIssue';

export interface NotificationPreferences {
  enabled: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  tripReadyForReview: boolean;
  possibleMissedDrive: boolean;
  trackingDegraded: boolean;
  weeklySummary: boolean;
  reportReminder: boolean;
  trialEnding: boolean;
  paymentIssue: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  quietHoursStart: 22,
  quietHoursEnd: 7,
  tripReadyForReview: true,
  possibleMissedDrive: true,
  trackingDegraded: true,
  weeklySummary: true,
  reportReminder: true,
  trialEnding: true,
  paymentIssue: true,
};

export type LocalNotificationKind =
  | 'trip_ready_for_review'
  | 'possible_missed_drive'
  | 'tracking_degraded'
  | 'weekly_summary'
  | 'report_reminder'
  | 'trial_ending'
  | 'payment_issue';

const RECENT_KEYS = new Set<string>();

function preferenceAllows(kind: LocalNotificationKind, prefs: NotificationPreferences): boolean {
  if (!prefs.enabled) return false;
  switch (kind) {
    case 'trip_ready_for_review':
      return prefs.tripReadyForReview;
    case 'possible_missed_drive':
      return prefs.possibleMissedDrive;
    case 'tracking_degraded':
      return prefs.trackingDegraded;
    case 'weekly_summary':
      return prefs.weeklySummary;
    case 'report_reminder':
      return prefs.reportReminder;
    case 'trial_ending':
      return prefs.trialEnding;
    case 'payment_issue':
      return prefs.paymentIssue;
    default:
      return false;
  }
}

function inQuietHours(prefs: NotificationPreferences, now = new Date()): boolean {
  if (prefs.quietHoursStart == null || prefs.quietHoursEnd == null) return false;
  const hour = now.getHours();
  const start = prefs.quietHoursStart;
  const end = prefs.quietHoursEnd;
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export function shouldScheduleNotification(
  kind: LocalNotificationKind,
  prefs: NotificationPreferences,
  dedupeKey: string,
  permission: PermissionState,
  now = new Date(),
): boolean {
  if (permission !== 'granted') return false;
  if (!preferenceAllows(kind, prefs)) return false;
  if (inQuietHours(prefs, now)) return false;
  if (RECENT_KEYS.has(dedupeKey)) return false;
  return true;
}

export function markNotificationScheduled(dedupeKey: string): void {
  RECENT_KEYS.add(dedupeKey);
  if (RECENT_KEYS.size > 200) {
    const first = RECENT_KEYS.values().next().value;
    if (first) RECENT_KEYS.delete(first);
  }
}

export function clearNotificationDedupeForTests(): void {
  RECENT_KEYS.clear();
}

export async function getNotificationPermission(): Promise<PermissionState> {
  try {
    // Lazy require keeps unit tests and environments without the native module usable.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return 'granted';
    if (existing.status === 'undetermined') return 'not_determined';
    if (existing.status === 'denied' && !existing.canAskAgain) return 'restricted';
    if (existing.status === 'denied') return 'denied';
    return existing.granted ? 'granted' : 'not_determined';
  } catch {
    return 'denied';
  }
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  try {
    // Lazy require keeps unit tests and environments without the native module usable.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return 'granted';
    if (existing.status === 'denied' && !existing.canAskAgain) return 'restricted';
    const requested = await Notifications.requestPermissionsAsync();
    if (requested.granted) return 'granted';
    return requested.canAskAgain ? 'denied' : 'restricted';
  } catch {
    return 'denied';
  }
}

/** Opens OS app settings so the user can restore notification permission. */
export async function openNotificationSettings(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Linking = require('react-native').Linking as typeof import('react-native').Linking;
    await Linking.openSettings();
  } catch {
    // Best-effort.
  }
}

export async function scheduleLocalNotification(input: {
  kind: LocalNotificationKind;
  title: string;
  body: string;
  dedupeKey: string;
  prefs: NotificationPreferences;
  permission: PermissionState;
}): Promise<'scheduled' | 'skipped' | 'unavailable'> {
  if (!shouldScheduleNotification(input.kind, input.prefs, input.dedupeKey, input.permission)) {
    return 'skipped';
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        data: { kind: input.kind },
      },
      trigger: null,
    });
    markNotificationScheduled(input.dedupeKey);
    return 'scheduled';
  } catch {
    return 'unavailable';
  }
}
