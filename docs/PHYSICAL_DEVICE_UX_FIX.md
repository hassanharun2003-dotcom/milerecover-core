# MileRecover — Physical-device UX and release fix (0.1.5)

Branch: `cursor/physical-device-ux-fix-29cb`  
Runtime / app version: `0.1.5`  
Build label: `0.1.5-mvp.1`  
Onboarding version: `CURRENT_ONBOARDING_VERSION = 5`

## Root causes

1. **Onboarding bypass** — completion used `completedAt` / minimum fields without an authoritative `completedOnboardingVersion`, so older installs skipped the updated essential flow.
2. **Manual trip form-heavy** — dual Start/End blocks, giant chips, Work/Personal/Later as equals, no sticky save, keyboard risk.
3. **Plans Annual “disappear”** — Plus/Pro stayed rendered above the fold while scroll offset was retained under a fixed header when toggling Annual; felt like cards vanished. Fixed by scrolling to top on period change and always rendering the same tier stack.

## Essential onboarding

Four screens: Promise → Goal → Trouble → Ready.  
Optional name / vehicle / places / permissions after Home via Finish setup card.

## Physical acceptance checklist

See PR description / final agent response.

## OTA

- Update group: `c95d56ad-5183-43fa-9c77-2aa104043360`
- Android update ID: `019fc975-93e1-7db4-ac59-552b4ef5e408`
- iOS update ID: `019fc975-93e1-7364-b81d-99508f7c05e5`
- Commit: `f3a07b7e784f83a2fbef5ec03fda5627883f0b7a`

## APK

- EAS build: `8073fb0d-41b9-4217-a3fe-e4dc59d68afe`
- GitHub release: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/tag/android-preview-0.1.5
- Direct APK: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.5/MileRecover-0.1.5-mvp.apk
- SHA-256: `2f1a3c5f574627d71f5cbb814ce79e5d465fdae6042add633856af54cbecd46a`

## Final polish pass (0.1.5-mvp.2)

Build label: `0.1.5-mvp.2` · Preview marker: `final polish preview`  
Commit: `2e41dfed9cad1ae644e8fd6eeb9711a81eed45d0`

Includes: polished onboarding hero illustration, CSV single-flight sharing, shared ListRow collision fix, Home milestone de-dupe, Manual drive usability, Plans billing clarity, goal-based report titles / route-not-added copy, Review empty-state polish, Profile Free coverage card.

### OTA (runtime 0.1.5 — installs on existing 0.1.5 APK)

- Update group: `d1a9ce1e-68ef-4e46-8577-5ba1189fcd49`
- Android update ID: `019fcae4-b28a-7263-81e6-682f2967b4a6`
- iOS update ID: `019fcae4-b28a-71b7-b991-dacffd5a0704`
- Dashboard: https://expo.dev/accounts/milerecover/projects/milerecover/updates/d1a9ce1e-68ef-4e46-8577-5ba1189fcd49

### APK (queued once — do not poll)

- EAS build: `a88d81ce-7850-4d64-ab9e-0ab66cef0840`
- Build URL: https://expo.dev/accounts/milerecover/projects/milerecover/builds/a88d81ce-7850-4d64-ab9e-0ab66cef0840
- Status at submit: queued / in progress (no prerelease APK attached until finished)

## MVP freeze polish (0.1.5-mvp.3)

Build label: `0.1.5-mvp.3` · Preview marker: `mvp freeze polish`  
Commit: `f2ab518790e58d69785850d7dbdcd769ded62b0c`  
UI freeze: `docs/UI_FREEZE.md`

Includes: deterministic launch state machine (no Home flash on fresh install), optional auth foundation (feature-flagged), purpose ChipRow, update prompt above tab bar, Proof PDF upsell (non-error), report title personalization, Profile stacked long values.

### OTA (runtime 0.1.5 — installs on existing 0.1.5 APK)

- Update group: `13c6534c-90c3-4fe0-ab46-26e10d1fdb5c`
- Android update ID: `019fcb37-ee29-72cf-961a-4e9c3bf2db94`
- iOS update ID: `019fcb37-ee29-7ee1-a7d6-5c7f3a847045`
- Dashboard: https://expo.dev/accounts/milerecover/projects/milerecover/updates/13c6534c-90c3-4fe0-ab46-26e10d1fdb5c

No new native APK required for this JS/OTA pass.

## Final MVP blockers (0.1.6-mvp.1)

Build label: `0.1.6-mvp.1` · Preview marker: `blocker fixes mvp`  
Runtime / app version: `0.1.6`  
Onboarding version: `CURRENT_ONBOARDING_VERSION = 6`  
Commit: `2df45e6a1b8e9ae08780a6fff75591e362c556e0`

Includes: full first-launch path (account + permissions education + personalization + vehicle + background protection), ProductionAuthPort (Google/Apple, no fake sessions), RevenueCat PurchasePort behind keys/flag, date-picker Cancel dismiss, Add Drive / Home / Review / Proof / Profile polish.

### Delivery

- **New APK required** — native modules (Google Sign-In, Apple Auth, RevenueCat). Cannot OTA onto 0.1.5.
- EAS preview Android build: `755f85c7-2b63-4949-bdfd-19ccd382859e`
- Build URL: https://expo.dev/accounts/milerecover/projects/milerecover/builds/755f85c7-2b63-4949-bdfd-19ccd382859e
- `versionCode` 10 (queued / in progress at submit)

### Remaining production infrastructure

- Google OAuth client IDs in EAS secrets (Android signing SHA-1: `8d787ac84f222e6b02f05899bcbf9776abadf13c`)
- RevenueCat public SDK keys (production auto-enables when key present)
- Auth session verifier backend (`AUTH_BACKEND_CONNECTED`)
- Store product catalog + Play/App Store approval

## Final ship blockers (0.1.6-mvp.2)

Build label: `0.1.6-mvp.2` · Preview marker: `final ship blockers`  
Commit: `c184874ec8940c748ae45d97b17d1881eb3efca5`

Includes: welcome car-on-road animation + “Protect every work mile.”, native Google picker path, permanent date Cancel/Back dismiss, RevenueCat production auto-enable + preview notice only.

### OTA (runtime 0.1.6 — installs on 0.1.6 APK)

- Update group: `6b34fa86-9399-42db-96cb-1ad207f248e7`
- Android update ID: `019fcbd6-9c6d-74aa-99a7-be77a75bccc4`
- iOS update ID: `019fcbd6-9c6d-7818-b02a-af81c0c40690`
- Dashboard: https://expo.dev/accounts/milerecover/projects/milerecover/updates/6b34fa86-9399-42db-96cb-1ad207f248e7
- Baseline APK: https://expo.dev/accounts/milerecover/projects/milerecover/builds/755f85c7-2b63-4949-bdfd-19ccd382859e
