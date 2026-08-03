jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-updates', () => ({
  isEnabled: false,
  channel: 'preview',
  runtimeVersion: '0.1.0',
  updateId: null,
  createdAt: null,
  checkForUpdateAsync: jest.fn(async () => ({ isAvailable: false })),
  fetchUpdateAsync: jest.fn(async () => ({ isNew: false })),
  reloadAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '0.1.0',
      extra: { appVariant: 'preview', eas: { projectId: 'c61d0a3c-ba3d-40e1-9764-5118fa2429f3' } },
    },
  },
}));
