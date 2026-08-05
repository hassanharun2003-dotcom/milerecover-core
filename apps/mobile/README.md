# Mobile application (`apps/mobile`)

**Status:** Package 3 Increment 2 — native shell + local persistence

React Native **0.76.5** production shell with five-tab navigation, onboarding, domain-driven screens, and durable local state.

## Native identity

| Platform | Application ID |
|----------|----------------|
| Android | `com.milerecover.app` (non-production placeholder) |
| iOS | `com.milerecover.app` (non-production placeholder) |
| JS component | `MileRecover` (`app.json` / `index.js`) |

Distinct from prototype IDs (`com.milerecover.prototype.*`).

## Architecture

- **UI:** `src/screens/*`, `src/navigation/RootTabs.tsx`, `src/components/StartupGate.tsx`
- **State:** `src/store/AppContext.tsx` — restores from `PersistenceRepository` on launch
- **Persistence:** `src/persistence/AsyncStoragePersistenceRepository.ts` (production adapter)
- **Domain contract:** `@milerecover/domain` persistence + selectors
- **Tokens:** `@milerecover/config`

## Run (local)

```bash
cd apps/mobile
npm ci
npm start

# Android (separate terminal)
cd android && ./gradlew assembleDebug   # Windows: gradlew.bat assembleDebug
npm run android

# iOS (macOS)
cd ios && pod install
npm run ios
```

## Persistence

- Schema version **1** — see `architecture/Package 3 Local Persistence.md`
- **Not encrypted** beyond OS sandbox in Increment 2
- Clear app data → first-launch onboarding restored

## Package 3 scope

**Increment 2:** native android/ios projects, AsyncStorage persistence, startup restore states, mobile CI.  
**Deferred:** bridge promotion, production location permissions, review expansion, encrypted trip store.

## Must not

- Import from `prototypes/` (ADR-0003)
- Show fabricated trips, savings, or protection scores
- Commit `local.properties`, Pods, signing secrets, or build outputs
