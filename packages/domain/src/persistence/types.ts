import type { PersistedAppDocument } from './schema';

export type AppStartupPhase =
  | 'restoring'
  | 'ready-empty'
  | 'ready-with-data'
  | 'unavailable'
  | 'corrupt-recovered'
  | 'safe-reset-required'
  | 'migration-failed';

export type PersistenceLoadOutcome =
  | { kind: 'empty' }
  | { kind: 'loaded'; document: PersistedAppDocument; migratedFrom: number | null }
  | { kind: 'unsupported_schema'; foundVersion: number }
  | { kind: 'corrupt'; message: string; recoveredDocument: PersistedAppDocument | null }
  | { kind: 'error'; message: string };

export type PersistenceSaveOutcome =
  | { ok: true; savedAt: number }
  | { ok: false; message: string };

/** Storage-neutral contract — UI and domain depend on this, not AsyncStorage/SQLite. */
export interface PersistenceRepository {
  load(): Promise<PersistenceLoadOutcome>;
  save(document: PersistedAppDocument): Promise<PersistenceSaveOutcome>;
  clear(): Promise<void>;
}

export interface PersistenceDiagnostics {
  schemaVersion: number | null;
  tripCount: number;
  recoveryCandidateCount: number;
  onboardingComplete: boolean;
  lastSuccessfulSaveAt: number | null;
  lastSuccessfulLoadAt: number | null;
  storageKind: 'memory' | 'async-storage';
  /** Human-readable status only — never includes coordinates or trip notes. */
  statusMessage: string;
}
