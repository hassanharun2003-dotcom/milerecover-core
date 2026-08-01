package com.milerecover.prototype.androidtracking.session

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.milerecover.prototype.androidtracking.PrototypeApp
import com.milerecover.prototype.androidtracking.buffer.InsertResult
import com.milerecover.prototype.androidtracking.buffer.SqliteEventBuffer
import com.milerecover.prototype.androidtracking.config.PrototypeConfig
import com.milerecover.prototype.androidtracking.model.EventTypes
import com.milerecover.prototype.androidtracking.model.SourceComponent
import com.milerecover.prototype.androidtracking.model.TrackingState
import com.milerecover.prototype.androidtracking.util.IdempotencyKeys
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class SessionManagerTest {
  private lateinit var context: Context
  private lateinit var buffer: SqliteEventBuffer
  private lateinit var sessionManager: SessionManager

  @Before
  fun setup() {
    context = ApplicationProvider.getApplicationContext()
    PrototypeApp.resetForTests()
    buffer = SqliteEventBuffer(context)
    buffer.clearAll()
    sessionManager = SessionManager(context, buffer)
    context.getSharedPreferences(PrototypeConfig.PREFS_NAME, Context.MODE_PRIVATE).edit().clear().apply()
  }

  @After
  fun teardown() {
    buffer.close()
    PrototypeApp.resetForTests()
  }

  @Test
  fun startValidationSession_setsRequestedPrefsAndEvent() {
    val sessionId = sessionManager.startValidationSession()

    assertNotNull(sessionId)
    assertEquals(sessionId, sessionManager.currentSessionId())
    assertTrue(sessionManager.isSessionRequested())
    assertEquals(TrackingState.SESSION_REQUESTED, sessionManager.trackingState())

    val prefs = context.getSharedPreferences(PrototypeConfig.PREFS_NAME, Context.MODE_PRIVATE)
    assertEquals(sessionId, prefs.getString(PrototypeConfig.PREF_ACTIVE_SESSION_ID, null))
    assertTrue(prefs.getBoolean(PrototypeConfig.PREF_SESSION_REQUESTED, false))
    assertTrue(prefs.getLong(PrototypeConfig.PREF_SESSION_ELAPSED_START, -1L) >= 0L)

    val events = buffer.fetchOrderedAll()
    assertEquals(1, events.size)
    assertEquals(EventTypes.SESSION_REQUESTED, events.first().eventType)
  }

  @Test
  fun stopValidationSession_clearsPrefsAndRecordsStop() {
    val sessionId = sessionManager.startValidationSession()
    sessionManager.stopValidationSession()

    assertNull(sessionManager.currentSessionId())
    assertFalse(sessionManager.isSessionRequested())
    assertEquals(TrackingState.STOPPED, sessionManager.trackingState())

    val stopEvents = buffer.fetchOrderedAll().filter { it.eventType == EventTypes.SERVICE_STOPPED }
    assertEquals(1, stopEvents.size)
    assertEquals(sessionId, stopEvents.first().sessionId)
  }

  @Test
  fun markServiceStarting_usesIdempotencyKeyPerGeneration() {
    val sessionId = sessionManager.startValidationSession()

    val gen1 = sessionManager.markServiceStarting(sessionId)
    val gen2 = sessionManager.markServiceStarting(sessionId)

    assertEquals(1, gen1)
    assertEquals(2, gen2)
    assertEquals(TrackingState.SERVICE_STARTING, sessionManager.trackingState())

    val startingEvents = buffer.fetchOrderedAll().filter { it.eventType == EventTypes.SERVICE_STARTING }
    assertEquals(2, startingEvents.size)
    assertEquals(
      IdempotencyKeys.serviceStart(sessionId, gen1),
      startingEvents[0].idempotencyKey,
    )
    assertEquals(
      IdempotencyKeys.serviceStart(sessionId, gen2),
      startingEvents[1].idempotencyKey,
    )
  }

  @Test
  fun markServiceStarting_duplicateIdempotencyKey_rejected() {
    val sessionId = sessionManager.startValidationSession()
    val gen = sessionManager.markServiceStarting(sessionId)

    val duplicate = sessionManager.appendEvent(
      EventTypes.SERVICE_STARTING,
      SourceComponent.FOREGROUND_SERVICE,
      mapOf("start_generation" to gen.toString()),
      sessionId = sessionId,
      idempotencyKey = IdempotencyKeys.serviceStart(sessionId, gen),
    )

    assertEquals(InsertResult.DUPLICATE_REJECTED, duplicate)
    assertEquals(
      1,
      buffer.fetchOrderedAll().count { it.eventType == EventTypes.SERVICE_STARTING },
    )
  }

  @Test
  fun stopValidationSession_duplicateStop_isSafeNoOp() {
    sessionManager.startValidationSession()
    sessionManager.stopValidationSession()
    sessionManager.stopValidationSession()

    assertFalse(sessionManager.isSessionRequested())
    assertNull(sessionManager.currentSessionId())
    assertEquals(
      1,
      buffer.fetchOrderedAll().count { it.eventType == EventTypes.SERVICE_STOPPED },
    )
  }

  @Test
  fun restoreSequenceFromBuffer_resumesAfterPersistedEvents() {
    val sessionId = sessionManager.startValidationSession()
    sessionManager.appendEvent(
      EventTypes.BATTERY_STATUS_CHANGED,
      SourceComponent.FOREGROUND_SERVICE,
      mapOf("summary" to "test"),
      sessionId = sessionId,
    )
    sessionManager.appendEvent(
      EventTypes.ACTIVITY_SIGNAL,
      SourceComponent.ACTIVITY_RECOGNITION,
      mapOf("signal_type" to "stub"),
      sessionId = sessionId,
    )
    assertEquals(3L, buffer.maxSequenceForSession(sessionId))

    buffer.close()
    val reopened = SqliteEventBuffer(context)
    val recreated = SessionManager(context, reopened)
    recreated.restoreSequenceFromBuffer(sessionId)
    recreated.appendEvent(
      EventTypes.SERVICE_ACTIVE,
      SourceComponent.FOREGROUND_SERVICE,
      emptyMap(),
      sessionId = sessionId,
    )

    assertEquals(4L, reopened.fetchOrderedAll().last().sequenceNumber)
    reopened.close()
  }

  @Test
  fun duplicateServiceStartEvent_rejectedViaIdempotency() {
    val sessionId = sessionManager.startValidationSession()
    sessionManager.markServiceStarting(sessionId)
    sessionManager.markServiceActive(sessionId)

    val duplicateStart = sessionManager.appendEvent(
      EventTypes.SERVICE_STARTING,
      SourceComponent.FOREGROUND_SERVICE,
      mapOf("start_generation" to "1"),
      sessionId = sessionId,
      idempotencyKey = IdempotencyKeys.serviceStart(sessionId, 1),
    )

    assertEquals(InsertResult.DUPLICATE_REJECTED, duplicateStart)
    assertTrue(buffer.countDuplicatesRejected() >= 1)
  }
}
