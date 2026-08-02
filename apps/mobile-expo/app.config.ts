const config = {
  name: 'MileRecover',
  slug: 'milerecover',
  owner: 'milerecover',
  scheme: 'milerecover',
  version: '0.1.0-expo-foundation',
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
  plugins: ['expo-dev-client'],
  extra: {
    eas: {
      projectId: 'c61d0a3c-ba3d-40e1-9764-5118fa2429f3',
    },
  },
};

export default config;
