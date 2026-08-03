/**
 * Dynamic Expo config — APP_VARIANT selects dev-client vs standalone preview/production.
 * Set via EAS build profile env (development | preview | production).
 *
 * Production MVP: version/runtime 0.1.4 adds datetime picker and production MVP UI.
 * Keep this file free of TypeScript type annotations — Expo evaluates it as JS on CI.
 * Standalone preview/production exclude expo-dev-client via eas-build-pre-install.
 */

const EAS_PROJECT_ID = 'c61d0a3c-ba3d-40e1-9764-5118fa2429f3';
const APP_VARIANT = process.env.APP_VARIANT ?? 'development';
const IS_DEV_CLIENT = APP_VARIANT === 'development';
const DEV_CLIENT_AUTOLINKING_EXCLUDE =
  APP_VARIANT === 'development' ? [] : ['expo-dev-client'];

const config = {
  name: 'MileRecover',
  slug: 'milerecover',
  owner: 'milerecover',
  scheme: 'milerecover',
  version: '0.1.4',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FAFAF8',
  },
  ios: {
    bundleIdentifier: 'com.milerecover.app',
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'MileRecover uses your location while you use the app to help protect work drives when automatic capture is available.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'MileRecover can use background location to protect work drives when you enable protection. You can change this anytime in Settings.',
      UIBackgroundModes: ['location'],
    },
  },
  android: {
    package: 'com.milerecover.app',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#E8F3ED',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
    ],
  },
  plugins: [
    ...(IS_DEV_CLIENT ? ['expo-dev-client'] : []),
    '@react-native-community/datetimepicker',
    'expo-sharing',
    [
      'expo-notifications',
      {
        color: '#1F4D36',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow MileRecover to use your location to protect work drives when automatic capture is available.',
        locationWhenInUsePermission:
          'Allow MileRecover to use your location while you use the app to protect work drives.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
  ],
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    enabled: !IS_DEV_CLIENT,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
    appVariant: APP_VARIANT,
    /** Mirrored for diagnostics — applied on EAS via eas-build-pre-install. */
    devClientAutolinkingExclude: DEV_CLIENT_AUTOLINKING_EXCLUDE,
  },
};

export default config;
