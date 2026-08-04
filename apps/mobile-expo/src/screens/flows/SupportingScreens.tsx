import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Keyboard, Platform, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  formatReportRouteSummary,
  formatTimeLocal,
  MAX_TRIP_DISTANCE_MILES,
  reportHasExportableTrips,
  shouldOfferTrial,
  validateManualTripInput,
  type MileageReportData,
  type ReportPeriod,
  type TripEvidenceMethod,
  type TripRecord,
} from '@milerecover/domain';
import {
  Chip,
  ChipRow,
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
  TertiaryButton,
  text,
} from '../../design-system';
import { PLAN_FIXTURES, RESCUE_OPTIONS } from '../../fixtures/subscription';
import type { RootStackParamList } from '../../navigation/types';
import { nextActionForGoal, voiceForDrivingType } from '../../product/copy';
import { useProduct } from '../../product/ProductContext';
import type { ReviewDecision, VehicleDraft, WorkLocationDraft } from '../../product/types';
import {
  isShareInFlight,
  SHARE_COPY,
  writeAndShareTextFile,
  shareFile,
} from '../../services/fileShare';
import { generateAndSharePdf } from '../../services/pdfReport';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';
import {
  buildUserDataExport,
  clearLocalPrivacyCaches,
  writeUserDataExportFile,
} from '../../services/dataPrivacy';
import {
  getPurchasePort,
  PREVIEW_BILLING_NOTICE,
  STORE_UNAVAILABLE_MESSAGE,
  trialRenewalCopy,
  type PurchasePeriod,
} from '../../services/purchases';
import { isPreviewBillingBuild } from '../../services/revenueCatPurchases';
import { getTrackingDiagnostics, type TrackingDiagnostics } from '../../services/trackingEngine';
import { useApp } from '../../store/AppContext';
import { useAppUpdates } from '../../updates/UpdateProvider';

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
  primaryGoal: Parameters<typeof buildMileageReportData>[0]['primaryGoal'] = null,
): MileageReportData {
  return buildMileageReportData({
    trips,
    period,
    userName,
    mileageUseType: drivingType?.reportNoun ?? null,
    primaryGoal,
  });
}

