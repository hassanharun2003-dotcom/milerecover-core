package com.milerecover.prototype.androidtracking.buffer

import android.content.Context
import android.database.sqlite.SQLiteConstraintException
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.milerecover.prototype.androidtracking.model.NativeEvent
import com.milerecover.prototype.androidtracking.model.ProcessingState
import com.milerecover.prototype.androidtracking.util.NativeEventSerializer

/**
 * Prototype-only durable buffer using Android SQLiteOpenHelper.
 * Does NOT prove production local DB choice (see Prototype D).
 */
class SqliteEventBuffer(context: Context) :
  SQLiteOpenHelper(context, DB_NAME, null, DB_VERSION),
  EventBuffer {

  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL(
      """
      CREATE TABLE events (
        event_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        sequence_number INTEGER NOT NULL,
        idempotency_key TEXT,
        event_json TEXT NOT NULL,
        processing_state TEXT NOT NULL,
        persisted_at_ms INTEGER NOT NULL,
        UNIQUE(session_id, sequence_number),
        UNIQUE(idempotency_key)
      )
      """.trimIndent(),
    )
    db.execSQL("CREATE INDEX idx_events_pending ON events(processing_state, sequence_number)")
    db.execSQL(
      """
      CREATE TABLE buffer_stats (
        key TEXT PRIMARY KEY,
        value INTEGER NOT NULL
      )
      """.trimIndent(),
    )
  }

  override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
    db.execSQL("DROP TABLE IF EXISTS events")
    db.execSQL("DROP TABLE IF EXISTS buffer_stats")
    onCreate(db)
  }

  override fun insert(event: NativeEvent): InsertResult {
    EventIngestGate.validateForInsert(event)?.let { return it }

    val db = writableDatabase
    db.beginTransaction()
    try {
      if (event.idempotencyKey != null) {
        val existing = db.rawQuery(
          "SELECT event_id FROM events WHERE idempotency_key = ? LIMIT 1",
          arrayOf(event.idempotencyKey),
        )
        existing.use {
          if (it.moveToFirst()) {
            incrementStat(db, STAT_DUPLICATE)
            db.setTransactionSuccessful()
            return InsertResult.DUPLICATE_REJECTED
          }
        }
      }

      val persisted = event.copy(
        persistenceWallClockMs = System.currentTimeMillis(),
        processingState = ProcessingState.PENDING,
      )
      db.execSQL(
        """
        INSERT INTO events (
          event_id, session_id, sequence_number, idempotency_key,
          event_json, processing_state, persisted_at_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """.trimIndent(),
        arrayOf(
          persisted.eventId,
          persisted.sessionId,
          persisted.sequenceNumber,
          persisted.idempotencyKey,
          NativeEventSerializer.serialize(persisted),
          persisted.processingState.name,
          persisted.persistenceWallClockMs,
        ),
      )
      db.setTransactionSuccessful()
      return InsertResult.INSERTED
    } catch (e: Exception) {
      if (isUniqueConstraintViolation(e)) {
        incrementStat(db, STAT_DUPLICATE)
        db.setTransactionSuccessful()
        return InsertResult.DUPLICATE_REJECTED
      }
      throw e
    } finally {
      db.endTransaction()
    }
  }

  override fun countPending(): Int = countWhere("processing_state = ?", arrayOf(ProcessingState.PENDING.name))

  override fun countAll(): Int = countWhere("1=1", emptyArray())

  override fun countDuplicatesRejected(): Int = getStat(STAT_DUPLICATE)

  override fun fetchOrderedPending(limit: Int): List<NativeEvent> =
    fetchWhere("processing_state = ?", arrayOf(ProcessingState.PENDING.name), limit)

  override fun fetchOrderedAll(limit: Int): List<NativeEvent> =
    fetchWhere("1=1", emptyArray(), limit)

  override fun acknowledge(eventId: String): Boolean {
    val db = writableDatabase
    db.beginTransaction()
    try {
      val cursor = db.rawQuery(
        "SELECT event_json FROM events WHERE event_id = ? AND processing_state = ?",
        arrayOf(eventId, ProcessingState.PENDING.name),
      )
      cursor.use {
        if (!it.moveToFirst()) return false
        val event = NativeEventSerializer.deserialize(it.getString(0))
        val ack = event.copy(processingState = ProcessingState.ACKNOWLEDGED)
        db.execSQL(
          "UPDATE events SET processing_state = ?, event_json = ? WHERE event_id = ?",
          arrayOf(ProcessingState.ACKNOWLEDGED.name, NativeEventSerializer.serialize(ack), eventId),
        )
      }
      db.setTransactionSuccessful()
      return true
    } finally {
      db.endTransaction()
    }
  }

  override fun markFailed(eventId: String): Boolean {
    val db = writableDatabase
    db.beginTransaction()
    try {
      val cursor = db.rawQuery(
        "SELECT event_json FROM events WHERE event_id = ? AND processing_state = ?",
        arrayOf(eventId, ProcessingState.PENDING.name),
      )
      cursor.use {
        if (!it.moveToFirst()) return false
        val event = NativeEventSerializer.deserialize(it.getString(0))
        val failed = event.copy(processingState = ProcessingState.FAILED)
        db.execSQL(
          "UPDATE events SET processing_state = ?, event_json = ? WHERE event_id = ?",
          arrayOf(ProcessingState.FAILED.name, NativeEventSerializer.serialize(failed), eventId),
        )
      }
      db.setTransactionSuccessful()
      return true
    } finally {
      db.endTransaction()
    }
  }

  override fun replayPending(): List<NativeEvent> = fetchOrderedPending()

  override fun clearAll() {
    writableDatabase.execSQL("DELETE FROM events")
    writableDatabase.execSQL("DELETE FROM buffer_stats")
  }

  override fun maxSequenceForSession(sessionId: String): Long {
    readableDatabase.rawQuery(
      "SELECT MAX(sequence_number) FROM events WHERE session_id = ?",
      arrayOf(sessionId),
    ).use { c ->
      if (c.moveToFirst() && !c.isNull(0)) return c.getLong(0)
    }
    return 0L
  }

  private fun fetchWhere(where: String, args: Array<String>, limit: Int): List<NativeEvent> {
    val results = mutableListOf<NativeEvent>()
    readableDatabase.rawQuery(
      "SELECT event_json FROM events WHERE $where ORDER BY sequence_number ASC LIMIT $limit",
      args,
    ).use { cursor ->
      while (cursor.moveToNext()) {
        results.add(NativeEventSerializer.deserialize(cursor.getString(0)))
      }
    }
    return results
  }

  private fun countWhere(where: String, args: Array<String>): Int {
    readableDatabase.rawQuery("SELECT COUNT(*) FROM events WHERE $where", args).use { c ->
      if (c.moveToFirst()) return c.getInt(0)
    }
    return 0
  }

  private fun incrementStat(db: SQLiteDatabase, key: String) {
    db.rawQuery("SELECT value FROM buffer_stats WHERE key = ?", arrayOf(key)).use { cursor ->
      if (cursor.moveToFirst()) {
        db.execSQL("UPDATE buffer_stats SET value = value + 1 WHERE key = ?", arrayOf(key))
      } else {
        db.execSQL("INSERT INTO buffer_stats(key, value) VALUES(?, 1)", arrayOf(key))
      }
    }
  }

  private fun isUniqueConstraintViolation(error: Throwable): Boolean {
    var current: Throwable? = error
    while (current != null) {
      if (current is SQLiteConstraintException) return true
      val message = current.message.orEmpty()
      if (message.contains("UNIQUE", ignoreCase = true)) return true
      if (message.contains("constraint failed", ignoreCase = true)) return true
      current = current.cause
    }
    return false
  }

  private fun getStat(key: String): Int {
    readableDatabase.rawQuery("SELECT value FROM buffer_stats WHERE key = ?", arrayOf(key)).use { c ->
      if (c.moveToFirst()) return c.getInt(0)
    }
    return 0
  }

  companion object {
    private const val DB_NAME = "prototype_b_events.db"
    private const val DB_VERSION = 1
    private const val STAT_DUPLICATE = "duplicate_rejected"
  }
}

