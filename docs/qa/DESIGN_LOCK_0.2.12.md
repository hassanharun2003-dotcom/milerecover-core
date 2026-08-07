# MileRecover 0.2.12 — Figma production lock RC

## Identity (verified pre-build)

| Field | Value |
|---|---|
| Branch | `impl/figma-production-lock-0.2.12` |
| Commit | `9c60af51f018ccd9aa729d1c321693447f17fc3a` |
| versionName | `0.2.12` |
| versionCode | PENDING |
| runtimeVersion | `0.2.12` |
| preview channel | `preview-foundation-0.2.12` |
| build label | `0.2.12-figma-lock.1` |
| package | `com.milerecover.app` |
| Signing DN | `CN=MileRecover Preview, OU=Engineering, O=MileRecover, L=London, ST=England, C=GB` |
| Cert SHA-1 | `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31` |
| Cert SHA-256 | `E4:3C:30:99:0A:9C:2A:DE:1B:60:5C:EB:CA:78:79:14:9A:C3:25:89:C9:46:8C:42:84:F0:41:9E:9B:43:F3:4D` |

## QA (pre-build)

| Check | Result |
|---|---|
| mobile-expo tests | 148/148 passed |
| domain tests | 123/123 passed |
| typecheck:domain | green |
| typecheck:mobile-expo | green |
| `npm run check:all` | green |
| Working tree at QA | clean at `9c60af5` |

## Build / APK (PENDING until artifact exists)

| Field | Value |
|---|---|
| Build path | PENDING |
| APK path | PENDING |
| APK filename | `MileRecover-preview-0.2.12.apk` (target) |
| APK file size | PENDING |
| APK SHA-256 | PENDING |
| v1/v2/v3 | PENDING |
| ABIs | PENDING |
| GitHub release URL | PENDING |
| Direct APK URL | PENDING |

## Runtime / visual QA

| Check | Result |
|---|---|
| Clean install → Welcome | PENDING |
| Onboarding → Home | PENDING |
| Force-stop → reopen → Home | PENDING |
| Visual QA vs locked Figma | PENDING |

## Design lock

Figma production design is locked. No visual redesign in this RC.
Implementation ancestors: `9567087`, `9a4cbc2`, handoff `9c60af5`.

## External (non-blocking for preview APK)

1. Google OAuth Android + Web clients with preview signing fingerprints + EAS secrets
2. Optional Maps API key
3. RevenueCat / live Play Billing products

App must degrade truthfully when secrets/products are absent (no fabricated Google/Maps/billing success; trial does not auto-start).
