import { createEmptyPersistedDocument, type PersistedAppDocument } from '../schema';
import { deserializePersistedPayload, serializePersistedDocument } from '../migrations';
import type { PersistenceLoadOutcome, PersistenceRepository, PersistenceSaveOutcome } from '../types';

export class InMemoryPersistenceRepository implements PersistenceRepository {
  private primary: string | null = null;
  private backup: string | null = null;

  constructor(initialJson?: string | null) {
    if (initialJson != null) {
      this.primary = initialJson;
    }
  }

  async load(): Promise<PersistenceLoadOutcome> {
    const raw = this.primary ?? this.backup;
    if (raw == null) {
      return { kind: 'empty' };
    }
    const outcome = deserializePersistedPayload(raw);
    if (outcome.kind === 'loaded' || outcome.kind === 'empty') {
      return outcome;
    }
    if (outcome.kind === 'corrupt' && this.backup && this.backup !== this.primary) {
      const backupOutcome = deserializePersistedPayload(this.backup);
      if (backupOutcome.kind === 'loaded') {
        return backupOutcome;
      }
    }
    return outcome;
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
      this.backup = this.primary;
      this.primary = json;
      return { ok: true, savedAt: now };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Save failed' };
    }
  }

  async clear(): Promise<void> {
    this.primary = null;
    this.backup = null;
  }

  /** Test helper — inject corrupt bytes without valid JSON. */
  injectCorruptPrimary(payload: string): void {
    this.primary = payload;
  }

  /** Test helper — seed empty document directly. */
  seedEmpty(): void {
    this.primary = serializePersistedDocument(createEmptyPersistedDocument());
  }
}
