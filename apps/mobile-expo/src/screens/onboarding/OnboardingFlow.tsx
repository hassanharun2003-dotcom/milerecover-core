import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
import {
  localeProfileFromCountry,
  recommendCountryFromLocale,
  type CountryCode,
  type CurrencyCode,
  type DistanceUnit,
  type NextActionId,
} from '@milerecover/domain';
import {
  COUNTRY_OPTIONS,
  DRIVING_PATTERN_OPTIONS,
  ONBOARDING_STEP_ORDER,
  PRIMARY_GOAL_OPTIONS,
  type PostOnboardingRoute,
  type ProductOnboardingStep,
} from '../../product/types';
import { nextActionForGoal } from '../../product/copy';
import {
  FormField,
  OnboardingScreen,
  PrimaryButton,
  ProgressIndicator,
  SecondaryButton,
  SelectionCard,
  SoftPanel,
  TertiaryButton,
  text,
} from '../../design-system';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';
import {
  AUTH_EMAIL_PENDING_MESSAGE,
  AUTH_UNAVAILABLE_MESSAGE,
  getAuthPort,
  type AuthProviderId,
} from '../../services/auth';

function inOrder(step: ProductOnboardingStep): boolean {
  return ONBOARDING_STEP_ORDER.includes(step);
}

function remapStep(step: ProductOnboardingStep): ProductOnboardingStep {
  if (inOrder(step)) return step;
  if (
    step === 'welcome' ||
    step === 'account' ||
    step === 'country' ||
    step === 'preferred_name' ||
    step === 'primary_goal' ||
    step === 'pain_points'
  ) {
    return 'your_work';
  }
  if (step === 'permissions_education' || step === 'protection_education') return 'protect_drives';
  if (step === 'vehicle_setup' || step === 'driving_pattern' || step === 'familiar_places') {
    return 'personalize';
  }
  return 'your_work';
}

