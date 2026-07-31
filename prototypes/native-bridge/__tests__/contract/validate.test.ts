import { parseNativeEvent, validateBatchSize, detectSequenceGap } from '../../contract/validate';
import { CONTRACT_MAJOR_VERSION, MAX_BATCH_SIZE } from '../../contract/constants';

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    eventId: 'evt-001',
    schemaVersion: 1,
    eventType: 'location_evidence',
    sessionId: 'sess-a',
    sequenceNumber: 1,
    sourcePlatform: 'android',
    sourceComponent: 'test',
    wallClockTimestamp: 1_700_000_000_000,
    elapsedRealtimeMs: 1000,
    persistenceTimestamp: 1_700_000_000_100,
    payload: { synthetic: true },
    diagnosticMetadata: { synthetic: 'true' },
    deliveryAttemptCount: 0,
    acknowledgmentState: 'pending',
    ...overrides,
  };
}

describe('contract validation', () => {
  it('parses valid event', () => {
    const result = parseNativeEvent(validEvent());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.eventId).toBe('evt-001');
    }
  });

  it('rejects missing required field', () => {
    const raw = validEvent();
    delete (raw as Record<string, unknown>).sessionId;
    const result = parseNativeEvent(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('malformed_event');
  });

  it('rejects unsupported major schema version', () => {
    const result = parseNativeEvent(validEvent({ schemaVersion: 200 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('unsupported_schema');
  });

  it('tolerates unknown optional payload fields', () => {
    const result = parseNativeEvent(
      validEvent({ payload: { synthetic: true, extraField: 'ok' } }),
    );
    expect(result.ok).toBe(true);
  });

  it('rejects malformed payload type', () => {
    const result = parseNativeEvent(validEvent({ payload: 'not-object' }));
    expect(result.ok).toBe(false);
  });

  it('validates batch size', () => {
    expect(validateBatchSize(10, MAX_BATCH_SIZE)).toBeNull();
    const bad = validateBatchSize(MAX_BATCH_SIZE + 1, MAX_BATCH_SIZE);
    expect(bad?.ok).toBe(false);
  });

  it('detects sequence gap', () => {
    const events = [
      parseNativeEvent(validEvent({ sequenceNumber: 1 })),
      parseNativeEvent(validEvent({ eventId: 'e2', sequenceNumber: 3 })),
    ];
    if (events[0].ok && events[1].ok) {
      expect(detectSequenceGap([events[0].event, events[1].event])).toBe(true);
    }
  });

  it('accepts unknown event type when envelope valid', () => {
    const result = parseNativeEvent(validEvent({ eventType: 'future_prototype_type' }));
    expect(result.ok).toBe(true);
  });

  it('contract major matches constant', () => {
    expect(CONTRACT_MAJOR_VERSION).toBe(1);
  });
});
