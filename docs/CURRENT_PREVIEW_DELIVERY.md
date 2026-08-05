# Current preview delivery — 0.2.4 premium UI

**Branch:** `cursor/premium-ui-lock-29cb`  
**PR:** https://github.com/hassanharun2003-dotcom/milerecover-core/pull/14  
**APK source commit:** `9f45c37`  
**App version / runtime:** `0.2.4`  
**versionCode:** `30`  
**Build label:** `0.2.4-premium-ui.1`  
**Channel:** `preview`  
**Theme:** light only (canvas `#F7F9FC`, primary `#0F6B46`, deep `#073D2C`, mint `#E8F4EE`)  
**Build method:** Local EAS preview APK (`APP_VARIANT=preview`) after cloud free-plan Android quota was exhausted  
**Local EAS build id:** `f4a60fd5-9b87-497d-989d-498220f0f825`  
**Dev launcher:** absent (`expo-dev-client` / `expo-dev-launcher` / `expo-dev-menu` / `expo-dev-menu-interface` excluded)

## Direct install

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.4/MileRecover-preview-0.2.4.apk

Latest alias:

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.4/MileRecover-preview-latest.apk

Release: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/tag/android-preview-0.2.4

## Artifact checks

| Check | Result |
|---|---|
| SHA-256 | `8b8fed1cb8222773015fd925dd8953ab6ead838035cf27968f90fb75fa50cfc1` |
| Size | ~84.9 MB |
| Package | `com.milerecover.app` |
| versionName | `0.2.4` |
| versionCode | `30` |
| runtimeVersion | `0.2.4` |
| updates.enabled | `true` |
| Update channel | `preview` |
| Launchable activity | `com.milerecover.app.MainActivity` |
| DevLauncherPackage in dex | absent |
| expo-dev-menu in dex | absent |
| appVariant embedded | `preview` |

## Premium UI note
Welcome “Protect your miles. Protect your money.” · purpose labels (Employee / Self-employed / Delivery / Personal) · Home `ProtectionHero` with real YTD when trustworthy · month `MetricRow` · Missing drives intro · Review “Needs review” · Proof ready-to-share SoftPanel · Protection Center dark hero · PrivacyNote on Add Drive.

## Evidence labeling

| Kind | Path | Notes |
|---|---|---|
| Automated render / harness boards | `docs/assets/ui-evidence/actual/` | Compositional ScreenTestHarness captures — **not** device screenshots |
| Theme / fixture boards | `docs/assets/ui-evidence/png/` | Design-reference visual QA boards — **not** device screenshots |
| Real Android device screenshots | *(not produced in this agent VM)* | Emulator system images / physical device were unavailable |

## Phone QA
`docs/qa/PHONE_QA_15MIN.md`
