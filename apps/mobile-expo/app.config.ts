/**
 * Dynamic Expo config — APP_VARIANT selects dev-client vs standalone preview/production.
 * Set via EAS build profile env (development | preview | production).
 *
 * 0.1.6 — full first-launch onboarding, Google/Apple auth modules, RevenueCat billing port.
 * Keep this file free of TypeScript type annotations — Expo evaluates it as JS on CI.
 * Standalone preview/production exclude expo-dev-client via eas-build-pre-install.
 */

const EAS_PROJECT_ID = 'c61d0a3c-ba3d-40e1-9764-5118fa2429f3';
/**
 * APP_VARIANT must be set for both EAS *builds* (eas.json env) and EAS *updates*
 * (`APP_VARIANT=preview npm run update:preview`). Defaulting to `development`
 * during `eas update` embeds updates.enabled=false and appVariant=development
 * into the OTA, which breaks standalone UpdateProvider detection on devices.
 */
const APP_VARIANT = process.env.APP_VARIANT ?? 'development';
const IS_DEV_CLIENT = APP_VARIANT === 'development';
const DEV_CLIENT_NATIVE_PACKAGES = [
  'expo-dev-client',
  'expo-dev-launcher',
  'expo-dev-menu',
  'expo-dev-menu-interface',
];
const DEV_CLIENT_AUTOLINKING_EXCLUDE =
  APP_VARIANT === 'development' ? [] : DEV_CLIENT_NATIVE_PACKAGES;
/** Embedded in Profile → About. EAS Build sets EAS_BUILD_GIT_COMMIT_HASH. */
const GIT_COMMIT_HASH =
  process.env.EAS_BUILD_GIT_COMMIT_HASH ??
  process.env.EXPO_PUBLIC_GIT_COMMIT_HASH ??
  process.env.GITHUB_SHA ??
  'unknown';

const config = {
  name: 'MileRecover',
  slug: 'milerecover',
  owner: 'milerecover',
  scheme: 'milerecover',
  version: '0.2.13',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  ios: {
    bundleIdentifier: 'com.milerecover.app',
    supportsTablet: true,
    usesAppleSignIn: true,
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
    allowBackup: false,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#E5F5EC',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
    ],
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      },
    },
  },
  plugins: [
    ...(IS_DEV_CLIENT ? ['expo-dev-client'] : []),
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 24,
          // Extract .so files on install — more compatible with Samsung PackageInstaller
          // sideload ("Preparing app…") than uncompressed-in-APK packing alone.
          useLegacyPackaging: true,
        },
      },
    ],
    '@react-native-community/datetimepicker',
    'expo-sharing',
    'expo-web-browser',
    'expo-apple-authentication',
    [
      'expo-notifications',
      {
        color: '#1F8A5B',
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
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME ?? 'com.googleusercontent.apps.placeholder',
      },
    ],
  ],
  // Explicit runtime — isolates 0.2.13 from prior 0.2.12 product OTA/runtime.
  runtimeVersion: '0.2.13',
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    // Standalone preview/production binaries keep updates enabled.
    // Dev-client builds set APP_VARIANT=development and disable OTA intentionally.
    // Channel headers are embedded by the EAS build profile (eas.json → expo-channel-name).
    enabled: !IS_DEV_CLIENT,
    // CRITICAL: NEVER on native startup. ON_LOAD blocked React Native until the remote
    // update check finished/failed (DNS/network), which caused 15–32s delayed first paint
    // and open-and-close behavior on Samsung. JS checks run after first screen via UpdateProvider.
    checkAutomatically: 'NEVER',
    fallbackToCacheTimeout: 0,
  },
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
    appVariant: APP_VARIANT,
    gitCommitHash: GIT_COMMIT_HASH,
    buildTimestamp:
      process.env.EAS_BUILD_CREATED_AT ??
      process.env.EXPO_PUBLIC_BUILD_TIMESTAMP ??
      new Date().toISOString(),
    runtimeVersion: '0.2.13',
    updateChannel: process.env.EAS_BUILD_PROFILE === 'preview' || process.env.APP_VARIANT === 'preview'
      ? 'preview-foundation-0.2.13'
      : process.env.APP_VARIANT === 'production'
        ? 'production'
        : 'development',
    /** Mirrored for diagnostics — applied on EAS via eas-build-pre-install. */
    devClientAutolinkingExclude: DEV_CLIENT_AUTOLINKING_EXCLUDE,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
    /** Google Maps SDK key for native route maps (Android/iOS). Empty = polyline fallback. */
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    revenueCatAppleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ?? '',
    revenueCatGoogleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ?? '',
    /** Production flips this when store products + RevenueCat keys are live. */
    enableStorePurchases: process.env.EXPO_PUBLIC_ENABLE_STORE_PURCHASES === '1',
  },
};

export default config;
