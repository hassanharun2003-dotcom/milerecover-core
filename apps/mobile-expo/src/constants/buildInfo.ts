/** Visible in Profile → About. Bump APP_BUILD_LABEL when a new native preview APK is required. */
export const APP_BUILD_LABEL = '0.2.7-startup.3';

/**
 * Temporary Home-screen OTA verification string.
 * Leave empty for clean customer baselines. Diagnostics may still surface build markers.
 */
export const PREVIEW_CHANNEL_MARKER = '';

/** App store / runtime version — startup crash fix (isolated from 0.2.6). */
export const APP_VERSION = '0.2.7';

/**
 * Explicit Expo Updates runtime — MUST stay equal to APP_VERSION for this release.
 * Isolates this binary from any prior preview-channel OTA bundles.
 */
export const APP_RUNTIME_VERSION = '0.2.7';

/** Preview EAS channel for this startup-fix APK only. */
export const APP_UPDATE_CHANNEL = 'preview-foundation-0.2.7';

/** ISO timestamp stamped at native build time when EAS sets EAS_BUILD_*. */
export const APP_BUILD_TIMESTAMP =
  typeof process !== 'undefined' && process.env.EAS_BUILD_CREATED_AT
    ? process.env.EAS_BUILD_CREATED_AT
    : typeof process !== 'undefined' && process.env.EXPO_PUBLIC_BUILD_TIMESTAMP
      ? process.env.EXPO_PUBLIC_BUILD_TIMESTAMP
      : new Date().toISOString();

/** Android applicationId / iOS bundle identifier for MileRecover product builds. */
export const APP_PACKAGE_ID = 'com.milerecover.app';

export type AppVariant = 'development' | 'preview' | 'production';

export function isStandaloneBuild(variant: AppVariant | string | undefined): boolean {
  return variant === 'preview' || variant === 'production';
}

/** True when the Expo Updates channel is a standalone preview/production channel. */
export function isStandaloneUpdateChannel(channel: string | null | undefined): boolean {
  if (!channel) return false;
  return (
    channel === 'preview' ||
    channel === 'production' ||
    channel.startsWith('preview-foundation-') ||
    channel.startsWith('preview-')
  );
}

/** Dev-client native modules that must not ship in standalone preview/production APKs. */
export const DEV_CLIENT_NATIVE_PACKAGES = [
  'expo-dev-client',
  'expo-dev-launcher',
  'expo-dev-menu',
  'expo-dev-menu-interface',
] as const;

/** expo-dev-client modules must not be autolinked into standalone preview/production APKs. */
export function getDevClientAutolinkingExclude(
  variant: string = typeof process !== 'undefined' && process.env.APP_VARIANT
    ? process.env.APP_VARIANT
    : 'development',
): string[] {
  return variant === 'development' ? [] : [...DEV_CLIENT_NATIVE_PACKAGES];
}
