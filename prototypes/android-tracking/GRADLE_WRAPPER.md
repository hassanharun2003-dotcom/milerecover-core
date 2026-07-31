# Gradle wrapper setup — Prototype B

The wrapper **properties** file is committed. **`gradlew`**, **`gradlew.bat`**, and **`gradle/wrapper/gradle-wrapper.jar`** are **not** committed (binary jar generated locally).

## Prerequisites

- JDK 17+
- Android SDK (API 34 platform + build-tools)
- `local.properties` with `sdk.dir=<Android SDK path>` (gitignored)

## Generate wrapper (one time)

From this directory, with system Gradle installed:

```bash
gradle wrapper --gradle-version 8.2
```

Or open in Android Studio and use **Sync Project with Gradle Files** (generates wrapper if missing).

## Verify

```bash
./gradlew tasks
./gradlew :app:testDebugUnitTest
./gradlew :app:assembleDebug
```

## Wrapper versions

| Artifact | Version |
|---|---|
| Gradle | 8.2 |
| AGP | 8.2.2 |
| Kotlin | 1.9.22 |
