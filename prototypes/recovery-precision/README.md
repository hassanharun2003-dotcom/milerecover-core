# Prototype J — Recovery candidate precision

**TIP letter:** J  
**Directory:** `prototypes/recovery-precision/`

## Question answered

Do seeded gap scenarios produce recovery candidates with acceptable false-positive rate (<30% dismiss on valid gaps)?

## Hypothesis

Deterministic gap detector + evidence gates yields useful candidates without silent trip creation.

## Minimal scope

- Harness with synthetic trip timelines + injected gaps
- Generate candidates only — **never** auto-promote to trips
- Measure accept vs dismiss vs remind-later

## Explicit non-goals

- Calendar integration (separate server-assisted phase)
- AI-generated candidates
- Production Review UI

## Success criteria

- Dismiss rate <30% on seeded valid gaps
- Zero auto-created trips

## Failure criteria

- Dismiss >50% on valid gaps
- Any candidate becomes trip without explicit confirm action

## Devices / environments

- Domain-level harness; optional mobile UI stub

## Data collected

- Candidate counts, confidence distribution, dismiss reasons (enum)

## Privacy restrictions

- Synthetic timelines only

## Expected artifacts

- Metrics report
- Harness fixture definitions

## Dependencies

- Phase 2 domain; Phase 7 production uses results

## Promotion / discard rule

Promote detector rules to `packages/domain`; discard harness UI.

## Required updates after completion

- Recovery Engine precision notes
- Phase 7 exit gate

## Required product alignment

- DEC-004, DEC-021 — user confirm only
