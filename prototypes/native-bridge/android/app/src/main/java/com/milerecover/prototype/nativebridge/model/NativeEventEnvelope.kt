package com.milerecover.prototype.nativebridge.model

import org.json.JSONObject
import java.util.UUID

/**
 * Prototype C event envelope — evidence only, not Trip records.
 * Structure inspired by Prototype B/D concepts; copied minimally for isolation.
 */
data class NativeEventEnvelope(
  val eventId: String = UUID.randomUUID().toString(),
  val schemaVersion: Int,
  val eventType: String,
  val sessionId: String,
  val sequenceNumber: Long,
  val sourcePlatform: String,
  val sourceComponent: String,
  val wallClockTimestamp: Long,
  val elapsedRealtimeMs: Long,
  val persistenceTimestamp: Long,
  val payloadJson: String,
  val diagnosticMetadataJson: String,
  val deliveryAttemptCount: Int,
  val acknowledgmentState: String,
) {
  fun toBridgeMap(): Map<String, Any?> = mapOf(
    "eventId" to eventId,
    "schemaVersion" to schemaVersion,
    "eventType" to eventType,
    "sessionId" to sessionId,
    "sequenceNumber" to sequenceNumber,
    "sourcePlatform" to sourcePlatform,
    "sourceComponent" to sourceComponent,
    "wallClockTimestamp" to wallClockTimestamp,
    "elapsedRealtimeMs" to elapsedRealtimeMs,
    "persistenceTimestamp" to persistenceTimestamp,
    "payload" to JSONObject(payloadJson).toMap(),
    "diagnosticMetadata" to JSONObject(diagnosticMetadataJson).toMap(),
    "deliveryAttemptCount" to deliveryAttemptCount,
    "acknowledgmentState" to acknowledgmentState,
  )

  companion object {
    const val STATE_PENDING = "pending"
    const val STATE_DELIVERED = "delivered"
    const val STATE_ACKNOWLEDGED = "acknowledged"
    const val CONTRACT_MAJOR = 1
    const val BRIDGE_API_VERSION = "1.0.0-prototype-c"
    const val MAX_BATCH_SIZE = 100
  }
}

private fun JSONObject.toMap(): Map<String, Any?> {
  val map = mutableMapOf<String, Any?>()
  keys().forEach { key ->
    map[key] = get(key)
  }
  return map
}
