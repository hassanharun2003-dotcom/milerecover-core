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
 * - extra.googleWebClientId / googleIosClientId / googleAndroidClientId
 * - Apple capability on the iOS App ID
 * - Backend session verifier before AUTH_BACKEND_CONNECTED = true
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
  provider: AuthProviderId;
  backendLinked: boolean;
}

export interface AuthPort {
  isProviderAvailable(provider: AuthProviderId): boolean;
  getSession(): Promise<AuthSession | null>;
  signIn(provider: AuthProviderId): Promise<AuthResult>;
  signOut(): Promise<void>;
}

const SESSION_KEY = '@milerecover/auth-session/v1';

export const AUTH_UNAVAILABLE_MESSAGE =
  'Sign-in isn’t configured for this build yet. You can continue without an account — your miles stay on this device.';

export const AUTH_EMAIL_PENDING_MESSAGE =
  'Email sign-in needs the MileRecover account service. Continue without an account for now.';

/** Flip only when a secure session verifier backend is live. */
export const AUTH_BACKEND_CONNECTED = false;

type AuthExtra = {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

function authExtra(): AuthExtra {
  const extra = (Constants.expoConfig?.extra ?? {}) as AuthExtra;
  return {
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? extra.googleWebClientId,
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? extra.googleIosClientId,
    googleAndroidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? extra.googleAndroidClientId,
  };
}

function googleConfigured(): boolean {
  const extra = authExtra();
  if (Platform.OS === 'ios') return Boolean(extra.googleIosClientId || extra.googleWebClientId);
  return Boolean(extra.googleWebClientId || extra.googleAndroidClientId);
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
    await AsyncStorage.removeItem(SESSION_KEY);
    return;
  }
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function readSession(): Promise<AuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.userId || !parsed?.provider) return null;
    return parsed;
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
    return { ok: false, reason: 'unavailable', message: AUTH_UNAVAILABLE_MESSAGE };
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
      return { ok: false, reason: 'not_configured', message: AUTH_UNAVAILABLE_MESSAGE };
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin') as {
        GoogleSignin: {
          configure: (opts: Record<string, unknown>) => void;
          hasPlayServices: (opts: { showPlayServicesUpdateDialog: boolean }) => Promise<boolean>;
          signIn: () => Promise<{ data?: { user?: { id?: string; email?: string | null; name?: string | null } } } | { user?: { id?: string; email?: string | null; name?: string | null } }>;
        };
        statusCodes: { SIGN_IN_CANCELLED?: string; IN_PROGRESS?: string };
      };
      const extra = authExtra();
      GoogleSignin.configure({
        webClientId: extra.googleWebClientId,
        iosClientId: extra.googleIosClientId,
        offlineAccess: false,
      });
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      const response = await GoogleSignin.signIn();
      const user =
        (response as { data?: { user?: { id?: string; email?: string | null; name?: string | null } } }).data?.user ??
        (response as { user?: { id?: string; email?: string | null; name?: string | null } }).user;
      if (!user?.id) {
        return { ok: false, reason: 'cancelled', message: 'Sign-in was cancelled.' };
      }
      const session: AuthSession = {
        userId: `google:${user.id}`,
        email: user.email ?? null,
        displayName: user.name ?? null,
        provider: 'google',
        backendLinked: AUTH_BACKEND_CONNECTED,
      };
      await persistSession(session);
      return { ok: true, ...session };
    } catch (error) {
      const code = (error as { code?: string })?.code;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      let cancelledCode: string | undefined;
      try {
        cancelledCode = (
          require('@react-native-google-signin/google-signin') as { statusCodes?: { SIGN_IN_CANCELLED?: string } }
        ).statusCodes?.SIGN_IN_CANCELLED;
      } catch {
        cancelledCode = undefined;
      }
      if (code === cancelledCode || code === 'SIGN_IN_CANCELLED') {
        return { ok: false, reason: 'cancelled', message: 'Sign-in was cancelled.' };
      }
      return {
        ok: false,
        reason: 'failed',
        message: AUTH_UNAVAILABLE_MESSAGE,
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
        return { ok: false, reason: 'cancelled', message: 'Sign-in was cancelled.' };
      }
      const displayName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const session: AuthSession = {
        userId: `apple:${credential.user}`,
        email: credential.email ?? null,
        displayName: displayName || null,
        provider: 'apple',
        backendLinked: AUTH_BACKEND_CONNECTED,
      };
      await persistSession(session);
      return { ok: true, ...session };
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED') {
        return { ok: false, reason: 'cancelled', message: 'Sign-in was cancelled.' };
      }
      return { ok: false, reason: 'failed', message: AUTH_UNAVAILABLE_MESSAGE };
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
  await AsyncStorage.removeItem(SESSION_KEY);
}
