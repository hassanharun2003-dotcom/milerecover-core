# Ultimate UX v8 evidence

**Branch:** `cursor/ultimate-ux-rebuild-v8-29cb`  
**Method:** Deterministic React Native Testing Library screen renders (no emulator loop).  
**Native rebuild required:** No (JS/domain/UI only).

## Captured surfaces

| Surface | Artifact | Notes |
|---|---|---|
| Onboarding (4 stages) | `onboarding.json` | your_work / protect_drives / personalize / ready |
| Home | `home.json` | Compact protection + Next CTA; no OTA marker |
| Stack (Plans, Protection, Places, About, …) | `stack.json` | Paywall “Protect every work drive”; no RevenueCat customer copy |
| Profile | `profile.json` when present from prior runs | 5 IA groups |

## Screenshot automation status

Emulator/device screenshot capture was **not** re-run (soft emulator / no KVM; prior verification deferred). Text evidence manifests above are the authoritative render proofs for this pass.

## Canada / rate

`formatActiveRateLabel` for CA shows `¢/km · CAD`, not `70¢/mi stored`. Domain tests in `locale-rate-review.test.ts` cover this.

## Diagnostics

About version row unlocks Diagnostics after 7 taps. Package/runtime/channel/commit/OTA live only there.

## Paywall

One preview banner: “Purchases are disabled in this preview.” Rescue products on separate `RescueProducts` route.
