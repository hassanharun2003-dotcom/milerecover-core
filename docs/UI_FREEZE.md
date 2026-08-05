# MileRecover UI freeze

As of build label `0.1.6-mvp.1` (runtime `0.1.6`), the visual system and primary navigation remain frozen. 0.1.6 expands first-launch steps and wires production auth/billing ports without redesigning surfaces.

## Locked

- Palette: calm dark-green / light-green / white
- Tabs: Home · Review · Proof · Profile
- Onboarding visual language and editorial hero illustration
- Plans structure and Free / Plus / Pro / Rescue hierarchy
- Report / Proof structure
- Local-first, no invented miles or fake certainty / fake login / fake Plus

## Future work (non-UI unless proven necessary)

- Automatic trip detection and background location reliability
- Missing-drive recovery hardening
- Store product catalog + RevenueCat keys in production builds
- Auth session verifier backend (`AUTH_BACKEND_CONNECTED`)
- Optional cloud sync with explicit consent
- PDF generation pipeline
- Import hardening, analytics/attribution, store submission, legal review, monitoring

UI changes after this freeze require a verified usability, accessibility, compliance, or platform defect — not another broad redesign.
