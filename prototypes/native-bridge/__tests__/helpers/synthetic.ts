import { randomUUID } from 'node:crypto';
import { SYNTHETIC_GRID_ORIGIN } from '../../contract/constants';
import type { NativeEventEnvelope } from '../../contract/types';

export function createSyntheticEvent(
  overrides: Partial<NativeEventEnvelope> & {
    sessionId: string;
    sequenceNumber: number;
  },
): NativeEventEnvelope {
  const now = Date.now();
  const lat = SYNTHETIC_GRID_ORIGIN.lat + overrides.sequenceNumber * 0.0001;
  const lng = SYNTHETIC_GRID_ORIGIN.lng + overrides.sequenceNumber * 0.0001;
  return {
    eventId: overrides.eventId ?? randomUUID(),
    schemaVersion: overrides.schemaVersion ?? 1,
    eventType: overrides.eventType ?? 'location_evidence',
    sessionId: overrides.sessionId,
    sequenceNumber: overrides.sequenceNumber,
    sourcePlatform: overrides.sourcePlatform ?? 'unknown',
    sourceComponent: overrides.sourceComponent ?? 'jest',
    wallClockTimestamp: overrides.wallClockTimestamp ?? now,
    elapsedRealtimeMs: overrides.elapsedRealtimeMs ?? now % 1_000_000,
    persistenceTimestamp: overrides.persistenceTimestamp ?? now,
    payload: overrides.payload ?? { synthetic: true, latitude: lat, longitude: lng },
    diagnosticMetadata: overrides.diagnosticMetadata ?? { synthetic: 'true' },
    deliveryAttemptCount: overrides.deliveryAttemptCount ?? 0,
    acknowledgmentState: overrides.acknowledgmentState ?? 'pending',
  };
}
