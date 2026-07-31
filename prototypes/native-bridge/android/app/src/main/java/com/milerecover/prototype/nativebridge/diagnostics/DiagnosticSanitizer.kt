package com.milerecover.prototype.nativebridge.diagnostics

import com.milerecover.prototype.nativebridge.buffer.PrototypeEventBuffer
import com.milerecover.prototype.nativebridge.model.NativeEventEnvelope
import org.json.JSONArray
import org.json.JSONObject

/** Redacts coordinates and sensitive keys from prototype diagnostics. */
object DiagnosticSanitizer {
  private val coordinateKeys = Regex("^(lat(itude)?|lng|lon(gitude)?|coord|coordinates|route|polyline|address)$", RegexOption.IGNORE_CASE)

  fun redactJsonObject(raw: JSONObject): JSONObject {
    val out = JSONObject()
    raw.keys().forEach { key ->
      out.put(key, if (coordinateKeys.matches(key)) "[REDACTED]" else raw.get(key))
    }
    return out
  }

  fun exportDiagnostics(buffer: PrototypeEventBuffer): String {
    val recent = buffer.recentEvents(20)
    val summaries = JSONArray()
    for (event in recent) {
      summaries.put(
        JSONObject().apply {
          put("eventId", event.eventId)
          put("eventType", event.eventType)
          put("sessionId", event.sessionId)
          put("sequenceNumber", event.sequenceNumber)
          put("acknowledgmentState", event.acknowledgmentState)
        },
      )
    }
    return JSONObject().apply {
      put("exportedAt", System.currentTimeMillis())
      put("bridgeApiVersion", NativeEventEnvelope.BRIDGE_API_VERSION)
      put("contractVersion", NativeEventEnvelope.CONTRACT_MAJOR.toString())
      put("platform", "android")
      put("bufferStats", JSONObject().apply {
        put("pendingCount", buffer.countPending())
        put("acknowledgedCount", buffer.countAcknowledged())
        put("duplicateRejectedCount", buffer.countDuplicateRejected())
        put("rejectedCount", buffer.countRejected())
        put("lastSequenceReceived", buffer.lastSequence())
      })
      put("recentEventSummaries", summaries)
    }.toString()
  }

  fun jsonExcludesCoordinates(json: String): Boolean {
    val lower = json.lowercase()
    return !listOf("\"latitude\"", "\"longitude\"", "\"lat\":", "\"lng\":").any { lower.contains(it) }
  }
}
