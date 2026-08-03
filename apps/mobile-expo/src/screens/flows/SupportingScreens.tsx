import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  DestructiveButton,
  EvidenceRow,
  FixedHeaderScrollScreen,
  FormError,
  FormField,
  ListSection,
  LoadingState,
  PlanCard,
  PrimaryButton,
  ScrollScreen,
  SecondaryButton,
  SelectionCard,
  SoftPanel,
  StatusCard,
  text,
} from '../../design-system';
import { PLAN_FIXTURES, RESCUE_OPTIONS } from '../../fixtures/subscription';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ManualTripScreen() {
  const navigation = useNavigation<Nav>();
  const { addManualTrip } = useProduct();
  const [date, setDate] = useState('Today');
  const [distance, setDistance] = useState('12.4');
  const [purpose, setPurpose] = useState('Client visit');
  const [attested, setAttested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const miles = parseFloat(distance);
    if (!date.trim()) {
      setError('Add a date for this drive.');
      return;
    }
    if (!distance.trim() || Number.isNaN(miles) || miles <= 0) {
      setError('Enter a distance greater than zero.');
      return;
    }
    if (!purpose.trim()) {
      setError('Add a short purpose so future you remembers this drive.');
      return;
    }
    if (!attested) {
      setError('Confirm this distance matches your notes or odometer.');
      return;
    }
    setError(null);
    addManualTrip({ date: date.trim(), distanceMiles: miles, purpose: purpose.trim() });
    navigation.goBack();
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Add a drive yourself"
        body="Use this when something wasn’t captured automatically. You stay in control—we never invent miles."
        emphasis="subtle"
      />
      <FormField label="Date" value={date} onChangeText={setDate} placeholder="Today or YYYY-MM-DD" />
      <FormField label="Distance (miles)" value={distance} onChangeText={setDistance} placeholder="0.0" />
      <FormField label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="Client visit" />
      <SelectionCard
        title="This distance matches my notes or odometer"
        body="So your log stays trustworthy when you share it."
        selected={attested}
        onPress={() => setAttested((v) => !v)}
      />
      {error ? <FormError message={error} /> : null}
      <PrimaryButton label="Save drive" onPress={save} />
    </ScrollScreen>
  );
}

export function TripDetailsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'TripDetails'>>();
  const navigation = useNavigation<Nav>();
  const { setReviewDecision } = useProduct();
  const tripId = route.params.tripId;

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="We're not sure yet"
        body="Take a quick look and tell us if this was work. Ten seconds and done."
        emphasis="subtle"
      />
      <ListSection title="How we saw this">
        <EvidenceRow label="Source" value="Partially recorded" />
        <EvidenceRow label="Confidence" value="Approximate" />
      </ListSection>
      <PrimaryButton
        label="Work"
        onPress={() => {
          setReviewDecision(tripId, 'work');
          navigation.goBack();
        }}
        accessibilityLabel="Classify as work"
      />
      <SecondaryButton
        label="Personal"
        onPress={() => {
          setReviewDecision(tripId, 'personal');
          navigation.goBack();
        }}
      />
      <DestructiveButton
        label="Wasn't a drive"
        onPress={() => {
          setReviewDecision(tripId, 'not_drive');
          navigation.goBack();
        }}
        accessibilityLabel="Reject as not a drive"
      />
    </ScrollScreen>
  );
}

export function MissingTripRecoveryScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'MissingTripRecovery'>>();
  const navigation = useNavigation<Nav>();
  const { setReviewDecision } = useProduct();
  return (
    <ScrollScreen>
      <StatusCard
        variant="warning"
        title="Was this a work drive?"
        body="Your phone was quiet for part of this stretch. We’re asking—not assuming."
        emphasis="hero"
      />
      <ListSection title="Why we’re asking">
        <EvidenceRow label="Status" value="Might have missed a drive" />
        <EvidenceRow label="Recording" value="Quiet stretch" />
        <EvidenceRow label="Distance" value="About 14.2 mi" />
      </ListSection>
      <PrimaryButton
        label="Yes, work"
        onPress={() => {
          setReviewDecision(route.params.reviewId, 'work');
          navigation.goBack();
        }}
      />
      <SecondaryButton
        label="Personal"
        onPress={() => {
          setReviewDecision(route.params.reviewId, 'personal');
          navigation.goBack();
        }}
      />
      <SecondaryButton
        label="Not a drive"
        onPress={() => {
          setReviewDecision(route.params.reviewId, 'not_drive');
          navigation.goBack();
        }}
      />
    </ScrollScreen>
  );
}

