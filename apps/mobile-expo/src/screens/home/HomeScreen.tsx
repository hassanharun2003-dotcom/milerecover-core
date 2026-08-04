import React, { useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  capabilitiesForEntitlement,
  estimatedValueCents,
  formatCurrencyCents,
  formatDistance,
  rateForTimestamp,
  resolveProtectionStatus,
} from '@milerecover/domain';
import {
  Badge,
  OfflineBanner,
  PrimaryButton,
  SecondaryButton,
  SoftPanel,
  StatusCard,
  SummaryCard,
  TabScreen,
  TimelineRow,
  TertiaryButton,
  text,
} from '../../design-system';
import type { ActivityEventKind } from '../../fixtures/scenarios';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { PREVIEW_CHANNEL_MARKER, isStandaloneBuild } from '../../constants/buildInfo';
import { greetingForName } from '../../product/copy';
import { selectProductExperience } from '../../product/selectors';
import { earnedTrialMoment, isWithinFirstWeek } from '../../product/trialValue';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import { TrialOfferCard } from '../../components/TrialOfferCard';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function protectionVariant(
  status: ReturnType<typeof resolveProtectionStatus>['status'],
): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'protected':
      return 'success';
    case 'manual_only':
    case 'tracking_paused':
      return 'info';
    case 'setup_incomplete':
      return 'warning';
    case 'needs_attention':
      return 'danger';
    default:
      return 'warning';
  }
}

function activityTimeLabel(timestamp: number): string {
  const hoursAgo = Math.round((Date.now() - timestamp) / 3600000);
  if (hoursAgo < 1) return 'Just now';
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  const daysAgo = Math.round(hoursAgo / 24);
  return daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
}

