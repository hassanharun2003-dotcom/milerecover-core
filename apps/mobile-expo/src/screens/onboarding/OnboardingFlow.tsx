import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
import {
  DRIVING_PATTERN_OPTIONS,
  ONBOARDING_STEP_ORDER,
  PAIN_POINT_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  type PainPoint,
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
import { YEARS, MAKES, MODELS_BY_MAKE } from '../../data/vehicles';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import { CarRouteHero } from '../../components/CarRouteHero';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';

function permissionStatusLabel(status: string): string {
  if (status === 'granted') return 'On';
  if (status === 'denied') return 'Off';
  if (status === 'restricted') return 'Open Settings to change';
  return 'Not turned on yet';
}

function makeLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

function optionLabel<T extends string>(options: { id: T; label: string }[], id: T | null): string {
  return options.find((option) => option.id === id)?.label ?? 'Not set';
}

function readyBody(goal: typeof PRIMARY_GOAL_OPTIONS[number]['id'] | null, pains: PainPoint[]): string {
  if (pains.includes('older_mileage')) {
    return 'You’re ready to bring older miles back together — nothing is added without your say-so.';
  }
  if (goal === 'employee_reimbursement') {
    return 'Your reimbursement record is ready to begin.';
  }
  if (goal === 'gig_delivery') {
    return 'You’re ready to protect your first work shift.';
  }
  if (goal === 'self_employed_business') {
    return 'Your business mileage record is ready.';
  }
  return 'You’re set. Home will show what to do next.';
}

export function OnboardingFlow() {
  const {
    finishOnboarding,
    permissions,
    requestLocationPermission,
    requestBackgroundPermission,
    automaticCaptureAvailable,
  } = useApp();
  const {
    product,
    advanceOnboarding,
    backOnboarding,
    patchOnboarding,
    setOnboardingStep,
    setPrimaryGoal,
    setSelectedPainPoints,
    setDrivingType,
    setPreferredName,
    setProtectionSetupState,
    skipPreferredName,
    skipVehicleSetup,
    skipWorkPlaceSetup,
    upsertVehicle,
    upsertWorkLocation,
    completeProductOnboarding,
  } = useProduct();

  const [nameDraft, setNameDraft] = useState(product.preferredName ?? '');
  const [vehicleMode, setVehicleMode] = useState<'choice' | 'form'>('choice');
  const [vehicleNickname, setVehicleNickname] = useState('');
  const [vehicleYear, setVehicleYear] = useState(YEARS[0]);
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [placeKind, setPlaceKind] = useState<'home' | 'workplace' | 'client' | 'other'>('workplace');
  const [workLabel, setWorkLabel] = useState('');
  const [workAddress, setWorkAddress] = useState('');
  const [requestedForeground, setRequestedForeground] = useState(false);
  const [requestedBackground, setRequestedBackground] = useState(false);
  const step = product.onboardingStep;
  const stepIndex = Math.max(0, ONBOARDING_STEP_ORDER.indexOf(step));
  const next = nextActionForGoal(product.primaryGoal);
  const foregroundReady = permissions.location === 'granted';
  const backgroundReady = permissions.backgroundLocation === 'granted';
  const selectedPainPoints = product.selectedPainPoints;
  const availableModels = vehicleMake ? MODELS_BY_MAKE[vehicleMake] ?? [] : [];

  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.onboardingStepViewed, { step });
  }, [step]);

  const finish = (deepLink: boolean) => {
    completeProductOnboarding(deepLink ? next.route : null);
    logEvent(ANALYTICS_EVENTS.onboardingCompleted, {
      goal: product.primaryGoal ?? 'unset',
      painCount: product.selectedPainPoints.length,
      nextAction: next.id,
    });
    finishOnboarding();
  };

  const saveVehicle = (continueAfterSave: boolean) => {
    const hasVehicle = vehicleNickname.trim() || vehicleMake.trim() || vehicleModel.trim();
    if (hasVehicle) {
      upsertVehicle({
        id: makeLocalId('vehicle'),
        nickname: vehicleNickname.trim() || [vehicleMake.trim(), vehicleModel.trim()].filter(Boolean).join(' ') || 'My vehicle',
        year: vehicleYear,
        make: vehicleMake.trim(),
        model: vehicleModel.trim(),
        isPrimary: product.vehicles.length === 0,
      });
    }
    setVehicleNickname('');
    setVehicleMake('');
    setVehicleModel('');
    setVehicleYear(YEARS[0]);
    setVehicleMode(continueAfterSave ? 'choice' : 'form');
    if (continueAfterSave) advanceOnboarding();
  };

  const togglePainPoint = (painPoint: PainPoint) => {
    const nextPainPoints = selectedPainPoints.includes(painPoint)
      ? selectedPainPoints.filter((item) => item !== painPoint)
      : [...selectedPainPoints, painPoint];
    setSelectedPainPoints(nextPainPoints);
  };

  const saveWorkPlace = () => {
    const hasWorkPlace = workLabel.trim() || workAddress.trim();
    if (hasWorkPlace) {
      upsertWorkLocation({
        id: makeLocalId('work-place'),
        label: workLabel.trim() || 'Work place',
        address: workAddress.trim(),
        notes: '',
        kind: placeKind,
      });
    }
    advanceOnboarding();
  };

  const markProtectionStateFromPermissions = () => {
    if (automaticCaptureAvailable && foregroundReady && backgroundReady) {
      setProtectionSetupState('configured');
    } else if (foregroundReady && !backgroundReady) {
      setProtectionSetupState('limited');
    } else {
      setProtectionSetupState('educated');
    }
  };

  const continueAfterPermissions = () => {
    markProtectionStateFromPermissions();
    patchOnboarding({
      permissionsEducationAcknowledged: true,
      completedSteps: [...product.onboarding.completedSteps, 'permissions_education'],
    });
    advanceOnboarding();
  };

  const protectionPanels = useMemo(
    () => [
      ['A drive happens', 'MileRecover can quietly notice movement when you turn watching on.'],
      ['You stay in control', 'Anything uncertain waits in Review. We never invent miles or silently decide work vs personal.'],
    ],
    [],
  );

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
          <Text style={[text.headline, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Your miles. Protected. Nothing left behind.
          </Text>
          <Text style={[text.body, { marginBottom: spacing.sm }]}>
            Capture, recover, review, and prove your work mileage — without inventing anything.
          </Text>
          <CarRouteHero />
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <PrimaryButton
              label="Protect my miles"
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
                setOnboardingStep('driving_pattern');
              }}
            />
          </View>
        </View>
      ) : null}

      {step === 'primary_goal' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>
            What do you need MileRecover to protect?
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
          <Text style={[text.title, { marginBottom: spacing.sm }]}>What usually causes the most trouble?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Tap anything that sounds familiar. One is enough to continue.
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

      {step === 'driving_pattern' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>How do your work drives look?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            This helps us use the right words. Tap one.
          </Text>
          {DRIVING_PATTERN_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.id}
              title={opt.label}
              selected={product.drivingType === opt.id}
              onPress={() => {
                setDrivingType(opt.id);
                advanceOnboarding();
              }}
            />
          ))}
        </View>
      ) : null}

      {step === 'preferred_name' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>What should we call you?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Optional. We’ll only use this occasionally inside MileRecover and on reports you choose to create.
          </Text>
          <FormField
            label="Preferred name"
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="First name"
          />
          <PrimaryButton
            label="Continue"
            onPress={() => {
              setPreferredName(nameDraft.trim() || null);
              advanceOnboarding();
            }}
          />
          <TertiaryButton
            label="Skip for now"
            onPress={() => {
              setPreferredName(null);
              skipPreferredName();
            }}
          />
        </View>
      ) : null}

      {step === 'vehicle_setup' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>Which vehicle carries your work miles?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Skip is fine. You can add one from Profile anytime.
          </Text>
          {vehicleMode === 'choice' ? (
            <>
              <SelectionCard
                title="Add my vehicle"
                body="Optional — helps reports stay clear."
                selected={false}
                onPress={() => setVehicleMode('form')}
              />
              <PrimaryButton label="Skip for now" onPress={skipVehicleSetup} />
            </>
          ) : (
            <>
              <FormField
                label="Nickname"
                value={vehicleNickname}
                onChangeText={setVehicleNickname}
                placeholder="Work sedan"
              />
              <Text style={[text.caption, { marginBottom: spacing.xs }]}>Year</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
                {YEARS.slice(0, 6).map((year) => (
                  <SecondaryButton key={year} label={vehicleYear === year ? `${year} selected` : year} onPress={() => setVehicleYear(year)} />
                ))}
              </View>
              <Text style={[text.caption, { marginBottom: spacing.xs }]}>Make</Text>
              {MAKES.slice(0, 8).map((make) => (
                <SelectionCard
                  key={make}
                  title={make}
                  selected={vehicleMake === make}
                  onPress={() => {
                    setVehicleMake(make);
                    setVehicleModel('');
                  }}
                />
              ))}
              {availableModels.length > 0 ? (
                <>
                  <Text style={[text.caption, { marginBottom: spacing.xs }]}>Model</Text>
                  {availableModels.map((model) => (
                    <SelectionCard
                      key={model}
                      title={model}
                      selected={vehicleModel === model}
                      onPress={() => setVehicleModel(model)}
                    />
                  ))}
                </>
              ) : null}
              <PrimaryButton
                label="Save vehicle and continue"
                onPress={() => saveVehicle(true)}
                disabled={!vehicleMake || !vehicleModel}
              />
              <TertiaryButton label="Skip for now" onPress={skipVehicleSetup} />
            </>
          )}
        </View>
      ) : null}

      {step === 'familiar_places' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>Places you visit often make review faster</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Optional. Nothing is saved until you tap Continue. You can add more later in Profile.
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.md }}>
            {[
              ['home', 'Home'],
              ['workplace', 'Workplace'],
              ['client', 'Client'],
            ].map(([kind, label]) => (
              <SecondaryButton
                key={kind}
                label={label}
                onPress={() => {
                  setPlaceKind(kind as 'home' | 'workplace' | 'client');
                  setWorkLabel(label);
                }}
              />
            ))}
          </View>
          <FormField label="Name" value={workLabel} onChangeText={setWorkLabel} placeholder="Office" />
          <FormField
            label="Address or area"
            value={workAddress}
            onChangeText={setWorkAddress}
            placeholder="Street, city, or neighborhood"
          />
          <PrimaryButton label="Continue" onPress={saveWorkPlace} />
          <TertiaryButton label="Skip for now" onPress={skipWorkPlaceSetup} />
        </View>
      ) : null}

      {step === 'protection_education' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>How protection works</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            You stay in control. MileRecover can suggest, but it never silently decides uncertain drives or invents mileage.
          </Text>
          <CarRouteHero compact />
          {protectionPanels.map(([title, body]) => (
            <SoftPanel key={title}>
              <Text style={[text.subtitle, { marginBottom: spacing.xs }]}>{title}</Text>
              <Text style={text.body}>{body}</Text>
            </SoftPanel>
          ))}
          <PrimaryButton
            label="Continue"
            onPress={() => {
              setProtectionSetupState('educated');
              patchOnboarding({
                protectionEducationAcknowledged: true,
                completedSteps: [...product.onboarding.completedSteps, 'protection_education'],
              });
              advanceOnboarding();
            }}
          />
        </View>
      ) : null}

      {step === 'permissions_education' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>Let MileRecover watch future drives</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            We’ll ask one permission at a time. You can continue even if you say not now — change this anytime in Settings.
          </Text>
          <SoftPanel>
            <Text style={text.body}>While using the app: {permissionStatusLabel(permissions.location)}</Text>
            <Text style={text.body}>In the background: {permissionStatusLabel(permissions.backgroundLocation)}</Text>
            <Text style={[text.caption, { marginTop: spacing.sm }]}>
              Location while using the app is enough to start. Background helps catch drives when the app isn’t open.
              {automaticCaptureAvailable ? '' : ' Auto-tracking isn’t available on this device yet.'}
            </Text>
          </SoftPanel>
          <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            <PrimaryButton
              label={requestedForeground ? 'Asked — check the system prompt' : 'Allow location while using the app'}
              onPress={() => {
                setRequestedForeground(true);
                void requestLocationPermission();
              }}
            />
            <SecondaryButton
              label={requestedBackground ? 'Asked — check the system prompt' : 'Allow location in the background'}
              onPress={() => {
                setRequestedBackground(true);
                void requestBackgroundPermission();
              }}
              disabled={!requestedForeground && !foregroundReady}
              accessibilityLabel="Allow location in the background"
            />
          </View>
          <StatusCard
            variant="neutral"
            title="You can finish without this"
            body="Manual drives and imports still work. Turn watching on later from Home or Profile."
            emphasis="subtle"
          />
          <PrimaryButton
            label="Continue"
            onPress={() => {
              continueAfterPermissions();
            }}
          />
        </View>
      ) : null}

      {step === 'ready' ? (
        <View>
          <StatusCard
            variant="success"
            title="You’re ready"
            body={readyBody(product.primaryGoal, product.selectedPainPoints)}
            emphasis="hero"
          />
          <Text style={[text.caption, { marginBottom: spacing.md }]}>
            {PRIMARY_GOAL_OPTIONS.find((g) => g.id === product.primaryGoal)?.label ?? 'Your miles'}
            {' · '}
            {optionLabel(DRIVING_PATTERN_OPTIONS, product.drivingType)}
          </Text>
          <PrimaryButton
            label="Go to Home"
            onPress={() => finish(false)}
            accessibilityLabel="Finish onboarding and go to Home"
          />
          <View style={{ marginTop: spacing.sm }}>
            <SecondaryButton
              label={next.cta}
              onPress={() => finish(true)}
              accessibilityLabel={next.cta}
            />
          </View>
        </View>
      ) : null}
    </OnboardingScreen>
  );
}