export function ProtectionAlertScreen() {
  const navigation = useNavigation<Nav>();
  const { product, setProtectionSetupState } = useProduct();
  const unfinished =
    product.protectionSetupState === 'not_started' || product.protectionSetupState === 'educated';

  const openSystemSettings = () => {
    void Linking.openSettings().catch(() => {
      // Keep the user on this calm guidance screen if the deep link is blocked.
    });
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant={unfinished ? 'info' : 'warning'}
        title={unfinished ? 'Finish setting up protection' : 'Protection needs attention'}
        body={
          unfinished
            ? 'Automatic capture is not available in this preview. When it ships, we’ll ask for each permission after explaining it—never before.'
            : 'Background access is off, so a drive could be missed. What’s already saved stays put.'
        }
        actionLabel="Open Settings"
        onAction={openSystemSettings}
        emphasis="hero"
      />
      <SoftPanel>
        <EvidenceRow label="Location permission" value="Not granted yet" />
        <EvidenceRow label="Background location" value="Not granted yet" />
        <EvidenceRow label="Battery optimization" value="Not available in this preview" />
        <EvidenceRow label="Tracking engine" value="Not available in this preview" />
      </SoftPanel>
      {unfinished ? (
        <PrimaryButton
          label="I’ve reviewed these requirements"
          onPress={() => setProtectionSetupState('configured')}
          accessibilityLabel="Mark protection education complete"
        />
      ) : null}
      <SecondaryButton
        label="View tracking status"
        onPress={() => navigation.navigate('TrackingActive')}
        accessibilityLabel="View tracking status"
      />
      <SecondaryButton label="Back" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
    </ScrollScreen>
  );
}

export function TrackingActiveScreen() {
  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Automatic capture isn’t on yet"
        body="Until then, add drives you remember—and we’ll never invent miles for you."
        emphasis="hero"
      />
      <ListSection title="Status">
        <EvidenceRow label="Automatic capture" value="Not available in this preview" />
        <EvidenceRow label="Background location" value="Not granted yet" />
        <EvidenceRow label="Screen-off coverage" value="Not available in this preview" />
      </ListSection>
      <StatusCard
        variant="neutral"
        title="What you can do now"
        body="Add manual drives and keep Review current. You’re still covered for what you log."
        emphasis="subtle"
      />
    </ScrollScreen>
  );
}

export function VehicleSetupScreen() {
  const { product, upsertVehicle } = useProduct();
  const primary = product.vehicles[0];
  const [label, setLabel] = useState(primary?.label ?? '');
  const [saved, setSaved] = useState(false);

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Optional—but helpful"
        body="A clear vehicle name makes reports easier to read later. Nothing is saved until you choose Save."
        emphasis="subtle"
      />
      <FormField
        label="Vehicle name"
        value={label}
        onChangeText={(t) => {
          setLabel(t);
          setSaved(false);
        }}
        placeholder="e.g. Work sedan"
      />
      <PrimaryButton
        label="Save vehicle"
        onPress={() => {
          const trimmed = label.trim();
          if (!trimmed) return;
          upsertVehicle({ id: primary?.id ?? `vehicle-${Date.now()}`, label: trimmed });
          setSaved(true);
        }}
      />
      {saved ? (
        <StatusCard variant="info" title="Saved" body="Vehicle name updated on this device." emphasis="subtle" />
      ) : null}
    </ScrollScreen>
  );
}

