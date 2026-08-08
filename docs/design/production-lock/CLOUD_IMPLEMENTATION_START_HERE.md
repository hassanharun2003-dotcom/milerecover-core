# Cloud implementation — START HERE

For a future **Cursor Cloud / phone** agent with **repository access only** (no live Figma MCP).

## 1. Read this directory first

```
docs/design/production-lock/
```

Order:

1. `README.md`
2. `PRODUCT_RULES.md`
3. `WORKFLOWS.md`
4. `DESIGN_TOKENS.md`
5. `COMPONENT_CONTRACT.md`
6. `SCREEN_IMPLEMENTATION_INDEX.md`
7. `screens/*.png` while implementing each screen
8. `MANIFEST.json` (do not replace canonical assets casually)

## 2. Non-negotiables

1. **Do not redesign.**
2. Use **PNGs + specs + tokens** as visual authority without Figma.
3. **Preserve existing product logic** (tracking, review, billing gates, permissions, navigation).
4. Implement **screen-by-screen**; run regression tests after each batch.
5. Compare **runtime screenshots** to `screens/*.png`.
6. **Do not change signing identity** / package ID `com.milerecover.app`.
7. **Do not fabricate** OAuth / Maps / RevenueCat credentials.
8. **Do not publish** until Android runtime QA passes.
9. Sample Figma numbers are **not** production data.
10. Platform-native dialogs may differ; document adaptations.

## 3. Implementation candidate (frozen UI impl)

| Item | Value |
|---|---|
| Branch | `impl/figma-production-lock-0.2.12` |
| Final impl commit | `9567087bbae3fa636cf92d6545c2ab5aca743227` |
| Checkpoint | `9a4cbc23898ff9c43381576ad29bdcdf8c754178` |
| Baseline | `ca3e7367db2fc5804b68cbf91dfc4cd39ad8aa2b` |
| Safety branch | `safety/pre-figma-impl-20260807-1040` (do not touch) |

## 4. Known automated QA (at freeze)

- Jest: **148/148** passed
- Typecheck: passed
- `npm run check:all`: passed

## 5. Known blockers (not design)

- Android **preview keystore** / EAS Free Android quota (signing identity must match SHA-1 `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31`)
- Google OAuth client IDs + EAS secrets
- Optional Maps API key
- RevenueCat live products

## 6. Suggested Cloud batches

1. Diff runtime vs `screens/` for onboarding + Home; fix only **FAIL** visual/product gaps proven on device.
2. Review / Proof / Add Drive fidelity pass.
3. Missing / Protection / Profile / Import / Vehicles / Notifications / Plans.
4. Build **real** preview APK with protected signing → emulator + founder Samsung QA → only then GitHub preview release `0.2.12`.

## 7. Figma (optional if MCP returns)

File: **MileRecover — Production Design Lock** · key `5y8p0axQChkYVBcM7tgHDj`  
If MCP unavailable, **this folder is sufficient**.
