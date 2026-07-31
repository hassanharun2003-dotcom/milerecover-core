package com.milerecover.prototype.localdb.kotlin

import java.util.UUID

object SyntheticData {
  fun trip(index: Int) = mapOf(
    "id" to UUID.randomUUID().toString(),
    "status" to if (index % 5 == 0) "pending" else "confirmed",
    "distance_meters" to (1000 + index * 17).toDouble(),
    "purpose_note" to "Synthetic purpose $index",
    "created_at_ms" to System.currentTimeMillis() - index * 60_000L,
    "updated_at_ms" to System.currentTimeMillis() - index * 30_000L,
    "deleted_at_ms" to null,
  )

  fun evidence(tripId: String, index: Int) = mapOf(
    "id" to UUID.randomUUID().toString(),
    "trip_id" to tripId,
    "evidence_type" to "location_batch",
    "payload_json" to """{"synthetic":true,"index":$index,"lat_bucket":"bucket_${10 + index}"}""",
    "immutable_hash" to "hash_$index",
    "created_at_ms" to System.currentTimeMillis(),
  )

  fun audit(entityId: String, index: Int) = mapOf(
    "id" to UUID.randomUUID().toString(),
    "entity_type" to "trip",
    "entity_id" to entityId,
    "action" to "trip.created",
    "actor" to "synthetic_tester",
    "metadata_json" to """{"synthetic":true,"index":$index}""",
    "created_at_ms" to System.currentTimeMillis(),
  )
}
