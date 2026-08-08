import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';

const STORAGE_KEY = '@milerecover/review-prompt/v1';
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 90; // 90 days
const MIN_POSITIVE_EVENTS = 1;

type ReviewPromptState = {
  askedAt: number | null;
  declinedAt: number | null;
  positiveEvents: number;
  lastEventKey: string | null;
};

type ReviewMoment =
  | 'first_recovered_drive'
  | 'review_backlog_cleared'
  | 'first_report_created'
  | 'several_auto_captures';

const DEFAULT_STATE: ReviewPromptState = {
  askedAt: null,
  declinedAt: null,
  positiveEvents: 0,
  lastEventKey: null,
};

async function readState(): Promise<ReviewPromptState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<ReviewPromptState>;
    return {
      askedAt: typeof parsed.askedAt === 'number' ? parsed.askedAt : null,
      declinedAt: typeof parsed.declinedAt === 'number' ? parsed.declinedAt : null,
      positiveEvents: typeof parsed.positiveEvents === 'number' ? parsed.positiveEvents : 0,
      lastEventKey: typeof parsed.lastEventKey === 'string' ? parsed.lastEventKey : null,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function writeState(next: ReviewPromptState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function inCooldown(state: ReviewPromptState, now: number): boolean {
  const stamps = [state.askedAt, state.declinedAt].filter((v): v is number => typeof v === 'number');
  return stamps.some((stamp) => now - stamp < COOLDOWN_MS);
}

async function openNativeReview(): Promise<boolean> {
  try {
    if ((await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction())) {
      await StoreReview.requestReview();
      return true;
    }
  } catch {
    // Fall through to store listing.
  }
  const url =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/id0000000000'
      : 'https://play.google.com/store/apps/details?id=com.milerecover.app';
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Satisfaction-gated store review prompt.
 * Never call during onboarding, errors, denied permissions, or paywall flows.
 */
export async function maybeAskForReview(moment: ReviewMoment): Promise<void> {
  const now = Date.now();
  const state = await readState();
  if (inCooldown(state, now)) return;
  if (state.lastEventKey === moment) return;

  const next: ReviewPromptState = {
    ...state,
    positiveEvents: state.positiveEvents + 1,
    lastEventKey: moment,
  };
  await writeState(next);
  if (next.positiveEvents < MIN_POSITIVE_EVENTS) return;

  Alert.alert('Enjoying MileRecover?', 'Your feedback helps other drivers protect their miles.', [
    {
      text: 'Not really',
      style: 'cancel',
      onPress: () => {
        void writeState({ ...next, declinedAt: Date.now() });
        Alert.alert(
          'Thanks for telling us',
          'You can share feedback anytime from Profile → Help & support.',
        );
      },
    },
    {
      text: 'Yes',
      onPress: () => {
        void (async () => {
          await writeState({ ...next, askedAt: Date.now() });
          await openNativeReview();
        })();
      },
    },
  ]);
}
