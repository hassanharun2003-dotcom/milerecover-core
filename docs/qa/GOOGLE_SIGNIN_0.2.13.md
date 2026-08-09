# Google Sign-In — 0.2.13

## Status

Both OAuth client IDs are configured in **EAS project environments** (preview / production / development) as plaintext `EXPO_PUBLIC_*` variables (client IDs, not secrets).

| Variable | Role |
|---|---|
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | RN Google Sign-In `webClientId` / idToken |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Android OAuth client for package + SHA-1 gate |

Android availability requires **both** IDs and they must be distinct. The Web client ID is never used as the Android client ID.

No Google **client secret** is used in the mobile app or Expo public env.

## Package + signing identity (protected preview)

| Field | Value |
|---|---|
| Application ID | `com.milerecover.app` |
| Alias | `milerecover` |
| SHA-1 | `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31` |
| SHA-256 | `E4:3C:30:99:0A:9C:2A:DE:1B:60:5C:EB:CA:78:79:14:9A:C3:25:89:C9:46:8C:42:84:F0:41:9E:9B:43:F3:4D` |

Do **not** rotate this keystore. Do **not** substitute an unrelated EAS remote keystore SHA for this protected preview identity.

## Fresh-install product flow

Welcome/auth (MileRecover + Continue with Google) → native account chooser → onboarding purpose → country/rate → tracking education → permission education → Ready → Home.

## EAS configuration command (already applied)

```bash
cd apps/mobile-expo
eas env:set preview --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value <web-id> --visibility plaintext --non-interactive
eas env:set preview --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value <android-id> --visibility plaintext --non-interactive
```
