# MileRecover Expo mobile app (`apps/mobile-expo`)

**Status:** Expo foundation — development build  
**Authority:** [docs/adr/0005-expo-mobile-stack.md](../../docs/adr/0005-expo-mobile-stack.md)

Expo SDK **57** application with custom **development client** (`expo-dev-client`). Reuses `@milerecover/domain` and `@milerecover/config`. Product UI migrated from `apps/mobile/src` without redesign.

## Not Expo Go

Background location and native tracking (future) require a **development build** or EAS build — not Expo Go.

## Identifiers

| Platform | Value |
|----------|--------|
| iOS bundle ID | `com.milerecover.app` |
| Android package | `com.milerecover.app` |
| URL scheme | `milerecover` |
| Display name | MileRecover |

## Prerequisites

- Node.js ≥ 20
- For Android dev build: Android SDK / Android Studio
- For iOS dev build: macOS + Xcode (or EAS cloud build)
- EAS CLI for cloud builds: `npm install -g eas-cli` (optional for local Metro)

## Install

```bash
cd apps/mobile-expo
npm ci
```

## Run (Metro + dev client)

After a development build is installed on device/emulator:

```bash
cd apps/mobile-expo
npm start
```

### Android development build

**Local prebuild + Android Studio (when SDK available):**

```bash
cd apps/mobile-expo
npm run prebuild:android
# Open android/ in Android Studio, run on device/emulator
npm start
```

**EAS cloud development build:**

```bash
cd apps/mobile-expo
eas build --profile development --platform android
```

### iOS development build

**EAS cloud (recommended on non-macOS hosts):**

```bash
cd apps/mobile-expo
eas build --profile development --platform ios
```

**Local (macOS):**

```bash
cd apps/mobile-expo
npm run prebuild:ios
cd ios && pod install && cd ..
npm run ios
```

## Validation

```bash
# From repository root
npm run check:all
npm run test:domain
npm run typecheck:mobile-expo

# From apps/mobile-expo
npm run typecheck
npm run config:validate
npm test
```

## Persistence

Same domain contract as bare RN app — AsyncStorage adapter at `src/persistence/AsyncStoragePersistenceRepository.ts`. Not encrypted at rest in foundation phase.

## Relationship to `apps/mobile`

`apps/mobile` (bare RN CLI) is **preserved unchanged** until Expo cutover criteria in [planning/Expo Migration Plan.md](../../planning/Expo%20Migration%20Plan.md) are met.

## Must not

- Import from `prototypes/` (ADR-0003)
- Claim device validation without evidence
- Commit EAS secrets or signing keys
