import React, { useMemo, useState } from 'react';
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
import { writeTextFile, shareFile } from '../../services/fileShare';
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
  const { product } = useProduct();
  const [periodKind, setPeriodKind] = useState<ReportPeriodKind>(
    PERIOD_OPTIONS.some((option) => option.value === state.reportingPeriod.id)
      ? (state.reportingPeriod.id as ReportPeriodKind)
      : 'ytd',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const period = periodFromState(state.reportingPeriod);
  const tripsForProof = product.demoModeEnabled
    ? DEMO_SCENARIOS[product.demoScenario]?.trips ?? state.trips
    : state.trips;
  const report = useMemo(
    () =>
      buildMileageReportData({
        trips: tripsForProof,
        period,
        userName: product.preferredName,
        mileageUseType: voiceForDrivingType(product.drivingType).reportNoun,
      }),
    [period, product.drivingType, product.preferredName, tripsForProof],
  );

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

  const shareCsv = async () => {
    setMessage(null);
    setError(null);
    if (report.tripCount === 0) {
      setError('No confirmed work drives in this period to export.');
      return;
    }
    try {
      const csv = buildMileageCsv(tripsForProof, {
        periodStart: period.startAt,
        periodEnd: period.endAt,
        vehicleNicknameById: vehicleLookup(product.vehicles),
      });
      const uri = await writeTextFile(csvFilename(period.label), csv);
      const result = await shareFile(uri, 'text/csv', 'Share MileRecover CSV');
      if (!result.ok && result.reason !== 'cancelled') throw new Error(result.message);
      setMessage(result.ok ? 'CSV ready to share.' : result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not share CSV.');
    }
  };

  const sharePdf = async () => {
    setMessage(null);
    setError(null);
    if (!capabilities.canUseStandardPdf) {
      setError('PDF reports come with Plus. CSV stays free.');
      navigation.navigate('PlanSelection', { source: 'upgrade' });
      return;
    }
    const result = await generateAndSharePdf(report);
    if (result.ok || result.reason === 'cancelled') {
      setMessage(result.ok ? 'PDF ready to share.' : result.message);
    } else {
      setError(result.message);
    }
  };

  return (
    <TabScreen>
      <SegmentedControl options={PERIOD_OPTIONS} value={periodKind} onChange={choosePeriod} />

      {report.tripCount === 0 ? (
        <>
          <EmptyState
            title="No work drives in this period yet"
            body="Only drives you’ve marked as work show up here. Pending and personal stays out."
            actionLabel="Add a drive"
            onAction={() => navigation.navigate('ManualTrip')}
          />
          <StatusCard
            variant="neutral"
            title="This period"
            body={`${period.label}. ${report.unresolvedCount === 0 ? 'All reviewed.' : `${report.unresolvedCount} still need a look.`} They stay out of the report until you decide.`}
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
            title="Your mileage report is ready"
            onPreview={() => navigation.navigate('ReportPreview', { format: 'reimbursement' })}
          />
          {message ? <StatusCard variant="success" title="Export" body={message} emphasis="subtle" /> : null}
          {error ? <FormError message={error} /> : null}
          <ListSection title="Totals">
            <ListRow label="Confirmed work drives" value={String(report.tripCount)} showChevron={false} />
            <ListRow label="Total miles" value={`${report.totalMiles.toFixed(1)} mi`} showChevron={false} />
            <ListRow label="Manual miles" value={`${report.manualMiles.toFixed(1)} mi`} showChevron={false} />
            <ListRow label="Imported miles" value={`${report.importedMiles.toFixed(1)} mi`} showChevron={false} />
            <ListRow label="Recovered miles" value={`${report.recoveredMiles.toFixed(1)} mi`} showChevron={false} />
          </ListSection>
          <ListSection title="Export">
            <ListRow label="Preview report" onPress={() => navigation.navigate('ReportPreview', { format: 'pdf' })} />
            <ListRow
              label={capabilities.canUseStandardPdf ? 'Share PDF' : 'PDF requires Plus'}
              onPress={() => void sharePdf()}
            />
            <ListRow label="Share CSV" onPress={() => void shareCsv()} />
          </ListSection>
          <View style={{ marginTop: spacing.md }}>
            <SecondaryButton label="Add another drive" onPress={() => navigation.navigate('ManualTrip')} />
          </View>
        </>
      )}
    </TabScreen>
  );
}
