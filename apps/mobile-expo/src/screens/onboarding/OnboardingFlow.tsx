import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
import {
  DRIVING_TYPE_OPTIONS,
  ONBOARDING_STEP_ORDER,
  PAIN_POINT_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  type DrivingType,
  type PainPoint,
  type PrimaryGoal,
} from '../../product/types';
import { nextActionForGoal } from '../../product/copy';
import {
  ChecklistRow,
  FormField,
  OnboardingScreen,
  PrimaryButton,
  ProgressIndicator,
  SecondaryButton,
  SelectionCard,
  SoftPanel,
  StatusCard,
  TertiaryButton,
  WelcomeHero,
  text,
} from '../../design-system';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';

function permissionStatusLabel(status: string): string {
  if (status === 'granted') return 'Granted';
  if (status === 'denied') return 'Denied';
  if (status === 'restricted') return 'Open Settings';
  return 'Not asked yet';
}

function makeLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
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
  const [vehicleNickname, setVehicleNickname] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [workLabel, setWorkLabel] = useState('');
  const [workAddress, setWorkAddress] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const step = product.onboardingStep;
  const stepIndex = Math.max(0, ONBOARDING_STEP_ORDER.indexOf(step));
  const next = nextActionForGoal(product.primaryGoal);
  const foregroundReady = permissions.location === 'granted';
  const backgroundReady = permissions.backgroundLocation === 'granted';
  const selectedPainPoints = product.selectedPainPoints;

  const finish = (deepLink: boolean) => {
    completeProductOnboarding(deepLink ? next.route : null);
    finishOnboarding();
  };

  const saveVehicle = () => {
    const hasVehicle = vehicleNickname.trim() || vehicleMake.trim() || vehicleModel.trim();
    if (hasVehicle) {
      upsertVehicle({
        id: makeLocalId('vehicle'),
        nickname: vehicleNickname.trim() || [vehicleMake.trim(), vehicleModel.trim()].filter(Boolean).join(' ') || 'My vehicle',
        make: vehicleMake.trim(),
        model: vehicleModel.trim(),
        isPrimary: product.vehicles.length === 0,
      });
    }
    advanceOnboarding();
  };

  const togglePainPoint = (painPoint: PainPoint) => {
    const nextPainPoints = selectedPainPoints.includes(painPoint)
      ? selectedPainPoints.filter((item) => item !== painPoint)
      : [...selectedPainPoints, painPoint];
    setSelectedPainPoints(nextPainPoints);
  };

  const saveWorkPlace = () => {
    const hasWorkPlace = workLabel.trim() || workAddress.trim() || workNotes.trim();
    if (hasWorkPlace) {
      upsertWorkLocation({
        id: makeLocalId('work-place'),
        label: workLabel.trim() || 'Work place',
        address: workAddress.trim(),
        notes: workNotes.trim(),
      });
    }
    advanceOnboarding();
  };

  const continueAfterProtection = () => {
    if (automaticCaptureAvailable && foregroundReady && backgroundReady) {
      setProtectionSetupState('configured');
    } else if (foregroundReady && !backgroundReady) {
      setProtectionSetupState('limited');
    } else {
      setProtectionSetupState('educated');
    }
    advanceOnboarding();
  };

  const continueAfterPermissions = () => {
    patchOnboarding({
      permissionsEducationAcknowledged: true,
      completedSteps: [...product.onboarding.completedSteps, 'permissions_education'],
    });
    advanceOnboarding();
  };

  const welcome = useMemo(
    () => ({
      title: 'Protect every work mile.',
      body: 'MileRecover saves future drives, helps find missing mileage, and prepares records you can share - without inventing miles.',
    }),
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
          <WelcomeHero title={welcome.title} body={welcome.body} />
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <PrimaryButton
              label="Get started"
              onPress={advanceOnboarding}
            />
            <SecondaryButton
              label="I have older mileage"
              onPress={() => {
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
              selected={product.primaryGoal === opt.id}
              onPress={() => {
                setPrimaryGoal(opt.id as PrimaryGoal);
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
          {DRIVING_TYPE_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.id}
              title={opt.label}
              selected={product.drivingType === opt.id}
              onPress={() => {
                setDrivingType(opt.id as DrivingType);
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
            Optional. A nickname makes reports easier to read later.
          </Text>
          <FormField
            label="Nickname"
            value={vehicleNickname}
            onChangeText={setVehicleNickname}
            placeholder="Work sedan"
          />
          <FormField label="Make" value={vehicleMake} onChangeText={setVehicleMake} placeholder="Toyota" />
          <FormField label="Model" value={vehicleModel} onChangeText={setVehicleModel} placeholder="Camry" />
          <PrimaryButton label="Save vehicle" onPress={saveVehicle} />
          <TertiaryButton label="Skip vehicle" onPress={skipVehicleSetup} />
        </View>
      ) : null}

      {step === 'familiar_places' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>Any regular work places?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Optional. Saved places can help explain routine work drives without sharing anything automatically.
          </Text>
          <FormField label="Label" value={workLabel} onChangeText={setWorkLabel} placeholder="Office" />
          <FormField
            label="Address"
            value={workAddress}
            onChangeText={setWorkAddress}
            placeholder="Street, city"
          />
          <FormField label="Notes" value={workNotes} onChangeText={setWorkNotes} placeholder="Optional context" />
          <PrimaryButton label="Save work place" onPress={saveWorkPlace} />
          <TertiaryButton label="Skip work place" onPress={skipWorkPlaceSetup} />
        </View>
      ) : null}

      {step === 'protection_education' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>How protection works</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            MileRecover saves observed location samples only when you enable tracking. It never marks a drive
            as work until you confirm it.
          </Text>
          <StatusCard
            variant="neutral"
            title="Your data stays yours"
            body="Trips live on this device first. Nothing is shared unless you choose to share it."
            emphasis="subtle"
          />
          <PrimaryButton
            label="Continue"
            onPress={() => {
              setProtectionSetupState('educated');
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
            <ChecklistRow label={`Location permission: ${permissionStatusLabel(permissions.location)}`} status={foregroundReady ? 'ready' : 'pending'} />
            <ChecklistRow label={`Background location: ${permissionStatusLabel(permissions.backgroundLocation)}`} status={backgroundReady ? 'ready' : 'pending'} />
            <ChecklistRow label="Battery optimization" status="planned" />
            <ChecklistRow label="Notifications" status="planned" />
            <ChecklistRow label="Tracking engine" status="planned" />
            <Text style={[text.caption, { marginTop: spacing.sm }]}>
              Foreground capture can work with location permission. Background capture may stay limited if the device
              or build does not allow it.
            </Text>
          </SoftPanel>
          <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            <PrimaryButton label="Request foreground location" onPress={() => void requestLocationPermission()} />
            <SecondaryButton
              label="Request background location"
              onPress={() => void requestBackgroundPermission()}
              disabled={!foregroundReady}
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
              continueAfterProtection();
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
            <Text style={text.body}>Driving: {DRIVING_TYPE_OPTIONS.find((d) => d.id === product.drivingType)?.label ?? 'Not set'}</Text>
            <Text style={text.body}>Vehicles: {product.vehicles.length}</Text>
            <Text style={text.body}>Work places: {product.workLocations.length}</Text>
            <Text style={text.body}>Protection: {automaticCaptureAvailable ? 'Ready when permissions are granted' : 'Tracking engine unavailable in this RC'}</Text>
          </SoftPanel>
          <StatusCard
            variant="success"
            title={next.title}
            body={next.body}
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
