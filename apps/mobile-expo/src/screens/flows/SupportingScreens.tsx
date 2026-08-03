import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  buildMileageCsv,
  buildMileageReportData,
  createManualTripRecord,
  csvFilename,
  formatDateLocal,
  formatTimeLocal,
  reportHasExportableTrips,
  validateManualTripInput,
  type MileageReportData,
  type ReportPeriod,
  type TripEvidenceMethod,
  type TripRecord,
} from '@milerecover/domain';
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
import type { RootStackParamList } from '../../navigation/types';
import { nextActionForGoal, voiceForDrivingType } from '../../product/copy';
import { useProduct } from '../../product/ProductContext';
import type { ReviewDecision, VehicleDraft } from '../../product/types';
import { writeTextFile, shareFile } from '../../services/fileShare';
import { generateAndSharePdf } from '../../services/pdfReport';
import { useApp } from '../../store/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const EVIDENCE_OPTIONS: { id: TripEvidenceMethod; label: string; body: string }[] = [
  { id: 'odometer', label: 'Odometer', body: 'Start/end odometer or written log.' },
  { id: 'map_estimate', label: 'Map estimate', body: 'Distance checked against a map.' },
  { id: 'calendar_receipt_note', label: 'Calendar, receipt, or note', body: 'Backed by another record.' },
  { id: 'user_estimate', label: 'My estimate', body: 'Best memory, clearly labeled.' },
];

function localId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

function parseDateAndTime(date: string, time: string): number | null {
  const match = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match || !timeMatch) return null;
  const ms = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0,
    0,
  ).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function periodFromState(period: { id: string; label: string; startAt: number; endAt: number }): ReportPeriod {
  return { kind: 'custom', ...period };
}

function vehicleLabel(vehicle: VehicleDraft): string {
  return vehicle.nickname || [vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle';
}

function vehicleLookup(vehicles: VehicleDraft[]): Record<string, string> {
  return vehicles.reduce<Record<string, string>>((acc, vehicle) => {
    acc[vehicle.id] = vehicleLabel(vehicle);
    return acc;
  }, {});
}

function reportData(
  trips: TripRecord[],
  period: ReportPeriod,
  userName: string | null,
  drivingType: ReturnType<typeof voiceForDrivingType> | null,
): MileageReportData {
  return buildMileageReportData({
    trips,
    period,
    userName,
    mileageUseType: drivingType?.reportNoun ?? null,
  });
}

export function ManualTripScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'ManualTrip'>>();
  const { state, upsertTrip, deleteTrip } = useApp();
  const { product } = useProduct();
  const existing = route.params?.tripId
    ? state.trips.find((trip) => trip.id === route.params?.tripId)
    : null;
  const [date, setDate] = useState(existing ? formatDateLocal(existing.startAt) : '');
  const [startTime, setStartTime] = useState(existing ? formatTimeLocal(existing.startAt) : '');
  const [endTime, setEndTime] = useState(existing ? formatTimeLocal(existing.endAt) : '');
  const [distance, setDistance] = useState(existing ? existing.distanceMiles.toString() : '');
  const [purpose, setPurpose] = useState(existing?.purpose ?? '');
  const [startLabel, setStartLabel] = useState(existing?.startLabel ?? '');
  const [endLabel, setEndLabel] = useState(existing?.endLabel ?? '');
  const [vehicleId, setVehicleId] = useState<string | null>(existing?.vehicleId ?? null);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [evidenceMethod, setEvidenceMethod] = useState<TripEvidenceMethod | null>(
    existing?.evidenceMethod ?? null,
  );
  const [confirmAsWork, setConfirmAsWork] = useState(existing?.classification === 'business');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const startAt = parseDateAndTime(date, startTime);
    const endAt = parseDateAndTime(date, endTime);
    if (startAt == null || endAt == null) {
      setError('Use date YYYY-MM-DD and times like 09:30.');
      return;
    }
    const input = {
      id: existing?.id,
      startAt,
      endAt,
      distanceMiles: Number.parseFloat(distance),
      purpose,
      startLabel,
      endLabel,
      vehicleId,
      notes,
      evidenceMethod: evidenceMethod ?? ('' as TripEvidenceMethod),
      confirmAsWork,
    };
    const errors = validateManualTripInput(input);
    if (errors.length > 0) {
      setError(errors.map((item) => item.message).join(' '));
      return;
    }
    const trip = createManualTripRecord(input);
    upsertTrip({
      ...trip,
      source: existing?.source ?? trip.source,
      createdAt: existing?.createdAt ?? trip.createdAt,
      updatedAt: Date.now(),
    });
    navigation.goBack();
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Delete this trip?', 'This removes the trip from your local record.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTrip(existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title={existing ? 'Edit this drive' : 'Add a drive yourself'}
        body="Use real notes, calendar details, odometer readings, or a clear estimate. MileRecover will not invent miles."
        emphasis="subtle"
      />
      <FormField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      <FormField label="Start time" value={startTime} onChangeText={setStartTime} placeholder="09:00" />
      <FormField label="End time" value={endTime} onChangeText={setEndTime} placeholder="10:00" />
      <FormField label="Distance (miles)" value={distance} onChangeText={setDistance} placeholder="0.0" />
      <FormField label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="Client visit" />
      <FormField label="Start label" value={startLabel} onChangeText={setStartLabel} placeholder="Home" />
      <FormField label="End label" value={endLabel} onChangeText={setEndLabel} placeholder="Client office" />
      {product.vehicles.length > 0 ? (
        <ListSection title="Vehicle">
          <EvidenceRow label="Selected" value={vehicleId ? vehicleLookup(product.vehicles)[vehicleId] : 'None'} />
          {product.vehicles.map((vehicle) => (
            <SelectionCard
              key={vehicle.id}
              title={vehicleLabel(vehicle)}
              selected={vehicleId === vehicle.id}
              onPress={() => setVehicleId(vehicleId === vehicle.id ? null : vehicle.id)}
            />
          ))}
        </ListSection>
      ) : null}
      <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional details" />
      <ListSection title="Evidence">
        {EVIDENCE_OPTIONS.map((option) => (
          <SelectionCard
            key={option.id}
            title={option.label}
            body={option.body}
            selected={evidenceMethod === option.id}
            onPress={() => setEvidenceMethod(option.id)}
          />
        ))}
      </ListSection>
      <SelectionCard
        title="Confirm as work"
        body="If unchecked, this drive goes to Review before it is reportable."
        selected={confirmAsWork}
        onPress={() => setConfirmAsWork((value) => !value)}
      />
      {error ? <FormError message={error} /> : null}
      <PrimaryButton label={existing ? 'Save changes' : 'Save drive'} onPress={save} />
      {existing ? <DestructiveButton label="Delete trip" onPress={confirmDelete} /> : null}
    </ScrollScreen>
  );
}

