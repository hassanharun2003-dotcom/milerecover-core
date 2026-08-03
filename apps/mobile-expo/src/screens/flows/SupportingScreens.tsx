import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  EvidenceRow,
  FormField,
  ListSection,
  LoadingState,
  PlanCard,
  PrimaryButton,
  ScrollScreen,
  SecondaryButton,
  SectionHeader,
  StatusCard,
  text,
} from '../../design-system';
import { PLAN_FIXTURES, RESCUE_OPTIONS } from '../../fixtures/subscription';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ManualTripScreen() {
  const navigation = useNavigation<Nav>();
  const { addManualTrip } = useProduct();
  const [distance, setDistance] = useState('12.4');
  const [purpose, setPurpose] = useState('Client visit');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const miles = parseFloat(distance);
    if (!distance.trim() || Number.isNaN(miles) || miles <= 0) {
      setError('Enter a distance greater than zero.');
      return;
    }
    if (!purpose.trim()) {
      setError('Add a short purpose so future you remembers this drive.');
      return;
    }
    setError(null);
    addManualTrip({ date: 'Today', distanceMiles: miles, purpose: purpose.trim() });
    navigation.goBack();
  };

  return (
    <ScrollScreen>
      <SectionHeader title="Add manual trip" />
      <StatusCard variant="info" title="Manual entry" body="Use this when a drive was not captured automatically. You stay in control." />
      <FormField label="Date" value="Today" />
      <FormField label="Distance (miles)" value={distance} onChangeText={setDistance} placeholder="0.0" />
      <FormField label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="Client visit" />
      {error ? <Text style={[text.body, { color: '#B91C1C', marginBottom: spacing.sm }]} accessibilityRole="alert">{error}</Text> : null}
      <PrimaryButton label="Save manual trip" onPress={save} />
    </ScrollScreen>
  );
}

export function TripDetailsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'TripDetails'>>();
  return (
    <ScrollScreen>
      <SectionHeader title="Trip details" />
      <StatusCard variant="info" title="Uncertain route" body="Review the approximate route and confirm whether this was work." />
      <ListSection title="Provenance">
        <EvidenceRow label="Source" value="Partially recorded" />
        <EvidenceRow label="Confidence" value="Approximate" />
        <EvidenceRow label="Trip id" value={route.params.tripId} />
      </ListSection>
    </ScrollScreen>
  );
}

export function MissingTripRecoveryScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'MissingTripRecovery'>>();
  const navigation = useNavigation<Nav>();
  const { setReviewDecision } = useProduct();
  return (
    <ScrollScreen>
      <SectionHeader title="Missing trip recovery" />
      <StatusCard
        variant="warning"
        title="Was this a work drive?"
        body="MileRecover noticed your phone was unavailable during part of this period. We are asking—not assuming."
      />
      <ListSection title="Evidence">
        <EvidenceRow label="Status" value="Suggested recovery" />
        <EvidenceRow label="Recording" value="Partially recorded gap" />
        <EvidenceRow label="Distance" value="Approximate" />
      </ListSection>
      <PrimaryButton label="Yes, work" onPress={() => { setReviewDecision(route.params.reviewId, 'work'); navigation.goBack(); }} />
      <SecondaryButton label="Personal" onPress={() => { setReviewDecision(route.params.reviewId, 'personal'); navigation.goBack(); }} />
      <SecondaryButton label="Not a drive" onPress={() => { setReviewDecision(route.params.reviewId, 'not_drive'); navigation.goBack(); }} />
    </ScrollScreen>
  );
}

export function ProtectionAlertScreen() {
  const navigation = useNavigation<Nav>();

  const openSystemSettings = () => {
    void Linking.openSettings().catch(() => {
      // If the OS blocks settings deep links, keep the user on this honest guidance screen.
    });
  };

  return (
    <ScrollScreen>
      <SectionHeader title="Protection alert" />
      <StatusCard
        variant="warning"
        title="Protection needs attention"
        body="Background tracking may be restricted. Open system settings to restore location and background access when you are ready."
        actionLabel="Open system settings"
        onAction={openSystemSettings}
      />
      <StatusCard variant="neutral" title="What this means" body="Miles may not be captured while protection is limited. Existing records stay safe." />
      <SecondaryButton label="Back" onPress={() => navigation.goBack()} accessibilityLabel="Go back from protection alert" />
    </ScrollScreen>
  );
}

