import { AccessibilityInfo, Platform, Vibration } from 'react-native';

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

function vibrate(pattern: number | number[]): void {
  try {
    Vibration.vibrate(pattern);
  } catch {
    // Optional — never block UX.
  }
}

/** Light success feedback for high-value actions. No-ops when reduce-motion is on. */
export async function hapticSuccess(): Promise<void> {
  if (await prefersReducedMotion()) return;
  if (Platform.OS === 'android') vibrate([0, 24, 40, 24]);
  else vibrate(20);
}

/** Subtle selection tick for Work/Personal classification. */
export async function hapticSelection(): Promise<void> {
  if (await prefersReducedMotion()) return;
  vibrate(10);
}

export function resetHapticsCacheForTests(): void {
  reduceMotionCached = null;
}