export function ManualTripScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'ManualTrip'>>();
  const { state, upsertTrip, deleteTrip } = useApp();
  const { product } = useProduct();
  const { setUpdatePromptBlocked } = useAppUpdates();
  const existing = route.params?.tripId
    ? state.trips.find((trip) => trip.id === route.params?.tripId)
    : null;
  const preferWork = route.params?.preferWork === true;
  const initialStart = existing ? new Date(existing.startAt) : new Date();
  const initialEnd = existing ? new Date(existing.endAt) : new Date(Date.now() + 30 * 60000);
  const [driveDate, setDriveDate] = useState(initialStart);
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerSnapshotRef = useRef<Date | null>(null);
  const [addTime, setAddTime] = useState(Boolean(existing));
  const [routeMode, setRouteMode] = useState<'distance' | 'places'>('distance');
  const [distance, setDistance] = useState(existing ? existing.distanceMiles.toString() : '');
  const [purpose, setPurpose] = useState(existing?.purpose ?? '');
  const [startLabel, setStartLabel] = useState(existing?.startLabel ?? '');
  const [endLabel, setEndLabel] = useState(existing?.endLabel ?? '');
  const [vehicleId, setVehicleId] = useState<string | null>(
    existing?.vehicleId ?? product.vehicles[0]?.id ?? null,
  );
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (existing) return;
    void AsyncStorage.multiGet([
      '@milerecover/last-manual-purpose',
      '@milerecover/last-manual-vehicle',
    ]).then((entries) => {
      const lastPurpose = entries[0]?.[1];
      const lastVehicle = entries[1]?.[1];
      if (lastPurpose && !purpose) setPurpose(lastPurpose);
      if (lastVehicle && product.vehicles.some((v) => v.id === lastVehicle)) {
        setVehicleId(lastVehicle);
      }
    });
    // Intentionally once on mount for new drives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [evidenceMethod, setEvidenceMethod] = useState<TripEvidenceMethod | null>(
    existing?.evidenceMethod ?? 'user_estimate',
  );
  const [classification, setClassification] = useState<'work' | 'personal' | 'later' | null>(
    existing?.classification === 'business'
      ? 'work'
      : existing?.classification === 'personal'
        ? 'personal'
        : existing
          ? 'later'
          : preferWork
            ? 'work'
            : null,
  );
  const [showDetails, setShowDetails] = useState(Boolean(existing?.vehicleId || existing?.notes));
  const [error, setError] = useState<string | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const allowLeaveRef = useRef(false);

  const purposeChips = (() => {
    switch (product.primaryGoal) {
      case 'employee_reimbursement':
        return ['Client visit', 'Work site', 'Meeting', 'Errand', 'Other'];
      case 'gig_delivery':
        return ['Delivery', 'Pickup', 'Work site', 'Errand', 'Other'];
      case 'self_employed_business':
        return ['Client visit', 'Meeting', 'Errand', 'Work site', 'Other'];
      default:
        return ['Delivery', 'Client visit', 'Work site', 'Errand', 'Meeting', 'Other'];
    }
  })();
  const customPurpose = purpose.length > 0 && !purposeChips.includes(purpose) && purpose !== 'Other';
  const placeChips = [
    ...product.workLocations.map((location) => location.label),
    'Home',
    'Work',
  ].filter((label, index, all) => label && all.indexOf(label) === index);

  const closeDatePicker = useCallback((revert = false) => {
    if (revert && datePickerSnapshotRef.current) {
      setDriveDate(datePickerSnapshotRef.current);
    }
    datePickerSnapshotRef.current = null;
    setShowDatePicker(false);
  }, []);

  const openDatePicker = useCallback(() => {
    datePickerSnapshotRef.current = new Date(driveDate.getTime());
    setShowDatePicker(true);
  }, [driveDate]);

  useEffect(() => {
    if (!showDatePicker) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeDatePicker(true);
      return true;
    });
    return () => sub.remove();
  }, [closeDatePicker, showDatePicker]);

  const applyDateOffset = (daysBack: number) => {
    const next = new Date();
    next.setDate(next.getDate() - daysBack);
    setDriveDate(next);
    closeDatePicker(false);
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

  const saveLabel =
    classification === 'personal'
      ? 'Save personal drive'
      : classification === 'later'
        ? 'Save for review'
        : classification === 'work'
          ? 'Save work drive'
          : 'Save drive';

  const parsedMiles = useMemo(() => {
    const trimmed = distance.trim();
    if (!trimmed) return null;
    const miles = Number.parseFloat(trimmed);
    return Number.isFinite(miles) ? miles : NaN;
  }, [distance]);

  const validateDistanceField = useCallback((raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return 'Enter the miles for this drive.';
    const miles = Number.parseFloat(trimmed);
    if (!Number.isFinite(miles) || Number.isNaN(miles)) return 'Enter a valid number of miles.';
    if (miles <= 0) return 'Distance must be greater than zero.';
    if (miles > MAX_TRIP_DISTANCE_MILES) {
      return `Distance must be ${MAX_TRIP_DISTANCE_MILES} miles or less.`;
    }
    return null;
  }, []);

  const canSave = useMemo(() => {
    if (!classification || saving) return false;
    if (validateDistanceField(distance) != null) return false;
    if (classification === 'work' && (purpose === 'Other' || !purpose.trim())) return false;
    if (
      routeMode === 'places' &&
      (startLabel.trim() || endLabel.trim()) &&
      validateDistanceField(distance) != null
    ) {
      return false;
    }
    return true;
  }, [classification, distance, endLabel, purpose, routeMode, saving, startLabel, validateDistanceField]);

  const isDirty = useMemo(() => {
    if (existing) {
      return (
        distance.trim() !== String(existing.distanceMiles) ||
        purpose.trim() !== (existing.purpose ?? '') ||
        startLabel.trim() !== (existing.startLabel ?? '') ||
        endLabel.trim() !== (existing.endLabel ?? '') ||
        notes.trim() !== (existing.notes ?? '')
      );
    }
    return Boolean(
      distance.trim() ||
        purpose.trim() ||
        startLabel.trim() ||
        endLabel.trim() ||
        notes.trim() ||
        classification != null,
    );
  }, [classification, distance, endLabel, existing, notes, purpose, startLabel]);

  useEffect(() => {
    setUpdatePromptBlocked(true);
    return () => setUpdatePromptBlocked(false);
  }, [setUpdatePromptBlocked]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowLeaveRef.current || !isDirty || saving) return;
      event.preventDefault();
      Alert.alert('Discard this drive?', 'You have unsaved details. Leave without saving?', [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            allowLeaveRef.current = true;
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });
    return unsubscribe;
  }, [isDirty, navigation, saving]);

  const save = () => {
    Keyboard.dismiss();
    if (saving) return;
    setError(null);
    const fieldError = validateDistanceField(distance);
    setDistanceError(fieldError);
    if (!classification) {
      setError('Choose Work, Personal, or Decide later.');
      return;
    }
    if (classification === 'work' && (purpose === 'Other' || !purpose.trim())) {
      setError(purpose === 'Other' ? 'Enter a short custom purpose.' : 'Choose a purpose for this work drive.');
      return;
    }
    if (fieldError) return;
    const miles = parsedMiles ?? Number.parseFloat(distance.trim());
    if (routeMode === 'places' && (startLabel.trim() || endLabel.trim()) && !(Number.isFinite(miles) && miles > 0)) {
      setDistanceError('Enter the miles too. We never invent distance from start and end.');
      return;
    }
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    if (driveDate.getTime() > todayEnd.getTime()) {
      setError('Choose today or an earlier date.');
      return;
    }
    const startAt = composeDateTime(driveDate, startTime, 9, 0);
    const endAt = composeDateTime(driveDate, endTime, 9, 30);
    const input = {
      id: existing?.id,
      startAt,
      endAt,
      distanceMiles: miles,
      purpose: classification === 'work' ? purpose.trim() : purpose.trim() || 'Personal',
      startLabel: startLabel.trim(),
      endLabel: endLabel.trim(),
      vehicleId,
      notes: notes.trim(),
      evidenceMethod: evidenceMethod ?? 'user_estimate',
      confirmAsWork: classification === 'work',
    };
    const errors = validateManualTripInput(input);
    if (errors.length > 0) {
      const distanceMsg = errors.find((item) => item.field === 'distanceMiles');
      if (distanceMsg) setDistanceError(distanceMsg.message);
      setError(errors.filter((item) => item.field !== 'distanceMiles').map((item) => item.message).join(' ') || null);
      return;
    }
    setSaving(true);
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
    void AsyncStorage.multiSet([
      ['@milerecover/last-manual-purpose', purpose.trim()],
      ['@milerecover/last-manual-vehicle', vehicleId ?? ''],
    ]);
    logEvent(ANALYTICS_EVENTS.manualTripSaved, {
      classification,
      hasTime: addTime,
      hasVehicle: Boolean(vehicleId),
      hasPlaces: Boolean(startLabel.trim() || endLabel.trim()),
    });
    setSavedFlash(true);
    allowLeaveRef.current = true;
    setTimeout(() => navigation.goBack(), 280);
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Delete this drive?', 'This removes the drive from your local record.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          allowLeaveRef.current = true;
          deleteTrip(existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollScreen
      footer={
        <View>
          {error ? <FormError message={error} /> : null}
          <PrimaryButton
            label={existing ? 'Save changes' : saveLabel}
            onPress={save}
            disabled={!canSave}
            loading={saving}
          />
          {existing ? <DestructiveButton label="Delete drive" onPress={confirmDelete} /> : null}
        </View>
      }
    >
      <Text style={text.title} accessibilityRole="header">
        {existing ? 'Edit drive' : 'Add drive'}
      </Text>
      <Text style={[text.body, { marginBottom: spacing.md }]}>
        Save the details you know. We never invent a route.
      </Text>

      <Text style={[text.caption, { marginBottom: spacing.xs }]}>1 · Work or personal</Text>
      <ChipRow>
        <Chip label="Work" selected={classification === 'work'} onPress={() => setClassification('work')} />
        <Chip
          label="Personal"
          selected={classification === 'personal'}
          onPress={() => setClassification('personal')}
        />
        <Chip
          label="Decide later"
          selected={classification === 'later'}
          onPress={() => setClassification('later')}
        />
      </ChipRow>
      {classification === 'later' ? (
        <Text style={[text.caption, { marginBottom: spacing.sm }]}>
          Goes to Review and stays out of reports until you confirm.
        </Text>
      ) : (
        <View style={{ height: spacing.sm }} />
      )}

      <Text style={[text.caption, { marginBottom: spacing.xs }]}>2 · Date</Text>
      <ChipRow>
        <Chip label="Today" selected={false} onPress={() => applyDateOffset(0)} />
        <Chip label="Yesterday" selected={false} onPress={() => applyDateOffset(1)} />
        <Chip
          label="Choose date"
          selected={showDatePicker}
          onPress={() => {
            if (showDatePicker) closeDatePicker(true);
            else openDatePicker();
          }}
        />
      </ChipRow>
      <EvidenceRow label="Selected" value={formatDateLocal(driveDate.getTime())} />
      {showDatePicker ? (
        <View>
          {Platform.OS === 'ios' ? (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: spacing.xs,
              }}
            >
              <TertiaryButton label="Cancel" onPress={() => closeDatePicker(true)} />
              <TertiaryButton label="OK" onPress={() => closeDatePicker(false)} />
            </View>
          ) : null}
          <DateTimePicker
            value={driveDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(event, selected) => {
              const type = (event as { type?: string } | undefined)?.type;
              // Android: Cancel/outside/back → dismissed; OK → set. Always clear visibility.
              if (Platform.OS === 'android') {
                if (type === 'dismissed' || !selected) {
                  closeDatePicker(true);
                  return;
                }
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                setDriveDate(selected.getTime() > today.getTime() ? new Date() : selected);
                closeDatePicker(false);
                return;
              }
              if (type === 'dismissed' || !selected) {
                closeDatePicker(true);
                return;
              }
              const today = new Date();
              today.setHours(23, 59, 59, 999);
              setDriveDate(selected.getTime() > today.getTime() ? new Date() : selected);
            }}
          />
        </View>
      ) : null}

      <Text style={[text.caption, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>3 · Distance</Text>
      <SegmentedControl
        value={routeMode}
        onChange={setRouteMode}
        options={[
          { label: 'Enter distance', value: 'distance' },
          { label: 'Start & end', value: 'places' },
        ]}
      />
      <FormField
        label="Miles (mi)"
        value={distance}
        onChangeText={(value) => {
          const normalized = value.replace(',', '.');
          setDistance(normalized);
          if (distanceError) setDistanceError(validateDistanceField(normalized));
        }}
        placeholder="0.0"
        keyboardType="decimal-pad"
        compact
        autoFocus={!existing}
      />
      {distanceError ? <FormError message={distanceError} /> : null}
      {savedFlash ? (
        <StatusCard variant="success" title="Saved" body="Your drive is on this device." emphasis="subtle" />
      ) : null}
      {routeMode === 'places' ? (
        <>
          <Text style={[text.caption, { marginBottom: spacing.sm }]}>
            Start and end add context only. We never invent a route or distance.
          </Text>
          <FormField
            label="Start (optional)"
            value={startLabel}
            onChangeText={setStartLabel}
            placeholder="Where you started"
            compact
          />
          <ChipRow>
            {placeChips.map((chip) => (
              <Chip
                key={`start-${chip}`}
                label={chip}
                selected={startLabel === chip}
                onPress={() => setStartLabel(chip)}
                accessibilityLabel={`Start at ${chip}`}
              />
            ))}
          </ChipRow>
          <FormField
            label="End (optional)"
            value={endLabel}
            onChangeText={setEndLabel}
            placeholder="Where you finished"
            compact
          />
          <ChipRow>
            {placeChips.map((chip) => (
              <Chip
                key={`end-${chip}`}
                label={chip}
                selected={endLabel === chip}
                onPress={() => setEndLabel(chip)}
                accessibilityLabel={`End at ${chip}`}
              />
            ))}
          </ChipRow>
        </>
      ) : null}

      {classification === 'work' || classification === 'later' ? (
        <>
          <Text style={[text.caption, { marginBottom: spacing.xs }]}>4 · Purpose</Text>
          <ChipRow>
            {purposeChips.map((chip) => (
              <Chip
                key={chip}
                label={chip}
                selected={purpose === chip}
                onPress={() => setPurpose(chip)}
              />
            ))}
          </ChipRow>
          {purpose && purpose !== 'Other' ? <EvidenceRow label="Purpose" value={purpose} /> : null}
          {purpose === 'Other' || customPurpose ? (
            <FormField
              label="Custom purpose"
              value={purpose === 'Other' ? '' : purpose}
              onChangeText={(value) => setPurpose(value.trim() ? value : 'Other')}
              placeholder="Describe the work drive"
              compact
            />
          ) : null}
        </>
      ) : null}

      <SelectionCard
        title="More details"
        body="Optional time, vehicle, and notes."
        selected={showDetails}
        onPress={() => setShowDetails((value) => !value)}
      />
      {showDetails ? (
        <>
          <SelectionCard
            title="Add time"
            body={addTime ? 'Start and end time included.' : 'Optional. Date alone is fine.'}
            selected={addTime}
            onPress={() => setAddTime((value) => !value)}
          />
          {addTime ? (
            <>
              <Text style={[text.caption, { marginBottom: spacing.xs }]}>Start time</Text>
              <DateTimePicker
                value={startTime}
                mode="time"
                onChange={(_, selected) => selected && setStartTime(selected)}
              />
              <Text style={[text.caption, { marginBottom: spacing.xs }]}>End time</Text>
              <DateTimePicker
                value={endTime}
                mode="time"
                onChange={(_, selected) => selected && setEndTime(selected)}
              />
            </>
          ) : null}
          {product.vehicles.length > 0 ? (
            <ListSection title="Vehicle">
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
          <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" compact />
        </>
      ) : null}
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
        title="Review this drive"
        body="Confirm only what you know. Personal and rejected drives stay out of reports."
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
      <SecondaryButton label="Edit drive" onPress={() => navigation.navigate('ManualTrip', { tripId: trip.id })} />
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
        title={
          foregroundReady && backgroundReady
            ? 'You’re protected'
            : foregroundReady
              ? 'Partially protected'
              : 'Not yet protected'
        }
        body={
          automaticCaptureAvailable
            ? 'Allow location so future drives can be saved. You can change this anytime in Settings.'
            : 'Auto-tracking isn’t available on this device yet. Manual drives still work.'
        }
        emphasis="hero"
      />
      <SoftPanel>
        <EvidenceRow label="While using the app" value={foregroundReady ? 'On' : 'Off'} />
        <EvidenceRow label="In the background" value={backgroundReady ? 'On' : 'Off'} />
      </SoftPanel>
      <PrimaryButton label="Allow location while using the app" onPress={() => void requestLocationPermission()} />
      <SecondaryButton
        label="Allow location in the background"
        onPress={() => void requestBackgroundPermission()}
        disabled={!foregroundReady}
      />
      <SecondaryButton label="Open Settings" onPress={() => void openSystemSettings()} />
      <SecondaryButton label="Refresh" onPress={() => void refreshPermissions()} />
      {product.protectionSetupState === 'not_started' || product.protectionSetupState === 'educated' ? (
        <PrimaryButton
          label="Looks good — continue"
          onPress={() => setProtectionSetupState('configured')}
          accessibilityLabel="Mark watching setup complete"
        />
      ) : null}
      <SecondaryButton label="See watching status" onPress={() => navigation.navigate('TrackingActive')} />
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
        title={
          product.trackingEnabled && canStart
            ? 'Watching is on'
            : canStart
              ? 'Watching is off'
              : 'Watching needs Plus'
        }
        body={
          canStart
            ? 'Here’s whether we’re watching, and whether location is allowed.'
            : 'Automatic watching comes with Plus after a real store trial or purchase. Manual drives stay free.'
        }
        emphasis="hero"
      />
      <ListSection title="Are you protected?">
        <EvidenceRow
          label="Status"
          value={
            product.trackingEnabled && canStart && permissions.location === 'granted'
              ? 'Yes'
              : product.trackingEnabled || permissions.location === 'granted'
                ? 'Partially'
                : 'Not yet'
          }
        />
        <EvidenceRow label="Watching" value={product.trackingEnabled && canStart ? 'On' : 'Off'} />
        <EvidenceRow label="While using the app" value={permissions.location === 'granted' ? 'On' : 'Off'} />
        <EvidenceRow label="In the background" value={permissions.backgroundLocation === 'granted' ? 'On' : 'Off'} />
        <EvidenceRow
          label="Last location check"
          value={
            diagnostics?.lastSampleAt
              ? `${formatDateLocal(diagnostics.lastSampleAt)} ${formatTimeLocal(diagnostics.lastSampleAt)}`
              : 'None yet'
          }
        />
      </ListSection>
      {diagnostics?.backgroundLimited && product.trackingEnabled ? (
        <StatusCard
          variant="warning"
          title="Background watching is limited"
          body="Some drives may be missed when the app isn’t open. Open Settings if you want fuller coverage."
          emphasis="subtle"
        />
      ) : null}
      <PrimaryButton
        label={product.trackingEnabled ? 'Watching is already on' : 'Start watching'}
        onPress={start}
        disabled={product.trackingEnabled && canStart}
      />
      <SecondaryButton label="Stop watching" onPress={stop} disabled={!product.trackingEnabled} />
      <SecondaryButton label="Refresh status" onPress={refreshDiagnostics} />
      <StatusCard
        variant="neutral"
        title="Still available on Free"
        body="Add drives by hand, import history, review, and share CSV anytime — even when watching is off."
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
    if (isShareInFlight()) {
      setMessage(SHARE_COPY.busy);
      return;
    }
    try {
      const bundle = await buildUserDataExport({
        trips: state.trips,
        preferredName: product.preferredName,
        vehicleCount: product.vehicles.length,
        workPlaceCount: product.workLocations.length,
      });
      const uri = await writeUserDataExportFile(bundle);
      const result = await shareFile(uri, 'application/json', 'Export MileRecover data');
      if (result.ok || result.reason === 'cancelled') {
        setMessage(result.ok ? 'Export prepared.' : null);
      } else {
        setMessage(result.message);
      }
    } catch {
      setMessage(SHARE_COPY.failed);
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
        body="MileRecover is local-first. Trips, setup answers, vehicles, and places are saved on this device. Account sync and cloud backup are not enabled in this build. Signing in later will never upload private mileage without an explicit future consent."
        emphasis="hero"
      />
      <ListSection title="What is stored on this device">
        <EvidenceRow label="Trips" value="Manual, imported, recovered, and automatic records on device" />
        <EvidenceRow label="Places" value="Labels and addresses you enter" />
        <EvidenceRow label="Vehicles" value="Optional vehicle details you save" />
        <EvidenceRow label="Analytics" value="Event names only in preview logs; notes and coordinates are filtered out" />
        <EvidenceRow label="Account" value="Not required. No cloud sync in this build." />
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
  const { product, markFirstExport } = useProduct();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const [phase, setPhase] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const period = periodFromState(state.reportingPeriod);
  const report = reportData(
    state.trips,
    period,
    product.preferredName,
    voiceForDrivingType(product.drivingType),
    product.primaryGoal,
  );
  const canExport = reportHasExportableTrips(state.trips, period);

  const exportCsv = async () => {
    if (isShareInFlight() || phase === 'processing') {
      setMessage(SHARE_COPY.busy);
      setPhase('success');
      return;
    }
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
      const result = await writeAndShareTextFile({
        filename: csvFilename(period.label),
        contents: csv,
        mimeType: 'text/csv',
        dialogTitle: 'Share MileRecover CSV',
      });
      if (result.ok) {
        markFirstExport();
        setMessage(SHARE_COPY.csvReady);
        setPhase('success');
      } else if (result.reason === 'cancelled') {
        setMessage(null);
        setPhase('idle');
      } else {
        setMessage(result.message);
        setPhase(result.reason === 'busy' ? 'success' : 'failed');
      }
    } catch {
      setMessage(SHARE_COPY.failed);
      setPhase('failed');
    }
  };

  const exportPdf = async () => {
    if (isShareInFlight() || phase === 'processing') {
      setMessage(SHARE_COPY.busy);
      setPhase('success');
      return;
    }
    if (!capabilities.canUseStandardPdf) {
      setMessage('PDF reports come with Plus. Preview and CSV stay free.');
      setPhase('idle');
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
    if (result.ok) {
      markFirstExport();
      setMessage(SHARE_COPY.pdfReady);
      setPhase('success');
    } else if (result.reason === 'cancelled') {
      setMessage(null);
      setPhase('idle');
    } else {
      setMessage(result.message);
      setPhase(result.reason === 'busy' ? 'success' : 'failed');
    }
  };

  if (phase === 'processing') {
    return (
      <ScrollScreen>
        <LoadingState message={SHARE_COPY.preparingCsv} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <StatusCard
        variant={phase === 'failed' ? 'danger' : phase === 'success' ? 'success' : 'info'}
        title={
          phase === 'failed'
            ? 'Could not export'
            : phase === 'success'
              ? 'Ready to share'
              : 'Share confirmed work drives'
        }
        body={
          message ??
          `${period.label} · ${report.tripCount} work drive(s). Preview and CSV are always free. PDF reports come with Plus.`
        }
        emphasis={phase === 'idle' ? 'subtle' : 'hero'}
      />
      <PrimaryButton label="Share CSV · Free" onPress={() => void exportCsv()} />
      <SecondaryButton
        label={capabilities.canUseStandardPdf ? 'Share PDF' : 'PDF report · Plus'}
        onPress={() => void exportPdf()}
      />
      <SecondaryButton
        label="Preview report · Free"
        onPress={() => navigation.navigate('ReportPreview', { format: 'pdf' })}
      />
    </ScrollScreen>
  );
}

export function ReportPreviewScreen() {
  const { state } = useApp();
  const { product } = useProduct();
  const period = periodFromState(state.reportingPeriod);
  const report = reportData(
    state.trips,
    period,
    product.preferredName,
    voiceForDrivingType(product.drivingType),
    product.primaryGoal,
  );

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title={report.title}
        body={`${period.label}. For your records — not tax or legal advice.`}
        emphasis="hero"
      />
      <SoftPanel>
        <Text style={[text.title, { marginBottom: spacing.xs }]}>{report.title}</Text>
        <Text style={[text.caption, { marginBottom: spacing.md }]}>
          On-device preview · not tax or legal advice
        </Text>
        <EvidenceRow label="Period" value={report.period.label} />
        <EvidenceRow label="Driver" value={report.userName ?? 'Add a name in Profile'} />
        <EvidenceRow label="Work drives" value={String(report.tripCount)} />
        <EvidenceRow label="Total miles" value={`${report.totalMiles.toFixed(1)} mi`} />
        <EvidenceRow
          label="Open items left out"
          value={report.unresolvedCount === 0 ? '0 · all reviewed' : String(report.unresolvedCount)}
        />
      </SoftPanel>
      <ListSection title="Line items">
        {report.lineItems.length === 0 ? (
          <StatusCard
            variant="neutral"
            title="No work drives yet"
            body="Confirmed work drives will appear here with date, purpose, places, and miles."
            emphasis="subtle"
          />
        ) : (
          report.lineItems.map((item) => (
            <View
              key={item.id}
              style={{
                marginBottom: spacing.md,
                paddingBottom: spacing.sm,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: 'rgba(31, 77, 54, 0.12)',
              }}
            >
              <Text style={[text.caption, { letterSpacing: 0.3 }]}>{item.dateLabel}</Text>
              <Text style={[text.subtitle, { marginTop: 4 }]}>{item.purpose}</Text>
              <Text style={[text.body, { marginTop: 4 }]}>
                {formatReportRouteSummary(item.distanceMiles, item.startLabel, item.endLabel)}
              </Text>
            </View>
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
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedRescue, setSelectedRescue] = useState<string | null>(null);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [billingAvailable, setBillingAvailable] = useState(false);
  const period: PurchasePeriod = annual ? 'annual' : 'monthly';
  const purchasePort = getPurchasePort();
  const entitlement = product.entitlement;
  const trialEligible = shouldOfferTrial(entitlement, 'plus_only_capability', {
    lastOfferAt: product.paywallCaps.lastTrialOfferAt,
    dismissedSession: product.paywallCaps.trialOfferDismissedSession,
  });
  const plusFixture = PLAN_FIXTURES.find((plan) => plan.id === 'plus')!;
  const proFixture = PLAN_FIXTURES.find((plan) => plan.id === 'pro')!;
  const freeFixture = PLAN_FIXTURES.find((plan) => plan.id === 'free')!;
  const hasHelped =
    product.firstRecoveredDriveAt != null ||
    product.firstConfirmedWorkDriveAt != null ||
    product.firstExportAt != null;
  const heading = hasHelped
    ? 'Keep the protection that already helped.'
    : 'Choose the protection that fits your driving.';

  useEffect(() => {
    let mounted = true;
    void purchasePort.getProducts().then((products) => {
      if (mounted) setBillingAvailable(products.length > 0);
    });
    return () => {
      mounted = false;
    };
  }, [purchasePort]);

  const handleResult = async (action: () => Promise<Awaited<ReturnType<typeof purchasePort.purchasePlus>>>) => {
    if (purchaseBusy) return;
    if (!billingAvailable) {
      setNotice(STORE_UNAVAILABLE_MESSAGE);
      return;
    }
    setPurchaseBusy(true);
    try {
      const result = await action();
      if (result.ok) {
        setEntitlement(result.entitlement);
        setNotice('You’re all set — Plus is active.');
        return;
      }
      if (result.reason === 'store_unavailable') {
        logEvent(ANALYTICS_EVENTS.purchaseUnavailable, { surface: 'plans' });
        setNotice(STORE_UNAVAILABLE_MESSAGE);
        return;
      }
      if (result.reason === 'cancelled') {
        setNotice(null);
        return;
      }
      setNotice(result.message);
    } finally {
      setPurchaseBusy(false);
    }
  };

  return (
    <FixedHeaderScrollScreen
      scrollKey={annual ? 'annual' : 'monthly'}
      header={
        <View>
          <Text style={text.subtitle}>{heading}</Text>
          <Text style={[text.caption, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            Current: {entitlement.planId === 'free' ? 'Free' : entitlement.planId.toUpperCase()}.{' '}
            {billingAvailable
              ? 'Prices come from Google Play or the App Store.'
              : isPreviewBillingBuild()
                ? PREVIEW_BILLING_NOTICE
                : STORE_UNAVAILABLE_MESSAGE}
          </Text>
          <SegmentedControl
            value={annual ? 'annual' : 'monthly'}
            onChange={(value) => setAnnual(value === 'annual')}
            options={[
              { label: 'Monthly', value: 'monthly' },
              { label: 'Annual', value: 'annual' },
            ]}
          />
        </View>
      }
    >
      {notice ? <StatusCard variant="info" title="Update" body={notice} emphasis="subtle" /> : null}
      {!billingAvailable && isPreviewBillingBuild() ? (
        <StatusCard
          variant="info"
          title="Preview notice"
          body={PREVIEW_BILLING_NOTICE}
          emphasis="subtle"
        />
      ) : null}
      <PlanCard
        name={plusFixture.name}
        tagline={plusFixture.tagline}
        price={annual ? plusFixture.annualPrice : plusFixture.monthlyPrice}
        period={annual ? 'year' : 'month'}
        features={plusFixture.features}
        highlighted
        current={entitlement.planId === 'plus'}
        savingsLabel={annual ? plusFixture.annualSavingsLabel : undefined}
        purchaseDisabled={!billingAvailable || purchaseBusy}
        priceNote={!billingAvailable ? 'Preview price' : undefined}
        onSelect={() =>
          void handleResult(() =>
            trialEligible && billingAvailable
              ? purchasePort.purchasePlusTrial(period)
              : purchasePort.purchasePlus(period),
          )
        }
      />
      {trialEligible && billingAvailable ? (
        <Text style={[text.caption, { marginBottom: spacing.md }]}>
          Eligible for a 7-day Plus trial after store confirmation.{' '}
          {trialRenewalCopy(entitlement.monthlyPriceLocalized, entitlement.trialEndsAt)}
        </Text>
      ) : null}
      <PlanCard
        name={proFixture.name}
        tagline={proFixture.tagline}
        price={annual ? proFixture.annualPrice : proFixture.monthlyPrice}
        period={annual ? 'year' : 'month'}
        features={proFixture.features}
        highlighted={false}
        current={entitlement.planId === 'pro'}
        savingsLabel={annual ? proFixture.annualSavingsLabel : undefined}
        purchaseDisabled={!billingAvailable || purchaseBusy}
        priceNote={!billingAvailable ? 'Preview price' : undefined}
        onSelect={() => void handleResult(() => purchasePort.purchasePro(period))}
      />
      <SelectionCard
        title={`Stay on Free · ${freeFixture.monthlyPrice}`}
        body={`${freeFixture.tagline}. Your saved miles always stay available.`}
        selected={entitlement.planId === 'free'}
        onPress={() => {
          setSelectedPlan('free');
          setNotice('You’re on Free. Your existing records stay available.');
        }}
      />
      <Text style={[text.subtitle, { marginTop: spacing.md, marginBottom: spacing.sm }]}>One-time catch-up</Text>
      <Text style={[text.caption, { marginBottom: spacing.sm }]}>
        Not a subscription. These one-time rescue products stay available in Monthly and Annual views.
      </Text>
      {RESCUE_OPTIONS.map((option) => (
        <SelectionCard
          key={option.id}
          title={`${option.name} · ${option.price}`}
          body={`${option.description} Not a subscription.`}
          selected={selectedRescue === option.id}
          onPress={() => {
            if (!billingAvailable || purchaseBusy) {
              setNotice(STORE_UNAVAILABLE_MESSAGE);
              return;
            }
            setSelectedRescue(option.id);
            void handleResult(() => purchasePort.purchaseRescue(option.id));
          }}
        />
      ))}
      <SecondaryButton
        label="Restore purchases"
        disabled={!billingAvailable || purchaseBusy}
        onPress={() => void handleResult(() => purchasePort.restore())}
      />
      <StatusCard
        variant="neutral"
        title="Renewal"
        body="Subscriptions renew unless you cancel in Google Play or App Store settings. An in-app button alone never starts a trial."
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
          <Text style={text.subtitle}>When does automatic watching start?</Text>
          <Text style={[text.body, { marginBottom: spacing.sm }]}>
            After you turn watching on with Plus or a Plus trial, and allow location. Free still lets you add drives, import, and review.
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
          resetOnboarding({ keepVehicles: false });
          restartOnboarding();
        }}
        accessibilityLabel="Restart onboarding while preserving trips"
      />
      <StatusCard
        variant="neutral"
        title="Contact"
        body="Email support@milerecover.com with your app version from Profile → About."
        emphasis="subtle"
      />
    </ScrollScreen>
  );
}
