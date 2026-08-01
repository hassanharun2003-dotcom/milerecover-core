import XCTest

final class BridgeVersionTests: XCTestCase {
  func testContractMajorIsOne() {
    XCTAssertEqual(1, NativeEventEnvelope.contractMajor)
  }

  func testBridgeApiVersionIsPrototypeC() {
    XCTAssertEqual("1.0.0-prototype-c", NativeEventEnvelope.bridgeApiVersion)
  }

  func testMaxBatchSizeWithinContract() {
    XCTAssertEqual(100, NativeEventEnvelope.maxBatchSize)
  }
}