export function TripDetailsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'TripDetails'>>();
  const navigation = useNavigation<Nav>();
  const { state, classifyTrip } = useApp();
  const { pushReviewHistory } = useProduct();
  const trip = state.trips.find((item) => item.id === route.params.tripId);

  if (!trip) {
    return (
      <ScrollScreen>
        <StatusCard variant="warning" title="Trip not found" body="This record is no longer available." emphasis="hero" />
      </ScrollScreen>
    );
  }

  const classify = (decision: Exclude<ReviewDecision, null>) => {
    const action = decision === 'work' ? 'work' : decision === 'personal' ? 'personal' : 'not_drive';
    classifyTrip(trip.id, action);
    pushReviewHistory({
      id: `review-trip-${trip.id}`,
      targetId: trip.id,
      targetKind: 'trip',
      previousSnapshot: trip,
      decision,
      decidedAt: Date.now(),
      undoneAt: null,
    });
    navigation.goBack();
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Review this trip"
        body="Confirm only what you know. Personal and rejected trips stay out of reports."
        emphasis="subtle"
      />
      <ListSection title="Trip">
        <EvidenceRow label="Date" value={formatDateLocal(trip.startAt)} />
        <EvidenceRow label="Time" value={`${formatTimeLocal(trip.startAt)} - ${formatTimeLocal(trip.endAt)}`} />
        <EvidenceRow label="Distance" value={`${trip.distanceMiles.toFixed(1)} mi`} />
        <EvidenceRow label="Purpose" value={trip.purpose ?? 'Not set'} />
        <EvidenceRow label="Start" value={trip.startLabel ?? 'Not set'} />
        <EvidenceRow label="End" value={trip.endLabel ?? 'Not set'} />
        <EvidenceRow label="Source" value={trip.source} />
        <EvidenceRow label="Evidence" value={trip.evidenceMethod ?? 'Not set'} />
      </ListSection>
      <PrimaryButton label="Work" onPress={() => classify('work')} accessibilityLabel="Classify as work" />
      <SecondaryButton label="Personal" onPress={() => classify('personal')} />
      <DestructiveButton label="Wasn't a drive" onPress={() => classify('not_drive')} />
      <SecondaryButton label="Edit trip" onPress={() => navigation.navigate('ManualTrip', { tripId: trip.id })} />
    </ScrollScreen>
  );
}

