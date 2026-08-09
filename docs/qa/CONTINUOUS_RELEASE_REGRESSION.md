# Continuous Release Regression Matrix

Run locally with:

```sh
npm --prefix apps/mobile-expo test -- --runTestsByPath __tests__/releaseRegression.test.ts
```

| Scenario | Local pass/fail | PNG evidence path (if any) | Physical-device dependency |
| --- | --- | --- | --- |
| Fresh empty onboarding opens Welcome after domain + product migration | Automated pass in `releaseRegression.test.ts` | None | No |
| Protection stays `configured_waiting` with permissions OK until a confirmed capture exists | Automated pass in `releaseRegression.test.ts` | None | No |
| Reset app experience clears all local app/product/tracking/auth/manual keys | Automated pass in `releaseRegression.test.ts` | None | No |
| Manual trip validation rejects zero, negative, and above-maximum distance | Automated pass in `releaseRegression.test.ts` | None | No |
| Personal trips stay out of proof/report totals | Automated pass in `releaseRegression.test.ts` | None | No |
| Home and Proof totals match when the same reporting period is selected | Automated pass in `releaseRegression.test.ts` | None | No |
| Free automatic limit disables new automatic capture at 40 trips without deleting trips | Automated pass in `releaseRegression.test.ts` | None | No |
| Light and dark theme contrast checks return no failures | Automated pass in `releaseRegression.test.ts` + `visualQaHarness.test.ts` | `docs/assets/ui-evidence/png/*-light.png` and `*-dark.png` | No |
| Main tabs, each tab, Manual Trip, and Protection Alert render substantial customer copy | Automated pass in `releaseRegression.test.ts` + `visualQaHarness.test.ts` | `docs/assets/ui-evidence/png/home-live-*.png`, `review-pending-*.png`, `manual-trip-*.png`, `protection-*.png` | No |
| Launch fixtures (fresh install, each onboarding step, protection states, offline, limits, themes) | Automated pass in `visualQaHarness.test.ts` | `docs/assets/ui-evidence/png/fixture-*.png` | No |
| Onboarding step order remains five steps and empty state starts at Welcome | Automated pass in `releaseRegression.test.ts` | None | No |
