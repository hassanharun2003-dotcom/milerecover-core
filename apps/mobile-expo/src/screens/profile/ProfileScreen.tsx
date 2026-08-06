import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatActiveRateLabel } from '@milerecover/domain';
import { layout, spacing, typography } from '@milerecover/config';
import {
  APP_VERSION,
} from '../../constants/buildInfo';
import { ConfirmDialog, MRCard, TabScreen, useAppTheme } from '../../design-system';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { useProduct } from '../../product/ProductContext';
import {
  selectPendingReviewCount,
  selectProtectionView,
} from '../../product/presentation';
import { allowInternalPreviewTools, PRIMARY_GOAL_OPTIONS } from '../../product/types';
import { useApp } from '../../store/AppContext';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();
  return (
    <MRCard
      onPress={onPress}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        marginBottom: spacing.sm,
        paddingVertical: spacing.smMd,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: palette.background.mist,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.smMd,
        }}
      >
        <Ionicons name={icon} size={18} color={palette.forest[700]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.text.primary, fontWeight: '600', fontSize: typography.size.bodyLarge }}>
          {label}
        </Text>
        {value ? (
          <Text style={{ color: palette.text.secondary, fontSize: typography.size.caption, marginTop: 2 }}>
            {value}
          </Text>
        ) : null}
      </View>
      <Text style={{ color: palette.text.secondary, fontSize: 22 }}>›</Text>
    </MRCard>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { palette } = useAppTheme();
  const { resetLocalData, restartOnboarding, permissions, automaticCaptureAvailable, state } = useApp();
  const { product, resetProductData, resetOnboarding } = useProduct();
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);
  const [confirmResetOnboardingVisible, setConfirmResetOnboardingVisible] = useState(false);
  const [resetting, setResetting] = useState(false);
  const displayName = product.preferredName?.trim() || 'Your profile';
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
  const rateLabel = formatActiveRateLabel(product.localeProfile);
  const internalPreviewTools = product.showDevTools && allowInternalPreviewTools();
  const initial = (product.preferredName?.trim()?.[0] || 'M').toUpperCase();
  const workSubtitle =
    primaryGoal === 'Employee reimbursement'
      ? `Employee · ${product.localeProfile.countryDisplayName}`
      : `${primaryGoal} · ${product.localeProfile.countryDisplayName}`;
  const trackingLabel =
    protection.state === 'PROTECTED'
      ? 'All systems normal'
      : protection.state === 'OFF' || protection.state === 'MANUAL_ONLY'
        ? 'Paused'
        : protection.title;

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
          marginBottom: layout.section,
        }}
        accessibilityRole="header"
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: palette.forest[900],
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}
          accessibilityLabel={`Avatar ${initial}`}
        >
          <Text style={{ color: palette.text.inverse, fontSize: 28, fontWeight: '700' }}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: palette.text.primary,
              fontSize: typography.size.headline,
              fontWeight: '700',
            }}
          >
            {displayName}
          </Text>
          <Text style={{ color: palette.text.secondary, marginTop: spacing.xs, fontSize: typography.size.body }}>
            {workSubtitle}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('EditSetup')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="settings-outline" size={22} color={palette.text.primary} />
        </Pressable>
      </View>

      <SettingsRow
        icon="car-outline"
        label="Vehicles"
        value={
          product.vehicles.length === 0
            ? 'Add a vehicle'
            : `${product.vehicles.length} vehicle${product.vehicles.length === 1 ? '' : 's'}`
        }
        onPress={() => navigation.navigate('VehicleSetup')}
      />
      <SettingsRow
        icon="cash-outline"
        label="Mileage rate"
        value={rateLabel}
        onPress={() => navigation.navigate('EditSetup')}
      />
      <SettingsRow
        icon="briefcase-outline"
        label="Work information"
        value={primaryGoal}
        onPress={() => navigation.navigate('EditSetup')}
      />
      <SettingsRow
        icon="shield-checkmark-outline"
        label="Tracking health"
        value={trackingLabel}
        onPress={() => {
          if (protection.primaryAction.action === 'see_plans') {
            navigation.navigate('PlanSelection', { source: 'upgrade' });
          } else {
            navigation.navigate('ProtectionAlert');
          }
        }}
      />
      <SettingsRow
        icon="download-outline"
        label="Import mileage"
        onPress={() => navigation.navigate('BringExistingMileage')}
      />
      <SettingsRow
        icon="share-outline"
        label="Export history"
        onPress={() => navigation.navigate('ExportReport')}
      />
      <SettingsRow
        icon="help-circle-outline"
        label="Help & support"
        onPress={() => navigation.navigate('HelpSupport')}
      />
      <SettingsRow
        icon="information-circle-outline"
        label="About MileRecover"
        value={`Version ${APP_VERSION}`}
        onPress={() => navigation.navigate('About')}
      />

      {internalPreviewTools ? (
        <>
          <Text
            style={{
              marginTop: spacing.md,
              marginBottom: spacing.sm,
              color: palette.text.secondary,
              fontWeight: '700',
              fontSize: typography.size.caption,
            }}
          >
            Preview
          </Text>
          <SettingsRow
            icon="refresh-outline"
            label="Reset onboarding"
            value="Keeps trips · restarts setup"
            onPress={() => setConfirmResetOnboardingVisible(true)}
          />
          <SettingsRow
            icon="trash-outline"
            label="Reset App To Brand New User"
            value={resetting ? 'Resetting…' : 'Clears onboarding, guest, cache'}
            onPress={() => setConfirmResetVisible(true)}
          />
        </>
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
        title="Reset App To Brand New User?"
        body="Clears onboarding, guest state, navigation restore, preview caches, and local trips on this device. Preview builds only."
        confirmLabel="Reset to brand new"
        cancelLabel="Keep data"
        onConfirm={() => void resetExperience()}
        onCancel={() => setConfirmResetVisible(false)}
      />
    </TabScreen>
  );
}
