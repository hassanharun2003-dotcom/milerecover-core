# Mobile application (`apps/mobile`)

**Status:** Package 3 — production vertical slice (in progress)

React Native **0.76.5** application shell with five-tab navigation, onboarding, and domain-driven screens.

## Architecture

- **UI:** `src/screens/*`, `src/navigation/RootTabs.tsx`
- **State:** `src/store/AppContext.tsx` — no fake mileage; empty until persistence wired
- **Selectors:** `src/selectors/*` → `@milerecover/domain`
- **Tokens:** `@milerecover/config`

## Run (local)

```bash
cd apps/mobile
npm install
npm start
# separate terminal
npm run android   # or ios on macOS
```

## Package 3 scope

Implemented: onboarding, Home, Review, Add (manual stub), Proof, Profile shells.  
Deferred: native project init (android/ios folders), persistence, bridge promotion, device validation.

## Must not

- Import from `prototypes/` (ADR-0003)
- Show fabricated trips, savings, or protection scores
