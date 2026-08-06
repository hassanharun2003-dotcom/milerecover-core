# Ultimate product foundation — implementation audit

Branch context: `cursor/physical-device-ux-fix-29cb`  
Scope: `apps/mobile-expo` + `packages/domain`  
Date: 2026-08-04

## Capability matrix (post-implementation)

| Capability | Status | Notes |
|---|---|---|
| Country config system | **EXISTS** | `packages/domain/src/localization/types.ts` — US/CA/GB/AU/OTHER |
| Effective-dated rates | **EXISTS** | `MileageRatePeriod` + `rateForTimestamp`; EditSetup closes prior periods |
| Review Work / Personal / Edit (no swipe) | **EXISTS** | Visible Work / Personal / Edit / Not sure / Not a drive |
| Protection status model | **EXISTS** | `resolveProtectionStatus` on Home + ProtectionAlert |
| Tracking lifecycle | **PARTIAL** | Real `trackingEngine`; no fabricated production engine |
| Recovery + provenance | **EXISTS** | Gap suggestions; confirm requires user distance |
| Proof readiness statuses | **EXISTS** | `proofReadinessForTrip` + Proof monthly summary |
| Country-aware reports | **EXISTS** | Tone/disclaimer/estimates via `localeProfile` in `buildMileageReportData` |
| Onboarding country step | **EXISTS** | In `ONBOARDING_STEP_ORDER`; version **7** |
| Miles recovered metric | **EXISTS** | Home / Proof / report totals (calm, non-marketing) |

## System map (preserved)

| System | Ownership |
|---|---|
| Tabs | Home · Review · Proof · Profile |
| Launch gate | `startup/launchState.ts` + onboarding v7 completeness |
| Onboarding UI | `OnboardingFlow.tsx` + `CURRENT_ONBOARDING_VERSION = 7` |
| Tracking | `trackingEngine.ts` + expo-location TaskManager |
| Trips | `packages/domain/src/trips` |
| Recovery | `packages/domain/src/recovery` |
| Import | `packages/domain/src/import/csvImport.ts` |
| Proof/export | `export/report.ts`, `export/csv.ts`, `pdfReport.ts` |
| Entitlements | `entitlements/types.ts` + `PurchasePort` / RevenueCat port |
| Updates | `UpdateProvider` — blocked until Home unlocked |
| Auth | `ProductionAuthPort` — no fake sessions |

## Explicit non-goals / remaining blockers

Live Google OAuth without EAS client IDs · live RevenueCat without keys · auth backend undeployed · Bluetooth auto-start · bank linking · tax filing · invented mileage · competitor UI copying · store approvals.
