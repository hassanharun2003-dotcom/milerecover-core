# Current preview delivery (deferred verification)

**Branch:** `cursor/physical-device-ux-fix-29cb`  
**Latest product commit:** see tip of `cursor/physical-device-ux-fix-29cb` (10× product upgrade is JS/domain; no new APK required).  
**APK baseline commit (embedded in published APK):** `11253c6d075f81feb155ca6183551cfcfc262a3a`

## Direct APK download (phone-friendly)

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.6/MileRecover-preview-0.1.6.apk

Latest alias (same release):

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.6/MileRecover-preview-latest.apk

Release page:

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/tag/android-preview-0.1.6

| Field | Value |
|---|---|
| Package | `com.milerecover.app` |
| versionName / runtime | `0.1.6` |
| versionCode | `16` |
| Channel | `preview` |
| Build label | `0.1.6-mvp.4` |
| Embedded commit | `11253c6d075f81feb155ca6183551cfcfc262a3a` |
| SHA-256 | `4a509da59ad67ce04e86ae01434c6361b9837dacb5251280d42e495239e6e836` |

## Expo / EAS Update

- Updates URL: `https://u.expo.dev/c61d0a3c-ba3d-40e1-9764-5118fa2429f3`
- Channel / branch: `preview`
- Project: `@milerecover/milerecover`
- Runtime: `0.1.6`
- Latest product OTA (10× upgrade — JS/domain):
  - Group: `019a4f50-8950-4a28-bc6a-346d7d95d8b5`
  - Android update ID: `019fcea0-e68c-7e2e-9ac1-414155c55c24`
  - iOS update ID: `019fcea0-e68c-7fb2-af03-4e96ae4ccd3b`
  - Dashboard: https://expo.dev/accounts/milerecover/projects/milerecover/updates/019a4f50-8950-4a28-bc6a-346d7d95d8b5
  - Message: `10x product upgrade: Protection Center, Review, Proof, Profile (APP_VARIANT=preview)`
- Prior post-install marker OTA (superseded on channel by product OTA above):
  - Group: `cb4c45b9-1ad5-4c86-9956-488ce33bdd76`
  - Android update ID: `019fce54-0ce2-7d30-ba73-b7429b322b45`
  - Marker: `OTA VERIFIED — BUILD 0.1.6 — 2026-08-04T19:40:00Z`

## Deferred / non-blocking

Emulator cold-start apply of the post-install OTA, additional package-manager reinstall loops, and further screenshot capture are **deferred and non-blocking**. Soft-emulator hangs (no KVM) blocked the last apply cycle after About verification already succeeded once.

Product work continues on JS/domain without waiting on emulator or a new APK unless native config changes.
