import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { analyzeCsvImport } from '@milerecover/domain';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, typography } from '@milerecover/config';
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

const SUPPORTED_APPS = ['MileIQ', 'Everlance', 'Driversnote', 'TripLog', 'Stride', 'Generic CSV'] as const;

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
        title="Switch to MileRecover"
        body="Export a CSV from your current mileage app, then choose the file here. We detect the format, preview rows, and never invent miles."
        emphasis="hero"
      />
      <Text
        style={[
          text.caption,
          {
            color: palette.text.secondary,
            marginBottom: spacing.sm,
            fontWeight: '600',
            fontSize: typography.size.caption,
          },
        ]}
      >
        Supported exports
      </Text>
      <View style={styles.appTags}>
        {SUPPORTED_APPS.map((name) => (
          <View
            key={name}
            style={[styles.tag, { backgroundColor: palette.background.mist, borderColor: palette.border.default }]}
          >
            <Text style={{ color: palette.text.primary, fontSize: typography.size.caption, fontWeight: '600' }}>
              {name}
            </Text>
          </View>
        ))}
      </View>
      <ImportOptionCard
        title="Choose export file"
        subtitle="CSV from MileIQ, Everlance, Driversnote, TripLog, Stride, or a generic spreadsheet"
        onPress={() => void pickCsv()}
      />
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
  appTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
});
