import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { generateDataset } from '../../lib/synthetic-data.mjs';
import { createMetrics, summarizeRuns } from '../../lib/metrics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libDir = path.join(__dirname, '../../lib');

function readSchema(name) {
  return fs.readFileSync(path.join(libDir, name), 'utf8');
}

function applySchema(db, sql) {
  db.exec(sql);
}

async function openDb() {
  const SQL = await initSqlJs();
  return new SQL.Database();
}

function insertTripBundle(db, trip, evidence, audit) {
  db.run('BEGIN');
  try {
    db.run(
      `INSERT INTO trips (id, status, distance_meters, purpose_note, created_at_ms, updated_at_ms, deleted_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        trip.id,
        trip.status,
        trip.distance_meters,
        trip.purpose_note,
        trip.created_at_ms,
        trip.updated_at_ms,
        trip.deleted_at_ms,
      ],
    );
    db.run(
      `INSERT INTO evidence_items (id, trip_id, evidence_type, payload_json, immutable_hash, created_at_ms)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        evidence.id,
        evidence.trip_id,
        evidence.evidence_type,
        evidence.payload_json,
        evidence.immutable_hash,
        evidence.created_at_ms,
      ],
    );
    db.run(
      `INSERT INTO audit_events (id, entity_type, entity_id, action, actor, metadata_json, created_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        audit.id,
        audit.entity_type,
        audit.entity_id,
        audit.action,
        audit.actor,
        audit.metadata_json,
        audit.created_at_ms,
      ],
    );
    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
}

function migrateV1ToV2(db) {
  const cols = db.exec('PRAGMA table_info(trips)');
  const hasVersion = cols[0]?.values?.some((row) => row[1] === 'server_version');
  if (hasVersion) return { skipped: true };
  db.run('ALTER TABLE trips ADD COLUMN server_version INTEGER NOT NULL DEFAULT 1');
  return { skipped: false };
}

export async function runSqliteTypedBenchmarks() {
  const metrics = createMetrics();
  const results = {
    candidate: 'sqlite-typed',
    engine: 'sql.js (SQLite WASM — structural stand-in for typed SQL layer + SQLCipher hook)',
    measuredAt: new Date().toISOString(),
    status: 'measured',
    scenarios: {},
    notes: [
      'sql.js validates SQL transaction semantics, not native mobile performance.',
      'Encryption measured separately — SQLCipher requires native mobile spike (pending).',
      'React Native bridge latency not measured in this harness.',
    ],
  };

  // Scenario: transaction bundle
  {
    const runs = [];
    for (let i = 0; i < 20; i++) {
      const db = await openDb();
      applySchema(db, readSchema('schema-v1.sql'));
      const trip = generateDataset({ tripCount: 1 }).trips[0];
      const evidence = generateDataset({ tripCount: 1 }).evidence[0];
      evidence.trip_id = trip.id;
      const audit = generateDataset({ tripCount: 1 }).audits[0];
      audit.entity_id = trip.id;
      const { durationMs } = await metrics.timed('txn', () => {
        insertTripBundle(db, trip, evidence, audit);
        return Promise.resolve();
      });
      runs.push({ durationMs });
      db.close();
    }
    results.scenarios.txn_trip_evidence_audit = {
      status: 'measured',
      stats: summarizeRuns(runs),
      unit: 'ms',
    };
  }

  // Scenario: inbox burst
  {
    const db = await openDb();
    applySchema(db, readSchema('schema-v1.sql'));
    const dataset = generateDataset({ tripCount: 0, inboxPerSession: 500 });
    metrics.mark('burst_start');
    db.run('BEGIN');
    for (const row of dataset.inbox) {
      db.run(
        `INSERT INTO native_event_inbox (id, session_id, sequence_number, event_type, sanitized_metadata_json, controlled_evidence_json, processing_state, persisted_at_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.session_id,
          row.sequence_number,
          row.event_type,
          row.sanitized_metadata_json,
          row.controled_evidence_json,
          row.processing_state,
          row.persisted_at_ms,
        ],
      );
    }
    db.run('COMMIT');
    const burstMs = metrics.measure('inbox_burst', 'burst_start');
    metrics.mark('read_start');
    db.exec(
      `SELECT id FROM native_event_inbox WHERE processing_state = 'PENDING' ORDER BY sequence_number LIMIT 50`,
    );
    const readMs = metrics.measure('inbox_read', 'read_start');
    results.scenarios.native_inbox_burst = {
      status: 'measured',
      insert500Ms: burstMs,
      pendingRead50Ms: readMs,
      unit: 'ms',
    };
    db.close();
  }

  // Scenario: review queue
  {
    const db = await openDb();
    applySchema(db, readSchema('schema-v1.sql'));
    const dataset = generateDataset({ tripCount: 200, inboxPerSession: 0 });
    db.run('BEGIN');
    for (let i = 0; i < dataset.trips.length; i++) {
      insertTripBundle(db, dataset.trips[i], dataset.evidence[i], dataset.audits[i]);
    }
    db.run('COMMIT');
    metrics.mark('review_start');
    db.exec(
      `SELECT id, status, updated_at_ms FROM trips WHERE status = 'pending' AND deleted_at_ms IS NULL ORDER BY updated_at_ms DESC LIMIT 50`,
    );
    const reviewMs = metrics.measure('review_queue', 'review_start');
    results.scenarios.review_queue_read = {
      status: 'measured',
      durationMs: reviewMs,
      rowCount: db.exec(`SELECT COUNT(*) FROM trips WHERE status = 'pending'`)[0]?.values[0][0] ?? 0,
      unit: 'ms',
    };
    db.close();
  }

  // Scenario: audit trail
  {
    const db = await openDb();
    applySchema(db, readSchema('schema-v1.sql'));
    const dataset = generateDataset({ tripCount: 1 });
    const trip = dataset.trips[0];
    db.run('BEGIN');
    for (let i = 0; i < 10; i++) {
      const audit = dataset.audits[0];
      audit.id = crypto.randomUUID();
      audit.action = `trip.edit_${i}`;
      db.run(
        `INSERT INTO audit_events (id, entity_type, entity_id, action, actor, metadata_json, created_at_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          audit.id,
          audit.entity_type,
          audit.entity_id,
          audit.action,
          audit.actor,
          audit.metadata_json,
          audit.created_at_ms,
        ],
      );
    }
    db.run('COMMIT');
    metrics.mark('audit_start');
    db.exec(
      `SELECT id, action FROM audit_events WHERE entity_type = 'trip' AND entity_id = '${trip.id}' ORDER BY created_at_ms ASC`,
    );
    const auditMs = metrics.measure('audit_trail', 'audit_start');
    results.scenarios.audit_trail_query = {
      status: 'measured',
      durationMs: auditMs,
      unit: 'ms',
    };
    db.close();
  }

  // Scenario: migration
  {
    const db = await openDb();
    applySchema(db, readSchema('schema-v1.sql'));
    const dataset = generateDataset({ tripCount: 50 });
    db.run('BEGIN');
    for (let i = 0; i < dataset.trips.length; i++) {
      insertTripBundle(db, dataset.trips[i], dataset.evidence[i], dataset.audits[i]);
    }
    db.run('COMMIT');
    const before = db.exec('SELECT COUNT(*) FROM trips')[0].values[0][0];
    metrics.mark('migrate_start');
    const migration = migrateV1ToV2(db);
    const migrateMs = metrics.measure('migration', 'migrate_start');
    const after = db.exec('SELECT COUNT(*) FROM trips')[0].values[0][0];
    const versionCol = db.exec('SELECT server_version FROM trips LIMIT 1');
    results.scenarios.migration_v1_v2 = {
      status: 'measured',
      durationMs: migrateMs,
      rowCountBefore: before,
      rowCountAfter: after,
      migration,
      sampleServerVersion: versionCol[0]?.values[0][0] ?? null,
      unit: 'ms',
    };
    db.close();
  }

  // Scenario: crash rollback
  {
    const db = await openDb();
    applySchema(db, readSchema('schema-v1.sql'));
    const trip = generateDataset({ tripCount: 1 }).trips[0];
    let rolledBack = false;
    db.run('BEGIN');
    try {
      db.run(
        `INSERT INTO trips (id, status, distance_meters, purpose_note, created_at_ms, updated_at_ms, deleted_at_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          trip.id,
          trip.status,
          trip.distance_meters,
          trip.purpose_note,
          trip.created_at_ms,
          trip.updated_at_ms,
          trip.deleted_at_ms,
        ],
      );
      throw new Error('simulated_crash_mid_transaction');
    } catch {
      db.run('ROLLBACK');
      rolledBack = true;
    }
    const tripCount = db.exec(`SELECT COUNT(*) FROM trips WHERE id = '${trip.id}'`)[0].values[0][0];
    results.scenarios.crash_rollback = {
      status: 'measured',
      rolledBack,
      orphanTrips: tripCount,
      pass: rolledBack && tripCount === 0,
    };
    db.close();
  }

  results.scenarios.encryption_compatibility = {
    status: 'pending',
    note: 'SQLCipher native spike required on Android/iOS — not measured in sql.js harness',
  };

  results.scenarios.rn_observation_latency = {
    status: 'pending',
    note: 'Requires React Native host with typed repository or WatermelonDB observer',
  };

  return results;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  runSqliteTypedBenchmarks().then((r) => {
    console.log(JSON.stringify(r, null, 2));
  });
}
