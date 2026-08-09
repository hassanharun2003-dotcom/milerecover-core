# MileRecover 0.2.9 — product + image-lock proof

## Release
- Tag: `android-preview-0.2.9`
- APK: `MileRecover-preview-0.2.9.apk`
- SHA-256: `419471e5cae08524ffcbb64f995476c3b469173443ab569646d590ad59907824`
- package `com.milerecover.app` · versionName `0.2.9` · versionCode `45`
- runtime/channel: `0.2.9` / `preview-foundation-0.2.9`
- Signing: v1+v2+v3 · DN `CN=MileRecover Preview, OU=Engineering, O=MileRecover, L=London, ST=England, C=GB`
- ABIs: arm64-v8a, armeabi-v7a, x86, x86_64

## Emulator proof
- GitHub-downloaded asset installs (`adb install` Success) and launches.
- Welcome → Auth (Google hidden without OAuth secrets) → Purpose → Region → Protection → Ready → Home.
- Home zero-state: **Ready to protect your first drive** (no “You've protected”).
- Screenshots: `/opt/cursor/artifacts/screenshots/0.2.9/`

## Google Sign-In
OAuth client IDs not present in EAS preview env. Button hidden until secrets set.
See `docs/qa/GOOGLE_SIGNIN_0.2.9.md` (package + SHA-1 for preview keystore).

## Maps
`react-native-maps` wired; without `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` uses recorded-point polyline fallback.
