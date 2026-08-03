import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { analyzeCsvImport, importRowsToTrips } from '@milerecover/domain';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  EvidenceRow,
  FormError,
  ListSection,
  ListRow,
  LoadingState,
  PrimaryButton,
  ScrollScreen,
  SecondaryButton,
  StatusCard,
  SummaryCard,
} from '../../design-system';
import type { RootStackParamList } from '../../navigation/types';
import { useProduct } from '../../product/ProductContext';
import { useApp } from '../../store/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function batchId(): string {
  return `import-${Date.now()}`;
}

export function ImportPreviewScreen() {
  const navigation = useNavigation<Nav>();
  const { state, upsertTrip } = useApp();
  const { product, setImportPhase, addImportBatch } = useProduct();
  const [error, setError] = useState<string | null>(null);
  const analysis = useMemo(
    () => analyzeCsvImport(product.importCsvText ?? ''),
    [product.importCsvText],
  );
  const importPlan = useMemo(
    () => importRowsToTrips(analysis.validRows, state.trips),
    [analysis.validRows, state.trips],
  );
  const issueCount = analysis.issues.length;
  const duplicateCount = importPlan.duplicatesSkipped;
  const importableCount = importPlan.trips.length;

  const finishImport = () => {
    if (!product.importCsvText) {
      setError('Pick a CSV file before importing.');
      return;
    }
    importPlan.trips.forEach((trip) => upsertTrip(trip));
    addImportBatch({
      id: batchId(),
      fileLabel: product.importFileLabel ?? 'CSV import',
      importedCount: importPlan.trips.length,
      skippedCount: analysis.skipped,
      duplicateCount,
      createdAt: Date.now(),
    });
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  if (product.importPhase === 'processing') {
    return (
      <ScrollScreen>
        <LoadingState message="Organizing your mileage..." />
        <SecondaryButton
          label="Cancel"
          onPress={() => {
            setImportPhase('idle');
            navigation.goBack();
          }}
        />
      </ScrollScreen>
    );
  }

  if (!product.importCsvText || product.importPhase === 'failed') {
    return (
      <ScrollScreen>
        <StatusCard
          variant="danger"
          title="No readable CSV selected"
          body="Go back and choose a CSV file. Nothing has been imported."
          emphasis="hero"
        />
        <SecondaryButton label="Pick a CSV" onPress={() => navigation.navigate('BringExistingMileage')} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen
      footer={
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <PrimaryButton
            label={importableCount > 0 ? `Import ${importableCount} trip${importableCount === 1 ? '' : 's'}` : 'No trips to import'}
            onPress={finishImport}
            disabled={importableCount === 0}
          />
          <SecondaryButton
            label="Review issues"
            onPress={() => navigation.navigate('ImportExceptionReview')}
            disabled={issueCount === 0 && duplicateCount === 0}
          />
        </View>
      }
    >
      <StatusCard
        variant={importableCount > 0 ? 'success' : 'warning'}
        title="CSV preview"
        body="These counts come from your selected file. Rows with issues or duplicates are not silently imported."
        emphasis="hero"
      />
      <SummaryCard
        items={[
          { label: 'Valid rows', value: String(analysis.validRows.length) },
          { label: 'Importable', value: String(importableCount) },
          { label: 'Issues', value: String(issueCount + duplicateCount) },
        ]}
      />
      {error ? <FormError message={error} /> : null}
      <ListSection title="Column mapping">
        <EvidenceRow label="Selected file" value={product.importFileLabel ?? 'CSV import'} />
        <EvidenceRow label="Headers found" value={analysis.headers.length > 0 ? analysis.headers.join(', ') : 'None'} />
        <EvidenceRow label="Date column" value={analysis.headers.some((h) => /date|day/i.test(h)) ? 'Detected' : 'Missing'} />
        <EvidenceRow label="Distance column" value={analysis.headers.some((h) => /mile|distance/i.test(h)) ? 'Detected' : 'Missing'} />
        <EvidenceRow label="Purpose column" value={analysis.headers.some((h) => /purpose|reason/i.test(h)) ? 'Detected if present' : 'Optional'} />
      </ListSection>
      <ListSection title="Import details">
        <EvidenceRow label="Rows skipped by parser" value={String(analysis.skipped)} />
        <EvidenceRow label="Duplicates skipped" value={String(duplicateCount)} />
        <EvidenceRow label="Rows needing review" value={String(issueCount)} />
      </ListSection>
      <ListSection title="Preview rows">
        {analysis.validRows.slice(0, 8).map((row) => (
          <EvidenceRow
            key={row.rowNumber}
            label={`Row ${row.rowNumber}: ${row.purpose}`}
            value={`${row.date}, ${row.distanceMiles.toFixed(1)} mi`}
          />
        ))}
        {analysis.validRows.length === 0 ? <ListRow label="No valid rows found" value="Check issues" /> : null}
      </ListSection>
    </ScrollScreen>
  );
}

export function ImportExceptionReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { state } = useApp();
  const { product } = useProduct();
  const analysis = useMemo(
    () => analyzeCsvImport(product.importCsvText ?? ''),
    [product.importCsvText],
  );
  const importPlan = useMemo(
    () => importRowsToTrips(analysis.validRows, state.trips),
    [analysis.validRows, state.trips],
  );

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Rows to check"
        body="Invalid rows and duplicates are left out. Fix the CSV and import again when you want those rows included."
        emphasis="subtle"
      />
      <SummaryCard
        items={[
          { label: 'Row issues', value: String(analysis.issues.length) },
          { label: 'Duplicates', value: String(importPlan.duplicatesSkipped) },
        ]}
      />
      <ListSection title="Issues">
        {analysis.issues.length === 0 ? (
          <ListRow label="No parser issues found" value="Good" showChevron={false} />
        ) : (
          analysis.issues.map((issue) => (
            <ListRow
              key={`${issue.rowNumber}-${issue.message}`}
              label={issue.rowNumber > 0 ? `Row ${issue.rowNumber}` : 'File'}
              value={issue.message}
              showChevron={false}
            />
          ))
        )}
        {importPlan.duplicatesSkipped > 0 ? (
          <ListRow label="Duplicate rows" value={`${importPlan.duplicatesSkipped} skipped`} showChevron={false} />
        ) : null}
      </ListSection>
      <PrimaryButton label="Back to preview" onPress={() => navigation.goBack()} />
    </ScrollScreen>
  );
}
