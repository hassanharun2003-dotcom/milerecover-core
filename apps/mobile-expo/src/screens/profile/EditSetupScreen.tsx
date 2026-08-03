import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
import {
  FormField,
  PrimaryButton,
  SelectionCard,
  StackScrollScreen,
  StatusCard,
  text,
} from '../../design-system';
import { useProduct } from '../../product/ProductContext';
import {
  DRIVING_PATTERN_OPTIONS,
  PAIN_POINT_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  type PainPoint,
} from '../../product/types';

export function EditSetupScreen() {
  const {
    product,
    setPreferredName,
    setPrimaryGoal,
    setSelectedPainPoints,
    setDrivingType,
  } = useProduct();
  const [name, setName] = useState(product.preferredName ?? '');
  const [savedName, setSavedName] = useState(false);

  const togglePain = (pain: PainPoint) => {
    const next = product.selectedPainPoints.includes(pain)
      ? product.selectedPainPoints.filter((item) => item !== pain)
      : [...product.selectedPainPoints, pain];
    setSelectedPainPoints(next);
  };

  return (
    <StackScrollScreen>
      <StatusCard
        variant="info"
        title="Adjust setup"
        body="These answers personalize copy and next actions. Editing them does not restart onboarding or remove any records."
        emphasis="subtle"
      />

      <Text style={[text.subtitle, { marginBottom: spacing.sm }]}>Preferred name</Text>
      <FormField label="Preferred name" value={name} onChangeText={setName} placeholder="First name" />
      <PrimaryButton
        label={savedName ? 'Name saved' : 'Save name'}
        onPress={() => {
          setPreferredName(name.trim() || null);
          setSavedName(true);
        }}
      />

      <Text style={[text.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Primary goal</Text>
      {PRIMARY_GOAL_OPTIONS.map((option) => (
        <SelectionCard
          key={option.id}
          title={option.label}
          body={option.body}
          selected={product.primaryGoal === option.id}
          onPress={() => setPrimaryGoal(option.id)}
        />
      ))}

      <Text style={[text.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Pain points</Text>
      <Text style={[text.body, { marginBottom: spacing.sm }]}>Keep at least one selected for setup completeness.</Text>
      {PAIN_POINT_OPTIONS.map((option) => (
        <SelectionCard
          key={option.id}
          title={option.label}
          selected={product.selectedPainPoints.includes(option.id)}
          onPress={() => togglePain(option.id)}
        />
      ))}

      <Text style={[text.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Driving pattern</Text>
      <View style={{ marginBottom: spacing.lg }}>
        {DRIVING_PATTERN_OPTIONS.map((option) => (
          <SelectionCard
            key={option.id}
            title={option.label}
            selected={product.drivingType === option.id}
            onPress={() => setDrivingType(option.id)}
          />
        ))}
      </View>
    </StackScrollScreen>
  );
}
