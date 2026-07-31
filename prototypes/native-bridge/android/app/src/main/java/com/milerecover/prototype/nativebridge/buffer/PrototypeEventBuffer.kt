package com.milerecover.prototype.nativebridge.buffer

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.milerecover.prototype.nativebridge.model.NativeEventEnvelope
import org.json.JSONObject

enum class InsertResult { INSERTED, DUPLICATE_REJECTED }

/**
 * Prototype-only SQLite buffer — NOT production DB (see Prototype D).
 * Differs from Prototype B: bridge delivery/ack model + RN-facing API.
 */
class PrototypeEventBuffer(context: Context) :
  SQLiteOpenHelper(context, DB_NAME, null, DB_VERSION) {

  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL(
      """
      CREATE TABLE prototype_events (
        event_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        sequence_number INTEGER NOT NULL,
        event_json TEXT NOT NULL,
        acknowledgment_state TEXT NOT NULL,
        persisted_at_ms INTEGER NOT NULL,
        UNIQUE(session_id, sequence_number)
      )
      """.trimIndent(),
    )
    db.execSQL(
      "CREATE INDEX idx_proto_pending ON prototype_events(acknowledgment_state, sequence_number)",
    )
    db.execSQL(
      """
      CREATE TABLE prototype_stats (
        key TEXT PRIMARY KEY,
        value INTEGER NOT NULL DEFAULT 0
      )
      """.trimIndent(),
    )
  }

  override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
    db.execSQL("DROP TABLE IF EXISTS prototype_events")
    db.execSQL("DROP TABLE IF EXISTS prototype_stats")
    onCreate(db)
  }

  fun insert(event: NativeEventEnvelope): InsertResult {
    val db = writableDatabase
    db.beginTransaction()
    try {
      db.execSQL(
        """
        INSERT INTO prototype_events (
          event_id, session_id, sequence_number, event_json,
          acknowledgment_state, persisted_at_ms
        ) VALUES (?, ?, ?, ?, ?, ?)
        """.trimIndent(),
        arrayOf(
          event.eventId,
          event.sessionId,
          event.sequenceNumber,
          serialize(event.copy(acknowledgmentState = NativeEventEnvelope.STATE_PENDING)),
          NativeEventEnvelope.STATE_PENDING,
          System.currentTimeMillis(),
        ),
      )
      db.setTransactionSuccessful()
      return InsertResult.INSERTED
    } catch (e: Exception) {
      if (e.message?.contains("UNIQUE", ignoreCase = true) == true) {
        incrementStat(STAT_DUPLICATE)
        db.setTransactionSuccessful()
        return InsertResult.DUPLICATE_REJECTED
      }
      throw e
    } finally {
      db.endTransaction()
    }
  }

  fun fetchPendingBatch(limit: Int): List<NativeEventEnvelope> {
    val results = mutableListOf<NativeEventEnvelope>()
    val db = writableDatabase
    db.beginTransaction()
    try {
      readableDatabase.rawQuery(
        """
        SELECT event_json FROM prototype_events
        WHERE acknowledgment_state = ?
        ORDER BY sequence_number ASC
        LIMIT ?
        """.trimIndent(),
        arrayOf(NativeEventEnvelope.STATE_PENDING, limit.toString()),
      ).use { cursor ->
        while (cursor.moveToNext()) {
          val event = deserialize(cursor.getString(0))
          val delivered = event.copy(
            acknowledgmentState = NativeEventEnvelope.STATE_DELIVERED,
            deliveryAttemptCount = event.deliveryAttemptCount + 1,
          )
          db.execSQL(
            "UPDATE prototype_events SET event_json = ?, acknowledgment_state = ? WHERE event_id = ?",
            arrayOf(
              serialize(delivered),
              NativeEventEnvelope.STATE_DELIVERED,
              delivered.eventId,
            ),
          )
          results.add(delivered)
        }
      }
      db.setTransactionSuccessful()
    } finally {
      db.endTransaction()
    }
    return results
  }

  fun acknowledge(eventIds: List<String>): AcknowledgeResult {
    val acknowledged = mutableListOf<String>()
    val already = mutableListOf<String>()
    val unknown = mutableListOf<String>()
    val db = writableDatabase
    db.beginTransaction()
    try {
      for (id in eventIds) {
        readableDatabase.rawQuery(
          "SELECT event_json, acknowledgment_state FROM prototype_events WHERE event_id = ?",
          arrayOf(id),
        ).use { c ->
          if (!c.moveToFirst()) {
            unknown.add(id)
            return@use
          }
          val state = c.getString(1)
          if (state == NativeEventEnvelope.STATE_ACKNOWLEDGED) {
            already.add(id)
            return@use
          }
          val event = deserialize(c.getString(0)).copy(
            acknowledgmentState = NativeEventEnvelope.STATE_ACKNOWLEDGED,
          )
          db.execSQL(
            "UPDATE prototype_events SET event_json = ?, acknowledgment_state = ? WHERE event_id = ?",
            arrayOf(serialize(event), NativeEventEnvelope.STATE_ACKNOWLEDGED, id),
          )
          acknowledged.add(id)
        }
      }
      db.setTransactionSuccessful()
    } finally {
      db.endTransaction()
    }
    return AcknowledgeResult(acknowledged, already, unknown)
  }

  fun countPending(): Int = countWhere("acknowledgment_state = ?", arrayOf(NativeEventEnvelope.STATE_PENDING))

  fun countAcknowledged(): Int =
    countWhere("acknowledgment_state = ?", arrayOf(NativeEventEnvelope.STATE_ACKNOWLEDGED))

  fun countDuplicateRejected(): Int = getStat(STAT_DUPLICATE)

  fun countRejected(): Int = getStat(STAT_REJECTED)

  fun incrementRejected() = incrementStat(STAT_REJECTED)

  fun lastSequence(): Long? {
    readableDatabase.rawQuery("SELECT MAX(sequence_number) FROM prototype_events", null).use { c ->
      if (c.moveToFirst() && !c.isNull(0)) return c.getLong(0)
    }
    return null
  }

  fun clearAll() {
    writableDatabase.execSQL("DELETE FROM prototype_events")
    writableDatabase.execSQL("DELETE FROM prototype_stats")
  }

  fun recentEvents(limit: Int): List<NativeEventEnvelope> {
    val out = mutableListOf<NativeEventEnvelope>()
    readableDatabase.rawQuery(
      "SELECT event_json FROM prototype_events ORDER BY sequence_number DESC LIMIT ?",
      arrayOf(limit.toString()),
    ).use { c ->
      while (c.moveToNext()) out.add(deserialize(c.getString(0)))
    }
    return out
  }

  private fun countWhere(where: String, args: Array<String>): Int {
    readableDatabase.rawQuery("SELECT COUNT(*) FROM prototype_events WHERE $where", args).use { c ->
      if (c.moveToFirst()) return c.getInt(0)
    }
    return 0
  }

  private fun serialize(event: NativeEventEnvelope): String = JSONObject().apply {
    put("eventId", event.eventId)
    put("schemaVersion", event.schemaVersion)
    put("eventType", event.eventType)
    put("sessionId", event.sessionId)
    put("sequenceNumber", event.sequenceNumber)
    put("sourcePlatform", event.sourcePlatform)
    put("sourceComponent", event.sourceComponent)
    put("wallClockTimestamp", event.wallClockTimestamp)
    put("elapsedRealtimeMs", event.elapsedRealtimeMs)
    put("persistenceTimestamp", event.persistenceTimestamp)
    put("payloadJson", event.payloadJson)
    put("diagnosticMetadataJson", event.diagnosticMetadataJson)
    put("deliveryAttemptCount", event.deliveryAttemptCount)
    put("acknowledgmentState", event.acknowledgmentState)
  }.toString()

  private fun deserialize(json: String): NativeEventEnvelope {
    val o = JSONObject(json)
    return NativeEventEnvelope(
      eventId = o.getString("eventId"),
      schemaVersion = o.getInt("schemaVersion"),
      eventType = o.getString("eventType"),
      sessionId = o.getString("sessionId"),
      sequenceNumber = o.getLong("sequenceNumber"),
      sourcePlatform = o.getString("sourcePlatform"),
      sourceComponent = o.getString("sourceComponent"),
      wallClockTimestamp = o.getLong("wallClockTimestamp"),
      elapsedRealtimeMs = o.getLong("elapsedRealtimeMs"),
      persistenceTimestamp = o.getLong("persistenceTimestamp"),
      payloadJson = o.getString("payloadJson"),
      diagnosticMetadataJson = o.getString("diagnosticMetadataJson"),
      deliveryAttemptCount = o.getInt("deliveryAttemptCount"),
      acknowledgmentState = o.getString("acknowledgmentState"),
    )
  }

  private fun incrementStat(key: String) {
    writableDatabase.execSQL(
      "INSERT INTO prototype_stats(key, value) VALUES(?, 1) ON CONFLICT(key) DO UPDATE SET value = value + 1",
      arrayOf(key),
    )
  }

  private fun getStat(key: String): Int {
    readableDatabase.rawQuery("SELECT value FROM prototype_stats WHERE key = ?", arrayOf(key)).use { c ->
      if (c.moveToFirst()) return c.getInt(0)
    }
    return 0
  }

  companion object {
    private const val DB_NAME = "prototype_c_bridge.db"
    private const val DB_VERSION = 1
    private const val STAT_DUPLICATE = "duplicate_rejected"
    private const val STAT_REJECTED = "rejected"
  }
}

data class AcknowledgeResult(
  val acknowledged: List<String>,
  val alreadyAcknowledged: List<String>,
  val unknown: List<String>,
)
