# Current preview delivery — 0.2.6 foundation.2

**Branch:** `cursor/foundation-reset-0.2.6-29cb`  
**Build label:** `0.2.6-foundation.2`  
**App version / runtime:** `0.2.6` (explicit — isolated from prior OTA)  
**Channel:** `preview-foundation-0.2.6`  
**versionCode:** `34`  
**Commit:** `508164c1b58286e0fbcb8a4190d63505f6a193fc`  
**SHA-256:** `f8e9b8e3c1f6b764633f5dbc7bb2e4a376592c8c112674ca4cf685173fe088e7`  
**Build method:** Local EAS preview APK (`APP_VARIANT=preview`)

## Why Samsung still showed the old UI

See `docs/design/ROOT_CAUSE_SAMSUNG_OLD_UI.md`.

Primary cause: devices on ≤0.1.8 binaries with system dark theme cannot receive 0.2.x JS via OTA (`runtimeVersion` = app version). Install this **0.2.6** APK after uninstalling older builds.

## Direct install

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.6/MileRecover-preview-0.2.6.apk

Also: `MileRecover-preview-0.2.6-foundation.2.apk` (same binary).

## Scope

- Phase: foundation reset — single production presentation layer
- All primary screens rebuilt against `docs/design/reference-crops/`
- Business engines preserved
- Preview: **Reset App To Brand New User**
- Diagnostics (preview): commit, runtime, channel, version, update ID, build timestamp

## Device evidence

`docs/assets/ui-evidence/device/0.2.6/`

- `raw/` — Android screenshots from this APK/commit
- `compare/` — reference | actual side-by-side
- `diff/` / `overlay/` — difference maps
- `meta.json` — APK/commit binding
- `MISMATCHES.md` — honest remaining differences (mostly empty-truthful vs collage sample data)

## Samsung install steps

1. Uninstall every older MileRecover build (`com.milerecover.app`)
2. Install the 0.2.6 APK above
3. Open app → Welcome (fresh install)
4. Profile → About / Diagnostics → confirm version `0.2.6`, runtime `0.2.6`, channel `preview-foundation-0.2.6`
