package com.milerecover.prototype.localdb.kotlin

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class PrototypeDbHelper(context: Context) :
  SQLiteOpenHelper(context, "prototype_d.db", null, DB_VERSION) {

  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL(
      """
      CREATE TABLE trips (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        distance_meters REAL NOT NULL,
        purpose_note TEXT,
        created_at_ms INTEGER NOT NULL,
        updated_at_ms INTEGER NOT NULL,
        deleted_at_ms INTEGER
      )
      """.trimIndent(),
    )
    db.execSQL(
      """
      CREATE TABLE evidence_items (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        evidence_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        immutable_hash TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL
      )
      """.trimIndent(),
    )
    db.execSQL(
      """
      CREATE TABLE audit_events (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        actor TEXT NOT NULL,
        metadata_json TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL
      )
      """.trimIndent(),
    )
    db.execSQL(
      """
      CREATE TABLE native_event_inbox (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        sequence_number INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        sanitized_metadata_json TEXT NOT NULL,
        processing_state TEXT NOT NULL,
        persisted_at_ms INTEGER NOT NULL,
        UNIQUE(session_id, sequence_number)
      )
      """.trimIndent(),
    )
    db.execSQL("CREATE INDEX idx_trips_status ON trips(status)")
  }

  override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
    if (oldVersion < 2) {
      db.execSQL("ALTER TABLE trips ADD COLUMN server_version INTEGER NOT NULL DEFAULT 1")
    }
  }

  companion object {
    const val DB_VERSION = 2
  }
}
