import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, Keyboard, Platform, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, layout, radii, spacing, typography } from '@milerecover/config';
import {
  buildMileageCsv,
  buildMileageReportData,
  capabilitiesForEntitlement,
  createManualTripRecord,
  createTripRateSnapshot,
  csvFilename,
  displayToMiles,
  estimatedValueCents,
  formatCurrencyCents,
  formatDateLocal,
  formatDistance,
  formatReportRouteSummary,
  formatTimeLocal,
  isConfirmedWorkTrip,
  KM_PER_MILE,
  MAX_TRIP_DISTANCE_MILES,
  milesToDisplay,
  rateForTimestamp,
  reportHasExportableTrips,
  resolveTripEstimatedValue,
  shouldOfferTrial,
  validateManualTripInput,
  applyVehicleFieldUpdate,
  describeAutomaticAllowance,
  suggestedNickname,
  vehicleDisplaySubtitle,
  vehicleDisplayTitle,
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
  MRCard,
  MRFormField,
  MRHeroCard,
  MRIconCircle,
  MRPrimaryButton,
  MRSecondaryButton,
  MRSegmentedControl,
  MRStatusPanel,
  MRTertiaryButton,
  PrimaryButton,
  RouteMapPreview,
  ScrollScreen,
  SecondaryButton,
  SectionHeader,
  SelectionCard,
  SoftPanel,
  StatusCard,
  TertiaryButton,
  text,
} from '../../design-system';
import { isModelCompatibleWithMake, searchMakes, searchModels } from '../../data/vehicles';
import { PLAN_FIXTURES, RESCUE_OPTIONS } from '../../fixtures/subscription';
import type { RootStackParamList } from '../../navigation/types';
import { voiceForDrivingType } from '../../product/copy';
import { useProduct } from '../../product/ProductContext';
import { selectEntitlementPlanLabel, selectPendingReviewCount, selectProtectionView } from '../../product/presentation';
import { allowInternalPreviewTools, type ReviewDecision, type VehicleDraft, type WorkLocationDraft } from '../../product/types';
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
  LAST_MANUAL_PURPOSE_STORAGE_KEY,
  LAST_MANUAL_VEHICLE_STORAGE_KEY,
  writeUserDataExportFile,
} from '../../services/dataPrivacy';
import {
  getPurchasePort,
  PREVIEW_BILLING_NOTICE,
  STORE_UNAVAILABLE_MESSAGE,
  type PurchasePeriod,
  type PurchaseProduct,
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

const LONG_DRIVE_THRESHOLD_MILES = 300 / KM_PER_MILE;

const flowStyles = StyleSheet.create({
  lockedTitle: {
    color: colors.text.primary,
    fontSize: typography.size.headline,
    lineHeight: typography.lineHeight.headline,
    fontWeight: '700',
  },
  lockedBody: {
    color: colors.text.secondary,
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
  },
  missingIllustration: {
    height: 180,
    borderRadius: radii.xl,
    backgroundColor: colors.background.mist,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missingMapLine: {
    position: 'absolute',
    width: 250,
    height: 92,
    borderRadius: radii.pill,
    borderWidth: 12,
    borderColor: '#B7E1C7',
    transform: [{ rotate: '-12deg' }],
  },
  missingCar: {
    width: 116,
    height: 54,
    borderRadius: radii.lg,
    backgroundColor: colors.forest[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  missingCarWindow: {
    width: 48,
    height: 20,
    borderRadius: radii.sm,
    backgroundColor: colors.background.card,
    opacity: 0.9,
  },
  missingPin: {
    position: 'absolute',
    right: 74,
    top: 38,
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.forest[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingPinGlyph: {
    color: colors.text.inverse,
    fontSize: typography.size.bodyLarge,
    fontWeight: '700',
  },
  trustStack: {
    gap: spacing.smMd,
    marginBottom: spacing.lg,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smMd,
  },
  trustText: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
    fontWeight: '500',
  },
  centerCaption: {
    color: colors.text.muted,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  heroKicker: {
    color: colors.text.inverse,
    opacity: 0.78,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: colors.text.inverse,
    fontSize: typography.size.headline,
    lineHeight: typography.lineHeight.headline,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  heroBody: {
    color: colors.text.inverse,
    opacity: 0.9,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    marginTop: spacing.sm,
  },
  cardStack: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  diagnosticCard: {
    minHeight: 64,
    paddingVertical: spacing.smMd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  diagnosticLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smMd,
  },
  diagnosticLabel: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
    fontWeight: '600',
  },
  statusPill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.smMd,
    paddingVertical: spacing.xs,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: '700',
    overflow: 'hidden',
    textAlign: 'center',
  },
  statusPillOk: {
    color: colors.forest[700],
    backgroundColor: colors.background.mist,
  },
  statusPillAttention: {
    color: colors.status.warning,
    backgroundColor: colors.status.warningBg,
  },
  formStack: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  fieldGroupLabel: {
    color: colors.text.primary,
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    color: colors.text.secondary,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  fieldCard: {
    minHeight: layout.fieldH,
    justifyContent: 'center',
    paddingVertical: spacing.smMd,
  },
  fieldValue: {
    color: colors.text.primary,
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
  },
  privacyCaption: {
    color: colors.text.muted,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  proCardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.sm,
  },
  proBadge: {
    color: colors.forest[900],
    backgroundColor: colors.background.card,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.smMd,
    paddingVertical: spacing.xs,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: '700',
    overflow: 'hidden',
  },
  proPlanName: {
    color: colors.text.inverse,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  proPrice: {
    color: colors.text.inverse,
    fontSize: typography.size.display,
    lineHeight: typography.lineHeight.display,
    fontWeight: '700',
  },
  proPeriod: {
    color: colors.text.inverse,
    opacity: 0.82,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    marginBottom: 3,
  },
  featureStack: {
    gap: spacing.sm,
  },
  inverseFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inverseCheck: {
    color: colors.text.inverse,
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
    fontWeight: '700',
  },
  inverseFeatureText: {
    flex: 1,
    color: colors.text.inverse,
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
  },
  planName: {
    color: colors.text.primary,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
    fontWeight: '700',
  },
  planPrice: {
    color: colors.text.secondary,
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  checkText: {
    color: colors.forest[700],
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
    fontWeight: '700',
  },
  featureText: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
});

function parseLocalizedDecimal(raw: string, localeTag: string): number {
  const compact = raw.trim().replace(/\s/g, '');
  if (!compact) return NaN;

  const decimalSeparator =
    new Intl.NumberFormat(localeTag)
      .formatToParts(1.1)
      .find((part) => part.type === 'decimal')?.value ?? '.';
  const commaIndex = compact.lastIndexOf(',');
  const dotIndex = compact.lastIndexOf('.');
  const hasComma = commaIndex >= 0;
  const hasDot = dotIndex >= 0;
  let normalized = compact;

  if (hasComma && hasDot) {
    const decimalIndex = Math.max(commaIndex, dotIndex);
    normalized = compact
      .split('')
      .filter((char, index) => (char !== ',' && char !== '.') || index === decimalIndex)
      .join('')
      .replace(',', '.');
  } else if (hasComma || decimalSeparator === ',') {
    normalized = compact.replace(',', '.');
  }

  if (!/^[+-]?(?:\d+|\d*\.\d+)$/.test(normalized)) return NaN;
  return Number(normalized);
}

function reportData(
  trips: TripRecord[],
  period: ReportPeriod,
  userName: string | null,
  drivingType: ReturnType<typeof voiceForDrivingType> | null,
  primaryGoal: Parameters<typeof buildMileageReportData>[0]['primaryGoal'] = null,
  localeProfile: Parameters<typeof buildMileageReportData>[0]['localeProfile'] = null,
): MileageReportData {
  return buildMileageReportData({
    trips,
    period,
    userName,
    mileageUseType: drivingType?.reportNoun ?? null,
    primaryGoal,
    localeProfile,
  });
}

export function ManualTripScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'ManualTrip'>>();
  const { state, upsertTrip, deleteTrip } = useApp();
  const { product } = useProduct();
  const { setUpdatePromptBlocked } = useAppUpdates();
  const locale = product.localeProfile;
  const unit = locale.distanceUnit;
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
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startTimeDraft, setStartTimeDraft] = useState(initialStart);
  const [endTimeDraft, setEndTimeDraft] = useState(initialEnd);
  const [addTime, setAddTime] = useState(Boolean(existing));
  const [routeMode, setRouteMode] = useState<'distance' | 'places'>('distance');
  const [distance, setDistance] = useState(
    existing ? milesToDisplay(existing.distanceMiles, unit).toFixed(1) : '',
  );
  const [purpose, setPurpose] = useState(existing?.purpose ?? '');
  const [startLabel, setStartLabel] = useState(existing?.startLabel ?? '');
  const [endLabel, setEndLabel] = useState(existing?.endLabel ?? '');
  const [vehicleId, setVehicleId] = useState<string | null>(
    existing?.vehicleId ?? product.vehicles[0]?.id ?? null,
  );
  const [parkingAmount, setParkingAmount] = useState(
    existing?.parkingCents != null ? (existing.parkingCents / 100).toFixed(2) : '',
  );
  const [tollsAmount, setTollsAmount] = useState(
    existing?.tollsCents != null ? (existing.tollsCents / 100).toFixed(2) : '',
  );
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (existing) return;
    void AsyncStorage.multiGet([
      LAST_MANUAL_PURPOSE_STORAGE_KEY,
      LAST_MANUAL_VEHICLE_STORAGE_KEY,
    ]).then((entries) => {
      const lastPurpose = entries[0]?.[1];
      const lastVehicle = entries[1]?.[1];
      if (lastPurpose) setPurpose((current) => current || lastPurpose);
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

  const closeTimePicker = useCallback((field: 'start' | 'end', commit: boolean) => {
    if (field === 'start') {
      if (commit) setStartTime(startTimeDraft);
      setShowStartTimePicker(false);
    } else {
      if (commit) setEndTime(endTimeDraft);
      setShowEndTimePicker(false);
    }
  }, [endTimeDraft, startTimeDraft]);

  const openTimePicker = useCallback(
    (field: 'start' | 'end') => {
      Keyboard.dismiss();
      if (field === 'start') {
        setStartTimeDraft(new Date(startTime.getTime()));
        setShowStartTimePicker(true);
        setShowEndTimePicker(false);
      } else {
        setEndTimeDraft(new Date(endTime.getTime()));
        setShowEndTimePicker(true);
        setShowStartTimePicker(false);
      }
    },
    [endTime, startTime],
  );

  const handleTimePickerChange = useCallback(
    (field: 'start' | 'end', event: { type?: string } | undefined, selected?: Date) => {
      const dismissed = event?.type === 'dismissed' || !selected;
      if (Platform.OS === 'android') {
        if (field === 'start') setShowStartTimePicker(false);
        else setShowEndTimePicker(false);
        if (dismissed) return;
        if (field === 'start') setStartTime(selected);
        else setEndTime(selected);
        return;
      }
      if (dismissed) {
        closeTimePicker(field, false);
        return;
      }
      if (field === 'start') setStartTimeDraft(selected);
      else setEndTimeDraft(selected);
    },
    [closeTimePicker],
  );

  useEffect(() => {
    if (!showDatePicker) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeDatePicker(true);
      return true;
    });
    return () => sub.remove();
  }, [closeDatePicker, showDatePicker]);

  useEffect(() => {
    if (!showStartTimePicker && !showEndTimePicker) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
      return true;
    });
    return () => sub.remove();
  }, [showEndTimePicker, showStartTimePicker]);

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

  const parsedMiles = useMemo(() => {
    const trimmed = distance.trim();
    if (!trimmed) return null;
    const entered = parseLocalizedDecimal(trimmed, locale.localeTag);
    if (!Number.isFinite(entered)) return NaN;
    return displayToMiles(entered, unit);
  }, [distance, locale.localeTag, unit]);

  const validateDistanceField = useCallback(
    (raw: string): string | null => {
      const trimmed = raw.trim();
      if (!trimmed) return `Enter the ${unit === 'km' ? 'kilometers' : 'miles'} for this drive.`;
      const entered = parseLocalizedDecimal(trimmed, locale.localeTag);
      if (!Number.isFinite(entered) || Number.isNaN(entered)) {
        return `Enter a valid number of ${unit === 'km' ? 'kilometers' : 'miles'}.`;
      }
      const miles = displayToMiles(entered, unit);
      if (miles <= 0) return 'Distance must be greater than zero.';
      if (miles > MAX_TRIP_DISTANCE_MILES) {
        return `Distance must be ${formatDistance(MAX_TRIP_DISTANCE_MILES, unit, locale.localeTag)} or less.`;
      }
      return null;
    },
    [locale.localeTag, unit],
  );

  const canSave = useMemo(() => {
    if (!classification || saving) return false;
    if (validateDistanceField(distance) != null) return false;
    if (
      routeMode === 'places' &&
      (startLabel.trim() || endLabel.trim()) &&
      validateDistanceField(distance) != null
    ) {
      return false;
    }
    return true;
  }, [classification, distance, endLabel, routeMode, saving, startLabel, validateDistanceField]);

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

  const save = (options: { longDriveConfirmed?: boolean; overnightConfirmed?: boolean } = {}) => {
    Keyboard.dismiss();
    if (saving) return;
    setError(null);
    const fieldError = validateDistanceField(distance);
    setDistanceError(fieldError);
    if (!classification) {
      setError('Choose Work, Personal, or Decide later.');
      return;
    }
    if (fieldError) return;
    const miles = parsedMiles ?? Number.parseFloat(distance.trim());
    if (routeMode === 'places' && (startLabel.trim() || endLabel.trim()) && !(Number.isFinite(miles) && miles > 0)) {
      setDistanceError('Enter the distance too. We never invent distance from start and end.');
      return;
    }
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    if (driveDate.getTime() > todayEnd.getTime()) {
      setError('Choose today or an earlier date.');
      return;
    }
    const startAt = composeDateTime(driveDate, startTime, 9, 0);
    let endAt = composeDateTime(driveDate, endTime, 9, 30);
    if (addTime && endAt < startAt) {
      if (!options.overnightConfirmed) {
        Alert.alert(
          'End time is before start time',
          'Was this an overnight drive that ended the next day?',
          [
            { text: 'Edit times', style: 'cancel' },
            { text: 'Confirm overnight', onPress: () => save({ ...options, overnightConfirmed: true }) },
          ],
        );
        return;
      }
      endAt += 24 * 60 * 60 * 1000;
    }
    if (miles >= LONG_DRIVE_THRESHOLD_MILES && !options.longDriveConfirmed) {
      const displayDistance = formatDistance(miles, unit, locale.localeTag, 0);
      Alert.alert('Long drive?', `That is a long drive. Confirm ${displayDistance}.`, [
        { text: 'Edit distance', style: 'cancel' },
        { text: 'Confirm', onPress: () => save({ ...options, longDriveConfirmed: true }) },
      ]);
      return;
    }
    const input = {
      id: existing?.id,
      startAt,
      endAt,
      distanceMiles: miles,
      purpose: classification === 'personal' ? purpose.trim() || 'Personal' : purpose.trim(),
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
    const parkingCents = (() => {
      const dollars = parseLocalizedDecimal(parkingAmount, locale.localeTag);
      return Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : null;
    })();
    const tollsCents = (() => {
      const dollars = parseLocalizedDecimal(tollsAmount, locale.localeTag);
      return Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : null;
    })();
    upsertTrip({
      ...trip,
      source: existing?.source ?? trip.source,
      rateSnapshot: createTripRateSnapshot(product.localeProfile, startAt),
      parkingCents,
      tollsCents,
      receiptUri: existing?.receiptUri ?? null,
      createdAt: existing?.createdAt ?? trip.createdAt,
      updatedAt: Date.now(),
    });
    void AsyncStorage.multiSet([
      [LAST_MANUAL_PURPOSE_STORAGE_KEY, purpose.trim()],
      [LAST_MANUAL_VEHICLE_STORAGE_KEY, vehicleId ?? ''],
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
          <MRPrimaryButton
            label={existing ? 'Save changes' : 'Save drive'}
            onPress={() => save()}
            disabled={!canSave}
            loading={saving}
          />
          {existing ? <DestructiveButton label="Delete drive" onPress={confirmDelete} /> : null}
          <Text style={flowStyles.privacyCaption}>Your data stays private and secure</Text>
        </View>
      }
    >
      <View style={flowStyles.formStack}>
        <MRSegmentedControl
          value="manual"
          onChange={(value) => {
            if (value === 'import') navigation.navigate('BringExistingMileage');
          }}
          options={[
            { label: 'Manual entry', value: 'manual' },
            { label: 'From other app', value: 'import' },
          ]}
        />

        <View>
          <Text style={flowStyles.fieldGroupLabel}>Work or personal?</Text>
          <MRSegmentedControl
            value={classification === 'personal' ? 'personal' : 'work'}
            onChange={(value) => setClassification(value)}
            options={[
              { label: 'Work', value: 'work' },
              { label: 'Personal', value: 'personal' },
            ]}
          />
        </View>

        <View>
          <Text style={flowStyles.fieldLabel}>Date</Text>
          <MRCard
            onPress={() => {
              if (showDatePicker) closeDatePicker(true);
              else openDatePicker();
            }}
            style={flowStyles.fieldCard}
            accessibilityLabel="Choose drive date"
          >
            <Text style={flowStyles.fieldValue}>{formatDateLocal(driveDate.getTime())}</Text>
          </MRCard>
        </View>
      </View>
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
      <MRFormField
        label="Start location"
        value={startLabel}
        onChangeText={(value) => {
          setStartLabel(value);
          setRouteMode('places');
        }}
        placeholder="Where you started"
        autoCapitalize="words"
      />
      <MRFormField
        label="End location"
        value={endLabel}
        onChangeText={(value) => {
          setEndLabel(value);
          setRouteMode('places');
        }}
        placeholder="Where you finished"
        autoCapitalize="words"
      />
      <MRFormField
        label={unit === 'km' ? 'Distance (km)' : 'Distance (mi)'}
        value={distance}
        onChangeText={(value) => {
          setDistance(value);
          if (distanceError) setDistanceError(validateDistanceField(value));
        }}
        placeholder="0.0"
        keyboardType="decimal-pad"
        accessibilityLabel={unit === 'km' ? 'Distance in kilometers' : 'Distance in miles'}
      />
      {distanceError ? <FormError message={distanceError} /> : null}
      {savedFlash ? (
        <MRStatusPanel message="Saved. Your drive is on this device." />
      ) : null}

      <SelectionCard
        title="More details"
        body="Optional time, vehicle, purpose, notes, expenses, and receipt."
        selected={showDetails}
        onPress={() => setShowDetails((value) => !value)}
      />
      {showDetails ? (
        <>
          <SelectionCard
            title="Add time"
            body={addTime ? 'Start and end time included.' : 'Optional. Date alone is fine.'}
            selected={addTime}
            onPress={() =>
              setAddTime((value) => {
                const next = !value;
                if (!next) {
                  setShowStartTimePicker(false);
                  setShowEndTimePicker(false);
                }
                return next;
              })
            }
          />
          <Text style={[text.caption, { marginBottom: spacing.xs }]}>Date shortcuts</Text>
          <ChipRow>
            <Chip label="Today" selected={false} onPress={() => applyDateOffset(0)} />
            <Chip label="Yesterday" selected={false} onPress={() => applyDateOffset(1)} />
          </ChipRow>
          {addTime ? (
            <>
              <EvidenceRow label="Start time" value={formatTimeLocal(startTime.getTime())} />
              <SecondaryButton
                label={showStartTimePicker ? 'Cancel start time' : 'Choose start time'}
                onPress={() => {
                  if (showStartTimePicker) closeTimePicker('start', false);
                  else openTimePicker('start');
                }}
              />
              {showStartTimePicker ? (
                <View>
                  {Platform.OS === 'ios' ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                      <TertiaryButton label="Cancel" onPress={() => closeTimePicker('start', false)} />
                      <TertiaryButton label="OK" onPress={() => closeTimePicker('start', true)} />
                    </View>
                  ) : null}
                  <DateTimePicker
                    value={Platform.OS === 'ios' ? startTimeDraft : startTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selected) => handleTimePickerChange('start', event, selected)}
                  />
                </View>
              ) : null}
              <EvidenceRow label="End time" value={formatTimeLocal(endTime.getTime())} />
              <SecondaryButton
                label={showEndTimePicker ? 'Cancel end time' : 'Choose end time'}
                onPress={() => {
                  if (showEndTimePicker) closeTimePicker('end', false);
                  else openTimePicker('end');
                }}
              />
              {showEndTimePicker ? (
                <View>
                  {Platform.OS === 'ios' ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                      <TertiaryButton label="Cancel" onPress={() => closeTimePicker('end', false)} />
                      <TertiaryButton label="OK" onPress={() => closeTimePicker('end', true)} />
                    </View>
                  ) : null}
                  <DateTimePicker
                    value={Platform.OS === 'ios' ? endTimeDraft : endTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selected) => handleTimePickerChange('end', event, selected)}
                  />
                </View>
              ) : null}
            </>
          ) : null}
          {classification === 'work' || classification === 'later' ? (
            <>
              <Text style={[text.caption, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>
                Purpose (optional)
              </Text>
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
                  placeholder="Describe the drive"
                  compact
                />
              ) : null}
            </>
          ) : (
            <FormField
              label="Purpose (optional)"
              value={purpose}
              onChangeText={setPurpose}
              placeholder="Personal"
              compact
            />
          )}
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
          <Text style={[text.caption, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>
            Expense proof (optional)
          </Text>
          <FormField
            label="Parking"
            value={parkingAmount}
            onChangeText={setParkingAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            compact
            accessibilityLabel="Parking amount"
          />
          <FormField
            label="Tolls"
            value={tollsAmount}
            onChangeText={setTollsAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            compact
            accessibilityLabel="Tolls amount"
          />
          <Text style={[text.caption, { marginBottom: spacing.sm }]}>
            Receipt photos stay on this device. No bank linking or OCR in this version.
          </Text>
        </>
      ) : null}
    </ScrollScreen>
  );
}

export function TripDetailsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'TripDetails'>>();
  const navigation = useNavigation<Nav>();
  const { state, classifyTrip, deleteTrip } = useApp();
  const { product, pushReviewHistory } = useProduct();
  const [showMore, setShowMore] = useState(false);
  const trip = state.trips.find((item) => item.id === route.params.tripId);
  const locale = product.localeProfile;

  if (!trip) {
    return (
      <ScrollScreen>
        <StatusCard variant="warning" title="Trip not found" body="This record is no longer available." emphasis="hero" />
      </ScrollScreen>
    );
  }

  const vehicle = trip.vehicleId
    ? product.vehicles.find((item) => item.id === trip.vehicleId)
    : null;
  const vehicleName = vehicle
    ? vehicle.nickname || [vehicle.make, vehicle.model].filter(Boolean).join(' ')
    : 'Not set';
  const tripValue = resolveTripEstimatedValue(trip, locale);
  const estimate = tripValue.estimatedValueCents;
  const rateMissing = tripValue.missingHistoricalRate;
  const classificationLabel =
    trip.classification === 'business'
      ? 'Work'
      : trip.classification === 'personal'
        ? 'Personal'
        : trip.status === 'rejected'
          ? 'Not a drive'
          : 'Needs review';
  const sourceLabel =
    trip.source === 'auto_detected'
      ? 'Automatic protection'
      : trip.source === 'recovered'
        ? 'Recovered'
        : trip.source === 'imported'
          ? 'Imported'
          : 'Manual entry';

  const classify = (decision: Exclude<ReviewDecision, null>) => {
    classifyTrip(
      trip.id,
      decision,
      decision === 'work'
        ? { rateSnapshot: createTripRateSnapshot(product.localeProfile, trip.startAt) }
        : undefined,
    );
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

  const confirmDelete = () => {
    Alert.alert('Delete this drive?', 'This removes the record from this device. You can still add it again later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTrip(trip.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title={classificationLabel}
        body="Confirm only what you know. Personal and rejected drives stay out of reports."
        emphasis="subtle"
      />
      <ListSection title="Route">
        <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
          <RouteMapPreview points={trip.routePreview ?? null} height={160} width={280} />
        </View>
        <EvidenceRow label="Date" value={formatDateLocal(trip.startAt)} />
        <EvidenceRow
          label="Time"
          value={`${formatTimeLocal(trip.startAt)} – ${formatTimeLocal(trip.endAt)}`}
        />
        <EvidenceRow label="Start" value={trip.startLabel ?? 'Not set'} />
        <EvidenceRow label="Destination" value={trip.endLabel ?? 'Not set'} />
        <EvidenceRow
          label="Distance"
          value={formatDistance(trip.distanceMiles, locale.distanceUnit, locale.localeTag)}
        />
        <EvidenceRow label="Vehicle" value={vehicleName} />
        <EvidenceRow label="Purpose" value={trip.purpose ?? 'Not set'} />
        <EvidenceRow
          label="Estimated value"
          value={
            estimate != null
              ? formatCurrencyCents(estimate, locale.currencyCode, locale.localeTag)
              : rateMissing
                ? 'Missing historical rate'
                : 'Set a rate in Profile'
          }
        />
        <EvidenceRow
          label="Trip replay"
          value={
            trip.routePreview && trip.routePreview.length >= 2
              ? `${trip.routePreview.length} recorded points`
              : 'No recorded route points'
          }
        />
      </ListSection>
      <PrimaryButton label="Work" onPress={() => classify('work')} accessibilityLabel="Classify as work" />
      <SecondaryButton label="Personal" onPress={() => classify('personal')} accessibilityLabel="Classify as personal" />
      <SecondaryButton label="Not sure" onPress={() => classify('not_sure')} accessibilityLabel="Mark as not sure" />
      <DestructiveButton label="Wasn't a drive" onPress={() => classify('not_drive')} />
      <SecondaryButton
        label="Edit"
        onPress={() => navigation.navigate('ManualTrip', { tripId: trip.id })}
        accessibilityLabel="Edit this drive"
      />
      <TertiaryButton
        label={showMore ? 'Hide details' : 'More details'}
        onPress={() => setShowMore((value) => !value)}
        accessibilityLabel={showMore ? 'Hide advanced trip details' : 'Show more trip details'}
      />
      {showMore ? (
        <ListSection title="Evidence and notes">
          <EvidenceRow label="Source" value={sourceLabel} />
          <EvidenceRow label="Evidence" value={trip.evidenceMethod ?? 'Not set'} />
          <EvidenceRow label="Confidence" value={trip.confidence ?? 'Not set'} />
          <EvidenceRow label="Notes" value={trip.notes?.trim() || 'None'} />
          <EvidenceRow
            label="Parking"
            value={
              trip.parkingCents != null
                ? formatCurrencyCents(trip.parkingCents, locale.currencyCode, locale.localeTag)
                : 'None'
            }
          />
          <EvidenceRow
            label="Tolls"
            value={
              trip.tollsCents != null
                ? formatCurrencyCents(trip.tollsCents, locale.currencyCode, locale.localeTag)
                : 'None'
            }
          />
          <EvidenceRow label="Receipt" value={trip.receiptUri ? 'Attached' : 'None'} />
          <DestructiveButton label="Delete drive" onPress={confirmDelete} accessibilityLabel="Delete this drive" />
        </ListSection>
      ) : null}
    </ScrollScreen>
  );
}

export function MissingDrivesIntroScreen() {
  const navigation = useNavigation<Nav>();
  const { product } = useProduct();
  const { refreshRecoverySuggestions } = useApp();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const [busy, setBusy] = useState(false);

  const runCheck = () => {
    if (busy) return;
    if (!capabilities.canUseGapDetection) {
      navigation.navigate('PlanSelection', { source: 'upgrade' });
      return;
    }
    setBusy(true);
    refreshRecoverySuggestions(product.workLocations.map((loc) => ({ id: loc.id, label: loc.label })));
    setBusy(false);
    navigation.navigate('MainTabs', { screen: 'Review' });
  };

  return (
    <ScrollScreen>
      <View style={flowStyles.missingIllustration} accessibilityRole="image" accessibilityLabel="Car finding missed drives">
        <View style={flowStyles.missingMapLine} />
        <View style={flowStyles.missingCar}>
          <View style={flowStyles.missingCarWindow} />
        </View>
        <View style={flowStyles.missingPin}>
          <Text style={flowStyles.missingPinGlyph}>✓</Text>
        </View>
      </View>
      <Text style={[flowStyles.lockedTitle, { marginBottom: spacing.sm }]} accessibilityRole="header">
        Find the miles you missed
      </Text>
      <Text style={[flowStyles.lockedBody, { marginBottom: spacing.md }]}>
        MileRecover scans for gaps in your driving history and suggests miles you may have missed.
      </Text>
      <View style={flowStyles.trustStack}>
        {[
          'Uses your existing location data',
          'Nothing is added without you',
          'Takes about 1 minute',
        ].map((item) => (
          <View key={item} style={flowStyles.trustRow}>
            <MRIconCircle glyph="✓" accessibilityLabel="Included" />
            <Text style={flowStyles.trustText}>{item}</Text>
          </View>
        ))}
      </View>
      <MRPrimaryButton
        label="Run check now"
        loading={busy}
        onPress={runCheck}
        accessibilityLabel="Run check for missed drives"
      />
      <Text style={flowStyles.centerCaption}>Takes about 1 minute</Text>
    </ScrollScreen>
  );
}

export function MissingTripRecoveryScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'MissingTripRecovery'>>();
  const navigation = useNavigation<Nav>();
  const { state, confirmRecovery, rejectRecovery } = useApp();
  const { product, pushReviewHistory } = useProduct();
  const locale = product.localeProfile;
  const unit = locale.distanceUnit;
  const reviewItem = state.reviewItems.find((item) => item.id === route.params.reviewId);
  const candidateId =
    reviewItem && reviewItem.kind === 'possible_missing_trip'
      ? reviewItem.recoveryCandidateId
      : route.params.reviewId.replace(/^review-recovery-/, '');
  const candidate = state.recoveryCandidates.find((item) => item.id === candidateId);
  const [distance, setDistance] = useState(
    candidate?.proposedDistanceMiles != null
      ? milesToDisplay(candidate.proposedDistanceMiles, unit).toFixed(1)
      : '',
  );
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
    const entered = Number.parseFloat(distance);
    const miles = displayToMiles(entered, unit);
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

  const unknownBits = [
    candidate.proposedDistanceMiles == null ? 'Distance is unknown until you enter it.' : null,
    'Calendar permission is not required for this suggestion.',
  ].filter(Boolean);

  return (
    <ScrollScreen>
      <StatusCard
        variant="warning"
        title="Was this a work drive?"
        body={candidate.plainLanguageExplanation}
        emphasis="hero"
      />
      <ListSection title="Why we suggested this">
        <EvidenceRow label="Confidence" value={candidate.confidence} />
        <EvidenceRow
          label="Time"
          value={`${formatDateLocal(candidate.proposedStartAt)} ${formatTimeLocal(candidate.proposedStartAt)} - ${formatTimeLocal(candidate.proposedEndAt)}`}
        />
        <EvidenceRow
          label="Suggested distance"
          value={
            candidate.proposedDistanceMiles != null
              ? formatDistance(candidate.proposedDistanceMiles, unit, locale.localeTag)
              : 'Needs your entry — nothing invented'
          }
        />
        {candidate.evidence.map((evidence) => (
          <EvidenceRow key={`${evidence.kind}-${evidence.summary}`} label={evidence.kind} value={evidence.summary} />
        ))}
        {unknownBits.map((bit) => (
          <EvidenceRow key={bit!} label="Unknown" value={bit!} />
        ))}
      </ListSection>
      <FormField
        label={unit === 'km' ? 'Distance (km)' : 'Distance (miles)'}
        value={distance}
        onChangeText={setDistance}
        placeholder="0.0"
        accessibilityLabel={unit === 'km' ? 'Distance in kilometers' : 'Distance in miles'}
      />
      <FormField label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="Recovered work drive" />
      {error ? <FormError message={error} /> : null}
      <PrimaryButton label="Confirm work drive" onPress={confirm} accessibilityLabel="Confirm recovered work drive" />
      <SecondaryButton label="Personal, leave out" onPress={() => reject('personal')} />
      <DestructiveButton label="Not a drive" onPress={() => reject('not_drive')} />
    </ScrollScreen>
  );
}

/**
 * Protection Center — guided repair (explain → ask → verify → success).
 * Route name stays ProtectionAlert for navigation compatibility.
 */
export function ProtectionAlertScreen() {
  const navigation = useNavigation<Nav>();
  const {
    state,
    permissions,
    automaticCaptureAvailable,
    requestLocationPermission,
    requestBackgroundPermission,
    refreshPermissions,
    openSystemSettings,
  } = useApp();
  const { product, setProtectionSetupState, setTrackingEnabled } = useProduct();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const setupIncomplete =
    product.protectionSetupState === 'not_started' || product.protectionSetupState === 'educated';
  const pendingReviewCount = selectPendingReviewCount(
    state,
    product,
    permissions,
    automaticCaptureAvailable,
  );
  const protection = selectProtectionView({
    app: state,
    product,
    permissions,
    automaticCaptureAvailable,
    pendingReviewCount,
  });
  const foregroundReady = permissions.location === 'granted';
  const backgroundReady =
    permissions.backgroundLocation === 'granted' || permissions.backgroundLocation === 'not_applicable';
  const primaryAction = protection.primaryAction;
  const overviewHeroTitle = protection.state === 'PROTECTED' ? "You're protected" : protection.title;
  const overviewHeroBody =
    protection.state === 'PROTECTED'
      ? 'MileRecover is actively tracking and watching for work drives.'
      : protection.message;
  const overviewDiagnosticRows = [
    {
      label: 'Background tracking',
      value: product.trackingEnabled && capabilities.canUseAutomaticCapture && backgroundReady ? 'On' : 'Needs attention',
      glyph: '↻',
    },
    {
      label: 'Location access',
      value: foregroundReady ? 'On' : 'Needs attention',
      glyph: '⌖',
    },
    {
      label: 'Battery optimized',
      value: permissions.batteryOptimizationRestricted ? 'Needs attention' : 'Up to date',
      glyph: '⚡',
    },
    {
      label: 'Motion detection',
      value: automaticCaptureAvailable ? 'Active' : 'Needs attention',
      glyph: '◌',
    },
    {
      label: 'Data sync',
      value: protection.state === 'PROTECTED' || protection.lastCheckLabel ? 'Up to date' : 'Needs attention',
      glyph: '✓',
    },
  ];
  const [guideStep, setGuideStep] = useState<
    'overview' | 'explain_fg' | 'ask_fg' | 'explain_bg' | 'ask_bg' | 'verify' | 'success'
  >('overview');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refreshPermissions();
    });
    return () => sub.remove();
  }, [refreshPermissions]);

  useEffect(() => {
    if (protection.state === 'PROTECTED' && guideStep !== 'overview') {
      setGuideStep('success');
      if (setupIncomplete) setProtectionSetupState('configured');
    }
  }, [guideStep, protection.state, setProtectionSetupState, setupIncomplete]);

  const startGuidedRepair = () => {
    if (!capabilities.canUseAutomaticCapture) {
      navigation.navigate('PlanSelection', { source: 'upgrade' });
      return;
    }
    if (!foregroundReady) setGuideStep('explain_fg');
    else if (!backgroundReady) setGuideStep('explain_bg');
    else if (!product.trackingEnabled) {
      setTrackingEnabled(true);
      setGuideStep('verify');
    } else setGuideStep('verify');
  };

  const runPrimaryAction = () => {
    if (primaryAction.action === 'none') return;
    if (primaryAction.action === 'see_plans') {
      navigation.navigate('PlanSelection', { source: 'upgrade' });
      return;
    }
    if (primaryAction.action === 'review_trips') {
      navigation.navigate('MainTabs', { screen: 'Review' });
      return;
    }
    if (primaryAction.action === 'enable_watching') {
      if (!capabilities.canUseAutomaticCapture) {
        navigation.navigate('PlanSelection', { source: 'upgrade' });
        return;
      }
      setTrackingEnabled(true);
      return;
    }
    if (primaryAction.action === 'finish_setup' || primaryAction.action === 'open_location_settings') {
      startGuidedRepair();
      return;
    }
    if (primaryAction.action === 'open_battery_settings') {
      void openSystemSettings();
    }
  };

  if (guideStep === 'explain_fg' || guideStep === 'ask_fg') {
    return (
      <ScrollScreen>
        <SectionHeader title="How location helps" />
        <Text style={[text.body, { marginBottom: spacing.md }]}>
          Location is used only to help protect work drives. We explain before we ask. You can skip and
          still add drives manually.
        </Text>
        <StatusCard
          variant="info"
          title="While using the app"
          body="MileRecover needs location while open so it can notice when a work drive starts."
          emphasis="hero"
        />
        <PrimaryButton
          label={busy ? 'Asking…' : 'Allow location while using the app'}
          loading={busy}
          onPress={() => {
            setBusy(true);
            void requestLocationPermission()
              .then((snap) => {
                if (snap.location === 'granted') setGuideStep('explain_bg');
                else setGuideStep('verify');
              })
              .finally(() => setBusy(false));
          }}
          accessibilityLabel="Allow location while using the app"
        />
        <SecondaryButton
          label="Continue with manual tracking"
          onPress={() => {
            setGuideStep('overview');
            navigation.goBack();
          }}
          accessibilityLabel="Continue with manual tracking instead"
        />
        <TertiaryButton label="I’ll finish this later" onPress={() => setGuideStep('overview')} />
      </ScrollScreen>
    );
  }

  if (guideStep === 'explain_bg' || guideStep === 'ask_bg') {
    return (
      <ScrollScreen>
        <SectionHeader title="Background protection" />
        <Text style={[text.body, { marginBottom: spacing.md }]}>
          Background location lets MileRecover keep protecting drives when the app isn’t open. We’ll open
          system settings only if your phone requires it.
        </Text>
        <StatusCard
          variant="info"
          title="You’re in control"
          body="You can skip this and keep adding drives manually. Background location helps catch drives when the app isn’t open."
          emphasis="hero"
        />
        <PrimaryButton
          label={busy ? 'Asking…' : 'Allow background location'}
          loading={busy}
          onPress={() => {
            setBusy(true);
            void requestBackgroundPermission()
              .then((snap) => {
                if (snap.backgroundLocation !== 'granted') void openSystemSettings();
              })
              .finally(() => {
                setBusy(false);
                setGuideStep('verify');
              });
          }}
          accessibilityLabel="Allow background location"
        />
        <SecondaryButton label="Open system settings" onPress={() => void openSystemSettings()} />
        <TertiaryButton
          label="Skip for now — manual still works"
          onPress={() => setGuideStep('overview')}
          accessibilityLabel="Skip background location for now"
        />
      </ScrollScreen>
    );
  }

  if (guideStep === 'verify' || guideStep === 'success') {
    const ok = protection.state === 'PROTECTED';
    const waiting = protection.state === 'CONFIGURED_WAITING';
    const configuredReady =
      capabilities.canUseAutomaticCapture &&
      foregroundReady &&
      backgroundReady &&
      product.trackingEnabled &&
      waiting;
    const canFinishSetup = ok || waiting || configuredReady;
    return (
      <ScrollScreen>
        <StatusCard
          variant={ok ? 'success' : configuredReady || waiting ? 'info' : 'warning'}
          title={
            ok
              ? 'You’re protected'
              : configuredReady || waiting
                ? 'Waiting for first drive'
                : 'Checking protection…'
          }
          body={
            ok
              ? 'Automatic protection looks ready. Manual drives always remain available.'
              : configuredReady || waiting
                ? 'Permissions and automatic capture are configured. We’ll call it protected after the first verified drive.'
              : 'We’ll re-check permissions. If something is still off, we’ll show one clear fix.'
          }
          emphasis="hero"
        />
        <SoftPanel>
          <EvidenceRow label="While using the app" value={foregroundReady ? 'Allowed' : 'Not allowed'} />
          <EvidenceRow label="In the background" value={backgroundReady ? 'Allowed' : 'Not allowed'} />
          <EvidenceRow
            label="Automatic protection"
            value={product.trackingEnabled ? 'On' : 'Paused'}
          />
          {protection.lastCheckLabel ? (
            <EvidenceRow label="Last check" value={protection.lastCheckLabel.replace(/^Last successful check:\s*/i, '')} />
          ) : null}
        </SoftPanel>
        <PrimaryButton
          label="Check again"
          onPress={() => void refreshPermissions()}
          accessibilityLabel="Check protection permissions again"
        />
        {!foregroundReady ? (
          <SecondaryButton label="Allow location while using the app" onPress={() => setGuideStep('explain_fg')} />
        ) : null}
        {foregroundReady && !backgroundReady ? (
          <SecondaryButton label="Allow background location" onPress={() => setGuideStep('explain_bg')} />
        ) : null}
        {canFinishSetup ? (
          <PrimaryButton
            label="Done"
            onPress={() => {
              setProtectionSetupState('configured');
              if (!product.trackingEnabled && capabilities.canUseAutomaticCapture) {
                setTrackingEnabled(true);
              }
              navigation.goBack();
            }}
            accessibilityLabel="Finish protection setup"
          />
        ) : (
          <TertiaryButton label="Continue with manual tracking" onPress={() => navigation.goBack()} />
        )}
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <Text style={[flowStyles.lockedTitle, { marginBottom: spacing.md }]} accessibilityRole="header">
        Protection Center
      </Text>
      <MRHeroCard accessibilityLabel={overviewHeroTitle}>
        <Text style={flowStyles.heroKicker}>Protection</Text>
        <Text style={flowStyles.heroTitle}>{overviewHeroTitle}</Text>
        <Text style={flowStyles.heroBody}>{overviewHeroBody}</Text>
      </MRHeroCard>
      <View style={flowStyles.cardStack}>
        {overviewDiagnosticRows.map((row) => (
          <MRCard key={row.label} style={flowStyles.diagnosticCard}>
            <View style={flowStyles.diagnosticLeft}>
              <MRIconCircle glyph={row.glyph} accessibilityLabel={row.label} />
              <Text style={flowStyles.diagnosticLabel}>{row.label}</Text>
            </View>
            <Text
              style={[
                flowStyles.statusPill,
                row.value === 'Needs attention' ? flowStyles.statusPillAttention : flowStyles.statusPillOk,
              ]}
            >
              {row.value}
            </Text>
          </MRCard>
        ))}
      </View>
      <MRPrimaryButton
        label="Run diagnostics"
        onPress={primaryAction.action !== 'none' ? runPrimaryAction : startGuidedRepair}
        accessibilityLabel="Run diagnostics"
      />
      <MRSecondaryButton label="Tracking details" onPress={() => navigation.navigate('TrackingActive')} />
      <Text style={flowStyles.centerCaption}>Manual entry is always available.</Text>
    </ScrollScreen>
  );
}

function diagnosticTimeLabel(timestamp: number | null | undefined): string {
  if (!timestamp) return 'None';
  return `${formatDateLocal(timestamp)} ${formatTimeLocal(timestamp)}`;
}

function diagnosticSampleLabel(sample: TrackingDiagnostics['lastAcceptedSample']): string {
  if (!sample) return 'None';
  const coords =
    sample.latitude != null && sample.longitude != null
      ? ` · ${sample.latitude.toFixed(5)}, ${sample.longitude.toFixed(5)}`
      : '';
  return `${diagnosticTimeLabel(sample.timestamp)}${coords}`;
}

function diagnosticRejectedSampleLabel(sample: TrackingDiagnostics['lastRejectedSample']): string {
  if (!sample) return 'None';
  return `${diagnosticTimeLabel(sample.timestamp)} · ${sample.reason}`;
}

export function TrackingActiveScreen() {
  const navigation = useNavigation<Nav>();
  const { permissions, state, automaticCaptureAvailable, refreshPermissions } = useApp();
  const { product } = useProduct();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const allowance = describeAutomaticAllowance(product.entitlement, state.trips);
  const allowanceOk = allowance.remaining == null || allowance.remaining > 0;
  const pendingReviewCount = selectPendingReviewCount(
    state,
    product,
    permissions,
    automaticCaptureAvailable,
  );
  const protection = selectProtectionView({
    app: state,
    product,
    permissions,
    automaticCaptureAvailable,
    pendingReviewCount,
  });
  const [diagnostics, setDiagnostics] = useState<TrackingDiagnostics | null>(null);
  const [diagnosticsBusy, setDiagnosticsBusy] = useState(false);
  const [showDiagnosticsDetails, setShowDiagnosticsDetails] = useState(false);

  const refreshDiagnostics = () => {
    void getTrackingDiagnostics().then(setDiagnostics);
  };

  const runDiagnostics = () => {
    if (diagnosticsBusy) return;
    setDiagnosticsBusy(true);
    void Promise.all([refreshPermissions(), getTrackingDiagnostics()])
      .then(([, nextDiagnostics]) => setDiagnostics(nextDiagnostics))
      .finally(() => setDiagnosticsBusy(false));
  };

  useEffect(() => {
    refreshDiagnostics();
  }, [product.trackingEnabled]);

  const foregroundAllowed = permissions.location === 'granted';
  const backgroundAllowed =
    permissions.backgroundLocation === 'granted' || permissions.backgroundLocation === 'not_applicable';
  const automaticReady = product.trackingEnabled && capabilities.canUseAutomaticCapture && allowanceOk;
  const allowanceLabel =
    allowance.limit == null
      ? 'Unlimited automatic trips this month.'
      : `${allowance.remaining} of ${allowance.limit} automatic trips left this month.`;
  const lastCheckValue = protection.lastCheckLabel
    ? protection.lastCheckLabel.replace(/^Last successful check:\s*/i, '')
    : diagnostics?.lastSampleAt
      ? `${formatDateLocal(diagnostics.lastSampleAt)} ${formatTimeLocal(diagnostics.lastSampleAt)}`
      : 'Needs attention';
  const allowedLabel = (ok: boolean) => (ok ? 'Allowed' : 'Needs attention');
  const onLabel = (ok: boolean) => (ok ? 'On' : 'Needs attention');
  const showDevDiagnostics = product.showDevTools && allowInternalPreviewTools();

  const systemsOk =
    foregroundAllowed &&
    backgroundAllowed &&
    !permissions.batteryOptimizationRestricted &&
    automaticReady &&
    !(diagnostics?.backgroundLimited === true);
  const topTitle = systemsOk ? 'All systems normal' : 'One or more checks need attention';
  const topBody = systemsOk
    ? `${allowanceLabel} Repair actions live in Protection Center.`
    : `${allowanceLabel} Open Protection Center to repair anything that needs attention.`;
  const trackingRows = [
    { label: 'Location access', value: allowedLabel(foregroundAllowed), glyph: '⌖' },
    { label: 'Background permission', value: allowedLabel(backgroundAllowed), glyph: '↻' },
    {
      label: 'Battery optimized',
      value: allowedLabel(!permissions.batteryOptimizationRestricted),
      glyph: '⚡',
    },
    { label: 'Automatic protection', value: onLabel(automaticReady), glyph: '✓' },
    { label: 'Last location check', value: lastCheckValue, glyph: '◌' },
    {
      label: 'Last verified capture',
      value: diagnosticTimeLabel(diagnostics?.lastSuccessfulAutomaticTripAt),
      glyph: '✓',
    },
  ];

  return (
    <ScrollScreen>
      <Text style={[flowStyles.lockedTitle, { marginBottom: spacing.sm }]} accessibilityRole="header">
        Tracking health
      </Text>
      <Text style={[flowStyles.lockedBody, { marginBottom: spacing.md }]}>
        Automatic capture status is summarized here. Repair actions live in Protection Center.
      </Text>
      <MRStatusPanel message={`${topTitle}. ${topBody}`} tone={systemsOk ? 'ok' : 'attention'} />
      <View style={flowStyles.cardStack}>
        {trackingRows.map((row) => (
          <MRCard key={row.label} style={flowStyles.diagnosticCard}>
            <View style={flowStyles.diagnosticLeft}>
              <MRIconCircle glyph={row.glyph} accessibilityLabel={row.label} />
              <Text style={flowStyles.diagnosticLabel}>{row.label}</Text>
            </View>
            <Text
              style={[
                flowStyles.statusPill,
                row.value === 'Needs attention' ? flowStyles.statusPillAttention : flowStyles.statusPillOk,
              ]}
            >
              {row.value}
            </Text>
          </MRCard>
        ))}
      </View>
      <MRPrimaryButton
        label="Run diagnostics"
        onPress={runDiagnostics}
        loading={diagnosticsBusy}
        accessibilityLabel="Run tracking diagnostics"
      />
      <MRSecondaryButton label="Open Protection Center" onPress={() => navigation.navigate('ProtectionAlert')} />
      {showDevDiagnostics ? (
        <>
          <MRTertiaryButton
            label={showDiagnosticsDetails ? 'Hide dev diagnostics' : 'Show dev diagnostics'}
            onPress={() => setShowDiagnosticsDetails((value) => !value)}
          />
          {showDiagnosticsDetails ? (
            <ListSection title="Dev diagnostics">
              <EvidenceRow label="Engine state" value={diagnostics?.engineState ?? 'Unknown'} />
              <EvidenceRow label="Trip state" value={diagnostics?.activeTripState ?? 'Unknown'} />
              <EvidenceRow label="Permissions" value={diagnostics?.permissionState ?? 'Unknown'} />
              <EvidenceRow label="Pending queue" value={String(diagnostics?.queueLength ?? 0)} />
              <EvidenceRow
                label="Background callback"
                value={diagnosticTimeLabel(diagnostics?.lastBackgroundCallbackAt)}
              />
              <EvidenceRow
                label="Last accepted sample"
                value={diagnosticSampleLabel(diagnostics?.lastAcceptedSample ?? null)}
              />
              <EvidenceRow
                label="Last rejected sample"
                value={diagnosticRejectedSampleLabel(diagnostics?.lastRejectedSample ?? null)}
              />
              <EvidenceRow
                label="Battery restriction"
                value={diagnostics?.batteryRestrictionState ?? 'unknown'}
              />
            </ListSection>
          ) : null}
        </>
      ) : null}
      {diagnostics?.backgroundLimited && automaticReady ? (
        <MRStatusPanel
          tone="attention"
          message="Background capture may be limited. Some drives may be missed when the app isn’t open."
        />
      ) : null}
      <Text style={flowStyles.centerCaption}>Manual entry is always available.</Text>
    </ScrollScreen>
  );
}

export function VehicleSetupScreen() {
  const navigation = useNavigation<Nav>();
  const { product, upsertVehicle, deleteVehicle } = useProduct();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const primary = product.vehicles.find((v) => v.isPrimary) ?? product.vehicles[0];
  const [editingId, setEditingId] = useState<string | null>(primary?.id ?? null);
  const editing = product.vehicles.find((v) => v.id === editingId) ?? null;
  const [nickname, setNickname] = useState(editing?.nickname ?? '');
  const [nicknameUserSet, setNicknameUserSet] = useState(editing?.nicknameUserSet === true);
  const [year, setYear] = useState(editing?.year ?? '');
  const [make, setMake] = useState(editing?.make ?? '');
  const [model, setModel] = useState(editing?.model ?? '');
  const [plate, setPlate] = useState(editing?.plate ?? '');
  const [makeQuery, setMakeQuery] = useState(editing?.make ?? '');
  const [modelQuery, setModelQuery] = useState(editing?.model ?? '');
  const [isPrimary, setIsPrimary] = useState(editing?.isPrimary ?? true);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [saved, setSaved] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const isNew = editingId == null;
  const atFreeLimit = isNew && product.vehicles.length >= capabilities.maxVehicles;
  const makeMatches = useMemo(() => searchMakes(makeQuery || make).slice(0, 8), [make, makeQuery]);
  const modelMatches = useMemo(
    () => (make ? searchModels(make, modelQuery || model).slice(0, 8) : []),
    [make, model, modelQuery],
  );
  const filteredVehicles = useMemo(() => {
    const q = vehicleSearch.trim().toLowerCase();
    if (!q) return product.vehicles;
    return product.vehicles.filter((vehicle) =>
      [vehicle.nickname, vehicle.make, vehicle.model, vehicle.year, vehicle.plate]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [product.vehicles, vehicleSearch]);

  const applyMakeChange = (nextMake: string) => {
    const previous = {
      id: editing?.id ?? 'draft',
      nickname,
      year,
      make,
      model,
      plate,
      isPrimary,
      nicknameUserSet,
    };
    const next = applyVehicleFieldUpdate(previous, { make: nextMake, model: '' });
    setMake(nextMake);
    setMakeQuery(nextMake);
    setModel('');
    setModelQuery('');
    if (!nicknameUserSet) setNickname(suggestedNickname({ year, make: nextMake, model: '' }));
    setValidationMessage(null);
    void next;
  };

  const loadVehicle = (vehicleId: string | null) => {
    const vehicle = vehicleId ? product.vehicles.find((item) => item.id === vehicleId) : null;
    setEditingId(vehicleId);
    setNickname(vehicle?.nickname ?? '');
    setNicknameUserSet(vehicle?.nicknameUserSet === true);
    setYear(vehicle?.year ?? '');
    setMake(vehicle?.make ?? '');
    setModel(vehicle?.model ?? '');
    setPlate(vehicle?.plate ?? '');
    setMakeQuery(vehicle?.make ?? '');
    setModelQuery(vehicle?.model ?? '');
    setIsPrimary(vehicle?.isPrimary ?? product.vehicles.length === 0);
    setSaved(false);
    setValidationMessage(null);
  };

  const save = () => {
    const hasValue = nickname.trim() || make.trim() || model.trim() || year.trim();
    if (!hasValue) return;
    if (atFreeLimit) {
      setLimitMessage(`Free includes up to ${capabilities.maxVehicles} vehicle. Choose Plus for more.`);
      navigation.navigate('PlanSelection', { source: 'upgrade' });
      return;
    }
    if (!isModelCompatibleWithMake(make, model)) {
      setValidationMessage('That model doesn’t match the selected make. Choose a model from the list or Other.');
      return;
    }
    const composed = [year.trim(), make.trim(), model.trim()].filter(Boolean).join(' ');
    const nick = nickname.trim();
    const id = editing?.id ?? localId('vehicle');
    const duplicate = product.vehicles.some(
      (vehicle) =>
        vehicle.id !== id &&
        vehicle.year.trim() === year.trim() &&
        vehicle.make.trim().toLowerCase() === make.trim().toLowerCase() &&
        vehicle.model.trim().toLowerCase() === model.trim().toLowerCase() &&
        vehicle.plate.trim().toLowerCase() === plate.trim().toLowerCase(),
    );
    if (duplicate) {
      setValidationMessage('A matching vehicle is already saved. Edit that one instead.');
      return;
    }
    upsertVehicle({
      id,
      nickname: nick || composed || 'My vehicle',
      year: year.trim(),
      make: make.trim(),
      model: model.trim() || (make === 'Other' ? 'Other' : ''),
      plate: plate.trim(),
      isPrimary,
      createdAt: editing?.createdAt,
      nicknameUserSet: nicknameUserSet || (Boolean(nick) && nick !== composed),
    });
    setEditingId(id);
    setSaved(true);
    setLimitMessage(null);
    setValidationMessage(null);
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Which vehicle carries your work miles?"
        body="Search make and model, or type your own. One primary vehicle is the default for new drives."
        emphasis="subtle"
      />
      {limitMessage ? <StatusCard variant="warning" title="Vehicle limit" body={limitMessage} emphasis="subtle" /> : null}
      {validationMessage ? (
        <StatusCard variant="warning" title="Check vehicle details" body={validationMessage} emphasis="subtle" />
      ) : null}
      {product.vehicles.length > 0 ? (
        <ListSection title="Your vehicles">
          <FormField
            label="Search saved vehicles"
            value={vehicleSearch}
            onChangeText={setVehicleSearch}
            placeholder="Nickname, make, model…"
            accessibilityLabel="Search saved vehicles"
          />
          {filteredVehicles.map((vehicle) => (
            <SelectionCard
              key={vehicle.id}
              title={vehicleDisplayTitle(vehicle)}
              body={[
                vehicle.isPrimary ? 'Primary' : null,
                vehicleDisplaySubtitle(vehicle),
              ]
                .filter(Boolean)
                .join(' · ') || 'Tap to edit'}
              selected={editingId === vehicle.id}
              onPress={() => loadVehicle(vehicle.id)}
            />
          ))}
          <TertiaryButton label="Add another vehicle" onPress={() => loadVehicle(null)} />
        </ListSection>
      ) : null}
      <FormField
        label="Year"
        value={year}
        onChangeText={(value) => {
          setYear(value);
          if (!nicknameUserSet) setNickname(suggestedNickname({ year: value, make, model }));
        }}
        placeholder="2022"
        keyboardType="numeric"
        accessibilityLabel="Vehicle year"
      />
      <FormField
        label="Search make"
        value={makeQuery}
        onChangeText={(value) => {
          setMakeQuery(value);
          applyMakeChange(value);
        }}
        placeholder="Honda, Toyota…"
        accessibilityLabel="Search vehicle make"
      />
      {makeMatches.map((choice) => (
        <SelectionCard
          key={choice}
          title={choice}
          selected={make === choice}
          onPress={() => applyMakeChange(choice)}
        />
      ))}
      <SelectionCard
        title="Other"
        selected={make === 'Other'}
        onPress={() => applyMakeChange('Other')}
      />
      <FormField
        label="Search model"
        value={modelQuery}
        onChangeText={(value) => {
          setModelQuery(value);
          setModel(value);
          if (!nicknameUserSet) setNickname(suggestedNickname({ year, make, model: value }));
        }}
        placeholder="Civic, Camry, or Other"
        accessibilityLabel="Search vehicle model"
      />
      {modelMatches.map((choice) => (
        <SelectionCard
          key={choice}
          title={choice}
          selected={model === choice}
          onPress={() => {
            setModel(choice);
            setModelQuery(choice);
            if (!nicknameUserSet) setNickname(suggestedNickname({ year, make, model: choice }));
          }}
        />
      ))}
      <FormField
        label="Nickname (optional)"
        value={nickname}
        onChangeText={(value) => {
          setNickname(value);
          setNicknameUserSet(true);
        }}
        placeholder="Work sedan"
      />
      <FormField label="License plate (optional)" value={plate} onChangeText={setPlate} placeholder="Optional" />
      <SelectionCard
        title="Primary vehicle"
        body={isPrimary ? 'Used as the default on new drives' : 'Tap to make this your primary vehicle'}
        selected={isPrimary}
        onPress={() => setIsPrimary(true)}
      />
      <PrimaryButton
        label={isNew ? 'Save vehicle' : 'Update vehicle'}
        onPress={save}
        disabled={!nickname.trim() && !make.trim() && !model.trim() && !year.trim()}
      />
      {!isNew && editingId ? (
        <DestructiveButton
          label="Delete vehicle"
          onPress={() => {
            Alert.alert('Delete this vehicle?', 'Drives keep their history. New automatic drives will use your next primary vehicle.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  deleteVehicle(editingId);
                  loadVehicle(null);
                },
              },
            ]);
          }}
        />
      ) : null}
      {saved ? <StatusCard variant="success" title="Saved" body="Vehicle details are stored locally." emphasis="subtle" /> : null}
    </ScrollScreen>
  );
}

const PLACE_RULE_PREFIX = '[rule:';
type PlaceRule = 'usually_personal' | 'usually_work' | 'always_ask';

function encodePlaceNotes(rule: PlaceRule, details: string): string {
  const trimmed = details.trim();
  return trimmed ? `${PLACE_RULE_PREFIX}${rule}] ${trimmed}` : `${PLACE_RULE_PREFIX}${rule}]`;
}

function decodePlaceNotes(notes: string): { rule: PlaceRule; details: string } {
  const match = notes.match(/^\[rule:(usually_personal|usually_work|always_ask)\]\s?(.*)$/s);
  if (!match) return { rule: 'always_ask', details: notes };
  return { rule: match[1] as PlaceRule, details: match[2] ?? '' };
}

function placeRuleLabel(rule: PlaceRule): string {
  switch (rule) {
    case 'usually_personal':
      return 'Usually personal';
    case 'usually_work':
      return 'Usually work';
    default:
      return 'Always ask';
  }
}

export function WorkLocationSetupScreen() {
  const navigation = useNavigation<Nav>();
  const { product, upsertWorkLocation } = useProduct();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const [kind, setKind] = useState<WorkLocationDraft['kind']>('workplace');
  const [searchLabel, setSearchLabel] = useState('');
  const [privateLabel, setPrivateLabel] = useState('');
  const [placeRule, setPlaceRule] = useState<PlaceRule>('always_ask');
  const [details, setDetails] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [saved, setSaved] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const defaultLabelForKind = (value: WorkLocationDraft['kind']): string => {
    switch (value) {
      case 'home':
        return 'Home';
      case 'client':
        return 'Client';
      case 'other':
        return 'Other place';
      default:
        return 'Work';
    }
  };

  const save = () => {
    const label = privateLabel.trim() || searchLabel.trim() || defaultLabelForKind(kind);
    const address = searchLabel.trim();
    const notes = encodePlaceNotes(placeRule, details);
    if (!label && !address && !details.trim()) return;
    if (product.workLocations.length >= capabilities.maxWorkplaces) {
      setLimitMessage(`Free includes up to ${capabilities.maxWorkplaces} familiar places. Choose Plus for more.`);
      navigation.navigate('PlanSelection', { source: 'upgrade' });
      return;
    }
    upsertWorkLocation({
      id: localId('work-place'),
      label,
      address,
      notes,
      kind,
    });
    setSaved(true);
    setLimitMessage(null);
    setSearchLabel('');
    setPrivateLabel('');
    setDetails('');
    setPlaceRule('always_ask');
    setShowDetails(false);
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Familiar places speed up review"
        body="Add labels for places you visit often. Nothing is saved until you tap Save."
        emphasis="subtle"
      />
      {limitMessage ? <StatusCard variant="warning" title="Place limit" body={limitMessage} emphasis="subtle" /> : null}

      <FormField
        label="Search or label"
        value={searchLabel}
        onChangeText={setSearchLabel}
        placeholder="Office, client site, neighborhood…"
      />

      <ChipRow>
        <Chip label="Home" selected={kind === 'home'} onPress={() => setKind('home')} />
        <Chip label="Work" selected={kind === 'workplace'} onPress={() => setKind('workplace')} />
        <Chip label="Client" selected={kind === 'client'} onPress={() => setKind('client')} />
        <Chip label="Other" selected={kind === 'other'} onPress={() => setKind('other')} />
      </ChipRow>

      <FormField
        label="Private label (optional)"
        value={privateLabel}
        onChangeText={setPrivateLabel}
        placeholder={defaultLabelForKind(kind)}
      />

      <Text style={[text.subtitle, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>Place rule</Text>
      <SelectionCard
        title="Usually personal"
        body="Personal by default — you can still mark work drives."
        selected={placeRule === 'usually_personal'}
        onPress={() => setPlaceRule('usually_personal')}
      />
      <SelectionCard
        title="Usually work"
        body="Work by default when this place appears."
        selected={placeRule === 'usually_work'}
        onPress={() => setPlaceRule('usually_work')}
      />
      <SelectionCard
        title="Always ask"
        body="MileRecover asks before classifying drives here."
        selected={placeRule === 'always_ask'}
        onPress={() => setPlaceRule('always_ask')}
      />

      <TertiaryButton
        label={showDetails ? 'Hide details' : 'Add details'}
        onPress={() => setShowDetails((open) => !open)}
      />
      {showDetails ? (
        <FormField
          label="Notes"
          value={details}
          onChangeText={setDetails}
          placeholder="Optional context — parking, gate code, etc."
        />
      ) : null}

      <PrimaryButton
        label="Save place"
        onPress={save}
        disabled={!searchLabel.trim() && !privateLabel.trim() && !details.trim()}
      />
      {saved ? <StatusCard variant="success" title="Saved" body="Place stored locally on this device." emphasis="subtle" /> : null}

      {product.workLocations.length > 0 ? (
        <ListSection title="Saved places">
          {product.workLocations.map((loc) => {
            const decoded = decodePlaceNotes(loc.notes ?? '');
            return (
              <EvidenceRow
                key={loc.id}
                label={loc.label}
                value={`${placeRuleLabel(decoded.rule)}${loc.address ? ` · ${loc.address}` : ''}`}
              />
            );
          })}
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

export function TermsScreen() {
  return (
    <ScrollScreen>
      <SectionHeader title="Terms of use" />
      <StatusCard
        variant="info"
        title="Simple terms for MileRecover"
        body="MileRecover helps you track and report mileage you capture, import, or confirm. Estimated values use the rate you choose and are not tax, legal, or reimbursement advice."
        emphasis="hero"
      />
      <SoftPanel>
        <Text style={[text.body, { marginBottom: spacing.sm }]}>
          You stay in control of which drives count as work. Automatic capture only creates records from
          location evidence on this device. Manual entry always remains available.
        </Text>
        <Text style={[text.body, { marginBottom: spacing.sm }]}>
          Subscriptions and trials are billed through Google Play or the App Store. Cancel anytime in
          store settings. Free remains usable after a trial under the published Free plan limits.
        </Text>
        <Text style={text.body}>
          By using MileRecover you agree to keep your records accurate and to review exported reports
          before sharing them with an employer or tax preparer.
        </Text>
      </SoftPanel>
    </ScrollScreen>
  );
}

export function PrivacyScreen() {
  const { state, resetLocalData } = useApp();
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
              await resetLocalData();
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
        body="MileRecover records miles you capture, import, or confirm. Trips and setup stay local-first on this device. Cloud backup is not enabled in this build."
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
    product.localeProfile,
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
    product.localeProfile,
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
        <EvidenceRow
          label={product.localeProfile.distanceUnit === 'km' ? 'Work distance' : 'Total miles'}
          value={formatDistance(
            report.totalMiles,
            product.localeProfile.distanceUnit,
            product.localeProfile.localeTag,
          )}
        />
        <EvidenceRow
          label="Generated"
          value={new Date(report.generatedAt).toLocaleString(product.localeProfile.localeTag)}
        />
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

type PaidPlanId = 'plus' | 'pro';

function paidStoreProduct(
  products: PurchaseProduct[],
  planId: PaidPlanId,
  period: PurchasePeriod,
): PurchaseProduct | undefined {
  return products.find((product) => product.planId === planId && product.period === period && !product.oneTime);
}

export function PlanSelectionScreen() {
  const navigation = useNavigation<Nav>();
  const { state } = useApp();
  const { product, setSelectedPlan, setEntitlement } = useProduct();
  const [annual, setAnnual] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [billingAvailable, setBillingAvailable] = useState(false);
  const [storeProducts, setStoreProducts] = useState<PurchaseProduct[]>([]);
  const period: PurchasePeriod = annual ? 'annual' : 'monthly';
  const purchasePort = getPurchasePort();
  const entitlement = product.entitlement;
  const trialEligible = shouldOfferTrial(entitlement, 'plus_only_capability', {
    lastOfferAt: product.paywallCaps.lastTrialOfferAt,
    dismissedSession: product.paywallCaps.trialOfferDismissedSession,
  });
  const previewFixture = !billingAvailable && isPreviewBillingBuild();
  const freeFixture = PLAN_FIXTURES.find((plan) => plan.id === 'free')!;
  const plusFixture = PLAN_FIXTURES.find((plan) => plan.id === 'plus')!;
  const proFixture = PLAN_FIXTURES.find((plan) => plan.id === 'pro')!;
  const locale = product.localeProfile;
  const currentPlanLabel = selectEntitlementPlanLabel(entitlement);
  const trialDaysLeft =
    entitlement.status === 'trialActive' && entitlement.trialEndsAt
      ? Math.max(0, Math.ceil((entitlement.trialEndsAt - Date.now()) / 86400000))
      : null;
  const currentPlanBody =
    trialDaysLeft != null
      ? `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your trial.`
      : entitlement.planId === 'free'
        ? 'Free stays usable with manual logging, capped automatic trips, and basic CSV.'
        : 'Your store-verified access controls paid features on this device.';
  const confirmedWorkMiles = state.trips.filter(isConfirmedWorkTrip).reduce((sum, trip) => sum + trip.distanceMiles, 0);
  const valueProof =
    confirmedWorkMiles > 0
      ? `You've confirmed ${formatDistance(confirmedWorkMiles, locale.distanceUnit, locale.localeTag)} of work driving on this device.`
      : null;
  const plusPeriod = trialEligible ? 'monthly' : period;
  const planPrice = (planId: PaidPlanId, planPeriod: PurchasePeriod): string => {
    const storeProduct = paidStoreProduct(storeProducts, planId, planPeriod);
    if (storeProduct) return storeProduct.priceLocalized;
    const fixture = planId === 'plus' ? plusFixture : proFixture;
    if (!billingAvailable) return planPeriod === 'annual' ? fixture.annualPrice : fixture.monthlyPrice;
    if (entitlement.planId === planId) {
      const entitlementPrice =
        planPeriod === 'annual' ? entitlement.annualPriceLocalized : entitlement.monthlyPriceLocalized;
      if (entitlementPrice) return entitlementPrice;
    }
    return 'Store price unavailable';
  };
  const plusPrice = planPrice('plus', plusPeriod);
  const proPrice = planPrice('pro', period);
  const plusFeatures = [
    'Unlimited automatic trips',
    'Unlimited missing scans',
    'PDF reports and more vehicles',
  ];
  const freeFeatures = [
    '40 automatic trips/month',
    '1 vehicle',
    '1 missing scan/month',
    'Unlimited manual trips',
    'Basic CSV export',
  ];
  const proMarketingFeatures = [
    'Unlimited automatic tracking',
    'Missing drive recovery',
    'Advanced PDF reports',
    'Multiple vehicles',
    'Priority support',
  ];

  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.paywallViewed, { source: 'plan_selection' });
  }, []);

  useEffect(() => {
    let mounted = true;
    void purchasePort.getProducts().then((products) => {
      if (mounted) {
        setStoreProducts(products);
        setBillingAvailable(products.length > 0);
      }
    });
    return () => {
      mounted = false;
    };
  }, [purchasePort]);

  const handlePurchase = async (
    plan: 'plus' | 'pro',
    action: () => Promise<Awaited<ReturnType<typeof purchasePort.purchasePlus>>>,
  ) => {
    if (purchaseBusy) return;
    logEvent(ANALYTICS_EVENTS.planSelected, { plan, period });
    if (!billingAvailable) {
      setNotice(STORE_UNAVAILABLE_MESSAGE);
      return;
    }
    logEvent(ANALYTICS_EVENTS.purchaseStarted, { plan, period });
    setPurchaseBusy(true);
    try {
      const result = await action();
      if (result.ok) {
        logEvent(ANALYTICS_EVENTS.purchaseCompleted, { plan, period });
        setEntitlement(result.entitlement);
        setNotice(`You're all set — ${plan === 'pro' ? 'Pro' : 'Plus'} is active.`);
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
      logEvent(ANALYTICS_EVENTS.purchaseFailed, { plan, period, reason: result.reason });
      setNotice(result.message);
    } finally {
      setPurchaseBusy(false);
    }
  };

  const selectFree = () => {
    logEvent(ANALYTICS_EVENTS.planSelected, { plan: 'free', period: 'none' });
    setSelectedPlan('free');
    setNotice("You're on Free. Your existing records stay available.");
  };
  const plusCta = trialEligible ? 'Start 7-day free trial' : 'Continue with Plus';
  const proCta = trialEligible ? 'Start Free 7-Day Trial' : 'Continue with Pro';

  return (
    <FixedHeaderScrollScreen
      scrollKey={annual ? 'annual' : 'monthly'}
      header={
        <View>
          <Text style={flowStyles.lockedTitle}>Go Pro</Text>
          <Text style={[flowStyles.lockedBody, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            Recover more miles. Save more money.
          </Text>
          {valueProof ? (
            <Text style={[text.caption, { marginBottom: spacing.sm }]}>{valueProof}</Text>
          ) : null}
          <MRSegmentedControl
            value={annual ? 'annual' : 'monthly'}
            onChange={(value) => setAnnual(value === 'annual')}
            options={[
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly (Save 20%)', value: 'annual' },
            ]}
          />
        </View>
      }
    >
      {!billingAvailable && isPreviewBillingBuild() ? (
        <StatusCard variant="info" title="Preview" body={PREVIEW_BILLING_NOTICE} emphasis="subtle" />
      ) : notice && !(isPreviewBillingBuild() && notice === STORE_UNAVAILABLE_MESSAGE) ? (
        <StatusCard variant="info" title="Update" body={notice} emphasis="subtle" />
      ) : null}

      <StatusCard
        variant="info"
        title={`Current plan: ${currentPlanLabel}`}
        body={currentPlanBody}
        emphasis="subtle"
      />

      <MRHeroCard accessibilityLabel={`Pro plan ${proPrice}`}>
        <View style={flowStyles.proCardHeader}>
          <Text style={flowStyles.proBadge}>Most Popular</Text>
        </View>
        <Text style={flowStyles.proPlanName}>Pro</Text>
        <View style={flowStyles.priceRow}>
          <Text style={flowStyles.proPrice}>{proPrice}</Text>
          <Text style={flowStyles.proPeriod}>/{annual ? 'year' : 'month'}</Text>
        </View>
        <View style={flowStyles.featureStack}>
          {proMarketingFeatures.map((feature) => (
            <View key={feature} style={flowStyles.inverseFeatureRow}>
              <Text style={flowStyles.inverseCheck}>✓</Text>
              <Text style={flowStyles.inverseFeatureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </MRHeroCard>

      <MRPrimaryButton
        label={proCta}
        loading={purchaseBusy}
        disabled={purchaseBusy}
        onPress={() => void handlePurchase('pro', () => purchasePort.purchasePro(period))}
        accessibilityLabel={proCta}
      />

      <MRTertiaryButton
        label={showCompare ? 'Hide plan comparison' : 'Compare all plans'}
        onPress={() => setShowCompare((value) => !value)}
      />

      {showCompare ? (
        <View style={flowStyles.cardStack}>
          <MRCard selected={entitlement.planId === 'plus'}>
            <Text style={flowStyles.planName}>{plusFixture.name}</Text>
            <Text style={flowStyles.planPrice}>{plusPrice} / {plusPeriod === 'annual' ? 'year' : 'month'}</Text>
            {plusFeatures.map((feature) => (
              <View key={feature} style={flowStyles.featureRow}>
                <Text style={flowStyles.checkText}>✓</Text>
                <Text style={flowStyles.featureText}>{feature}</Text>
              </View>
            ))}
            <MRSecondaryButton
              label={plusCta}
              disabled={purchaseBusy}
              onPress={() =>
                void handlePurchase('plus', () =>
                  trialEligible
                    ? purchasePort.purchasePlusTrial('monthly')
                    : purchasePort.purchasePlus(period),
                )
              }
            />
          </MRCard>
          <MRCard selected={entitlement.planId === 'free'}>
            <Text style={flowStyles.planName}>{freeFixture.name}</Text>
            <Text style={flowStyles.planPrice}>{freeFixture.monthlyPrice} / month</Text>
            {freeFeatures.map((feature) => (
              <View key={feature} style={flowStyles.featureRow}>
                <Text style={flowStyles.checkText}>✓</Text>
                <Text style={flowStyles.featureText}>{feature}</Text>
              </View>
            ))}
            <MRSecondaryButton label="Continue with Free" onPress={selectFree} />
          </MRCard>
        </View>
      ) : null}

      <MRTertiaryButton
        label="Need to recover older mileage instead?"
        onPress={() => navigation.navigate('RescueProducts')}
      />

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        <MRTertiaryButton
          label="Restore purchases"
          onPress={() => {
            if (!billingAvailable || purchaseBusy) {
              setNotice(STORE_UNAVAILABLE_MESSAGE);
              return;
            }
            void handlePurchase('plus', () => purchasePort.restore());
          }}
        />
        <Text style={text.caption}>
          Subscriptions renew unless cancelled in Google Play or App Store settings.{' '}
          <Text style={text.caption} onPress={() => navigation.navigate('Terms')}>
            Terms
          </Text>
          {' · '}
          <Text style={text.caption} onPress={() => navigation.navigate('Privacy')}>
            Privacy
          </Text>
        </Text>
      </View>
    </FixedHeaderScrollScreen>
  );
}

export function RescueProductsScreen() {
  const { product, setEntitlement } = useProduct();
  const [notice, setNotice] = useState<string | null>(null);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [billingAvailable, setBillingAvailable] = useState(false);
  const purchasePort = getPurchasePort();

  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.rescueViewed, {});
  }, []);

  useEffect(() => {
    let mounted = true;
    void purchasePort.getProducts().then((products) => {
      if (mounted) setBillingAvailable(products.length > 0);
    });
    return () => {
      mounted = false;
    };
  }, [purchasePort]);

  const purchaseRescue = async (rescueId: string) => {
    if (purchaseBusy) return;
    if (!billingAvailable) {
      setNotice(STORE_UNAVAILABLE_MESSAGE);
      return;
    }
    logEvent(ANALYTICS_EVENTS.purchaseStarted, { plan: rescueId, period: 'one_time' });
    setPurchaseBusy(true);
    try {
      const result = await purchasePort.purchaseRescue(rescueId);
      if (result.ok) {
        logEvent(ANALYTICS_EVENTS.purchaseCompleted, { plan: rescueId, period: 'one_time' });
        setEntitlement(result.entitlement);
        setNotice('Rescue purchase complete. Check Review for recovered drives.');
        return;
      }
      if (result.reason === 'store_unavailable') {
        setNotice(STORE_UNAVAILABLE_MESSAGE);
        return;
      }
      if (result.reason === 'cancelled') {
        setNotice(null);
        return;
      }
      logEvent(ANALYTICS_EVENTS.purchaseFailed, { plan: rescueId, reason: result.reason });
      setNotice(result.message);
    } finally {
      setPurchaseBusy(false);
    }
  };

  return (
    <ScrollScreen>
      <SectionHeader title="One-time rescue" />
      <Text style={[text.body, { marginBottom: spacing.md }]}>
        Catch up on older mileage without a subscription. Purchases are processed through your app store.
      </Text>
      {!billingAvailable && isPreviewBillingBuild() ? (
        <StatusCard variant="info" title="Preview" body={PREVIEW_BILLING_NOTICE} emphasis="subtle" />
      ) : notice && !(isPreviewBillingBuild() && notice === STORE_UNAVAILABLE_MESSAGE) ? (
        <StatusCard variant="info" title="Update" body={notice} emphasis="subtle" />
      ) : null}
      {RESCUE_OPTIONS.map((option) => (
        <SelectionCard
          key={option.id}
          title={`${option.name} · ${option.price}`}
          body={`${option.description} Not a subscription.`}
          selected={false}
          onPress={() => void purchaseRescue(option.id)}
        />
      ))}
      {product.entitlement.planId !== 'free' ? (
        <Text style={[text.caption, { marginTop: spacing.sm }]}>
          Your {product.entitlement.planId.toUpperCase()} plan handles ongoing protection. Rescue is for historical catch-up only.
        </Text>
      ) : null}
    </ScrollScreen>
  );
}

export function HelpSupportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Help and support"
        body="MileRecover records miles you capture, import, or confirm."
        emphasis="subtle"
      />
      <ListSection title="Send feedback">
        <TertiaryButton
          label="Share feedback"
          onPress={() =>
            Alert.alert(
              'Thanks',
              'Feedback stays on this device for now. Email support when you’re ready to send more detail.',
            )
          }
          accessibilityLabel="Share product feedback"
        />
      </ListSection>
      <ListSection title="Common questions">
        <View style={{ gap: spacing.sm }}>
          <Text style={text.subtitle}>Will MileRecover invent miles?</Text>
          <Text style={[text.body, { marginBottom: spacing.sm }]}>
            No. Manual entries, imports, and recovery suggestions all require real details or your confirmation.
          </Text>
          <Text style={text.subtitle}>When does automatic protection start?</Text>
          <Text style={[text.body, { marginBottom: spacing.sm }]}>
            After you turn protection on and allow location. Free includes up to 40 automatic trips per month, plus unlimited manual drives.
          </Text>
          <Text style={text.subtitle}>Can I review setup without losing trips?</Text>
          <Text style={text.body}>
            Yes. Review setup lets you adjust profile, country, units, and rates while keeping trips on this device.
          </Text>
        </View>
      </ListSection>
      <PrimaryButton
        label="Review setup"
        onPress={() => navigation.navigate('EditSetup')}
        accessibilityLabel="Review setup while preserving trips"
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
