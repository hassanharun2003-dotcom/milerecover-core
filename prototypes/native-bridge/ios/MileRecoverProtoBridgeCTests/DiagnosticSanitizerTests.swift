import XCTest

final class DiagnosticSanitizerTests: XCTestCase {
  func testExportExcludesCoordinates() {
    let json = DiagnosticSanitizer.exportJSON(pending: 1, acknowledged: 0)
    XCTAssertTrue(DiagnosticSanitizer.jsonExcludesCoordinates(json))
    XCTAssertTrue(json.contains("ios"))
    XCTAssertTrue(json.contains(NativeEventEnvelope.bridgeApiVersion))
  }

  func testJsonWithCoordinatesFailsCheck() {
    let contaminated = """
    {"latitude": 37.7749, "longitude": -122.4194, "lat": 1, "lng": 2}
    """
    XCTAssertFalse(DiagnosticSanitizer.jsonExcludesCoordinates(contaminated))
  }

  func testJsonWithoutCoordinatesPassesCheck() {
    let safe = """
    {"pendingCount": 2, "platform": "ios", "bridgeApiVersion": "1.0.0-prototype-c"}
    """
    XCTAssertTrue(DiagnosticSanitizer.jsonExcludesCoordinates(safe))
  }
}
