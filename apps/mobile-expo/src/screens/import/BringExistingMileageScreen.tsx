import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  text,
  useAppTheme,
} from '../../design-system';
import type { RootStackParamList } from '../../navigation/types';
import { useProduct } from '../../product/ProductContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Competitor names must NOT appear in normal UI before source detection.
 * Detection may reveal a format label on ImportPreview after the file is chosen.
 */
export function BringExistingMileageScreen() {
  const navigation = useNavigation<Nav>();
  const { palette } = useAppTheme();
  const { product, setImportPhase } = useProduct();
  const [error, setError] = useState<string | null>(null);

  const pickCsv = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) {
        setError('No file was selected.');
        return;
      }
      const textContent = await new File(asset.uri).text();
      const analysis = analyzeCsvImport(textContent, asset.name);
      if (analysis.headers.length === 0 && analysis.issues.length > 0) {
        setImportPhase('failed', asset.name, textContent);
        setError(analysis.issues[0].message);
        return;
      }
      setImportPhase('preview', asset.name, textContent);
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
        title="Bring your mileage with you"
        body="Choose an export or CSV from your current mileage app. We’ll identify the source after you pick a file — never invent miles."
        emphasis="hero"
      />
      <ImportOptionCard
        title="Choose an export or CSV"
        subtitle="Pick a file from your phone, email, or downloads."
        onPress={() => void pickCsv()}
      />
      <ImportOptionCard
        title="Add drives manually"
        subtitle="Start fresh and log trips yourself."
        onPress={() => navigation.navigate('ManualTrip')}
      />
      <Text style={[text.caption, { color: palette.text.secondary, marginTop: spacing.sm }]}>
        Source detection happens only after file selection. Known formats are named only when detected.
      </Text>
      <View style={styles.tertiary}>
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