export function VehicleSetupScreen() {
  return (
    <ScrollScreen>
      <SectionHeader title="Vehicles" />
      <FormField label="Primary vehicle" value="Primary vehicle" />
      <StatusCard variant="info" title="Optional but helpful" body="Naming your vehicle makes reports clearer." />
    </ScrollScreen>
  );
}

export function WorkLocationSetupScreen() {
  return (
    <ScrollScreen>
      <SectionHeader title="Work locations" />
      <FormField label="Office" value="Add an address" placeholder="Street, city" />
      <StatusCard variant="info" title="Used for context only" body="Work locations help MileRecover understand routine—not to surveil you." />
    </ScrollScreen>
  );
}

export function ExportReportScreen() {
  const navigation = useNavigation<Nav>();
  const [phase, setPhase] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  if (phase === 'processing') {
    return (
      <ScrollScreen>
        <SectionHeader title="Export report" />
        <LoadingState message="Preparing export…" />
      </ScrollScreen>
    );
  }

  if (phase === 'success') {
    return (
      <ScrollScreen>
        <SectionHeader title="Export report" />
        <StatusCard variant="success" title="Export ready" body="Your file reflects confirmed and reviewed records only." actionLabel="Done" onAction={() => setPhase('idle')} />
      </ScrollScreen>
    );
  }

  if (phase === 'failed') {
    return (
      <ScrollScreen>
        <SectionHeader title="Export report" />
        <StatusCard variant="danger" title="Export failed" body="Try again in a moment. Your records are still safe on this device." actionLabel="Retry export" onAction={() => setPhase('processing')} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <SectionHeader title="Export report" />
      <StatusCard variant="info" title="Choose a format" body="Exports reflect confirmed and reviewed records only. No employer or tax approval is implied." />
      <PrimaryButton
        label="Export as CSV"
        onPress={() => {
          setPhase('processing');
          setTimeout(() => setPhase('success'), 600);
        }}
      />
      <PrimaryButton
        label="Export as PDF"
        onPress={() => navigation.navigate('ReportPreview', { format: 'pdf' })}
      />
    </ScrollScreen>
  );
}

export function ReportPreviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ReportPreview'>>();
  return (
    <ScrollScreen>
      <SectionHeader title="Report preview" />
      <StatusCard
        variant="success"
        title={`${route.params.format.toUpperCase()} preview`}
        body="This is a visual placeholder. No employer approval, tax compliance, or guaranteed audit acceptance is implied."
      />
      <ListSection title="Summary">
        <EvidenceRow label="Reporting period" value="Current period" />
        <EvidenceRow label="Verified trips" value="Included" />
        <EvidenceRow label="Unresolved items" value="Excluded until reviewed" />
      </ListSection>
    </ScrollScreen>
  );
}

export function PlanSelectionScreen() {
  const navigation = useNavigation<Nav>();
  const { setSelectedPlan } = useProduct();
  const [annual, setAnnual] = useState(false);
  return (
    <ScrollScreen>
      <SectionHeader title="Choose your plan" />
      <StatusCard variant="info" title="Upgrade when it helps" body="No countdowns. No hidden trials. Subscribe because MileRecover already helped you." />
      <SecondaryButton label={annual ? 'Show monthly prices' : 'Show annual prices'} onPress={() => setAnnual((v) => !v)} />
      {PLAN_FIXTURES.filter((p) => p.id !== 'free').map((plan) => (
        <PlanCard
          key={plan.id}
          name={plan.name}
          price={annual ? plan.annualPrice : plan.monthlyPrice}
          period={annual ? 'year' : 'month'}
          features={plan.features.slice(0, 4)}
          highlighted={plan.highlighted}
          onSelect={() => {
            setSelectedPlan(plan.id);
            navigation.goBack();
          }}
        />
      ))}
      <SectionHeader title="One-time rescue" />
      {RESCUE_OPTIONS.map((r) => (
        <StatusCard key={r.id} variant="neutral" title={r.name} body={`${r.description} · ${r.price} · no subscription required`} />
      ))}
    </ScrollScreen>
  );
}

export function HelpSupportScreen() {
  return (
    <ScrollScreen>
      <SectionHeader title="Help and support" />
      <StatusCard variant="info" title="We are here" body="Questions about protection, review, or proof? Reach out anytime." />
    </ScrollScreen>
  );
}
