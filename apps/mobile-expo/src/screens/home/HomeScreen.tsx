import React, { useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  capabilitiesForEntitlement,
  formatDistance,
  rateForTimestamp,
  type ProtectionStatusView,
  type TripRecord,
} from '@milerecover/domain';
import {
  PrimaryButton,
  ProtectionCard,
  SecondaryButton,
  SoftPanel,
  SummaryCard,
  SkeletonBlock,
  TabScreen,
  TertiaryButton,
  TimelineRow,
  text,
  useAppTheme,
} from '../../design-system';
import { greetingForName, tripSourceLabel } from '../../product/copy';
import { selectHomePeriodSummary, selectPendingReviewCount, selectProtectionView } from '../../product/presentation';
import { selectProductExperience } from '../../product/selectors';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type CompactStatus =
  | 'protected'
  | 'configured_waiting'
  | 'checking'
  | 'needs_permission'
  | 'battery_limited'
  | 'stale'
  | 'error'
  | 'off'
  | 'manual_mode';

function compactProtection(input: ProtectionStatusView): {
  kind: CompactStatus;
  sentence: string;
  actionLabel: string;
  action: 'protection' | 'plans' | 'none';
} {
  switch (input.state) {
    case 'PROTECTED':
      return {
        kind: 'protected',
        sentence: input.lastCheckLabel ?? 'Automatic capture is on.',
        actionLabel: 'View',
        action: 'protection',
      };
    case 'CONFIGURED_WAITING':
      return {
        kind: 'configured_waiting',
        sentence: 'Waiting for your first drive.',
        actionLabel: 'View',
        action: 'protection',
      };
    case 'CHECKING':
      return {
        kind: 'checking',
        sentence: 'Automatic protection is checking status.',
        actionLabel: input.primaryAction.label,
        action: 'protection',
      };
    case 'BATTERY_LIMITED':
      return {
        kind: 'battery_limited',
        sentence: 'Battery settings may prevent some drives from being captured.',
        actionLabel: input.primaryAction.label,
        action: 'protection',
      };
    case 'OFF':
      return {
        kind: 'off',
        sentence: 'Drive protection is paused.',
        actionLabel: input.primaryAction.label,
        action: 'protection',
      };
    case 'MANUAL_ONLY':
      return {
        kind: 'manual_mode',
        sentence: 'Manual tracking is active. Set up automatic protection when you’re ready.',
        actionLabel: input.primaryAction.label,
        action: input.primaryAction.action === 'see_plans' ? 'plans' : 'none',
      };
    case 'STALE':
      return {
        kind: 'stale',
        sentence: 'Protection needs a fresh check before we call it current.',
        actionLabel: input.primaryAction.label,
        action: 'protection',
      };
    case 'ERROR':
      return {
        kind: 'error',
        sentence: input.message,
        actionLabel: input.primaryAction.action === 'none' ? '' : input.primaryAction.label,
        action: input.primaryAction.action === 'none' ? 'none' : 'protection',
      };
    case 'NEEDS_PERMISSION':
    default:
      return {
        kind: 'needs_permission',
        sentence: input.message,
        actionLabel: input.primaryAction.label,
        action: 'protection',
      };
  }
}

function statusTitle(kind: CompactStatus): string {
  switch (kind) {
    case 'protected':
      return 'Drives protected';
    case 'configured_waiting':
      return 'Protection is ready';
    case 'checking':
      return 'Checking';
    case 'battery_limited':
      return 'Battery limited';
    case 'off':
      return 'Off';
    case 'manual_mode':
      return 'Manual mode';
    case 'needs_permission':
      return 'Needs permission';
    case 'stale':
      return 'Needs check';
    case 'error':
      return 'Needs attention';
  }
}

function activityTimeLabel(timestamp: number): string {
  const hoursAgo = Math.round((Date.now() - timestamp) / 3600000);
  if (hoursAgo < 1) return 'Just now';
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  const daysAgo = Math.round(hoursAgo / 24);
  return daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
}

