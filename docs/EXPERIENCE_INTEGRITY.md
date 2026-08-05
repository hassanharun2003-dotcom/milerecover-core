# Experience Integrity — Personalized First Run

Build label: `0.1.2-preview.4` · Runtime: `0.1.2` · App: `apps/mobile-expo` only

OTA update group: `ed85da34-cb5d-477a-ab97-47bc3fdb1264`  
Android update ID: `019fc66f-e527-7a27-a723-5c7ee3656056`

## What changed

1. **Shared screen shells** (`src/design-system/screenShell.tsx`)
   - `TabScreen` — pads status-bar inset; tab bar owns bottom inset
   - `StackScrollScreen` — stack header owns top; pads Android nav inset
   - `FixedHeaderScrollScreen` — fixed header reserves layout space (Plans)
   - `OnboardingScreen` / `SafeFillScreen` — full-edge safe areas

2. **Tab icons** — `@expo/vector-icons` Ionicons (outline/filled), bold selected labels, bottom safe-area padding

3. **No invented production identity/mileage**
   - Live mode never reads `DEMO_SCENARIOS` unless `demoModeEnabled`
   - Default plan Free; paid selection is preview-only outside demo mode
   - Profile uses preferred name or neutral “Your account”

4. **Personalized onboarding** (6 steps) with goal + driving-type voice + next-best-action

5. **Migration** `@milerecover/product-ui/v1` → `v2` without keeping fake Plus / Primary vehicle

## Evidence

Deterministic UI copy: `docs/assets/ui-evidence/integrity-evidence.json`

## Physical-device checks (Android preview APK + this OTA)

1. Status bar never overlaps Home/Review/Proof/Profile heroes  
2. Tab icons are Home / checkmark / document / person (not □)  
3. Tab bar clears gesture/3-button nav  
4. Plans: fixed billing toggle does not cover cards while scrolling  
5. Fresh install shows Welcome → never Alex Johnson / 87.6 mi  
6. Restart onboarding from Profile → About or Help  
7. Demo mode (Internal preview tools) can show populated Proof; live mode empty stays honest  
