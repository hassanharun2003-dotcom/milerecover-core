import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, Platform, Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
import {
  localeProfileFromCountry,
  recommendCountryFromLocale,
  type CountryCode,
  type CurrencyCode,
  type DistanceUnit,
} from '@milerecover/domain';
import {
  COUNTRY_OPTIONS,
  ONBOARDING_STEP_ORDER,
  PAIN_POINT_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  type PainPoint,
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
  StatusCard,
  TertiaryButton,
  text,
} from '../../design-system';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import { CarRouteHero } from '../../components/CarRouteHero';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';
import {
  AUTH_EMAIL_PENDING_MESSAGE,
  AUTH_UNAVAILABLE_MESSAGE,
  getAuthPort,
  type AuthProviderId,
} from '../../services/auth';
import { requestNotificationPermission } from '../../services/notifications';

function inOrder(step: ProductOnboardingStep): boolean {
  return ONBOARDING_STEP_ORDER.includes(step);
}

function remapStep(step: ProductOnboardingStep): ProductOnboardingStep {
  if (inOrder(step)) return step;
  if (step === 'driving_pattern' || step === 'familiar_places') return 'preferred_name';
  return 'welcome';
}

function readyBenefits(goal: (typeof PRIMARY_GOAL_OPTIONS)[number]['id'] | null, pains: PainPoint[]): string[] {
  const benefits: string[] = [];
  if (pains.includes('older_mileage')) {
    benefits.push('Bring older miles back together when you’re ready.');
  } else {
    benefits.push('Save work drives in a few taps.');
  }
  if (pains.includes('forget_to_track') || pains.includes('tracker_misses') || goal === 'gig_delivery') {
    benefits.push('Turn on watching later if you want automatic coverage.');
  } else {
    benefits.push('Review anything uncertain before it enters a report.');
  }
  if (pains.includes('need_cleaner_reports') || goal === 'employee_reimbursement') {
    benefits.push('Share cleaner records when work asks.');
  } else {
    benefits.push('Your saved miles stay on this device.');
  }
  return benefits.slice(0, 3);
}

