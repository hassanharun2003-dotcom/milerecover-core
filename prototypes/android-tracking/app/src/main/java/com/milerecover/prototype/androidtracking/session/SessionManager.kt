package com.milerecover.prototype.androidtracking.session

import android.content.Context
import com.milerecover.prototype.androidtracking.buffer.EventBuffer
import com.milerecover.prototype.androidtracking.buffer.InsertResult
import com.milerecover.prototype.androidtracking.config.PrototypeConfig
import com.milerecover.prototype.androidtracking.model.EventTypes
import com.milerecover.prototype.androidtracking.model.SourceComponent
import com.milerecover.prototype.androidtracking.model.TrackingState
import com.milerecover.prototype.androidtracking.model.NativeEvent
import com.milerecover.prototype.androidtracking.util.IdempotencyKeys
import com.milerecover.prototype.androidtracking.util.SequenceGenerator
import com.milerecover.prototype.androidtracking.util.TimeSource
import java.util.UUID
import java.util.concurrent.atomic.AtomicInteger

class SessionManager(
  private val context: Context,
  private val buffer: EventBuffer,
) {
  private val prefs = context.getSharedPreferences(PrototypeConfig.PREFS_NAME, Context.MODE_PRIVATE)
  private val sequence = SequenceGenerator()
  private val serviceStartGeneration = AtomicInteger(0)

  fun currentSessionId(): String? =
    prefs.getString(PrototypeConfig.PREF_ACTIVE_SESSION_ID, null)

  fun isSessionRequested(): Boolean =
    prefs.getBoolean(PrototypeConfig.PREF_SESSION_REQUESTED, false)

  fun trackingState(): TrackingState =
    TrackingState.valueOf(
      prefs.getString(PrototypeConfig.PREF_TRACKING_STATE, TrackingState.IDLE.name)!!,
    )

  fun startValidationSession(): String {
    val sessionId = UUID.randomUUID().toString()
    sequence.reset(0)
    serviceStartGeneration.set(0)
    prefs.edit()
      .putString(PrototypeConfig.PREF_ACTIVE_SESSION_ID, sessionId)
      .putBoolean(PrototypeConfig.PREF_SESSION_REQUESTED, true)
      .putString(PrototypeConfig.PREF_TRACKING_STATE, TrackingState.SESSION_REQUESTED.name)
      .putLong(PrototypeConfig.PREF_SESSION_ELAPSED_START, TimeSource.now().elapsedRealtimeMs)
      .apply()
    appendEvent(
      EventTypes.SESSION_REQUESTED,
      SourceComponent.UI,
      mapOf("reason" to "user_start"),
      sessionId = sessionId,
    )
    return sessionId
  }

  fun markServiceStarting(sessionId: String): Int {
    val gen = serviceStartGeneration.incrementAndGet()
    setTrackingState(TrackingState.SERVICE_STARTING)
    appendEvent(
      EventTypes.SERVICE_STARTING,
      SourceComponent.FOREGROUND_SERVICE,
      mapOf("start_generation" to gen.toString()),
      sessionId = sessionId,
      idempotencyKey = IdempotencyKeys.serviceStart(sessionId, gen),
    )
    return gen
  }

  fun markServiceActive(sessionId: String) {
    setTrackingState(TrackingState.SERVICE_ACTIVE)
    appendEvent(
      EventTypes.SERVICE_ACTIVE,
      SourceComponent.FOREGROUND_SERVICE,
      emptyMap(),
      sessionId = sessionId,
    )
  }

  fun stopValidationSession() {
    val sessionId = currentSessionId() ?: return
    setTrackingState(TrackingState.STOPPING)
    appendEvent(
      EventTypes.SERVICE_STOPPED,
      SourceComponent.UI,
      mapOf("reason" to "user_stop"),
      sessionId = sessionId,
      idempotencyKey = IdempotencyKeys.serviceStop(sessionId),
    )
    prefs.edit()
      .putBoolean(PrototypeConfig.PREF_SESSION_REQUESTED, false)
      .putString(PrototypeConfig.PREF_TRACKING_STATE, TrackingState.STOPPED.name)
      .remove(PrototypeConfig.PREF_ACTIVE_SESSION_ID)
      .apply()
  }

  fun markRecovering(sessionId: String, reason: String) {
    setTrackingState(TrackingState.RECOVERING)
    appendEvent(
      EventTypes.PROCESS_RECOVERY,
      SourceComponent.SESSION_MANAGER,
      mapOf("reason" to reason),
      sessionId = sessionId,
    )
  }

  fun recordBootEvaluation(decision: String, detail: String) {
    val sessionId = currentSessionId() ?: "no_session"
    appendEvent(
      EventTypes.BOOT_RECOVERY_EVALUATED,
      SourceComponent.BOOT_RECEIVER,
      mapOf("decision" to decision, "detail" to detail),
      sessionId = sessionId,
      idempotencyKey = IdempotencyKeys.bootEvaluation(System.currentTimeMillis() / 60_000),
    )
  }

  fun recordDuplicateRejected(sessionId: String, reason: String) {
    appendEvent(
      EventTypes.DUPLICATE_REJECTED,
      SourceComponent.EVENT_BUFFER,
      mapOf("reason" to reason),
      sessionId = sessionId,
    )
  }

  fun appendEvent(
    type: String,
    source: SourceComponent,
    metadata: Map<String, String>,
    sessionId: String = currentSessionId() ?: "orphan",
    idempotencyKey: String? = null,
    controlledEvidenceJson: String? = null,
  ): InsertResult {
    val time = TimeSource.now()
    val seq = sequence.nextSequence()
    val event = NativeEvent(
      schemaVersion = PrototypeConfig.SCHEMA_VERSION,
      eventType = type,
      wallClockMs = time.wallClockMs,
      elapsedRealtimeMs = time.elapsedRealtimeMs,
      sequenceNumber = seq,
      sessionId = sessionId,
      sourceComponent = source.name,
      sanitizedMetadata = metadata,
      idempotencyKey = idempotencyKey,
      controlledEvidenceJson = controlledEvidenceJson,
    )
    val result = buffer.insert(event)
    if (result == InsertResult.DUPLICATE_REJECTED) {
      recordDuplicateRejected(sessionId, "idempotency_or_sequence")
    }
    return result
  }

  fun restoreSequenceFromBuffer(sessionId: String) {
    sequence.reset(buffer.maxSequenceForSession(sessionId))
  }

  private fun setTrackingState(state: TrackingState) {
    prefs.edit().putString(PrototypeConfig.PREF_TRACKING_STATE, state.name).apply()
  }
}
