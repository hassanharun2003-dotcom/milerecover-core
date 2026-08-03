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
        <LoadingState message="Organizing your mileage…" />
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

  if (product.importPhase === 'failed') {
    return (
      <ScrollScreen>
        <StatusCard
          variant="danger"
          title="Import couldn’t finish"
          body="Your file is still here. Nothing was discarded. Try again or check the rows that need you."
          actionLabel="Try again"
          onAction={() => setImportPhase('processing', product.importFileLabel)}
          emphasis="hero"
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
            label="Check rows that need you"
            onPress={() => {
              setImportPhase('review_required');
              navigation.navigate('ImportExceptionReview');
            }}
          />
        </View>
      }
    >
      <StatusCard
        variant="success"
        title="Ready when you are"
        body="Nothing was silently discarded. Unclear rows stay available for a quick look."
        emphasis="hero"
      />
      <SummaryCard
        items={[
          { label: 'Trips found', value: '214' },
          { label: 'Distance', value: '1,842 mi' },
          { label: 'Need a look', value: '12' },
        ]}
      />
      <ListSection title="Import details">
        <EvidenceRow label="Selected file" value={product.importFileLabel ?? 'Sample import'} />
        <EvidenceRow label="Date range" value="Jan 1 – Jul 31, 2026" />
        <EvidenceRow label="Vehicles detected" value="2" />
        <EvidenceRow label="Duplicates we merged" value="8" />
        <EvidenceRow label="Rows we couldn’t read" value="3 kept for you" />
      </ListSection>
      <ListSection title="What happens next">
        <ListRow label="Organized trips" value="Ready in Review" />
        <ListRow label="Unclear rows" value="Never silently discarded" />
      </ListSection>
    </ScrollScreen>
  );
}

export function ImportExceptionReviewScreen() {
  const navigation = useNavigation<Nav>();
  return (
    <ScrollScreen>
      <StatusCard
        variant="info"
        title="Rows to check"
        body="A few lines weren’t clear. Your call—nothing was thrown away."
        emphasis="subtle"
      />
      <SummaryCard items={[{ label: 'Rows to review', value: '3' }]} />
      <ListSection title="Needs your input">
        <ListRow
          label="Row 42 · distance unclear"
          value="Review"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Review' })}
        />
        <ListRow label="Row 87 · duplicate date" value="Review" />
        <ListRow label="Row 103 · unknown vehicle" value="Review" />
      </ListSection>
      <PrimaryButton label="Done for now" onPress={() => navigation.goBack()} />
    </ScrollScreen>
  );
}
