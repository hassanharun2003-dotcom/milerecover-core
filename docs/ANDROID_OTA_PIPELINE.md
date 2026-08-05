# Android OTA pipeline (preview)

## HOW TO INSTALL

1. Open the direct APK URL on an Android phone:
   https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.6/MileRecover-preview-0.1.6.apk
2. Download (GitHub may show a brief redirect; the file is a real `.apk`).
3. Allow installation from the browser / unknown sources if Android asks.
4. Install.
5. Open **MileRecover** (no Expo Go, no Metro, no laptop).

Stable alias on the same release:

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.6/MileRecover-preview-latest.apk

Release page: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/tag/android-preview-0.1.6

## HOW UPDATES WORK

1. Open the app while online.
2. The binary checks the **preview** channel for runtime **0.1.6**.
3. Accept **Restart now** when an update is ready, or cold-start twice (`fallbackToCacheTimeout: 0`).
4. A new APK is needed only for native dependency, runtime, or configuration changes.

## Canonical preview APK (0.1.6-mvp.4)

| Field | Value |
|---|---|
| Package | `com.milerecover.app` |
| versionName / runtime | `0.1.6` |
| versionCode | `16` |
| Channel / branch | `preview` ↔ `preview` |
| Build label | `0.1.6-mvp.4` |
| Embedded commit | `11253c6d075f81feb155ca6183551cfcfc262a3a` |
| SHA-256 | `4a509da59ad67ce04e86ae01434c6361b9837dacb5251280d42e495239e6e836` |
| Dev launcher | not included |
| OTA | enabled (`updates.enabled: true`) |

Evidence: `ui-evidence/direct-preview-apk/`

### Replacing the public APK later

1. Bump `APP_BUILD_LABEL` (and `APP_VERSION` / runtime only if native requires it).
2. `cd apps/mobile-expo && APP_VARIANT=preview eas build --platform android --profile preview`
3. Download the APK, checksum it, publish a new GitHub prerelease tag such as `android-preview-0.1.x` with:
   - `MileRecover-preview-0.1.x.apk`
   - `MileRecover-preview-latest.apk` (same bytes)
4. Update this doc’s install URL.

## Root cause of the earlier “OTA never arrives” report (2026-08-04)

Publishing succeeded to Expo, and the installed preview APK was correctly configured:

| Native meta-data | Installed APK value |
|---|---|
| `EXPO_UPDATE_URL` | `https://u.expo.dev/c61d0a3c-ba3d-40e1-9764-5118fa2429f3` |
| `expo-channel-name` | `preview` |
| `EXPO_RUNTIME_VERSION` | `0.1.6` |
| `ENABLED` | `true` |
| `EXPO_UPDATES_CHECK_ON_LAUNCH` | `ALWAYS` |
| `EXPO_UPDATES_LAUNCH_WAIT_MS` | `0` |

The failure was in **how updates were published**, not in the APK channel wiring.

`app.config.ts` defaults `APP_VARIANT` to `development` when unset.  
`eas update --channel preview --environment preview` does **not** apply `eas.json` build `env.APP_VARIANT=preview`.

So OTAs were exported with `extra.appVariant: "development"` and `updates.enabled: false`.

### Correct publish command

```bash
cd apps/mobile-expo
npm run update:preview
# APP_VARIANT=preview npx eas-cli@latest update --channel preview --environment preview --message "…" --non-interactive
```

## Post-install OTA after this APK

| Field | Value |
|---|---|
| Marker (Home) | `OTA VERIFIED — BUILD 0.1.6 — 2026-08-04T19:40:00Z` |
| Update group | `cb4c45b9-1ad5-4c86-9956-488ce33bdd76` |
| Android update ID | `019fce54-0ce2-7d30-ba73-b7429b322b45` |

Publish a clean OTA (empty `PREVIEW_CHANNEL_MARKER`) after the marker is confirmed on a phone.
