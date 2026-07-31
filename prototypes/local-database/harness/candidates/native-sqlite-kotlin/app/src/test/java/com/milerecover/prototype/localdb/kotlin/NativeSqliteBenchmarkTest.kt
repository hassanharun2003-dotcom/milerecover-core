package com.milerecover.prototype.localdb.kotlin

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class NativeSqliteBenchmarkTest {

  private lateinit var helper: PrototypeDbHelper
  private lateinit var db: SQLiteDatabase

  @Before
  fun setup() {
    val context = RuntimeEnvironment.getApplication()
    helper = PrototypeDbHelper(context)
    db = helper.writableDatabase
  }

  @After
  fun teardown() {
    db.close()
    helper.close()
    RuntimeEnvironment.getApplication().deleteDatabase("prototype_d.db")
  }

  @Test
  fun transactionBundle_commitsTripEvidenceAudit() {
    val trip = SyntheticData.trip(1)
    val evidence = SyntheticData.evidence(trip["id"] as String, 1)
    val audit = SyntheticData.audit(trip["id"] as String, 1)

    db.beginTransaction()
    try {
      insertTrip(db, trip)
      insertEvidence(db, evidence)
      insertAudit(db, audit)
      db.setTransactionSuccessful()
    } finally {
      db.endTransaction()
    }

    assertEquals(1, count(db, "trips"))
    assertEquals(1, count(db, "evidence_items"))
    assertEquals(1, count(db, "audit_events"))
  }

  @Test
  fun crashRollback_doesNotLeaveOrphanTrip() {
    val trip = SyntheticData.trip(99)
    db.beginTransaction()
    try {
      insertTrip(db, trip)
      throw RuntimeException("simulated_crash")
    } catch (_: RuntimeException) {
      // no setTransactionSuccessful
    } finally {
      db.endTransaction()
    }
    assertEquals(0, count(db, "trips"))
  }

  @Test
  fun inboxBurst_500rows() {
    val sessionId = UUID.randomUUID().toString()
    val start = System.nanoTime()
    db.beginTransaction()
    for (i in 1..500) {
      db.execSQL(
        """
        INSERT INTO native_event_inbox (id, session_id, sequence_number, event_type, sanitized_metadata_json, processing_state, persisted_at_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """.trimIndent(),
        arrayOf(
          UUID.randomUUID().toString(),
          sessionId,
          i,
          "location_sample_recorded",
          """{"lat_bucket":"bucket_10","accuracy_m":"12.0"}""",
          if (i % 10 == 0) "ACKNOWLEDGED" else "PENDING",
          System.currentTimeMillis(),
        ),
      )
    }
    db.setTransactionSuccessful()
    db.endTransaction()
    val insertMs = (System.nanoTime() - start) / 1_000_000

    val readStart = System.nanoTime()
    db.rawQuery(
      "SELECT id FROM native_event_inbox WHERE processing_state = 'PENDING' ORDER BY sequence_number LIMIT 50",
      null,
    ).use { it.count }
    val readMs = (System.nanoTime() - readStart) / 1_000_000

    android.util.Log.i("ProtoD.NativeSQLite", "inbox_burst insert500Ms=$insertMs read50Ms=$readMs")
    assertEquals(500, count(db, "native_event_inbox"))
    assertTrue(insertMs >= 0)
  }

  @Test
  fun migration_addsServerVersion() {
    val trip = SyntheticData.trip(1)
    insertTrip(db, trip)
    helper.close()
    val context = RuntimeEnvironment.getApplication()
    val helperV2 = PrototypeDbHelper(context)
    val upgraded = helperV2.readableDatabase
    upgraded.rawQuery("SELECT server_version FROM trips LIMIT 1", null).use {
      assertTrue(it.moveToFirst())
      assertEquals(1, it.getInt(0))
    }
    upgraded.close()
    helperV2.close()
  }

  private fun insertTrip(db: SQLiteDatabase, trip: Map<String, Any?>) {
    db.execSQL(
      "INSERT INTO trips (id, status, distance_meters, purpose_note, created_at_ms, updated_at_ms, deleted_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?)",
      arrayOf(
        trip["id"],
        trip["status"],
        trip["distance_meters"],
        trip["purpose_note"],
        trip["created_at_ms"],
        trip["updated_at_ms"],
        trip["deleted_at_ms"],
      ),
    )
  }

  private fun insertEvidence(db: SQLiteDatabase, e: Map<String, Any?>) {
    db.execSQL(
      "INSERT INTO evidence_items (id, trip_id, evidence_type, payload_json, immutable_hash, created_at_ms) VALUES (?, ?, ?, ?, ?, ?)",
      arrayOf(e["id"], e["trip_id"], e["evidence_type"], e["payload_json"], e["immutable_hash"], e["created_at_ms"]),
    )
  }

  private fun insertAudit(db: SQLiteDatabase, a: Map<String, Any?>) {
    db.execSQL(
      "INSERT INTO audit_events (id, entity_type, entity_id, action, actor, metadata_json, created_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?)",
      arrayOf(a["id"], a["entity_type"], a["entity_id"], a["action"], a["actor"], a["metadata_json"], a["created_at_ms"]),
    )
  }

  private fun count(db: SQLiteDatabase, table: String): Int {
    db.rawQuery("SELECT COUNT(*) FROM $table", null).use {
      it.moveToFirst()
      return it.getInt(0)
    }
  }
}
