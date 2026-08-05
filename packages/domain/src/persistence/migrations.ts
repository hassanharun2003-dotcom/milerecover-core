import {
  createEmptyPersistedDocument,
  CURRENT_PERSISTENCE_SCHEMA_VERSION,
  SUPPORTED_PERSISTENCE_SCHEMA_VERSION,
  type PersistedAppDocument,
  type PersistedAppDocumentV1,
} from './schema';
import type { PersistenceLoadOutcome } from './types';

/** Fixture-only v0 shape used in migration tests. */
export interface PersistedAppDocumentV0 {
  schemaVersion?: undefined;
  onboardingComplete?: boolean;
  onboarding?: PersistedAppDocumentV1['onboarding'];
  trips?: PersistedAppDocumentV1['trips'];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function migrateV0ToV1(raw: PersistedAppDocumentV0, now: number): PersistedAppDocumentV1 {
  const base = createEmptyPersistedDocument(now);
  return {
    ...base,
    schemaVersion: 1,
    savedAt: now,
    onboardingComplete: raw.onboardingComplete ?? false,
    onboarding: raw.onboarding ?? base.onboarding,
    trips: raw.trips ?? [],
    metadata: {
      lastSuccessfulSaveAt: null,
      lastSuccessfulLoadAt: now,
    },
  };
}

function parseV1(raw: Record<string, unknown>): PersistedAppDocumentV1 | null {
  if (raw.schemaVersion !== 1) return null;
  const trips = Array.isArray(raw.trips) ? raw.trips : null;
  const recoveryCandidates = Array.isArray(raw.recoveryCandidates) ? raw.recoveryCandidates : null;
  const onboarding = raw.onboarding;
  const permissions = raw.permissions;
  const reportingPeriod = raw.reportingPeriod;
  if (!trips || !recoveryCandidates || !isRecord(onboarding) || !isRecord(permissions) || !isRecord(reportingPeriod)) {
    return null;
  }
  return raw as unknown as PersistedAppDocumentV1;
}

export function migratePersistedPayload(raw: unknown, now: number = Date.now()): PersistenceLoadOutcome {
  if (raw == null) {
    return { kind: 'empty' };
  }

  if (!isRecord(raw)) {
    return {
      kind: 'corrupt',
      message: 'Stored payload is not a JSON object',
      recoveredDocument: createEmptyPersistedDocument(now),
    };
  }

  const version = raw.schemaVersion;

  if (version === undefined) {
    const migrated = migrateV0ToV1(raw as PersistedAppDocumentV0, now);
    return { kind: 'loaded', document: migrated, migratedFrom: 0 };
  }

  if (typeof version !== 'number') {
    return {
      kind: 'corrupt',
      message: 'schemaVersion is not a number',
      recoveredDocument: createEmptyPersistedDocument(now),
    };
  }

  if (version > SUPPORTED_PERSISTENCE_SCHEMA_VERSION) {
    return { kind: 'unsupported_schema', foundVersion: version };
  }

  if (version === 0) {
    const migrated = migrateV0ToV1(raw as PersistedAppDocumentV0, now);
    return { kind: 'loaded', document: migrated, migratedFrom: 0 };
  }

  if (version === CURRENT_PERSISTENCE_SCHEMA_VERSION) {
    const parsed = parseV1(raw);
    if (!parsed) {
      return {
        kind: 'corrupt',
        message: 'Schema v1 payload failed validation',
        recoveredDocument: createEmptyPersistedDocument(now),
      };
    }
    return { kind: 'loaded', document: parsed, migratedFrom: null };
  }

  return { kind: 'unsupported_schema', foundVersion: version };
}

export function serializePersistedDocument(document: PersistedAppDocument): string {
  return JSON.stringify(document);
}

export function deserializePersistedPayload(json: string, now: number = Date.now()): PersistenceLoadOutcome {
  try {
    const parsed: unknown = JSON.parse(json);
    return migratePersistedPayload(parsed, now);
  } catch {
    return {
      kind: 'corrupt',
      message: 'JSON parse failed',
      recoveredDocument: createEmptyPersistedDocument(now),
    };
  }
}
