import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { isStandaloneBuild, type AppVariant } from '../constants/buildInfo';

/**
 * Production authentication architecture
 * ------------------------------------
 * - Google: @react-native-google-signin/google-signin (system account picker)
 * - Apple: expo-apple-authentication (iOS)
 * - Email: reserved for backend magic-link / passwordless (not faked)
 *
 * AUTH_BACKEND_CONNECTED gates server session exchange only.
 * Local identity from a real Google/Apple token may persist for device UX
 * without claiming cloud sync. Never invent a successful login without an
 * identity provider response.
 *
 * Required config (app.config extra / EAS secrets):
 * - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (Web OAuth client — required for idToken)
 * - EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (Android OAuth client for package + SHA-1)
 * - EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID + GOOGLE_IOS_URL_SCHEME (iOS)
 * - Apple capability on the iOS App ID
 * - Backend session verifier before AUTH_BACKEND_CONNECTED = true
 *
 * See docs/qa/GOOGLE_SIGNIN_0.2.9.md for the exact external credential steps.
 */

export type AuthProviderId = 'google' | 'apple' | 'email';

export type AuthFailureReason =
  | 'unavailable'
  | 'cancelled'
  | 'network'
  | 'duplicate'
  | 'expired'
  | 'failed'
  | 'not_configured';

export type AuthResult =
  | {
      ok: true;
      userId: string;
      email: string | null;
      displayName: string | null;
      photoUrl: string | null;
      provider: AuthProviderId;
      backendLinked: boolean;
    }
  | {
      ok: false;
      reason: AuthFailureReason;
      message: string;
    };

export interface AuthSession {
  userId: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  provider: AuthProviderId;
  backendLinked: boolean;
}

export interface AuthPort {
  isProviderAvailable(provider: AuthProviderId): boolean;
  getSession(): Promise<AuthSession | null>;
  signIn(provider: AuthProviderId): Promise<AuthResult>;
  signOut(): Promise<void>;
}

export const AUTH_SESSION_STORAGE_KEY = '@milerecover/auth-session/v1';

/** User-facing copy — never mention build configuration or engineering internals. */
export const AUTH_GENERIC_FAILURE_MESSAGE =
  'Google sign-in didn’t complete. Please try again, or continue without an account.';

export const AUTH_NETWORK_MESSAGE =
  'You’re offline. Try Google sign-in again when connected.';

export const AUTH_CANCELLED_MESSAGE = 'Sign-in was cancelled.';

export const AUTH_NO_ACCOUNT_MESSAGE =
  'No Google account is available on this device. Add one in Android Settings, or continue without an account.';

export const AUTH_PLAY_SERVICES_MESSAGE =
  'Google Play Services is required for Google sign-in. Update Play Services, or continue without an account.';

/** Shown when native Google takes longer than AUTH_SIGNIN_TIMEOUT_MS. */
export const AUTH_SLOW_MESSAGE = 'Google is taking longer than expected. Try again.';

/** Soft timeout for the critical path — never strand the user indefinitely. */
export const AUTH_SIGNIN_TIMEOUT_MS = 25_000;

/** @deprecated Use AUTH_GENERIC_FAILURE_MESSAGE — kept for tests that import the old name. */
export const AUTH_UNAVAILABLE_MESSAGE = AUTH_GENERIC_FAILURE_MESSAGE;

export type GoogleAuthPhase = 'idle' | 'opening_google' | 'signing_in';

export type AuthTimingMark =
  | 'cta_tap'
  | 'signin_call'
  | 'chooser_or_native_response'
  | 'result_returned'
  | 'session_committed'
  | 'onboarding_rendered';

/** Internal latency marks — never log tokens or PII. */
export function logAuthTiming(mark: AuthTimingMark, meta?: Record<string, string | number | boolean>): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.info('[auth-timing]', mark, meta ?? {});
  }
}

let googleConfiguredOnce = false;