export function OnboardingFlow() {
  const { finishOnboarding, requestLocationPermission, permissions } = useApp();
  const {
    product,
    advanceOnboarding,
    backOnboarding,
    setOnboardingStep,
    setPrimaryGoal,
    setPreferredName,
    setDrivingType,
    setLocaleProfile,
    skipVehicleSetup,
    upsertVehicle,
    setProtectionSetupState,
    patchOnboarding,
    completeProductOnboarding,
  } = useProduct();

  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [nameDraft, setNameDraft] = useState(product.preferredName ?? '');
  const [vehicleNickname, setVehicleNickname] = useState('');
  const [placeLabel, setPlaceLabel] = useState('');
  const recommendedCountry = recommendCountryFromLocale(
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().locale : undefined,
  );
  const [countryDraft, setCountryDraft] = useState<CountryCode>(
    product.localeProfile.countryCode || recommendedCountry,
  );
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [otherUnit, setOtherUnit] = useState<DistanceUnit>('mi');
  const [otherCurrency, setOtherCurrency] = useState<CurrencyCode>('OTHER');
  const authPort = getAuthPort();

  const filteredCountries = useMemo(() => {
    const ordered = [
      ...COUNTRY_OPTIONS.filter((opt) => opt.id !== 'OTHER').sort((a, b) => {
        if (a.id === recommendedCountry) return -1;
        if (b.id === recommendedCountry) return 1;
        return 0;
      }),
      ...COUNTRY_OPTIONS.filter((opt) => opt.id === 'OTHER'),
    ];
    const q = countryQuery.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [countryQuery, recommendedCountry]);

  const step = remapStep(product.onboardingStep);
  const stepIndex = Math.max(0, ONBOARDING_STEP_ORDER.indexOf(step));
  const next = nextActionForGoal(product.primaryGoal);

  useEffect(() => {
    if (product.onboardingStep !== step) setOnboardingStep(step);
  }, [product.onboardingStep, setOnboardingStep, step]);

  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.onboardingStarted, {});
  }, []);

  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.onboardingStepViewed, { step });
  }, [step]);

  const saveCountry = (code: CountryCode) => {
    setCountryDraft(code);
    const profile = localeProfileFromCountry(code, {
      distanceUnit: code === 'OTHER' ? otherUnit : undefined,
      currencyCode: code === 'OTHER' ? otherCurrency : undefined,
    });
    setLocaleProfile({ ...profile, activeRateNeedsReview: false });
    logEvent(ANALYTICS_EVENTS.countrySelected, { country: code });
  };

  const tryAuth = async (provider: AuthProviderId) => {
    setAuthBusy(true);
    setAuthNotice(null);
    try {
      const result = await authPort.signIn(provider);
      if (!result.ok) {
        setAuthNotice(
          result.reason === 'not_configured' || provider === 'email'
            ? provider === 'email'
              ? AUTH_EMAIL_PENDING_MESSAGE
              : AUTH_UNAVAILABLE_MESSAGE
            : result.message || AUTH_UNAVAILABLE_MESSAGE,
        );
        return;
      }
      patchOnboarding({ accountStepAcknowledged: true });
    } finally {
      setAuthBusy(false);
    }
  };

  const finish = (route: PostOnboardingRoute) => {
    if (finishing) return;
    setFinishing(true);
    const action: NextActionId =
      route === 'ProtectionAlert'
        ? 'start_protection'
        : route === 'BringExistingMileage'
          ? 'import_mileage'
          : route === 'MissingTripRecovery'
            ? 'begin_rescue'
            : 'add_first_drive';
    completeProductOnboarding(route);
    patchOnboarding({ nextActionSelected: action });
    logEvent(ANALYTICS_EVENTS.onboardingCompleted, { next: action });
    finishOnboarding();
  };

  const protectionReady =
    permissions.location === 'granted' && permissions.backgroundLocation === 'granted';

  return (
    <OnboardingScreen
      footer={
        step === 'your_work' ? (
          <PrimaryButton
            label="Continue"
            onPress={() => {
              if (!product.primaryGoal) return;
              setPreferredName(nameDraft.trim() || null);
              saveCountry(countryDraft);
              advanceOnboarding();
            }}
            disabled={!product.primaryGoal}
            accessibilityLabel="Continue to drive protection setup"
          />
        ) : step === 'protect_drives' ? (
          <View>
            <PrimaryButton
              label="Set up drive protection"
              onPress={() => {
                logEvent(ANALYTICS_EVENTS.protectionSetupStarted, {});
                setProtectionSetupState('educated');
                if (permissions.location !== 'granted') {
                  void requestLocationPermission();
                }
                advanceOnboarding();
              }}
              accessibilityLabel="Set up drive protection"
            />
            <TertiaryButton
              label="Skip for now — use manual tracking"
              onPress={() => {
                setProtectionSetupState('not_started');
                advanceOnboarding();
              }}
            />
          </View>
        ) : step === 'personalize' ? (
          <View>
            <PrimaryButton
              label="Continue"
              onPress={() => {
                if (vehicleNickname.trim()) {
                  upsertVehicle({
                    id: `vehicle-${Date.now()}`,
                    nickname: vehicleNickname.trim(),
                    year: '',
                    make: '',
                    model: '',
                    plate: '',
                    isPrimary: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  });
                } else {
                  skipVehicleSetup();
                }
                advanceOnboarding();
              }}
            />
            <TertiaryButton
              label="Skip personalization"
              onPress={() => {
                skipVehicleSetup();
                advanceOnboarding();
              }}
            />
          </View>
        ) : null
      }
    >
      <ProgressIndicator step={stepIndex} total={ONBOARDING_STEP_ORDER.length} />
      {stepIndex > 0 ? (
        <TertiaryButton label="Back" onPress={() => backOnboarding()} accessibilityLabel="Go back" />
      ) : null}

      {step === 'your_work' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Your work
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Tell us how you drive for work so reports use the right wording, units, and mileage value.
          </Text>
          <FormField
            label="Preferred name (optional)"
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="First name"
          />
          <Text style={[text.subtitle, { marginBottom: spacing.sm }]}>Primary goal</Text>
          {PRIMARY_GOAL_OPTIONS.map((option) => (
            <SelectionCard
              key={option.id}
              title={option.label}
              body={option.body}
              selected={product.primaryGoal === option.id}
              onPress={() => {
                setPrimaryGoal(option.id);
                logEvent(ANALYTICS_EVENTS.goalSelected, { goal: option.id });
              }}
            />
          ))}
          <Text style={[text.subtitle, { marginTop: spacing.md, marginBottom: spacing.sm }]}>Country</Text>
          <SoftPanel>
            <Text style={text.caption}>Suggested from your device</Text>
            <Text style={[text.subtitle, { marginTop: spacing.xs }]}>
              {COUNTRY_OPTIONS.find((opt) => opt.id === countryDraft)?.label ?? 'Other country'}
            </Text>
            <Text style={[text.caption, { marginTop: spacing.xs }]}>
              Country affects units, mileage value, and report wording — not App Store subscription prices.
            </Text>
            <TertiaryButton
              label={showCountryPicker ? 'Hide country list' : 'Change country'}
              onPress={() => setShowCountryPicker((value) => !value)}
            />
          </SoftPanel>
          {showCountryPicker ? (
            <>
              <FormField
                label="Search countries"
                value={countryQuery}
                onChangeText={setCountryQuery}
                placeholder="United States, Canada…"
              />
              {filteredCountries.map((opt) => (
                <SelectionCard
                  key={opt.id}
                  title={opt.label}
                  body={opt.id === recommendedCountry ? 'Suggested' : undefined}
                  selected={countryDraft === opt.id}
                  onPress={() => saveCountry(opt.id)}
                />
              ))}
              {countryDraft === 'OTHER' ? (
                <SoftPanel>
                  <SelectionCard title="Miles" selected={otherUnit === 'mi'} onPress={() => setOtherUnit('mi')} />
                  <SelectionCard title="Kilometers" selected={otherUnit === 'km'} onPress={() => setOtherUnit('km')} />
                  <FormField
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
                </SoftPanel>
              ) : null}
            </>
          ) : null}
          <Text style={[text.caption, { marginTop: spacing.md }]}>
            Optional sign-in keeps a backup later. You can continue locally.
          </Text>
          {authPort.isProviderAvailable('google') || authPort.isProviderAvailable('apple') ? (
            <View style={{ marginTop: spacing.sm }}>
              {authPort.isProviderAvailable('google') ? (
                <SecondaryButton
                  label={authBusy ? 'Signing in…' : 'Continue with Google'}
                  onPress={() => void tryAuth('google')}
                  disabled={authBusy}
                />
              ) : null}
              {Platform.OS === 'ios' && authPort.isProviderAvailable('apple') ? (
                <SecondaryButton label="Continue with Apple" onPress={() => void tryAuth('apple')} disabled={authBusy} />
              ) : null}
            </View>
          ) : (
            <Text style={[text.caption, { marginTop: spacing.xs }]}>
              Sign-in isn’t available in this build — continuing locally.
            </Text>
          )}
          {authNotice ? <Text style={[text.caption, { marginTop: spacing.xs }]}>{authNotice}</Text> : null}
        </View>
      ) : null}

      {step === 'protect_drives' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Protect your drives
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Automatic protection helps you rely less on memory. Manual tracking always works.
          </Text>
          <SoftPanel>
            <Text style={text.body}>1. Starts only after you enable it</Text>
            <Text style={[text.body, { marginTop: spacing.sm }]}>2. Uncertain drives require your review</Text>
            <Text style={[text.body, { marginTop: spacing.sm }]}>3. You can pause protection anytime</Text>
          </SoftPanel>
          {protectionReady ? (
            <Text style={[text.caption, { marginTop: spacing.md }]}>
              Location access looks ready. You’ll confirm watching on the next screens.
            </Text>
          ) : (
            <Text style={[text.caption, { marginTop: spacing.md }]}>
              We’ll ask for location only when you choose Set up drive protection.
            </Text>
          )}
        </View>
      ) : null}

      {step === 'personalize' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Personalize
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Optional details that make reports clearer. Skip anything.
          </Text>
          <FormField
            label="Vehicle nickname (optional)"
            value={vehicleNickname}
            onChangeText={setVehicleNickname}
            placeholder="e.g. Work car"
          />
          <Text style={[text.subtitle, { marginBottom: spacing.sm }]}>Driving pattern</Text>
          {DRIVING_PATTERN_OPTIONS.map((option) => (
            <SelectionCard
              key={option.id}
              title={option.label}
              selected={product.drivingType === option.id}
              onPress={() => setDrivingType(option.id)}
            />
          ))}
          <FormField
            label="Familiar place (optional)"
            value={placeLabel}
            onChangeText={setPlaceLabel}
            placeholder="e.g. Office"
          />
        </View>
      ) : null}

      {step === 'ready' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            You’re ready
          </Text>
          <SoftPanel>
            <Text style={text.body}>
              Goal: {PRIMARY_GOAL_OPTIONS.find((o) => o.id === product.primaryGoal)?.label ?? 'Not set'}
            </Text>
            <Text style={[text.body, { marginTop: spacing.xs }]}>
              Country: {product.localeProfile.countryDisplayName} ·{' '}
              {product.localeProfile.distanceUnit === 'km' ? 'Kilometers' : 'Miles'}
            </Text>
            <Text style={[text.body, { marginTop: spacing.xs }]}>
              Protection:{' '}
              {product.protectionSetupState === 'educated' || product.protectionSetupState === 'configured'
                ? 'Setup started'
                : 'Manual tracking'}
            </Text>
          </SoftPanel>
          <Text style={[text.body, { marginTop: spacing.md, marginBottom: spacing.md }]}>
            {next.body}
          </Text>
          <PrimaryButton
            label={next.cta}
            onPress={() => finish(next.route)}
            accessibilityLabel={next.cta}
          />
          <SecondaryButton label="Add a first drive" onPress={() => finish('ManualTrip')} />
          <TertiaryButton label="Import mileage later" onPress={() => finish(null)} />
        </View>
      ) : null}
    </OnboardingScreen>
  );
}
