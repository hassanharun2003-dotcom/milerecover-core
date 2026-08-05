import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LOCAL_EXPERIENCE_STORAGE_KEYS,
  resetAppExperience,
} from '../src/services/dataPrivacy';

describe('resetAppExperience', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('clears every local product, app, tracking, auth, and manual-entry key', async () => {
    await Promise.all(
      LOCAL_EXPERIENCE_STORAGE_KEYS.map((key) => AsyncStorage.setItem(key, `value-for-${key}`)),
    );

    await resetAppExperience();

    await Promise.all(
      LOCAL_EXPERIENCE_STORAGE_KEYS.map(async (key) => {
        expect(await AsyncStorage.getItem(key)).toBeNull();
      }),
    );
  });
});
