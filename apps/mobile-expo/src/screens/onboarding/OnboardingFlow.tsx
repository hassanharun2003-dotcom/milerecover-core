import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { layout, spacing, typography } from '@milerecover/config';
import {
  formatActiveRateLabel,
  localeProfileFromCountry,
  recommendCountryFromLocale,
  type CountryCode,
  type CurrencyCode,
  type DistanceUnit,
  type NextActionId,
} from '@milerecover/domain';
import {
  COUNTRY_OPTIONS,
  ONBOARDING_STEP_ORDER,
  PRIMARY_GOAL_OPTIONS,
  type PostOnboardingRoute,
  type ProductOnboardingStep,
} from '../../product/types';
import {
  BottomSheet,
  ChecklistRow,
  MRCard,
  MRFormField,
  MRIconCircle,
  MRPrimaryButton,
  MRProgressBar,
  MRSecondaryButton,
  MRSegmentedControl,
  MRStatusPanel,
  MRTertiaryButton,
  MRWelcomeDots,
  MRWelcomeLogo,
  OnboardingScreen,
  SelectionCard,
  text,
  useAppTheme,
} from '../../design-system';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';
import {
  AUTH_UNAVAILABLE_MESSAGE,
  getAuthPort,
  type AuthProviderId,
} from '../../services/auth';

const WELCOME_BENEFITS = [
  { glyph: '✓', label: 'Recover forgotten miles' },
  { glyph: '✓', label: 'Tax & employer ready' },
  { glyph: '✓', label: 'Automatic tracking' },
] as const;

function inOrder(step: ProductOnboardingStep): boolean {
  return ONBOARDING_STEP_ORDER.includes(step);
}

function remapStep(step: ProductOnboardingStep): ProductOnboardingStep {
  if (inOrder(step)) return step;
  if (step === 'your_work' || step === 'primary_goal' || step === 'pain_points') {
    return 'purpose';
  }
  if (step === 'country' || step === 'preferred_name') return 'locale_setup';
  if (step === 'permissions_education' || step === 'protection_education') return 'protect_drives';
  if (
    step === 'vehicle_setup' ||
    step === 'driving_pattern' ||
    step === 'familiar_places' ||
    step === 'personalize'
  ) {
    return 'protect_drives';
  }
  return 'welcome';
}

function formatDisplayRate(centsPerUnit: number, unit: DistanceUnit): string {
  if (!(centsPerUnit > 0)) return 'Not set';
  const dollars = (centsPerUnit / 100).toFixed(2);
  return unit === 'km' ? `$${dollars} per km` : `$${dollars} per mile`;
}

