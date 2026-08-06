# Google Sign-In — 0.2.9 credential checklist

## Status

Code path uses `@react-native-google-signin/google-signin` and opens the **native Android account chooser** when OAuth client IDs are present at build time.

EAS preview environment currently has **no** `EXPO_PUBLIC_GOOGLE_*` variables. Without them the preview APK **hides** “Continue with Google” (never a silent no-op / never “not configured for this build” copy).

## Package + signing identity (preview keystore)

| Field | Value |
|---|---|
| Application ID | `com.milerecover.app` |
| Preview keystore | `apps/mobile-expo/credentials/milerecover-preview-release.keystore` |
| Alias | `milerecover` |
| SHA-1 | `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31` |
| SHA-256 | `E4:3C:30:99:0A:9C:2A:DE:1B:60:5C:EB:CA:78:79:14:9A:C3:25:89:C9:46:8C:42:84:F0:41:9E:9B:43:F3:4D` |

If EAS still signs with a different remote keystore, register **that** SHA-1 in Google Cloud as well (or resign with the preview keystore via `sign:android-apk`).

## External steps (Google Cloud Console)

1. Create (or open) a Google Cloud project for MileRecover.
2. Enable **Google Sign-In** / Google Identity.
3. Create an **Android** OAuth client:
   - Package name: `com.milerecover.app`
   - SHA-1: preview SHA-1 above (and EAS SHA-1 if different)
4. Create a **Web** OAuth client (required by the RN Google Sign-In library for `idToken` / `webClientId`).
5. Set EAS environment variables (preview + production):

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web-client-id>.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<android-client-id>.apps.googleusercontent.com
# iOS when ready:
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<ios-client-id>.apps.googleusercontent.com
GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.<ios-reversed-client-id>
```

6. Rebuild the Android preview APK (`eas build --profile preview --platform android --local` or cloud).
7. On a device/emulator with Google Play Services + at least one Google account, tap **Continue with Google** — the system account chooser must appear.

## Optional Maps

Native route maps use `react-native-maps` when:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<Maps SDK key>
```

Without that key, Review/TripDetails keep the recorded-point polyline fallback (“Route unavailable” when fewer than 2 points). Trip evidence is never invented.
