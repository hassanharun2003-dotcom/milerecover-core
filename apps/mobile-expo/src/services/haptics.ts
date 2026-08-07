import { AccessibilityInfo, Platform } from 'react-native';

let reduceMotionCached: boolean | null = null;

async function prefersReducedMotion(): Promise<boolean> {
  if (reduceMotionCached != null) return reduceMotionCached;
  try {
    const info = AccessibilityInfo as typeof AccessibilityInfo & {
      isReduceMotionPreferred?: () => Promise<boolean>;
      isReduceMotionEnabled?: () => Promise<boolean>;
    };
    const read = info.isReduceMotionPreferred ?? info.isReduceMotionEnabled;
    reduceMotionCached = Boolean(await read?.call(info));
  } catch {
    reduceMotionCached = false;
  }
  return reduceMotionCached;
}

/** Light success feedback for high-value actions. No-ops when reduce-motion is on. */
export async function hapticSuccess(): Promise<void> {
  if (await prefersReducedMotion()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Haptics = require('expo-haptics') as typeof import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Optional native module — never block UX.
  }
}

/** Subtle selection tick for Work/Personal classification. */
export async function hapticSelection(): Promise<void> {
  if (await prefersReducedMotion()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Haptics = require('expo-haptics') as typeof import('expo-haptics');
    if (Platform.OS === 'android') {
      await Haptics.selectionAsync();
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Optional.
  }
}

export function resetHapticsCacheForTests(): void {
  reduceMotionCached = null;
}
