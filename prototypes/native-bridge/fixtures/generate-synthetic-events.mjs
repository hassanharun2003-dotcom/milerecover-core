#!/usr/bin/env node
/**
 * Synthetic event fixture generator — Prototype C only.
 */
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const GRID_LAT = 10.0;
const GRID_LNG = 10.0;
const MAX_BURST = 5000;

function createEvent(sessionId, sequenceNumber) {
  const now = Date.now();
  return {
    eventId: randomUUID(),
    schemaVersion: 1,
    eventType: sequenceNumber % 3 === 0 ? 'motion_signal' : 'location_evidence',
    sessionId,
    sequenceNumber,
    sourcePlatform: 'unknown',
    sourceComponent: 'fixture-generator',
    wallClockTimestamp: now,
    elapsedRealtimeMs: sequenceNumber,
    persistenceTimestamp: now,
    payload: {
      synthetic: true,
      gridStep: sequenceNumber,
      latitude: GRID_LAT + sequenceNumber * 0.0001,
      longitude: GRID_LNG + sequenceNumber * 0.0001,
    },
    diagnosticMetadata: { synthetic: 'true', generator: 'prototype-c-fixture' },
    deliveryAttemptCount: 0,
    acknowledgmentState: 'pending',
  };
}

function createBatch(count, sessionId = 'proto-session-synthetic') {
  if (count < 1 || count > MAX_BURST) {
    throw new Error(`count must be 1..${MAX_BURST}`);
  }
  return Array.from({ length: count }, (_, i) => createEvent(sessionId, i + 1));
}

const outArg = process.argv.indexOf('--out');
const countArg = process.argv.indexOf('--count');
const count = countArg >= 0 ? Number(process.argv[countArg + 1]) : 10;
const outPath = outArg >= 0 ? process.argv[outArg + 1] : null;

const batch = createBatch(count);
if (outPath) {
  writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), events: batch }, null, 2));
  console.log(`Wrote ${batch.length} events to ${outPath}`);
} else {
  console.log(JSON.stringify(batch, null, 2));
}
