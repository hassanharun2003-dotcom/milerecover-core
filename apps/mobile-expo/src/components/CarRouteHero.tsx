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

const ACCESSIBLE_LABEL =
  'MileRecover protects and records your work drives along a route, ending in a mileage card.';

/**
 * Editorial vector-style onboarding hero — View composition (no SVG dependency).
 * Decorative for screen readers; concise meaning lives on the container label.
 */
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
      glide.setValue(0.4);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glide, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glide, {
          toValue: 0,
          duration: 2800,
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
    : glide.interpolate({ inputRange: [0, 1], outputRange: [-10, 12] });
  const sizeStyle = compact ? styles.compact : styles.full;

  return (
    <View
      style={[styles.hero, sizeStyle]}
      accessibilityRole="image"
      accessibilityLabel={ACCESSIBLE_LABEL}
      accessible
    >
      <View style={styles.scene} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {/* Soft landscape depth */}
        <View style={[styles.hill, styles.hillBack]} />
        <View style={[styles.hill, styles.hillMid]} />
        <View style={[styles.hill, styles.hillFront]} />

        {/* Long winding road */}
        <View style={[styles.road, styles.roadA]} />
        <View style={[styles.road, styles.roadB]} />
        <View style={[styles.road, styles.roadC]} />
        <View style={[styles.roadDash, styles.dashA]} />
        <View style={[styles.roadDash, styles.dashB]} />
        <View style={[styles.roadDash, styles.dashC]} />

        {/* Location markers */}
        <View style={[styles.marker, styles.markerStart]}>
          <View style={styles.markerHead} />
          <View style={styles.markerStem} />
        </View>
        <View style={[styles.marker, styles.markerMid]}>
          <View style={[styles.markerHead, styles.markerHeadSoft]} />
          <View style={styles.markerStem} />
        </View>
        <View style={[styles.marker, styles.markerEnd]}>
          <View style={styles.markerHead} />
          <View style={styles.markerStem} />
        </View>

        {/* Compact crossover / SUV */}
        <Animated.View style={[styles.suv, { transform: [{ translateX: carTranslate }] }]}>
          <View style={styles.suvCabin} />
          <View style={styles.suvBody}>
            <View style={styles.suvWindowWide} />
            <View style={styles.suvWindow} />
            <View style={styles.suvLight} />
          </View>
          <View style={styles.suvWheelRow}>
            <View style={styles.suvWheel}>
              <View style={styles.suvHub} />
            </View>
            <View style={styles.suvWheel}>
              <View style={styles.suvHub} />
            </View>
          </View>
          <View style={styles.suvShadow} />
        </Animated.View>

        {/* Protection shield */}
        <View style={styles.shield}>
          <View style={styles.shieldInner}>
            <Text style={styles.shieldCheck}>✓</Text>
          </View>
        </View>

        {!compact ? (
          <View style={styles.mileageCard}>
            <Text style={styles.mileageEyebrow}>Work drive</Text>
            <Text style={styles.mileageValue}>12.4 mi</Text>
            <View style={styles.mileageBar} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.lg,
    backgroundColor: colors.forest[100],
    overflow: 'hidden',
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.forest[500],
    ...shadows.card,
  },
  full: {
    height: 228,
  },
  compact: {
    height: 136,
  },
  scene: {
    flex: 1,
  },
  hill: {
    position: 'absolute',
    borderRadius: 120,
    backgroundColor: colors.protected[100],
  },
  hillBack: {
    width: 220,
    height: 120,
    left: -40,
    top: 28,
    opacity: 0.55,
  },
  hillMid: {
    width: 200,
    height: 110,
    right: -36,
    top: 48,
    opacity: 0.7,
    backgroundColor: colors.forest[100],
  },
  hillFront: {
    width: 260,
    height: 90,
    left: '18%',
    bottom: -28,
    opacity: 0.85,
    backgroundColor: '#D8EBD8',
  },
  road: {
    position: 'absolute',
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.forest[700],
    opacity: 0.88,
  },
  roadA: {
    width: '58%',
    left: -12,
    top: 118,
    transform: [{ rotate: '-16deg' }],
  },
  roadB: {
    width: '48%',
    left: '28%',
    top: 98,
    transform: [{ rotate: '10deg' }],
  },
  roadC: {
    width: '46%',
    right: -10,
    top: 132,
    transform: [{ rotate: '-8deg' }],
  },
  roadDash: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.background.card,
    opacity: 0.7,
  },
  dashA: { width: 22, left: 48, top: 124, transform: [{ rotate: '-16deg' }] },
  dashB: { width: 18, left: '46%', top: 104, transform: [{ rotate: '10deg' }] },
  dashC: { width: 20, right: 56, top: 138, transform: [{ rotate: '-8deg' }] },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    width: 22,
  },
  markerStart: { left: 28, top: 54 },
  markerMid: { left: '47%', top: 42 },
  markerEnd: { right: 86, top: 68 },
  markerHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.forest[700],
    borderWidth: 3,
    borderColor: colors.background.card,
    ...shadows.card,
  },
  markerHeadSoft: {
    backgroundColor: colors.forest[500],
  },
  markerStem: {
    marginTop: -2,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.forest[700],
  },
  suv: {
    position: 'absolute',
    left: '30%',
    top: 86,
    width: 132,
    height: 78,
    zIndex: 3,
  },
  suvCabin: {
    width: 64,
    height: 28,
    marginLeft: 34,
    marginBottom: -10,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    backgroundColor: colors.forest[600],
    borderWidth: 1.5,
    borderColor: colors.forest[800],
  },
  suvBody: {
    height: 38,
    borderRadius: radii.lg,
    backgroundColor: colors.forest[800],
    borderWidth: 2,
    borderColor: colors.forest[900],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: 6,
    ...shadows.card,
  },
  suvWindowWide: {
    width: 30,
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.protected[100],
    opacity: 0.95,
  },
  suvWindow: {
    width: 18,
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.protected[100],
    opacity: 0.9,
  },
  suvLight: {
    marginLeft: 'auto',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
  },
  suvWheelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: -9,
  },
  suvWheel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral[900],
    borderWidth: 3,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  suvHub: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
  },
  suvShadow: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 2,
    height: 6,
    borderRadius: 8,
    backgroundColor: colors.forest[900],
    opacity: 0.12,
  },
  shield: {
    position: 'absolute',
    right: 22,
    top: 26,
    width: 46,
    height: 52,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: colors.forest[700],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.card,
    zIndex: 4,
    ...shadows.card,
  },
  shieldInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldCheck: {
    color: colors.text.inverse,
    fontSize: 22,
    fontWeight: '800',
    marginTop: -2,
  },
  mileageCard: {
    position: 'absolute',
    right: 18,
    bottom: 16,
    width: 102,
    borderRadius: radii.md,
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    zIndex: 4,
    ...shadows.card,
  },
  mileageEyebrow: {
    color: colors.forest[600],
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  mileageValue: {
    color: colors.forest[800],
    fontWeight: '800',
    fontSize: 18,
  },
  mileageBar: {
    marginTop: spacing.xs,
    height: 4,
    width: '70%',
    borderRadius: radii.pill,
    backgroundColor: colors.forest[500],
    opacity: 0.35,
  },
});
