# Prototype C — iOS validation

**Compile validation:** **Pending** — requires macOS with Xcode, CocoaPods, and `npm install` in prototype root.

## Files

| File | Purpose |
|---|---|
| `PrototypeBridge/NativeEventEnvelope.swift` | Contract envelope |
| `PrototypeBridge/PrototypeEventBuffer.swift` | File-backed prototype buffer |
| `PrototypeBridge/DiagnosticSanitizer.swift` | Privacy-safe exports |
| `PrototypeBridge/PrototypeBridgeModule.swift` | Legacy Native Module (RCTEventEmitter) |
| `PrototypeBridge/PrototypeBridgeModule.m` | Obj-C extern declarations |

## Lifecycle notes (iOS-specific)

- Buffer persists under Application Support — survives JS reload and app relaunch
- Push hints via `PrototypeEventsAvailable` — pull remains authoritative
- Background: native buffer durable; JS may be suspended — events accumulate until foreground pull

## Status

Do **not** claim iOS build success until validated on Mac hardware.

See [PLATFORM_PARITY.md](../PLATFORM_PARITY.md) and [VALIDATION_RUNBOOK.md](../VALIDATION_RUNBOOK.md).
