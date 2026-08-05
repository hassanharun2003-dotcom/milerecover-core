import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createEmptyPersistedDocument,
  deserializePersistedPayload,
  serializePersistedDocument,
  type PersistedAppDocument,
  type PersistenceLoadOutcome,
  type PersistenceRepository,
  type PersistenceSaveOutcome,
} from '@milerecover/domain';

export const APP_STATE_STORAGE_KEY = '@milerecover/app-state/v1';
export const APP_STATE_BACKUP_STORAGE_KEY = '@milerecover/app-state-backup/v1';
export const APP_STATE_STORAGE_KEYS = [APP_STATE_STORAGE_KEY, APP_STATE_BACKUP_STORAGE_KEY] as const;

export class AsyncStoragePersistenceRepository implements PersistenceRepository {
  async load(): Promise<PersistenceLoadOutcome> {
    try {
      const primary = await AsyncStorage.getItem(APP_STATE_STORAGE_KEY);
      if (primary != null) {
        return deserializePersistedPayload(primary);
      }
      const backup = await AsyncStorage.getItem(APP_STATE_BACKUP_STORAGE_KEY);
      if (backup != null) {
        return deserializePersistedPayload(backup);
      }
      return { kind: 'empty' };
    } catch (error) {
      return {
        kind: 'error',
        message: error instanceof Error ? error.message : 'AsyncStorage read failed',
      };
    }
  }

  async save(document: PersistedAppDocument): Promise<PersistenceSaveOutcome> {
    try {
      const now = Date.now();
      const toSave: PersistedAppDocument = {
        ...document,
        savedAt: now,
        metadata: {
          ...document.metadata,
          lastSuccessfulSaveAt: now,
        },
      };
      const json = serializePersistedDocument(toSave);
      const existing = await AsyncStorage.getItem(APP_STATE_STORAGE_KEY);
      if (existing != null) {
        await AsyncStorage.setItem(APP_STATE_BACKUP_STORAGE_KEY, existing);
      }
      await AsyncStorage.setItem(APP_STATE_STORAGE_KEY, json);
      return { ok: true, savedAt: now };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'AsyncStorage write failed',
      };
    }
  }

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([...APP_STATE_STORAGE_KEYS]);
  }
}

export async function clearPackage3LocalStore(): Promise<void> {
  const repo = new AsyncStoragePersistenceRepository();
  await repo.clear();
}

export function createProductionPersistenceRepository(): PersistenceRepository {
  return new AsyncStoragePersistenceRepository();
}

export function createPreviewPersistenceRepository(): PersistenceRepository {
  return new AsyncStoragePersistenceRepository();
}

/** Ensures first launch uses empty document when keys are absent. */
export function emptyDocumentFallback(): PersistedAppDocument {
  return createEmptyPersistedDocument();
}
