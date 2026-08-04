import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import { capabilitiesForEntitlement } from '@milerecover/domain';
import {
  ListRow,
  ListSection,
  MembershipBanner,
  PrimaryButton,
  SecondaryButton,
  SoftPanel,
  TabScreen,
  text,
} from '../../design-system';
import { DEMO_SCENARIO_LIST } from '../../fixtures/scenarios';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { voiceForDrivingType } from '../../product/copy';
import { useProduct } from '../../product/ProductContext';
import { DRIVING_PATTERN_OPTIONS, PAIN_POINT_OPTIONS, PRIMARY_GOAL_OPTIONS } from '../../product/types';
import { useApp } from '../../store/AppContext';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function painSummary(ids: string[]): string {
  if (!ids.length) return 'Not set';
  const labels = ids
    .map((id) => PAIN_POINT_OPTIONS.find((option) => option.id === id)?.label)
    .filter(Boolean) as string[];
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]}; ${labels[1]}`;
  return `${labels[0]} · +${labels.length - 1} more`;
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { resetLocalData, restartOnboarding, permissions, automaticCaptureAvailable } = useApp();
  const {
    product,
    setDemoScenario,
    setDemoModeEnabled,
    resetProductData,
    resetOnboarding,
  } = useProduct();
  const displayName = product.preferredName?.trim() || 'Your profile';
  const drivingType = DRIVING_PATTERN_OPTIONS.find((option) => option.id === product.drivingType)?.label;
  const primaryGoal = PRIMARY_GOAL_OPTIONS.find((option) => option.id === product.primaryGoal)?.label;
  const voice = voiceForDrivingType(product.drivingType);
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const watchingFullyOn =
    product.trackingEnabled &&
    capabilities.canUseAutomaticCapture &&
    permissions.location === 'granted' &&
    permissions.backgroundLocation === 'granted';

  const coverageBody = watchingFullyOn
    ? 'Protected — watching is on.'
    : !capabilities.canUseAutomaticCapture
      ? 'Automatic drive protection is available with Plus.'
      : product.trackingEnabled || permissions.location === 'granted'
        ? 'One more step can finish watching setup.'
        : automaticCaptureAvailable
          ? 'Turn on watching when you want automatic coverage.'
          : 'Automatic watching isn’t available on this device yet.';

  const coverageTitle = watchingFullyOn
    ? 'Protected'
    : !capabilities.canUseAutomaticCapture
      ? 'Manual logging is ready'
      : 'Manual logging is ready';

  const coverageAction = !capabilities.canUseAutomaticCapture
    ? { label: 'See Plus plans', route: 'PlanSelection' as const }
    : watchingFullyOn
      ? { label: 'Watching status', route: 'TrackingActive' as const }
      : { label: 'Finish coverage setup', route: 'ProtectionAlert' as const };

  return (
    <TabScreen>
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={text.title} accessibilityRole="header">
          {displayName}
        </Text>
        <Text style={text.body}>
          {product.preferredName ? 'Saved on this device' : 'Add a preferred name anytime.'}
        </Text>
      </View>

      <MembershipBanner
        planName={
          product.entitlement.planId === 'free'
            ? 'You’re on Free'
            : `MileRecover ${product.entitlement.planId.toUpperCase()}`
        }
        detail={
          product.entitlement.status === 'trialActive'
            ? 'Plus trial is active.'
            : product.entitlement.planId === 'free'
              ? 'Upgrade anytime when watching or PDF reports would help.'
              : 'Purchases confirm in the App Store or Google Play.'
        }
      />
      <SecondaryButton
        label="Manage plan"
        onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
      />

      <ListSection title="Profile">
        <ListRow
          label="Preferred name"
          value={product.preferredName?.trim() || 'Not set'}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow
          label="Primary goal"
          value={primaryGoal ?? 'Not set'}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow
          label="What gets in the way"
          value={painSummary(product.selectedPainPoints)}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow
          label="Driving pattern"
          value={drivingType ?? 'Not set'}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow label="Report style" value={voice.reportNoun} showChevron={false} />
      </ListSection>

      <ListSection title="Driving">
        <ListRow
          label="Vehicles"
          value={product.vehicles.length > 0 ? String(product.vehicles.length) : 'Add anytime'}
          onPress={() => navigation.navigate('VehicleSetup')}
        />
        <ListRow
          label="Familiar places"
          value={product.workLocations.length > 0 ? String(product.workLocations.length) : 'Add anytime'}
          onPress={() => navigation.navigate('WorkLocationSetup')}
        />
      </ListSection>

      <SoftPanel>
        <Text style={[text.caption, { marginBottom: spacing.xs }]}>COVERAGE</Text>
        <Text style={text.subtitle}>{coverageTitle}</Text>
        <Text style={[text.body, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>{coverageBody}</Text>
        <PrimaryButton
          label={coverageAction.label}
          onPress={() => {
            if (coverageAction.route === 'PlanSelection') {
              navigation.navigate('PlanSelection', { source: 'upgrade' });
            } else {
              navigation.navigate(coverageAction.route);
            }
          }}
        />
      </SoftPanel>

      <ListSection title="Records">
        <ListRow label="Import mileage" onPress={() => navigation.navigate('BringExistingMileage')} />
        <ListRow label="Export report" onPress={() => navigation.navigate('ExportReport')} />
      </ListSection>

      <ListSection title="Privacy">
        <ListRow
          label="Data and privacy"
          value="Local first"
          onPress={() => navigation.navigate('Privacy')}
        />
      </ListSection>

      <ListSection title="Help">
        <ListRow label="Help" onPress={() => navigation.navigate('HelpSupport')} />
        <ListRow label="About" onPress={() => navigation.navigate('About')} />
      </ListSection>

      {product.showDevTools ? (
        <ListSection title="Internal preview tools">
          <ListRow
            label="Restart onboarding only"
            onPress={() => {
              resetOnboarding();
              restartOnboarding();
            }}
          />
          <ListRow
            label="Demo mode"
            value={product.demoModeEnabled ? 'On' : 'Off'}
            onPress={() => setDemoModeEnabled(!product.demoModeEnabled)}
          />
          {product.demoModeEnabled
            ? DEMO_SCENARIO_LIST.map((scenario) => (
                <ListRow
                  key={scenario.id}
                  label={scenario.label}
                  value={product.demoScenario === scenario.id ? 'Active' : undefined}
                  onPress={() => setDemoScenario(scenario.id)}
                />
              ))
            : null}
          <ListRow
            label="Simulate first launch"
            value="Clears setup + local data"
            onPress={() => {
              void resetProductData();
              resetLocalData();
              restartOnboarding();
            }}
          />
          <ListRow
            label="Clear all local test data"
            onPress={() => {
              void resetProductData();
              resetLocalData();
              restartOnboarding();
            }}
          />
        </ListSection>
      ) : null}
    </TabScreen>
  );
}