function compactPlace(label: string | null | undefined): string | null {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  return trimmed.split(',')[0]?.trim() || trimmed;
}

function recentDriveTitle(trip: TripRecord): string {
  const start = compactPlace(trip.startLabel);
  const end = compactPlace(trip.endLabel);
  if (start && end) return `${start} → ${end}`;
  if (start) return `${start} → Destination`;
  if (end) return `Start → ${end}`;
  return trip.purpose?.trim() || 'Saved drive';
}

function HomeSkeleton() {
  return (
    <TabScreen>
      <SkeletonBlock width="58%" height={24} style={{ marginBottom: spacing.md }} />
      <SoftPanel>
        <SkeletonBlock width="36%" height={20} style={{ marginBottom: spacing.sm }} />
        <SkeletonBlock width="92%" height={16} />
      </SoftPanel>
      <SkeletonBlock width="42%" height={20} style={{ marginBottom: spacing.xs, marginTop: spacing.sm }} />
      <SoftPanel>
        <SkeletonBlock width="100%" height={56} />
      </SoftPanel>
      <SoftPanel>
        <SkeletonBlock width="22%" height={20} style={{ marginBottom: spacing.sm }} />
        <SkeletonBlock width="70%" height={16} />
      </SoftPanel>
      <SkeletonBlock width="32%" height={20} style={{ marginTop: spacing.sm, marginBottom: spacing.xs }} />
      <SoftPanel>
        <SkeletonBlock width="80%" height={16} />
      </SoftPanel>
      <SkeletonBlock width="100%" height={48} style={{ marginTop: spacing.sm }} />
    </TabScreen>
  );
}

