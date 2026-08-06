import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { layout, spacing, typography } from '@milerecover/config';
import {
  buildMileageCsv,
  buildMileageReportData,
  buildProofIssues,
  capabilitiesForEntitlement,
  csvFilename,
  formatCurrencyCents,
  milesToDisplay,
  rateForTimestamp,
  resolveReportPeriod,
  type ProofIssue,
  type ReportPeriod,
  type ReportPeriodKind,
} from '@milerecover/domain';
import {
  FormError,
  MRCard,
  MRMetricTile,
  MRPrimaryButton,
  MRSecondaryButton,
  MRSegmentedControl,
  MRStatusPanel,
  SimpleBarChart,
  TabScreen,
  text,
  useAppTheme,
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

/** Collage: Month / Quarter / Year / YTD */
const PERIOD_OPTIONS: { label: string; value: ReportPeriodKind }[] = [
  { label: 'Month', value: 'this_month' },
  { label: 'Quarter', value: 'this_quarter' },
  { label: 'Year', value: 'this_year' },
  { label: 'YTD', value: 'ytd' },
];

function chartBarsForPeriod(
  trips: { startAt: number; distanceMiles: number; status: string; classification: string }[],
  period: ReportPeriod,
  localeTag: string,
): Array<{ label: string; value: number }> {
  const work = trips.filter(
    (t) =>
      t.status === 'confirmed' &&
      t.classification === 'business' &&
      t.startAt >= period.startAt &&
      t.startAt <= period.endAt,
  );
  const buckets = new Map<string, number>();
  for (const trip of work) {
    const key = new Date(trip.startAt).toLocaleDateString(localeTag, {
      weekday: period.kind === 'this_month' ? 'narrow' : undefined,
      month: period.kind === 'this_month' ? undefined : 'short',
      day: period.kind === 'this_month' ? 'numeric' : undefined,
    });
    buckets.set(key, (buckets.get(key) ?? 0) + trip.distanceMiles);
  }
  if (buckets.size === 0) {
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label) => ({ label, value: 0 }));
  }
  return Array.from(buckets.entries())
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
}

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

function issueFieldLabel(issue: ProofIssue): string {
  switch (issue.field) {
    case 'purpose':
      return 'purpose';
    case 'distance':
      return 'distance';
    case 'route':
      return 'route labels';
    case 'vehicle':
      return 'vehicle';
    case 'rate':
      return 'mileage rate';
    case 'classification':
      return 'review decision';
    default:
      return issue.label.toLowerCase();
  }
}

function tripAnchor(
  trip: { startAt: number; startLabel?: string | null; endLabel?: string | null } | undefined,
  localeTag: string,
): string | null {
  if (!trip) return null;
  const date = new Date(trip.startAt).toLocaleDateString(localeTag, { month: 'short', day: 'numeric' });
  const route =
    trip.startLabel || trip.endLabel
      ? `${trip.startLabel ?? 'Start'} → ${trip.endLabel ?? 'Destination'}`
      : 'drive';
  return `${route} on ${date}`;
}

function readinessDetail(issue: ProofIssue | undefined, trips: { id: string; startAt: number; startLabel?: string | null; endLabel?: string | null }[], localeTag: string): string {
  if (!issue) return 'All required report details are complete.';
  const anchor = tripAnchor(trips.find((trip) => trip.id === issue.tripId), localeTag);
  if (anchor) return `Needs ${issueFieldLabel(issue)} for ${anchor}.`;
  return issue.detail;
}

function correctionDetail(
  issue: ProofIssue,
  trips: { id: string; startAt: number; startLabel?: string | null; endLabel?: string | null }[],
  localeTag: string,
): string {
  const severity = issue.severity === 'required' ? 'Required' : 'Recommended';
  return `${severity} · ${readinessDetail(issue, trips, localeTag)}`;
}

function fixItemsLabel(count: number): string {
  return count === 1 ? 'Fix 1 item' : `Fix ${count} items`;
}

