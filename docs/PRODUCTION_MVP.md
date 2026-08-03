# MileRecover Production MVP (0.1.4)

Branch: `cursor/production-mvp-29cb`  
Build label: `0.1.4-mvp.1` · Runtime: `0.1.4`

## What this build delivers

- Versioned onboarding completeness (product UI schema v4) with Finish-setup migration
- Tap-first 10-step onboarding with in-app car/route illustration
- Direct Profile editing (setup, vehicles, places, privacy, plans)
- Fast manual drive flow with native date/time pickers
- Real automatic capture engine (`expo-location` + `expo-task-manager`) gated by Plus entitlement
- Evidence-bounded recovery, Review + Undo, Proof CSV/PDF (PDF gated to Plus)
- Free / Plus / Pro capability matrix + value-triggered trial UI
- PurchasePort + store product contracts (store unavailable until console products exist)
- Local notification preference model + privacy export/delete
- Privacy-conscious analytics catalog

## Native note

`0.1.4` adds `@react-native-community/datetimepicker`, `expo-task-manager`, and `expo-notifications` on top of the 0.1.3 location/share/print stack. Install the new preview APK; OTAs for runtime `0.1.3` will not include these modules.

## Billing honesty

Paid entitlement is **never** granted from a local toggle. Until Play/App Store products and verification are configured, purchase CTAs return store-unavailable and Free remains active. See `docs/STORE_BILLING_SETUP.md`.

## Delivery IDs

- OTA update group: `198d82c4-b191-4e2b-b69d-c60275656034`
- Android update ID: `019fc7b9-3dd9-7395-a053-b960bacd087d`
- iOS update ID: `019fc7b9-3dd9-74e7-83e5-d9e5449c5418`
- Dashboard: https://expo.dev/accounts/milerecover/projects/milerecover/updates/198d82c4-b191-4e2b-b69d-c60275656034
- Commit: `eac03776ee40731a7d94611d230bdbe6c38bcae8`
- EAS Android build: _pending build finish_
- Direct APK: _pending GitHub prerelease_
- SHA-256: _pending_

## Physical acceptance checklist

1. Clean install → full onboarding  
2. Car/route visuals + tap-first personalization  
3. Deny and grant permissions without traps  
4. Background trip with screen off (Plus/trial entitlement required)  
5. App killed/reopened → checkpoints/trips preserved  
6. Manual trip in ≤4 decisions  
7. Review decision + Undo  
8. Recovery candidate (Plus)  
9. Proof totals + CSV share (PDF after Plus)  
10. Import CSV  
11. Trial offer after first confirmed work drive (no fake grant)  
12. Plans scroll without clipping; About shows `0.1.4-mvp.1`  
13. No fake user / mileage / paid plan in live mode  
