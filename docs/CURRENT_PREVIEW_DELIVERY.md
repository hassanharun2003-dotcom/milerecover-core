# Current preview delivery — 0.2.5 image-lock Batch A+B

**Branch:** `cursor/image-lock-protocol-29cb`  
**Build label:** `0.2.5-image-lock.2`  
**App version / runtime:** `0.2.5`  
**Channel:** `preview`  
**Build method:** Local EAS preview APK (`APP_VARIANT=preview`)  
**Dev launcher:** absent  

## Direct install

See GitHub release `android-preview-0.2.5` (APK artifact updated for image-lock.2 when published).

Artifact path (CI/agent): `/opt/cursor/artifacts/apk/MileRecover-preview-0.2.5.apk`

## Scope this run

Completed: Phase 0 · Phase 1 · Phase 2 · Batch A (Welcome/Auth/Purpose/Region/Protection/Ready) · Batch B (Home).  
Not started: Review · Proof · Add Drive · Missing Drives · Protection Center · Profile chrome · Subscription.

## Device evidence

`docs/assets/ui-evidence/device/0.2.5/`

- `raw/` — actual Android screenshots (Pixel 6 AVD, API 34, 1080×2400)
- `compare/` — side-by-side reference vs device
- `diff/` + `overlay/` — difference / blend images
- `meta.json` — device, viewport, commit, fixture state
- `MISMATCHES.md` — corrections and honest remaining gaps

## Notes

- Collage marketing panel excluded from crops.
- Auth and Ready have no collage tiles; captured as protocol screens.
- Home evidence uses truthful empty production state (no collage sample dollars injected).
