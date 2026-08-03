import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  buildMileageCsv,
  buildMileageReportData,
  capabilitiesForEntitlement,
  createManualTripRecord,
  csvFilename,
  formatDateLocal,
  formatTimeLocal,
  reportHasExportableTrips,
  shouldOfferTrial,
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
  SegmentedControl,
  SoftPanel,
  StatusCard,
  text,
} from '../../design-system';
import { PLAN_FIXTURES, RESCUE_OPTIONS } from '../../fixtures/subscription';
import type { RootStackParamList } from '../../navigation/types';
import { nextActionForGoal, voiceForDrivingType } from '../../product/copy';
import { useProduct } from '../../product/ProductContext';
import type { ReviewDecision, VehicleDraft, WorkLocationDraft } from '../../product/types';
import { writeTextFile, shareFile } from '../../services/fileShare';
import { generateAndSharePdf } from '../../services/pdfReport';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';
import {
  buildUserDataExport,
  clearLocalPrivacyCaches,
  writeUserDataExportFile,
} from '../../services/dataPrivacy';
import { getPurchasePort, trialRenewalCopy, type PurchasePeriod } from '../../services/purchases';
import { getTrackingDiagnostics, type TrackingDiagnostics } from '../../services/trackingEngine';
import { useApp } from '../../store/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const EVIDENCE_OPTIONS: { id: TripEvidenceMethod; label: string; body: string }[] = [
  { id: 'map_estimate', label: 'Route calculated', body: 'Distance from a calculated route or map check.' },
  { id: 'odometer', label: 'Odometer', body: 'Start/end odometer or written log.' },
  { id: 'calendar_receipt_note', label: 'Another record', body: 'Calendar, receipt, or other record.' },
  { id: 'user_estimate', label: 'Best estimate', body: 'Best memory — clearly labeled as estimated.' },
];

