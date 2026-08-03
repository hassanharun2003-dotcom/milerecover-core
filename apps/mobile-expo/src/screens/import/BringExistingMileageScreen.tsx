import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  ImportOptionCard,
  ScrollScreen,
  StatusCard,
  SummaryCard,
  TertiaryButton,
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
      <StatusCard
        variant="info"
        title="Bring your history with you"
        body="Upload what you already have. We’ll organize what we can and show you anything that needs a look—nothing disappears quietly."
        emphasis="hero"
      />
      <ImportOptionCard
        title="Mileage export"
        subtitle="From another mileage app"
        onPress={() => startImport('Mileage export')}
      />
      <ImportOptionCard
        title="Spreadsheet or CSV"
        subtitle="Your existing log"
        onPress={() => startImport('Spreadsheet.csv')}
      />
      <ImportOptionCard
        title="PDF report"
        subtitle="A report you already have"
        onPress={() => startImport('Report.pdf')}
      />
      <View style={styles.tertiary}>
        <TertiaryButton
          label="Use calendar suggestions"
          onPress={() => startImport('Calendar feed')}
        />
        <TertiaryButton label="Add drives by hand" onPress={() => navigation.navigate('ManualTrip')} />
        <TertiaryButton label="Start fresh instead" onPress={() => navigation.goBack()} />
      </View>
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
  tertiary: { marginTop: spacing.md, gap: spacing.xs },
});
