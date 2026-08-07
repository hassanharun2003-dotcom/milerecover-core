# 0.2.13 Real-device correction pass

## Intent

Treat 0.2.12 as a Samsung QA baseline only. Do **not** publish 0.2.12 or 0.2.13 as production from this pass.

## Identity

| Field | Value |
|---|---|
| App version | `0.2.13` |
| Runtime | `0.2.13` |
| Build label | `0.2.13-device-qa.1` |
| Preview channel | `preview-foundation-0.2.13` |
| Pricing SoT | `apps/mobile-expo/src/constants/pricing.ts` |

## Google OAuth

**BLOCKED** without external credentials:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- (iOS later) `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `GOOGLE_IOS_URL_SCHEME`

Code never fakes a successful Google login. CTA hidden when unconfigured.

## Device checklist

See `docs/qa/DEVICE_QA_0.2.13_SAMSUNG.md`.
