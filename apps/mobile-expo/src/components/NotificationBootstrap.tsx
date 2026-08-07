import React, { useEffect, useRef } from 'react';
import { selectPendingReviewCount, selectProtectionView } from '../product/presentation';
import { useProduct } from '../product/ProductContext';
import { useApp } from '../store/AppContext';
import {
  requestNotificationPermission,
  scheduleLocalNotification,
} from '../services/notifications';
import { attachNotificationResponseHandlers } from '../services/notificationRouter';

/**
 * Schedules calm, deduped local notifications from real product state.
 * Never claims a drive/recovery that did not happen.
 * Does not auto-start a Pro trial.
 */
export function NotificationBootstrap({ children }: { children: React.ReactNode }) {
  const { state, permissions, automaticCaptureAvailable } = useApp();
  const { product } = useProduct();
  const attached = useRef(false);

  useEffect(() => {
    if (attached.current) return;
    attached.current = true;
    return attachNotificationResponseHandlers();
  }, []);

  useEffect(() => {
    // Wait until Home is unlocked — never prompt during Ready finish.
    if (!state.onboardingComplete || product.onboarding.completedAt == null) return;
    let cancelled = false;
    // Defer OS permission prompt so it never races Ready → Home finish
    // (which previously left “One moment…” under the system dialog and could ANR).
    const timer = setTimeout(() => {
      void (async () => {
      if (cancelled) return;
      if (!product.notificationPreferences.enabled) return;
      const permission = await requestNotificationPermission();
      if (cancelled || permission !== 'granted') return;
      const prefs = product.notificationPreferences;
      const pending = selectPendingReviewCount(
        state,
        product,
        permissions,
        automaticCaptureAvailable,
      );
      if (pending > 0) {
        await scheduleLocalNotification({
          kind: 'trip_ready_for_review',
          title: pending === 1 ? '1 drive needs review' : `${pending} drives need review`,
          body: 'Open Review to classify work vs personal.',
          dedupeKey: `review-${pending}-${new Date().toISOString().slice(0, 10)}`,
          prefs,
          permission,
        });
      }
      const missing = state.reviewItems.some((item) => item.kind === 'possible_missing_trip');
      if (missing) {
        await scheduleLocalNotification({
          kind: 'possible_missed_drive',
          title: 'Possible missed drive',
          body: 'We may have found a drive worth checking. Nothing is added without you.',
          dedupeKey: `missing-${new Date().toISOString().slice(0, 10)}`,
          prefs,
          permission,
        });
      }
      const protection = selectProtectionView({
        app: state,
        product,
        permissions,
        automaticCaptureAvailable,
        pendingReviewCount: pending,
      });
      if (
        protection.state === 'NEEDS_PERMISSION' ||
        protection.state === 'BATTERY_LIMITED' ||
        protection.state === 'ERROR' ||
        protection.state === 'STALE'
      ) {
        await scheduleLocalNotification({
          kind: 'tracking_degraded',
          title: 'Drive protection needs attention',
          body: protection.message,
          dedupeKey: `protect-${protection.state}-${new Date().toISOString().slice(0, 10)}`,
          prefs,
          permission,
        });
      }
      if (
        product.entitlement.status === 'trialActive' &&
        product.entitlement.trialEndsAt != null &&
        product.entitlement.trialEndsAt - Date.now() < 36 * 3600 * 1000 &&
        product.entitlement.trialEndsAt > Date.now()
      ) {
        await scheduleLocalNotification({
          kind: 'trial_ending',
          title: 'Your Pro trial ends soon',
          body: 'Keep automation and advanced proof with Pro — your mileage history stays yours.',
          dedupeKey: `trial-end-${product.entitlement.trialEndsAt}`,
          prefs,
          permission,
        });
      }
      })();
    }, 4000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    automaticCaptureAvailable,
    permissions,
    product,
    product.notificationPreferences,
    product.onboarding.completedAt,
    state,
    state.onboardingComplete,
  ]);

  return <>{children}</>;
}
