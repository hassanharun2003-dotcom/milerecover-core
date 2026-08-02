import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  ImportOptionCard,
  ScrollScreen,
  SectionHeader,
  StatusCard,
  SummaryCard,
} from '../../design-system';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function BringExistingMileageScreen() {
  const navigation = useNavigation<Nav>();
  const { product, setImportPhase } = useProduct();

  const startImport = (label: string) => {
    setImportPhase('processing', label);
    navigation.navigate('ImportPreview');
  };

  return (
    <ScrollScreen>
      <SectionHeader title="Bring your mileage with you" />
      <StatusCard
        variant="info"
        title="Nothing gets lost"
        body="Upload a mileage export, spreadsheet, or report. MileRecover organizes what it can and shows you anything that needs review."
      />
      <ImportOptionCard title="Mileage export" subtitle="Import from a standard mileage export file" onPress={() => startImport('Mileage export')} />
      <ImportOptionCard title="Spreadsheet or CSV" subtitle="Upload columns from your existing log" onPress={() => startImport('Spreadsheet.csv')} />
      <ImportOptionCard title="PDF report" subtitle="Extract trips from a mileage report" onPress={() => startImport('Report.pdf')} />
      <ImportOptionCard title="Calendar or work schedule" subtitle="Use work blocks to suggest missing drives" onPress={() => startImport('Calendar feed')} />
      <ImportOptionCard title="Add manually" subtitle="Enter trips one at a time" onPress={() => navigation.navigate('ManualTrip')} />
      <ImportOptionCard title="Start fresh" subtitle="Begin protecting new drives only" onPress={() => navigation.goBack()} />
      {product.importFileLabel ? (
        <View style={styles.selected}>
          <SummaryCard items={[{ label: 'Last selected', value: product.importFileLabel }]} />
        </View>
      ) : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  selected: { marginTop: spacing.lg },
});