export function WorkLocationSetupScreen() {
  const { product, upsertWorkLocation } = useProduct();
  const existing = product.workLocations[0];
  const [label, setLabel] = useState(existing?.label ?? 'Office');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [saved, setSaved] = useState(false);

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Familiar places, optional"
        body="Work places help MileRecover understand routine—not watch you. Address can wait."
        emphasis="subtle"
      />
      <FormField
        label="Label"
        value={label}
        onChangeText={(t) => {
          setLabel(t);
          setSaved(false);
        }}
        placeholder="Office"
      />
      <FormField
        label="Address"
        value={address}
        onChangeText={(t) => {
          setAddress(t);
          setSaved(false);
        }}
        placeholder="Street, city"
      />
      <PrimaryButton
        label="Save work place"
        onPress={() => {
          upsertWorkLocation({
            id: existing?.id ?? 'work-location-1',
            label: label.trim() || 'Office',
            address: address.trim(),
          });
          setSaved(true);
        }}
      />
      {saved ? (
        <StatusCard
          variant="info"
          title="Saved"
          body="Work place stored locally for future context."
          emphasis="subtle"
        />
      ) : null}
      {product.workLocations.length > 0 ? (
        <ListSection title="Saved">
          {product.workLocations.map((loc) => (
            <EvidenceRow key={loc.id} label={loc.label} value={loc.address || 'Address not set'} />
          ))}
        </ListSection>
      ) : null}
    </ScrollScreen>
  );
}

export function ComingLaterScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ComingLater'>>();
  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title={route.params.title}
        body={route.params.detail}
        emphasis="hero"
      />
      <StatusCard
        variant="neutral"
        title="Not available in this preview"
        body="We’ll turn this on when it’s ready—no fake toggles that pretend to work."
        emphasis="subtle"
      />
    </ScrollScreen>
  );
}

export function ExportReportScreen() {
  const navigation = useNavigation<Nav>();
  const [phase, setPhase] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  if (phase === 'processing') {
    return (
      <ScrollScreen>
        <LoadingState message="Preparing your file…" />
      </ScrollScreen>
    );
  }

  if (phase === 'success') {
    return (
      <ScrollScreen>
        <StatusCard
          variant="success"
          title="Your file is ready"
          body="It reflects confirmed and reviewed drives only."
          actionLabel="Done"
          onAction={() => setPhase('idle')}
          emphasis="hero"
        />
      </ScrollScreen>
    );
  }

  if (phase === 'failed') {
    return (
      <ScrollScreen>
        <StatusCard
          variant="danger"
          title="Couldn’t finish export"
          body="Try again in a moment. Your records are still safe on this device."
          actionLabel="Try again"
          onAction={() => setPhase('processing')}
          emphasis="hero"
        />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Share what you’ve confirmed"
        body="Exports include confirmed and reviewed drives only. This isn’t tax advice—just a clear log you control."
        emphasis="subtle"
      />
      <PrimaryButton
        label="Export as CSV"
        onPress={() => {
          setPhase('processing');
          setTimeout(() => setPhase('success'), 600);
        }}
      />
      <View style={{ marginTop: spacing.sm }}>
        <SecondaryButton
          label="Preview as PDF"
          onPress={() => navigation.navigate('ReportPreview', { format: 'pdf' })}
        />
      </View>
    </ScrollScreen>
  );
}

export function ReportPreviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ReportPreview'>>();
  const { product } = useProduct();
  const formatLabel = route.params.format.toUpperCase();
  const driveCount = product.manualTrips.length;
  const miles = product.manualTrips.reduce((sum, t) => sum + t.distanceMiles, 0);

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Preview sample"
        body={`${formatLabel} layout only. This is not a generated document—no employer or tax approval is implied.`}
        emphasis="hero"
      />
      <SoftPanel>
        <Text style={[text.subtitle, { marginBottom: spacing.sm }]}>Mileage report</Text>
        <EvidenceRow label="Period" value="Current period" />
        <EvidenceRow label="Driver" value={product.preferredName?.trim() || 'Not set'} />
        <EvidenceRow label="Confirmed work drives" value={String(driveCount)} />
        <EvidenceRow label="Total miles" value={miles > 0 ? miles.toFixed(1) : '0.0'} />
        <EvidenceRow label="Unresolved" value="Left out until reviewed" />
      </SoftPanel>
      <ListSection title="Sample line items">
        {driveCount === 0 ? (
          <StatusCard
            variant="neutral"
            title="No confirmed drives in this sample"
            body="When confirmed work drives exist, they’ll list here with date, purpose, and miles."
            emphasis="subtle"
          />
        ) : (
          product.manualTrips.slice(0, 5).map((t) => (
            <EvidenceRow
              key={t.id}
              label={t.purpose}
              value={`${t.date} · ${t.distanceMiles.toFixed(1)} mi`}
            />
          ))
        )}
      </ListSection>
    </ScrollScreen>
  );
}

