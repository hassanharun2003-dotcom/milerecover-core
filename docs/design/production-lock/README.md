# MILE RECOVER DESIGN LOCK v1.0

**Figma:** MileRecover — Production Design Lock  
**File key:** `5y8p0axQChkYVBcM7tgHDj`  
**Status:** DESIGN + WORKFLOW PERMANENTLY LOCKED  
**Handoff date:** 2026-08-07

## Authority model

| Layer | Authority |
|---|---|
| **Figma file** | Visual / product UX authority (when accessible) |
| **This directory** | Implementation authority when live Figma MCP is unavailable |
| **`packages/config` tokens** | Runtime token source (must stay aligned with `DESIGN_TOKENS.md`) |
| **Working product logic** | Must be preserved — do not rewrite for cosmetic preference |

## What this directory contains

| File | Purpose |
|---|---|
| [CLOUD_IMPLEMENTATION_START_HERE.md](./CLOUD_IMPLEMENTATION_START_HERE.md) | Entry point for Cursor Cloud / phone agents |
| [SCREEN_IMPLEMENTATION_INDEX.md](./SCREEN_IMPLEMENTATION_INDEX.md) | Every major screen: node IDs, routes, actions, states |
| [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) | Exact colors, type, spacing, radii, shadows, gutters |
| [COMPONENT_CONTRACT.md](./COMPONENT_CONTRACT.md) | Reusable component variants and reuse rules |
| [WORKFLOWS.md](./WORKFLOWS.md) | Locked user journeys |
| [PRODUCT_RULES.md](./PRODUCT_RULES.md) | Non-negotiable product decisions |
| [MANIFEST.json](./MANIFEST.json) | Hashes + provenance for every exported asset |
| [screens/](./screens/) | PNG visual references for major locked frames |

Approved static artwork copies also live at:

`apps/mobile-expo/assets/design-lock/`

(Existing runtime illustrations remain under `apps/mobile-expo/assets/illustrations/`.)

## Rules for implementation agents

1. **Do not redesign.** No new visual direction, no “improving” locked layouts for taste.
2. **Preserve working product logic** (tracking, classification, billing gates, permissions, navigation).
3. **Sample numbers in Figma/PNGs are not production data** (`$487.32`, `1,264` mi, etc.).
4. **Platform-native dialogs** (OS permission sheets, store purchase sheets) may differ from Figma chrome.
5. **Accessibility / platform constraints** may justify *documented* adaptations (e.g. shipped primary `#1C8054` vs Figma `#1F8A5B` for WCAG AA white-on-green). Record any adaptation in code comments or QA notes.
6. **No visual redesign without explicit founder approval.**

## Untracked note (`app.json`)

Root `app.json` (`{"expo": {}}`) is an empty stub that predates this handoff, duplicates nothing required (`apps/mobile-expo/app.config.ts` is the real Expo config), and **must remain untracked** unless later proven intentional.

## Lock statement

> NO VISUAL REDESIGN WITHOUT EXPLICIT FOUNDER APPROVAL.  
> Future implementation agents may adapt only for platform constraints, accessibility, verified usability bugs, and real data behavior — not personal design preference.
