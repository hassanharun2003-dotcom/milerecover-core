# MileRecover 0.2.13 — Samsung real-device QA checklist

**Status:** Device-QA candidate only. Do **not** publish production.  
**Baseline:** 0.2.12 signed APK was real-device QA only — not a production release.  
**Branch target:** `cursor/mile-recover-0.2.13-0cd3` (from `impl/figma-production-lock-0.2.12`).

## Google OAuth blocker (external)

Working Google Sign-In requires EAS / Google Cloud credentials that are **not** present in this environment:

| Missing | Purpose |
|---|---|
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | RN Google Sign-In `webClientId` / idToken |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Android OAuth client for `com.milerecover.app` + signing SHA-1 |
| Optional iOS: `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `GOOGLE_IOS_URL_SCHEME` | iOS Google Sign-In |

Without these, the APK **hides** “Continue with Google” (never fakes success). Fresh install may use **Continue without an account**, then onboarding → Home.

See `docs/qa/GOOGLE_SIGNIN_0.2.9.md` for package SHA-1 and Cloud Console steps.

## Pricing source of truth

`apps/mobile-expo/src/constants/pricing.ts`

- Plus **$9.99**/mo · **$95.90**/yr  
- Pro **$19.99**/mo · **$191.90**/yr  
- Yearly = monthly × 12 × 0.8 → **Save 20%**  
- Store / RevenueCat localized prices override when billing is available; otherwise fixtures + clear **Store unavailable**.

Samsung 0.2.12 showed $8.99 / $14.99 — treat that as store/stale inconsistency; catalog SoT is above.

## APK build plan (preview candidate — not production)

1. Ensure Google OAuth EAS secrets are set **or** accept Google CTA hidden.  
2. From repo root / `apps/mobile-expo`:

```bash
# Preview signed APK (channel preview-foundation-0.2.13)
cd apps/mobile-expo
APP_VARIANT=preview npx eas-cli build --profile preview --platform android --local
# or cloud:
# npx eas-cli build --profile preview --platform android

# Optional local resign with preview keystore:
npm run sign:android-apk -- <path-to-unsigned-or-eas-apk>
npm run gate:android-apk -- <path-to-signed-apk>
```

3. Confirm About shows **Version 0.2.13** / build `0.2.13-device-qa.1`.  
4. Install on Samsung; run checklist below.  
5. **Stop before production publication.**

Mapbox: **not** in this pass — later technical evaluation only.

---

## Samsung checklist

### A. Clean install
- [ ] Uninstall prior MileRecover
- [ ] Install 0.2.13 signed APK
- [ ] Cold start reaches Welcome (not Home)
- [ ] No crash / ANR on first paint

### B. Google account selection
- [ ] If OAuth configured: **Continue with Google** → native account chooser → success → onboarding
- [ ] If OAuth **not** configured: Google CTA hidden; **Continue without an account** works
- [ ] Never silent “success” without a provider response

### C. Onboarding
- [ ] Order: Welcome → Account → Purpose → Country/rate → Tracking education → Location education → Ready → Home
- [ ] Google (when available) happens **before** purpose/country

### D. Country / rate
- [ ] US/CA/GB/AU show ISO-driven flags (not blank emoji boxes)
- [ ] Rate shown in dollars (e.g. $0.70 / mile)
- [ ] Editable later in Edit Setup with same selector

### E. Permissions
- [ ] Location education before OS prompt
- [ ] Android location permission dialog appears when continuing protection setup
- [ ] Background / battery guidance available in Protection Center
- [ ] Notification OS permission **not** requested before Home value is established

### F. First Home
- [ ] Copy: **Protection is on** / **Waiting for your first drive.** (not “fully protected” with $0)
- [ ] Exactly **one** primary contextual CTA (e.g. Add your first drive)
- [ ] **Check for missed drives** is secondary only
- [ ] Hero opens **Protection Center** (not Missing Drives)

### G. Add Drive
- [ ] Work/Personal → Date → Start → End → Distance → Save
- [ ] More details remains progressive disclosure
- [ ] Privacy copy is user-facing (not developer/receipt jargon)
- [ ] Keyboard / scroll / footer Save usable on Samsung

### H. Review
- [ ] Empty state shows intentional artwork + copy
- [ ] Missing Drives is the recovery secondary action (no CTA spam)

### I. Proof
- [ ] Month → month label/data (not “year to date”)
- [ ] Quarter / Year / YTD labels match selection
- [ ] Empty state explains Work-classified drives populate reports

### J. Missing Drives
- [ ] Hero artwork renders as car/route scene (not a single green vertical line)
- [ ] Candidates show evidence + confidence
- [ ] Confirm required — nothing silently added

### K. Protection
- [ ] One primary action; Done is secondary/back
- [ ] Status rows: foreground location, background location, automatic protection, battery optimization
- [ ] Never “healthy/protected” if required protection unavailable
- [ ] Waiting-for-first-drive is honest

### L. Import
- [ ] Initial UI: choose export/CSV from current mileage app
- [ ] No MileIQ/Everlance/etc. before file pick
- [ ] Source named only after detection
- [ ] Never invents miles

### M. Profile
- [ ] Hierarchy unchanged
- [ ] About / Version = **0.2.13** (not 0.2.11 / 0.2.12)

### N. Notifications
- [ ] Categories unchanged
- [ ] Master toggle matches OS permission
- [ ] If OS denied → **Open Settings**
- [ ] No early OS notification prompt in onboarding

### O. Plans
- [ ] Title **Plans** (not redundant “Go Pro”)
- [ ] Plus $9.99 / Pro $19.99 (or clear store prices when billing live)
- [ ] Yearly Save 20% matches math
- [ ] Cards not clipped on Samsung
- [ ] Store unavailable state is clear; Free remains usable

### P. App relaunch
- [ ] Completed user returns to Home
- [ ] Trips / preferences persist

### Q. Upgrade preservation
- [ ] Install 0.2.13 over 0.2.12 with existing data
- [ ] Trips, onboarding completion, and locale preserved → Home

---

## Later evaluation (not this pass)

- Mapbox as map provider (keep Google Maps / polyline fallback for now)
- Production store listing / production channel publish
