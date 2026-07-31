#!/usr/bin/env node
/**
 * Prototype C — Node benchmark harness (simulation layer).
 * Measures in-memory buffer insert/fetch/ack semantics in Node.
 * NOT mobile bridge performance — device results are pending.
 */
import { performance } from 'node:perf_hooks';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'output');

function createEvent(i, sessionId = 'bench-session') {
  return {
    eventId: `evt-bench-${i}`,
    schemaVersion: 1,
    eventType: 'location_evidence',
    sessionId,
    sequenceNumber: i,
    sourcePlatform: 'unknown',
    sourceComponent: 'harness',
    wallClockTimestamp: Date.now(),
    elapsedRealtimeMs: i,
    persistenceTimestamp: Date.now(),
    payload: { synthetic: true, gridStep: i },
    diagnosticMetadata: { synthetic: 'true' },
    deliveryAttemptCount: 0,
    acknowledgmentState: 'pending',
  };
}

class NodeBuffer {
  constructor() {
    this.events = new Map();
    this.duplicates = 0;
  }

  insert(raw) {
    const key = `${raw.sessionId}:${raw.sequenceNumber}`;
    for (const e of this.events.values()) {
      if (`${e.sessionId}:${e.sequenceNumber}` === key) {
        this.duplicates++;
        return 'duplicate_rejected';
      }
    }
    this.events.set(raw.eventId, { ...raw, acknowledgmentState: 'pending' });
    return 'inserted';
  }

  fetch(limit) {
    return [...this.events.values()]
      .filter((e) => e.acknowledgmentState === 'pending')
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .slice(0, limit)
      .map((e) => {
        const updated = {
          ...e,
          acknowledgmentState: 'delivered',
          deliveryAttemptCount: e.deliveryAttemptCount + 1,
        };
        this.events.set(e.eventId, updated);
        return updated;
      });
  }

  ack(ids) {
    for (const id of ids) {
      const e = this.events.get(id);
      if (e) this.events.set(id, { ...e, acknowledgmentState: 'acknowledged' });
    }
  }
}

const BATCH_SIZES = [1, 10, 100, 500, 1000, 5000];
const results = {
  measuredAt: new Date().toISOString(),
  environment: 'node-harness-simulation',
  status: 'measured',
  disclaimer:
    'In-memory Node simulation only. Android/iOS bridge timings require device/emulator runs.',
  batches: [],
};

for (const size of BATCH_SIZES) {
  const buffer = new NodeBuffer();
  const handlerKeys = new Set();

  const persistStart = performance.now();
  for (let i = 1; i <= size; i++) buffer.insert(createEvent(i));
  const persistMs = performance.now() - persistStart;

  const fetchStart = performance.now();
  const batch = buffer.fetch(size);
  const fetchMs = performance.now() - fetchStart;

  const validateStart = performance.now();
  const ackIds = [];
  for (const raw of batch) {
    const k = `${raw.sessionId}:${raw.sequenceNumber}`;
    if (!handlerKeys.has(k)) handlerKeys.add(k);
    ackIds.push(raw.eventId);
  }
  const validateMs = performance.now() - validateStart;

  const ackStart = performance.now();
  buffer.ack(ackIds);
  const ackMs = performance.now() - ackStart;

  results.batches.push({
    batchSize: size,
    persistMs,
    fetchMs,
    validateMs,
    ackMs,
    roundTripMs: persistMs + fetchMs + validateMs + ackMs,
  });
}

mkdirSync(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, 'harness-benchmark.json');
writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