export function OnboardingFlow() {
  const { palette } = useAppTheme();
  const { finishOnboarding, requestLocationPermission, requestBackgroundPermission, permissions } =
    useApp();
  const {
    product,
    advanceOnboarding,
    backOnboarding,
    setOnboardingStep,
    setPrimaryGoal,
    setPreferredName,
    setLocaleProfile,
    setProtectionSetupState,
    setTrackingEnabled,
    patchOnboarding,
    completeProductOnboarding,
    flushProductPersistence,
    setPendingPostOnboardingRoute,
  } = useProduct();

  const authPort = getAuthPort();
  const [finishing, setFinishing] = useState(false);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [rateEditing, setRateEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(product.preferredName ?? '');
  const recommendedCountry = recommendCountryFromLocale(
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().locale : undefined,
  );
  const [countryDraft, setCountryDraft] = useState<CountryCode>(
    product.localeProfile.countryCode || recommendedCountry,
  );
  const [unitDraft, setUnitDraft] = useState<DistanceUnit>(product.localeProfile.distanceUnit);
  const [otherCurrency, setOtherCurrency] = useState<CurrencyCode>(
    product.localeProfile.currencyCode === 'OTHER' ? 'OTHER' : product.localeProfile.currencyCode,
  );
  const [rateCents, setRateCents] = useState(
    String(product.localeProfile.rates[0]?.centsPerMile ?? ''),
  );

  const step = remapStep(product.onboardingStep);
  const stepIndex = Math.max(0, ONBOARDING_STEP_ORDER.indexOf(step));
  /** Collage progress is 1–5 excluding Welcome (Purpose shows “2 of 5”). */
  const progressSteps = ONBOARDING_STEP_ORDER.filter((s) => s !== 'welcome');
  const progressIndex = Math.max(
    0,
    progressSteps.findIndex((s) => s === step),
  );
  const protectionConfigured =
    product.trackingEnabled ||
    product.protectionSetupState === 'configured' ||
    product.protectionSetupState === 'healthy';

  useEffect(() => {
    if (product.onboardingStep !== step) setOnboardingStep(step);
  }, [product.onboardingStep, setOnboardingStep, step]);

  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.onboardingStarted, {});
  }, []);

  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.onboardingStepViewed, { step });
  }, [step]);

  const saveLocale = () => {
    const entered = Number.parseFloat(rateCents);
    const centsPerMile =
      Number.isFinite(entered) && entered > 0
        ? Math.round(unitDraft === 'km' ? entered * 1.609344 : entered)
        : undefined;
    const profile = localeProfileFromCountry(countryDraft, {
      distanceUnit: unitDraft,
      currencyCode: countryDraft === 'OTHER' ? otherCurrency : undefined,
      centsPerMile,
    });
    profile.distanceUnit = unitDraft;
    setLocaleProfile({ ...profile, activeRateNeedsReview: centsPerMile == null });
    patchOnboarding({ countryStepAcknowledged: true });
    logEvent(ANALYTICS_EVENTS.countrySelected, { country: countryDraft });
  };

  const acknowledgeAccountAndContinue = () => {
    patchOnboarding({ accountStepAcknowledged: true });
    advanceOnboarding();
  };

  const tryAuth = async (provider: AuthProviderId) => {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthNotice(null);
    try {
      if (!authPort.isProviderAvailable(provider)) {
        setAuthNotice(AUTH_UNAVAILABLE_MESSAGE);
        return;
      }
      const result = await authPort.signIn(provider);
      if (result.ok) {
        if (result.displayName) setPreferredName(result.displayName);
        setAuthNotice(result.email ? `Signed in as ${result.email}.` : 'Signed in.');
        acknowledgeAccountAndContinue();
        return;
      }
      if (result.reason === 'cancelled') {
        setAuthNotice(null);
        return;
      }
      setAuthNotice(result.message || AUTH_UNAVAILABLE_MESSAGE);
    } finally {
      setAuthBusy(false);
    }
  };

  const finish = (route: PostOnboardingRoute) => {
    if (finishing) return;
    setFinishing(true);
    const action: NextActionId =
      route === 'ManualTrip'
        ? 'add_first_drive'
        : route === 'BringExistingMileage'
          ? 'import_mileage'
          : protectionConfigured
            ? 'start_protection'
            : 'add_first_drive';
    void (async () => {
      try {
        await completeProductOnboarding(route);
        patchOnboarding({
          nextActionSelected: action,
          accountStepAcknowledged: true,
          countryStepAcknowledged: true,
          protectionEducationAcknowledged: true,
          permissionsEducationAcknowledged: true,
        });
        await flushProductPersistence();
      } catch {
        // In-memory completion still unlocks Home; disk flush is best-effort.
      } finally {
        logEvent(ANALYTICS_EVENTS.onboardingCompleted, { next: action });
        finishOnboarding();
      }
    })();
  };

  const displayRate = useMemo(() => {
    const entered = Number.parseFloat(rateCents);
    if (Number.isFinite(entered) && entered > 0) {
      return formatDisplayRate(Math.round(entered), unitDraft);
    }
    return formatActiveRateLabel({
      ...product.localeProfile,
      distanceUnit: unitDraft,
      activeRateNeedsReview: false,
    }).replace('¢/mi', '¢ per mile').replace('¢/km', '¢ per km');
  }, [product.localeProfile, rateCents, unitDraft]);

  const countryLabel =
    COUNTRY_OPTIONS.find((option) => option.id === countryDraft)?.label ?? countryDraft;

  const applyCountry = (id: CountryCode) => {
    setCountryDraft(id);
    setCountrySheetOpen(false);
    if (id !== 'OTHER') {
      const preset = localeProfileFromCountry(id);
      setUnitDraft(preset.distanceUnit);
      const cpm = preset.rates[0]?.centsPerMile ?? 0;
      setRateCents(String(preset.distanceUnit === 'km' ? Math.round(cpm / 1.609344) : cpm || ''));
    }
  };

  const showProgress = step !== 'welcome' && step !== 'ready';
  const showBack = stepIndex > 0 && step !== 'ready';

  return (
    <OnboardingScreen
      footer={
        step === 'welcome' ? (
          <View style={{ gap: spacing.sm }}>
            <MRWelcomeDots activeIndex={0} total={4} />
            <MRPrimaryButton
              label="Get started →"
              onPress={() => advanceOnboarding()}
              accessibilityLabel="Get started"
            />
          </View>
        ) : step === 'account' ? (
          <View style={{ gap: spacing.sm }}>
            <MRPrimaryButton
              label={authBusy ? 'Signing in…' : 'Continue with Google'}
              onPress={() => void tryAuth('google')}
              disabled={authBusy}
              loading={authBusy}
              accessibilityLabel="Continue with Google"
            />
            {Platform.OS === 'ios' ? (
              <MRSecondaryButton
                label="Continue with Apple"
                onPress={() => void tryAuth('apple')}
                disabled={authBusy}
                accessibilityLabel="Continue with Apple"
              />
            ) : null}
            <MRTertiaryButton
              label="Continue without an account"
              onPress={() => {
                setAuthNotice(null);
                acknowledgeAccountAndContinue();
              }}
              accessibilityLabel="Continue without an account"
            />
          </View>
        ) : step === 'purpose' ? (
          <MRPrimaryButton
            label="Continue →"
            onPress={() => {
              if (!product.primaryGoal) return;
              setPreferredName(nameDraft.trim() || null);
              advanceOnboarding();
            }}
            disabled={!product.primaryGoal}
            accessibilityLabel="Continue to region and rate"
          />
        ) : step === 'locale_setup' ? (
          <MRPrimaryButton
            label="Continue →"
            onPress={() => {
              saveLocale();
              advanceOnboarding();
            }}
            accessibilityLabel="Continue to drive protection"
          />
        ) : step === 'protect_drives' ? (
          <View style={{ gap: spacing.sm }}>
            <MRPrimaryButton
              label="Turn on drive protection"
              loading={permissionBusy}
              onPress={() => {
                if (permissionBusy) return;
                setPermissionBusy(true);
                logEvent(ANALYTICS_EVENTS.protectionSetupStarted, {});
                setProtectionSetupState('educated');
                patchOnboarding({ protectionEducationAcknowledged: true });
                void (async () => {
                  try {
                    const fg = await requestLocationPermission();
                    if (fg.location === 'granted') {
                      await requestBackgroundPermission();
                      setTrackingEnabled(true);
                      setProtectionSetupState('configured');
                      patchOnboarding({
                        protectionEducationAcknowledged: true,
                        permissionsEducationAcknowledged: true,
                      });
                    } else {
                      patchOnboarding({
                        protectionEducationAcknowledged: true,
                        permissionsEducationAcknowledged: true,
                      });
                    }
                  } finally {
                    setPermissionBusy(false);
                    advanceOnboarding();
                  }
                })();
              }}
              accessibilityLabel="Turn on drive protection"
            />
            <MRTertiaryButton
              label="Not now — I’ll add drives manually"
              onPress={() => {
                setTrackingEnabled(false);
                setProtectionSetupState('not_started');
                patchOnboarding({
                  protectionEducationAcknowledged: true,
                  permissionsEducationAcknowledged: true,
                });
                advanceOnboarding();
              }}
            />
          </View>
        ) : null
      }
    >
      {step === 'welcome' ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.sm }}>
          <Pressable
            onPress={() => advanceOnboarding()}
            accessibilityRole="button"
            accessibilityLabel="Skip welcome"
            hitSlop={8}
            style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.xs }}
          >
            <Text style={{ color: palette.text.secondary, fontWeight: '500', fontSize: typography.size.body }}>
              Skip
            </Text>
          </Pressable>
        </View>
      ) : null}

      {showProgress ? (
        <View style={{ marginBottom: spacing.sm }}>
          {showBack ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <Pressable
                onPress={() => backOnboarding()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                style={{ width: 40, height: 40, justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 28, color: palette.text.primary }}>‹</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <MRProgressBar step={progressIndex} total={progressSteps.length} />
              </View>
              <View style={{ width: 40 }} />
            </View>
          ) : (
            <MRProgressBar step={progressIndex} total={progressSteps.length} />
          )}
        </View>
      ) : null}

      {step === 'welcome' ? (
        <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
          <MRWelcomeLogo />
          <Text
            style={{
              fontSize: typography.size.display,
              lineHeight: typography.lineHeight.display,
              fontWeight: '700',
              color: palette.action.primary,
              textAlign: 'center',
              marginBottom: spacing.lg,
            }}
            accessibilityRole="header"
          >
            Welcome to MileRecover
          </Text>
          <View style={{ width: '100%', gap: layout.section, paddingHorizontal: spacing.sm }}>
            {WELCOME_BENEFITS.map((benefit) => (
              <View
                key={benefit.label}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.smMd }}
              >
                <MRIconCircle glyph={benefit.glyph} accessibilityLabel={benefit.label} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: typography.size.bodyLarge,
                    lineHeight: typography.lineHeight.bodyLarge,
                    fontWeight: '500',
                    color: palette.text.primary,
                  }}
                >
                  {benefit.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {step === 'account' ? (
        <View>
          <Text style={[text.headline, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Save your progress (optional)
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Sign in to restore preferences later, or continue without an account. Your miles stay on
            this device.
          </Text>
          {authNotice ? (
            <Text
              style={[text.caption, { color: palette.text.secondary, marginBottom: spacing.sm }]}
              accessibilityRole="text"
            >
              {authNotice}
            </Text>
          ) : !authPort.isProviderAvailable('google') &&
            !(Platform.OS === 'ios' && authPort.isProviderAvailable('apple')) ? (
            <Text
              style={[text.caption, { color: palette.text.secondary, marginBottom: spacing.sm }]}
              accessibilityRole="text"
            >
              {AUTH_UNAVAILABLE_MESSAGE}
            </Text>
          ) : null}
        </View>
      ) : null}

      {step === 'purpose' ? (
        <View>
          <Text style={[text.headline, { marginBottom: spacing.sm }]} accessibilityRole="header">
            What's your main reason for tracking mileage?
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            We'll tailor rates, reports, and tips.
          </Text>
          {PRIMARY_GOAL_OPTIONS.map((option) => {
            const selected = product.primaryGoal === option.id;
            return (
              <MRCard
                key={option.id}
                selected={selected}
                onPress={() => {
                  setPrimaryGoal(option.id);
                  logEvent(ANALYTICS_EVENTS.goalSelected, { goal: option.id });
                }}
                accessibilityLabel={option.label}
                style={{
                  minHeight: 56,
                  paddingVertical: spacing.smMd,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                  {option.label}
                </Text>
                {selected ? (
                  <Text style={{ color: palette.action.primary, fontWeight: '700', fontSize: 18 }}>✓</Text>
                ) : null}
              </MRCard>
            );
          })}
        </View>
      ) : null}

      {step === 'locale_setup' ? (
        <View>
          <Text style={[text.headline, { marginBottom: spacing.md }]} accessibilityRole="header">
            Set your region and mileage rate.
          </Text>

          <Text style={[text.caption, { marginBottom: spacing.xs, fontWeight: '500' }]}>Country</Text>
          <Pressable
            onPress={() => setCountrySheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Country ${countryLabel}`}
            style={{
              minHeight: layout.fieldH,
              borderWidth: 1,
              borderColor: palette.border.default,
              borderRadius: 12,
              paddingHorizontal: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
              backgroundColor: palette.background.card,
            }}
          >
            <Text style={{ color: palette.text.primary, fontSize: typography.size.bodyLarge }}>
              {countryLabel}
            </Text>
            <Text style={{ color: palette.text.secondary }}>▾</Text>
          </Pressable>

          <Text style={[text.caption, { marginBottom: spacing.xs, fontWeight: '500' }]}>
            Mileage rate
          </Text>
          <View
            style={{
              minHeight: layout.fieldH,
              borderWidth: 1,
              borderColor: palette.border.default,
              borderRadius: 12,
              paddingHorizontal: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
              backgroundColor: palette.background.card,
            }}
          >
            <Text style={{ color: palette.text.primary, fontWeight: '700', fontSize: typography.size.bodyLarge }}>
              {displayRate.includes('Review') || displayRate === 'Not set'
                ? unitDraft === 'km'
                  ? 'Set a rate'
                  : 'Set a rate'
                : displayRate.startsWith('$')
                  ? displayRate
                  : displayRate}
            </Text>
            <Pressable
              onPress={() => setRateEditing((open) => !open)}
              accessibilityRole="button"
              accessibilityLabel="Update rate"
            >
              <Text style={{ color: palette.action.primary, fontWeight: '700' }}>Update rate</Text>
            </Pressable>
          </View>

          {rateEditing ? (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={[text.caption, { marginBottom: spacing.xs }]}>Distance unit</Text>
              <MRSegmentedControl
                value={unitDraft}
                onChange={setUnitDraft}
                options={[
                  { label: 'Miles', value: 'mi' },
                  { label: 'Kilometres', value: 'km' },
                ]}
              />
              {countryDraft === 'OTHER' ? (
                <MRFormField
                  label="Currency code"
                  value={otherCurrency === 'OTHER' ? '' : otherCurrency}
                  onChangeText={(value) => {
                    const nextCode = value.trim().toUpperCase();
                    if (!nextCode) setOtherCurrency('OTHER');
                    else if (['USD', 'CAD', 'GBP', 'AUD', 'EUR'].includes(nextCode)) {
                      setOtherCurrency(nextCode as CurrencyCode);
                    }
                  }}
                  placeholder="e.g. EUR"
                  autoCapitalize="characters"
                />
              ) : null}
              <MRFormField
                label={unitDraft === 'km' ? 'Rate (¢ per km)' : 'Rate (¢ per mile)'}
                value={rateCents}
                onChangeText={setRateCents}
                placeholder="70"
                keyboardType="numeric"
                accessibilityLabel="Mileage rate"
              />
            </View>
          ) : null}

          <MRStatusPanel
            tone="info"
            message="This is your chosen estimate. You can change it anytime."
          />

          <BottomSheet
            visible={countrySheetOpen}
            title="Choose country"
            onClose={() => setCountrySheetOpen(false)}
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <SelectionCard
                key={opt.id}
                title={opt.label}
                body={opt.id === recommendedCountry ? 'Suggested from your device' : undefined}
                selected={countryDraft === opt.id}
                onPress={() => applyCountry(opt.id)}
              />
            ))}
          </BottomSheet>
        </View>
      ) : null}

      {step === 'protect_drives' ? (
        <View>
          <Text style={[text.headline, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Keep your drives protected
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            MileRecover can capture drives automatically, even when the app is not open.
          </Text>
          <View style={{ gap: spacing.sm }}>
            <ChecklistRow label="Automatic detection — finds possible drives for you" status="ready" />
            <ChecklistRow label="Background tracking — works when your screen is off" status="ready" />
            <ChecklistRow label="Battery-aware — uses location carefully" status="ready" />
            <ChecklistRow label="Privacy control — you decide which drives count as work" status="ready" />
          </View>
          <Text style={[text.caption, { marginTop: spacing.md }]}>
            We’ll ask for location next. If you decline, manual entry still works.
            {'\n'}
            Location: {permissions.location === 'granted' ? 'Allowed' : 'Not yet'}
            {' · '}
            Background: {permissions.backgroundLocation === 'granted' ? 'Allowed' : 'Not yet'}
          </Text>
        </View>
      ) : null}

      {step === 'ready' ? (
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: palette.background.mist,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
            }}
            accessibilityLabel="Complete"
          >
            <Text style={[text.display, { color: palette.forest[700] }]}>✓</Text>
          </View>
          <Text
            style={[text.headline, { marginBottom: spacing.sm, textAlign: 'center' }]}
            accessibilityRole="header"
          >
            You’re all set
          </Text>
          <Text style={[text.body, { marginBottom: spacing.lg, textAlign: 'center' }]}>
            {protectionConfigured
              ? 'Protection is waiting for your first drive. Uncertain drives go to Review before they affect your records.'
              : 'You can add drives manually anytime. Turn on protection later from Profile when you’re ready.'}
          </Text>
          <View style={{ width: '100%', gap: spacing.sm }}>
            <MRPrimaryButton
              label="Go to Home"
              onPress={() => finish(null)}
              disabled={finishing}
              loading={finishing}
              accessibilityLabel="Go to Home"
            />
            <MRSecondaryButton
              label="Add my first drive"
              onPress={() => finish('ManualTrip')}
              disabled={finishing}
            />
          </View>
        </View>
      ) : null}
    </OnboardingScreen>
  );
}
