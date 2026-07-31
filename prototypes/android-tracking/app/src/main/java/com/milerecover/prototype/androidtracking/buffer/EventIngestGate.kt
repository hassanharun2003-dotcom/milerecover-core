package com.milerecover.prototype.androidtracking.buffer

import com.milerecover.prototype.androidtracking.config.PrototypeConfig
import com.milerecover.prototype.androidtracking.model.NativeEvent

/**
 * Rejects events whose schema version does not match the active prototype contract.
 */
object EventIngestGate {
  fun validateForInsert(event: NativeEvent): InsertResult? {
    return if (event.schemaVersion == PrototypeConfig.SCHEMA_VERSION) {
      null
    } else {
      InsertResult.SCHEMA_REJECTED
    }
  }
}
