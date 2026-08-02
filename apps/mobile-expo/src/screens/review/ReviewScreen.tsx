import React from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '@milerecover/config';
import { Card, PrimaryButton, ScreenContainer, uiStyles } from '../../components/ui';
import { selectReviewViewModel } from '../../selectors/reviewSelectors';
import { useApp } from '../../store/AppContext';
import type { RootStackParamList } from '../../navigation/types';

type ReviewNav = NativeStackNavigationProp<RootStackParamList>;

export function ReviewScreen() {
  const { state } = useApp();
  const vm = selectReviewViewModel(state);
  const navigation = useNavigation<ReviewNav>();

  if (vm.isEmpty) {
    return (
      <ScreenContainer>
        <Text style={uiStyles.title} accessibilityRole="header">
          Review
        </Text>
        <Card accessibilityLabel="Review empty state">
          <Text style={uiStyles.body}>{vm.emptyMessage}</Text>
          <PrimaryButton
            label="Add manual trip"
            onPress={() => navigation.navigate('ManualTrip')}
            accessibilityLabel="Add manual trip"
          />
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={uiStyles.title} accessibilityRole="header">
        Review
      </Text>
      <FlatList
        data={vm.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card accessibilityLabel={`Review item: ${item.title}`}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={uiStyles.body}>{item.subtitle}</Text>
            {item.distanceMiles != null ? (
              <Text style={styles.meta}>{item.distanceMiles.toFixed(1)} mi</Text>
            ) : null}
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  itemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  meta: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
  },
});
