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

The failure was in **how updates were published**, not in the APK channel wiring.

`app.config.ts` defaults `APP_VARIANT` to `development` when unset.  
`eas update --channel preview --environment preview` does **not** apply `eas.json` build `env.APP_VARIANT=preview`.

So OTAs were exported with:

- `extra.appVariant: "development"`
- `updates.enabled: false` (because `enabled: !IS_DEV_CLIENT`)
- `plugins` including `expo-dev-client`

On device, that made `isStandaloneBuild(variant)` false, so JS `UpdateProvider` treated the app as a non-standalone build (`updatesActive` false / JS check skipped). Combined with `fallbackToCacheTimeout: 0` (paint cache first; apply on next cold start) and the update banner being suppressed during onboarding, it looked like “OTA never arrives” even when native had already fetched an update.

## Correct publish command

```bash
cd apps/mobile-expo
npm run update:preview
# expands to:
# APP_VARIANT=preview eas update --channel preview --environment preview --non-interactive
```

Production:

```bash
npm run update:production
# APP_VARIANT=production eas update --channel production --environment production --non-interactive
```

## Branch ↔ channel

| Channel | Branch | Runtime for this binary |
|---|---|---|
| `preview` | `preview` | `0.1.6` (`runtimeVersion.policy = appVersion`) |
| `production` | `production` | app version at build time |
| `development` | `development` | dev-client builds (OTA disabled) |

## Apply behavior

1. Cold start paints the last launched JS (`fallbackToCacheTimeout: 0`).
2. Native checks `preview` for runtime `0.1.6` and downloads if newer.
3. Next cold start (or in-app **Restart now**) launches the new update.
4. Update banner is UI-blocked during onboarding; native download still runs.

## Verification marker

`PREVIEW_CHANNEL_MARKER` in `src/constants/buildInfo.ts` is rendered on Home for preview/production channel builds. Bump the marker string on each verification publish.
