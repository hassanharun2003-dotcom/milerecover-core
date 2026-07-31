# Prototype H — PDF and reimbursement CSV golden output

**TIP letter:** H  
**Directory:** `prototypes/report-generation/`

## Question answered

Do on-device PDF, standard CSV, and employee reimbursement CSV match approved golden outputs for synthetic trip sets?

## Hypothesis

A deterministic template engine (library **TBD** — compare candidates in spike) produces stable hashes for golden fixtures offline.

## Minimal scope

- Synthetic confirmed trips → export artifacts
- Compare SHA-256 to golden files in `tooling/fixtures/`
- Column order per [Export Formats.md](../../architecture/Export%20Formats.md) DEC-022

## Explicit non-goals

- Server-side PDF
- Real CPA submission

## Success criteria

- Hash match on golden set
- CSV injection sanitization (`=`, `+`, `-`, `@` prefixes)

## Failure criteria

- Column mismatch vs DEC-022
- Non-reproducible output between runs

## Devices / environments

- Local Node or mobile spike — vendor TBD

## Data collected

- Golden hashes; template version id

## Privacy restrictions

- Synthetic trips only in golden files

## Expected artifacts

- Golden fixture directory + generator script doc
- PDF engine comparison memo (validation-required)

## Dependencies

- Domain trip shape stub

## Promotion / discard rule

Promote golden files + format rules; discard spike renderer until Phase 8 ADR picks engine.

## Required updates after completion

- Export Formats validation section
- Phase 8 exit gate evidence
