# MileRecover 0.2.11 — design lock + launch candidate

## Identity

- versionName: `0.2.11`
- versionCode: `50` (final signed release)
- runtimeVersion / channel: `0.2.11` / `preview-foundation-0.2.11`
- package: `com.milerecover.app`
- signing: same preview keystore DN `CN=MileRecover Preview, OU=Engineering, O=MileRecover, L=London, ST=England, C=GB`
- SHA-1: `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31`
- APK (signed): `/opt/cursor/artifacts/apk/MileRecover-preview-0.2.11.apk`
- SHA-256 (first signed build): `609ddccda2725eb3c47c89e7590b22586a59184bbbddc8adbc41e48fec4535a8`

## Emulator acceptance screenshots

Directory: `/opt/cursor/artifacts/screenshots/0.2.11/`

| File | Result |
|---|---|
| `01-welcome.png` | Matches crop: logo, 3 icon benefits, Automatic tracking, Get started |
| `03-purpose.png` | Compact icon cards + Personal |
| `04-region.png` | Flag + dollar rate UX |
| `05-protection.png` | Compact benefits + Turn on / I'll add drives manually |
| `06-ready.png` | You’re all set summary |
| `07-home.png` | Ready to protect your first drive (zero-state), 3 metrics, Next up, CTAs |
| `08-review.png` | Needs review / Done chrome |
| `09-proof.png` | Period segments + zero metrics + chart (not empty-only cut) |
| `10-profile.png` | Compact rows + Switch to MileRecover + Version 0.2.11 |
| `11-vehicles.png` | Search + popular chips (no giant make cards) |
| `12-import.png` | Switch to MileRecover + competitor tags |
| `13-add-drive.png` | Manual/From other app, human date, More details |
| `14-missing.png` | Find the miles you missed + trust checks |
| `15-protection-center.png` | Compact hero + Fix rows + Run diagnostics |

## Material production UI changes

Mounted navigator components only — not unused fixtures.

## Product

- Competitor CSV detection (MileIQ / Everlance / Driversnote / TripLog / Stride / generic)
- Import preview: found / ready / duplicates / need attention
- Satisfaction-gated store review on positive moments
- Rate labels in dollars (`$0.70 / mile`), never cents

## Foundation preserved

- v1+v2+v3 resign path unchanged
- `checkAutomatically: NEVER`
- Four tabs unchanged
- Google CTA hidden when OAuth secrets absent
- Trial does not auto-start

## Still external

1. Google Cloud OAuth Android + Web clients with preview signing SHA-1/256
2. `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / Android client ID secrets on EAS
3. Optional Maps API key + RevenueCat live products

## PR

https://github.com/hassanharun2003-dotcom/milerecover-core/pull/21


## GitHub release

- Tag: `android-preview-0.2.11`
- Direct APK: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.11/MileRecover-preview-0.2.11.apk