export function MissingTripRecoveryScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'MissingTripRecovery'>>();
  const navigation = useNavigation<Nav>();
  const { state, confirmRecovery, rejectRecovery } = useApp();
  const { pushReviewHistory } = useProduct();
  const reviewItem = state.reviewItems.find((item) => item.id === route.params.reviewId);
  const candidateId =
    reviewItem && reviewItem.kind === 'possible_missing_trip'
      ? reviewItem.recoveryCandidateId
      : route.params.reviewId.replace(/^review-recovery-/, '');
  const candidate = state.recoveryCandidates.find((item) => item.id === candidateId);
  const [distance, setDistance] = useState(candidate?.proposedDistanceMiles?.toString() ?? '');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!candidate) {
    return (
      <ScrollScreen>
        <StatusCard variant="warning" title="Recovery item not found" body="This suggestion is no longer available." emphasis="hero" />
      </ScrollScreen>
    );
  }

  const remember = (decision: Exclude<ReviewDecision, null>) => {
    pushReviewHistory({
      id: route.params.reviewId,
      targetId: candidate.id,
      targetKind: 'recovery',
      previousSnapshot: candidate,
      decision,
      decidedAt: Date.now(),
      undoneAt: null,
    });
  };

  const confirm = () => {
    const miles = Number.parseFloat(distance);
    if (!Number.isFinite(miles) || miles <= 0) {
      setError('Enter the distance before confirming this recovered drive.');
      return;
    }
    const created = confirmRecovery(candidate.id, miles, purpose.trim() || 'Recovered work drive');
    if (!created) {
      setError('Could not confirm this recovery item.');
      return;
    }
    remember('work');
    navigation.goBack();
  };

  const reject = (decision: 'personal' | 'not_drive') => {
    rejectRecovery(candidate.id);
    remember(decision);
    navigation.goBack();
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="warning"
        title="Was this a work drive?"
        body={candidate.plainLanguageExplanation}
        emphasis="hero"
      />
      <ListSection title="Why we are asking">
        <EvidenceRow label="Confidence" value={candidate.confidence} />
        <EvidenceRow
          label="Time"
          value={`${formatDateLocal(candidate.proposedStartAt)} ${formatTimeLocal(candidate.proposedStartAt)} - ${formatTimeLocal(candidate.proposedEndAt)}`}
        />
        <EvidenceRow
          label="Suggested distance"
          value={candidate.proposedDistanceMiles != null ? `${candidate.proposedDistanceMiles.toFixed(1)} mi` : 'Needs your entry'}
        />
        {candidate.evidence.map((evidence) => (
          <EvidenceRow key={`${evidence.kind}-${evidence.summary}`} label={evidence.kind} value={evidence.summary} />
        ))}
      </ListSection>
      <FormField label="Distance (miles)" value={distance} onChangeText={setDistance} placeholder="0.0" />
      <FormField label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="Recovered work drive" />
      {error ? <FormError message={error} /> : null}
      <PrimaryButton label="Confirm work drive" onPress={confirm} />
      <SecondaryButton label="Personal, leave out" onPress={() => reject('personal')} />
      <DestructiveButton label="Not a drive" onPress={() => reject('not_drive')} />
    </ScrollScreen>
  );
}

