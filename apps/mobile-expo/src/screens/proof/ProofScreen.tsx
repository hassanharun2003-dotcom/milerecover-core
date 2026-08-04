import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  buildMileageCsv,
  buildMileageReportData,
  capabilitiesForEntitlement,
  csvFilename,
  formatCurrencyCents,
  formatDistance,
  proofReadinessForTrip,
  rateForTimestamp,
  reportTitleForGoal,
  resolveReportPeriod,
  type ReportPeriod,
  type ReportPeriodKind,
  type TripRecord,
} from '@milerecover/domain';
import {
  EmptyState,
  FormError,
  ListRow,
  ListSection,
  PrimaryButton,
  SecondaryButton,
  SegmentedControl,
  SoftPanel,
  TabScreen,
  text,
} from '../../design-system';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { DEMO_SCENARIOS } from '../../fixtures/scenarios';
import { useProduct } from '../../product/ProductContext';
import {
  isShareInFlight,
  SHARE_COPY,
  subscribeShareInFlight,
  writeAndShareTextFile,
} from '../../services/fileShare';
import { generateAndSharePdf } from '../../services/pdfReport';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';
import { useApp } from '../../store/AppContext';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Proof'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const PERIOD_OPTIONS: { label: string; value: ReportPeriodKind }[] = [
  { label: 'Week', value: 'this_week' },
  { label: 'Month', value: 'this_month' },
  { label: 'Prev. month', value: 'previous_month' },
  { label: 'YTD', value: 'ytd' },
];

function periodFromState(period: { id: string; label: string; startAt: number; endAt: number }): ReportPeriod {
  const kind = PERIOD_OPTIONS.some((option) => option.value === period.id)
    ? (period.id as ReportPeriodKind)
    : 'custom';
  return { kind, label: period.label, startAt: period.startAt, endAt: period.endAt };
}