function loadGoogleSigninModule(): {
  GoogleSignin: {
    configure: (opts: Record<string, unknown>) => void;
    hasPlayServices: (opts: { showPlayServicesUpdateDialog: boolean }) => Promise<boolean>;
    signIn: () => Promise<{
      type?: string;
      data?: {
        user?: {
          id?: string;
          email?: string | null;
          name?: string | null;
          photo?: string | null;
        };
        idToken?: string | null;
      };
      user?: {
        id?: string;
        email?: string | null;
        name?: string | null;
        photo?: string | null;
      };
    }>;
    getTokens?: () => Promise<{ idToken?: string | null; accessToken?: string | null }>;
  };
  statusCodes: {
    SIGN_IN_CANCELLED?: string;
    IN_PROGRESS?: string;
    PLAY_SERVICES_NOT_AVAILABLE?: string;
  };
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-google-signin/google-signin') as {
      GoogleSignin: {
        configure: (opts: Record<string, unknown>) => void;
        hasPlayServices: (opts: { showPlayServicesUpdateDialog: boolean }) => Promise<boolean>;
        signIn: () => Promise<{
          type?: string;
          data?: {
            user?: {
              id?: string;
              email?: string | null;
              name?: string | null;
              photo?: string | null;
            };
            idToken?: string | null;
          };
          user?: {
            id?: string;
            email?: string | null;
            name?: string | null;
            photo?: string | null;
          };
        }>;
        getTokens?: () => Promise<{ idToken?: string | null; accessToken?: string | null }>;
      };
      statusCodes: {
        SIGN_IN_CANCELLED?: string;
        IN_PROGRESS?: string;
        PLAY_SERVICES_NOT_AVAILABLE?: string;
      };
    };
  } catch {
    return null;
  }
}

/** Warm Google Sign-In configure + Play Services check before the CTA tap. */
export async function warmGoogleSignIn(): Promise<void> {
  if (!googleConfigured()) return;
  const mod = loadGoogleSigninModule();
  if (!mod) return;
  const { GoogleSignin } = mod;
  const extra = authExtra();
  try {
    if (!googleConfiguredOnce) {
      GoogleSignin.configure({
        webClientId: extra.googleWebClientId,
        iosClientId: extra.googleIosClientId || undefined,
        offlineAccess: false,
        forceCodeForRefreshToken: false,
      });
      googleConfiguredOnce = true;
    }
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false });
    }
  } catch {
    // Warming is best-effort — sign-in path still handles failures.
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(Object.assign(new Error('AUTH_TIMEOUT'), { code: 'AUTH_TIMEOUT' }));
    }, ms);
    void promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export const AUTH_EMAIL_PENDING_MESSAGE =
  'Email sign-in isn’t available yet. Continue without an account for now.';

/** Flip only when a secure session verifier backend is live. */
export const AUTH_BACKEND_CONNECTED = false;

