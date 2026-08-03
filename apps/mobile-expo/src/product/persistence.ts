import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createInitialProductUiState,
  PRODUCT_UI_STORAGE_KEY,
  type ProductUiState,
} from './types';

export async function loadProductUiState(): Promise<ProductUiState> {
  try {
    const raw = await AsyncStorage.getItem(PRODUCT_UI_STORAGE_KEY);
    if (!raw) return createInitialProductUiState();
    const parsed = JSON.parse(raw) as Partial<ProductUiState>;
    return { ...createInitialProductUiState(), ...parsed, showDevTools: __DEV__ };
  } catch {
    return createInitialProductUiState();
  }
}

export async function saveProductUiState(state: ProductUiState): Promise<void> {
  const { showDevTools: _dev, ...persistable } = state;
  await AsyncStorage.setItem(PRODUCT_UI_STORAGE_KEY, JSON.stringify(persistable));
}

export async function clearProductUiState(): Promise<void> {
  await AsyncStorage.removeItem(PRODUCT_UI_STORAGE_KEY);
}
