package com.milerecover.prototype.androidtracking.config

/**
 * CALIBRATION-ONLY prototype sampling configuration.
 * Not production policy. Do not copy thresholds into product code without validation.
 */
object PrototypeConfig {
  const val SCHEMA_VERSION = 1
  const val PROTOTYPE_VERSION = "0.1.0-prototype-b"

  /** Minimum interval between location requests (ms) — calibration only */
  const val LOCATION_MIN_INTERVAL_MS = 15_000L

  /** Minimum distance between updates (meters) — calibration only */
  const val LOCATION_MIN_DISTANCE_METERS = 10f

  /** SharedPreferences namespace */
  const val PREFS_NAME = "prototype_b_session"

  /** Key: active validation session id */
  const val PREF_ACTIVE_SESSION_ID = "active_session_id"

  /** Key: user explicitly started session (not merely service running) */
  const val PREF_SESSION_REQUESTED = "session_requested"

  /** Key: last known tracking state name */
  const val PREF_TRACKING_STATE = "tracking_state"

  /** Key: monotonic session start (elapsed realtime) */
  const val PREF_SESSION_ELAPSED_START = "session_elapsed_start"
}
