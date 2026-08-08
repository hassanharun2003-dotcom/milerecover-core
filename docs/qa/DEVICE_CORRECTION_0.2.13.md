# 0.2.13 Real-device correction pass

## Intent

Treat 0.2.12 as a Samsung QA baseline only. Do **not** publish 0.2.12 or 0.2.13 as production from this pass.

## Identity

| Field | Value |
|---|---|
| App version | `0.2.13` |
| Runtime | `0.2.13` |
| versionCode | `59` |
| Build label | `0.2.13-device-qa.1` |
| Preview channel | `preview-foundation-0.2.13` |
| Pricing SoT | `apps/mobile-expo/src/constants/pricing.ts` |
| Signed preview APK | See `docs/qa/PREVIEW_APK_0.2.13.md` |

## Google OAuth

Configured in EAS (preview/production/development) — see `docs/qa/GOOGLE_SIGNIN_0.2.13.md`.

- Android requires both Web + Android client IDs (distinct)
- No client secret in the mobile app
- CTA hidden when unconfigured; never fakes success

## Device checklist

See `docs/qa/DEVICE_QA_0.2.13_SAMSUNG.md`.
