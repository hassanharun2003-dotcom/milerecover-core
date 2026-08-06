# Current preview delivery — 0.2.6 foundation reset

**Branch:** `cursor/foundation-reset-0.2.6-29cb`  
**Build label:** `0.2.6-foundation.1`  
**App version / runtime:** `0.2.6` (explicit — isolated from 0.2.5 OTA)  
**Channel:** `preview-foundation-0.2.6`  
**Build method:** Local EAS preview APK (`APP_VARIANT=preview`)  

## Why Samsung still showed the old UI

See `docs/design/ROOT_CAUSE_SAMSUNG_OLD_UI.md`.

Primary cause: devices on ≤0.1.8 binaries with system dark theme cannot receive 0.2.x JS via OTA (`runtimeVersion` = app version). Install this **0.2.6** APK after uninstalling older builds.

## Direct install

Published after APK build completes — see GitHub release `android-preview-0.2.6`.

## Scope

- Phase: foundation reset — single production presentation layer
- All primary screens rebuilt against `docs/design/reference-crops/`
- Business engines preserved
- Preview: **Reset App To Brand New User**

## Device evidence

`docs/assets/ui-evidence/device/0.2.6/`
