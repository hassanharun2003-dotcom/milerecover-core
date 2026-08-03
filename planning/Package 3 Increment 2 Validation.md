# Package 3 Increment 2 Validation

## Scope validated

- Native Android project under `apps/mobile/android`
- Native iOS project under `apps/mobile/ios`
- Durable local persistence via domain `PersistenceRepository`
- Startup gate states (restoring, ready, unavailable, migration-failed, corrupt-recovered, safe-reset-required)
- Package 3 mobile CI workflow

## Native identities

| Platform | Product name | Identifier |
|----------|--------------|------------|
| Android | MileRecover | `com.milerecover.app` (non-production placeholder) |
| iOS | MileRecover | `com.milerecover.app` (non-production placeholder) |
| JS registration | `MileRecover` | matches `app.json` / `MainActivity.getMainComponentName()` |

## Automated tests

| Suite | Count | Result |
|-------|-------|--------|
| `package-3-domain.test.ts` | 13 | required green |
| `package-3-persistence.test.ts` | 14 | required green |

## Build commands (daily)

```bash
# Repository checks
npm run check:all
npm run test:domain
npm run typecheck:domain
npm --prefix packages/config run typecheck
npm run typecheck:mobile

# Android (from apps/mobile)
npm ci
cd android && ./gradlew assembleDebug   # Windows: gradlew.bat assembleDebug

# iOS (macOS, from apps/mobile)
npm ci
cd ios && pod install
xcodebuild -workspace MileRecover.xcworkspace -scheme MileRecover -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO build
```

## Emulator / simulator evidence (when available)

| Scenario | Expected |
|----------|----------|
| First launch | Onboarding welcome (empty state, zero mileage) |
| Complete onboarding | Persists `onboardingComplete` |
| Relaunch | Skips onboarding |
| Clear app data | Restores first-launch onboarding |

**Note:** Physical device validation is not claimed unless explicitly performed on hardware.

## Deferred (Increment 3+)

- Native tracking bridge promotion
- Production location permissions / background modes
- Review/recovery UI expansion
- Secure encrypted trip/location store
- Splash screen polish

## CI workflows

- `.github/workflows/package-3-domain.yml` — domain tests (unchanged)
- `.github/workflows/package-3-mobile.yml` — shared checks + Android assemble + iOS simulator build

Package 1/2 prototype workflows remain path-scoped and unchanged.
