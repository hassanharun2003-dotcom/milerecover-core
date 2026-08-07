# MileRecover 0.2.12 — Figma production lock RC

## Identity

| Field | Value |
|---|---|
| Branch | `impl/figma-production-lock-0.2.12` |
| Implementation commit | `9c60af51f018ccd9aa729d1c321693447f17fc3a` |
| Docs commit (this file) | see git history on branch |
| versionName | `0.2.12` |
| versionCode | `54` |
| runtimeVersion | `0.2.12` |
| preview channel | `preview-foundation-0.2.12` |
| build label | `0.2.12-figma-lock.1` |
| package | `com.milerecover.app` |
| Signing DN | `CN=MileRecover Preview, OU=Engineering, O=MileRecover, L=London, ST=England, C=GB` |
| Cert SHA-1 | `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31` |
| Cert SHA-256 | `E4:3C:30:99:0A:9C:2A:DE:1B:60:5C:EB:CA:78:79:14:9A:C3:25:89:C9:46:8C:42:84:F0:41:9E:9B:43:F3:4D` |
| Signing schemes | v1=true, v2=true, v3=true |
| APK filename | `MileRecover-preview-0.2.12.apk` |
| APK size | `46717835` bytes |
| APK SHA-256 | `cd1f8f9f76fcce625c360c54499eea45a188efd45bc4afd86914f350dc46e7f2` |
| Build path | EAS local preview (`APP_VARIANT=preview`) + `npm run sign:android-apk` with recovered preview keystore |
| ABIs | `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64` |
| GitHub release | https://github.com/hassanharun2003-dotcom/milerecover-core/releases/tag/android-preview-0.2.12 |
| Direct APK | https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.12/MileRecover-preview-0.2.12.apk |

## QA

| Check | Result |
|---|---|
| mobile-expo tests | 148/148 passed |
| domain tests | 123/123 passed |
| typecheck:domain | green |
| typecheck:mobile-expo | green |
| `npm run check:all` | green |
| APK gate (`gate:android-apk`) | PASS (install + Welcome + alive) |
| Clean install → Welcome/intro | PASS |
| Onboarding → Home | PASS |
| Force-stop → reopen → Home | PASS |
| No startup fatal | PASS |
| Notification prompt timing | After Home (deferred) — PASS |
| Home duplicate Add Drive CTA | PASS (single contextual primary: Turn on protection) |

## Emulator screenshots

Directory: `/opt/cursor/artifacts/screenshots/0.2.12/`

| File | Visual vs locked Figma |
|---|---|
| `01-welcome.png` | PASS |
| `01b-auth.png` | PASS |
| `02-purpose.png` | PASS |
| `03-region.png` | PASS |
| `04-protection.png` / `04b-permission.png` | PASS |
| `05-ready.png` | PASS |
| `06-home.png` / `07-reopen-home.png` | PASS |
| `08-review.png` | PASS |
| `09-proof.png` | PASS |
| `10-profile.png` | PASS |
| `11-add-drive.png` | PASS |
| `12-vehicles.png` | PASS |
| `13-import.png` | PASS |
| `14-protection-center.png` | PASS |
| `15-notifications.png` | PASS |
| `16-plans.png` | PASS |
| `17-missing-drives.png` | PASS |

Samsung hardware visual verification remains founder-side.

## Design lock

Figma production design is locked. No visual redesign in this RC.
Implementation ancestors: `9567087`, `9a4cbc2`, handoff `9c60af5`.

## External (non-blocking for preview APK)

1. Google OAuth Android + Web clients with preview signing fingerprints + EAS secrets
2. Optional Maps API key
3. RevenueCat / live Play Billing products

App degrades truthfully when secrets/products are absent (Google CTA hidden; maps/billing unavailable states; trial does not auto-start).
