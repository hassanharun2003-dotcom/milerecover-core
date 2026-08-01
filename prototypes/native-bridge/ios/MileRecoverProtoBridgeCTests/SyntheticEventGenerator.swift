import Foundation
@testable import MileRecoverProtoBridgeC

/// Synthetic event generator — grid coordinates only, not real locations.
enum SyntheticEventGenerator {
  private static let gridLat = 10.0
  private static let gridLng = 10.0

  static func create(
    sessionId: String,
    sequenceNumber: Int64,
    eventType: String = "location_evidence",
    schemaVersion: Int = 1
  ) -> NativeEventEnvelope {
    let now = Int64(Date().timeIntervalSince1970 * 1000)
    let lat = gridLat + Double(sequenceNumber) * 0.0001
    let lng = gridLng + Double(sequenceNumber) * 0.0001
    return NativeEventEnvelope(
      eventId: UUID().uuidString,
      schemaVersion: schemaVersion,
      eventType: eventType,
      sessionId: sessionId,
      sequenceNumber: sequenceNumber,
      sourcePlatform: "ios",
      sourceComponent: "SyntheticEventGenerator",
      wallClockTimestamp: now,
      elapsedRealtimeMs: now,
      persistenceTimestamp: now,
      payload: [
        "synthetic": AnyCodable(true),
        "gridStep": AnyCodable(sequenceNumber),
        "latitude": AnyCodable(lat),
        "longitude": AnyCodable(lng),
      ],
      diagnosticMetadata: [
        "generator": "prototype-c-ios",
        "synthetic": "true",
      ],
      deliveryAttemptCount: 0,
      acknowledgmentState: NativeEventEnvelope.AckState.pending
    )
  }
}