function vehicleLookup(vehicles: { id: string; nickname: string; make: string; model: string }[]): Record<string, string> {
  return vehicles.reduce<Record<string, string>>((acc, vehicle) => {
    acc[vehicle.id] = vehicle.nickname || [vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle';
    return acc;
  }, {});
}

type ProofCheckId = 'purpose' | 'route' | 'vehicle' | 'rate' | 'unresolved';

interface ProofCheck {
  id: ProofCheckId;
  label: string;
  pass: boolean;
  detail: string;
}

function buildProofChecks(input: {
  confirmedWorkTrips: TripRecord[];
  vehiclesExist: boolean;
  valueRequested: boolean;
  rateOk: boolean;
  unresolvedCount: number;
}): ProofCheck[] {
  const missingPurpose = input.confirmedWorkTrips.filter((trip) => !trip.purpose?.trim());
  const missingRoute = input.confirmedWorkTrips.filter(
    (trip) => !trip.startLabel?.trim() && !trip.endLabel?.trim(),
  );
  const missingVehicle = input.vehiclesExist
    ? input.confirmedWorkTrips.filter((trip) => !trip.vehicleId)
    : [];

  return [
    {
      id: 'purpose',
      label: 'Purpose on every drive',
      pass: missingPurpose.length === 0,
      detail:
        missingPurpose.length === 0
          ? 'Each work drive has a purpose.'
          : `${missingPurpose.length} drive${missingPurpose.length === 1 ? '' : 's'} need a purpose.`,
    },
    {
      id: 'route',
      label: 'Route or place labels',
      pass: missingRoute.length === 0,
      detail:
        missingRoute.length === 0
          ? 'Start or end labels are recorded.'
          : `${missingRoute.length} drive${missingRoute.length === 1 ? '' : 's'} need route labels.`,
    },
    {
      id: 'vehicle',
      label: 'Vehicle assigned',
      pass: !input.vehiclesExist || missingVehicle.length === 0,
      detail: !input.vehiclesExist
        ? 'No vehicles saved — optional.'
        : missingVehicle.length === 0
          ? 'Each drive is linked to a vehicle.'
          : `${missingVehicle.length} drive${missingVehicle.length === 1 ? '' : 's'} need a vehicle.`,
    },
    {
      id: 'rate',
      label: 'Mileage rate',
      pass: !input.valueRequested || input.rateOk,
      detail: !input.valueRequested
        ? 'Value estimate not required for your goal.'
        : input.rateOk
          ? 'Rate is set for this period.'
          : 'Review or set your mileage rate.',
    },
    {
      id: 'unresolved',
      label: 'Uncertain drives resolved',
      pass: input.unresolvedCount === 0,
      detail:
        input.unresolvedCount === 0
          ? 'Nothing waiting in Review.'
          : `${input.unresolvedCount} uncertain drive${input.unresolvedCount === 1 ? '' : 's'} still in Review.`,
    },
  ];
}

export function ProofScreen() {
  const navigation = useNavigation<Nav>();
  const { state, setReportingPeriod } = useApp();
  const { product, markFirstExport, markFirstReportPreview } = useProduct();
  const [periodKind, setPeriodKind] = useState<ReportPeriodKind>(
    PERIOD_OPTIONS.some((option) => option.value === state.reportingPeriod.id)
      ? (state.reportingPeriod.id as ReportPeriodKind)
      : 'ytd',
  );
  const [showReadiness, setShowReadiness] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvBusy, setCsvBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);

  useEffect(() => subscribeShareInFlight(setShareBusy), []);

  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const period = periodFromState(state.reportingPeriod);
  const tripsForProof = product.demoModeEnabled
    ? DEMO_SCENARIOS[product.demoScenario]?.trips ?? state.trips
    : state.trips;
  const locale = product.localeProfile;
  const report = useMemo(
    () =>
      buildMileageReportData({
        trips: tripsForProof,
        period,
        userName: product.preferredName,
        mileageUseType: null,
        primaryGoal: product.primaryGoal,
        localeProfile: locale,
      }),
    [locale, period, product.preferredName, product.primaryGoal, tripsForProof],
  );

  const confirmedWorkTrips = useMemo(
    () => tripsForProof.filter((trip) => trip.status === 'confirmed' && trip.classification === 'business'),
    [tripsForProof],
  );

  const needsAttention = useMemo(() => {
    let count = 0;
    for (const trip of confirmedWorkTrips) {
      const status = proofReadinessForTrip(trip);
      if (status !== 'ready' && status !== 'recovered' && status !== 'imported' && status !== 'user_corrected') {
        count += 1;
      }
    }
    return count;
  }, [confirmedWorkTrips]);

  const currentRate = rateForTimestamp(locale.rates, Date.now());
  const valueRequested = product.primaryGoal != null;
  const rateOk = Boolean(currentRate?.centsPerMile && currentRate.centsPerMile > 0 && !locale.activeRateNeedsReview);

  const checks = useMemo(
    () =>
      buildProofChecks({
        confirmedWorkTrips,
        vehiclesExist: product.vehicles.length > 0,
        valueRequested,
        rateOk,
        unresolvedCount: report.unresolvedCount,
      }),
    [confirmedWorkTrips, product.vehicles.length, rateOk, report.unresolvedCount, valueRequested],
  );

  const checksComplete = checks.filter((check) => check.pass).length;
  const exportReady = checksComplete >= 4 && report.tripCount > 0;

  const fixTarget = useMemo(() => {
    const failing = checks.find((check) => !check.pass);
    if (!failing) return null;

    switch (failing.id) {
      case 'purpose': {
        const trip = confirmedWorkTrips.find((item) => !item.purpose?.trim());
        if (!trip) return null;
        return {
          label: 'Fix 1 issue',
          detail: 'Add purpose to a work drive',
          onPress: () => navigation.navigate('TripDetails', { tripId: trip.id }),
        };
      }
      case 'route': {
        const trip = confirmedWorkTrips.find((item) => !item.startLabel?.trim() && !item.endLabel?.trim());
        if (!trip) return null;
        return {
          label: 'Fix 1 issue',
          detail: 'Add route labels to a work drive',
          onPress: () => navigation.navigate('TripDetails', { tripId: trip.id }),
        };
      }
      case 'vehicle': {
        const trip = confirmedWorkTrips.find((item) => !item.vehicleId);
        if (trip) {
          return {
            label: 'Fix 1 issue',
            detail: 'Assign a vehicle to a work drive',
            onPress: () => navigation.navigate('TripDetails', { tripId: trip.id }),
          };
        }
        return {
          label: 'Fix 1 issue',
          detail: 'Set up a vehicle',
          onPress: () => navigation.navigate('VehicleSetup'),
        };
      }
      case 'rate':
        return {
          label: 'Fix 1 issue',
          detail: 'Review your mileage rate',
          onPress: () => navigation.navigate('EditSetup'),
        };
      case 'unresolved':
        return {
          label: 'Fix 1 issue',
          detail: 'Resolve uncertain drives in Review',
          onPress: () => navigation.navigate('Review'),
        };
      default:
        return null;
    }
  }, [checks, confirmedWorkTrips, navigation]);

  const choosePeriod = (kind: ReportPeriodKind) => {
    setPeriodKind(kind);
    setMessage(null);
    setError(null);
    setShowReadiness(false);
    const next = resolveReportPeriod(kind);
    setReportingPeriod({
      id: kind,
      label: next.label,
      startAt: next.startAt,
      endAt: next.endAt,
    });
  };

  const openPreview = () => {
    logEvent(ANALYTICS_EVENTS.reportPreviewed, { format: 'pdf' });
    markFirstReportPreview();
    navigation.navigate('ReportPreview', { format: 'pdf' });
  };

  const shareCsv = async () => {
    setMessage(null);
    setError(null);
    if (isShareInFlight() || csvBusy) {
      setMessage(SHARE_COPY.busy);
      return;
    }
    if (report.tripCount === 0) {
      setError('No confirmed work drives in this period to export.');
      return;
    }
    setCsvBusy(true);
    try {
      const csv = buildMileageCsv(tripsForProof, {
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
        markFirstReportPreview();
        logEvent(ANALYTICS_EVENTS.reportExportedCsv, {});
        setMessage(SHARE_COPY.csvReady);
      } else if (result.reason === 'cancelled') {
        setMessage(null);
      } else {
        setMessage(result.reason === 'busy' ? SHARE_COPY.busy : null);
        if (result.reason !== 'busy') setError(result.message);
        else setMessage(result.message);
      }
    } catch {
      setError(SHARE_COPY.failed);
    } finally {
      setCsvBusy(false);
    }
  };

  const sharePdf = async () => {
    setMessage(null);
    setError(null);
    if (isShareInFlight() || pdfBusy) {
      setMessage(SHARE_COPY.busy);
      return;
    }
    if (!capabilities.canUseStandardPdf) {
      navigation.navigate('PlanSelection', { source: 'upgrade' });
      return;
    }
    setPdfBusy(true);
    try {
      const result = await generateAndSharePdf(report);
      if (result.ok) {
        markFirstExport();
        markFirstReportPreview();
        logEvent(ANALYTICS_EVENTS.reportExportedPdf, {});
        setMessage(SHARE_COPY.pdfReady);
      } else if (result.reason === 'cancelled') {
        setMessage(null);
      } else if (result.reason === 'busy') {
        setMessage(SHARE_COPY.busy);
      } else {
        setError(result.message);
      }
    } finally {
      setPdfBusy(false);
    }
  };

  const exportBusy = csvBusy || shareBusy;
  const adaptiveTitle = reportTitleForGoal(product.primaryGoal);

  return (
    <TabScreen>
      <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
        {adaptiveTitle}
      </Text>

      <SegmentedControl options={PERIOD_OPTIONS} value={periodKind} onChange={choosePeriod} />

      {report.tripCount === 0 ? (
        <EmptyState
          title="No trips yet"
          body="Only drives you confirm as work appear in reports."
          actionLabel="Add a drive"
          onAction={() => navigation.navigate('ManualTrip')}
        />
      ) : (
        <>
          <SoftPanel>
            <Text style={text.subtitle}>{period.label}</Text>
            <ListRow
              label="Work distance"
              value={formatDistance(report.totalMiles, locale.distanceUnit, locale.localeTag)}
              showChevron={false}
            />
            <ListRow
              label="Estimated value"
              value={
                report.estimatedValueCents != null
                  ? formatCurrencyCents(report.estimatedValueCents, locale.currencyCode, locale.localeTag)
                  : 'Set a rate in Profile'
              }
              showChevron={false}
            />
            <ListRow label="Work drives" value={String(report.tripCount)} showChevron={false} />
            <ListRow
              label="Needs attention"
              value={needsAttention > 0 ? String(needsAttention) : 'None'}
              showChevron={false}
            />
            <PrimaryButton
              label={showReadiness ? 'Hide readiness' : 'Create report'}
              onPress={() => setShowReadiness((open) => !open)}
              accessibilityLabel={showReadiness ? 'Hide readiness checklist' : 'Create report and show readiness'}
            />
          </SoftPanel>

          {showReadiness ? (
            <ListSection title="Readiness">
              <Text style={[text.body, { marginBottom: spacing.sm }]}>
                {checksComplete} of 5 checks complete
              </Text>
              {checks.map((check) => (
                <ListRow
                  key={check.id}
                  label={check.label}
                  value={check.pass ? 'Complete' : 'Needs fix'}
                  showChevron={false}
                />
              ))}
              {fixTarget ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={[text.caption, { marginBottom: spacing.xs }]}>{fixTarget.detail}</Text>
                  <PrimaryButton label={fixTarget.label} onPress={fixTarget.onPress} />
                </View>
              ) : (
                <Text style={[text.body, { marginTop: spacing.sm }]}>Ready to preview and export.</Text>
              )}
            </ListSection>
          ) : null}

          {exportReady || (showReadiness && checksComplete === 5) ? (
            <ListSection title="Export">
              {message ? <Text style={[text.body, { marginBottom: spacing.sm }]}>{message}</Text> : null}
              {error ? <FormError message={error} /> : null}
              <ListRow label="Preview report" onPress={openPreview} />
              <ListRow
                label={capabilities.canUseStandardPdf ? 'Share PDF' : 'Share PDF · Plus'}
                onPress={() => void sharePdf()}
                busy={pdfBusy || (shareBusy && !csvBusy)}
                disabled={exportBusy && !pdfBusy}
              />
              <ListRow
                label="Share CSV"
                value={csvBusy || (shareBusy && csvBusy) ? SHARE_COPY.preparingCsv : undefined}
                onPress={() => void shareCsv()}
                busy={csvBusy || (shareBusy && !pdfBusy)}
                disabled={pdfBusy}
              />
              <ListRow label="Share" onPress={() => navigation.navigate('ExportReport')} />
            </ListSection>
          ) : null}

          <View style={{ marginTop: spacing.md }}>
            <SecondaryButton label="Add another drive" onPress={() => navigation.navigate('ManualTrip')} />
          </View>
        </>
      )}
    </TabScreen>
  );
}
