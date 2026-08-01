# Package 3 — Android / iOS Parity Matrix

| Capability | Android (P3 target) | iOS (P3 target) | P3 increment 2 |
|------------|---------------------|-----------------|----------------|
| Domain logic | Shared `@milerecover/domain` | Shared | **Done** |
| Design tokens | Shared `@milerecover/config` | Shared | **Done** |
| 5-tab shell | RN navigation | RN navigation | **Done (JS)** |
| Onboarding | 4 screens | 4 screens | **Done (JS)** |
| Native project | `apps/mobile/android` | `apps/mobile/ios` | **Done** — `com.milerecover.app` |
| Local persistence | AsyncStorage adapter | AsyncStorage adapter | **Done** — schema v1 |
| Startup restore | Shared domain contract | Shared domain contract | **Done** |
| Native permissions | Fine + background location; battery opt | When In Use + Always; motion | **Deferred** — UI shows `not_determined` |
| Tracking engine UI | Map from Prototype B promotion | Map from bridge promotion | **Deferred** — shows `idle` |
| Encrypted location store | Platform secure store ADR | Keychain / encrypted store | **Deferred** — not claimed in Inc 2 |
| Physical device validation | Emulator when available | Simulator when available | **CI build only unless device run performed** |

Platform differences documented; no false device-support or encryption claims.
