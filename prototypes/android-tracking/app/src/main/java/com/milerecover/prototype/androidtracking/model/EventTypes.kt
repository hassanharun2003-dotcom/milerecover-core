package com.milerecover.prototype.androidtracking.model

object EventTypes {
  const val SESSION_REQUESTED = "session_requested"
  const val SERVICE_STARTING = "service_starting"
  const val SERVICE_ACTIVE = "service_active"
  const val SERVICE_STOPPED = "service_stopped"
  const val PERMISSION_CHANGED = "permission_changed"
  const val BATTERY_STATUS_CHANGED = "battery_status_changed"
  const val LOCATION_SAMPLE_RECORDED = "location_sample_recorded"
  const val LOCATION_UNAVAILABLE = "location_unavailable"
  const val PROCESS_RECOVERY = "process_recovery"
  const val BOOT_RECOVERY_EVALUATED = "boot_recovery_evaluated"
  const val EVENT_REPLAYED = "event_replayed"
  const val DUPLICATE_REJECTED = "duplicate_rejected"
  const val PROTOTYPE_FAULT = "prototype_fault"
  const val ACTIVITY_SIGNAL = "activity_signal"
}

enum class ProcessingState {
  PENDING,
  ACKNOWLEDGED,
}

enum class TrackingState {
  IDLE,
  SESSION_REQUESTED,
  SERVICE_STARTING,
  SERVICE_ACTIVE,
  STOPPING,
  STOPPED,
  PERMISSION_LIMITED,
  RECOVERING,
}

enum class SourceComponent {
  UI,
  FOREGROUND_SERVICE,
  BOOT_RECEIVER,
  LOCATION_PROVIDER,
  ACTIVITY_RECOGNITION,
  SESSION_MANAGER,
  EVENT_BUFFER,
}
