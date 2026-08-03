import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import { capabilitiesForEntitlement } from '@milerecover/domain';
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

function homeVariant(scenarioState: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (scenarioState) {
    case 'recovery_available':
      return 'warning';
    case 'protection_limited':
      return 'danger';
    case 'offline':
      return 'info';
    default:
      return 'success';
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
  const watchingOn =
    product.trackingEnabled &&
    capabilities.canUseAutomaticCapture &&
    permissions.location === 'granted' &&
    permissions.backgroundLocation === 'granted';
  const confirmedCount = experience.confirmedTrips.length;
  const recoveredCount = experience.confirmedTrips.filter((trip) => trip.source === 'recovered').length;
  const trialMoment = earnedTrialMoment(product, confirmedCount);
  const firstWeek =
    isWithinFirstWeek(product.onboarding.completedAt) ||
    isWithinFirstWeek(product.firstConfirmedWorkDriveAt);

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

  const handlePrimary = () => {
    if (scenario.primaryActionRoute === 'ProtectionAlert') {
      if (!capabilities.canUseAutomaticCapture) {
        navigation.navigate('PlanSelection', { source: 'upgrade' });
        return;
      }
      navigation.navigate('ProtectionAlert');
      return;
    }
    if (scenario.primaryActionRoute === 'Review') navigation.navigate('Review');
    else if (scenario.primaryActionRoute === 'Profile') navigation.navigate('Profile');
    else if (scenario.primaryActionRoute === 'Proof') navigation.navigate('Proof');
    else if (scenario.primaryActionRoute === 'ManualTrip') navigation.navigate('ManualTrip');
  };

  const showWeekSummary =
    !liveMode ||
    scenario.weekSummary.milesProtected > 0 ||
    scenario.weekSummary.recoveredMiles > 0 ||
    scenario.weekSummary.milesReadyForProof > 0;

  const showTrial =
    liveMode &&
    trialMoment != null &&
    scenario.homeState !== 'protection_limited' &&
    scenario.primaryActionRoute !== 'Review';

  const celebration =
    firstWeek && liveMode
      ? product.celebratedFirstDriveAt == null && confirmedCount > 0
        ? ('drive' as const)
        : product.celebratedFirstRecoveryAt == null && recoveredCount > 0
          ? ('recovery' as const)
          : product.celebratedFirstReportAt == null && scenario.proofReady && product.firstReportPreviewAt != null
            ? ('report' as const)
            : null
      : null;

  const setupTasks = [
    product.vehicles.length === 0 ? { label: 'Add a vehicle', route: 'VehicleSetup' as const } : null,
    product.workLocations.length === 0
      ? { label: 'Add a workplace', route: 'WorkLocationSetup' as const }
      : null,
    !watchingOn && capabilities.canUseAutomaticCapture
      ? { label: 'Turn on watching', route: 'ProtectionAlert' as const }
      : !capabilities.canUseAutomaticCapture
        ? { label: 'See Plus for watching', route: 'PlanSelection' as const }
        : null,
  ].filter(Boolean) as Array<{ label: string; route: 'VehicleSetup' | 'WorkLocationSetup' | 'ProtectionAlert' | 'PlanSelection' }>;

  const showFinishSetup =
    liveMode &&
    product.finishSetupDismissedAt == null &&
    setupTasks.length > 0 &&
    confirmedCount === 0;

  return (
    <TabScreen>
      {greeting ? (
        <Text style={[text.body, { marginBottom: spacing.xs }]} accessibilityRole="text">
          {greeting}
        </Text>
      ) : null}

      {scenario.homeState === 'offline' ? (
        <OfflineBanner body="Your miles are safe on this device. Sync resumes when you’re back online." />
      ) : null}

      <StatusCard
        variant={homeVariant(scenario.homeState)}
        title={scenario.homeTitle}
        body={scenario.homeDetail}
        actionLabel={scenario.primaryAction ?? undefined}
        onAction={scenario.primaryAction ? handlePrimary : undefined}
        emphasis="hero"
      />

      {celebration === 'drive' ? (
        <SoftPanel>
          <Text style={text.subtitle}>First work drive saved</Text>
          <Text style={[text.body, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            {watchingOn
              ? 'You’re protected — watching is on.'
              : 'Your first work drive is safely recorded.'}
          </Text>
          <TertiaryButton label="Got it" onPress={markCelebratedFirstDrive} />
        </SoftPanel>
      ) : null}
      {celebration === 'recovery' ? (
        <SoftPanel>
          <Text style={text.subtitle}>First recovery</Text>
          <Text style={[text.body, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            We found mileage worth keeping.
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

      {showWeekSummary ? (
        <>
          <Text style={[text.subtitle, { marginBottom: spacing.xs, marginTop: spacing.sm }]}>
            This week
          </Text>
          <SummaryCard
            items={[
              { label: 'Miles kept', value: scenario.weekSummary.milesProtected.toFixed(1) },
              { label: 'Miles found', value: scenario.weekSummary.recoveredMiles.toFixed(1) },
              { label: 'Ready to share', value: scenario.weekSummary.milesReadyForProof.toFixed(1) },
            ]}
          />
        </>
      ) : null}

      <Text style={[text.subtitle, { marginBottom: spacing.xs, marginTop: spacing.sm }]}>Recent</Text>
      {scenario.activity.length === 0 ? (
        <StatusCard
          variant="neutral"
          title="No work drives yet"
          body="We’ll be here when your next trip starts."
          emphasis="subtle"
        />
      ) : (
        scenario.activity.map((event) => (
          <View key={event.id} style={{ marginBottom: spacing.sm }}>
            <TimelineRow
              title={event.title}
              subtitle={event.subtitle}
              timeLabel={activityTimeLabel(event.timestamp)}
              onPress={
                liveMode
                  ? () => navigation.navigate('TripDetails', { tripId: event.id })
                  : undefined
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
        <PrimaryButton
          label="Add a drive"
          onPress={() => navigation.navigate('ManualTrip')}
          accessibilityLabel="Add a drive from home"
        />
      </View>
    </TabScreen>
  );
}
