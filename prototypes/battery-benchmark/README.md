# Prototype I — Battery and location sampling benchmark

**TIP letter:** I  
**Directory:** `prototypes/battery-benchmark/`

## Question answered

Does adaptive location sampling stay within battery targets (<4% iOS, <5% Android daily) on reference devices?

## Hypothesis

State-machine-gated sampling achieves targets on reference drives without missing success criteria from A/B.

## Minimal scope

- Instrument Prototype A/B builds or dedicated benchmark harness
- Measure daily battery delta over scripted drive days
- Compare sampling strategies — thresholds **calibration-required**, not locked here

## Explicit non-goals

- Production Power Health UI
- OEM-wide matrix (beta)

## Success criteria

- Within TIP targets on reference devices
- Documented tradeoff curve sampling vs miss rate

## Failure criteria

- Exceed targets by >50% without mitigation path

## Devices / environments

- Reference iPhone + Pixel, real drives, multi-day measurement

## Data collected

- Battery % delta, sample counts, state time distribution
- No coordinate logs in report

## Privacy restrictions

- Synthetic or team test routes

## Expected artifacts

- Benchmark report with recommendation for sampling tables
- Links to A/B results

## Dependencies

- Prototypes A and B running

## Promotion / discard rule

Discard harness; promote **sampling policy numbers** via calibration ADR after founder/engineering review.

## Required updates after completion

- Native Tracking Engine battery section
- TIP risk register (battery)
