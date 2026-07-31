package com.milerecover.prototype.androidtracking.util

import android.os.SystemClock

data class TimeSnapshot(
  val wallClockMs: Long,
  val elapsedRealtimeMs: Long,
)

object TimeSource {
  fun now(): TimeSnapshot = TimeSnapshot(
    wallClockMs = System.currentTimeMillis(),
    elapsedRealtimeMs = SystemClock.elapsedRealtime(),
  )
}

/**
 * Session-scoped sequence using monotonic counter — not wall clock alone.
 */
class SequenceGenerator {
  @Volatile
  private var next: Long = 0

  fun nextSequence(): Long = synchronized(this) { ++next }

  fun reset(initial: Long = 0) {
    synchronized(this) { next = initial }
  }
}
