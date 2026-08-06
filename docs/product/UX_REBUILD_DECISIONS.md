# UX rebuild decisions (v8)

## Applied from research

| Decision | Rationale |
|---|---|
| 4 onboarding segments | Mobbin-style meaningful progress; reduce questionnaire fatigue |
| Compact protection row on Home | Status dashboards: one sentence + one action |
| Next-best-action single CTA | Removes competing See plans / finish setup stacks |
| Proof layered journey | Report apps: outcome → readiness → export |
| Profile summary groups | Settings architecture: short root, detail screens |
| Paywall Free as row | Avoid equal-height Free upsell card |
| Rescue separate route | Prevent subscription confusion |
| Diagnostics 7-tap | Customer screens stay clean |
| Trip rate snapshots | Historical honesty when country/unit changes |
| Store vs mileage currency split | RevenueCat owns subscription price; locale owns mileage value |

## Rejected

| Idea | Why |
|---|---|
| Swipe classification | Locked anti-pattern |
| Hardcoded production prices | Store must supply localized strings |
| Recalculating historical trips on country change | Breaks audit honesty |
| Showing OTA/runtime on Home | Internal diagnostics only |
| Blocking Home on missing auth | Local-first Free must work |

## Copy replacements

| Old | New |
|---|---|
| Automatic tracking is not dependable yet… | Manual tracking is active. Set up automatic protection when you’re ready. |
| All caught up + swipe lecture | You’re caught up / All confirmed work drives are ready for Proof. |
| 70¢/mi stored (CA active) | Review mileage rate + km-aware presentation |
| Tax record summary (all goals) | Adaptive title by goal |

## Native rebuild

**Not required** — JS/domain/UI only for this pass.
