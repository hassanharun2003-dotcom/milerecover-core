# Gradle wrapper setup — Prototype D native Kotlin

## Generate wrapper (one time)

From this directory:

```bash
gradle wrapper --gradle-version 8.2
```

## Verify

```bash
./gradlew :app:testDebugUnitTest
./gradlew :app:assembleDebug
```

Use **Robolectric unit tests** — there are no `androidTest/` instrumentation sources.

## Wrapper versions

| Artifact | Version |
|---|---|
| Gradle | 8.2 |
| AGP | 8.2.2 (via root build.gradle.kts) |
| Kotlin | 1.9.22 |