export function ProtectionAlertScreen() {
  const navigation = useNavigation<Nav>();
  const {
    permissions,
    automaticCaptureAvailable,
    requestLocationPermission,
    requestBackgroundPermission,
    refreshPermissions,
    openSystemSettings,
  } = useApp();
  const { product, setProtectionSetupState } = useProduct();
  const foregroundReady = permissions.location === 'granted';
  const backgroundReady = permissions.backgroundLocation === 'granted';

  return (
    <ScrollScreen>
      <StatusCard
        variant={foregroundReady && backgroundReady ? 'info' : 'warning'}
        title="Protection setup"
        body={
          automaticCaptureAvailable
            ? 'Grant foreground and background location before automatic capture can run.'
            : 'Automatic capture is not available in this release candidate. These permission states are real, but tracking is not active.'
        }
        emphasis="hero"
      />
      <SoftPanel>
        <EvidenceRow label="Foreground location" value={foregroundReady ? 'Granted' : permissions.location} />
        <EvidenceRow label="Background location" value={backgroundReady ? 'Granted' : permissions.backgroundLocation} />
        <EvidenceRow label="Motion" value={permissions.motion} />
        <EvidenceRow label="Tracking engine" value={automaticCaptureAvailable ? 'Available' : 'Unavailable in this RC'} />
      </SoftPanel>
      <PrimaryButton label="Request foreground location" onPress={() => void requestLocationPermission()} />
      <SecondaryButton
        label="Request background location"
        onPress={() => void requestBackgroundPermission()}
        disabled={!foregroundReady}
      />
      <SecondaryButton label="Refresh permission status" onPress={() => void refreshPermissions()} />
      <SecondaryButton label="Open system settings" onPress={() => void openSystemSettings()} />
      {product.protectionSetupState === 'not_started' || product.protectionSetupState === 'educated' ? (
        <PrimaryButton
          label="I understand protection status"
          onPress={() => setProtectionSetupState('configured')}
          accessibilityLabel="Mark protection education complete"
        />
      ) : null}
      <SecondaryButton label="View tracking status" onPress={() => navigation.navigate('TrackingActive')} />
    </ScrollScreen>
  );
}

export function TrackingActiveScreen() {
  const { permissions, automaticCaptureAvailable } = useApp();
  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title={automaticCaptureAvailable ? 'Tracking status' : 'Automatic capture is not on yet'}
        body={
          automaticCaptureAvailable
            ? 'Tracking depends on the permission status shown here.'
            : 'This release candidate supports manual, imported, and recovered records. It does not run a tracking engine.'
        }
        emphasis="hero"
      />
      <ListSection title="Status">
        <EvidenceRow label="Automatic capture" value={automaticCaptureAvailable ? 'Available' : 'Unavailable in this RC'} />
        <EvidenceRow label="Foreground location" value={permissions.location} />
        <EvidenceRow label="Background location" value={permissions.backgroundLocation} />
        <EvidenceRow label="Screen-off coverage" value={automaticCaptureAvailable ? 'Requires background location' : 'Unavailable in this RC'} />
      </ListSection>
      <StatusCard
        variant="neutral"
        title="What you can do now"
        body="Add manual drives, import CSV history, and review possible missing trips. Reports use only confirmed work drives."
        emphasis="subtle"
      />
    </ScrollScreen>
  );
}

