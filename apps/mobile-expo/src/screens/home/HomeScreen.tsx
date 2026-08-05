import React, { useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  capabilitiesForEntitlement,
  rateForTimestamp,
  resolveProtectionStatus,
} from '@milerecover/domain';
import {
  OfflineBanner,
  PrimaryButton,
  SecondaryButton,
  SoftPanel,
  StatusCard,
  SummaryCard,
  TabScreen,
  TimelineRow,
  text,
} from '../../design-system';
import { greetingForName, tripSourceLabel } from '../../product/copy';
import { selectHomePeriodSummary, selectProtectionView } from '../../product/presentation';
import { selectProductExperience } from '../../product/selectors';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type CompactStatus = 'protected' | 'setup_incomplete' | 'needs_attention' | 'paused' | 'manual_mode';

function compactProtection(input: {
  status: ReturnType<typeof resolveProtectionStatus>['status'];
  primaryIssue: ReturnType<typeof resolveProtectionStatus>['primaryIssue'];
}): { kind: CompactStatus; sentence: string; actionLabel: string; action: 'protection' | 'plans' | 'none' } {
  if (input.primaryIssue?.action === 'see_plans') {
    return {
      kind: 'needs_attention',
      sentence: input.primaryIssue.what,
      actionLabel: 'See plans',
      action: 'plans',
    };
  }
  switch (input.status) {
    case 'protected':
      return {
        kind: 'protected',
        sentence: 'Drive protection is on.',
        actionLabel: 'View protection',
        action: 'protection',
      };
    case 'setup_incomplete':
      return {
        kind: 'setup_incomplete',
        sentence: 'Finish a short setup to protect drives automatically.',
        actionLabel: 'Finish setup',
        action: 'protection',
      };
    case 'tracking_paused':
      return {
        kind: 'paused',
        sentence: 'Drive protection is paused.',
        actionLabel: 'Turn on protection',
        action: 'protection',
      };
    case 'manual_only':
      return {
        kind: 'manual_mode',
        sentence: 'Manual tracking is active. Set up automatic protection when you’re ready.',
        actionLabel: 'Set up protection',
        action: 'protection',
      };
    case 'needs_attention':
    default:
      return {
        kind: 'needs_attention',
        sentence:
          input.primaryIssue?.what === 'Battery restrictions may stop MileRecover'
            ? 'Battery settings may prevent some drives from being captured.'
            : input.primaryIssue?.what === 'Background location is off'
              ? 'Background location is off — some drives may be missed.'
              : input.primaryIssue?.what ?? 'Protection needs a quick fix.',
        actionLabel: 'Fix protection',
        action: 'protection',
      };
  }
}

function statusVariant(kind: CompactStatus): 'success' | 'warning' | 'danger' | 'info' {
  switch (kind) {
    case 'protected':
      return 'success';
    case 'manual_mode':
    case 'paused':
      return 'info';
    case 'setup_incomplete':
      return 'warning';
    case 'needs_attention':
      return 'danger';
  }
}

