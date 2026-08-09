import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { spacing } from '@milerecover/config';
import { Card, ScreenContainer, uiStyles } from '../../components/ui';
import { permissionFixPriority } from '@milerecover/domain';
import { useApp } from '../../store/AppContext';

export function ProfileScreen() {
  const { permissions } = useApp();
  const fixes = permissionFixPriority(permissions);

  return (
    <ScreenContainer>
      <Text style={uiStyles.title} accessibilityRole="header">
        Profile
      </Text>
      <Card accessibilityLabel="Permission status">
        <Text style={styles.section}>Permissions</Text>
        <Text style={uiStyles.body}>Location: {permissions.location}</Text>
        <Text style={uiStyles.body}>Background: {permissions.backgroundLocation}</Text>
        <Text style={uiStyles.body}>Motion: {permissions.motion}</Text>
        {fixes.length > 0 ? (
          <Text style={[uiStyles.body, styles.fixes]}>Suggested fixes: {fixes.join(', ')}</Text>
        ) : null}
      </Card>
      <Card accessibilityLabel="Privacy">
        <Text style={styles.section}>Privacy & data</Text>
        <Text style={uiStyles.body}>Your trips stay on this device until sync is enabled.</Text>
      </Card>
      <Card accessibilityLabel="Help">
        <Text style={styles.section}>Help & about</Text>
        <Text style={uiStyles.body}>MileRecover Package 3 — production vertical slice.</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    fontWeight: '600',
    marginBottom: spacing.sm,
    fontSize: 16,
  },
  fixes: { marginTop: spacing.sm },
});