const VEHICLE_YEAR_CHOICES = Array.from({ length: 30 }, (_, index) => String(new Date().getFullYear() - index));
const COMMON_MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'Subaru', 'Tesla', 'Other'];

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
  const initialStart = existing ? new Date(existing.startAt) : new Date();
  const initialEnd = existing ? new Date(existing.endAt) : new Date(Date.now() + 30 * 60000);
  const [driveDate, setDriveDate] = useState(initialStart);
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [addTime, setAddTime] = useState(Boolean(existing));
  const [distanceMode, setDistanceMode] = useState<'distance' | 'places'>('distance');
  const [distance, setDistance] = useState(existing ? existing.distanceMiles.toString() : '');
  const [purpose, setPurpose] = useState(existing?.purpose ?? '');
  const [startLabel, setStartLabel] = useState(existing?.startLabel ?? '');
  const [endLabel, setEndLabel] = useState(existing?.endLabel ?? '');
  const [vehicleId, setVehicleId] = useState<string | null>(existing?.vehicleId ?? null);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [evidenceMethod, setEvidenceMethod] = useState<TripEvidenceMethod | null>(
    existing?.evidenceMethod ?? 'user_estimate',
  );
  const [classification, setClassification] = useState<'work' | 'personal' | 'later'>(
    existing?.classification === 'business'
      ? 'work'
      : existing?.classification === 'personal'
        ? 'personal'
        : 'later',
  );
  const [showDetails, setShowDetails] = useState(Boolean(existing?.vehicleId || existing?.notes || existing?.evidenceMethod));
  const [error, setError] = useState<string | null>(null);

  const purposeChips = (() => {
    switch (product.primaryGoal) {
      case 'employee_reimbursement':
        return ['Client visit', 'Between work locations', 'Meeting or training', 'Airport or business travel', 'Other work drive'];
      case 'gig_delivery':
        return ['Delivery', 'Pickup', 'Repositioning', 'Supply or fuel stop', 'Other work drive'];
      case 'self_employed_business':
        return ['Client visit', 'Supplies', 'Bank or post office', 'Business meeting', 'Other work drive'];
      default:
        return ['Client visit', 'Delivery', 'Between work locations', 'Business meeting', 'Other work drive'];
    }
  })();
  const customPurpose = purpose.length > 0 && !purposeChips.includes(purpose);

  const applyDateOffset = (daysBack: number) => {
    const next = new Date();
    next.setDate(next.getDate() - daysBack);
    setDriveDate(next);
    setShowDatePicker(false);
  };

  const composeDateTime = (day: Date, time: Date, fallbackHour: number, fallbackMinute: number): number => {
    const next = new Date(day);
    next.setHours(
      addTime ? time.getHours() : fallbackHour,
      addTime ? time.getMinutes() : fallbackMinute,
      0,
      0,
    );
    return next.getTime();
  };

  const save = () => {
    if (purpose === 'Other work drive') {
      setError('Enter a custom purpose for Other work drive.');
      return;
    }
    const startAt = composeDateTime(driveDate, startTime, 9, 0);
    const endAt = composeDateTime(driveDate, endTime, 9, 30);
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
      evidenceMethod: evidenceMethod ?? 'user_estimate',
      confirmAsWork: classification === 'work',
    };
    const errors = validateManualTripInput(input);
    if (errors.length > 0) {
      setError(errors.map((item) => item.message).join(' '));
      return;
    }
    const created = createManualTripRecord(input);
    const trip =
      classification === 'personal'
        ? { ...created, status: 'personal' as const, classification: 'personal' as const, confidence: 'high' as const }
        : classification === 'later'
          ? { ...created, status: 'pending' as const, classification: 'unclassified' as const, confidence: 'medium' as const }
          : created;
    upsertTrip({
      ...trip,
      source: existing?.source ?? trip.source,
      createdAt: existing?.createdAt ?? trip.createdAt,
      updatedAt: Date.now(),
    });
    logEvent(ANALYTICS_EVENTS.manualTripSaved, {
      classification,
      hasTime: addTime,
      hasVehicle: Boolean(vehicleId),
      hasPlaces: Boolean(startLabel || endLabel),
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
        body="Use what you know. MileRecover will not invent route distance from labels or familiar places."
        emphasis="subtle"
      />
      <ListSection title="When">
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm }}>
          <SecondaryButton label="Today" onPress={() => applyDateOffset(0)} />
          <SecondaryButton label="Yesterday" onPress={() => applyDateOffset(1)} />
          <SecondaryButton label="Pick date" onPress={() => setShowDatePicker((value) => !value)} />
        </View>
        <EvidenceRow label="Selected date" value={formatDateLocal(driveDate.getTime())} />
        {showDatePicker ? (
          <DateTimePicker
            value={driveDate}
            mode="date"
            onChange={(_, selected) => {
              if (selected) setDriveDate(selected);
            }}
          />
        ) : null}
        <SelectionCard
          title="Add time"
          body={addTime ? 'Start and end time are included.' : 'Optional. Date alone uses a simple default time window.'}
          selected={addTime}
          onPress={() => setAddTime((value) => !value)}
        />
        {addTime ? (
          <>
            <Text style={[text.caption, { marginBottom: spacing.xs }]}>Start time</Text>
            <DateTimePicker value={startTime} mode="time" onChange={(_, selected) => selected && setStartTime(selected)} />
            <Text style={[text.caption, { marginBottom: spacing.xs }]}>End time</Text>
            <DateTimePicker value={endTime} mode="time" onChange={(_, selected) => selected && setEndTime(selected)} />
          </>
        ) : null}
      </ListSection>

      <ListSection title="Distance">
        <SelectionCard
          title="I only know the distance"
          body="Enter the miles you know. This is the default path."
          selected={distanceMode === 'distance'}
          onPress={() => setDistanceMode('distance')}
        />
        <SelectionCard
          title="Use familiar place labels"
          body="Labels can explain the drive, but you still enter the mileage."
          selected={distanceMode === 'places'}
          onPress={() => setDistanceMode('places')}
        />
        <FormField label="Distance (miles)" value={distance} onChangeText={setDistance} placeholder="0.0" />
        {distanceMode === 'places' ? (
          <>
            <FormField label="Start label" value={startLabel} onChangeText={setStartLabel} placeholder="Home" />
            <FormField label="End label" value={endLabel} onChangeText={setEndLabel} placeholder="Client office" />
            {product.workLocations.map((location) => (
              <View key={location.id} style={{ marginBottom: spacing.sm }}>
                <SecondaryButton label={`Start: ${location.label}`} onPress={() => setStartLabel(location.label)} />
                <SecondaryButton label={`End: ${location.label}`} onPress={() => setEndLabel(location.label)} />
              </View>
            ))}
          </>
        ) : null}
      </ListSection>

      <ListSection title="Purpose">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
          {purposeChips.map((chip) => (
            <SecondaryButton key={chip} label={chip} onPress={() => setPurpose(chip)} />
          ))}
        </View>
        {purpose && purpose !== 'Other work drive' ? <EvidenceRow label="Selected purpose" value={purpose} /> : null}
        {purpose === 'Other work drive' || customPurpose ? (
          <FormField
            label="Custom purpose"
            value={purpose === 'Other work drive' ? '' : purpose}
            onChangeText={(value) => setPurpose(value.trim() ? value : 'Other work drive')}
            placeholder="Describe the work drive"
          />
        ) : null}
      </ListSection>

      <ListSection title="Classification">
        <SegmentedControl
          value={classification}
          onChange={setClassification}
          options={[
            { label: 'Work', value: 'work' },
            { label: 'Personal', value: 'personal' },
            { label: 'Decide later', value: 'later' },
          ]}
        />
      </ListSection>

      <SelectionCard
        title="Add details or evidence"
        body="Optional vehicle, notes, and evidence method."
        selected={showDetails}
        onPress={() => setShowDetails((value) => !value)}
      />
      {showDetails ? (
        <>
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
        </>
      ) : null}
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
            ? 'Grant foreground and background location before automatic capture can run. Denied permissions never trap you — change them later in Settings.'
            : 'Automatic capture is not available in this build runtime.'
        }
        emphasis="hero"
      />
      <SoftPanel>
        <EvidenceRow label="Foreground location" value={foregroundReady ? 'Granted' : permissions.location} />
        <EvidenceRow label="Background location" value={backgroundReady ? 'Granted' : permissions.backgroundLocation} />
        <EvidenceRow label="Motion" value={permissions.motion} />
        <EvidenceRow label="Tracking engine" value={automaticCaptureAvailable ? 'Available' : 'Unavailable'} />
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
  const navigation = useNavigation<Nav>();
  const { permissions, automaticCaptureAvailable } = useApp();
  const { product, setTrackingEnabled } = useProduct();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const [diagnostics, setDiagnostics] = useState<TrackingDiagnostics | null>(null);

  const refreshDiagnostics = () => {
    void getTrackingDiagnostics().then(setDiagnostics);
  };

  useEffect(() => {
    refreshDiagnostics();
  }, [product.trackingEnabled]);

  const canStart = capabilities.canUseAutomaticCapture;
  const start = () => {
    if (!canStart) {
      navigation.navigate('PlanSelection', { source: 'upgrade' });
      return;
    }
    setTrackingEnabled(true);
    logEvent(ANALYTICS_EVENTS.trackingStarted, { source: 'tracking_screen' });
    refreshDiagnostics();
  };
  const stop = () => {
    setTrackingEnabled(false);
    logEvent(ANALYTICS_EVENTS.trackingStopped, { source: 'tracking_screen' });
    refreshDiagnostics();
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant={product.trackingEnabled && canStart ? 'info' : 'warning'}
        title={product.trackingEnabled && canStart ? 'Protection is enabled' : 'Automatic protection is off'}
        body={
          canStart
            ? 'Start or stop automatic capture here. The diagnostics below come from the tracking controller.'
            : 'Automatic capture requires Plus access from a real entitlement. Plans will explain the trial without granting fake access.'
        }
        emphasis="hero"
      />
      <ListSection title="Status">
        <EvidenceRow label="Plan capability" value={canStart ? 'Allowed' : 'Not included'} />
        <EvidenceRow label="Tracking preference" value={product.trackingEnabled ? 'Enabled' : 'Off'} />
        <EvidenceRow label="Runtime capture flag" value={automaticCaptureAvailable ? 'Available' : 'Unavailable'} />
        <EvidenceRow label="Foreground location" value={permissions.location} />
        <EvidenceRow label="Background location" value={permissions.backgroundLocation} />
        <EvidenceRow label="Controller state" value={diagnostics?.engineState ?? 'unknown'} />
        <EvidenceRow label="Background registered" value={diagnostics?.backgroundRegistered ? 'Yes' : 'No'} />
        <EvidenceRow label="Buffered samples" value={String(diagnostics?.sampleCount ?? 0)} />
        <EvidenceRow
          label="Last sample"
          value={diagnostics?.lastSampleAt ? `${formatDateLocal(diagnostics.lastSampleAt)} ${formatTimeLocal(diagnostics.lastSampleAt)}` : 'None'}
        />
      </ListSection>
      {diagnostics?.backgroundLimited ? (
        <StatusCard
          variant="warning"
          title="Background capture is limited"
          body={diagnostics.backgroundLimitedReason ?? 'The controller reports limited background coverage.'}
          emphasis="subtle"
        />
      ) : null}
      <PrimaryButton
        label={product.trackingEnabled ? 'Protection already enabled' : 'Start protection'}
        onPress={start}
        disabled={product.trackingEnabled && canStart}
      />
      <SecondaryButton label="Stop protection" onPress={stop} disabled={!product.trackingEnabled} />
      <SecondaryButton label="Refresh diagnostics" onPress={refreshDiagnostics} />
      <StatusCard
        variant="neutral"
        title="What you can do now"
        body="Manual drives, imports, recovery review, and reports remain available even when automatic capture is off."
        emphasis="subtle"
      />
    </ScrollScreen>
  );
}

