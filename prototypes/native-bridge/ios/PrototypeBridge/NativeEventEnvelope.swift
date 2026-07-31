import Foundation

/// Prototype C event envelope — evidence only, not Trip records.
/// Structure aligned with Android/Kotlin and TypeScript contract (copied minimally).
struct NativeEventEnvelope: Codable {
  static let contractMajor = 1
  static let bridgeApiVersion = "1.0.0-prototype-c"
  static let maxBatchSize = 100

  let eventId: String
  let schemaVersion: Int
  let eventType: String
  let sessionId: String
  let sequenceNumber: Int64
  let sourcePlatform: String
  let sourceComponent: String
  let wallClockTimestamp: Int64
  let elapsedRealtimeMs: Int64
  let persistenceTimestamp: Int64
  let payload: [String: AnyCodable]
  let diagnosticMetadata: [String: String]
  let deliveryAttemptCount: Int
  let acknowledgmentState: String

  enum AckState {
    static let pending = "pending"
    static let delivered = "delivered"
    static let acknowledged = "acknowledged"
  }
}

/// Minimal JSON helper for prototype payloads.
struct AnyCodable: Codable {
  let value: Any

  init(_ value: Any) { self.value = value }

  init(from decoder: Decoder) throws {
    let container = try decoder.singleValueContainer()
    if let i = try? container.decode(Int.self) { value = i; return }
    if let d = try? container.decode(Double.self) { value = d; return }
    if let b = try? container.decode(Bool.self) { value = b; return }
    if let s = try? container.decode(String.self) { value = s; return }
    value = ""
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.singleValueContainer()
    switch value {
    case let i as Int: try container.encode(i)
    case let d as Double: try container.encode(d)
    case let b as Bool: try container.encode(b)
    case let s as String: try container.encode(s)
    default: try container.encode(String(describing: value))
    }
  }
}
