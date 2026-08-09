# ADR-0005 — Expo mobile stack (development build)

**Status:** Accepted  
**Date:** 2026-08-02  
**Owners:** Mobile Engineering / Architecture

## Decision scope

Mobile application delivery platform for MileRecover on iPhone and Android, replacing incremental investment in the bare React Native CLI shell (`apps/mobile`) once Expo parity is proven.

## Context

Package 3 Increment 2 established a bare RN 0.76.5 app with domain-driven UI and AsyncStorage persistence. Native CI closure was incomplete on `4fd09af`. A targeted Expo migration audit (August 2026) found:

- ~70% TypeScript product-layer reuse (`packages/domain`, `packages/config`, `apps/mobile/src`)
- No Expo configuration in the repository
- Background location and foreground-service requirements exceed Expo Go capabilities
- Prototype native tracking (Kotlin/Swift) cannot be imported per ADR-0003

The team decided to launch iPhone and Android from one React Native + Expo codebase using custom development builds.

## Decision

1. **Use Expo React Native with a custom development build** (`expo-dev-client`), not Expo Go, as the production mobile stack path.

2. **One shared codebase** for iPhone and Android at `apps/mobile-expo`.

3. **Option B — new Expo workspace inside the monorepo** (ADR-0001 layout preserved). Do not convert or delete `apps/mobile` until Expo cutover criteria are met.

4. **Reuse existing shared packages:**
   - `@milerecover/domain` — business rules, persistence contract, selectors inputs
   - `@milerecover/config` — design tokens

5. **Retain React Navigation** (bottom tabs + future stack routes). Do not adopt Expo Router in the foundation phase unless a repository-specific blocker appears.

6. **Native projects generated via Expo prebuild** from `app.config.ts` — do not copy `apps/mobile/android` or `apps/mobile/ios`.

7. **Background location (future phase)** will use `expo-location`, `expo-task-manager`, development builds, and platform configuration (Info.plist / Android manifest via config plugins). **Expo Go is explicitly insufficient** for the final tracking engine.

8. **Native escape hatch** is allowed only when an Expo API cannot meet a **proven** requirement documented in an ADR update, with prototype evidence attached.

9. **No domain rewrites** — UI adapts to Expo; domain package remains platform-agnostic.

## Alternatives considered

| Option | Pros | Cons | Outcome |
|---|---|---|---|
| A — Convert `apps/mobile` in place | Single app folder | Fighting bare native CI debt; unclear rollback | Rejected |
| B — New `apps/mobile-expo` in monorepo | Preserves rollback; reuses packages | Two mobile folders temporarily | **Accepted** |
| C — Separate repository | Isolation | ADR-0001 drift; duplicated governance | Rejected |
| Expo Go only | Fastest demo | No background location / FGS | Rejected |
| Stay on bare RN CLI | Existing scaffold | Dual native maintenance; CI red | Deferred / archive path |

## Consequences

- **Positive:** Unified Expo tooling, EAS Build path, config-plugin model for permissions, monorepo domain reuse unchanged
- **Negative / tradeoffs:** Temporary dual mobile apps; EAS account and credentials required for device builds; SDK upgrade cadence tied to Expo
- **Follow-up:** Background location milestone; archive `apps/mobile` after cutover checklist; update CI workflows for `apps/mobile-expo`

## Validation evidence

- Targeted Expo Migration Audit (August 2026, conversation + `planning/Expo Migration Plan.md`)
- Foundation implementation: `apps/mobile-expo` typecheck + domain 27/27 tests + Expo config validation

## Security / privacy impact

- Foundation phase: same AsyncStorage persistence as Package 3 Increment 2 — not encrypted at rest
- No raw GPS storage in foundation phase
- Production secrets (EAS, signing) must not be committed

## Offline impact

- Unchanged from Package 3 — local-first persistence via domain `PersistenceRepository`
- No sync or backend in foundation phase

## Migration or rollback

**Rollback:** Continue on `apps/mobile` (bare RN) on `milestone/package-3-product`. Delete or ignore `apps/mobile-expo` branch work. Domain packages unchanged.

**Archive old app conditions (all required):**

1. Expo dev client runs onboarding + persistence round-trip on Android physical device
2. Same on iOS simulator or device
3. Domain tests green; Expo CI workflow green
4. UI parity checklist in `planning/Expo Migration Plan.md` complete for foundation scope
5. Engineering lead sign-off documented in migration plan

Until then, **`apps/mobile` remains read-only reference** — no deletion.

## Related product decisions

- DEC-001 (React Native shared UI)
- DEC-002 (native tracking — future Expo modules / config plugins)
- DEC-003 (offline-first)
- ADR-0003 (prototype isolation)

## Related documents

- [planning/Expo Migration Plan.md](../../planning/Expo%20Migration%20Plan.md)
- [docs/PROJECT_HEALTH_REPORT.md](../PROJECT_HEALTH_REPORT.md)
- [architecture/Package 3 Local Persistence.md](../../architecture/Package%203%20Local%20Persistence.md)
- [architecture/Native Tracking Engine.md](../../architecture/Native%20Tracking%20Engine.md)
