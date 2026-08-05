import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { colors, spacing } from '@milerecover/config';
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
  FormField,
  ListRow,
  OnboardingScreen,
  PrimaryButton,
  ProgressIndicator,
  SecondaryButton,
  SegmentedControl,
  SelectionCard,
  SoftPanel,
  TertiaryButton,
  WelcomeHero,
  text,
} from '../../design-system';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';

function inOrder(step: ProductOnboardingStep): boolean {
  return ONBOARDING_STEP_ORDER.includes(step);
}

function remapStep(step: ProductOnboardingStep): ProductOnboardingStep {
  if (inOrder(step)) return step;
  if (step === 'your_work' || step === 'primary_goal' || step === 'pain_points' || step === 'account') {
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

export function OnboardingFlow() {
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
    setPendingPostOnboardingRoute,
  } = useProduct();

  const [finishing, setFinishing] = useState(false);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
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
    completeProductOnboarding(route);
    patchOnboarding({
      nextActionSelected: action,
      countryStepAcknowledged: true,
      protectionEducationAcknowledged: true,
      permissionsEducationAcknowledged: true,
    });
    logEvent(ANALYTICS_EVENTS.onboardingCompleted, { next: action });
    finishOnboarding();
  };

  const rateLabel = unitDraft === 'km' ? 'Mileage rate (¢ per km)' : 'Mileage rate (¢ per mile)';
  const ratePreview = useMemo(() => {
    const entered = Number.parseFloat(rateCents);
    if (!Number.isFinite(entered) || entered <= 0) {
      return 'Review this rate. It is your chosen estimate, not a tax guarantee.';
    }
    return unitDraft === 'km'
      ? `${Math.round(entered)}¢ per km · your chosen estimate, not a tax guarantee`
      : `${Math.round(entered)}¢ per mile · your chosen estimate, not a tax guarantee`;
  }, [rateCents, unitDraft]);

  const goalLabel =
    PRIMARY_GOAL_OPTIONS.find((option) => option.id === product.primaryGoal)?.label ?? 'Not set';
  const countryLabel =
    COUNTRY_OPTIONS.find((option) => option.id === countryDraft)?.label ?? countryDraft;
  const currencyLabel =
    countryDraft === 'OTHER'
      ? otherCurrency === 'OTHER'
        ? 'Set currency'
        : otherCurrency
      : localeProfileFromCountry(countryDraft).currencyCode;

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

  return (
    <OnboardingScreen
      footer={
        step === 'welcome' ? (
          <View style={{ gap: spacing.sm }}>
            <PrimaryButton
              label="Get started"
              onPress={() => advanceOnboarding()}
              accessibilityLabel="Get started"
            />
            <SecondaryButton
              label="I already use a mileage app"
              onPress={() => {
                patchOnboarding({ selectedPainPoints: ['need_cleaner_reports'] });
                setPendingPostOnboardingRoute('BringExistingMileage');
                advanceOnboarding();
              }}
            />
          </View>
        ) : step === 'purpose' ? (
          <PrimaryButton
            label="Continue"
            onPress={() => {
              if (!product.primaryGoal) return;
              setPreferredName(nameDraft.trim() || null);
              advanceOnboarding();
            }}
            disabled={!product.primaryGoal}
            accessibilityLabel="Continue to country and rate"
          />
        ) : step === 'locale_setup' ? (
          <PrimaryButton
            label="Continue"
            onPress={() => {
              saveLocale();
              advanceOnboarding();
            }}
            accessibilityLabel="Continue to drive protection"
          />
        ) : step === 'protect_drives' ? (
          <View style={{ gap: spacing.sm }}>
            <PrimaryButton
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
            <TertiaryButton
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
      <ProgressIndicator step={stepIndex} total={ONBOARDING_STEP_ORDER.length} />
      {stepIndex > 0 ? (
        <TertiaryButton label="Back" onPress={() => backOnboarding()} accessibilityLabel="Go back" />
      ) : null}

      {step === 'welcome' ? (
        <View>
          <WelcomeHero
            title="Welcome to MileRecover"
            eyebrow="Protect your miles. Protect your money."
            body="Calm, privacy-first mileage protection — you confirm what counts as work."
          />
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <SoftPanel>
              <Text style={text.subtitle}>Recover forgotten miles</Text>
              <Text style={[text.body, { marginTop: spacing.xs }]}>
                Suggest likely drives from evidence on this device — you confirm what to keep.
              </Text>
            </SoftPanel>
            <SoftPanel>
              <Text style={text.subtitle}>Tax and employer ready</Text>
              <Text style={[text.body, { marginTop: spacing.xs }]}>
                Build clear records you can export when you need proof. Estimates are not tax advice.
              </Text>
            </SoftPanel>
            <SoftPanel>
              <Text style={text.subtitle}>Automatic tracking</Text>
              <Text style={[text.body, { marginTop: spacing.xs }]}>
                Capture possible drives in the background, with manual entry always available.
              </Text>
            </SoftPanel>
          </View>
        </View>
      ) : null}

      {step === 'purpose' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            What’s your main reason for tracking mileage?
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            This helps us personalize your experience.
          </Text>
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
          {product.primaryGoal ? (
            <View style={{ marginTop: spacing.md }}>
              <FormField
                label="Preferred name (optional)"
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="First name"
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {step === 'locale_setup' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Let’s set your region and mileage rate
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            We use this to display distance and estimated value correctly.
          </Text>

          <SoftPanel>
            <ListRow
              label="Country"
              value={
                countryDraft === recommendedCountry
                  ? `${countryLabel} · Suggested`
                  : countryLabel
              }
              onPress={() => setCountrySheetOpen(true)}
            />
            <ListRow label="Currency" value={currencyLabel} showChevron={false} />
          </SoftPanel>

          <Text style={[text.caption, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
            Distance unit
          </Text>
          <SegmentedControl
            value={unitDraft}
            onChange={setUnitDraft}
            options={[
              { label: 'Miles', value: 'mi' },
              { label: 'Kilometres', value: 'km' },
            ]}
          />

          {countryDraft === 'OTHER' ? (
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
          ) : null}

          <FormField
            label={rateLabel}
            value={rateCents}
            onChangeText={setRateCents}
            placeholder="67"
            keyboardType="numeric"
            accessibilityLabel="Mileage rate"
          />
          <Text style={[text.caption, { marginTop: spacing.xs }]}>{ratePreview}</Text>

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
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
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
              backgroundColor: colors.background.mist,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
            }}
            accessibilityLabel="Complete"
          >
            <Text style={[text.display, { color: colors.forest[700] }]}>✓</Text>
          </View>
          <Text
            style={[text.headline, { marginBottom: spacing.sm, textAlign: 'center' }]}
            accessibilityRole="header"
          >
            You’re all set!
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md, textAlign: 'center' }]}>
            {protectionConfigured
              ? 'Protection is waiting for your first drive. Uncertain drives go to Review before they affect your records.'
              : 'You can add drives manually anytime. Turn on protection later from Profile when you’re ready.'}
          </Text>
          <SoftPanel>
            <Text style={text.subtitle}>Purpose · {goalLabel}</Text>
            <Text style={[text.body, { marginTop: spacing.xs }]}>
              {product.localeProfile.countryDisplayName} ·{' '}
              {product.localeProfile.distanceUnit === 'km' ? 'Kilometres' : 'Miles'} ·{' '}
              {product.localeProfile.currencyCode}
            </Text>
            <Text style={[text.body, { marginTop: spacing.xs }]}>
              Rate · {formatActiveRateLabel(product.localeProfile)}
            </Text>
            <Text style={[text.body, { marginTop: spacing.xs }]}>
              {protectionConfigured
                ? 'Protection is waiting for your first drive'
                : 'Manual tracking selected'}
            </Text>
          </SoftPanel>
          <View style={{ marginTop: spacing.lg, width: '100%', gap: spacing.sm }}>
            <PrimaryButton
              label="Go to Home"
              onPress={() => finish(null)}
              disabled={finishing}
              loading={finishing}
              accessibilityLabel="Go to Home"
            />
            <SecondaryButton
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
