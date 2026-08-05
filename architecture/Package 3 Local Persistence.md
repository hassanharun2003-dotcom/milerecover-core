# Package 3 Local Persistence

## Purpose

Increment 2 introduces durable local storage for the Package 3 mobile shell behind a **storage-neutral** domain contract. UI and domain logic never import AsyncStorage, SQLite, or other vendor APIs directly.

## Technology choice

| Option | Decision |
|--------|----------|
| **AsyncStorage** (`@react-native-async-storage/async-storage`) | **Selected** for Increment 2 |
| SQLite / Room / sql.js | Deferred — structured relational queries not required for a single versioned JSON document |
| MMKV | Deferred — faster key-value store, but adds another native module without current need |
| Heavy DB frameworks | Rejected — oversize for shell-only state volume |

### Rationale

- Package 3 Increment 2 persists one versioned JSON document (onboarding, permissions snapshot, trips, recovery candidates, reporting preferences).
- AsyncStorage is the smallest cross-platform RN 0.76.5 dependency with broad CI support.
- Writes use primary + backup keys for best-effort atomicity (write backup, then primary).
- Domain tests use an in-memory adapter implementing the same `PersistenceRepository` contract.

## Encryption limitations (honest)

- **Not encrypted at rest** in Increment 2 beyond OS-level device protections (Android/iOS sandbox).
- No custom encryption layer is claimed or implemented.
- Future sensitive trip/location storage should migrate to platform-backed secure storage (Keychain / EncryptedSharedPreferences / SQLCipher) via a new adapter — see upgrade path below.

## Schema

- **Current version:** `1` (`CURRENT_PERSISTENCE_SCHEMA_VERSION`)
- **Document:** `PersistedAppDocumentV1` in `packages/domain/src/persistence/schema.ts`
- **Stored fields:** onboarding, permissions snapshot, tracking engine metadata, trips, recovery candidates, reporting period, mileage rate preference, save/load metadata
- **Explicitly not stored:** raw coordinates, route geometry, analytics IDs, cloud tokens

## Migration policy

- Unknown future schema versions → `migration-failed` startup phase (no crash).
- Legacy v0 fixtures (no `schemaVersion`) migrate to v1 in `migratePersistedPayload`.
- Corrupt JSON → `corrupt-recovered` with empty safe document when possible.

## Failure behavior

| Outcome | Startup phase |
|---------|----------------|
| No data | `ready-empty` |
| Valid data | `ready-with-data` |
| Legacy v0 | migrated → ready |
| Future schema | `migration-failed` |
| Corrupt JSON | `corrupt-recovered` |
| I/O error | `unavailable` (retry offered) |
| Unrecoverable corrupt | `safe-reset-required` |

## Upgrade path (deferred)

1. Introduce `PersistenceRepository` secure adapter for location/trip payloads.
2. Split shell document from trip evidence store when bridge promotion begins (Increment 3+).
3. Add encryption only with platform APIs and explicit tests — no marketing claims before proof.

## Android / iOS differences

- Both use the same JS adapter and domain contract.
- AsyncStorage maps to platform-native backing stores automatically.
- Clearing app data (Settings → Apps → MileRecover → Clear storage) removes AsyncStorage keys and restores first-launch onboarding.

## Keys (production adapter)

- Primary: `@milerecover/app-state/v1`
- Backup: `@milerecover/app-state-backup/v1`
