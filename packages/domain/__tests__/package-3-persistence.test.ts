import { InMemoryPersistenceRepository } from '../src/persistence/adapters/memory';
import { applyRecoveryTransition } from '../src/recovery/transitions';
import { applyClassification, rejectTrip } from '../src/trips/types';
import {
  buildPersistenceDiagnostics,
  assertDiagnosticsArePrivacySafe,
  createEmptyPersistedDocument,
  documentFromAppSlice,
  resolveStartupFromLoad,
  serializePersistedDocument,
} from '../src/persistence';
import type { TripRecord, RecoveryCandidate } from '../src';

const NOW = 1_700_000_000_000;

function sampleTrip(overrides: Partial<TripRecord> = {}): TripRecord {
  return {
    id: 'trip-1',
    source: 'manual',
    status: 'pending',
    classification: 'unclassified',
    startAt: NOW - 3600_000,
    endAt: NOW - 1800_000,
    distanceMiles: 12.4,
    purpose: 'Client visit',
    notes: 'Private note should not appear in diagnostics',
    hasRouteCoordinates: true,
    confidence: 'medium',
    ...overrides,
  };
}

function sampleRecovery(overrides: Partial<RecoveryCandidate> = {}): RecoveryCandidate {
  return {
    id: 'recovery-1',
    state: 'detected',
    confidence: 'medium',
    evidence: [{ kind: 'gap', summary: 'Gap between known trips' }],
    proposedStartAt: NOW - 7200_000,
    proposedEndAt: NOW - 5400_000,
    proposedDistanceMiles: 8.2,
    plainLanguageExplanation: 'Possible unlogged drive',
    ...overrides,
  };
}

