import Constants from 'expo-constants';
import { isStandaloneBuild, type AppVariant } from '../constants/buildInfo';

/**
 * Account / sign-in foundation
 * ----------------------------
 * MileRecover remains fully usable without an account (local-first).
 * Real Google / Apple / email auth is not configured in this preview build.
 * This port is the production boundary: inject a real AuthPort when backend
 * + store providers are ready. Never invent sessions or fake success.
 *
 * Still required before enabling AUTH_AVAILABLE:
 * - Secure token exchange / session verifier backend
 * - Google Sign-In (Android + iOS) client IDs
 * - Apple Sign-In (iOS) capability + service ID
 * - Email magic-link or passwordless provider
 * - Explicit consent before any future cloud sync of mileage
 */

export type AuthProviderId = 'google' | 'apple' | 'email';

export type AuthFailureReason =
  | 'unavailable'
  | 'cancelled'
  | 'network'
  | 'duplicate'
  | 'expired'
  | 'failed';

export type AuthResult =
  | {
      ok: true;
      userId: string;
      email: string | null;
      displayName: string | null;
      provider: AuthProviderId;
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
}

export interface AuthPort {
  isAvailable(): boolean;
  getSession(): Promise<AuthSession | null>;
  signIn(provider: AuthProviderId): Promise<AuthResult>;
  signOut(): Promise<void>;
}

export const AUTH_UNAVAILABLE_MESSAGE =
  'Account sync is coming in the release build. You can keep using MileRecover on this device without an account.';

/** Preview builds expose account UI as coming-soon; production hides it until AUTH_AVAILABLE. */
export function shouldShowAccountPreviewCopy(variant?: string): boolean {
  const resolved =
    variant ??
    (Constants.expoConfig?.extra?.appVariant as string | undefined) ??
    process.env.APP_VARIANT ??
    'development';
  return !isStandaloneBuild(resolved as AppVariant) || resolved === 'preview' || resolved === 'development';
}

/**
 * Flip only when a verified AuthPort is injected and store/backend config is live.
 * Keep false until then — buttons must not simulate login.
 */
export const AUTH_AVAILABLE = false;

class UnavailableAuthPort implements AuthPort {
  isAvailable(): boolean {
    return false;
  }

  async getSession(): Promise<AuthSession | null> {
    return null;
  }

  async signIn(_provider: AuthProviderId): Promise<AuthResult> {
    return {
      ok: false,
      reason: 'unavailable',
      message: AUTH_UNAVAILABLE_MESSAGE,
    };
  }

  async signOut(): Promise<void> {
    // No-op: no session exists in preview.
  }
}

let injectedPort: AuthPort | null = null;

export function setAuthPortForTests(port: AuthPort | null): void {
  injectedPort = port;
}

export function getAuthPort(): AuthPort {
  if (injectedPort) return injectedPort;
  return new UnavailableAuthPort();
}

export function isAuthConfigured(): boolean {
  return AUTH_AVAILABLE && getAuthPort().isAvailable();
}
