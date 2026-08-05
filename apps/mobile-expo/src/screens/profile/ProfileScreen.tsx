import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatActiveRateLabel } from '@milerecover/domain';
import { spacing } from '@milerecover/config';
import { ConfirmDialog, ListRow, ListSection, TabScreen, text, useAppTheme } from '../../design-system';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { useProduct } from '../../product/ProductContext';
import {
  selectAllowance,
  selectEntitlementPlanLabel,
  selectPendingReviewCount,
  selectProtectionView,
} from '../../product/presentation';
import { allowInternalPreviewTools, DRIVING_PATTERN_OPTIONS, PRIMARY_GOAL_OPTIONS } from '../../product/types';
import { useApp } from '../../store/AppContext';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { palette } = useAppTheme();
  const { resetLocalData, restartOnboarding, permissions, automaticCaptureAvailable, state } = useApp();
  const { product, resetProductData, resetOnboarding } = useProduct();
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);
  const [confirmResetOnboardingVisible, setConfirmResetOnboardingVisible] = useState(false);
  const [resetting, setResetting] = useState(false);
  const displayName = product.preferredName?.trim() || 'Your profile';
  const drivingType = DRIVING_PATTERN_OPTIONS.find((option) => option.id === product.drivingType)?.label ?? 'Not set';
  const primaryGoal = PRIMARY_GOAL_OPTIONS.find((option) => option.id === product.primaryGoal)?.label ?? 'Not set';
  const pendingReviewCount = selectPendingReviewCount(
    state,
    product,
    permissions,
    automaticCaptureAvailable,
  );
  const protection = selectProtectionView({
    app: state,
    product,
    permissions,
    automaticCaptureAvailable,
    pendingReviewCount,
  });
  const allowance = selectAllowance(state, product);
  const rateLabel = formatActiveRateLabel(product.localeProfile);
  const planLabel = selectEntitlementPlanLabel(product.entitlement);
  const trialDaysLeft =
    product.entitlement.status === 'trialActive' && product.entitlement.trialEndsAt
      ? Math.max(0, Math.ceil((product.entitlement.trialEndsAt - Date.now()) / 86400000))
      : null;
  const currentPlanValue =
    trialDaysLeft != null
      ? `${planLabel} · ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left`
      : planLabel;
  const unitLabel = product.localeProfile.distanceUnit === 'km' ? 'Kilometers' : 'Miles';
  const rateAndUnits = `${rateLabel} · ${unitLabel}`;
  const automaticAllowance =
    allowance.limit == null
      ? `${allowance.used} · Unlimited auto`
      : `${allowance.used} of ${allowance.limit} auto/mo`;
  const internalPreviewTools = product.showDevTools && allowInternalPreviewTools();
  const initial = (product.preferredName?.trim()?.[0] || 'M').toUpperCase();

  const resetExperience = async () => {
    if (resetting) return;
    setResetting(true);
    setConfirmResetVisible(false);
    try {
      await resetProductData();
      await resetLocalData();
      restartOnboarding();
    } finally {
      setResetting(false);
    }
  };

  return (
    <TabScreen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginBottom: spacing.lg,
        }}
        accessibilityRole="header"
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: palette.background.mist,
            borderWidth: 1,
            borderColor: palette.forest[500],
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel={`Avatar ${initial}`}
        >
          <Text style={[text.title, { color: palette.forest[700] }]}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={text.title}>{displayName}</Text>
          <Text style={[text.body, { marginTop: spacing.xs }]}>
            {primaryGoal} · {product.localeProfile.countryDisplayName}
          </Text>
        </View>
      </View>

      <ListSection title="Account">
        <ListRow
          icon="Pr"
          label="Profile and preferences"
          value={drivingType}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow
          icon="Pl"
          label="Familiar places"
          value={product.workLocations.length > 0 ? String(product.workLocations.length) : 'Add anytime'}
          onPress={() => navigation.navigate('WorkLocationSetup')}
        />
      </ListSection>

      <ListSection title="Driving">
        <ListRow
          icon="Ve"
          label="Vehicles"
          value={product.vehicles.length > 0 ? String(product.vehicles.length) : 'Add a vehicle'}
          onPress={() => navigation.navigate('VehicleSetup')}
        />
        <ListRow
          icon="Ra"
          label="Rate and units"
          value={rateAndUnits}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow
          icon="Po"
          label="Protection Center"
          value={protection.title}
          onPress={() => {
            if (protection.primaryAction.action === 'see_plans') {
              navigation.navigate('PlanSelection', { source: 'upgrade' });
            } else {
              navigation.navigate('ProtectionAlert');
            }
          }}
        />
        <ListRow
          icon="Tr"
          label="Tracking health"
          value={product.trackingEnabled ? automaticAllowance : 'Manual'}
          onPress={() => navigation.navigate('TrackingActive')}
        />
      </ListSection>

      <ListSection title="Data">
        <ListRow
          icon="Im"
          label="Import mileage"
          onPress={() => navigation.navigate('BringExistingMileage')}
        />
        <ListRow icon="Pv" label="Privacy" onPress={() => navigation.navigate('Privacy')} />
      </ListSection>

      <ListSection title="Plan">
        <ListRow
          icon="Pl"
          label="Plan and billing"
          value={currentPlanValue}
          onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        />
        <ListRow
          icon="Rs"
          label="Restore purchases"
          onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        />
      </ListSection>

      <ListSection title="Support">
        <ListRow icon="He" label="Help and support" onPress={() => navigation.navigate('HelpSupport')} />
        <ListRow icon="Ab" label="About MileRecover" onPress={() => navigation.navigate('About')} />
        <ListRow
          icon="Ed"
          label="Review setup"
          value="Trips stay saved"
          onPress={() => navigation.navigate('EditSetup')}
        />
      </ListSection>

      {internalPreviewTools ? (
        <ListSection title="Preview">
          <ListRow
            icon="On"
            label="Reset onboarding"
            value="Keeps trips · restarts setup"
            onPress={() => setConfirmResetOnboardingVisible(true)}
          />
          <ListRow
            icon="Re"
            label="Reset app for testing"
            value="Clears setup + local data"
            onPress={() => setConfirmResetVisible(true)}
            busy={resetting}
          />
        </ListSection>
      ) : null}
      <ConfirmDialog
        visible={confirmResetOnboardingVisible}
        title="Reset onboarding?"
        body="Returns you to Welcome and clears setup answers. Saved trips stay on this device."
        confirmLabel="Reset onboarding"
        cancelLabel="Keep setup"
        onConfirm={() => {
          setConfirmResetOnboardingVisible(false);
          resetOnboarding({ keepVehicles: true });
          restartOnboarding();
        }}
        onCancel={() => setConfirmResetOnboardingVisible(false)}
      />
      <ConfirmDialog
        visible={confirmResetVisible}
        title="Reset app for testing?"
        body="This clears setup, trips, imports, and local testing data on this device. Use only for preview testing."
        confirmLabel="Reset app"
        cancelLabel="Keep data"
        onConfirm={() => void resetExperience()}
        onCancel={() => setConfirmResetVisible(false)}
      />
    </TabScreen>
  );
}