export function OnboardingFlow() {
  const {
    finishOnboarding,
    requestLocationPermission,
    requestBackgroundPermission,
    permissions,
  } = useApp();
  const {
    product,
    advanceOnboarding,
    backOnboarding,
    setOnboardingStep,
    setPrimaryGoal,
    setSelectedPainPoints,
    setPreferredName,
    setLocaleProfile,
    skipPreferredName,
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
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const recommendedCountry = recommendCountryFromLocale(
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().locale : undefined,
  );
  const [countryDraft, setCountryDraft] = useState<CountryCode>(
    product.localeProfile.countryCode || recommendedCountry,
  );
  const [countryQuery, setCountryQuery] = useState('');
  const [otherUnit, setOtherUnit] = useState<DistanceUnit>('mi');
  const [otherCurrency, setOtherCurrency] = useState<CurrencyCode>('OTHER');
  const [otherRate, setOtherRate] = useState('');
  const filteredCountries = useMemo(() => {
    const recommended = COUNTRY_OPTIONS.filter((opt) => opt.id !== 'OTHER');
    const other = COUNTRY_OPTIONS.filter((opt) => opt.id === 'OTHER');
    const ordered = [
      ...recommended.sort((a, b) => {
        if (a.id === recommendedCountry) return -1;
        if (b.id === recommendedCountry) return 1;
        return 0;
      }),
      ...other,
    ];
    const q = countryQuery.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [countryQuery, recommendedCountry]);

  const step = remapStep(product.onboardingStep);
  const stepIndex = Math.max(0, ONBOARDING_STEP_ORDER.indexOf(step));
  const next = nextActionForGoal(product.primaryGoal);
  const selectedPainPoints = product.selectedPainPoints.filter((p) => p !== 'battery_worry') as PainPoint[];
  const authPort = getAuthPort();

  useEffect(() => {
    if (product.onboardingStep !== step) setOnboardingStep(step);
  }, [product.onboardingStep, setOnboardingStep, step]);

  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.onboardingStepViewed, { step });
  }, [step]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stepIndex <= 0) return false;
      backOnboarding();
      return true;
    });
    return () => sub.remove();
  }, [backOnboarding, stepIndex]);

  const finish = (deepLink: boolean) => {
    if (finishing) return;
    setFinishing(true);
    completeProductOnboarding(deepLink ? 'ProtectionAlert' : null);
    logEvent(ANALYTICS_EVENTS.onboardingCompleted, {
      goal: product.primaryGoal ?? 'unset',
      painCount: selectedPainPoints.length,
      nextAction: deepLink ? 'start_protection' : next.id,
    });
    finishOnboarding();
  };

  const togglePainPoint = (painPoint: PainPoint) => {
    const nextPainPoints = selectedPainPoints.includes(painPoint)
      ? selectedPainPoints.filter((item) => item !== painPoint)
      : [...selectedPainPoints, painPoint];
    setSelectedPainPoints(nextPainPoints);
  };

  const acknowledgeAccountAndContinue = () => {
    patchOnboarding({
      accountStepAcknowledged: true,
      completedSteps: Array.from(new Set([...product.onboarding.completedSteps, 'account'])),
    });
    advanceOnboarding();
  };

  const tryAuth = async (provider: AuthProviderId) => {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthNotice(null);
    try {
      if (provider === 'email' && !authPort.isProviderAvailable('email')) {
        setAuthNotice(AUTH_EMAIL_PENDING_MESSAGE);
        return;
      }
      if (provider === 'google' && !authPort.isProviderAvailable('google')) {
        setAuthNotice(AUTH_UNAVAILABLE_MESSAGE);
        return;
      }
      const result = await authPort.signIn(provider);
      if (result.ok) {
        if (result.displayName) setPreferredName(result.displayName);
        setAuthNotice(`Signed in${result.email ? ` as ${result.email}` : ''}.`);
        acknowledgeAccountAndContinue();
        return;
      }
      if (result.reason === 'cancelled') {
        setAuthNotice(null);
        return;
      }
      setAuthNotice(result.message);
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <OnboardingScreen>
      <ProgressIndicator step={stepIndex} total={ONBOARDING_STEP_ORDER.length} />
      {stepIndex > 0 ? (
        <TertiaryButton
          label="Back"
          onPress={backOnboarding}
          accessibilityLabel="Go back to previous onboarding step"
        />
      ) : null}

      {step === 'welcome' ? (
        <View>
          <Text style={[text.headline, { marginBottom: spacing.xs }]} accessibilityRole="header">
            MileRecover
          </Text>
          <CarRouteHero />
          <Text style={[text.title, { marginTop: spacing.sm, marginBottom: spacing.sm }]}>
            Protect every work mile.
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Capture, recover, review, and prove work mileage — without inventing anything.
          </Text>
          <View style={{ gap: spacing.sm }}>
            <PrimaryButton
              label="Get started"
              onPress={() => {
                logEvent(ANALYTICS_EVENTS.onboardingStarted, { intent: 'protect' });
                advanceOnboarding();
              }}
            />
            <SecondaryButton
              label="Bring existing mileage"
              onPress={() => {
                logEvent(ANALYTICS_EVENTS.onboardingStarted, { intent: 'bring_existing' });
                setPrimaryGoal('mixed');
                setSelectedPainPoints(['older_mileage']);
                setOnboardingStep('account');
              }}
            />
          </View>
        </View>
      ) : null}

      {step === 'account' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Sign in
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Use Google to continue. Apple and email are available when configured. You can also skip —
            miles stay on this device.
          </Text>
          <PrimaryButton
            label={authBusy ? 'Opening Google…' : 'Continue with Google'}
            onPress={() => void tryAuth('google')}
            disabled={authBusy}
            loading={authBusy}
            accessibilityLabel="Continue with Google account picker"
          />
          {Platform.OS === 'ios' ? (
            <SecondaryButton
              label="Continue with Apple"
              onPress={() => void tryAuth('apple')}
              disabled={authBusy}
            />
          ) : null}
          <SecondaryButton
            label="Continue with email"
            onPress={() => void tryAuth('email')}
            disabled={authBusy}
          />
          <TertiaryButton
            label="Skip for now"
            onPress={() => {
              setAuthNotice(null);
              acknowledgeAccountAndContinue();
            }}
            accessibilityLabel="Skip account and continue setup"
          />
          {authNotice ? (
            <StatusCard
              variant="info"
              title="Sign-in"
              body={authNotice}
              emphasis="subtle"
            />
          ) : null}
        </View>
      ) : null}

      {step === 'country' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Where do you drive for work?
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Recommended countries first. We’ll use local units and currency. You can change this later in Profile.
            This is not tax advice.
          </Text>
          <SoftPanel>
            <Text style={text.caption}>Current selection</Text>
            <Text style={[text.subtitle, { marginTop: spacing.xs }]}>
              {COUNTRY_OPTIONS.find((opt) => opt.id === countryDraft)?.label ?? 'Other country'}
            </Text>
          </SoftPanel>
          <FormField
            label="Search countries"
            value={countryQuery}
            onChangeText={setCountryQuery}
            placeholder="Search United States, Canada…"
            accessibilityLabel="Search countries"
          />
          {filteredCountries.map((opt) => (
            <SelectionCard
              key={opt.id}
              title={opt.label}
              body={
                opt.id === recommendedCountry
                  ? 'Suggested from your device'
                  : opt.id === 'OTHER'
                    ? 'Custom units — no local tax rules claimed'
                    : undefined
              }
              selected={countryDraft === opt.id}
              onPress={() => setCountryDraft(opt.id)}
            />
          ))}
          {countryDraft === 'OTHER' ? (
            <SoftPanel>
              <Text style={[text.body, { marginBottom: spacing.sm }]}>
                Choose units and a custom reimbursement rate (optional).
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
                <SelectionCard
                  title="Miles"
                  selected={otherUnit === 'mi'}
                  onPress={() => setOtherUnit('mi')}
                />
                <SelectionCard
                  title="Kilometers"
                  selected={otherUnit === 'km'}
                  onPress={() => setOtherUnit('km')}
                />
              </View>
              <FormField
                label="Currency code (optional)"
                value={otherCurrency === 'OTHER' ? '' : otherCurrency}
                onChangeText={(value) => {
                  const next = value.trim().toUpperCase();
                  if (!next) setOtherCurrency('OTHER');
                  else if (['USD', 'CAD', 'GBP', 'AUD', 'EUR'].includes(next)) {
                    setOtherCurrency(next as CurrencyCode);
                  }
                }}
                placeholder="e.g. EUR"
                autoCapitalize="characters"
              />
              <FormField
                label={`Rate (cents per ${otherUnit === 'km' ? 'mile stored' : 'mile'})`}
                value={otherRate}
                onChangeText={setOtherRate}
                placeholder="e.g. 45"
                keyboardType="decimal-pad"
              />
            </SoftPanel>
          ) : null}
          <PrimaryButton
            label="Continue"
            onPress={() => {
              const cents = Number.parseFloat(otherRate);
              const profile = localeProfileFromCountry(countryDraft, {
                distanceUnit: countryDraft === 'OTHER' ? otherUnit : undefined,
                currencyCode: countryDraft === 'OTHER' ? otherCurrency : undefined,
                centsPerMile:
                  countryDraft === 'OTHER' && Number.isFinite(cents) && cents > 0 ? cents : undefined,
              });
              setLocaleProfile(profile);
              advanceOnboarding();
            }}
            accessibilityLabel="Save country and continue"
          />
        </View>
      ) : null}

      {step === 'permissions_education' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            How location helps
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Location is used only to help protect work drives when you turn watching on. We explain before
            we ask. You can skip and still add drives manually.
          </Text>
          <SoftPanel>
            <Text style={text.body}>
              While using the app: {permissions.location === 'granted' ? 'Allowed' : 'Not allowed yet'}
            </Text>
            <Text style={[text.body, { marginTop: spacing.xs }]}>
              Notifications: optional reminders — never required.
            </Text>
          </SoftPanel>
          <PrimaryButton
            label="Allow location while using the app"
            onPress={() => {
              void requestLocationPermission().then((snap) => {
                setPermissionNotice(
                  snap.location === 'granted'
                    ? 'Location allowed for this app.'
                    : 'Location stays off. Manual drives still work.',
                );
              });
            }}
          />
          <SecondaryButton
            label="Allow notifications (optional)"
            onPress={() => {
              void requestNotificationPermission().then((state) => {
                setPermissionNotice(
                  state === 'granted' ? 'Notifications allowed.' : 'Notifications stay off — that’s fine.',
                );
              });
            }}
          />
          <PrimaryButton
            label="Continue"
            onPress={() => {
              patchOnboarding({
                permissionsEducationAcknowledged: true,
                completedSteps: Array.from(
                  new Set([...product.onboarding.completedSteps, 'permissions_education']),
                ),
              });
              advanceOnboarding();
            }}
          />
          {permissionNotice ? (
            <Text style={[text.caption, { marginTop: spacing.sm }]}>{permissionNotice}</Text>
          ) : null}
        </View>
      ) : null}

      {step === 'preferred_name' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            What should we call you?
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Optional. Used in greetings and reports on this device.
          </Text>
          <FormField
            label="Preferred name"
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Your name"
            autoCapitalize="words"
          />
          <PrimaryButton
            label="Continue"
            onPress={() => {
              if (nameDraft.trim()) setPreferredName(nameDraft.trim());
              else skipPreferredName();
              advanceOnboarding();
            }}
          />
          <TertiaryButton
            label="Skip"
            onPress={() => {
              skipPreferredName();
              advanceOnboarding();
            }}
          />
        </View>
      ) : null}

      {step === 'primary_goal' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>
            What do you use work mileage for?
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Tap one. You can change this later in Profile.
          </Text>
          {PRIMARY_GOAL_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.id}
              title={opt.label}
              body={opt.body}
              selected={product.primaryGoal === opt.id}
              onPress={() => {
                setPrimaryGoal(opt.id);
                advanceOnboarding();
              }}
            />
          ))}
        </View>
      ) : null}

      {step === 'pain_points' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>What causes the most trouble?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Tap anything that sounds familiar. One is enough.
          </Text>
          {PAIN_POINT_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.id}
              title={opt.label}
              selected={selectedPainPoints.includes(opt.id)}
              onPress={() => togglePainPoint(opt.id)}
            />
          ))}
          <PrimaryButton
            label="Continue"
            onPress={advanceOnboarding}
            disabled={selectedPainPoints.length === 0}
          />
        </View>
      ) : null}

      {step === 'vehicle_setup' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Add a vehicle
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Optional nickname is enough. You can add full details later.
          </Text>
          <FormField
            label="Vehicle nickname"
            value={vehicleNickname}
            onChangeText={setVehicleNickname}
            placeholder="e.g. Work car"
            autoCapitalize="words"
          />
          <PrimaryButton
            label="Save vehicle"
            onPress={() => {
              const nickname = vehicleNickname.trim() || 'My vehicle';
              upsertVehicle({
                id: `vehicle-${Date.now()}`,
                nickname,
                make: '',
                model: '',
                year: '',
              });
              advanceOnboarding();
            }}
          />
          <TertiaryButton
            label="Skip for now"
            onPress={() => {
              skipVehicleSetup();
              advanceOnboarding();
            }}
          />
        </View>
      ) : null}

      {step === 'protection_education' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            How tracking works
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Automatic watching can protect drives in the background with Plus when you’re ready. Nothing
            starts until you turn it on. Manual logging always works on Free.
          </Text>
          <StatusCard
            variant="info"
            title="You’re in control"
            body="We’ll ask for background location only when you choose to finish watching setup."
            emphasis="subtle"
          />
          <SecondaryButton
            label="Allow background location now"
            onPress={() => {
              void requestBackgroundPermission();
            }}
            disabled={permissions.location !== 'granted'}
          />
          <PrimaryButton
            label="Continue"
            onPress={() => {
              setProtectionSetupState('educated');
              patchOnboarding({
                protectionEducationAcknowledged: true,
                completedSteps: Array.from(
                  new Set([...product.onboarding.completedSteps, 'protection_education']),
                ),
              });
              advanceOnboarding();
            }}
          />
        </View>
      ) : null}

      {step === 'ready' ? (
        <View>
          <StatusCard
            variant="success"
            title="You’re ready"
            body="Home will show what to do next. Optional setup can wait."
            emphasis="hero"
          />
          {readyBenefits(product.primaryGoal, selectedPainPoints).map((line) => (
            <SoftPanel key={line}>
              <Text style={text.body}>{line}</Text>
            </SoftPanel>
          ))}
          <PrimaryButton
            label="Go to Home"
            onPress={() => finish(false)}
            loading={finishing}
            accessibilityLabel="Finish onboarding and go to Home"
          />
          <View style={{ marginTop: spacing.sm }}>
            <SecondaryButton
              label="Set up automatic protection"
              onPress={() => finish(true)}
              disabled={finishing}
              accessibilityLabel="Set up automatic protection"
            />
          </View>
        </View>
      ) : null}
    </OnboardingScreen>
  );
}
