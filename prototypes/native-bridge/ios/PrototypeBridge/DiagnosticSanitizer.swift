import Foundation

/// Redacts coordinates from prototype diagnostics exports.
enum DiagnosticSanitizer {
  private static let coordinatePattern = try! NSRegularExpression(
    pattern: "^(lat(itude)?|lng|lon(gitude)?|coord|coordinates|route|polyline|address)$",
    options: [.caseInsensitive]
  )

  static func exportJSON(pending: Int, acknowledged: Int) -> String {
    let payload: [String: Any] = [
      "exportedAt": ISO8601DateFormatter().string(from: Date()),
      "bridgeApiVersion": NativeEventEnvelope.bridgeApiVersion,
      "contractVersion": "\(NativeEventEnvelope.contractMajor)",
      "platform": "ios",
      "bufferStats": [
        "pendingCount": pending,
        "acknowledgedCount": acknowledged,
      ],
    ]
    guard let data = try? JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted]),
          let str = String(data: data, encoding: .utf8) else { return "{}" }
    return str
  }

  static func jsonExcludesCoordinates(_ json: String) -> Bool {
    let lower = json.lowercased()
    return !["\"latitude\"", "\"longitude\"", "\"lat\":", "\"lng\":"].contains { lower.contains($0) }
  }
}
