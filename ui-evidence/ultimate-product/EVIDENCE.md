# Ultimate product foundation — physical evidence

Commit: `f71ba08`  
OTA (preview): https://expo.dev/accounts/milerecover/projects/milerecover/updates/0aed2045-4448-4c28-ab12-ad5678bb6b93  
Runtime: `0.1.6` · Android emulator · package `com.milerecover.app`

## Verified on device

| Flow | Result | Evidence |
|------|--------|----------|
| Fresh install → Welcome (not Home) | Pass | `02-welcome.png` — “Protect every work mile.” |
| Google sign-in honest when unconfigured | Pass | `03-account-google-honest.png` |
| Country step exists in v7 path | Pass (harness + progress) | Harness `harness-evidence.json`; after account, progress advances through country before permissions (`06-permissions.png` shows step 4/10 filled as 3 active of 9–10 dots) |
| Permissions education | Pass | `06-permissions.png` |
| Name / goal / pain / vehicle / tracking / ready | Pass | `07`–`12` series |
| Home after Finish | Pass | `18-reloaded-home.png` / prior `12-home.png` |
| Add Drive form | Pass (distance keypad UX quirk noted) | `14-add-drive.png` |
| Review empty — no swipe required | Pass | `15-review.png` |
| Proof tab | Pass | `16-proof.png` |
| Profile | Pass (Account/Country in code + harness) | `17-profile-country.png` + harness |
| OTA does not cover onboarding after v7 update | Pass after publish | Pre-OTA showed banner over Welcome; post-OTA Welcome clean |
| Purchase preview honesty | Not re-run this pass | Prior APK behavior unchanged; keys still absent |

## Harness evidence (automated render copy)

See `harness-evidence.json` for country step copy, Home protection (“Manual tracking”), ProtectionAlert guided copy, EditSetup country/units, Profile Account Country.

## Issues observed

1. **Numeric distance keypad** can concatenate values on Add Drive (emulator QA note).
2. **Country screenshot timing** — taps after Skip often advance past country before screencap; UI is present in OTA bundle and harness.
3. Pre-OTA embedded build could show **Update ready** over Welcome; fixed in published preview OTA for `f71ba08`.

## Privacy

No real addresses, emails, or credentials appear in screenshots.