export function ProofScreen() {
  const navigation = useNavigation<Nav>();
  const { palette } = useAppTheme();
  const { state, setReportingPeriod } = useApp();
  const { product, markFirstExport, markFirstReportPreview } = useProduct();
  const [periodKind, setPeriodKind] = useState<ReportPeriodKind>(
    PERIOD_OPTIONS.some((option) => option.value === state.reportingPeriod.id)
      ? (state.reportingPeriod.id as ReportPeriodKind)
      : 'this_month',
  );
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
  const corrections = [...issues.required, ...issues.recommended];
  const exportReady = requiredCount === 0 && report.tripCount > 0;
  const firstIssue = issues.required[0] ?? issues.recommended[0];
  const readinessState = firstIssue ? 'Needs details' : 'Ready';
  const readinessMessage = readinessDetail(firstIssue, confirmedWorkTrips, locale.localeTag);
  const reportsDisabledReason =
    report.tripCount === 0
      ? 'No confirmed work drives in this period'
      : requiredCount > 0
        ? readinessMessage
        : null;

  const fixTarget = useMemo(() => {
    const next = issues.required[0] ?? issues.recommended[0];
    if (!next) return null;
    const label = fixItemsLabel(requiredCount + recommendedCount);
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
    const first = product.firstReportPreviewAt == null;
    markFirstReportPreview();
    if (first) {
      void import('../../services/reviewPrompt').then(({ maybeAskForReview }) =>
        maybeAskForReview('first_report_created'),
      );
    }
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

  const bars = useMemo(
    () => chartBarsForPeriod(tripsForProof, period, locale.localeTag),
    [locale.localeTag, period, tripsForProof],
  );
  const workMilesValue = milesToDisplay(report.totalMiles, locale.distanceUnit).toLocaleString(
    locale.localeTag,
    {
      maximumFractionDigits: report.totalMiles >= 100 ? 0 : 1,
      minimumFractionDigits: 0,
    },
  );

  return (
    <TabScreen>
      <Text
        style={{
          fontSize: typography.size.headline,
          lineHeight: typography.lineHeight.headline,
          fontWeight: '700',
          color: palette.text.primary,
          marginBottom: spacing.md,
        }}
        accessibilityRole="header"
      >
        Proof
      </Text>

      <MRSegmentedControl options={PERIOD_OPTIONS} value={periodKind} onChange={choosePeriod} />

      <Text style={[text.body, { color: palette.text.secondary, marginBottom: spacing.sm, marginTop: spacing.sm }]}>
        {period.label}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: layout.section }}>
        <MRMetricTile
          label={locale.distanceUnit === 'km' ? 'Work km' : 'Work miles'}
          value={report.tripCount === 0 ? '0' : workMilesValue}
        />
        <MRMetricTile label="Work drives" value={String(report.tripCount)} />
        <MRMetricTile
          label="Est. value"
          value={
            report.tripCount === 0
              ? '—'
              : report.estimatedValueCents != null
                ? formatCurrencyCents(report.estimatedValueCents, locale.currencyCode, locale.localeTag)
                : '—'
          }
        />
      </View>

      <MRCard style={{ marginBottom: layout.section, paddingVertical: spacing.md }}>
        <SimpleBarChart bars={bars} accessibilityLabel="Work miles chart for selected period" />
      </MRCard>

      {report.tripCount === 0 ? (
        <>
          <MRStatusPanel
            tone="info"
            message="Only drives you confirm as work appear in reports."
          />
          <View style={{ marginTop: spacing.md }}>
            <MRPrimaryButton
              label="Add a drive"
              onPress={() => navigation.navigate('ManualTrip')}
              accessibilityLabel="Add a drive"
            />
          </View>
        </>
      ) : (
        <>
          <MRStatusPanel
            tone={exportReady ? 'ok' : 'attention'}
            message={
              exportReady
                ? 'Employer-ready · tax-ready when your records are complete'
                : readinessMessage
            }
          />

          {fixTarget ? (
            <View style={{ marginBottom: spacing.sm }}>
              <MRPrimaryButton label={fixTarget.label} onPress={fixTarget.onPress} />
            </View>
          ) : null}
          <View style={{ marginBottom: layout.section }}>
            <MRSecondaryButton
              label="Preview report"
              onPress={openPreview}
              disabled={!exportReady}
              accessibilityLabel={
                exportReady
                  ? 'Preview report'
                  : 'Preview report unavailable until required items are fixed'
              }
            />
          </View>

          <Text
            style={{
              color: palette.text.secondary,
              fontWeight: '700',
              fontSize: typography.size.caption,
              marginBottom: spacing.sm,
            }}
          >
            Export
          </Text>
          {message ? <Text style={[text.body, { marginBottom: spacing.sm }]}>{message}</Text> : null}
          {error ? <FormError message={error} /> : null}
          <MRCard
            onPress={() => void shareCsv()}
            accessibilityLabel="CSV export"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 52,
              opacity: !exportReady || pdfBusy ? 0.5 : 1,
            }}
          >
            <Text style={{ fontWeight: '600', color: palette.text.primary, fontSize: typography.size.bodyLarge }}>
              {csvBusy ? SHARE_COPY.preparingCsv : 'CSV export'}
            </Text>
            <Text style={{ color: palette.text.secondary, fontSize: 22 }}>›</Text>
          </MRCard>
          <MRCard
            onPress={() => {
              if (capabilities.canUseStandardPdf) void sharePdf();
              else navigation.navigate('PlanSelection', { source: 'upgrade' });
            }}
            accessibilityLabel="PDF report"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 52,
              opacity: !exportReady || (csvBusy && !pdfBusy) ? 0.5 : 1,
            }}
          >
            <Text style={{ fontWeight: '600', color: palette.text.primary, fontSize: typography.size.bodyLarge }}>
              {pdfBusy ? 'Preparing PDF…' : 'PDF report'}
            </Text>
            <Text style={{ color: palette.text.secondary, fontSize: 22 }}>›</Text>
          </MRCard>
        </>
      )}
    </TabScreen>
  );
}
