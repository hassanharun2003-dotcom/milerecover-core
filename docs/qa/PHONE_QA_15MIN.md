# MileRecover 0.1.9 — 15-minute real-device checklist

Use this only for what local automation cannot prove. Install the standalone preview APK (no Expo Go / no dev launcher).

**APK:** see `docs/CURRENT_PREVIEW_DELIVERY.md`  
**Package:** `com.milerecover.app` · **version:** `0.1.9` · **channel:** `preview`

## Before you start (1 min)

1. Uninstall any prior MileRecover build.
2. Install the 0.1.9 APK; confirm SHA-256 matches the delivery note.
3. Set the phone to **light** then later **dark** once during the run.

## Checklist (~15 min)

| # | Check | Pass? | Notes |
|---|---|---|---|
| 1 | Fresh install opens **Welcome**, not Ready | ☐ | |
| 2 | Complete onboarding → Home; Ready summary matches choices | ☐ | |
| 3 | Force-stop app mid-onboarding → resumes correct step | ☐ | |
| 4 | After completion, restart → Home (not onboarding) | ☐ | |
| 5 | Profile → Reset app experience (preview tools only) → Welcome again | ☐ | |
| 6 | System location permissions + background location grant path | ☐ | |
| 7 | Protection says **Configured — waiting for first drive** before any auto trip | ☐ | |
| 8 | Real short drive, screen off / app backgrounded → trip appears in Review | ☐ | Physical GPS |
| 9 | After first auto trip, protection may say Protected / verified language | ☐ | |
| 10 | Samsung / OEM battery optimization: app still captures or honestly says Needs attention | ☐ | |
| 11 | Force-close + reboot: pending trip / machine state recovers safely | ☐ | |
| 12 | Auto distance looks reasonable vs known route (not invented) | ☐ | |
| 13 | Trip details map: real route or honest one-point / no-route fallback | ☐ | |
| 14 | Report PDF/CSV share sheet opens | ☐ | |
| 15 | Billing sandbox / restore purchases (if test store account available) | ☐ | |
| 16 | Dark mode: headings, tabs, outline buttons readable | ☐ | |
| 17 | Manual Add drive: date + start/end time cancel/confirm stable | ☐ | |
| 18 | Enter 500 km → confirmation “long drive” before save | ☐ | |

## Failures

Treat every fail as a release blocker. Capture screenshot + steps, return to the agent for fix → regression → new preview APK.

## Explicitly not proven by this script

- Long-haul highway overnight tracking
- Full month of free-limit edge cases in production stores
- iOS TestFlight (Android APK focus for this preview)
