import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  EvidenceRow,
  ListSection,
  ListRow,
  LoadingState,
  PrimaryButton,
  ScrollScreen,
  SectionHeader,
  SecondaryButton,
  StatusCard,
  SummaryCard,
} from '../../design-system';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ImportPreviewScreen() {
  const navigation = useNavigation<Nav>();
  const { product, setImportPhase } = useProduct();

  useEffect(() => {
    if (product.importPhase !== 'processing') return;
    const timer = setTimeout(() => setImportPhase('preview'), 800);
    return () => clearTimeout(timer);
  }, [product.importPhase, setImportPhase]);

  if (product.importPhase === 'processing') {
    return (
      <ScrollScreen>
        <SectionHeader title="Import preview" />
        <LoadingState message="Organizing your mileage…" />
        <SecondaryButton label="Cancel import" onPress={() => { setImportPhase('idle'); navigation.goBack(); }} />
      </ScrollScreen>
    );
  }

  if (product.importPhase === 'failed') {
    return (
      <ScrollScreen>
        <SectionHeader title="Import preview" />
        <StatusCard
          variant="danger"
          title="Import could not finish"
          body="Your file is still here. Nothing was discarded. Try again or review unsupported rows."
          actionLabel="Try again"
          onAction={() => setImportPhase('processing', product.importFileLabel)}
        />
        <SecondaryButton label="Go back" onPress={() => navigation.goBack()} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen
      footer={
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <PrimaryButton
            label="Finish import"
            onPress={() => {
              setImportPhase('success');
              navigation.navigate('MainTabs', { screen: 'Home' });
            }}
          />
          <SecondaryButton
            label="Review exceptions"
            onPress={() => {
              setImportPhase('review_required');
              navigation.navigate('ImportExceptionReview');
            }}
          />
        </View>
      }
    >
      <SectionHeader title="Import preview" />
      <StatusCard
        variant="success"
        title="Ready to review"
        body="Nothing was silently discarded. Unsupported rows stay available for your review."
      />
      <SummaryCard
        items={[
          { label: 'Trips found', value: '214' },
          { label: 'Distance', value: '1,842 mi' },
          { label: 'Need review', value: '12' },
        ]}
      />
      <ListSection title="Import details">
        <EvidenceRow label="Selected file" value={product.importFileLabel ?? 'Sample import'} />
        <EvidenceRow label="Date range" value="Jan 1 – Jul 31, 2026" />
        <EvidenceRow label="Vehicles detected" value="2" />
        <EvidenceRow label="Duplicates handled" value="8 merged safely" />
        <EvidenceRow label="Rows not understood" value="3 kept for review" />
      </ListSection>
      <ListSection title="What happens next">
        <ListRow label="Organized trips" value="Ready in Review" />
        <ListRow label="Unsupported rows" value="Never silently discarded" />
      </ListSection>
    </ScrollScreen>
  );
}

export function ImportExceptionReviewScreen() {
  const navigation = useNavigation<Nav>();
  return (
    <ScrollScreen>
      <SectionHeader title="Import exceptions" />
      <SummaryCard items={[{ label: 'Rows to review', value: '3' }]} />
      <ListSection title="Needs your input">
        <ListRow label="Row 42 · distance unclear" value="Review" onPress={() => navigation.navigate('MainTabs', { screen: 'Review' })} />
        <ListRow label="Row 87 · duplicate date" value="Review" />
        <ListRow label="Row 103 · unknown vehicle" value="Review" />
      </ListSection>
      <PrimaryButton label="Done reviewing" onPress={() => navigation.goBack()} />
    </ScrollScreen>
  );
}
