import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { analyzeCsvImport } from '@milerecover/domain';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  FormError,
  ImportOptionCard,
  ScrollScreen,
  StatusCard,
  SummaryCard,
  TertiaryButton,
} from '../../design-system';
import type { RootStackParamList } from '../../navigation/types';
import { useProduct } from '../../product/ProductContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function BringExistingMileageScreen() {
  const navigation = useNavigation<Nav>();
  const { product, setImportPhase } = useProduct();
  const [error, setError] = useState<string | null>(null);

  const pickCsv = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) {
        setError('No file was selected.');
        return;
      }
      const text = await new File(asset.uri).text();
      const analysis = analyzeCsvImport(text);
      if (analysis.headers.length === 0 && analysis.issues.length > 0) {
        setImportPhase('failed', asset.name, text);
        setError(analysis.issues[0].message);
        return;
      }
      setImportPhase('preview', asset.name, text);
      navigation.navigate('ImportPreview');
    } catch (err) {
      setImportPhase('failed');
      setError(err instanceof Error ? err.message : 'Could not read this CSV file.');
    }
  };

  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Bring your history with you"
        body="Pick a CSV file. We will analyze the columns, show issues, and import only rows we can read without hiding duplicates."
        emphasis="hero"
      />
      <ImportOptionCard title="Pick CSV file" subtitle="Mileage exports or spreadsheets saved as CSV" onPress={() => void pickCsv()} />
      <View style={styles.tertiary}>
        <TertiaryButton label="Add drives by hand" onPress={() => navigation.navigate('ManualTrip')} />
        <TertiaryButton label="Start fresh instead" onPress={() => navigation.goBack()} />
      </View>
      {error ? <FormError message={error} /> : null}
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