function activityBadge(kind: ActivityEventKind): string | null {
  if (kind === 'gap_found') return 'Needs a look';
  if (kind === 'history_imported') return 'Imported';
  return null;
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
    markCelebratedFirstDrive,
    markCelebratedFirstReport,
    markCelebratedFirstRecovery,
    dismissFinishSetup,
  } = useProduct();
  const recoveryRefreshed = useRef(false);
  const experience = selectProductExperience(state, product, permissions, automaticCaptureAvailable);
  const { scenario, liveMode } = experience;
  const greeting = greetingForName(product.preferredName);
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const setupIncomplete =
    product.protectionSetupState === 'not_started' || product.protectionSetupState === 'educated';
  const watchingOn =
    product.trackingEnabled &&
    capabilities.canUseAutomaticCapture &&
    permissions.location === 'granted' &&
    permissions.backgroundLocation === 'granted';
  const protection = resolveProtectionStatus({
    permissions,
    trackingEnabled: product.trackingEnabled,
    canUseAutomaticCapture: capabilities.canUseAutomaticCapture && automaticCaptureAvailable,
    trackingEngineState: state.trackingEngineState,
    lastConfirmedCaptureAt: state.lastConfirmedCaptureAt,
    lastSyncAt: state.lastSyncAt,
    pendingReviewCount: experience.activeReviewItems.length,
    setupIncomplete,
    offline: scenario.homeState === 'offline',
  });

  const confirmedCount = experience.confirmedTrips.length;
  const recoveredCount = experience.confirmedTrips.filter((trip) => trip.source === 'recovered').length;
  const locale = product.localeProfile;
  const currentRate = rateForTimestamp(locale.rates, Date.now());
  const protectedMiles = scenario.weekSummary.milesProtected;
  const estimatedProtected =
    currentRate != null ? estimatedValueCents(protectedMiles, currentRate.centsPerMile) : null;
  const recoveredMiles = scenario.weekSummary.recoveredMiles;
  const estimatedRecovered =
    currentRate != null ? estimatedValueCents(recoveredMiles, currentRate.centsPerMile) : null;
  const trialMoment = earnedTrialMoment(product, confirmedCount);
  const firstWeek =
    isWithinFirstWeek(product.onboarding.completedAt) ||
    isWithinFirstWeek(product.firstConfirmedWorkDriveAt);

  const missingMileCount = useMemo(
    () => experience.activeReviewItems.filter((item) => item.kind === 'possible_missing_trip').length,
    [experience.activeReviewItems],
  );
  const pendingReviewCount = experience.activeReviewItems.length;

  const nextAction = useMemo(() => {
    if (protection.primaryIssue?.action === 'see_plans') {
      return {
        label: protection.primaryIssue.actionLabel,
        run: () => navigation.navigate('PlanSelection', { source: 'upgrade' }),
      };
    }
    if (
      protection.primaryIssue?.action === 'finish_setup' ||
      protection.primaryIssue?.action === 'enable_watching' ||
      protection.primaryIssue?.action === 'open_location_settings' ||
      protection.primaryIssue?.action === 'open_battery_settings'
    ) {
      return {
        label: protection.primaryIssue.actionLabel,
        run: () => navigation.navigate('ProtectionAlert'),
      };
    }
    if (missingMileCount > 0) {
      return {
        label:
          missingMileCount === 1
            ? 'Check possible missing drive'
            : `Check ${missingMileCount} possible missing drives`,
        run: () => navigation.navigate('Review'),
      };
    }
    if (pendingReviewCount > 0 || protection.primaryIssue?.action === 'review_trips') {
      return {
        label:
          pendingReviewCount === 1
            ? 'Review 1 trip'
            : `Review ${pendingReviewCount} trips`,
        run: () => navigation.navigate('Review'),
      };
    }
    if (scenario.proofReady) {
      return {
        label: 'Open Proof',
        run: () => navigation.navigate('Proof'),
      };
    }
    return {
      label: 'Add a drive',
      run: () => navigation.navigate('ManualTrip'),
    };
  }, [
    missingMileCount,
    navigation,
    pendingReviewCount,
    protection.primaryIssue,
    scenario.proofReady,
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

  const showWeekSummary =
    !liveMode ||
    scenario.weekSummary.milesProtected > 0 ||
    scenario.weekSummary.recoveredMiles > 0 ||
    scenario.weekSummary.milesReadyForProof > 0;

  const showTrial =
    liveMode &&
    trialMoment != null &&
    protection.status === 'protected' &&
    pendingReviewCount === 0;

  const reportHeroAlreadyShown = /report is ready/i.test(scenario.homeTitle);
  const celebration =
    firstWeek && liveMode
      ? product.celebratedFirstDriveAt == null && confirmedCount > 0
        ? ('drive' as const)
        : product.celebratedFirstRecoveryAt == null && recoveredCount > 0
          ? ('recovery' as const)
          : !reportHeroAlreadyShown &&
              product.celebratedFirstReportAt == null &&
              scenario.proofReady &&
              product.firstReportPreviewAt != null
            ? ('report' as const)
            : null
      : null;

  const setupTasks = [
    product.vehicles.length === 0 ? { label: 'Add a vehicle', route: 'VehicleSetup' as const } : null,
    product.workLocations.length === 0
      ? { label: 'Add a workplace', route: 'WorkLocationSetup' as const }
      : null,
    !watchingOn && capabilities.canUseAutomaticCapture
      ? { label: 'Turn on protection', route: 'ProtectionAlert' as const }
      : !capabilities.canUseAutomaticCapture
        ? { label: 'See Plus for automatic protection', route: 'PlanSelection' as const }
        : null,
  ].filter(Boolean) as Array<{
    label: string;
    route: 'VehicleSetup' | 'WorkLocationSetup' | 'ProtectionAlert' | 'PlanSelection';
  }>;

  const showFinishSetup =
    liveMode &&
    product.finishSetupDismissedAt == null &&
    setupTasks.length > 0 &&
    confirmedCount === 0 &&
    protection.status !== 'needs_attention';

  const appVariant =
    (Constants.expoConfig?.extra?.appVariant as string | undefined) ?? 'development';
  const showOtaMarker =
    Boolean(PREVIEW_CHANNEL_MARKER) &&
    (isStandaloneBuild(appVariant) ||
      Updates.channel === 'preview' ||
      Updates.channel === 'production');

  const protectionActionLabel =
    protection.primaryIssue &&
    protection.primaryIssue.action !== 'none' &&
    protection.primaryIssue.action !== 'review_trips'
      ? protection.primaryIssue.actionLabel
      : undefined;

  return (
    <TabScreen>
      <Text style={[text.subtitle, { marginBottom: spacing.xs }]} accessibilityRole="text">
        {greeting ?? 'Welcome back.'}
      </Text>

      {showOtaMarker ? (
        <Text
          style={[text.caption, { marginBottom: spacing.sm, color: '#1F4D36' }]}
          accessibilityRole="text"
          accessibilityLabel={PREVIEW_CHANNEL_MARKER}
        >
          {PREVIEW_CHANNEL_MARKER}
        </Text>
      ) : null}

      {scenario.homeState === 'offline' ? (
        <OfflineBanner body="Your miles are safe on this device. Sync resumes when you’re back online." />
      ) : null}

      {/* 1. Am I protected? */}
      <StatusCard
        variant={protectionVariant(protection.status)}
        title={protection.title}
        body={[
          protection.primaryIssue?.what,
          protection.primaryIssue?.why ?? protection.detail,
          protection.lastCheckLabel,
          protection.automaticDependable
            ? 'Automatic tracking looks dependable.'
            : 'Automatic tracking is not dependable yet — manual drives still work.',
        ]
          .filter(Boolean)
          .join(' ')}
        actionLabel={protectionActionLabel}
        onAction={
          protectionActionLabel
            ? () => {
                if (protection.primaryIssue?.action === 'see_plans') {
                  navigation.navigate('PlanSelection', { source: 'upgrade' });
                } else {
                  navigation.navigate('ProtectionAlert');
                }
              }
            : undefined
        }
        emphasis="hero"
      />

      {/* 2–3. Missing miles + review */}
      {missingMileCount > 0 ? (
        <StatusCard
          variant="warning"
          title={
            missingMileCount === 1
              ? 'Possible missing drive'
              : `${missingMileCount} possible missing drives`
          }
          body="MileRecover found quiet stretches that may hide work miles. Nothing is saved until you confirm."
          actionLabel="Review suggestions"
          onAction={() => navigation.navigate('Review')}
          emphasis="subtle"
        />
      ) : null}

      {pendingReviewCount > 0 && missingMileCount === 0 ? (
        <StatusCard
          variant="warning"
          title={
            pendingReviewCount === 1
              ? '1 trip waiting for review'
              : `${pendingReviewCount} trips waiting for review`
          }
          body="Decide Work, Personal, Not sure, or Edit. No hidden gestures."
          actionLabel="Open Review"
          onAction={() => navigation.navigate('Review')}
          emphasis="subtle"
        />
      ) : null}

      {celebration === 'drive' ? (
        <SoftPanel>
          <Text style={text.subtitle}>First work drive saved</Text>
          <Text style={[text.body, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            {watchingOn
              ? 'You’re protected — automatic protection is on.'
              : 'Your first work drive is safely recorded.'}
          </Text>
          <TertiaryButton label="Got it" onPress={markCelebratedFirstDrive} />
        </SoftPanel>
      ) : null}
      {celebration === 'recovery' ? (
        <SoftPanel>
          <Text style={text.subtitle}>First recovery</Text>
          <Text style={[text.body, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            We found mileage worth keeping — after you confirmed it.
          </Text>
          <TertiaryButton label="Got it" onPress={markCelebratedFirstRecovery} />
        </SoftPanel>
      ) : null}
      {celebration === 'report' ? (
        <SoftPanel>
          <Text style={text.subtitle}>First report ready</Text>
          <Text style={[text.body, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            When work asks, you’re ready.
          </Text>
          <TertiaryButton label="Got it" onPress={markCelebratedFirstReport} />
        </SoftPanel>
      ) : null}

      {showTrial ? (
        <TrialOfferCard
          confirmedWorkDriveCount={confirmedCount}
          onStartTrial={() => navigation.navigate('PlanSelection', { source: 'upgrade' })}
        />
      ) : null}

      {showFinishSetup ? (
        <SoftPanel>
          <Text style={text.subtitle}>Finish setup</Text>
          <Text style={[text.caption, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            Optional · {3 - setupTasks.length} of 3 done
          </Text>
          {setupTasks.slice(0, 3).map((task) => (
            <View key={task.label} style={{ marginBottom: spacing.xs }}>
              <SecondaryButton
                label={task.label}
                onPress={() => {
                  if (task.route === 'PlanSelection') {
                    navigation.navigate('PlanSelection', { source: 'upgrade' });
                  } else {
                    navigation.navigate(task.route);
                  }
                }}
              />
            </View>
          ))}
          <TertiaryButton label="Not now" onPress={dismissFinishSetup} />
        </SoftPanel>
      ) : null}

      {/* 4. How much value protected this period */}
      {showWeekSummary ? (
        <>
          <Text style={[text.subtitle, { marginBottom: spacing.xs, marginTop: spacing.sm }]}>
            This period
          </Text>
          <SummaryCard
            items={[
              {
                label: locale.distanceUnit === 'km' ? 'Distance kept' : 'Miles kept',
                value: formatDistance(protectedMiles, locale.distanceUnit, locale.localeTag, 1).replace(
                  ` ${locale.distanceUnit}`,
                  '',
                ),
              },
              {
                label: 'Estimated value',
                value:
                  estimatedProtected != null
                    ? formatCurrencyCents(estimatedProtected, locale.currencyCode, locale.localeTag)
                    : '—',
              },
              {
                label: 'Recovered',
                value: formatDistance(recoveredMiles, locale.distanceUnit, locale.localeTag, 1).replace(
                  ` ${locale.distanceUnit}`,
                  '',
                ),
              },
            ]}
          />
          {estimatedRecovered != null && recoveredMiles > 0 ? (
            <Text style={[text.caption, { marginBottom: spacing.sm }]}>
              Estimated value recovered{' '}
              {formatCurrencyCents(estimatedRecovered, locale.currencyCode, locale.localeTag)}
            </Text>
          ) : null}
        </>
      ) : null}

      {liveMode && confirmedCount === 0 && protection.status === 'protected' ? (
        <SoftPanel>
          <Text style={text.subtitle}>You’re protected</Text>
          <Text style={[text.body, { marginTop: spacing.xs }]}>
            Your drives will appear here after you travel. Nothing is invented.
          </Text>
        </SoftPanel>
      ) : null}

      {/* 5. What should I do next? */}
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>
        <PrimaryButton
          label={nextAction.label}
          onPress={nextAction.run}
          accessibilityLabel={nextAction.label}
        />
      </View>

      <Text style={[text.subtitle, { marginBottom: spacing.xs, marginTop: spacing.sm }]}>Recent</Text>
      {scenario.activity.length === 0 ? (
        <SoftPanel>
          <Text style={text.subtitle}>Nothing here yet</Text>
          <Text style={[text.body, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            Add a work drive when you know the miles, or finish protection setup for automatic coverage.
          </Text>
          <SecondaryButton label="Add your first drive" onPress={() => navigation.navigate('ManualTrip')} />
        </SoftPanel>
      ) : (
        scenario.activity.slice(0, 5).map((event) => (
          <View key={event.id} style={{ marginBottom: spacing.sm }}>
            <TimelineRow
              title={event.title}
              subtitle={event.subtitle}
              timeLabel={activityTimeLabel(event.timestamp)}
              onPress={
                liveMode ? () => navigation.navigate('TripDetails', { tripId: event.id }) : undefined
              }
            />
            {activityBadge(event.kind) ? (
              <View style={{ marginLeft: spacing.lg, marginTop: -spacing.sm, marginBottom: spacing.sm }}>
                <Badge
                  label={activityBadge(event.kind)!}
                  variant={event.kind === 'gap_found' ? 'warning' : 'info'}
                />
              </View>
            ) : null}
          </View>
        ))
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
