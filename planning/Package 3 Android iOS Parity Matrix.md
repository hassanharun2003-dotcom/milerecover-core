# Package 3 — Android / iOS Parity Matrix

| Capability | Android (P3 target) | iOS (P3 target) | P3 increment 1 |
|------------|---------------------|-----------------|----------------|
| Domain logic | Shared `@milerecover/domain` | Shared | **Done** |
| Design tokens | Shared `@milerecover/config` | Shared | **Done** |
| 5-tab shell | RN navigation | RN navigation | **Done (JS)** |
| Onboarding | 4 screens | 4 screens | **Done (JS)** |
| Native permissions | Fine + background location; battery opt | When In Use + Always; motion | **Deferred** — UI shows `not_determined` |
| Tracking engine UI | Map from Prototype B promotion | Map from bridge promotion | **Deferred** — shows `idle` |
| Persistence | SQLite/WatermelonDB ADR | Same | **Deferred** — empty store |
| Physical device validation | P2 scenarios A–J deferred | P2 device gates deferred | **Not executed** |

Platform differences documented; no false device-support claims in Package 3 increment 1.
