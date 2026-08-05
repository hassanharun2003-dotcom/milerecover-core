# Device visual mismatches — 0.2.5 Batch A/B (image-lock.2)

Evidence: Pixel 6 AVD (`sdk_gphone64_x86_64`, API 34, 1080×2400, TCG).  
APK: versionCode **32**, label **0.2.5-image-lock.2**.

## Verified on device after rebuild

| Screen | Verified |
|---|---|
| Welcome | Green brand mark, muted Skip, 3 benefits, dots, Get started → (no extra import link) |
| Auth | Progress **1 of 5**, Google primary, continue without account, truthful unavailable copy |
| Purpose | Progress **2 of 5**, four collage goal labels |
| Region | Progress **3 of 5**, country + $0.70/mi + estimate panel |
| Protection | Progress **4 of 5**, education + Turn on / Not now |
| Ready | You’re all set + Go to Home / Add my first drive |
| Home | Light canvas, greeting, `$0.00` / this year., 3 metric tiles, status, Next up, dual CTAs, 4 tabs |

## Honest remaining differences

| Item | Notes |
|---|---|
| Welcome pagination | 4 dots imply multi-page intro; product has one Welcome step |
| Auth / Ready | No collage tiles — protocol screens only |
| Region info icon | App uses check circle; collage uses “i” |
| Protection vs Protection Center | Onboarding education ≠ collage tile 08 |
| Home empty vs collage sample | Truthful `$0.00` / `0` miles vs collage `$487.32` / `1,264` |
| Home status tone | Amber “paused” when protection off vs collage mint “All systems normal” |
| Home Next up | Live next-best (“Turn on protection”) vs collage “Review 2 drives” |
| Crops provenance | Vision-derived working locks (original collage binary not on disk) |
| Emulator | TCG-only; ANRs occurred during earlier attempts — final set captured with wifi/data off |

## Out of scope this run

Review · Proof · Add Drive · Missing Drives · Protection Center · Profile · Subscription.
