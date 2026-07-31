package com.milerecover.prototype.androidtracking.model

import org.json.JSONObject
import java.util.UUID

/**
 * Versioned native event envelope — prototype only, not production bridge format.
 */
data class NativeEvent(
  val eventId: String = UUID.randomUUID().toString(),
  val schemaVersion: Int,
  val eventType: String,
  val wallClockMs: Long,
  val elapsedRealtimeMs: Long,
  val sequenceNumber: Long,
  val sessionId: String,
  val sourceComponent: String,
  val sanitizedMetadata: Map<String, String>,
  val persistenceWallClockMs: Long = 0L,
  val processingState: ProcessingState = ProcessingState.PENDING,
  /** Optional idempotency key for deduplication — never contains coordinates */
  val idempotencyKey: String? = null,
  /**
   * Controlled evidence payload stored locally for prototype validation only.
   * May contain exact coordinates for on-device capture verification.
   * Must never appear in default logs or sanitized exports.
   */
  val controlledEvidenceJson: String? = null,
) {
  fun toJson(): JSONObject {
    val meta = JSONObject()
    sanitizedMetadata.forEach { (k, v) -> meta.put(k, v) }
    return JSONObject().apply {
      put("eventId", eventId)
      put("schemaVersion", schemaVersion)
      put("eventType", eventType)
      put("wallClockMs", wallClockMs)
      put("elapsedRealtimeMs", elapsedRealtimeMs)
      put("sequenceNumber", sequenceNumber)
      put("sessionId", sessionId)
      put("sourceComponent", sourceComponent)
      put("sanitizedMetadata", meta)
      put("persistenceWallClockMs", persistenceWallClockMs)
      put("processingState", processingState.name)
      put("idempotencyKey", idempotencyKey)
      put("controlledEvidenceJson", controlledEvidenceJson)
    }
  }

  companion object {
    fun fromJson(json: JSONObject): NativeEvent {
      val metaObj = json.optJSONObject("sanitizedMetadata") ?: JSONObject()
      val meta = mutableMapOf<String, String>()
      metaObj.keys().forEach { key -> meta[key] = metaObj.optString(key) }
      return NativeEvent(
        eventId = json.getString("eventId"),
        schemaVersion = json.getInt("schemaVersion"),
        eventType = json.getString("eventType"),
        wallClockMs = json.getLong("wallClockMs"),
        elapsedRealtimeMs = json.getLong("elapsedRealtimeMs"),
        sequenceNumber = json.getLong("sequenceNumber"),
        sessionId = json.getString("sessionId"),
        sourceComponent = json.getString("sourceComponent"),
        sanitizedMetadata = meta,
        persistenceWallClockMs = json.optLong("persistenceWallClockMs"),
        processingState = ProcessingState.valueOf(
          json.optString("processingState", ProcessingState.PENDING.name),
        ),
        idempotencyKey = json.optString("idempotencyKey").takeIf { it.isNotEmpty() },
        controlledEvidenceJson = json.optString("controlledEvidenceJson").takeIf { it.isNotEmpty() },
      )
    }
  }
}
