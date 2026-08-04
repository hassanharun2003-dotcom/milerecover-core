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

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'undetermined', canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'denied', canAskAgain: true })),
  scheduleNotificationAsync: jest.fn(async () => 'mock-id'),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('DateTimePicker'),
  };
});

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskDefined: jest.fn(() => false),
  isAvailableAsync: jest.fn(async () => false),
}));

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'undetermined', canAskAgain: true })),
  getBackgroundPermissionsAsync: jest.fn(async () => ({ status: 'undetermined', canAskAgain: true })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'denied', canAskAgain: true })),
  requestBackgroundPermissionsAsync: jest.fn(async () => ({ status: 'denied', canAskAgain: true })),
  watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
  hasStartedLocationUpdatesAsync: jest.fn(async () => false),
  startLocationUpdatesAsync: jest.fn(async () => undefined),
  stopLocationUpdatesAsync: jest.fn(async () => undefined),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({ data: { user: { id: 'g1', email: 'a@b.c', name: 'A' } } })),
    signOut: jest.fn(async () => undefined),
  },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', IN_PROGRESS: 'IN_PROGRESS' },
}));

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(async () => false),
  signInAsync: jest.fn(async () => ({ user: 'apple1', email: null, fullName: null })),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getOfferings: jest.fn(async () => ({ current: { availablePackages: [] } })),
    purchaseProduct: jest.fn(async () => ({ customerInfo: { entitlements: { active: {} } } })),
    restorePurchases: jest.fn(async () => ({ entitlements: { active: {} } })),
    getCustomerInfo: jest.fn(async () => ({ entitlements: { active: {} } })),
  },
}));
