# Root cause — Samsung still shows the previous (dark) UI

**Date:** 2026-08-06  
**Branch:** `cursor/foundation-reset-0.2.6-29cb`  
**Scope:** Why a physical Samsung device can keep rendering the obsolete dark interface after image-lock work landed in the repo.

---

## Verdict

The production Expo APK mounts **one** Home: `apps/mobile-expo/src/screens/home/HomeScreen.tsx` via `RootTabs`. There is **no** feature-flag UI switch and **no** alternate Home wired into navigation.

A Samsung device showing a **near-black** interface is almost certainly still running a **≤0.1.8 binary** (system-dark theme path). Image-lock JS in the current repository **cannot** reach that device over OTA because `runtimeVersion` follows `appVersion`.

---

## What the APK actually mounts (current tree)

| Route | Component | Wired |
|---|---|---|
| Home | `screens/home/HomeScreen.tsx` | `RootTabs.tsx` |
| Review | `screens/review/ReviewScreen.tsx` | `RootTabs.tsx` |
| Proof | `screens/proof/ProofScreen.tsx` | `RootTabs.tsx` |
| Profile | `screens/profile/ProfileScreen.tsx` | `RootTabs.tsx` |
| Onboarding | `screens/onboarding/OnboardingFlow.tsx` | `App.tsx` launch gate |
| Add Drive / Protection / Subscription / Missing / Tracking | `screens/flows/SupportingScreens.tsx` | `RootNavigator.tsx` |

`apps/mobile/` contains a parallel RN CLI tree — **not** imported by the Expo APK.

---

## Duplicate inventory

| Path | Mounted by Expo APK? |
|---|---|
| `apps/mobile-expo/src/screens/home/HomeScreen.tsx` | **Yes** |
| `apps/mobile/src/screens/home/HomeScreen.tsx` | No |
| Same pattern for Review/Proof/Profile/Onboarding under `apps/mobile/` | No |
| Alternate `legacy/` / `old/` / `dark/` screen folders under mobile-expo | **None found** |

Presentation debt inside the shipped app is concentrated in **`SupportingScreens.tsx`** (monolithic flow screens) and any residual non-image-lock styling — not a second navigator.

---

## Dark UI historical path

| Era | Behavior |
|---|---|
| ≤ `0.1.8` | `userInterfaceStyle: 'automatic'` + `useColorScheme()` → dark canvas `#0A1410` on Samsung dark mode |
| ≥ `0.2.0` | Light forced (`userInterfaceStyle: 'light'`, ThemeProvider hard-forces light) |

Current tokens: canvas `#FFFFFF`. Dark semantic aliases deprecated to light.

---

## OTA / runtime isolation (primary delivery failure mode)

| Field | Value (pre-reset) |
|---|---|
| `runtimeVersion` | policy `appVersion` |
| Channels | `development` / `preview` / `production` |
| Updates | enabled for preview/production; `checkAutomatically: ON_LOAD`; `fallbackToCacheTimeout: 0` |

**Consequence:** A device on runtime `0.1.x` will **never** receive a `0.2.5` / `0.2.6` update. Only a new APK install changes the UI.

Secondary risks on `0.2.x` devices: wrong APK URL / GitHub “Latest” pointing at older releases; Expo update cache delaying a newer same-runtime OTA (explains stale *light* UI, not near-black).

---

## Onboarding / backup

- Storage: product-ui keys + app-state; completion requires matching `CURRENT_ONBOARDING_VERSION`.
- `android.allowBackup: false` — Auto Backup should not restore AsyncStorage on current APKs.
- Upgrade-in-place keeps storage; stale onboarding versions should re-enter setup.

---

## Ranked hypotheses

1. **Stale ≤0.1.8 APK still installed** (highest) — dark theme binary; OTA blocked by runtimeVersion.
2. **Wrong APK downloaded** (high) — pipeline docs / Latest release pointing at older builds.
3. **Visual misread of deep-green chrome** (medium) — headers/heroes are near-black green on white canvas.
4. **Stale OTA on same 0.2.x runtime** (low for dark) — can delay light UI updates.
5. **Duplicate Home mounted** — **ruled out**.
6. **Backup restore skipping Welcome on current APKs** — **ruled out** (`allowBackup: false`).

---

## Foundation-reset countermeasures (this branch)

1. Bump app to **`0.2.6`** with **explicit isolated runtime + channel** so no prior OTA can replace the embedded bundle.
2. Rebuild **all** production screens from `docs/design/reference-crops/` + `IMAGE_LOCK_SPEC.md`.
3. Collapse presentation into one `MR*` design system; rewrite SupportingScreens flows.
4. Preview-only **Reset App To Brand New User**.
5. Embed build diagnostics (commit, runtime, channel, version, update id, timestamp).
6. Ship installable APK built only from the final commit; prove with real Android screenshots from that APK.
