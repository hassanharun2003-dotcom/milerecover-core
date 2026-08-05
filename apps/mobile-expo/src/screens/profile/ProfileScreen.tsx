import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatActiveRateLabel } from '@milerecover/domain';
import { ConfirmDialog, ListRow, ListSection, TabScreen } from '../../design-system';
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
  const { resetLocalData, restartOnboarding, permissions, automaticCaptureAvailable, state } = useApp();
  const { product, resetProductData } = useProduct();
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);
  const [resetting, setResetting] = useState(false);
  const displayName = product.preferredName?.trim() || 'Not set';
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
  const rateAndUnits = `${rateLabel} · ${unitLabel} · ${product.localeProfile.currencyCode}`;
  const automaticAllowance =
    allowance.limit == null
      ? `${allowance.used} · Unlimited auto`
      : `${allowance.used} of ${allowance.limit} auto/mo`;
  const internalPreviewTools = product.showDevTools && allowInternalPreviewTools();
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
      <ListSection title="Identity">
        <ListRow label="Name" value={displayName} showChevron={false} />
        <ListRow label="Purpose" value={primaryGoal} showChevron={false} />
        <ListRow label="Country" value={product.localeProfile.countryDisplayName} showChevron={false} />
      </ListSection>

      <ListSection title="Account">
        <ListRow
          label="Profile/preferences"
          value={drivingType}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow label="Purpose" value={primaryGoal} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow
          label="Familiar places"
          value={product.workLocations.length > 0 ? String(product.workLocations.length) : 'Add anytime'}
          onPress={() => navigation.navigate('WorkLocationSetup')}
        />
      </ListSection>

      <ListSection title="Driving">
        <ListRow
          label="Vehicles"
          value={product.vehicles.length > 0 ? String(product.vehicles.length) : 'Add a vehicle'}
          onPress={() => navigation.navigate('VehicleSetup')}
        />
        <ListRow label="Rate and units" value={rateAndUnits} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow
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
          label="Tracking"
          value={product.trackingEnabled ? automaticAllowance : 'Manual'}
          onPress={() => navigation.navigate('TrackingActive')}
        />
      </ListSection>

      <ListSection title="Data">
        <ListRow label="Import mileage" onPress={() => navigation.navigate('BringExistingMileage')} />
        <ListRow label="Privacy" onPress={() => navigation.navigate('Privacy')} />
      </ListSection>

      <ListSection title="Plan">
        <ListRow
          label="Current plan"
          value={currentPlanValue}
          onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        />
        <ListRow
          label="Restore purchases"
          onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        />
      </ListSection>

      <ListSection title="Support">
        <ListRow label="Help" onPress={() => navigation.navigate('HelpSupport')} />
        <ListRow label="About" onPress={() => navigation.navigate('About')} />
        <ListRow
          label="Review setup"
          value="Trips stay saved"
          onPress={() => navigation.navigate('EditSetup')}
        />
      </ListSection>

      {internalPreviewTools ? (
        <ListSection title="Preview">
          <ListRow
            label="Reset app for testing"
            value="Clears setup + local data"
            onPress={() => setConfirmResetVisible(true)}
            busy={resetting}
          />
        </ListSection>
      ) : null}
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
