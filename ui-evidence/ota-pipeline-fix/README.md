# Android OTA pipeline fix — device evidence

## Device
- Emulator: `emulator-5554`
- Package: `com.milerecover.app`
- versionName / runtime: `0.1.6`
- Embedded channel: `preview` (unchanged; APK was already correct)

## Verification updates
| # | Marker | Update group | Android update ID |
|---|---|---|---|
| 1 | `OTA VERIFIED — BUILD 0.1.6 — 2026-08-04T17:15:00Z` | `48e53995-0bce-4eab-92b7-29ebbcbaca17` | `019fcdc5-2a69-7a90-b40a-0681e846ff06` |
| 2 | `OTA VERIFIED — BUILD 0.1.6 — 2026-08-04T17:30:00Z` | `d57748f9-735b-4caf-97ea-701b9d8c8226` | `019fcdd3-af55-7806-a9d6-bd80a6105162` |

## Screenshots
- `03-ota1-marker-home.png` — Home showing marker 1
- `04-ota2-marker-home.png` — Home showing marker 2 (no APK rebuild)

## Logs / DB
- `logcat-ota1.txt`, `logcat-ota1-apply.txt`
- `logcat-ota2-download.txt` — `CheckCompleteAvailable` for `019fcdd3-…`
- `logcat-ota2-apply.txt`
- `updates-db-ota1.txt`, `updates-db-ota2.txt`