export function PlanSelectionScreen() {
  const { product, setSelectedPlan } = useProduct();
  const [annual, setAnnual] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedRescue, setSelectedRescue] = useState<string | null>(null);

  const onChoosePlan = (planId: 'plus' | 'pro') => {
    const applied = setSelectedPlan(planId);
    if (applied) {
      setNotice(`${planId === 'plus' ? 'Plus' : 'Pro'} applied in demo mode only.`);
    } else {
      setNotice(
        'Preview only — billing is not connected. Your plan stays Free until a real purchase succeeds.',
      );
    }
  };

  return (
    <FixedHeaderScrollScreen
      header={
        <View>
          <Text style={text.subtitle}>Upgrade when it helps.</Text>
          <Text style={[text.caption, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            No countdowns. No hidden trials. Billing is not connected in this preview.
          </Text>
          <SecondaryButton
            label={annual ? 'Showing annual — switch to monthly' : 'Showing monthly — switch to annual'}
            onPress={() => setAnnual((v) => !v)}
            accessibilityLabel={annual ? 'Switch to monthly prices' : 'Switch to annual prices'}
          />
        </View>
      }
    >
      {notice ? (
        <StatusCard variant="info" title="Purchase preview" body={notice} emphasis="subtle" />
      ) : null}

      <PlanCard
        name="Free"
        tagline={PLAN_FIXTURES[0].tagline}
        price="$0"
        period={annual ? 'year' : 'month'}
        features={PLAN_FIXTURES[0].features}
        current={product.selectedPlan === 'free'}
        onSelect={() => {
          setSelectedPlan('free');
          setNotice('You remain on Free. Upgrade only when it helps.');
        }}
      />

      {PLAN_FIXTURES.filter((p) => p.id !== 'free').map((plan) => (
        <PlanCard
          key={plan.id}
          name={plan.name}
          tagline={plan.tagline}
          price={annual ? plan.annualPrice : plan.monthlyPrice}
          period={annual ? 'year' : 'month'}
          features={plan.features}
          highlighted={plan.highlighted}
          current={product.selectedPlan === plan.id}
          savingsLabel={annual ? plan.annualSavingsLabel : undefined}
          onSelect={() => onChoosePlan(plan.id as 'plus' | 'pro')}
        />
      ))}

      <Text style={[text.subtitle, { marginTop: spacing.md, marginBottom: spacing.sm }]}>
        One-time catch-up
      </Text>
      <Text style={[text.caption, { marginBottom: spacing.sm }]}>
        No subscription required. Preview selection only—billing is not connected.
      </Text>
      {RESCUE_OPTIONS.map((r) => (
        <SelectionCard
          key={r.id}
          title={`${r.name} · ${r.price}`}
          body={r.description}
          selected={selectedRescue === r.id}
          onPress={() => {
            setSelectedRescue(r.id);
            setNotice(
              `Preview only — ${r.name} is not purchased. Billing is not connected in this preview.`,
            );
          }}
        />
      ))}
    </FixedHeaderScrollScreen>
  );
}

export function HelpSupportScreen() {
  const { resetOnboarding } = useProduct();
  const { restartOnboarding } = useApp();

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="We’re here"
        body="Questions about protection, review, or sharing a report? Ask anytime."
        emphasis="subtle"
      />
      <ListSection title="Common questions">
        <View style={{ gap: spacing.sm }}>
          <Text style={text.subtitle}>Why do drives need review?</Text>
          <Text style={[text.body, { marginBottom: spacing.sm }]}>
            We prefer trust over automation. Uncertain drives stay pending until you confirm.
          </Text>
          <Text style={text.subtitle}>Will MileRecover invent miles?</Text>
          <Text style={[text.body, { marginBottom: spacing.sm }]}>
            Never. Gaps stay visible. Manual drives need your confirmation.
          </Text>
          <Text style={text.subtitle}>When does automatic capture start?</Text>
          <Text style={text.body}>
            Automatic tracking is not available in this preview. Manual drives and Review keep you honest.
          </Text>
        </View>
      </ListSection>
      <PrimaryButton
        label="Restart onboarding"
        onPress={() => {
          resetOnboarding();
          restartOnboarding();
        }}
        accessibilityLabel="Restart onboarding for preview testing"
      />
      <StatusCard
        variant="neutral"
        title="Contact"
        body="Email support@milerecover.com with your build label from Profile → About."
        emphasis="subtle"
      />
    </ScrollScreen>
  );
}
