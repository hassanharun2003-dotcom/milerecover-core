package com.milerecover.prototype.androidtracking.session

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.milerecover.prototype.androidtracking.PrototypeApp
import com.milerecover.prototype.androidtracking.buffer.SqliteEventBuffer
import com.milerecover.prototype.androidtracking.config.PrototypeConfig
import com.milerecover.prototype.androidtracking.model.EventTypes
import com.milerecover.prototype.androidtracking.model.SourceComponent
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class ProcessRecreationTest {
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
  fun processRecreation_pendingEventsSurviveAndSequenceRestores() {
    val sessionId = sessionManager.startValidationSession()
    sessionManager.markServiceStarting(sessionId)
    sessionManager.markServiceActive(sessionId)
    sessionManager.appendEvent(
      EventTypes.BATTERY_STATUS_CHANGED,
      SourceComponent.FOREGROUND_SERVICE,
      mapOf("summary" to "synthetic"),
      sessionId = sessionId,
    )
    sessionManager.appendEvent(
      EventTypes.ACTIVITY_SIGNAL,
      SourceComponent.ACTIVITY_RECOGNITION,
      mapOf("signal_type" to "stub"),
      sessionId = sessionId,
    )

    assertEquals(5, buffer.countAll())
    assertEquals(5, buffer.countPending())
    val maxSeqBefore = buffer.maxSequenceForSession(sessionId)

    buffer.close()
    PrototypeApp.resetForTests()

    val persistedBuffer = SqliteEventBuffer(context)
    val recreatedManager = SessionManager(context, persistedBuffer)

    assertEquals(5, persistedBuffer.countPending())
    assertEquals(5, persistedBuffer.countAll())
    assertEquals(
      listOf(1L, 2L, 3L, 4L, 5L),
      persistedBuffer.fetchOrderedPending().map { it.sequenceNumber },
    )

    recreatedManager.restoreSequenceFromBuffer(sessionId)
    recreatedManager.appendEvent(
      EventTypes.PROCESS_RECOVERY,
      SourceComponent.SESSION_MANAGER,
      mapOf("reason" to "process_recreation_test"),
      sessionId = sessionId,
    )

    assertEquals(6, persistedBuffer.countAll())
    assertEquals(maxSeqBefore + 1, persistedBuffer.fetchOrderedAll().last().sequenceNumber)
    assertEquals(1, persistedBuffer.fetchOrderedAll().count { it.sequenceNumber == maxSeqBefore + 1 })

    persistedBuffer.close()
  }
}
