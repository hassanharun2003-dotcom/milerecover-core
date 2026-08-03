/**
 * Dynamic Expo config — APP_VARIANT selects dev-client vs standalone preview/production.
 * Set via EAS build profile env (development | preview | production).
 *
 * Verified Android preview upgrade: version/runtime 0.1.2, package com.milerecover.app.
 * Standalone preview/production builds exclude expo-dev-client from native autolinking
 * via `scripts/sync-dev-client-autolinking.cjs` (eas-build-pre-install).
 */

const EAS_PROJECT_ID = 'c61d0a3c-ba3d-40e1-9764-5118fa2429f3';
const APP_VARIANT = process.env.APP_VARIANT ?? 'development';
const IS_DEV_CLIENT = APP_VARIANT === 'development';

/** expo-dev-client must not be autolinked into standalone preview/production APKs. */
export function getDevClientAutolinkingExclude(
  variant: string = process.env.APP_VARIANT ?? 'development',
): string[] {
  return variant === 'development' ? [] : ['expo-dev-client'];
}

const devClientAutolinkingExclude = getDevClientAutolinkingExclude(APP_VARIANT);

const config = {
  name: 'MileRecover',
  slug: 'milerecover',
  owner: 'milerecover',
  scheme: 'milerecover',
  version: '0.1.2',
  orientation: 'portrait' as const,
  userInterfaceStyle: 'light' as const,
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain' as const,
    backgroundColor: '#FAFAF8',
  },
  ios: {
    bundleIdentifier: 'com.milerecover.app',
    supportsTablet: true,
  },
  android: {
    package: 'com.milerecover.app',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#E8F3ED',
    },
  },
  plugins: IS_DEV_CLIENT ? ['expo-dev-client'] : [],
  runtimeVersion: {
    policy: 'appVersion' as const,
  },
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    enabled: !IS_DEV_CLIENT,
    checkAutomatically: 'ON_LOAD' as const,
    fallbackToCacheTimeout: 0,
  },
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
    appVariant: APP_VARIANT,
    /** Mirrored for tests / diagnostics — applied on EAS via eas-build-pre-install. */
    devClientAutolinkingExclude,
  },
};

export default config;
