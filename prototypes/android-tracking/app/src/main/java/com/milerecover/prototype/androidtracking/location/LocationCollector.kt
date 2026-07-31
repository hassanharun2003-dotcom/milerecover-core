package com.milerecover.prototype.androidtracking.location

import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
import com.milerecover.prototype.androidtracking.config.PrototypeConfig
import com.milerecover.prototype.androidtracking.model.EventTypes
import com.milerecover.prototype.androidtracking.model.SourceComponent
import com.milerecover.prototype.androidtracking.session.SessionManager
import com.milerecover.prototype.androidtracking.util.CoordinateRedaction
import com.milerecover.prototype.androidtracking.util.IdempotencyKeys
import com.milerecover.prototype.androidtracking.util.PrototypeLog
import org.json.JSONObject

class LocationCollector(
  private val context: Context,
  private val sessionManager: SessionManager,
) : LocationListener {

  private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
  private var listening = false

  fun start(sessionId: String) {
    if (listening) return
    val provider = when {
      locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
      locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
      else -> null
    }
    if (provider == null) {
      sessionManager.appendEvent(
        EventTypes.LOCATION_UNAVAILABLE,
        SourceComponent.LOCATION_PROVIDER,
        mapOf("reason" to "no_provider_enabled"),
        sessionId = sessionId,
      )
      return
    }
    try {
      locationManager.requestLocationUpdates(
        provider,
        PrototypeConfig.LOCATION_MIN_INTERVAL_MS,
        PrototypeConfig.LOCATION_MIN_DISTANCE_METERS,
        this,
        Looper.getMainLooper(),
      )
      listening = true
      PrototypeLog.d(TAG, "Location updates started provider=$provider")
    } catch (e: SecurityException) {
      sessionManager.appendEvent(
        EventTypes.PROTOTYPE_FAULT,
        SourceComponent.LOCATION_PROVIDER,
        mapOf("category" to "permission_missing", "detail" to "security_exception"),
        sessionId = sessionId,
      )
    }
  }

  fun stop() {
    if (!listening) return
    locationManager.removeUpdates(this)
    listening = false
    PrototypeLog.d(TAG, "Location updates stopped")
  }

  override fun onLocationChanged(location: Location) {
    val sessionId = sessionManager.currentSessionId() ?: return
    val providerTime = location.time
    val seq = sessionManagerLetSequence(sessionId)
    val sanitized = mapOf(
      "provider" to (location.provider ?: "unknown"),
      "accuracy_m" to location.accuracy.toString(),
      "lat_bucket" to CoordinateRedaction.bucketCoordinate(location.latitude),
      "lng_bucket" to CoordinateRedaction.bucketCoordinate(location.longitude),
      "speed_mps" to location.speed.toString(),
      "bearing" to location.bearing.toString(),
    )
    val evidence = JSONObject().apply {
      put("lat", location.latitude)
      put("lng", location.longitude)
      put("accuracy_m", location.accuracy)
      put("provider_time_ms", providerTime)
      put("provider", location.provider)
    }
    sessionManager.appendEvent(
      EventTypes.LOCATION_SAMPLE_RECORDED,
      SourceComponent.LOCATION_PROVIDER,
      sanitized,
      sessionId = sessionId,
      idempotencyKey = IdempotencyKeys.locationSample(sessionId, providerTime, seq),
      controlledEvidenceJson = evidence.toString(),
    )
    PrototypeLog.d(TAG, "Location sample recorded seq=$seq accuracy=${location.accuracy}")
  }

  private fun sessionManagerLetSequence(sessionId: String): Long {
    // Sequence assigned inside appendEvent; use provider time + buffer max for idempotency key stability
    return sessionManager.let {
      // approximate — idempotency uses provider time primarily
      System.nanoTime()
    }
  }

  override fun onProviderDisabled(provider: String) {
    val sessionId = sessionManager.currentSessionId() ?: return
    sessionManager.appendEvent(
      EventTypes.LOCATION_UNAVAILABLE,
      SourceComponent.LOCATION_PROVIDER,
      mapOf("reason" to "provider_disabled", "provider" to provider),
      sessionId = sessionId,
    )
  }

  override fun onProviderEnabled(provider: String) = Unit
  override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit

  companion object {
    private const val TAG = "ProtoB.Location"
  }
}
