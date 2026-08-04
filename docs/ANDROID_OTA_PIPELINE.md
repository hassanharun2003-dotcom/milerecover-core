# Android OTA pipeline (preview)

## Root cause (2026-08-04)

Publishing succeeded to Expo (`channel`/`branch` `preview`, runtime `0.1.6`, Android + iOS), and the installed preview APK was correctly configured:

| Native meta-data | Installed APK value |
|---|---|
| `EXPO_UPDATE_URL` | `https://u.expo.dev/c61d0a3c-ba3d-40e1-9764-5118fa2429f3` |
| `expo-channel-name` | `preview` |
| `EXPO_RUNTIME_VERSION` | `0.1.6` |
| `ENABLED` | `true` |
| `EXPO_UPDATES_CHECK_ON_LAUNCH` | `ALWAYS` |
| `EXPO_UPDATES_LAUNCH_WAIT_MS` | `0` |

**No APK rebuild was required.** The failure was in **how updates were published**, not in the APK channel wiring.

`app.config.ts` defaults `APP_VARIANT` to `development` when unset.  
`eas update --channel preview --environment preview` does **not** apply `eas.json` build `env.APP_VARIANT=preview`.

So OTAs were exported with:

- `extra.appVariant: "development"`
- `updates.enabled: false` (because `enabled: !IS_DEV_CLIENT`)
- `plugins` including `expo-dev-client`

On device, that made `isStandaloneBuild(variant)` false, so JS `UpdateProvider` treated the app as a non-standalone build (`updatesActive` false / JS check skipped). Combined with `fallbackToCacheTimeout: 0` (paint cache first; apply on next cold start) and the update banner being suppressed during onboarding, it looked like “OTA never arrives” even when native had already fetched an update.

### Channel mapping (unchanged)

| Item | Value |
|---|---|
| Old embedded channel (APK) | `preview` |
| Corrected embedded channel | `preview` (same — binary was already correct) |
| Branch ↔ channel | `preview` → `preview` |
| Installed APK runtime | `0.1.6` |
| Published update runtime | `0.1.6` |

## Correct publish command

```bash
cd apps/mobile-expo
npm run update:preview
# expands to:
# APP_VARIANT=preview npx eas-cli@latest update --channel preview --environment preview --message "…" --non-interactive
```

Production:

```bash
npm run update:production
# APP_VARIANT=production … --channel production --environment production …
```

## Apply behavior

1. Cold start paints the last launched JS (`fallbackToCacheTimeout: 0`).
2. Native checks `preview` for runtime `0.1.6` and downloads if newer.
3. Next cold start (or in-app **Restart now**) launches the new update.
4. Update banner is UI-blocked during onboarding; native download still runs.

## Device verification (2026-08-04)

Evidence: `ui-evidence/ota-pipeline-fix/`

| # | Marker on Home | Update group | Android update ID |
|---|---|---|---|
| 1 | `OTA VERIFIED — BUILD 0.1.6 — 2026-08-04T17:15:00Z` | `48e53995-0bce-4eab-92b7-29ebbcbaca17` | `019fcdc5-2a69-7a90-b40a-0681e846ff06` |
| 2 | `OTA VERIFIED — BUILD 0.1.6 — 2026-08-04T17:30:00Z` | `d57748f9-735b-4caf-97ea-701b9d8c8226` | `019fcdd3-af55-7806-a9d6-bd80a6105162` |

OTA #2 was received after force-stop / relaunch **without** rebuilding the APK.

`PREVIEW_CHANNEL_MARKER` in `src/constants/buildInfo.ts` is rendered on Home for preview/production channel builds. Bump the marker string on each verification publish.

## Code safeguards

- `package.json` `update:preview` / `update:production` force `APP_VARIANT`.
- `UpdateProvider` also treats native `Updates.channel` of `preview`/`production` as standalone so a bad historical OTA cannot permanently disable JS update UX.
- Home shows the OTA marker when standalone **or** when the native channel is `preview`/`production`.
