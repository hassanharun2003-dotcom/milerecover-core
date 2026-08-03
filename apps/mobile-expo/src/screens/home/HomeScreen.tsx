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
  text,
} from '../../design-system';
import type { ActivityEventKind } from '../../fixtures/scenarios';
import { greetingForName } from '../../product/copy';
import { selectProductExperience } from '../../product/selectors';
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

function coverageSummary(
  productState: string,
  location: string,
  background: string,
  watchingOn: boolean,
): { title: string; body: string } {
  if (watchingOn && location === 'granted' && background === 'granted') {
    return { title: 'Protected', body: 'We’re quietly watching.' };
  }
  if (watchingOn || location === 'granted') {
    return { title: 'Partially protected', body: 'One quick step can finish setup.' };
  }
  if (productState === 'not_started' || productState === 'educated') {
    return { title: 'Not yet', body: 'Add a drive anytime — or turn on watching when you’re ready.' };
  }
  return { title: 'Ready', body: 'Your saved miles stay on this device.' };
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { state, permissions, automaticCaptureAvailable, refreshRecoverySuggestions } = useApp();
  const { product, consumePendingPostOnboardingRoute, markFirstConfirmedWorkDrive } = useProduct();
  const recoveryRefreshed = useRef(false);
  const experience = selectProductExperience(state, product, permissions, automaticCaptureAvailable);
  const { scenario, secondaryAction, liveMode } = experience;
  const greeting = greetingForName(product.preferredName);
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const coverage = coverageSummary(
    product.protectionSetupState,
    permissions.location,
    permissions.backgroundLocation,
    product.trackingEnabled && capabilities.canUseAutomaticCapture,
  );

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
    // Intentionally once on mount / when pending is set
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
    if (liveMode && experience.confirmedTrips.length > 0 && product.firstConfirmedWorkDriveAt == null) {
      markFirstConfirmedWorkDrive();
    }
  }, [experience.confirmedTrips.length, liveMode, markFirstConfirmedWorkDrive, product.firstConfirmedWorkDriveAt]);

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

  const handleSecondary = () => {
    if (!secondaryAction) return;
    if (secondaryAction.route === 'Review') navigation.navigate('Review');
    else if (secondaryAction.route === 'ProtectionAlert' && !capabilities.canUseAutomaticCapture) {
      navigation.navigate('PlanSelection', { source: 'upgrade' });
    }
    else navigation.navigate(secondaryAction.route);
  };

  const showWeekSummary =
    !liveMode ||
    scenario.weekSummary.milesProtected > 0 ||
    scenario.weekSummary.recoveredMiles > 0 ||
    scenario.weekSummary.milesReadyForProof > 0;

  const secondaryConflictsWithPrimary =
    Boolean(scenario.primaryAction) &&
    secondaryAction != null &&
    (secondaryAction.route === scenario.primaryActionRoute ||
      (scenario.primaryActionRoute === 'ProtectionAlert' && secondaryAction.route === 'ProtectionAlert') ||
      (scenario.primaryActionRoute === 'ManualTrip' && secondaryAction.route === 'ManualTrip'));

  const showSecondary = secondaryAction != null && !secondaryConflictsWithPrimary;
  const showTrial =
    liveMode &&
    experience.confirmedTrips.length > 0 &&
    scenario.homeState !== 'protection_limited' &&
    scenario.primaryActionRoute !== 'Review';

  return (
    <TabScreen>
      {greeting ? (
        <Text style={[text.body, { marginBottom: spacing.sm }]} accessibilityRole="text">
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

      {showTrial ? (
        <TrialOfferCard onStartTrial={() => navigation.navigate('PlanSelection', { source: 'upgrade' })} />
      ) : null}

      {scenario.homeState === 'protection_limited' || !scenario.primaryAction ? (
        <SoftPanel>
          <Text style={[text.caption, { marginBottom: spacing.xs }]}>COVERAGE</Text>
          <Text style={text.subtitle}>{coverage.title}</Text>
          <Text style={[text.body, { marginTop: spacing.xs }]}>{coverage.body}</Text>
        </SoftPanel>
      ) : null}

      {showWeekSummary ? (
        <>
          <Text style={[text.subtitle, { marginBottom: spacing.sm, marginTop: spacing.sm }]}>
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

      <Text style={[text.subtitle, { marginBottom: spacing.sm, marginTop: spacing.sm }]}>Recent</Text>
      {scenario.activity.length === 0 ? (
        <StatusCard
          variant="neutral"
          title="Nothing recorded yet"
          body="Your first real drive will show up here. We’re never inventing miles."
          emphasis="subtle"
        />
      ) : (
        scenario.activity.map((event) => (
          <View key={event.id} style={{ marginBottom: spacing.sm }}>
            <TimelineRow
              title={event.title}
              subtitle={event.subtitle}
              timeLabel={activityTimeLabel(event.timestamp)}
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

      {showSecondary ? (
        <View style={{ marginTop: spacing.md }}>
          {scenario.primaryAction ? (
            <SecondaryButton label={secondaryAction!.label} onPress={handleSecondary} />
          ) : (
            <PrimaryButton label={secondaryAction!.label} onPress={handleSecondary} />
          )}
        </View>
      ) : null}

      {liveMode && scenario.activity.length === 0 && !scenario.primaryAction && !showSecondary ? (
        <View style={{ marginTop: spacing.md }}>
          <PrimaryButton
            label="Add a drive"
            onPress={() => navigation.navigate('ManualTrip')}
            accessibilityLabel="Add a drive from home"
          />
        </View>
      ) : null}
    </TabScreen>
  );
}
