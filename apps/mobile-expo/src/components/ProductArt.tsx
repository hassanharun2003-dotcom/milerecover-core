import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing } from '@milerecover/config';

/**
 * Production View-based artwork for Samsung-safe rendering.
 * PNGs via FigmaIllustration remain as secondary/export assets; these
 * compositions cannot collapse into a single vertical stroke on device.
 */

function useReduceMotion(): boolean {
  const isJest = typeof process !== 'undefined' && process.env.JEST_WORKER_ID != null;
  const [reduceMotion, setReduceMotion] = useState(isJest);
  useEffect(() => {
    if (isJest) return;
    let mounted = true;
    const info = AccessibilityInfo as typeof AccessibilityInfo & {
      isReduceMotionPreferred?: () => Promise<boolean>;
      isReduceMotionEnabled?: () => Promise<boolean>;
    };
    const read = info.isReduceMotionPreferred ?? info.isReduceMotionEnabled;
    void read?.call(info).then((value) => {
      if (mounted) setReduceMotion(Boolean(value));
    });
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
      setReduceMotion(Boolean(enabled));
    });
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, [isJest]);
  return reduceMotion;
}

function Frame({
  height,
  label,
  style,
  children,
}: {
  height: number;
  label: string;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[styles.frame, { height }, style]}
      accessibilityRole="image"
      accessibilityLabel={label}
      accessible
    >
      <View style={styles.scene} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {children}
      </View>
    </View>
  );
}

function Car({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.car, style]}>
      <View style={styles.carCabin} />
      <View style={styles.carBody}>
        <View style={styles.carWindow} />
        <View style={[styles.carWindow, { width: 14 }]} />
      </View>
      <View style={styles.carWheels}>
        <View style={styles.wheel} />
        <View style={styles.wheel} />
      </View>
    </View>
  );
}

export function MissingDrivesArt({ style }: { style?: ViewStyle }) {
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);
  const pinOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <Frame height={180} label="Car scanning a route for missed drives" style={style}>
      <View style={styles.routeArc} />
      <View style={[styles.routeArc, styles.routeArcSoft]} />
      <Animated.View style={[styles.pin, styles.pinLeft, { opacity: pinOpacity }]} />
      <Animated.View style={[styles.pin, styles.pinMid, { opacity: pinOpacity }]} />
      <Animated.View style={[styles.pin, styles.pinRight, { opacity: pinOpacity }]} />
      <View style={styles.ground} />
      <Car style={{ left: '34%', bottom: 36 }} />
    </Frame>
  );
}

export function ProtectionArt({ style }: { style?: ViewStyle }) {
  return (
    <Frame height={134} label="Shield protecting automatic drive capture" style={style}>
      <View style={styles.protectGlow} />
      <View style={styles.shield}>
        <Text style={styles.shieldCheck}>✓</Text>
      </View>
      <View style={styles.protectRoad} />
      <Car style={{ left: 28, bottom: 28, transform: [{ scale: 0.85 }] }} />
    </Frame>
  );
}

export function WelcomeArt({ style }: { style?: ViewStyle }) {
  const reduceMotion = useReduceMotion();
  const travel = useRef(new Animated.Value(0)).current;
  const routeDraw = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      travel.setValue(1);
      routeDraw.setValue(1);
      return;
    }
    travel.setValue(0);
    routeDraw.setValue(0);
    const anim = Animated.parallel([
      Animated.timing(routeDraw, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(travel, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, routeDraw, travel]);
  const carX = travel.interpolate({ inputRange: [0, 1], outputRange: [28, 0] });
  const routeOpacity = routeDraw.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });

  return (
    <Frame
      height={160}
      label="MileRecover welcome protection artwork"
      style={{ marginVertical: spacing.md, ...(style ?? {}) }}
    >
      <Animated.View style={[styles.welcomeCircle, { opacity: routeOpacity }]} />
      <View style={styles.shieldLarge}>
        <Text style={styles.shieldCheckLarge}>✓</Text>
      </View>
      <Animated.View
        style={{ position: 'absolute', right: 28, bottom: 28, transform: [{ translateX: carX }] }}
      >
        <Car style={{ left: undefined, right: undefined, bottom: undefined }} />
      </Animated.View>
    </Frame>
  );
}

export function TrackingArt({ style }: { style?: ViewStyle }) {
  const reduceMotion = useReduceMotion();
  const drift = useRef(new Animated.Value(0)).current;
  const routeDraw = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      drift.setValue(1);
      routeDraw.setValue(1);
      return;
    }
    drift.setValue(0);
    routeDraw.setValue(0);
    // One-shot entry motion — not an aggressive loop.
    const anim = Animated.parallel([
      Animated.timing(routeDraw, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(drift, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [drift, reduceMotion, routeDraw]);
  const tx = drift.interpolate({ inputRange: [0, 1], outputRange: [-12, 36] });
  const roadOpacity = routeDraw.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  return (
    <Frame height={140} label="Car tracking along a protected route" style={style}>
      <Animated.View style={[styles.trackRoad, { opacity: roadOpacity }]} />
      <View style={[styles.pin, { left: 24, top: 42 }]} />
      <View style={[styles.pin, { right: 36, top: 54 }]} />
      <Animated.View style={{ position: 'absolute', left: 48, bottom: 34, transform: [{ translateX: tx }] }}>
        <Car />
      </Animated.View>
    </Frame>
  );
}

export function ReadyArt({ style }: { style?: ViewStyle }) {
  const reduceMotion = useReduceMotion();
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      pop.setValue(1);
      return;
    }
    pop.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(pop, {
        toValue: 1.08,
        duration: 420,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(pop, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [pop, reduceMotion]);
  const scale = pop.interpolate({ inputRange: [0, 1, 1.08], outputRange: [0.72, 1, 1.08] });
  const opacity = pop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] });

  return (
    <Frame height={140} label="Ready success artwork" style={style}>
      <View style={styles.readyRing} />
      <Animated.View style={[styles.readyInner, { transform: [{ scale }], opacity }]}>
        <Text style={styles.readyCheck}>✓</Text>
      </Animated.View>
    </Frame>
  );
}

