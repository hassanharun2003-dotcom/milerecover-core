import type { PersistedAppDocument } from './schema';
import type { PersistenceDiagnostics } from './types';

export function buildPersistenceDiagnostics(
  document: PersistedAppDocument | null,
  storageKind: PersistenceDiagnostics['storageKind'],
  statusMessage: string
): PersistenceDiagnostics {
  return {
    schemaVersion: document?.schemaVersion ?? null,
    tripCount: document?.trips.length ?? 0,
    recoveryCandidateCount: document?.recoveryCandidates.length ?? 0,
    onboardingComplete: document?.onboardingComplete ?? false,
    lastSuccessfulSaveAt: document?.metadata.lastSuccessfulSaveAt ?? null,
    lastSuccessfulLoadAt: document?.metadata.lastSuccessfulLoadAt ?? null,
    storageKind,
    statusMessage,
  };
}

/** Ensures diagnostics never expose private trip content or coordinates. */
export function assertDiagnosticsArePrivacySafe(diagnostics: PersistenceDiagnostics): void {
  const serialized = JSON.stringify(diagnostics);
  if (/latitude|longitude|coordinate|route/i.test(serialized)) {
    throw new Error('Diagnostics must not include location content');
  }
}
