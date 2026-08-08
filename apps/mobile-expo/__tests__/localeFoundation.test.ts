import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  formatCurrencyCents,
  formatDistance,
  localeProfileFromCountry,
  rateForTimestamp,
} from '@milerecover/domain';
import { loadProductUiState, saveProductUiState } from '../src/product/persistence';
import { createInitialProductUiState, PRODUCT_UI_STORAGE_KEY } from '../src/product/types';

describe('Locale foundation persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('migrates missing localeProfile for existing users', async () => {
    const legacy = createInitialProductUiState() as Record<string, unknown>;
    delete legacy.localeProfile;
    await AsyncStorage.setItem(PRODUCT_UI_STORAGE_KEY, JSON.stringify(legacy));
    const loaded = await loadProductUiState();
    expect(loaded.localeProfile.countryCode).toBe('US');
    expect(loaded.localeProfile.rates.length).toBeGreaterThan(0);
  });

  it('keeps Other-country custom setup across save/load', async () => {
    const state = createInitialProductUiState();
    state.localeProfile = localeProfileFromCountry('OTHER', {
      distanceUnit: 'km',
      currencyCode: 'EUR',
      centsPerMile: 42,
      now: 1_700_000_000_000,
    });
    state.reimbursementCentsPerMile = 42;
    await saveProductUiState(state);
    const loaded = await loadProductUiState();
    expect(loaded.localeProfile.countryCode).toBe('OTHER');
    expect(loaded.localeProfile.distanceUnit).toBe('km');
    expect(loaded.localeProfile.currencyCode).toBe('EUR');
    expect(rateForTimestamp(loaded.localeProfile.rates, 1_700_000_000_100)?.centsPerMile).toBe(42);
  });

  it('formats display units from shared helpers', () => {
    expect(formatDistance(10, 'km', 'en-CA')).toMatch(/16\.1 km/);
    expect(formatCurrencyCents(700, 'USD', 'en-US')).toMatch(/\$7\.00/);
  });
});
