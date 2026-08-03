import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radii, shadows, spacing } from '@milerecover/config';

export function CarRouteHero({ compact = false }: { compact?: boolean }) {
  const isJest = typeof process !== 'undefined' && process.env.JEST_WORKER_ID != null;
  const [reduceMotion, setReduceMotion] = useState(true);
  const glide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    const info = AccessibilityInfo as typeof AccessibilityInfo & {
      isReduceMotionPreferred?: () => Promise<boolean>;
      isReduceMotionEnabled?: () => Promise<boolean>;
    };
    const readPreference = info.isReduceMotionPreferred ?? info.isReduceMotionEnabled;
    void readPreference?.call(info).then((value) => {
      if (isJest) return;
      if (mounted) setReduceMotion(Boolean(value));
    });
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
      setReduceMotion(Boolean(enabled));
    });
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, [isJest]);

  useEffect(() => {
    if (reduceMotion) {
      glide.stopAnimation();
      glide.setValue(0.45);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glide, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glide, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glide, reduceMotion]);

  const carTranslate = reduceMotion
    ? 0
    : glide.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] });
  const sizeStyle = compact ? styles.compact : styles.full;

  return (
    <View
      style={[styles.hero, sizeStyle]}
      accessibilityRole="image"
      accessibilityLabel="Illustration of a protected car route ending in a mileage report"
    >
      <View style={[styles.routeBar, styles.routeBarOne]} />
      <View style={[styles.routeBar, styles.routeBarTwo]} />
      <View style={[styles.routeDot, styles.dotStart]} />
      <View style={[styles.routeDot, styles.dotMiddle]} />
      <View style={[styles.routeDot, styles.dotEnd]} />

      <View style={styles.pin}>
        <View style={styles.pinHead} />
        <View style={styles.pinPoint} />
      </View>

      <Animated.View style={[styles.car, { transform: [{ translateX: carTranslate }] }]}>
        <View style={styles.carTop} />
        <View style={styles.carBody}>
          <View style={styles.window} />
          <View style={styles.windowSmall} />
        </View>
        <View style={styles.wheelRow}>
          <View style={styles.wheel} />
          <View style={styles.wheel} />
        </View>
      </Animated.View>

      <View style={styles.shield}>
        <Text style={styles.shieldCheck}>✓</Text>
      </View>

      {!compact ? (
        <View style={styles.reportCard}>
          <View style={styles.reportLineLong} />
          <View style={styles.reportLineShort} />
          <Text style={styles.reportMiles}>12.4 mi</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.lg,
    backgroundColor: colors.forest[100],
    overflow: 'hidden',
    marginVertical: spacing.md,
    ...shadows.card,
  },
  full: {
    height: 220,
  },
  compact: {
    height: 132,
  },
  routeBar: {
    position: 'absolute',
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.protected[100],
    borderWidth: 1,
    borderColor: colors.forest[500],
  },
  routeBarOne: {
    width: '72%',
    left: -24,
    top: 98,
    transform: [{ rotate: '-14deg' }],
  },
  routeBarTwo: {
    width: '62%',
    right: -16,
    top: 126,
    transform: [{ rotate: '11deg' }],
  },
  routeDot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.forest[600],
    borderWidth: 3,
    borderColor: colors.background.card,
  },
  dotStart: { left: 26, top: 116 },
  dotMiddle: { left: '48%', top: 89 },
  dotEnd: { right: 34, top: 128 },
  pin: {
    position: 'absolute',
    left: 28,
    top: 34,
    alignItems: 'center',
  },
  pinHead: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.forest[700],
    borderWidth: 7,
    borderColor: colors.background.card,
  },
  pinPoint: {
    marginTop: -2,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.forest[700],
  },
  car: {
    position: 'absolute',
    left: '34%',
    top: 82,
    width: 124,
    height: 72,
  },
  carTop: {
    width: 58,
    height: 30,
    borderRadius: radii.md,
    backgroundColor: colors.forest[600],
    marginLeft: 31,
    marginBottom: -12,
  },
  carBody: {
    height: 42,
    borderRadius: radii.lg,
    backgroundColor: colors.forest[800],
    borderWidth: 2,
    borderColor: colors.forest[900],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  window: {
    width: 28,
    height: 16,
    borderRadius: radii.sm,
    backgroundColor: colors.protected[100],
  },
  windowSmall: {
    width: 18,
    height: 16,
    borderRadius: radii.sm,
    backgroundColor: colors.protected[100],
  },
  wheelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: -8,
  },
  wheel: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.neutral[900],
    borderWidth: 4,
    borderColor: colors.neutral[200],
  },
  shield: {
    position: 'absolute',
    right: 28,
    top: 32,
    width: 42,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.forest[700],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.card,
  },
  shieldCheck: {
    color: colors.text.inverse,
    fontSize: 24,
    fontWeight: '800',
  },
  reportCard: {
    position: 'absolute',
    right: 22,
    bottom: 20,
    width: 94,
    borderRadius: radii.md,
    backgroundColor: colors.background.card,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  reportLineLong: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.neutral[200],
    marginBottom: spacing.xs,
  },
  reportLineShort: {
    width: '62%',
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.neutral[200],
    marginBottom: spacing.sm,
  },
  reportMiles: {
    color: colors.forest[700],
    fontWeight: '800',
  },
});
