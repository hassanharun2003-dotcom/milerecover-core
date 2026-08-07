# DESIGN LOCK — MileRecover Permanent Visual Authority

**Status:** Canonical package established; binary + Figma file pending founder actions  
**Date:** 2026-08-07

## Authority

The **exact attached approved design board** (to be stored at
`docs/design/canonical/MileRecover-LOCKED-DESIGN.png`) plus the Figma file
**MileRecover — Production Design Lock** (when write access exists) are
MileRecover’s **permanent visual authority**.

Until the binary is placed and hashed in `MANIFEST.json`, authority is declared
but **not yet measurable from pixels on disk**. Agents must not invent a
replacement collage.

## Rules for future agents

1. Future agents may **implement or repair** the design to match the locked
   authority.
2. They may **NOT redesign** MileRecover without **explicit founder approval**.
3. Do not simplify, reinterpret, or replace the locked visual language.
4. Do not treat prior implementation screenshots, emulator captures, or
   vision-reconstructed crops as the design reference when the canonical PNG
   exists.
5. Sample values in the original image (names, dollar amounts, mile counts,
   dates, routes) are **examples only**. Real production data remains dynamic.
6. Android system dialogs may retain **native Android** appearance.
7. All **app-controlled surfaces** must follow the locked design system
   (tokens, components, spacing, hierarchy).

## What is locked in this package

| Artifact | Path | Status |
|---|---|---|
| Canonical source image | `docs/design/canonical/MileRecover-LOCKED-DESIGN.png` | **PENDING_BINARY** |
| Manifest | `docs/design/canonical/MANIFEST.json` | Present |
| Direct screen crops | `docs/design/canonical/screens/` | **PENDING_CROP** |
| Design tokens (documented from approved board) | `docs/design/canonical/tokens/design-tokens.json` | Present |
| Country flag system | `docs/design/canonical/tokens/COUNTRY_FLAGS.md` | Present |
| Artwork inventory | `docs/design/canonical/assets/ARTWORK_INVENTORY.md` | Present |
| Figma implementation map | `docs/design/canonical/FIGMA_IMPLEMENTATION_MAP.md` | Present (IDs pending Figma) |
| Figma status | `docs/design/FIGMA_STATUS.md` | Present — no Figma write |

## Product simplicity (locked intent)

- One dominant primary action per screen
- No competing Home CTAs (“Add your first drive” **and** “+ Add a drive”)
- Work / Personal / Not sure classification only
- Empty states: one useful next action
- Subscriptions: FREE / PRO TRIAL / PRO; trial only after deliberate
  “Start Free 7-Day Trial”; after expiry historical data remains accessible;
  premium actions use contextual paywall (no whole-app hostage wall)

## Scope boundary for the lock task

This package establishes the **final design system documentation only**.
Application / product code must not be modified as part of establishing the lock.
