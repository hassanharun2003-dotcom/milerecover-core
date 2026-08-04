import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
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
  proofReadinessLabel,
  resolveReportPeriod,
  type ReportPeriod,
  type ReportPeriodKind,
} from '@milerecover/domain';
import {
  EmptyState,
  FormError,
  ListRow,
  ListSection,
  ProofHeroCard,
  SecondaryButton,
  SegmentedControl,
  StatusCard,
  TabScreen,
} from '../../design-system';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { DEMO_SCENARIOS } from '../../fixtures/scenarios';
import { voiceForDrivingType } from '../../product/copy';
import { useProduct } from '../../product/ProductContext';
import {
  isShareInFlight,
  SHARE_COPY,
  subscribeShareInFlight,
  writeAndShareTextFile,
} from '../../services/fileShare';
import { generateAndSharePdf } from '../../services/pdfReport';
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

export function ProofScreen() {
  const navigation = useNavigation<Nav>();
  const { state, setReportingPeriod } = useApp();
  const { product, markFirstExport, markFirstReportPreview } = useProduct();
  const [periodKind, setPeriodKind] = useState<ReportPeriodKind>(
    PERIOD_OPTIONS.some((option) => option.value === state.reportingPeriod.id)
      ? (state.reportingPeriod.id as ReportPeriodKind)
      : 'ytd',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upsell, setUpsell] = useState<string | null>(null);
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
        mileageUseType: voiceForDrivingType(product.drivingType).reportNoun,
        primaryGoal: product.primaryGoal,
        localeProfile: locale,
      }),
    [locale, period, product.drivingType, product.preferredName, product.primaryGoal, tripsForProof],
  );
  const readinessCounts = useMemo(() => {
    const confirmed = tripsForProof.filter(
      (trip) => trip.status === 'confirmed' && trip.classification === 'business',
    );
    let ready = 0;
    let needsAttention = 0;
    for (const trip of confirmed) {
      const status = proofReadinessForTrip(trip);
      if (status === 'ready' || status === 'recovered' || status === 'imported' || status === 'user_corrected') {
        ready += 1;
      } else {
        needsAttention += 1;
      }
    }
    return { ready, needsAttention, total: confirmed.length };
  }, [tripsForProof]);

  const choosePeriod = (kind: ReportPeriodKind) => {
    setPeriodKind(kind);
    setMessage(null);
    setError(null);
    setUpsell(null);
    const next = resolveReportPeriod(kind);
    setReportingPeriod({
      id: kind,
      label: next.label,
      startAt: next.startAt,
      endAt: next.endAt,
    });
  };

  const shareCsv = async () => {
    setMessage(null);
    setError(null);
    setUpsell(null);
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
    setUpsell(null);
    if (isShareInFlight() || pdfBusy) {
      setMessage(SHARE_COPY.busy);
      return;
    }
    if (!capabilities.canUseStandardPdf) {
      setUpsell('PDF reports come with Plus. CSV and preview stay free on your plan.');
      navigation.navigate('PlanSelection', { source: 'upgrade' });
      return;
    }
    setPdfBusy(true);
    try {
      const result = await generateAndSharePdf(report);
      if (result.ok) {
        markFirstExport();
        markFirstReportPreview();
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

  return (
    <TabScreen>
      <SegmentedControl options={PERIOD_OPTIONS} value={periodKind} onChange={choosePeriod} />

      {report.tripCount === 0 ? (
        <>
          <EmptyState
            title="No confirmed work drives in this period"
            body="Only drives you confirm as work appear in reports."
            actionLabel="Add a drive"
            onAction={() => navigation.navigate('ManualTrip')}
          />
          <StatusCard
            variant="neutral"
            title="This period"
            body={`${period.label}. Pending and personal drives stay out until you decide.`}
            emphasis="subtle"
          />
        </>
      ) : (
        <>
          <ProofHeroCard
            periodLabel={period.label}
            tripCount={report.tripCount}
            totalMiles={report.totalMiles.toFixed(1)}
            unresolved={String(report.unresolvedCount)}
            title={report.title}
            onPreview={() => navigation.navigate('ReportPreview', { format: 'pdf' })}
          />
          {message ? <StatusCard variant="success" title="Export" body={message} emphasis="subtle" /> : null}
          {upsell ? <StatusCard variant="info" title="Plus feature" body={upsell} emphasis="subtle" /> : null}
          {error ? <FormError message={error} /> : null}
          <ListSection title="Monthly proof summary">
            <ListRow label="Accepted work distance" value={formatDistance(report.totalMiles, locale.distanceUnit, locale.localeTag)} showChevron={false} />
            <ListRow
              label="Estimated value"
              value={
                report.estimatedValueCents != null
                  ? formatCurrencyCents(report.estimatedValueCents, locale.currencyCode, locale.localeTag)
                  : 'Set a rate in Profile'
              }
              showChevron={false}
            />
            <ListRow label="Trips ready" value={String(readinessCounts.ready)} showChevron={false} />
            <ListRow label="Needs attention" value={String(readinessCounts.needsAttention)} showChevron={false} />
            <ListRow
              label="Recovered"
              value={formatDistance(report.recoveredMiles, locale.distanceUnit, locale.localeTag)}
              showChevron={false}
            />
            <ListRow
              label="Imported"
              value={formatDistance(report.importedMiles, locale.distanceUnit, locale.localeTag)}
              showChevron={false}
            />
          </ListSection>
          <ListSection title="Readiness">
            {tripsForProof
              .filter((trip) => trip.status === 'confirmed' && trip.classification === 'business')
              .slice(0, 8)
              .map((trip) => (
                <ListRow
                  key={trip.id}
                  label={trip.purpose?.trim() || 'Work drive'}
                  value={proofReadinessLabel(proofReadinessForTrip(trip))}
                  showChevron={false}
                />
              ))}
          </ListSection>
          <ListSection title="Prepare report">
            <StatusCard
              variant="neutral"
              title="What’s free"
              body="Preview report and CSV are free. PDF reports are available with Plus."
              emphasis="subtle"
            />
            <ListRow
              label="Prepare report · Preview"
              onPress={() => navigation.navigate('ReportPreview', { format: 'pdf' })}
            />
            <ListRow
              label={readinessCounts.needsAttention > 0 ? 'Review issues' : 'Review trips'}
              onPress={() => navigation.navigate('Review')}
            />
            <ListRow
              label={capabilities.canUseStandardPdf ? 'Share PDF' : 'Create PDF report · Plus'}
              onPress={() => void sharePdf()}
              busy={pdfBusy || (shareBusy && !csvBusy)}
              disabled={exportBusy && !pdfBusy}
            />
            <ListRow
              label="Share records · CSV"
              value={csvBusy || (shareBusy && csvBusy) ? SHARE_COPY.preparingCsv : undefined}
              onPress={() => void shareCsv()}
              busy={csvBusy || (shareBusy && !pdfBusy)}
              disabled={pdfBusy}
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
