# Current preview delivery — 0.2.13 real-device correction

| Field | Value |
|---|---|
| Candidate version | `0.2.13` |
| Working branch | `cursor/mile-recover-0.2.13-0cd3` |
| Baseline (QA only) | `0.2.12` — do **not** publish as production |
| Runtime / channel | `0.2.13` / `preview-foundation-0.2.13` |
| Build label | `0.2.13-device-qa.1` |
| Pricing SoT | `apps/mobile-expo/src/constants/pricing.ts` |

## Status

**Device-QA candidate.** Automated tests + correction pass complete. Samsung checklist required before any wider release. **Do not publish production.**

## Docs

- `docs/qa/DEVICE_CORRECTION_0.2.13.md`
- `docs/qa/DEVICE_QA_0.2.13_SAMSUNG.md`
- Google OAuth credentials: still external — see `docs/qa/GOOGLE_SIGNIN_0.2.9.md`

## Build

```bash
cd apps/mobile-expo
npx eas-cli build --profile preview --platform android
# optional: npm run sign:android-apk / npm run gate:android-apk
```

Prior 0.2.12 delivery notes remain in `docs/qa/DESIGN_LOCK_0.2.12.md` as historical baseline only.