export function RecoverySuccessArt({ style }: { style?: ViewStyle }) {
  return (
    <Frame height={120} label="Miles recovered success artwork" style={style}>
      <View style={styles.readyRing} />
      <View style={[styles.readyInner, { backgroundColor: colors.forest[600] }]}>
        <Text style={styles.readyCheck}>+</Text>
      </View>
    </Frame>
  );
}

export function EmptyReviewArt({ style }: { style?: ViewStyle }) {
  return (
    <Frame height={120} label="Review empty state artwork" style={style}>
      <View style={styles.emptyCard} />
      <View style={[styles.emptyCard, styles.emptyCardBack]} />
      <View style={styles.readyInner}>
        <Text style={[styles.readyCheck, { fontSize: 22 }]}>✓</Text>
      </View>
    </Frame>
  );
}

export function EmptyProofArt({ style }: { style?: ViewStyle }) {
  return (
    <Frame height={120} label="Proof empty state artwork" style={style}>
      <View style={styles.proofSheet} />
      <View style={styles.proofBarA} />
      <View style={styles.proofBarB} />
      <View style={styles.proofBarC} />
    </Frame>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: radii.xl,
    // Neutral surface — green reserved for accents / positive status, not every card.
    backgroundColor: colors.background.card,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  scene: { flex: 1 },
  car: { position: 'absolute', width: 96, height: 54 },
  carCabin: {
    width: 46,
    height: 20,
    marginLeft: 26,
    marginBottom: -8,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    backgroundColor: colors.forest[600],
  },
  carBody: {
    height: 28,
    borderRadius: radii.lg,
    backgroundColor: colors.forest[800],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  carWindow: {
    width: 22,
    height: 10,
    borderRadius: 3,
    backgroundColor: colors.protected[100],
  },
  carWheels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: -8,
  },
  wheel: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.neutral[900],
    borderWidth: 2,
    borderColor: colors.neutral[200],
  },
  routeArc: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 48,
    height: 70,
    borderRadius: 80,
    borderWidth: 10,
    borderColor: colors.forest[100],
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-8deg' }],
  },
  routeArcSoft: {
    top: 58,
    borderWidth: 6,
    borderColor: colors.forest[500],
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    opacity: 0.55,
  },
  pin: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.forest[700],
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  pinLeft: { left: 40, top: 70 },
  pinMid: { left: '48%', top: 42 },
  pinRight: { right: 44, top: 66 },
  ground: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    bottom: 28,
    height: 16,
    borderRadius: 20,
    backgroundColor: colors.forest[100],
  },
  protectGlow: {
    position: 'absolute',
    left: '30%',
    right: '10%',
    top: 10,
    height: 90,
    borderRadius: 60,
    backgroundColor: colors.forest[100],
  },
  shield: {
    position: 'absolute',
    right: 36,
    top: 18,
    width: 54,
    height: 62,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: colors.forest[700],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  shieldCheck: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  protectRoad: {
    position: 'absolute',
    left: 16,
    right: 100,
    bottom: 40,
    height: 14,
    borderRadius: 10,
    backgroundColor: colors.forest[600],
    transform: [{ rotate: '-6deg' }],
  },
  welcomeCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    left: 36,
    top: 20,
    backgroundColor: colors.forest[100],
  },
  shieldLarge: {
    position: 'absolute',
    left: 62,
    top: 36,
    width: 68,
    height: 78,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.forest[700],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  shieldCheckLarge: { color: '#FFFFFF', fontSize: 34, fontWeight: '800' },
  trackRoad: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 48,
    height: 16,
    borderRadius: 12,
    backgroundColor: colors.forest[700],
    transform: [{ rotate: '-4deg' }],
  },
  readyRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    left: '50%',
    top: '50%',
    marginLeft: -44,
    marginTop: -44,
    backgroundColor: colors.forest[100],
  },
  readyInner: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    left: '50%',
    top: '50%',
    marginLeft: -29,
    marginTop: -29,
    backgroundColor: colors.forest[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyCheck: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  emptyCard: {
    position: 'absolute',
    width: 120,
    height: 64,
    borderRadius: radii.lg,
    left: '50%',
    marginLeft: -60,
    top: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  emptyCardBack: {
    top: 40,
    transform: [{ rotate: '6deg' }],
    opacity: 0.7,
  },
  proofSheet: {
    position: 'absolute',
    width: 110,
    height: 86,
    borderRadius: radii.md,
    left: '50%',
    marginLeft: -55,
    top: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  proofBarA: {
    position: 'absolute',
    left: '50%',
    marginLeft: -38,
    top: 36,
    width: 76,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.forest[500],
  },
  proofBarB: {
    position: 'absolute',
    left: '50%',
    marginLeft: -38,
    top: 52,
    width: 58,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.forest[500],
    opacity: 0.55,
  },
  proofBarC: {
    position: 'absolute',
    left: '50%',
    marginLeft: -38,
    top: 68,
    width: 44,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.forest[100],
  },
});
