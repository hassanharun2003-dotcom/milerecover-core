package com.milerecover.prototype.nativebridge.synthetic

import com.milerecover.prototype.nativebridge.model.NativeEventEnvelope
import org.json.JSONObject
import java.util.UUID
import kotlin.random.Random

/** Synthetic event generator — grid coordinates only, not real locations. */
object SyntheticEventGenerator {
  private const val GRID_LAT = 10.0
  private const val GRID_LNG = 10.0

  fun create(
    sessionId: String,
    sequenceNumber: Long,
    eventType: String = "location_evidence",
    schemaVersion: Int = 1,
  ): NativeEventEnvelope {
    val now = System.currentTimeMillis()
    val lat = GRID_LAT + sequenceNumber * 0.0001
    val lng = GRID_LNG + sequenceNumber * 0.0001
    val payload = JSONObject().apply {
      put("synthetic", true)
      put("gridStep", sequenceNumber)
      put("latitude", lat)
      put("longitude", lng)
    }
    val meta = JSONObject().apply {
      put("generator", "prototype-c-android")
      put("synthetic", "true")
    }
    return NativeEventEnvelope(
      eventId = UUID.randomUUID().toString(),
      schemaVersion = schemaVersion,
      eventType = eventType,
      sessionId = sessionId,
      sequenceNumber = sequenceNumber,
      sourcePlatform = "android",
      sourceComponent = "SyntheticEventGenerator",
      wallClockTimestamp = now,
      elapsedRealtimeMs = android.os.SystemClock.elapsedRealtime(),
      persistenceTimestamp = now,
      payloadJson = payload.toString(),
      diagnosticMetadataJson = meta.toString(),
      deliveryAttemptCount = 0,
      acknowledgmentState = NativeEventEnvelope.STATE_PENDING,
    )
  }

  fun createBurst(count: Int, sessionId: String = "proto-session-${Random.nextInt(9999)}"): List<NativeEventEnvelope> =
    (1L..count.toLong()).map { seq ->
      create(sessionId, seq, if (seq % 3L == 0L) "motion_signal" else "location_evidence")
    }
}