export function VehicleSetupScreen() {
  const navigation = useNavigation<Nav>();
  const { product, upsertVehicle } = useProduct();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const primary = product.vehicles[0];
  const [nickname, setNickname] = useState(primary?.nickname ?? '');
  const [year, setYear] = useState(primary?.year ?? '');
  const [make, setMake] = useState(primary?.make ?? '');
  const [model, setModel] = useState(primary?.model ?? '');
  const [plate, setPlate] = useState(primary?.plate ?? '');
  const [saved, setSaved] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const atFreeLimit = !primary && product.vehicles.length >= capabilities.maxVehicles;

  const save = () => {
    const hasValue = nickname.trim() || make.trim() || model.trim() || year.trim();
    if (!hasValue) return;
    if (atFreeLimit) {
      setLimitMessage(`Free includes up to ${capabilities.maxVehicles} vehicle. Choose Plus for more.`);
      navigation.navigate('PlanSelection', { source: 'upgrade' });
      return;
    }
    upsertVehicle({
      id: primary?.id ?? localId('vehicle'),
      nickname: nickname.trim() || [year.trim(), make.trim(), model.trim()].filter(Boolean).join(' ') || 'My vehicle',
      year: year.trim(),
      make: make.trim(),
      model: model.trim() || (make === 'Other' ? 'Other' : ''),
      plate: plate.trim(),
      isPrimary: primary?.isPrimary ?? product.vehicles.length === 0,
      createdAt: primary?.createdAt,
    });
    setSaved(true);
    setLimitMessage(null);
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Which vehicle carries your work miles?"
        body="Tap year and make first. Nickname and plate are optional. Nothing is invented."
        emphasis="subtle"
      />
      {limitMessage ? <StatusCard variant="warning" title="Vehicle limit" body={limitMessage} emphasis="subtle" /> : null}
      <ListSection title="Year">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {VEHICLE_YEAR_CHOICES.slice(0, 8).map((choice) => (
            <SecondaryButton key={choice} label={choice} onPress={() => setYear(choice)} />
          ))}
        </View>
        {year ? <EvidenceRow label="Selected year" value={year} /> : null}
      </ListSection>
      <ListSection title="Make">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {COMMON_MAKES.map((choice) => (
            <SecondaryButton key={choice} label={choice} onPress={() => setMake(choice)} />
          ))}
        </View>
        {make ? <EvidenceRow label="Selected make" value={make} /> : null}
        {!COMMON_MAKES.includes(make) || make === 'Other' ? (
          <FormField
            label="Custom make"
            value={make === 'Other' ? '' : make}
            onChangeText={(value) => setMake(value.trim() ? value : 'Other')}
            placeholder="Enter make"
          />
        ) : null}
      </ListSection>
      <FormField label="Model" value={model} onChangeText={setModel} placeholder="Camry or Other" />
      <FormField label="Nickname (optional)" value={nickname} onChangeText={setNickname} placeholder="Work sedan" />
      <FormField label="License plate (optional)" value={plate} onChangeText={setPlate} placeholder="Optional" />
      <PrimaryButton label="Save vehicle" onPress={save} disabled={!nickname.trim() && !make.trim() && !model.trim() && !year.trim()} />
      {saved ? <StatusCard variant="success" title="Saved" body="Vehicle details are stored locally." emphasis="subtle" /> : null}
      {product.vehicles.length > 0 ? (
        <ListSection title="Saved vehicles">
          {product.vehicles.map((vehicle) => (
            <EvidenceRow
              key={vehicle.id}
              label={vehicleLabel(vehicle)}
              value={[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'No make/model'}
            />
          ))}
        </ListSection>
      ) : null}
    </ScrollScreen>
  );
}

export function WorkLocationSetupScreen() {
  const navigation = useNavigation<Nav>();
  const { product, upsertWorkLocation } = useProduct();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const [kind, setKind] = useState<WorkLocationDraft['kind']>('workplace');
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const save = () => {
    const hasValue = label.trim() || address.trim() || notes.trim();
    if (!hasValue) return;
    if (product.workLocations.length >= capabilities.maxWorkplaces) {
      setLimitMessage(`Free includes up to ${capabilities.maxWorkplaces} familiar places. Choose Plus for more.`);
      navigation.navigate('PlanSelection', { source: 'upgrade' });
      return;
    }
    upsertWorkLocation({
      id: localId('work-place'),
      label: label.trim() || (kind === 'home' ? 'Home' : kind === 'client' ? 'Client' : 'Work place'),
      address: address.trim(),
      notes: notes.trim(),
      kind,
    });
    setSaved(true);
    setLimitMessage(null);
    setLabel('');
    setAddress('');
    setNotes('');
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Places you visit often make review faster"
        body="Familiar places help classify and recover drives. Nothing is saved until you tap Save. Approximate labels are fine."
        emphasis="subtle"
      />
      {limitMessage ? <StatusCard variant="warning" title="Place limit" body={limitMessage} emphasis="subtle" /> : null}
      <SegmentedControl
        value={kind}
        onChange={setKind}
        options={[
          { label: 'Home', value: 'home' },
          { label: 'Work', value: 'workplace' },
          { label: 'Client', value: 'client' },
        ]}
      />
      <FormField label="Private label" value={label} onChangeText={setLabel} placeholder="Office" />
      <FormField label="Address or area" value={address} onChangeText={setAddress} placeholder="Street, city, or neighborhood" />
      <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional context" />
      <PrimaryButton label="Save place" onPress={save} disabled={!label.trim() && !address.trim() && !notes.trim()} />
      {saved ? <StatusCard variant="success" title="Saved" body="Place stored locally on this device." emphasis="subtle" /> : null}
      {product.workLocations.length > 0 ? (
        <ListSection title="Saved places">
          {product.workLocations.map((loc) => (
            <EvidenceRow key={loc.id} label={`${loc.label} (${loc.kind})`} value={loc.address || loc.notes || 'No address'} />
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

export function PrivacyScreen() {
  const { state, resetLocalData, restartOnboarding } = useApp();
  const { product, resetProductData, setNotificationPreferences } = useProduct();
  const [message, setMessage] = useState<string | null>(null);
  const prefs = product.notificationPreferences;

  const exportAll = async () => {
    try {
      const bundle = await buildUserDataExport({
        trips: state.trips,
        preferredName: product.preferredName,
        vehicleCount: product.vehicles.length,
        workPlaceCount: product.workLocations.length,
      });
      const uri = await writeUserDataExportFile(bundle);
      const result = await shareFile(uri, 'application/json', 'Export MileRecover data');
      setMessage(result.ok || result.reason === 'cancelled' ? 'Export prepared.' : result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not export data.');
    }
  };

  const deleteAll = () => {
    Alert.alert(
      'Delete local MileRecover data?',
      'This clears trips, setup, vehicles, places, and tracking samples on this device. Store subscriptions are managed in Google Play or the App Store.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await clearLocalPrivacyCaches();
              await resetProductData();
              resetLocalData();
              restartOnboarding();
              setMessage('Local data deleted.');
            })();
          },
        },
      ],
    );
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Privacy and data"
        body="MileRecover is local-first. Trips, setup answers, vehicles, and places are saved on this device first. Location history is not sold or used for ads."
        emphasis="hero"
      />
      <ListSection title="What is stored">
        <EvidenceRow label="Trips" value="Manual, imported, recovered, and automatic records on device" />
        <EvidenceRow label="Places" value="Labels and addresses you enter" />
        <EvidenceRow label="Vehicles" value="Optional vehicle details you save" />
        <EvidenceRow label="Analytics" value="Private fields such as notes and coordinates are filtered out" />
      </ListSection>
      <ListSection title="Notifications">
        <SelectionCard
          title="Local reminders"
          body={prefs.enabled ? 'On — quiet hours respect evening rest.' : 'Off'}
          selected={prefs.enabled}
          onPress={() => setNotificationPreferences({ enabled: !prefs.enabled })}
        />
        <SelectionCard
          title="Trial ending reminder"
          body="Only when notifications are allowed and this toggle stays on."
          selected={prefs.trialEnding}
          onPress={() => setNotificationPreferences({ trialEnding: !prefs.trialEnding })}
        />
        <SelectionCard
          title="Tracking health alerts"
          body="When protection is degraded and you asked for alerts."
          selected={prefs.trackingDegraded}
          onPress={() => setNotificationPreferences({ trackingDegraded: !prefs.trackingDegraded })}
        />
      </ListSection>
      <ListSection title="Controls">
        <PrimaryButton label="Export my data" onPress={() => void exportAll()} />
        <DestructiveButton label="Delete local data" onPress={deleteAll} />
      </ListSection>
      {message ? <StatusCard variant="info" title="Privacy action" body={message} emphasis="subtle" /> : null}
      <StatusCard
        variant="neutral"
        title="Subscriptions"
        body="Cancel or manage billing in Google Play or App Store settings. Deleting local data does not cancel a store subscription."
        emphasis="subtle"
      />
    </ScrollScreen>
  );
}

export function ExportReportScreen() {
  const navigation = useNavigation<Nav>();
  const { state } = useApp();
  const { product } = useProduct();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
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
    if (!capabilities.canUseStandardPdf) {
      setMessage('Standard PDF reports are included with Plus after a real store purchase or trial.');
      setPhase('failed');
      navigation.navigate('PlanSelection', { source: 'upgrade' });
      return;
    }
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
        body={message ?? `Current period: ${period.label}. Exports include ${report.tripCount} confirmed work drive(s). Free includes CSV. PDF is a Plus capability.`}
        emphasis={phase === 'idle' ? 'subtle' : 'hero'}
      />
      <PrimaryButton label="Share CSV" onPress={() => void exportCsv()} />
      <SecondaryButton
        label={capabilities.canUseStandardPdf ? 'Share PDF' : 'PDF requires Plus'}
        onPress={() => void exportPdf()}
      />
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
  const navigation = useNavigation<Nav>();
  const { product, setSelectedPlan, setEntitlement } = useProduct();
  const [annual, setAnnual] = useState(false);
  const [notice, setNotice] = useState<string | null>('Free is active. Paid access requires a real store purchase.');
  const [selectedRescue, setSelectedRescue] = useState<string | null>(null);
  const period: PurchasePeriod = annual ? 'annual' : 'monthly';
  const purchasePort = getPurchasePort();
  const entitlement = product.entitlement;
  const trialEligible = shouldOfferTrial(entitlement, 'plus_only_capability', {
    lastOfferAt: product.paywallCaps.lastTrialOfferAt,
    dismissedSession: product.paywallCaps.trialOfferDismissedSession,
  });

  const handleResult = async (action: () => Promise<Awaited<ReturnType<typeof purchasePort.purchasePlus>>>) => {
    const result = await action();
    if (result.ok) {
      setEntitlement(result.entitlement);
      setNotice('Purchase verified by the store.');
      return;
    }
    if (result.reason === 'store_unavailable') {
      logEvent(ANALYTICS_EVENTS.purchaseUnavailable, { surface: 'plans' });
    }
    setNotice(result.message);
  };

  return (
    <FixedHeaderScrollScreen
      header={
        <View>
          <Text style={text.subtitle}>Upgrade when it helps.</Text>
          <Text style={[text.caption, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            Current plan: {entitlement.planId.toUpperCase()} ({entitlement.status}). No paid plan is granted unless the store verifies it.
          </Text>
          <SecondaryButton
            label={annual ? 'Showing annual - switch to monthly' : 'Showing monthly - switch to annual'}
            onPress={() => setAnnual((value) => !value)}
          />
        </View>
      }
    >
      {notice ? <StatusCard variant="info" title="Plan status" body={notice} emphasis="subtle" /> : null}
      {trialEligible ? (
        <StatusCard
          variant="success"
          title="Start 7-day Plus trial"
          body={trialRenewalCopy(entitlement.monthlyPriceLocalized, entitlement.trialEndsAt)}
          actionLabel="Start 7-day Plus trial"
          onAction={() => void handleResult(() => purchasePort.purchasePlusTrial(period))}
          emphasis="subtle"
        />
      ) : null}
      <SelectionCard
        title="Free - $0"
        body={`${PLAN_FIXTURES[0].tagline}. ${PLAN_FIXTURES[0].features.join(' ')}`}
        selected={entitlement.planId === 'free'}
        onPress={() => {
          setSelectedPlan('free');
          setNotice('Free remains active. Your existing records stay available.');
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
          current={entitlement.planId === plan.id}
          savingsLabel={annual ? plan.annualSavingsLabel : undefined}
          onSelect={() =>
            void handleResult(() =>
              plan.id === 'plus' ? purchasePort.purchasePlus(period) : purchasePort.purchasePro(period),
            )
          }
        />
      ))}
      <Text style={[text.subtitle, { marginTop: spacing.md, marginBottom: spacing.sm }]}>One-time catch-up</Text>
      <Text style={[text.caption, { marginBottom: spacing.sm }]}>
        Rescue products are one-time purchases. If billing is unavailable, nothing is unlocked.
      </Text>
      {RESCUE_OPTIONS.map((option) => (
        <SelectionCard
          key={option.id}
          title={`${option.name} - ${option.price}`}
          body={option.description}
          selected={selectedRescue === option.id}
          onPress={() => {
            setSelectedRescue(option.id);
            void handleResult(() => purchasePort.purchaseRescue(option.id));
          }}
        />
      ))}
      <SecondaryButton
        label="Restore purchases"
        onPress={() => void handleResult(() => purchasePort.restore())}
      />
      <StatusCard
        variant="neutral"
        title="Automatic renewal"
        body="Subscriptions renew automatically unless cancelled in Google Play or App Store settings. Trial enrollment requires the native store confirmation sheet — an in-app button alone never grants Plus."
        emphasis="subtle"
      />
      <SecondaryButton label="Terms of Use" onPress={() => navigation.navigate('About')} />
      <SecondaryButton label="Privacy Policy" onPress={() => navigation.navigate('Privacy')} />
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
            After you enable protection with Plus or an active Plus trial, and grant location permissions. Free keeps manual, import, and review.
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