type NextBestAction =
  | {
      label: string;
      run: () => void;
    }
  | {
      label: string;
      run: null;
    };

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { palette } = useAppTheme();
  const { state, permissions, automaticCaptureAvailable, refreshRecoverySuggestions } = useApp();
  const {
    product,
    hydrated: productHydrated,
    consumePendingPostOnboardingRoute,
    markFirstConfirmedWorkDrive,
    markFirstRecoveredDrive,
    markFirstMissingTripSeen,
    markFirstReportPreview,
  } = useProduct();
  const recoveryRefreshed = useRef(false);
  const homeReady = state.hydrated && productHydrated;
  const experience = selectProductExperience(state, product, permissions, automaticCaptureAvailable);
  const { scenario, liveMode } = experience;
  const greeting = greetingForName(product.preferredName);
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const pendingReviewCount = selectPendingReviewCount(state, product, permissions, automaticCaptureAvailable);
  const protection = selectProtectionView({
    app: state,
    product,
    permissions,
    automaticCaptureAvailable,
    pendingReviewCount,
    offline: scenario.homeState === 'offline',
  });
  const compact = compactProtection(protection);
  const protectionNeedsAction =
    compact.action !== 'none' &&
    (compact.kind === 'needs_permission' ||
      compact.kind === 'off' ||
      compact.kind === 'battery_limited' ||
      compact.kind === 'stale' ||
      compact.kind === 'error');
  const showProtectionAction =
    compact.kind === 'configured_waiting' ||
    compact.kind === 'checking' ||
    compact.action === 'plans' ||
    protectionNeedsAction;
  const openProtection = () => {
    if (protectionNeedsAction) {
      logEvent(ANALYTICS_EVENTS.protectionDegradedViewed, {});
    }
    if (compact.action === 'plans') navigation.navigate('PlanSelection', { source: 'upgrade' });
    else navigation.navigate('ProtectionAlert');
  };

  const confirmedCount = experience.confirmedTrips.length;
  const recoveredCount = experience.confirmedTrips.filter((trip) => trip.source === 'recovered').length;
  const locale = product.localeProfile;
  const currentRate = rateForTimestamp(locale.rates, Date.now());
  const rateUsable = currentRate != null && !locale.activeRateNeedsReview;
  const periodSummary = selectHomePeriodSummary({
    trips: experience.confirmedTrips,
    locale,
    preferredName: product.preferredName,
    primaryGoal: product.primaryGoal,
    periodKind: 'this_week',
  });

  const nextBest = useMemo<NextBestAction>(() => {
    // Keep protection repair in the status row so Home has one clear next action.
    if (pendingReviewCount > 0) {
      return {
        label:
          pendingReviewCount === 1
            ? 'Review 1 possible drive'
            : `Review ${pendingReviewCount} possible drives`,
        run: () => navigation.navigate('Review'),
      };
    }
    if (locale.activeRateNeedsReview || !rateUsable) {
      return {
        label: 'Add a rate to calculate your value',
        run: () => navigation.navigate('EditSetup'),
      };
    }
    if (product.importPhase !== 'idle' && product.importPhase !== 'success') {
      return {
        label: 'Finish your import',
        run: () => navigation.navigate('BringExistingMileage'),
      };
    }
    if (experience.activeReviewItems.some((item) => item.kind === 'possible_missing_trip')) {
      return {
        label: 'Check for missed drives',
        run: () => navigation.navigate('Review'),
      };
    }
    if (scenario.proofReady && confirmedCount > 0) {
      return {
        label: 'Preview your report',
        run: () => navigation.navigate('Proof'),
      };
    }
    return {
      label: 'No action needed right now.',
      run: null,
    };
  }, [
    confirmedCount,
    experience.activeReviewItems,
    locale.activeRateNeedsReview,
    navigation,
    pendingReviewCount,
    product.importPhase,
    rateUsable,
    scenario.proofReady,
  ]);

  useEffect(() => {
    if (!homeReady) return;
    const route = consumePendingPostOnboardingRoute();
    if (!route || route === 'Proof') {
      if (route === 'Proof') navigation.navigate('Proof');
      return;
    }
    if (route === 'ProtectionAlert') navigation.navigate('ProtectionAlert');
    else if (route === 'ManualTrip') navigation.navigate('ManualTrip');
    else if (route === 'BringExistingMileage') navigation.navigate('BringExistingMileage');
    else if (route === 'MissingTripRecovery') navigation.navigate('Review');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeReady, product.pendingPostOnboardingRoute]);

  useEffect(() => {
    if (!homeReady) return;
    if (!capabilities.canUseGapDetection) return;
    if (recoveryRefreshed.current || experience.confirmedTrips.length === 0) return;
    recoveryRefreshed.current = true;
    refreshRecoverySuggestions(product.workLocations.map((loc) => ({ id: loc.id, label: loc.label })));
  }, [
    capabilities.canUseGapDetection,
    experience.confirmedTrips.length,
    homeReady,
    product.workLocations,
    refreshRecoverySuggestions,
  ]);

  useEffect(() => {
    if (!homeReady) return;
    if (liveMode && confirmedCount > 0 && product.firstConfirmedWorkDriveAt == null) {
      markFirstConfirmedWorkDrive();
    }
  }, [confirmedCount, homeReady, liveMode, markFirstConfirmedWorkDrive, product.firstConfirmedWorkDriveAt]);

  useEffect(() => {
    if (!homeReady) return;
    if (liveMode && recoveredCount > 0 && product.firstRecoveredDriveAt == null) {
      markFirstRecoveredDrive();
    }
  }, [homeReady, liveMode, markFirstRecoveredDrive, product.firstRecoveredDriveAt, recoveredCount]);

  useEffect(() => {
    if (!homeReady) return;
    if (
      liveMode &&
      experience.activeReviewItems.some((item) => item.kind === 'possible_missing_trip') &&
      product.firstMissingTripSeenAt == null
    ) {
      markFirstMissingTripSeen();
    }
  }, [
    experience.activeReviewItems,
    homeReady,
    liveMode,
    markFirstMissingTripSeen,
    product.firstMissingTripSeenAt,
  ]);

  useEffect(() => {
    if (!homeReady) return;
    if (liveMode && scenario.proofReady && product.firstReportPreviewAt == null && confirmedCount > 0) {
      markFirstReportPreview();
    }
  }, [
    confirmedCount,
    homeReady,
    liveMode,
    markFirstReportPreview,
    product.firstReportPreviewAt,
    scenario.proofReady,
  ]);

  const recent = experience.confirmedTrips
    .slice()
    .sort((a, b) => (b.endAt ?? b.startAt) - (a.endAt ?? a.startAt))
    .slice(0, 3);

  if (!homeReady) return <HomeSkeleton />;

  return (
    <TabScreen>
      <Text style={[text.subtitle, { marginBottom: spacing.xs }]} accessibilityRole="text">
        {greeting ?? 'Welcome back.'}
      </Text>

      <ProtectionCard variant={compact.kind === 'protected' ? 'protected' : 'default'}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                text.subtitle,
                compact.kind === 'protected' ? { color: palette.text.inverse } : null,
              ]}
            >
              {statusTitle(compact.kind)}
            </Text>
            <Text
              style={[
                text.body,
                { marginTop: spacing.xs },
                compact.kind === 'protected'
                  ? { color: palette.forest[100] }
                  : protectionNeedsAction
                    ? { color: palette.text.primary }
                    : null,
              ]}
            >
              {compact.sentence}
            </Text>
            {compact.kind !== 'protected' && protection.lastCheckLabel ? (
              <Text style={[text.caption, { marginTop: spacing.xs }]}>{protection.lastCheckLabel}</Text>
            ) : null}
          </View>
          {showProtectionAction ? (
            <TertiaryButton
              label={compact.actionLabel || 'View'}
              onPress={openProtection}
              accessibilityLabel="View protection status"
            />
          ) : null}
        </View>
      </ProtectionCard>

      <Text style={[text.subtitle, { marginBottom: spacing.xs, marginTop: spacing.sm }]}>
        {periodSummary.periodLabel}
      </Text>
      <SummaryCard
        items={[
          {
            label: 'Distance',
            value: periodSummary.workDistanceLabel,
          },
          {
            label: 'Drives',
            value: String(periodSummary.tripCount),
          },
          {
            label: 'Estimated value',
            value: periodSummary.estimatedValueLabel,
          },
        ]}
      />

      <SoftPanel>
        <Text style={text.subtitle}>Next</Text>
        {nextBest.run ? (
          <PrimaryButton
            label={nextBest.label}
            onPress={nextBest.run}
            accessibilityLabel={nextBest.label}
          />
        ) : (
          <Text style={[text.body, { marginTop: spacing.xs }]}>{nextBest.label}</Text>
        )}
      </SoftPanel>

      <Text style={[text.subtitle, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>Recent</Text>
      {recent.length === 0 ? (
        <SoftPanel>
          <Text style={text.body}>No drives yet. Add one when you know the miles.</Text>
        </SoftPanel>
      ) : (
        recent.map((trip) => {
          const stateLabel =
            trip.classification === 'business'
              ? 'Work'
              : trip.classification === 'personal'
                ? 'Personal'
                : 'Pending';
          return (
            <View key={trip.id} style={{ marginBottom: spacing.sm }}>
              <TimelineRow
                title={recentDriveTitle(trip)}
                subtitle={`${formatDistance(
                  trip.distanceMiles,
                  locale.distanceUnit,
                  locale.localeTag,
                )} · ${tripSourceLabel(trip.source)} · ${stateLabel}`}
                timeLabel={activityTimeLabel(trip.endAt ?? trip.startAt)}
                onPress={
                  liveMode ? () => navigation.navigate('TripDetails', { tripId: trip.id }) : undefined
                }
              />
            </View>
          );
        })
      )}

      <View style={{ marginTop: spacing.sm }}>
        <SecondaryButton
          label="Add a drive"
          onPress={() => navigation.navigate('ManualTrip')}
          accessibilityLabel="Add a drive from home"
        />
      </View>
    </TabScreen>
  );
}
