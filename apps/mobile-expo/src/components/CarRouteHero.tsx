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
  'Animated car driving along a winding work route that MileRecover protects.';

/**
 * Editorial onboarding hero — car glides along a winding road (native driver).
 * Respects reduce-motion. No external image/SVG dependency.
 */
export function CarRouteHero({ compact = false }: { compact?: boolean }) {
  const isJest = typeof process !== 'undefined' && process.env.JEST_WORKER_ID != null;
  const [reduceMotion, setReduceMotion] = useState(isJest);
  const progress = useRef(new Animated.Value(0)).current;
  const wheelSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isJest) return;
    let mounted = true;
    // Prefer motion on first paint for a lively Welcome; honor OS preference when known.
    setReduceMotion(false);
    const info = AccessibilityInfo as typeof AccessibilityInfo & {
      isReduceMotionPreferred?: () => Promise<boolean>;
      isReduceMotionEnabled?: () => Promise<boolean>;
    };
    const readPreference = info.isReduceMotionPreferred ?? info.isReduceMotionEnabled;
    void readPreference?.call(info).then((value) => {
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
      progress.stopAnimation();
      wheelSpin.stopAnimation();
      progress.setValue(0.45);
      wheelSpin.setValue(0);
      return;
    }
    const drive = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    const wheels = Animated.loop(
      Animated.timing(wheelSpin, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    drive.start();
    wheels.start();
    return () => {
      drive.stop();
      wheels.stop();
    };
  }, [progress, reduceMotion, wheelSpin]);

  // Piecewise path that tracks the three road segments (left→mid→right).
  const carTranslateX = progress.interpolate({
    inputRange: [0, 0.35, 0.65, 1],
    outputRange: compact ? [-8, 28, 58, 84] : [-6, 46, 96, 138],
  });
  const carTranslateY = progress.interpolate({
    inputRange: [0, 0.35, 0.65, 1],
    outputRange: compact ? [10, -6, 4, 14] : [18, -8, 6, 22],
  });
  const carRotate = progress.interpolate({
    inputRange: [0, 0.35, 0.65, 1],
    outputRange: ['-14deg', '8deg', '-6deg', '-10deg'],
  });
  const wheelRotate = wheelSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const sizeStyle = compact ? styles.compact : styles.full;

  return (
    <View
      style={[styles.hero, sizeStyle]}
      accessibilityRole="image"
      accessibilityLabel={ACCESSIBLE_LABEL}
      accessible
    >
      <View style={styles.scene} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View style={[styles.skyGlow]} />
        <View style={[styles.hill, styles.hillBack]} />
        <View style={[styles.hill, styles.hillMid]} />
        <View style={[styles.hill, styles.hillFront]} />

        <View style={[styles.road, styles.roadA]} />
        <View style={[styles.road, styles.roadB]} />
        <View style={[styles.road, styles.roadC]} />
        <View style={[styles.roadDash, styles.dashA]} />
        <View style={[styles.roadDash, styles.dashB]} />
        <View style={[styles.roadDash, styles.dashC]} />
        <View style={[styles.roadDash, styles.dashD]} />

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

        <Animated.View
          style={[
            styles.suv,
            {
              transform: [
                { translateX: carTranslateX },
                { translateY: carTranslateY },
                { rotate: carRotate },
              ],
            },
          ]}
        >
          <View style={styles.suvCabin} />
          <View style={styles.suvBody}>
            <View style={styles.suvWindowWide} />
            <View style={styles.suvWindow} />
            <View style={styles.suvLight} />
          </View>
          <View style={styles.suvWheelRow}>
            <Animated.View style={[styles.suvWheel, { transform: [{ rotate: wheelRotate }] }]}>
              <View style={styles.suvHub} />
            </Animated.View>
            <Animated.View style={[styles.suvWheel, { transform: [{ rotate: wheelRotate }] }]}>
              <View style={styles.suvHub} />
            </Animated.View>
          </View>
          <View style={styles.suvShadow} />
        </Animated.View>

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
    height: 248,
  },
  compact: {
    height: 148,
  },
  scene: {
    flex: 1,
  },
  skyGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '55%',
    backgroundColor: '#EEF6F0',
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
    width: 280,
    height: 96,
    left: '14%',
    bottom: -30,
    opacity: 0.9,
    backgroundColor: '#D8EBD8',
  },
  road: {
    position: 'absolute',
    height: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.forest[700],
    opacity: 0.9,
  },
  roadA: {
    width: '58%',
    left: -12,
    top: 128,
    transform: [{ rotate: '-16deg' }],
  },
  roadB: {
    width: '50%',
    left: '26%',
    top: 106,
    transform: [{ rotate: '10deg' }],
  },
  roadC: {
    width: '48%',
    right: -12,
    top: 142,
    transform: [{ rotate: '-8deg' }],
  },
  roadDash: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.background.card,
    opacity: 0.75,
  },
  dashA: { width: 22, left: 48, top: 134, transform: [{ rotate: '-16deg' }] },
  dashB: { width: 18, left: '44%', top: 112, transform: [{ rotate: '10deg' }] },
  dashC: { width: 20, right: 72, top: 148, transform: [{ rotate: '-8deg' }] },
  dashD: { width: 16, left: '62%', top: 120, transform: [{ rotate: '6deg' }] },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    width: 22,
  },
  markerStart: { left: 28, top: 58 },
  markerMid: { left: '47%', top: 44 },
  markerEnd: { right: 78, top: 74 },
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
    left: 18,
    top: 92,
    width: 118,
    height: 72,
    zIndex: 3,
  },
  suvCabin: {
    width: 58,
    height: 26,
    marginLeft: 30,
    marginBottom: -10,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    backgroundColor: colors.forest[600],
    borderWidth: 1.5,
    borderColor: colors.forest[800],
  },
  suvBody: {
    height: 34,
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
    width: 28,
    height: 12,
    borderRadius: 4,
    backgroundColor: colors.protected[100],
    opacity: 0.95,
  },
  suvWindow: {
    width: 16,
    height: 12,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.neutral[900],
    borderWidth: 3,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  suvHub: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
  },
  suvShadow: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
    height: 6,
    borderRadius: 8,
    backgroundColor: colors.forest[900],
    opacity: 0.14,
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
