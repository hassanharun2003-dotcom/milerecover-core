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

From repository root (npm workspaces):

```bash
npm ci
```

## Run (Metro + dev client)

The laptop is the primary development machine. Metro runs independently of the phone — a sleeping or locked phone does not stop builds, tests, CI, or Metro on the laptop.

After a development build is installed on device or emulator:

```bash
cd apps/mobile-expo
npm start
```

If LAN reconnection is unreliable after the phone wakes, use tunnel mode (phone reconnects without staying awake during laptop work):

```bash
cd apps/mobile-expo
npx expo start --dev-client --tunnel
```

Port conflict (8081 in use):

```bash
npx expo start --dev-client --port 8082
```

## Development workflow (phone screen off)

- **Laptop continues:** Metro, tests, EAS builds, CI, git, and validation do not require the phone to stay awake.
- **Automated first:** Prefer Jest, typecheck, export validation, CI, emulator, and `adb` logs over manual phone observation.
- **Phone only when needed:** Physical-device confirmation is reserved for behavior that cannot be verified on the laptop (e.g. future background location).
- **Sleep ≠ powered off:** A locked/sleeping phone may reconnect to Metro when opened; tracking must never be claimed while the phone is fully powered off.
- **Not Expo Go:** Background location (future) uses development builds and native background configuration only.

### Tracking engine test matrix (future milestone)

When implementing background location, explicitly verify:

| Condition | Expected to test |
|-----------|------------------|
| Screen locked | Tracking policy per ADR |
| App backgrounded | Foreground service / iOS background modes |
| Wi-Fi connected | Normal operation |
| Wi-Fi disconnected | Degraded / offline behavior |
| Mobile data active | Network path behavior |
| Battery optimization / low power | OS throttling behavior |
| App force-closed | Recovery or honest stop |
| Phone restarted | Cold-start recovery |

Do not claim continuous tracking when the device is powered completely off.

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

## Preview install (standalone APK)

Internal testers: install once from the GitHub prerelease (no login), then receive JS/UI updates via the `preview` OTA channel.

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.2/MileRecover-preview-0.1.2.apk

Full workflow, fingerprints, and OTA IDs: [docs/PREVIEW_UPDATE_WORKFLOW.md](../../docs/PREVIEW_UPDATE_WORKFLOW.md).

## Validation

```bash
# From repository root
npm run check:all
npm run test:domain
npm run test:mobile-expo
npm run deps:validate   # expo install --check (monorepo-safe)
npm run export:validate # Android static export
```

## Persistence

Same domain contract as bare RN app — AsyncStorage adapter at `src/persistence/AsyncStoragePersistenceRepository.ts`. Not encrypted at rest in foundation phase.

## Relationship to `apps/mobile`

`apps/mobile` (bare RN CLI) is **preserved unchanged** until Expo cutover criteria in [planning/Expo Migration Plan.md](../../planning/Expo%20Migration%20Plan.md) are met.

## Must not

- Import from `prototypes/` (ADR-0003)
- Claim device validation without evidence
- Commit EAS secrets or signing keys
