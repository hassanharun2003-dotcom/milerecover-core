import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import type { LocalNotificationKind } from './notifications';

type Nav = NavigationContainerRef<RootStackParamList>;

let navigationRef: Nav | null = null;

export function setNotificationNavigationRef(ref: Nav | null): void {
  navigationRef = ref;
}

export function routeForNotificationKind(kind: LocalNotificationKind): keyof RootStackParamList {
  switch (kind) {
    case 'trip_ready_for_review':
    case 'possible_missed_drive':
      return 'MainTabs';
    case 'tracking_degraded':
      return 'ProtectionAlert';
    case 'report_reminder':
      return 'MainTabs';
    case 'trial_ending':
    case 'payment_issue':
      return 'PlanSelection';
    case 'weekly_summary':
    default:
      return 'MainTabs';
  }
}

export function handleNotificationNavigation(data: { kind?: string } | null | undefined): void {
  if (!navigationRef || !data?.kind) return;
  const kind = data.kind as LocalNotificationKind;
  const route = routeForNotificationKind(kind);
  if (route === 'MainTabs') {
    if (kind === 'trip_ready_for_review' || kind === 'possible_missed_drive') {
      navigationRef.navigate('MainTabs', { screen: 'Review' });
      return;
    }
    if (kind === 'report_reminder' || kind === 'weekly_summary') {
      navigationRef.navigate('MainTabs', { screen: 'Proof' });
      return;
    }
    navigationRef.navigate('MainTabs', { screen: 'Home' });
    return;
  }
  if (route === 'PlanSelection') {
    navigationRef.navigate('PlanSelection', { source: 'upgrade' });
    return;
  }
  navigationRef.navigate(route as 'ProtectionAlert');
}

/** Wire expo-notifications response listeners once after NavigationContainer mounts. */
export function attachNotificationResponseHandlers(): () => void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { kind?: string } | undefined;
      handleNotificationNavigation(data);
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as { kind?: string } | undefined;
      handleNotificationNavigation(data);
    });
    return () => sub.remove();
  } catch {
    return () => undefined;
  }
}
