import React from 'react';
import { Image, StyleSheet, type ImageStyle, type StyleProp, View } from 'react-native';

/**
 * Locked MileRecover illustrations exported from Figma
 * file 5y8p0axQChkYVBcM7tgHDj (Production Design Lock).
 */
const ILLUSTRATIONS = {
  welcomeProtection: require('../../assets/illustrations/welcome-protection.png'),
  trackingCar: require('../../assets/illustrations/tracking-car.png'),
  readySuccess: require('../../assets/illustrations/ready-success.png'),
  missingDrivesRoute: require('../../assets/illustrations/missing-drives-route.png'),
  missingNoResults: require('../../assets/illustrations/missing-no-results.png'),
  recoverySuccess: require('../../assets/illustrations/recovery-success.png'),
  protectionHero: require('../../assets/illustrations/protection-hero.png'),
} as const;

export type IllustrationKey = keyof typeof ILLUSTRATIONS;

const DEFAULT_SIZES: Record<IllustrationKey, { width: number; height: number }> = {
  welcomeProtection: { width: 140, height: 140 },
  trackingCar: { width: 160, height: 110 },
  readySuccess: { width: 140, height: 140 },
  missingDrivesRoute: { width: 280, height: 180 },
  missingNoResults: { width: 120, height: 120 },
  recoverySuccess: { width: 120, height: 120 },
  protectionHero: { width: 342, height: 134 },
};

export function FigmaIllustration({
  name,
  accessibilityLabel,
  style,
  width,
  height,
}: {
  name: IllustrationKey;
  accessibilityLabel: string;
  style?: StyleProp<ImageStyle>;
  width?: number;
  height?: number;
}) {
  const defaults = DEFAULT_SIZES[name];
  const w = width ?? defaults.width;
  const h = height ?? defaults.height;
  return (
    <View style={styles.wrap} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Image
        source={ILLUSTRATIONS[name]}
        style={[{ width: w, height: h, resizeMode: 'contain' }, style]}
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
