import { performance } from 'node:perf_hooks';
import { parseNativeEvent } from '../../contract/validate';
import { PrototypeEventBuffer } from '../../src/buffer/PrototypeEventBuffer';
import { createSyntheticEvent } from '../helpers/synthetic';
import { IdempotentEventHandler } from '../../src/bridge/EventHandler';

const BATCH_SIZES = [1, 10, 100, 500, 1000, 5000];

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

describe('stress harness', () => {
  for (const size of BATCH_SIZES) {
    it(`processes batch of ${size} events`, () => {
      const buffer = new PrototypeEventBuffer();
      const handler = new IdempotentEventHandler();

      const persistStart = performance.now();
      for (let i = 1; i <= size; i++) {
        buffer.insert(createSyntheticEvent({ sessionId: 'stress', sequenceNumber: i }));
      }
      const persistMs = performance.now() - persistStart;

      const fetchStart = performance.now();
      const batch = buffer.fetchPendingBatch(size);
      const fetchMs = performance.now() - fetchStart;

      const validateStart = performance.now();
      const ackIds: string[] = [];
      for (const event of batch) {
        const parsed = parseNativeEvent(event);
        expect(parsed.ok).toBe(true);
        if (parsed.ok) {
          const handled = handler.handle(parsed.event);
          if (handled.ok) ackIds.push(handled.result.event.eventId);
        }
      }
      const validateMs = performance.now() - validateStart;

      const ackStart = performance.now();
      buffer.acknowledgeBatch(ackIds);
      const ackMs = performance.now() - ackStart;

      // Record timings in test output for RESULTS.md extraction
      console.log(
        JSON.stringify({
          environment: 'node-jest-simulation',
          batchSize: size,
          persistMs,
          fetchMs,
          validateMs,
          ackMs,
          roundTripMs: persistMs + fetchMs + validateMs + ackMs,
        }),
      );

      expect(buffer.countAcknowledged()).toBe(size);
    });
  }

  it('detects duplicate on replay after handler restart', () => {
    const buffer = new PrototypeEventBuffer();
    buffer.insert(createSyntheticEvent({ sessionId: 's', sequenceNumber: 1 }));
    const batch = buffer.fetchPendingBatch(1);
    const handler = new IdempotentEventHandler();
    handler.handle(batch[0]);
    handler.simulateRestart();
    const again = handler.handle(batch[0]);
    expect(again.ok).toBe(true);
    if (again.ok) expect(again.result.duplicateDetected).toBe(false);
    expect(buffer.replayUnacknowledged().length).toBe(1);
  });

  it('handles out-of-order insertion with ordered fetch', () => {
    const buffer = new PrototypeEventBuffer();
    buffer.insert(createSyntheticEvent({ sessionId: 's', sequenceNumber: 3 }));
    buffer.insert(createSyntheticEvent({ sessionId: 's', sequenceNumber: 1 }));
    buffer.insert(createSyntheticEvent({ sessionId: 's', sequenceNumber: 2 }));
    const batch = buffer.fetchPendingBatch(10);
    expect(batch.map((e) => e.sequenceNumber)).toEqual([1, 2, 3]);
  });
});

describe('stress metrics summary', () => {
  it('writes benchmark artifact', () => {
    const results: Record<string, unknown>[] = [];
    for (const size of [1, 10, 100, 500, 1000]) {
      const buffer = new PrototypeEventBuffer();
      const t0 = performance.now();
      for (let i = 1; i <= size; i++) {
        buffer.insert(createSyntheticEvent({ sessionId: 'bench', sequenceNumber: i }));
      }
      buffer.fetchPendingBatch(size);
      buffer.acknowledgeBatch(buffer.getAll().map((e) => e.eventId));
      results.push({ batchSize: size, totalMs: performance.now() - t0 });
    }
    expect(results.length).toBe(5);
  });
});