function activityTimeLabel(timestamp: number): string {
  const hoursAgo = Math.round((Date.now() - timestamp) / 3600000);
  if (hoursAgo < 1) return 'Just now';
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  const daysAgo = Math.round(hoursAgo / 24);
  return daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { state, permissions, automaticCaptureAvailable, refreshRecoverySuggestions } = useApp();
  const {
    product,
    consumePendingPostOnboardingRoute,
    markFirstConfirmedWorkDrive,
    markFirstRecoveredDrive,
    markFirstMissingTripSeen,
    markFirstReportPreview,
  } = useProduct();
  const recoveryRefreshed = useRef(false);
  const experience = selectProductExperience(state, product, permissions, automaticCaptureAvailable);
  const { scenario, liveMode } = experience;
  const greeting = greetingForName(product.preferredName);
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const setupIncomplete =
    product.protectionSetupState === 'not_started' || product.protectionSetupState === 'educated';
  const pendingReviewCount = experience.activeReviewItems.length;
  const protection = selectProtectionView({
    app: state,
    product,
    permissions,
    automaticCaptureAvailable,
    pendingReviewCount,
    offline: scenario.homeState === 'offline',
  });
  const compact = compactProtection(protection);

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

  const nextBest = useMemo(() => {
    // Priority: blocking tracking → classification → report correction → rate → recovery → report ready → caught up
    if (compact.kind === 'needs_attention' || compact.kind === 'paused' || compact.kind === 'setup_incomplete') {
      return {
        label:
          compact.kind === 'paused'
            ? 'Turn on drive protection'
            : compact.kind === 'setup_incomplete'
              ? 'Finish protection setup'
              : compact.actionLabel,
        run: () => {
          if (compact.kind === 'needs_attention') {
            logEvent(ANALYTICS_EVENTS.protectionDegradedViewed, {});
          }
          if (compact.action === 'plans') navigation.navigate('PlanSelection', { source: 'upgrade' });
          else navigation.navigate('ProtectionAlert');
        },
      };
    }
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
    if (setupIncomplete && capabilities.canUseAutomaticCapture) {
      return {
        label: 'Turn on drive protection',
        run: () => navigation.navigate('ProtectionAlert'),
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
      label: 'You’re all caught up',
      run: () => navigation.navigate('ManualTrip'),
    };
  }, [
    capabilities.canUseAutomaticCapture,
    compact.action,
    compact.actionLabel,
    compact.kind,
    confirmedCount,
    experience.activeReviewItems,
    locale.activeRateNeedsReview,
    navigation,
    pendingReviewCount,
    product.importPhase,
    rateUsable,
    scenario.proofReady,
    setupIncomplete,
  ]);

  useEffect(() => {
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
  }, [product.pendingPostOnboardingRoute]);

  useEffect(() => {
    if (!capabilities.canUseGapDetection) return;
    if (recoveryRefreshed.current || experience.confirmedTrips.length === 0) return;
    recoveryRefreshed.current = true;
    refreshRecoverySuggestions(product.workLocations.map((loc) => ({ id: loc.id, label: loc.label })));
  }, [
    capabilities.canUseGapDetection,
    experience.confirmedTrips.length,
    product.workLocations,
    refreshRecoverySuggestions,
  ]);

  useEffect(() => {
    if (liveMode && confirmedCount > 0 && product.firstConfirmedWorkDriveAt == null) {
      markFirstConfirmedWorkDrive();
    }
  }, [confirmedCount, liveMode, markFirstConfirmedWorkDrive, product.firstConfirmedWorkDriveAt]);

  useEffect(() => {
    if (liveMode && recoveredCount > 0 && product.firstRecoveredDriveAt == null) {
      markFirstRecoveredDrive();
    }
  }, [liveMode, markFirstRecoveredDrive, product.firstRecoveredDriveAt, recoveredCount]);

  useEffect(() => {
    if (
      liveMode &&
      experience.activeReviewItems.some((item) => item.kind === 'possible_missing_trip') &&
      product.firstMissingTripSeenAt == null
    ) {
      markFirstMissingTripSeen();
    }
  }, [
    experience.activeReviewItems,
    liveMode,
    markFirstMissingTripSeen,
    product.firstMissingTripSeenAt,
  ]);

  useEffect(() => {
    if (liveMode && scenario.proofReady && product.firstReportPreviewAt == null && confirmedCount > 0) {
      markFirstReportPreview();
    }
  }, [
    confirmedCount,
    liveMode,
    markFirstReportPreview,
    product.firstReportPreviewAt,
    scenario.proofReady,
  ]);

  const recent = scenario.activity.slice(0, 3);

  return (
    <TabScreen>
      <Text style={[text.subtitle, { marginBottom: spacing.xs }]} accessibilityRole="text">
        {greeting ?? 'Welcome back.'}
      </Text>

      {scenario.homeState === 'offline' ? (
        <OfflineBanner body="Your miles are safe on this device. Sync resumes when you’re back online." />
      ) : null}

      <StatusCard
        variant={statusVariant(compact.kind)}
        title={
          compact.kind === 'protected'
            ? 'Protected'
            : compact.kind === 'setup_incomplete'
              ? 'Setup incomplete'
              : compact.kind === 'paused'
                ? 'Paused'
                : compact.kind === 'manual_mode'
                  ? 'Manual mode'
                  : 'Needs attention'
        }
        body={compact.sentence}
        actionLabel={compact.actionLabel}
        onAction={() => {
          if (compact.action === 'plans') navigation.navigate('PlanSelection', { source: 'upgrade' });
          else if (compact.action === 'protection') navigation.navigate('ProtectionAlert');
        }}
        emphasis="subtle"
      />

      <Text style={[text.subtitle, { marginBottom: spacing.xs, marginTop: spacing.sm }]}>
        {periodSummary.periodLabel}
      </Text>
      <SummaryCard
        items={[
          {
            label: locale.distanceUnit === 'km' ? 'Work distance' : 'Work miles',
            value: periodSummary.workDistanceLabel.replace(` ${locale.distanceUnit}`, ''),
          },
          {
            label: 'Estimated value',
            value: periodSummary.estimatedValueLabel,
          },
          {
            label: 'Recovered',
            value: periodSummary.recoveredDistanceLabel.replace(` ${locale.distanceUnit}`, ''),
          },
          {
            label: 'Needs review',
            value: String(pendingReviewCount),
          },
        ]}
      />

      <SoftPanel>
        <Text style={text.subtitle}>Next</Text>
        <PrimaryButton
          label={nextBest.label}
          onPress={nextBest.run}
          accessibilityLabel={nextBest.label}
        />
      </SoftPanel>

      {experience.activeReviewItems.some((item) => item.kind === 'possible_missing_trip') ? (
        <StatusCard
          variant="warning"
          title="Possible missed drives"
          body="Review suggested gaps. Nothing is added until you confirm."
          actionLabel="Review"
          onAction={() => navigation.navigate('Review')}
          emphasis="subtle"
        />
      ) : null}

      <Text style={[text.subtitle, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>Recent</Text>
      {recent.length === 0 ? (
        <SoftPanel>
          <Text style={text.body}>No drives yet. Add one when you know the miles.</Text>
        </SoftPanel>
      ) : (
        recent.map((event) => {
          const trip = state.trips.find((item) => item.id === event.id);
          const stateLabel =
            trip?.classification === 'business'
              ? 'Work'
              : trip?.classification === 'personal'
                ? 'Personal'
                : 'Pending';
          return (
            <View key={event.id} style={{ marginBottom: spacing.sm }}>
              <TimelineRow
                title={event.title}
                subtitle={`${tripSourceLabel(trip?.source ?? 'manual')} · ${stateLabel}`}
                timeLabel={activityTimeLabel(event.timestamp)}
                onPress={
                  liveMode ? () => navigation.navigate('TripDetails', { tripId: event.id }) : undefined
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
