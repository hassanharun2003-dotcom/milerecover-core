# Product rules — Production Lock v1.0

Non-negotiable. Implementation agents must not weaken these for convenience.

## Monetization & data ownership

- Trial **NEVER** auto-starts.
- User deliberately starts trial via **Start free 7-day trial**.
- Historical user data is **NEVER** held hostage.
- **Free remains useful** indefinitely.
- Premium gates premium *actions* (automation, recovery capacity, advanced PDF, extra vehicles) — **not** historical ownership.
- Contextual paywalls at premium intent — never whole-app hostage screens.
- Restore purchases always available; restore must not silently start a trial.

## Home & navigation

- **One primary Home action** (contextual next-up). Optional secondary: Check for missed drives.
- Never duplicate **Add Drive** as competing primary CTAs on Home.
- Four tabs unchanged: Home · Review · Proof · Profile.

## Import / migration

- Neutral language before source detection (**Switch to MileRecover** / choose mileage file).
- Competitor names only after factual detection or supported-format help.

## Permissions & notifications

- No premature notification permission (not in early onboarding / Ready).
- Explain location **before** OS prompt; do not imply all OS prompts fire at once.
- Lock-screen privacy: no sensitive route details.

## Review prompt

- Only after positive moments (recovery success, cleared queue, successful export, healthy multi-day use, etc.).
- Cooldown required.
- Negative path → support/feedback, not forced store review.

## Integrity / honesty

- Google button **hidden** if OAuth secrets unavailable — never a silent no-op CTA.
- No fake map routes.
- No fake tax guarantees (rate is an estimate).
- No fake “healthy” tracking when location/background is missing.
- Recovery suggestions require confirmation before add.
- Protection Center status must be truthful (green only when verified healthy).
- Local-only data is **not** automatically an error (`Local data` / on-device is healthy for local-first users).

## Presentation

- Real country system: US · CA · GB · AU with consistent flag treatment.
- Rate formatting: **`$0.70 / mile`** — never “70 cents”.
- Missing free-limit uses MileRecover sheet with Upgrade / Add drive manually / Not now — never OK-only dead-end.

## Signing / release (out of scope for design, in scope for Cloud QA)

- Do not change package ID `com.milerecover.app`.
- Do not rotate/regenerate the protected preview signing identity.
- Do not publish until Android runtime QA passes.
