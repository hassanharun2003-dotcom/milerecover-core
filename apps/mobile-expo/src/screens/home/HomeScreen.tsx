import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { layout, spacing, typography } from '@milerecover/config';
import {
  capabilitiesForEntitlement,
  rateForTimestamp,
  type ProtectionStatusView,
} from '@milerecover/domain';
import {
  MRCard,
  MRHeader,
  MRHeroCard,
  MRMetricTile,
  MRPrimaryButton,
  MRSecondaryButton,
  MRStatusPanel,
  SkeletonBlock,
  SoftPanel,
  TabScreen,
  text,
  useAppTheme,
} from '../../design-system';
import { greetingForName } from '../../product/copy';
import { selectHomePeriodSummary, selectPendingReviewCount, selectProtectionView } from '../../product/presentation';
import { selectProductExperience } from '../../product/selectors';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { TrialOfferCard } from '../../components/TrialOfferCard';
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

function HomeSkeleton() {
  return (
    <TabScreen>
      <SkeletonBlock width="58%" height={24} style={{ marginBottom: spacing.md }} />
      <SoftPanel>
        <SkeletonBlock width="36%" height={20} style={{ marginBottom: spacing.sm }} />
        <SkeletonBlock width="92%" height={16} />
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
  const yearSummary = selectHomePeriodSummary({
    trips: experience.confirmedTrips,
    locale,
    preferredName: product.preferredName,
    primaryGoal: product.primaryGoal,
    periodKind: 'ytd',
  });
  const monthSummary = selectHomePeriodSummary({
    trips: experience.confirmedTrips,
    locale,
    preferredName: product.preferredName,
    primaryGoal: product.primaryGoal,
    periodKind: 'this_month',
  });

  const nextBest = useMemo<NextBestAction>(() => {
    if (protectionNeedsAction) {
      return {
        label: compact.actionLabel || 'Fix protection',
        run: () => {
          if (compact.action === 'plans') navigation.navigate('PlanSelection', { source: 'upgrade' });
          else navigation.navigate('ProtectionAlert');
        },
      };
    }
    if (pendingReviewCount > 0) {
      return {
        label:
          pendingReviewCount === 1
            ? 'Review 1 drive'
            : `Review ${pendingReviewCount} drives`,
        run: () => navigation.navigate('Review'),
      };
    }
    if (locale.activeRateNeedsReview || !rateUsable) {
      return {
        label: 'Complete report details',
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
        run: () => navigation.navigate('MissingDrivesIntro'),
      };
    }
    if (scenario.proofReady && confirmedCount > 0) {
      return {
        label: 'Preview your report',
        run: () => navigation.navigate('Proof'),
      };
    }
    if (confirmedCount === 0) {
      return {
        label: 'Add your first drive',
        run: () => navigation.navigate('ManualTrip'),
      };
    }
    return {
      label: 'You’re all caught up',
      run: null,
    };
  }, [
    compact.action,
    compact.actionLabel,
    confirmedCount,
    experience.activeReviewItems,
    locale.activeRateNeedsReview,
    navigation,
    pendingReviewCount,
    product.importPhase,
    protectionNeedsAction,
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

  if (!homeReady) return <HomeSkeleton />;

  const hasTrustworthyYearValue =
    yearSummary.estimatedValueCents != null && yearSummary.tripCount > 0;
  const heroSupporting = hasTrustworthyYearValue
    ? compact.sentence
    : confirmedCount === 0
      ? 'Start tracking to see the value of your work miles.'
      : yearSummary.estimatedValueLabel === 'Review rate'
        ? 'Add or confirm a mileage rate to estimate value.'
        : compact.sentence;
  const bannerTone: 'ok' | 'attention' | 'info' = protectionNeedsAction
    ? 'attention'
    : compact.kind === 'protected' || compact.kind === 'configured_waiting'
      ? 'ok'
      : 'info';
  const bannerMessage = protectionNeedsAction
    ? compact.sentence
    : compact.kind === 'protected'
      ? 'All systems normal — Tracking'
      : compact.kind === 'configured_waiting'
        ? 'All systems ready — waiting for your first verified drive.'
      : compact.kind === 'manual_mode'
        ? 'Manual tracking selected. Automatic protection is off.'
        : compact.sentence;

  return (
    <TabScreen>
      <MRHeader
        title="MileRecover"
        left={
          <Pressable
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            hitSlop={8}
          >
            <Text style={{ fontSize: 20, color: palette.text.primary, fontWeight: '700', letterSpacing: -1 }}>
              ≡
            </Text>
          </Pressable>
        }
        right={
          <Pressable
            onPress={() => navigation.navigate('HelpSupport')}
            accessibilityRole="button"
            accessibilityLabel="Notifications and help"
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            hitSlop={8}
          >
            <Text style={{ fontSize: 16, color: palette.text.primary, fontWeight: '700' }}>◉</Text>
          </Pressable>
        }
      />

      <Text
        style={{
          fontSize: typography.size.title,
          lineHeight: typography.lineHeight.title,
          fontWeight: '700',
          color: palette.text.primary,
          marginBottom: layout.section,
        }}
        accessibilityRole="text"
      >
        {greeting ?? 'Welcome back'}
      </Text>

      <MRHeroCard
        onPress={openProtection}
        accessibilityLabel={
          hasTrustworthyYearValue
            ? `You've protected ${yearSummary.estimatedValueLabel} this year.`
            : heroSupporting
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.sm }}>
            <Text style={{ color: palette.forest[100], fontSize: typography.size.caption, fontWeight: '500' }}>
              You've protected
            </Text>
            {hasTrustworthyYearValue ? (
              <>
                <Text
                  style={{
                    color: palette.text.inverse,
                    fontSize: typography.size.display,
                    lineHeight: typography.lineHeight.display,
                    fontWeight: '700',
                    marginTop: spacing.xs,
                  }}
                >
                  {yearSummary.estimatedValueLabel}
                </Text>
                <Text
                  style={{
                    color: palette.forest[100],
                    fontSize: typography.size.bodyLarge,
                    marginTop: spacing.xs,
                  }}
                >
                  this year.
                </Text>
              </>
            ) : (
              <Text
                style={{
                  color: palette.text.inverse,
                  fontSize: typography.size.title,
                  lineHeight: typography.lineHeight.title,
                  fontWeight: '700',
                  marginTop: spacing.sm,
                }}
              >
                {heroSupporting}
              </Text>
            )}
          </View>
          <View
            style={{
              width: layout.iconCircle + 8,
              height: layout.iconCircle + 8,
              borderRadius: (layout.iconCircle + 8) / 2,
              backgroundColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityElementsHidden
          >
            <Text style={{ color: palette.text.inverse, fontSize: 20, fontWeight: '700' }}>✓</Text>
          </View>
        </View>
      </MRHeroCard>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: layout.section,
        }}
      >
        <MRMetricTile
          label={locale.distanceUnit === 'km' ? 'Work km' : 'Work miles'}
          value={monthSummary.workDistanceLabel}
        />
        <MRMetricTile label="Work drives" value={String(monthSummary.tripCount)} />
        <MRMetricTile label="This month" value={monthSummary.estimatedValueLabel} />
      </View>

      <MRStatusPanel
        tone={bannerTone}
        message={bannerMessage}
        onPress={protectionNeedsAction || showProtectionAction ? openProtection : undefined}
      />

      <Text style={[text.subtitle, { marginBottom: spacing.sm }]}>Next up</Text>
      <MRCard
        onPress={nextBest.run ?? undefined}
        accessibilityLabel={nextBest.label}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 52,
          paddingVertical: spacing.smMd,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: typography.size.bodyLarge,
            fontWeight: '600',
            color: palette.text.primary,
          }}
        >
          {nextBest.label}
        </Text>
        {nextBest.run ? (
          <Text style={{ color: palette.text.secondary, fontSize: 22, marginLeft: spacing.sm }}>›</Text>
        ) : null}
      </MRCard>

      <View style={{ marginTop: spacing.sm, gap: spacing.sm, marginBottom: spacing.md }}>
        <MRPrimaryButton
          label="+ Add a drive"
          onPress={() => navigation.navigate('ManualTrip')}
          accessibilityLabel="Add a drive from home"
        />
        <MRSecondaryButton
          label="Check for missed drives"
          onPress={() => navigation.navigate('MissingDrivesIntro')}
          accessibilityLabel="Check for missed drives"
        />
      </View>

      <TrialOfferCard
        confirmedWorkDriveCount={confirmedCount}
        onStartTrial={() => navigation.navigate('PlanSelection', { source: 'upgrade' })}
      />
    </TabScreen>
  );
}
