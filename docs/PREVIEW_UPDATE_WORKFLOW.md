# MileRecover preview install + OTA update workflow

One-link internal testing — no QR scans, no Metro for day-to-day UI updates.

## Current preview build (install once)

**Verified EAS build (do not use hanging Expo artifact download on-device):**  
Build ID: `a0fcf6cd-61e0-4317-a694-0da9331daee8`

- Build profile: `preview` (standalone — no Expo dev launcher, no Metro)
- Android package: `com.milerecover.app`
- App / runtime version: `0.1.2` (`runtimeVersion.policy: appVersion`)
- versionCode: `2`
- Channel: `preview`
- Preview `autoIncrement`: enabled
- `expo-dev-client` autolinking: excluded for preview/production via `eas-build-pre-install` → `scripts/sync-dev-client-autolinking.cjs`

**Phone install path (preferred):** GitHub prerelease asset — one tap, no login:

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.2/MileRecover-preview-0.1.2.apk

- Tag: `android-preview-0.1.2`
- Filename: `MileRecover-preview-0.1.2.apk`
- Release page: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/tag/android-preview-0.1.2

### Verified artifact fingerprint (build `a0fcf6cd`)

| Check | Value |
|-------|--------|
| Package | `com.milerecover.app` |
| versionName | `0.1.2` |
| versionCode | `2` |
| Size | `81572055` bytes (~77.8 MB) |
| APK SHA-256 | `87f38692ddc82e9b31ccfbfc70f45443b7ae1c25097d1e1ea583b3ea2a0b5b00` |
| Signer cert SHA-256 | `6d232f83b8859077eb52e50c97197594e6d7848daaa4a8ac0d6944b51f898a20` |
| Signature scheme | APK Signature Scheme v2 (verified) |
| Label | MileRecover |

Public download was verified without GitHub login (HTTP 200, size + SHA-256 match).

Expo dashboard page (auth may be required; on-device Expo download has hung at 81.57 MB):  
https://expo.dev/accounts/milerecover/projects/milerecover/builds/a0fcf6cd-61e0-4317-a694-0da9331daee8

## Verified upgrade notes

Build `a0fcf6cd` is the verified Android preview upgrade over the earlier `0.1.0` preview APK. Install this build (or replace the old MileRecover install) before expecting OTA updates on runtime `0.1.2`.

## Test OTA update published

After installing the preview APK above, close and reopen MileRecover. Profile → About should show **Preview marker: Preview channel connected** and build label **0.1.2-preview.4**.

**Runtime `0.1.2` OTA (latest published):**

- Update group: `ed85da34-cb5d-477a-ab97-47bc3fdb1264`
- Android update ID: `019fc66f-e527-7a27-a723-5c7ee3656056`
- iOS update ID: `019fc66f-e527-752f-b77d-1fcf36dc2c19`
- Message: `0.1.2-preview.4 experience integrity + personalized first run`
- Dashboard: https://expo.dev/accounts/milerecover/projects/milerecover/updates/ed85da34-cb5d-477a-ab97-47bc3fdb1264`

Prior V2 polish OTA (superseded):

- Update group: `9624b236-82cc-43d1-9bcd-ad8d6b92733f`
- Android update ID: `019fc644-a6e2-76e1-a5d3-c9a10fc8f9ea`
- iOS update ID: `019fc644-a6e2-742b-a90f-8b003a20bda8`
- Message: `0.1.2-preview.3: V2 user-first product polish`
- Dashboard: https://expo.dev/accounts/milerecover/projects/milerecover/updates/9624b236-82cc-43d1-9bcd-ad8d6b92733f`
- Audit: `docs/V2_PRODUCT_POLISH.md`

Prior design polish OTA (superseded):

- Update group: `1da76f81-dab9-413e-bc54-259d16b0b79a`
- Message: `0.1.2-preview.2: Locked design polish + preview channel marker`

Prior connectivity OTA (superseded on channel):

- Update group: `52208176-a688-400d-ab11-11f76e9b3de4`
- Android update ID: `019fc620-be5c-7e64-adc5-8ce3b4dcee29`
- Message: `0.1.2-preview.1: Preview channel connected for runtime 0.1.2`

Previous `0.1.0` channel marker (for older APK only — will not apply to `0.1.2` runtime):

- Update group: `1357ef99-936e-441d-976a-063797983aca`
- Android update ID: `019fc42e-7f85-7c26-a72b-701172377c62`
- Dashboard: https://expo.dev/accounts/milerecover/projects/milerecover/updates/1357ef99-936e-441d-976a-063797983aca

## First install (or after native changes)

1. Cursor runs `eas build --profile preview --platform android`.
2. Cursor sends **one clickable URL** (EAS build page — tap **Install** on your phone).
3. You install or replace MileRecover. The app opens **directly into MileRecover** — not the Expo dev-client launcher.

## Normal UI / JS / copy updates

1. Cursor runs `eas update --channel preview` from `apps/mobile-expo`.
2. You **fully close** MileRecover and reopen it.
3. Compatible JavaScript, assets, and business logic load automatically.
4. No new APK. No QR scan. No laptop connection.

Optional: Profile → **About MileRecover** → **Check for updates**, or tap **Restart now** when the banner appears.

## Build profiles

| Profile | Purpose | Dev launcher | OTA channel | autoIncrement |
|---------|---------|--------------|-------------|---------------|
| `development` | Engineer dev client + Metro | Yes | `development` | No |
| `preview` | **Your daily test APK** | No | `preview` | Yes |
| `production` | Store-bound builds | No | `production` | Yes |

## Runtime compatibility

- **Runtime version policy:** `appVersion` (currently `0.1.2`).
- OTA updates only apply when runtime version matches the installed APK.
- Bump `version` in `app.config.ts` when native code changes, then create a new preview APK.

## Standalone preview guarantees

- `APP_VARIANT=preview` → no `expo-dev-client` config plugin
- On EAS Build, `eas-build-pre-install` sets `package.json` `expo.autolinking.exclude` to `expo-dev-client` for non-development variants
- Updates enabled for preview/production; disabled for development client

## What requires a new APK

- Expo SDK upgrade
- New native libraries (e.g. expo-location, expo-task-manager)
- Native config plugins or permission changes
- Android package / iOS bundle ID changes
- Native tracking engine implementation
- Runtime version bump (app version change)

## What updates automatically (OTA)

- Screen layout and styling
- Navigation and copy
- Fixture-driven demo scenarios
- Business logic in JavaScript
- Assets bundled with the update

## Cleaning up old installer files

After the new preview APK is installed, you may **delete old `.apk` files** from your phone’s Downloads / Installation files folder. Those are installers only — not the running app. You do **not** need to uninstall MileRecover unless the new install fails to replace the old one.

## Commands (from repo root)

```bash
npm run typecheck:mobile-expo
npm run test:mobile-expo
npm --prefix apps/mobile-expo run update:preview
```

## EAS project

- Owner: `milerecover`
- Slug: `milerecover`
- Project ID: `c61d0a3c-ba3d-40e1-9764-5118fa2429f3`
- Update URL: `https://u.expo.dev/c61d0a3c-ba3d-40e1-9764-5118fa2429f3`
