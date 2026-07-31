# Prototype A — iOS tracking reliability

**TIP letter:** A  
**Directory:** `prototypes/ios-tracking/`  
**Phase:** 1 (after Phase 0 exit)

## Question answered

Can native Swift tracking reliably produce an offline trip draft with linked location evidence on a reference iPhone?

## Hypothesis

CLLocationManager + motion gating + deterministic state machine can achieve ≥10/10 successful drive→draft sessions on reference hardware without network.

## Minimal scope

- Standalone Swift target or minimal host app (not production RN)
- Implement [Tracking State Machine.md](../../architecture/Tracking%20State%20Machine.md) through Completed drive
- Persist raw events + trip draft locally
- Airplane mode during test drives

## Explicit non-goals

- React Native integration (Prototype C)
- Business classification, Proof Score, backend sync
- Map matching, snap-to-road

## Success criteria

- 10/10 real drives on reference iPhone produce exactly one draft with evidence
- Zero network calls during capture
- Diagnostic report archived

## Failure criteria

- Missed or duplicate drafts on >20% of drives
- Silent sample loss on app backgrounding

## Devices / environments

- iPhone 14+ (or current reference device)
- iOS 17+ reference; minimum OS validated separately

## Data collected

- Synthetic or team-authorized test routes only
- Aggregate metrics: detection latency, confidence, sample count
- No exact coordinates in shared report logs

## Privacy restrictions

- ADR-0004 synthetic data policy
- Reports use redacted summaries

## Expected artifacts

- Written report (pass/fail)
- Native diagnostic enum logs (no lat/long in release-style logs)

## Dependencies on earlier prototypes

- Phase 0 complete
- None (first native iOS validation)

## Promotion / discard rule

**Discard by default.** Informs Phase 3 production native module — promote patterns via ADR, not copy-paste.

## Required updates after completion

- TIP risk register (background tracking)
- Possible ADR for iOS sampling parameters (calibration-required thresholds)
