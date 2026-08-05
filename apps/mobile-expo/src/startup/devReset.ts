import { clearProductUiState } from '../product/persistence';

/**
 * Development / preview-only full first-launch reset.
 * Clears product UI storage. Callers must also clear app persistence.
 * Never expose this in production customer UI.
 */
export async function resetForFirstLaunchTest(): Promise<void> {
  await clearProductUiState();
}
