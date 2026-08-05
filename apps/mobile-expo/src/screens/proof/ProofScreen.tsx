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
  buildProofIssues,
  capabilitiesForEntitlement,
  csvFilename,
  formatCurrencyCents,
  formatDistance,
  proofFixCtaLabel,
  rateForTimestamp,
  reportTitleForGoal,
  resolveReportPeriod,
  type ReportPeriod,
  type ReportPeriodKind,
} from '@milerecover/domain';
import {
  EmptyState,
  FormError,
  ListRow,
  ListSection,
  PrimaryButton,
  SecondaryButton,
  SegmentedControl,
  SimpleBarChart,
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
  { label: 'Quarter', value: 'this_quarter' },
  { label: 'Year', value: 'this_year' },
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

  const currentRate = rateForTimestamp(locale.rates, Date.now());
  const valueRequested = product.primaryGoal != null;
  const rateOk = Boolean(currentRate?.centsPerMile && currentRate.centsPerMile > 0 && !locale.activeRateNeedsReview);

  const issues = useMemo(
    () =>
      buildProofIssues({
        confirmedWorkTrips,
        vehiclesExist: product.vehicles.length > 0,
        valueRequested,
        rateOk,
        unresolvedCount: report.unresolvedCount,
      }),
    [confirmedWorkTrips, product.vehicles.length, rateOk, report.unresolvedCount, valueRequested],
  );

  const requiredCount = issues.required.length;
  const recommendedCount = issues.recommended.length;
  const exportReady = requiredCount === 0 && report.tripCount > 0;

  const fixTarget = useMemo(() => {
    const next = issues.required[0] ?? issues.recommended[0];
    if (!next) return null;
    const label = proofFixCtaLabel(requiredCount, recommendedCount);
    const goTrip = (tripId?: string, fallback: 'Review' | 'EditSetup' | 'VehicleSetup' = 'Review') => {
      if (tripId) navigation.navigate('TripDetails', { tripId });
      else if (fallback === 'EditSetup') navigation.navigate('EditSetup');
      else if (fallback === 'VehicleSetup') navigation.navigate('VehicleSetup');
      else navigation.navigate('Review');
    };
    switch (next.id) {
      case 'purpose':
        return { label, detail: next.detail, onPress: () => goTrip(next.tripId) };
      case 'distance':
        return { label, detail: next.detail, onPress: () => goTrip(next.tripId) };
      case 'route':
        return { label, detail: next.detail, onPress: () => goTrip(next.tripId) };
      case 'vehicle':
        return {
          label,
          detail: next.detail,
          onPress: () => goTrip(next.tripId, next.tripId ? 'Review' : 'VehicleSetup'),
        };
      case 'rate':
        return { label, detail: next.detail, onPress: () => goTrip(undefined, 'EditSetup') };
      case 'unresolved':
        return { label, detail: next.detail, onPress: () => goTrip(undefined, 'Review') };
      default:
        return { label, detail: next.detail, onPress: () => navigation.navigate('Review') };
    }
  }, [issues.recommended, issues.required, navigation, recommendedCount, requiredCount]);

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
            <SimpleBarChart
              accessibilityLabel="Work distance and drive count for this period"
              bars={[
                { label: 'Distance', value: Math.max(report.totalMiles, 0) },
                { label: 'Drives', value: Math.max(report.tripCount, 0) },
                {
                  label: 'Value',
                  value: Math.max((report.estimatedValueCents ?? 0) / 100, 0),
                },
              ]}
            />
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
              label="Required corrections"
              value={requiredCount > 0 ? String(requiredCount) : 'None'}
              showChevron={false}
            />
            <ListRow
              label="Optional improvements"
              value={recommendedCount > 0 ? String(recommendedCount) : 'None'}
              showChevron={false}
            />
            {fixTarget ? (
              <PrimaryButton label={fixTarget.label} onPress={fixTarget.onPress} />
            ) : (
              <PrimaryButton label="Preview report" onPress={openPreview} />
            )}
            <SecondaryButton
              label={showReadiness ? 'Hide readiness' : 'Show readiness'}
              onPress={() => setShowReadiness((open) => !open)}
            />
          </SoftPanel>

          {showReadiness ? (
            <ListSection title="Readiness">
              {issues.required.length > 0 ? (
                <>
                  <Text style={[text.subtitle, { marginBottom: spacing.xs }]}>Required</Text>
                  {issues.required.map((issue) => (
                    <ListRow key={issue.id} label={issue.label} value="Needs fix" showChevron={false} />
                  ))}
                </>
              ) : null}
              {issues.recommended.length > 0 ? (
                <>
                  <Text style={[text.subtitle, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>
                    Recommended
                  </Text>
                  {issues.recommended.map((issue) => (
                    <ListRow key={issue.id} label={issue.label} value="Optional" showChevron={false} />
                  ))}
                </>
              ) : null}
              {issues.completedIds.length > 0 ? (
                <>
                  <Text style={[text.subtitle, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>
                    Complete
                  </Text>
                  {issues.completedIds.map((id) => (
                    <ListRow key={id} label={id} value="Complete" showChevron={false} />
                  ))}
                </>
              ) : null}
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

          <ListSection title="Reports">
            {message ? <Text style={[text.body, { marginBottom: spacing.sm }]}>{message}</Text> : null}
            {error ? <FormError message={error} /> : null}
            {!exportReady ? (
              <Text style={[text.caption, { marginBottom: spacing.sm }]}>
                Finish required corrections before employer-ready export.
              </Text>
            ) : null}
            <ListRow label="Preview" onPress={openPreview} disabled={!exportReady && report.tripCount === 0} />
            <ListRow
              label={capabilities.canUseStandardPdf ? 'PDF' : 'PDF · Plus'}
              onPress={() => void sharePdf()}
              busy={pdfBusy || (shareBusy && !csvBusy)}
              disabled={!exportReady || (exportBusy && !pdfBusy)}
            />
            <ListRow
              label="CSV"
              value={csvBusy || (shareBusy && csvBusy) ? SHARE_COPY.preparingCsv : undefined}
              onPress={() => void shareCsv()}
              busy={csvBusy || (shareBusy && !pdfBusy)}
              disabled={!exportReady || pdfBusy}
            />
            <ListRow
              label="Share"
              onPress={() => navigation.navigate('ExportReport')}
              disabled={!exportReady}
            />
          </ListSection>

          <View style={{ marginTop: spacing.md }}>
            <SecondaryButton label="Add another drive" onPress={() => navigation.navigate('ManualTrip')} />
          </View>
        </>
      )}
    </TabScreen>
  );
}
