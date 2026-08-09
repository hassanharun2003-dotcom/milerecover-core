# RevenueCat / store billing checklist

## Locked entitlements (domain)

| Plan | Automatic | Vehicles | Missing scans | CSV | PDF |
|---|---|---|---|---|---|
| Free | 40 / month | 1 | 1 / month | Yes | No |
| Plus / Pro | Per capability map | Higher | Higher | Yes | Yes |

Implementation: `packages/domain/src/entitlements/*`, offline-safe counters via trip `source === 'auto_detected'` + `startAt` month key.

## Code wiring status

| Piece | Status |
|---|---|
| `PurchasePort` + store-unavailable fallback | Done |
| RevenueCat port behind API keys | Done (`revenueCatPurchases.ts`) |
| PlanSelection purchase / restore UI | Done |
| Preview billing notice | Done |
| Live store product creation | **External** |
| Rescue → entitlement mapping completeness | Verify against `storeProducts.ts` before store submit |

## Environment variables (do not commit secrets)

```
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=
EXPO_PUBLIC_ENABLE_STORE_PURCHASES=1
```

## External steps before production billing

1. Create App Store / Play products matching identifiers in `storeProducts.ts`  
2. Configure RevenueCat offerings + entitlements (plus/pro/rescue)  
3. Sandbox purchase + restore on Android and iOS  
4. Verify Free auto-trip gate still works offline  
5. Verify Plus unlock does not block manual usage  