/** In-memory implementation for unit tests */
class InMemoryEventBuffer : EventBuffer {
  private val events = linkedMapOf<String, NativeEvent>()
  private var duplicateCount = 0
  private val idempotencyIndex = mutableMapOf<String, String>()

  override fun insert(event: NativeEvent): InsertResult {
    EventIngestGate.validateForInsert(event)?.let { return it }

    event.idempotencyKey?.let { key ->
      if (idempotencyIndex.containsKey(key)) {
        duplicateCount++
        return InsertResult.DUPLICATE_REJECTED
      }
    }
    val sessionDup = events.values.any {
      it.sessionId == event.sessionId && it.sequenceNumber == event.sequenceNumber
    }
    if (sessionDup) {
      duplicateCount++
      return InsertResult.DUPLICATE_REJECTED
    }
    val persisted = event.copy(
      persistenceWallClockMs = System.currentTimeMillis(),
      processingState = ProcessingState.PENDING,
    )
    events[persisted.eventId] = persisted
    persisted.idempotencyKey?.let { idempotencyIndex[it] = persisted.eventId }
    return InsertResult.INSERTED
  }

  override fun countPending(): Int = events.values.count { it.processingState == ProcessingState.PENDING }

  override fun countAll(): Int = events.size

  override fun countDuplicatesRejected(): Int = duplicateCount

  override fun fetchOrderedPending(limit: Int): List<NativeEvent> =
    events.values.filter { it.processingState == ProcessingState.PENDING }
      .sortedBy { it.sequenceNumber }
      .take(limit)

  override fun fetchOrderedAll(limit: Int): List<NativeEvent> =
    events.values.sortedBy { it.sequenceNumber }.take(limit)

  override fun acknowledge(eventId: String): Boolean {
    val existing = events[eventId] ?: return false
    if (existing.processingState != ProcessingState.PENDING) return false
    events[eventId] = existing.copy(processingState = ProcessingState.ACKNOWLEDGED)
    return true
  }

  override fun markFailed(eventId: String): Boolean {
    val existing = events[eventId] ?: return false
    if (existing.processingState != ProcessingState.PENDING) return false
    events[eventId] = existing.copy(processingState = ProcessingState.FAILED)
    return true
  }

  override fun replayPending(): List<NativeEvent> = fetchOrderedPending()

  override fun clearAll() {
    events.clear()
    idempotencyIndex.clear()
    duplicateCount = 0
  }

  override fun maxSequenceForSession(sessionId: String): Long =
    events.values.filter { it.sessionId == sessionId }.maxOfOrNull { it.sequenceNumber } ?: 0L
}