describe('Package 3 persistence', () => {
  it('empty first launch restores an empty snapshot', async () => {
    const repo = new InMemoryPersistenceRepository();
    const outcome = await repo.load();
    expect(outcome.kind).toBe('empty');
    const hydrated = resolveStartupFromLoad(outcome, NOW);
    expect(hydrated.startupPhase).toBe('ready-empty');
    expect(hydrated.document.trips).toEqual([]);
    expect(hydrated.document.onboardingComplete).toBe(false);
  });

  it('onboarding completion persists across store recreation', async () => {
    let json: string | null = null;
    const repoA = new InMemoryPersistenceRepository();
    const base = createEmptyPersistedDocument(NOW);
    const saved = await repoA.save({
      ...base,
      onboardingComplete: true,
      onboarding: { currentStep: 'ready_check', completedSteps: ['welcome', 'location_permission', 'motion_permission', 'ready_check'], skippedMotion: false },
    });
    expect(saved.ok).toBe(true);
    const loadedA = await repoA.load();
    if (loadedA.kind === 'loaded') json = serializePersistedDocument(loadedA.document);

    const repoB = new InMemoryPersistenceRepository(json);
    const loadedB = await repoB.load();
    expect(loadedB.kind).toBe('loaded');
    if (loadedB.kind === 'loaded') {
      expect(loadedB.document.onboardingComplete).toBe(true);
    }
  });

  it('a real test-created trip record persists and restores without changing fields', async () => {
    const repo = new InMemoryPersistenceRepository();
    const trip = sampleTrip();
    const doc = createEmptyPersistedDocument(NOW);
    await repo.save({ ...doc, trips: [trip] });
    const reloaded = await repo.load();
    expect(reloaded.kind).toBe('loaded');
    if (reloaded.kind === 'loaded') {
      expect(reloaded.document.trips[0]).toEqual(trip);
    }
  });

  it('review and recovery status transitions persist', async () => {
    const repo = new InMemoryPersistenceRepository();
    let candidate = sampleRecovery({ state: 'unresolved' });
    const transition = applyRecoveryTransition(candidate.state, 'user_confirm', candidate.confidence);
    expect(transition.ok).toBe(true);
    candidate = { ...candidate, state: transition.nextState! };
    await repo.save({ ...createEmptyPersistedDocument(NOW), recoveryCandidates: [candidate] });
    const loaded = await repo.load();
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(loaded.document.recoveryCandidates[0]?.state).toBe('user_confirmed');
    }
  });

  it('rejected items remain rejected after restoration', async () => {
    const repo = new InMemoryPersistenceRepository();
    const rejected = rejectTrip(sampleTrip());
    await repo.save({ ...createEmptyPersistedDocument(NOW), trips: [rejected] });
    const loaded = await repo.load();
    if (loaded.kind === 'loaded') {
      expect(loaded.document.trips[0]?.status).toBe('rejected');
    }
  });

  it('partial/corrected records retain provenance', async () => {
    const repo = new InMemoryPersistenceRepository();
    let candidate = sampleRecovery({ state: 'unresolved' });
    const corrected = applyRecoveryTransition(candidate.state, 'user_correct', candidate.confidence);
    expect(corrected.ok).toBe(true);
    candidate = { ...candidate, state: 'user_corrected' };
    await repo.save({ ...createEmptyPersistedDocument(NOW), recoveryCandidates: [candidate] });
    const loaded = await repo.load();
    if (loaded.kind === 'loaded') {
      expect(loaded.document.recoveryCandidates[0]?.state).toBe('user_corrected');
      expect(loaded.document.recoveryCandidates[0]?.evidence[0]?.kind).toBe('gap');
    }
  });

  it('schema version is recorded', async () => {
    const repo = new InMemoryPersistenceRepository();
    await repo.save(createEmptyPersistedDocument(NOW));
    const loaded = await repo.load();
    if (loaded.kind === 'loaded') {
      expect(loaded.document.schemaVersion).toBe(1);
    }
  });

  it('supported migration upgrades old fixture data correctly', async () => {
    const legacy = JSON.stringify({
      onboardingComplete: true,
      onboarding: { currentStep: 'ready_check', completedSteps: ['welcome'], skippedMotion: true },
      trips: [sampleTrip({ id: 'legacy-trip' })],
    });
    const repo = new InMemoryPersistenceRepository(legacy);
    const loaded = await repo.load();
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(loaded.migratedFrom).toBe(0);
      expect(loaded.document.schemaVersion).toBe(1);
      expect(loaded.document.trips[0]?.id).toBe('legacy-trip');
    }
  });

  it('unknown future schema versions fail safely', async () => {
    const future = JSON.stringify({ schemaVersion: 99, trips: [] });
    const repo = new InMemoryPersistenceRepository(future);
    const loaded = await repo.load();
    expect(loaded.kind).toBe('unsupported_schema');
    if (loaded.kind === 'unsupported_schema') {
      const hydrated = resolveStartupFromLoad(loaded, NOW);
      expect(hydrated.startupPhase).toBe('migration-failed');
    }
  });

  it('corrupt data does not crash migration — returns recoverable empty document', async () => {
    const repo = new InMemoryPersistenceRepository();
    repo.injectCorruptPrimary('{not-json');
    const loaded = await repo.load();
    expect(loaded.kind).toBe('corrupt');
    if (loaded.kind === 'corrupt') {
      expect(loaded.recoveredDocument).not.toBeNull();
      const hydrated = resolveStartupFromLoad(loaded, NOW);
      expect(['corrupt-recovered', 'safe-reset-required']).toContain(hydrated.startupPhase);
    }
  });

  it('persistence errors produce honest unavailable state', async () => {
    const hydrated = resolveStartupFromLoad({ kind: 'error', message: 'Storage read failed' }, NOW);
    expect(hydrated.startupPhase).toBe('unavailable');
    expect(hydrated.loadError).toMatch(/Storage read failed/);
  });

  it('clearing local store restores empty first-launch behavior', async () => {
    const repo = new InMemoryPersistenceRepository();
    await repo.save({ ...createEmptyPersistedDocument(NOW), trips: [sampleTrip()] });
    await repo.clear();
    const loaded = await repo.load();
    expect(loaded.kind).toBe('empty');
  });

  it('diagnostics omit raw coordinates and private trip content', async () => {
    const doc = createEmptyPersistedDocument(NOW);
    doc.trips = [sampleTrip()];
    const diagnostics = buildPersistenceDiagnostics(doc, 'memory', 'ok');
    assertDiagnosticsArePrivacySafe(diagnostics);
    const serialized = JSON.stringify(diagnostics);
    expect(serialized).not.toMatch(/Client visit/);
    expect(serialized).not.toMatch(/Private note/);
    expect(serialized).not.toMatch(/latitude|longitude/i);
  });

  it('in-memory adapter obeys the same contract as production mapping helpers', async () => {
    const repo = new InMemoryPersistenceRepository();
    const trip = applyClassification(sampleTrip(), 'business');
    const persisted = documentFromAppSlice({
      onboardingComplete: false,
      onboarding: createEmptyPersistedDocument(NOW).onboarding,
      permissions: createEmptyPersistedDocument(NOW).permissions,
      trackingEngineState: 'idle',
      lastConfirmedCaptureAt: null,
      lastSyncAt: null,
      trips: [trip],
      recoveryCandidates: [],
      reportingPeriod: createEmptyPersistedDocument(NOW).reportingPeriod,
      mileageRate: null,
      metadata: { lastSuccessfulSaveAt: null, lastSuccessfulLoadAt: null },
    });
    await repo.save(persisted);
    const loaded = await repo.load();
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(loaded.document.trips[0]?.classification).toBe('business');
    }
  });
});
