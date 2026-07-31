# Prototype B — Dependencies

**Status:** Phase 1 validation prototype  
**Not a production dependency lock-in**

| Name | Version | Purpose | Why platform APIs insufficient |
|---|---|---|---|
| Android Gradle Plugin | 8.2.2 | Build Android prototype | Standard Android build tooling for standalone validation |
| Kotlin Android plugin | 1.9.22 | Kotlin compilation | Language requirement for prototype |
| androidx.core:core-ktx | 1.12.0 | Context/extensions helpers | Minor ergonomics; could be removed |
| androidx.appcompat:appcompat | 1.6.1 | AppCompat activity/theme | Minimal UI host without Compose |
| androidx.activity:activity-ktx | 1.8.2 | Activity result APIs for permissions | Standard permission request flow |
| junit:junit | 4.13.2 | Unit tests | Test framework |
| org.robolectric:robolectric | 4.11.1 | Android framework tests on JVM | Sanitized export test without device |
| androidx.test:core | 1.5.0 | Robolectric support | Test dependency |

## Explicitly excluded

- Google Play Services / Maps SDK
- Analytics SDKs
- Crash reporting SDKs
- Backend / HTTP clients
- React Native
- Room / Realm / third-party DB libraries (prototype uses `SQLiteOpenHelper` only)

## SQLiteOpenHelper (platform)

- **Purpose:** Prototype durable event buffer only
- **Production implication:** Does **not** validate Prototype D production local DB choice
- **Removal path:** Delete `SqliteEventBuffer`; replace with production store after ADR

## License / maintenance

All dependencies are Apache 2.0 or compatible OSS with active maintenance (as of doc date). Re-verify before device validation.

## Security / data handling

- No dependency receives location data except Android framework location APIs invoked directly by prototype code
- No network transmission
