import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '@milerecover/config';
import {
  DestructiveButton,
  EvidenceRow,
  FormError,
  FormField,
  ListSection,
  LoadingState,
  PlanCard,
  PrimaryButton,
  ScrollScreen,
  SecondaryButton,
  SectionHeader,
  SelectionCard,
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
  const [date, setDate] = useState('Today');
  const [distance, setDistance] = useState('12.4');
  const [purpose, setPurpose] = useState('Client visit');
  const [attested, setAttested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const miles = parseFloat(distance);
    if (!date.trim()) {
      setError('Enter a date for this drive.');
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
      setError('Confirm that this distance is from your records or odometer.');
      return;
    }
    setError(null);
    addManualTrip({ date: date.trim(), distanceMiles: miles, purpose: purpose.trim() });
    navigation.goBack();
  };

  return (
    <ScrollScreen>
      <SectionHeader title="Add manual trip" />
      <StatusCard
        variant="info"
        title="Manual entry"
        body="Use this when a drive was not captured automatically. You stay in control—MileRecover never invents mileage."
      />
      <FormField label="Date" value={date} onChangeText={setDate} placeholder="Today or YYYY-MM-DD" />
      <FormField label="Distance (miles)" value={distance} onChangeText={setDistance} placeholder="0.0" />
      <FormField label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="Client visit" />
      <SelectionCard
        title="I attest this distance is from my records or odometer"
        body="Required for manual miles so exports stay honest."
        selected={attested}
        onPress={() => setAttested((v) => !v)}
      />
      {error ? <FormError message={error} /> : null}
      <PrimaryButton label="Save manual trip" onPress={save} />
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
      <SectionHeader title="Trip details" />
      <StatusCard
        variant="info"
        title="Uncertain route"
        body="Review the approximate route and confirm whether this was work. Reject only if this drive did not happen."
      />
      <ListSection title="Provenance">
        <EvidenceRow label="Source" value="Partially recorded" />
        <EvidenceRow label="Confidence" value="Approximate" />
        <EvidenceRow label="Trip id" value={tripId} />
      </ListSection>
      <PrimaryButton
        label="Business"
        onPress={() => {
          setReviewDecision(tripId, 'work');
          navigation.goBack();
        }}
        accessibilityLabel="Classify as business"
      />
      <SecondaryButton
        label="Personal"
        onPress={() => {
          setReviewDecision(tripId, 'personal');
          navigation.goBack();
        }}
      />
      <DestructiveButton
        label="Reject — not a drive"
        onPress={() => {
          setReviewDecision(tripId, 'not_drive');
          navigation.goBack();
        }}
        accessibilityLabel="Reject trip as not a drive"
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
      <SecondaryButton
        label="View tracking status"
        onPress={() => navigation.navigate('TrackingActive')}
        accessibilityLabel="View tracking status stub"
      />
      <SecondaryButton label="Back" onPress={() => navigation.goBack()} accessibilityLabel="Go back from protection alert" />
    </ScrollScreen>
  );
}

export function TrackingActiveScreen() {
  return (
    <ScrollScreen>
      <SectionHeader title="Tracking status" />
      <StatusCard
        variant="info"
        title="Tracking engine not active yet"
        body="Background location and trip detection arrive in a later milestone. Until then, protection guidance and manual entry keep you honest."
      />
      <ListSection title="Honest status">
        <EvidenceRow label="Engine" value="Unavailable" />
        <EvidenceRow label="Background location" value="Not granted yet" />
        <EvidenceRow label="Screen-off capture" value="Planned" />
      </ListSection>
      <StatusCard
        variant="neutral"
        title="What you can do now"
        body="Add manual trips for drives you remember, and keep review decisions current. MileRecover will never invent miles while tracking is offline."
      />
    </ScrollScreen>
  );
}

export function VehicleSetupScreen() {
  const { product, upsertVehicle } = useProduct();
  const primary = product.vehicles[0] ?? { id: 'vehicle-1', label: 'Primary vehicle' };
  const [label, setLabel] = useState(primary.label);
  const [saved, setSaved] = useState(false);

  return (
    <ScrollScreen>
      <SectionHeader title="Vehicles" />
      <StatusCard variant="info" title="Optional but helpful" body="Naming your vehicle makes reports clearer. You can change this anytime." />
      <FormField label="Primary vehicle" value={label} onChangeText={(t) => { setLabel(t); setSaved(false); }} placeholder="e.g. Work sedan" />
      <PrimaryButton
        label="Save vehicle"
        onPress={() => {
          upsertVehicle({ id: primary.id, label: label.trim() || 'Primary vehicle' });
          setSaved(true);
        }}
      />
      {saved ? <StatusCard variant="info" title="Saved" body="Vehicle name updated on this device." /> : null}
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
      <SectionHeader title="Work locations" />
      <StatusCard
        variant="info"
        title="Used for context only"
        body="Work locations help MileRecover understand routine—not to surveil you. Address is optional until tracking arrives."
      />
      <FormField label="Label" value={label} onChangeText={(t) => { setLabel(t); setSaved(false); }} placeholder="Office" />
      <FormField
        label="Address"
        value={address}
        onChangeText={(t) => { setAddress(t); setSaved(false); }}
        placeholder="Street, city"
      />
      <PrimaryButton
        label="Save work location"
        onPress={() => {
          upsertWorkLocation({
            id: existing?.id ?? 'work-location-1',
            label: label.trim() || 'Office',
            address: address.trim(),
          });
          setSaved(true);
        }}
      />
      {saved ? <StatusCard variant="info" title="Saved" body="Work location stored locally for future context." /> : null}
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
      <SectionHeader title={route.params.title} />
      <StatusCard
        variant="info"
        title="Coming later"
        body={route.params.detail}
      />
      <StatusCard
        variant="neutral"
        title="Honest placeholder"
        body="This setting is intentionally not enabled yet. MileRecover will not pretend a control works before the underlying capability ships."
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
      <ListSection title="Common questions">
        <View style={{ gap: spacing.sm }}>
          <Text style={text.subtitle}>Why do trips need review?</Text>
          <Text style={[text.body, { marginBottom: spacing.sm }]}>
            MileRecover prefers trust over automation. Uncertain drives stay pending until you confirm.
          </Text>
          <Text style={text.subtitle}>Will MileRecover invent miles?</Text>
          <Text style={[text.body, { marginBottom: spacing.sm }]}>
            Never. Gaps stay visible. Manual entry requires your attestation.
          </Text>
          <Text style={text.subtitle}>When does tracking start?</Text>
          <Text style={text.body}>
            Background capture ships after the preview design lock. Until then, use manual trips and review.
          </Text>
        </View>
      </ListSection>
      <StatusCard
        variant="neutral"
        title="Contact"
        body="Email support@milerecover.com with your build label from Profile → About."
      />
      <Text style={[text.caption, { color: colors.text.secondary, marginTop: spacing.md }]}>
        Help center articles expand as the product ships.
      </Text>
    </ScrollScreen>
  );
}
