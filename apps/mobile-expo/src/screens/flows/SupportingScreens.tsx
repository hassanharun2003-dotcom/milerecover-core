import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  FormField,
  PrimaryButton,
  ScrollScreen,
  SectionHeader,
  StatusCard,
  text,
} from '../../design-system';
import { PLAN_FIXTURES, RESCUE_OPTIONS } from '../../fixtures/subscription';
import { PlanCard } from '../../design-system';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ManualTripScreen() {
  const navigation = useNavigation<Nav>();
  const { addManualTrip } = useProduct();
  const [distance, setDistance] = useState('12.4');
  const [purpose, setPurpose] = useState('Client visit');

  return (
    <ScrollScreen>
      <SectionHeader title="Add manual trip" />
      <StatusCard variant="info" title="Manual entry" body="Use this when a drive was not captured automatically. You stay in control." />
      <FormField label="Date" value="Today" />
      <FormField label="Distance (miles)" value={distance} onChangeText={setDistance} />
      <FormField label="Purpose" value={purpose} onChangeText={setPurpose} />
      <PrimaryButton
        label="Save manual trip"
        onPress={() => {
          addManualTrip({ date: 'Today', distanceMiles: parseFloat(distance) || 0, purpose });
          navigation.goBack();
        }}
      />
    </ScrollScreen>
  );
}

export function TripDetailsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'TripDetails'>>();
  return (
    <ScrollScreen>
      <SectionHeader title="Trip details" />
      <StatusCard variant="info" title={`Trip ${route.params.tripId}`} body="Route summary and provenance will appear here when tracking is enabled." />
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
      <PrimaryButton label="Yes, work" onPress={() => { setReviewDecision(route.params.reviewId, 'work'); navigation.goBack(); }} />
      <PrimaryButton label="Personal" onPress={() => { setReviewDecision(route.params.reviewId, 'personal'); navigation.goBack(); }} />
    </ScrollScreen>
  );
}

export function ProtectionAlertScreen() {
  return (
    <ScrollScreen>
      <SectionHeader title="Protection alert" />
      <StatusCard
        variant="warning"
        title="Protection needs attention"
        body="Background tracking may be restricted. Open system settings to restore full protection when you are ready."
        actionLabel="Open guidance"
        onAction={() => undefined}
      />
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
      <FormField label="Office" value="Add an address" />
      <StatusCard variant="info" title="Used for context only" body="Work locations help MileRecover understand routine—not to surveil you." />
    </ScrollScreen>
  );
}

export function ExportReportScreen() {
  const navigation = useNavigation<Nav>();
  return (
    <ScrollScreen>
      <SectionHeader title="Export report" />
      <StatusCard variant="info" title="Choose a format" body="Exports reflect confirmed and reviewed records only." />
      <PrimaryButton label="CSV mileage log" onPress={() => navigation.navigate('ReportPreview', { format: 'csv' })} />
      <PrimaryButton label="PDF reimbursement report" onPress={() => navigation.navigate('ReportPreview', { format: 'pdf' })} />
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
        body="This is a visual placeholder. No employer approval or tax compliance is implied."
      />
    </ScrollScreen>
  );
}

export function PlanSelectionScreen() {
  const navigation = useNavigation<Nav>();
  const { setSelectedPlan } = useProduct();
  const [annual, setAnnual] = useState(true);
  return (
    <ScrollScreen>
      <SectionHeader title="Choose your plan" />
      <StatusCard variant="info" title="Upgrade when it helps" body="No countdowns. No hidden trials. Subscribe because MileRecover already helped you." />
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
      {RESCUE_OPTIONS.map((r) => (
        <StatusCard key={r.id} variant="neutral" title={r.name} body={`${r.description} · ${r.price}`} />
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
