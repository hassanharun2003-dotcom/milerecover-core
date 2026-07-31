/**
 * Synthetic dataset generator — no real locations or customer data.
 * Coordinates use fictional grid (SYNTH_BASE + index offset).
 */
import { createHash, randomUUID } from 'node:crypto';

export const SYNTH_BASE_LAT = 10.0;
export const SYNTH_BASE_LNG = 10.0;

export function syntheticCoordinate(index) {
  return {
    lat: SYNTH_BASE_LAT + index * 0.001,
    lng: SYNTH_BASE_LNG + index * 0.001,
    label: `SYNTHETIC_POINT_${index}`,
  };
}

export function hashPayload(obj) {
  return createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

export function generateTrip(index, nowMs = Date.now()) {
  const id = randomUUID();
  return {
    id,
    status: index % 5 === 0 ? 'pending' : 'confirmed',
    distance_meters: 1000 + index * 17,
    purpose_note: `Synthetic purpose ${index}`,
    created_at_ms: nowMs - index * 60_000,
    updated_at_ms: nowMs - index * 30_000,
    deleted_at_ms: null,
  };
}

export function generateEvidence(tripId, index) {
  const coord = syntheticCoordinate(index);
  const payload = {
    type: 'synthetic_location_batch',
    point: coord,
    accuracy_m: 12 + (index % 7),
  };
  return {
    id: randomUUID(),
    trip_id: tripId,
    evidence_type: 'location_batch',
    payload_json: JSON.stringify(payload),
    immutable_hash: hashPayload(payload),
    created_at_ms: Date.now(),
  };
}

export function generateAudit(entityType, entityId, action, index) {
  return {
    id: randomUUID(),
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor: 'synthetic_tester',
    metadata_json: JSON.stringify({ index, synthetic: true }),
    created_at_ms: Date.now(),
  };
}

export function generateInboxEvent(sessionId, sequence, index) {
  const coord = syntheticCoordinate(index);
  return {
    id: randomUUID(),
    session_id: sessionId,
    sequence_number: sequence,
    event_type: 'location_sample_recorded',
    sanitized_metadata_json: JSON.stringify({
      lat_bucket: `bucket_${Math.floor(coord.lat * 100)}`,
      accuracy_m: '12.0',
    }),
    controlled_evidence_json: JSON.stringify(coord),
    processing_state: sequence % 10 === 0 ? 'ACKNOWLEDGED' : 'PENDING',
    persisted_at_ms: Date.now(),
  };
}

export function generateDataset(options = {}) {
  const tripCount = options.tripCount ?? 200;
  const inboxPerSession = options.inboxPerSession ?? 500;
  const sessionId = randomUUID();
  const trips = [];
  const evidence = [];
  const audits = [];
  const inbox = [];

  for (let i = 0; i < tripCount; i++) {
    const trip = generateTrip(i);
    trips.push(trip);
    evidence.push(generateEvidence(trip.id, i));
    audits.push(generateAudit('trip', trip.id, 'trip.created', i));
  }

  for (let s = 0; s < inboxPerSession; s++) {
    inbox.push(generateInboxEvent(sessionId, s + 1, s));
  }

  return { trips, evidence, audits, inbox, sessionId };
}
