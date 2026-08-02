# MileRecover preview install + OTA update workflow

One-link internal testing — no QR scans, no Metro for day-to-day UI updates.

## Current preview build (install once)

**Direct install URL (tap on your phone):**  
https://expo.dev/accounts/milerecover/projects/milerecover/builds/dfb98852-77d7-4185-bdd5-a07fde5a3ad9

- Build profile: `preview` (standalone — no Expo dev launcher)
- Runtime version: `0.1.0`
- Channel: `preview`
- Build ID: `dfb98852-77d7-4185-bdd5-a07fde5a3ad9`

## Test OTA update published

After installing the preview APK above, close and reopen MileRecover. Profile → About should show **Preview marker: Preview channel connected**.

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

| Profile | Purpose | Dev launcher | OTA channel |
|---------|---------|--------------|-------------|
| `development` | Engineer dev client + Metro | Yes | `development` |
| `preview` | **Your daily test APK** | No | `preview` |
| `production` | Store-bound builds | No | `production` |

## Runtime compatibility

- **Runtime version policy:** `appVersion` (currently `0.1.0`).
- OTA updates only apply when runtime version matches the installed APK.
- Bump `version` in `app.config.ts` when native code changes, then create a new preview APK.

## What requires a new APK

- Expo SDK upgrade
- New native libraries (e.g. expo-location, expo-task-manager)
- Native config plugins or permission changes
- Android package / iOS bundle ID changes
- Native tracking engine implementation

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
