# Maps setup — MileRecover

## Current production behavior (ships in 0.1.8)

`RouteMapPreview` (`apps/mobile-expo/src/design-system/index.tsx`) draws **only recorded GPS points** with React Native Views.

- No Google Maps / Apple Maps SDK dependency  
- OTA-safe  
- Offline-safe  
- Never invents path segments  
- Empty / one-point → honest “Route” fallback  
- Review: compact preview; Trip details: larger replay  

This is the intentional fallback until native MapView credentials and a native rebuild are available.

## Future native MapView (not complete)

If adding `react-native-maps`:

1. `npx expo install react-native-maps`  
2. Configure Google Maps API key (Android) and Apple Maps (iOS entitlement)  
3. Keep `RouteMapPreview` as fallback when SDK missing or points < 2  
4. **Require a new native binary** — not an OTA-only change  

### Required environment variables (future)

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Add validation that fails CI config check when MapView is enabled without a key.

Do **not** mark native maps complete until keys exist, binary ships, and device QA passes.
