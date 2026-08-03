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