export function VehicleSetupScreen() {
  const { product, upsertVehicle } = useProduct();
  const primary = product.vehicles[0];
  const [nickname, setNickname] = useState(primary?.nickname ?? '');
  const [make, setMake] = useState(primary?.make ?? '');
  const [model, setModel] = useState(primary?.model ?? '');
  const [saved, setSaved] = useState(false);

  const save = () => {
    const hasValue = nickname.trim() || make.trim() || model.trim();
    if (!hasValue) return;
    upsertVehicle({
      id: primary?.id ?? localId('vehicle'),
      nickname: nickname.trim() || [make.trim(), model.trim()].filter(Boolean).join(' ') || 'My vehicle',
      make: make.trim(),
      model: model.trim(),
      isPrimary: primary?.isPrimary ?? product.vehicles.length === 0,
      createdAt: primary?.createdAt,
    });
    setSaved(true);
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Vehicles are optional"
        body="A nickname, make, or model can appear in reports when you select a vehicle on a trip."
        emphasis="subtle"
      />
      <FormField label="Nickname" value={nickname} onChangeText={setNickname} placeholder="Work sedan" />
      <FormField label="Make" value={make} onChangeText={setMake} placeholder="Toyota" />
      <FormField label="Model" value={model} onChangeText={setModel} placeholder="Camry" />
      <PrimaryButton label="Save vehicle" onPress={save} disabled={!nickname.trim() && !make.trim() && !model.trim()} />
      {saved ? <StatusCard variant="success" title="Saved" body="Vehicle details are stored locally." emphasis="subtle" /> : null}
      {product.vehicles.length > 0 ? (
        <ListSection title="Saved vehicles">
          {product.vehicles.map((vehicle) => (
            <EvidenceRow key={vehicle.id} label={vehicleLabel(vehicle)} value={[vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'No make/model'} />
          ))}
        </ListSection>
      ) : null}
    </ScrollScreen>
  );
}

export function WorkLocationSetupScreen() {
  const { product, upsertWorkLocation } = useProduct();
  const existing = product.workLocations[0];
  const [label, setLabel] = useState(existing?.label ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saved, setSaved] = useState(false);

  const save = () => {
    const hasValue = label.trim() || address.trim() || notes.trim();
    if (!hasValue) return;
    upsertWorkLocation({
      id: existing?.id ?? localId('work-place'),
      label: label.trim() || 'Work place',
      address: address.trim(),
      notes: notes.trim(),
      createdAt: existing?.createdAt,
    });
    setSaved(true);
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Work places are optional"
        body="Use a simple label and address when it helps explain routine work drives."
        emphasis="subtle"
      />
      <FormField label="Label" value={label} onChangeText={setLabel} placeholder="Office" />
      <FormField label="Address" value={address} onChangeText={setAddress} placeholder="Street, city" />
      <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional context" />
      <PrimaryButton label="Save work place" onPress={save} disabled={!label.trim() && !address.trim() && !notes.trim()} />
      {saved ? <StatusCard variant="success" title="Saved" body="Work place stored locally." emphasis="subtle" /> : null}
      {product.workLocations.length > 0 ? (
        <ListSection title="Saved work places">
          {product.workLocations.map((loc) => (
            <EvidenceRow key={loc.id} label={loc.label} value={loc.address || loc.notes || 'No address'} />
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
      <StatusCard variant="info" title={route.params.title} body={route.params.detail} emphasis="hero" />
      <StatusCard
        variant="neutral"
        title="Not available in this preview"
        body="This screen is intentionally honest: no fake switches, no placeholder success states."
        emphasis="subtle"
      />
    </ScrollScreen>
  );
}

export function ExportReportScreen() {
  const navigation = useNavigation<Nav>();
  const { state } = useApp();
  const { product } = useProduct();
  const [phase, setPhase] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const period = periodFromState(state.reportingPeriod);
  const report = reportData(state.trips, period, product.preferredName, voiceForDrivingType(product.drivingType));
  const canExport = reportHasExportableTrips(state.trips, period);

  const exportCsv = async () => {
    if (!canExport) {
      setMessage('No confirmed work drives in this reporting period.');
      setPhase('failed');
      return;
    }
    setPhase('processing');
    try {
      const csv = buildMileageCsv(state.trips, {
        periodStart: period.startAt,
        periodEnd: period.endAt,
        vehicleNicknameById: vehicleLookup(product.vehicles),
      });
      const uri = await writeTextFile(csvFilename(period.label), csv);
      const result = await shareFile(uri, 'text/csv', 'Share MileRecover CSV');
      if (!result.ok && result.reason !== 'cancelled') throw new Error(result.message);
      setMessage(result.ok ? 'CSV ready to share.' : result.message);
      setPhase('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not export CSV.');
      setPhase('failed');
    }
  };

  const exportPdf = async () => {
    if (!canExport) {
      setMessage('No confirmed work drives in this reporting period.');
      setPhase('failed');
      return;
    }
    setPhase('processing');
    const result = await generateAndSharePdf(report);
    if (result.ok || result.reason === 'cancelled') {
      setMessage(result.ok ? 'PDF ready to share.' : result.message);
      setPhase('success');
    } else {
      setMessage(result.message);
      setPhase('failed');
    }
  };

  if (phase === 'processing') {
    return (
      <ScrollScreen>
        <LoadingState message="Preparing your file..." />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <StatusCard
        variant={phase === 'failed' ? 'danger' : phase === 'success' ? 'success' : 'info'}
        title={phase === 'failed' ? 'Could not export' : phase === 'success' ? 'Export handled' : 'Share confirmed work drives'}
        body={message ?? `Current period: ${period.label}. Exports include ${report.tripCount} confirmed work drive(s).`}
        emphasis={phase === 'idle' ? 'subtle' : 'hero'}
      />
      <PrimaryButton label="Share CSV" onPress={() => void exportCsv()} />
      <SecondaryButton label="Share PDF" onPress={() => void exportPdf()} />
      <SecondaryButton label="Preview report" onPress={() => navigation.navigate('ReportPreview', { format: 'pdf' })} />
    </ScrollScreen>
  );
}

export function ReportPreviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ReportPreview'>>();
  const { state } = useApp();
  const { product } = useProduct();
  const period = periodFromState(state.reportingPeriod);
  const report = reportData(state.trips, period, product.preferredName, voiceForDrivingType(product.drivingType));
  const formatLabel = route.params.format.toUpperCase();

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Report preview of real data"
        body={`${formatLabel} preview from confirmed work drives in ${period.label}. This is not tax, legal, or employer advice.`}
        emphasis="hero"
      />
      <SoftPanel>
        <Text style={[text.subtitle, { marginBottom: spacing.sm }]}>{report.title}</Text>
        <EvidenceRow label="Period" value={report.period.label} />
        <EvidenceRow label="Driver" value={report.userName ?? 'Not set'} />
        <EvidenceRow label="Confirmed work drives" value={String(report.tripCount)} />
        <EvidenceRow label="Total miles" value={report.totalMiles.toFixed(1)} />
        <EvidenceRow label="Unresolved excluded" value={String(report.unresolvedCount)} />
      </SoftPanel>
      <ListSection title="Line items">
        {report.lineItems.length === 0 ? (
          <StatusCard
            variant="neutral"
            title="No trips in this period"
            body="Confirmed work drives will appear here with date, purpose, locations, miles, source, and evidence."
            emphasis="subtle"
          />
        ) : (
          report.lineItems.map((item) => (
            <EvidenceRow
              key={item.id}
              label={`${item.dateLabel} - ${item.purpose}`}
              value={`${item.distanceMiles.toFixed(1)} mi - ${item.startLabel} to ${item.endLabel}`}
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
  const [notice, setNotice] = useState<string | null>('Free is available now. Billing is not connected.');
  const [selectedRescue, setSelectedRescue] = useState<string | null>(null);

  const onChoosePlan = (planId: 'plus' | 'pro') => {
    const applied = setSelectedPlan(planId);
    setNotice(
      applied
        ? `${planId === 'plus' ? 'Plus' : 'Pro'} applied in demo mode only.`
        : 'Preview only - billing is not connected. Your plan stays Free until a real purchase succeeds.',
    );
  };

  return (
    <FixedHeaderScrollScreen
      header={
        <View>
          <Text style={text.subtitle}>Upgrade when it helps.</Text>
          <Text style={[text.caption, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            Free is shown and usable. Paid plans are preview-only because purchases are not connected.
          </Text>
          <SecondaryButton
            label={annual ? 'Showing annual - switch to monthly' : 'Showing monthly - switch to annual'}
            onPress={() => setAnnual((value) => !value)}
          />
        </View>
      }
    >
      {notice ? <StatusCard variant="info" title="Plan status" body={notice} emphasis="subtle" /> : null}
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
      {PLAN_FIXTURES.filter((plan) => plan.id !== 'free').map((plan) => (
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
      <Text style={[text.subtitle, { marginTop: spacing.md, marginBottom: spacing.sm }]}>One-time catch-up</Text>
      <Text style={[text.caption, { marginBottom: spacing.sm }]}>
        Preview selection only. Billing is not connected in this release candidate.
      </Text>
      {RESCUE_OPTIONS.map((option) => (
        <SelectionCard
          key={option.id}
          title={`${option.name} - ${option.price}`}
          body={option.description}
          selected={selectedRescue === option.id}
          onPress={() => {
            setSelectedRescue(option.id);
            setNotice(`Preview only - ${option.name} is not purchased.`);
          }}
        />
      ))}
    </FixedHeaderScrollScreen>
  );
}

export function HelpSupportScreen() {
  const { resetOnboarding } = useProduct();
  const { restartOnboarding } = useApp();
  const next = nextActionForGoal(null);

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Help and support"
        body="MileRecover keeps records local first, asks before classifying uncertain drives, and excludes unresolved trips from reports."
        emphasis="subtle"
      />
      <ListSection title="Common questions">
        <View style={{ gap: spacing.sm }}>
          <Text style={text.subtitle}>Will MileRecover invent miles?</Text>
          <Text style={[text.body, { marginBottom: spacing.sm }]}>
            No. Manual entries, imports, and recovery suggestions all require real details or your confirmation.
          </Text>
          <Text style={text.subtitle}>When does automatic capture start?</Text>
          <Text style={[text.body, { marginBottom: spacing.sm }]}>
            Automatic capture is not available in this release candidate. Manual and imported records work now.
          </Text>
          <Text style={text.subtitle}>What happens if I restart onboarding?</Text>
          <Text style={text.body}>
            Trips stay on this device. Only the onboarding questions restart, beginning with {next.cta.toLowerCase()}.
          </Text>
        </View>
      </ListSection>
      <PrimaryButton
        label="Restart onboarding"
        onPress={() => {
          resetOnboarding();
          restartOnboarding();
        }}
        accessibilityLabel="Restart onboarding while preserving trips"
      />
      <StatusCard
        variant="neutral"
        title="Contact"
        body="Email support@milerecover.com with your build label from Profile > About."
        emphasis="subtle"
      />
    </ScrollScreen>
  );
}