type AuthExtra = {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

let authExtraOverrideForTests: AuthExtra | null = null;

function normalizeClientId(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function authExtra(): AuthExtra {
  if (authExtraOverrideForTests) return { ...authExtraOverrideForTests };
  const extra = (Constants.expoConfig?.extra ?? {}) as AuthExtra;
  return {
    googleWebClientId: normalizeClientId(
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? extra.googleWebClientId,
    ),
    googleIosClientId: normalizeClientId(
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? extra.googleIosClientId,
    ),
    googleAndroidClientId: normalizeClientId(
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? extra.googleAndroidClientId,
    ),
  };
}

/**
 * Android requires BOTH:
 * - Web client ID → GoogleSignin `webClientId` / idToken exchange
 * - Android client ID → package + signing SHA registered in Google Cloud
 * Never treat the Web client ID as the Android client ID.
 */
export function googleConfigured(): boolean {
  const extra = authExtra();
  const web = extra.googleWebClientId;
  const android = extra.googleAndroidClientId;
  if (Platform.OS === 'ios') {
    return Boolean(extra.googleIosClientId || web);
  }
  if (!web || !android) return false;
  // Distinct client IDs — substituting Web for Android is a configuration error.
  if (web === android) return false;
  return true;
}

/** Test-only injection for Google client ID availability checks. */
export function setGoogleAuthExtraForTests(extra: AuthExtra | null): void {
  authExtraOverrideForTests = extra;
}

export function getGoogleAuthClientIdsForDiagnostics(): {
  hasWebClientId: boolean;
  hasAndroidClientId: boolean;
  hasIosClientId: boolean;
} {
  const extra = authExtra();
  return {
    hasWebClientId: Boolean(extra.googleWebClientId),
    hasAndroidClientId: Boolean(extra.googleAndroidClientId),
    hasIosClientId: Boolean(extra.googleIosClientId),
  };
}

export function shouldShowAccountPreviewCopy(variant?: string): boolean {
  const resolved =
    variant ??
    (Constants.expoConfig?.extra?.appVariant as string | undefined) ??
    process.env.APP_VARIANT ??
    'development';
  return !isStandaloneBuild(resolved as AppVariant) || resolved === 'preview' || resolved === 'development';
}

async function persistSession(session: AuthSession | null): Promise<void> {
  if (!session) {
    await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

async function readSession(): Promise<AuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.userId || !parsed?.provider) return null;
    return {
      ...parsed,
      photoUrl: parsed.photoUrl ?? null,
    };
  } catch {
    return null;
  }
}

export class ProductionAuthPort implements AuthPort {
  isProviderAvailable(provider: AuthProviderId): boolean {
    if (provider === 'google') return googleConfigured();
    if (provider === 'apple') return Platform.OS === 'ios';
    if (provider === 'email') return AUTH_BACKEND_CONNECTED;
    return false;
  }

  async getSession(): Promise<AuthSession | null> {
    return readSession();
  }

  async signIn(provider: AuthProviderId): Promise<AuthResult> {
    if (provider === 'google') return this.signInGoogle();
    if (provider === 'apple') return this.signInApple();
    if (provider === 'email') {
      return { ok: false, reason: 'not_configured', message: AUTH_EMAIL_PENDING_MESSAGE };
    }
    return { ok: false, reason: 'unavailable', message: AUTH_GENERIC_FAILURE_MESSAGE };
  }

  async signOut(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('@react-native-google-signin/google-signin') as {
        GoogleSignin?: { signOut?: () => Promise<void>; revokeAccess?: () => Promise<void> };
      };
      await mod.GoogleSignin?.signOut?.();
    } catch {
      // Module or session may be absent.
    }
    await persistSession(null);
  }

  private async signInGoogle(): Promise<AuthResult> {
    if (!googleConfigured()) {
      return { ok: false, reason: 'not_configured', message: AUTH_GENERIC_FAILURE_MESSAGE };
    }
    const startedAt = Date.now();
    logAuthTiming('signin_call', { t: 0 });
    try {
      const mod = loadGoogleSigninModule();
      if (!mod) {
        return { ok: false, reason: 'unavailable', message: AUTH_GENERIC_FAILURE_MESSAGE };
      }
      const { GoogleSignin, statusCodes } = mod;
      const extra = authExtra();
      // Web client ID is required by the library for idToken. Android package identity
      // is validated by Google against the separate Android OAuth client (SHA-1 + package).
      // Never pass the Android client ID as webClientId.
      if (!googleConfiguredOnce) {
        GoogleSignin.configure({
          webClientId: extra.googleWebClientId,
          iosClientId: extra.googleIosClientId || undefined,
          offlineAccess: false,
          forceCodeForRefreshToken: false,
        });
        googleConfiguredOnce = true;
      }
      if (Platform.OS === 'android') {
        try {
          // Prefer silent check — update dialog was already offered during warm if needed.
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        } catch {
          return { ok: false, reason: 'unavailable', message: AUTH_PLAY_SERVICES_MESSAGE };
        }
      }
      const response = await withTimeout(GoogleSignin.signIn(), AUTH_SIGNIN_TIMEOUT_MS);
      logAuthTiming('chooser_or_native_response', { ms: Date.now() - startedAt });
      if (response?.type === 'cancelled') {
        return { ok: false, reason: 'cancelled', message: AUTH_CANCELLED_MESSAGE };
      }
      const user = response?.data?.user ?? response?.user;
      if (!user?.id) {
        return { ok: false, reason: 'cancelled', message: AUTH_CANCELLED_MESSAGE };
      }
      logAuthTiming('result_returned', { ms: Date.now() - startedAt });
      // Tokens are not required for local identity commit — fetch after navigation.
      void GoogleSignin.getTokens?.().catch(() => {
        // Profile-only responses are still valid provider identities.
      });
      const session: AuthSession = {
        userId: `google:${user.id}`,
        email: user.email ?? null,
        displayName: user.name ?? null,
        photoUrl: user.photo ?? null,
        provider: 'google',
        backendLinked: AUTH_BACKEND_CONNECTED,
      };
      await persistSession(session);
      logAuthTiming('session_committed', { ms: Date.now() - startedAt });
      return { ok: true, ...session };
    } catch (error) {
      const code = String((error as { code?: string } | undefined)?.code ?? '');
      const message = String((error as { message?: string } | undefined)?.message ?? error ?? '');
      let cancelledCode = 'SIGN_IN_CANCELLED';
      let playServicesCode = 'PLAY_SERVICES_NOT_AVAILABLE';
      try {
        const codes = loadGoogleSigninModule()?.statusCodes;
        cancelledCode = codes?.SIGN_IN_CANCELLED ?? cancelledCode;
        playServicesCode = codes?.PLAY_SERVICES_NOT_AVAILABLE ?? playServicesCode;
      } catch {
        // keep defaults
      }
      if (code === 'AUTH_TIMEOUT' || /AUTH_TIMEOUT/i.test(message)) {
        return { ok: false, reason: 'failed', message: AUTH_SLOW_MESSAGE };
      }
      if (code === cancelledCode || /cancel/i.test(code) || /cancel/i.test(message)) {
        return { ok: false, reason: 'cancelled', message: AUTH_CANCELLED_MESSAGE };
      }
      if (code === playServicesCode || /PLAY_SERVICES/i.test(code)) {
        return { ok: false, reason: 'unavailable', message: AUTH_PLAY_SERVICES_MESSAGE };
      }
      if (/NETWORK|network/i.test(code) || /network/i.test(message)) {
        return { ok: false, reason: 'network', message: AUTH_NETWORK_MESSAGE };
      }
      if (/DEVELOPER_ERROR|10\b/.test(code) || /DEVELOPER_ERROR/.test(message)) {
        return {
          ok: false,
          reason: 'failed',
          message: AUTH_GENERIC_FAILURE_MESSAGE,
        };
      }
      if (/no.*account|ACCOUNT/i.test(message)) {
        return { ok: false, reason: 'unavailable', message: AUTH_NO_ACCOUNT_MESSAGE };
      }
      return {
        ok: false,
        reason: 'failed',
        message: AUTH_GENERIC_FAILURE_MESSAGE,
      };
    }
  }

  private async signInApple(): Promise<AuthResult> {
    if (Platform.OS !== 'ios') {
      return { ok: false, reason: 'unavailable', message: 'Apple Sign In is available on iPhone and iPad.' };
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const AppleAuthentication = require('expo-apple-authentication') as typeof import('expo-apple-authentication');
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        return { ok: false, reason: 'unavailable', message: 'Apple Sign In isn’t available on this device.' };
      }
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.user) {
        return { ok: false, reason: 'cancelled', message: AUTH_CANCELLED_MESSAGE };
      }
      const displayName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const session: AuthSession = {
        userId: `apple:${credential.user}`,
        email: credential.email ?? null,
        displayName: displayName || null,
        photoUrl: null,
        provider: 'apple',
        backendLinked: AUTH_BACKEND_CONNECTED,
      };
      await persistSession(session);
      return { ok: true, ...session };
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED') {
        return { ok: false, reason: 'cancelled', message: AUTH_CANCELLED_MESSAGE };
      }
      return { ok: false, reason: 'failed', message: AUTH_GENERIC_FAILURE_MESSAGE };
    }
  }
}

/** @deprecated name kept for tests — production port is default. */
export const AUTH_AVAILABLE = true;

let injectedPort: AuthPort | null = null;
const defaultPort = new ProductionAuthPort();

export function setAuthPortForTests(port: AuthPort | null): void {
  injectedPort = port;
}

export function getAuthPort(): AuthPort {
  return injectedPort ?? defaultPort;
}

export function isAuthConfigured(): boolean {
  const port = getAuthPort();
  return port.isProviderAvailable('google') || port.isProviderAvailable('apple') || port.isProviderAvailable('email');
}

export async function clearAuthSessionForTests(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}
