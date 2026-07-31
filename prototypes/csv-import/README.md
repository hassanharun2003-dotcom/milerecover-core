# Prototype G — Competitor CSV import

**TIP letter:** G  
**Directory:** `prototypes/csv-import/`

## Question answered

Can MileIQ/Everlance-format samples parse with 100% explicit success or error — never silent row drop?

## Hypothesis

Strict parsers with golden synthetic files detect format drift and surface row-level errors for review.

## Minimal scope

- Parse hand-authored **synthetic** CSV files matching competitor column shapes
- Row validation, hash dedup preview, gap analysis input shape
- No auto-confirm imported rows as trips

## Explicit non-goals

- Production import UI
- Real customer export files in repo

## Success criteria

- 100% parse or explicit error on golden synthetic set
- Zero silent drops

## Failure criteria

- Any row silently skipped
- Distance inflated without user attestation

## Devices / environments

- Node or mobile-local parser spike

## Data collected

- Parse error catalog; row counts

## Privacy restrictions

- Synthetic format clones only; authorized internal real files **outside Git** if needed

## Expected artifacts

- Golden synthetic CSV set in `tooling/fixtures/`
- Parser error code list

## Dependencies

- Phase 0 fixtures policy

## Promotion / discard rule

Promote parser rules to `packages/domain`; discard spike code after rewrite.

## Required updates after completion

- Import architecture; Phase 9 entry criteria
