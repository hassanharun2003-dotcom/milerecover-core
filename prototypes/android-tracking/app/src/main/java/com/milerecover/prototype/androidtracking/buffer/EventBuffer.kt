package com.milerecover.prototype.androidtracking.buffer

import com.milerecover.prototype.androidtracking.model.NativeEvent
import com.milerecover.prototype.androidtracking.model.ProcessingState

enum class InsertResult {
  INSERTED,
  DUPLICATE_REJECTED,
  SCHEMA_REJECTED,
}

interface EventBuffer {
  fun insert(event: NativeEvent): InsertResult
  fun countPending(): Int
  fun countAll(): Int
  fun countDuplicatesRejected(): Int
  fun fetchOrderedPending(limit: Int = Int.MAX_VALUE): List<NativeEvent>
  fun fetchOrderedAll(limit: Int = Int.MAX_VALUE): List<NativeEvent>
  fun acknowledge(eventId: String): Boolean
  fun markFailed(eventId: String): Boolean
  fun replayPending(): List<NativeEvent>
  fun clearAll()
  fun maxSequenceForSession(sessionId: String): Long
}
