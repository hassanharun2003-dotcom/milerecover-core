/**
 * Prototype C — bridge contract constants.
 * Calibration-only values; not production limits.
 * Origin: concepts aligned with Prototype D native_event_inbox (not imported).
 */

/** Prototype contract major version — unsupported majors are rejected. */
export const CONTRACT_MAJOR_VERSION = 1;

/** Schema versions JavaScript accepts for delivery. */
export const JS_SUPPORTED_SCHEMA_VERSIONS = [1] as const;

/** Native module bridge API version (separate from event schema). */
export const BRIDGE_API_VERSION = '1.0.0-prototype-c';

/** Prototype-only maximum fetch batch size. */
export const MAX_BATCH_SIZE = 100;

/** Prototype-only burst generation cap per call. */
export const MAX_SYNTHETIC_BURST = 5000;

/** Synthetic coordinate grid origin — not real locations. */
export const SYNTHETIC_GRID_ORIGIN = { lat: 10.0, lng: 10.0 } as const;

export const PROTOTYPE_EVENT_TYPES = [
  'prototype_session_started',
  'native_service_state',
  'permission_state',
  'location_evidence',
  'motion_signal',
  'native_fault',
  'process_recovery',
  'boot_recovery_evaluated',
  'buffer_health',
  'duplicate_rejected',
] as const;

export type PrototypeEventType = (typeof PROTOTYPE_EVENT_TYPES)[number];

export const ACKNOWLEDGMENT_STATES = ['pending', 'delivered', 'acknowledged'] as const;
export type AcknowledgmentState = (typeof ACKNOWLEDGMENT_STATES)[number];
