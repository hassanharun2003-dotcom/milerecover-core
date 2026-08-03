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
  if (status === 'granted') return 'Granted';
  if (status === 'denied') return 'Denied';
  if (status === 'restricted') return 'Open Settings';
  return 'Not asked yet';
}

function makeLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

function optionLabel<T extends string>(options: { id: T; label: string }[], id: T | null): string {
  return options.find((option) => option.id === id)?.label ?? 'Not set';
}

function readyBody(goal: typeof PRIMARY_GOAL_OPTIONS[number]['id'] | null, pains: PainPoint[]): string {
  if (pains.includes('older_mileage')) {
    return 'We will help you catch up older mileage with review-first recovery. Nothing gets added without your confirmation.';
  }
  if (goal === 'employee_reimbursement') {
    return 'Your setup is ready for clean reimbursement records and future work-drive protection.';
  }
  if (goal === 'gig_delivery') {
    return 'Your setup is ready for delivery shifts, missed-drive review, and earnings-friendly mileage records.';
  }
  if (goal === 'self_employed_business') {
    return 'Your setup is ready for client drives and business records you can explain later.';
  }
  return 'Your setup is ready. Start with the next action that best protects your miles.';
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
      ['No fake miles', 'Manual entries, imports, and recovery suggestions require real details or your review.'],
      ['You decide work vs personal', 'MileRecover can surface a drive, but reports use only confirmed work drives.'],
      ['Local-first records', 'Your setup and trips are saved on this device first. You choose what to export.'],
      ['Tracking is controlled by you', 'Automatic capture starts only when you enable tracking and permissions allow it.'],
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
            MileRecover protects future drives, helps recover missed mileage, and prepares records you can explain.
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
            What would help you most right now?
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            One selection is enough. We will use it to choose your next step.
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
          <Text style={[text.title, { marginBottom: spacing.sm }]}>What gets in the way?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Pick at least one. This helps MileRecover decide what to show first.
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
          <Text style={[text.title, { marginBottom: spacing.sm }]}>How do you use work mileage?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            This changes how MileRecover talks - and what a report is for.
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
            Optional. Used sparingly - like a calm greeting, not on every card.
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
          <Text style={[text.title, { marginBottom: spacing.sm }]}>Add a vehicle?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Optional. A vehicle nickname can make reports easier to read later.
          </Text>
          {vehicleMode === 'choice' ? (
            <>
              <SelectionCard
                title="Add a vehicle"
                body="One vehicle is enough to start."
                selected={false}
                onPress={() => setVehicleMode('form')}
              />
              <SelectionCard
                title="I use more than one"
                body="Add the first now. You can add another before continuing."
                selected={false}
                onPress={() => setVehicleMode('form')}
              />
              <TertiaryButton label="Skip vehicle" onPress={skipVehicleSetup} />
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
              <SecondaryButton
                label="Save and add another"
                onPress={() => saveVehicle(false)}
                disabled={!vehicleMake || !vehicleModel}
              />
              <TertiaryButton label="Skip vehicle" onPress={skipVehicleSetup} />
            </>
          )}
        </View>
      ) : null}

      {step === 'familiar_places' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>Any regular work places?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Optional. Saved places can help explain routine work drives without sharing anything automatically.
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
          <FormField label="Label" value={workLabel} onChangeText={setWorkLabel} placeholder="Office" />
          <FormField
            label="Address"
            value={workAddress}
            onChangeText={setWorkAddress}
            placeholder="Street, city"
          />
          <PrimaryButton label="Save work place" onPress={saveWorkPlace} />
          <TertiaryButton label="Skip work place" onPress={skipWorkPlaceSetup} />
        </View>
      ) : null}

      {step === 'protection_education' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>How protection works</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            MileRecover saves observed location samples only when you enable tracking. It never marks a drive as work until you confirm it.
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
          <Text style={[text.title, { marginBottom: spacing.sm }]}>Permissions for automatic capture</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            We explain before any system prompt. We never mark a permission ready until the device says it is granted.
          </Text>
          <SoftPanel>
            <Text style={text.body}>Foreground location: {permissionStatusLabel(permissions.location)}</Text>
            <Text style={text.body}>Background location: {permissionStatusLabel(permissions.backgroundLocation)}</Text>
            <Text style={text.body}>Tracking engine: {automaticCaptureAvailable ? 'Available when plan allows' : 'Unavailable in this build'}</Text>
            <Text style={[text.caption, { marginTop: spacing.sm }]}>
              Foreground capture can work with location permission. Background capture may stay limited if the device
              or build does not allow it.
            </Text>
          </SoftPanel>
          <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            <PrimaryButton
              label={requestedForeground ? 'Foreground requested' : 'Request foreground location'}
              onPress={() => {
                setRequestedForeground(true);
                void requestLocationPermission();
              }}
            />
            <SecondaryButton
              label={requestedBackground ? 'Background requested' : 'Request background location'}
              onPress={() => {
                setRequestedBackground(true);
                void requestBackgroundPermission();
              }}
              disabled={!requestedForeground && !foregroundReady}
              accessibilityLabel="Request background location permission"
            />
          </View>
          <StatusCard
            variant="neutral"
            title="You can change this later"
            body="You can continue now and enable tracking after setup."
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
          <SoftPanel>
            <Text style={[text.subtitle, { marginBottom: spacing.sm }]}>Your setup</Text>
            <Text style={text.body}>Goal: {PRIMARY_GOAL_OPTIONS.find((g) => g.id === product.primaryGoal)?.label ?? 'Protect future drives'}</Text>
            <Text style={text.body}>Pain points: {product.selectedPainPoints.length}</Text>
            <Text style={text.body}>Driving: {optionLabel(DRIVING_PATTERN_OPTIONS, product.drivingType)}</Text>
            <Text style={text.body}>Vehicles: {product.vehicles.length}</Text>
            <Text style={text.body}>Work places: {product.workLocations.length}</Text>
            <Text style={text.body}>Protection: {foregroundReady ? 'Permission path started' : 'Can be enabled later'}</Text>
          </SoftPanel>
          <StatusCard
            variant="success"
            title={next.title}
            body={`${readyBody(product.primaryGoal, product.selectedPainPoints)} ${next.body}`}
            emphasis="hero"
          />
          <PrimaryButton
            label={next.cta}
            onPress={() => finish(true)}
            accessibilityLabel={next.cta}
          />
          <View style={{ marginTop: spacing.sm }}>
            <SecondaryButton
              label="Go to Home"
              onPress={() => finish(false)}
              accessibilityLabel="Finish onboarding and go to Home"
            />
          </View>
        </View>
      ) : null}
    </OnboardingScreen>
  );
}
