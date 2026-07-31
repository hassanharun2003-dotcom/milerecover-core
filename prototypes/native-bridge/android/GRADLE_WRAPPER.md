# Gradle wrapper setup — Prototype C (React Native Android)

## Prerequisites

- JDK 17+
- Android SDK (API 35 platform + build-tools 35.0.0)
- `npm install` in `prototypes/native-bridge/` (RN Gradle plugin path)
- `android/local.properties` with `sdk.dir=...` (gitignored)

## Generate wrapper (one time)

From `prototypes/native-bridge/android/`:

```bash
gradle wrapper --gradle-version 8.10.2
```

## Verify

```bash
cd prototypes/native-bridge
npm test
npm run typecheck
cd android
./gradlew :app:testDebugUnitTest
./gradlew :app:assembleDebug
```

## Wrapper versions

| Artifact | Version |
|---|---|
| Gradle | 8.10.2 |
| AGP | 8.6.0 |
| Kotlin | 1.9.24 |
| React Native | 0.76.5 (prototype — not locked) |

## RN-specific notes

- `app/src/debug/AndroidManifest.xml` enables cleartext Metro traffic in debug builds
- `PrototypeBridgeModule` includes `addListener` / `removeListeners` for EventEmitter contract
- Run Metro separately: `npm start` from prototype root
