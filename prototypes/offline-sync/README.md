# Prototype E — Offline sync conflict handling

**TIP letter:** E  
**Directory:** `prototypes/offline-sync/`

## Question answered

When the same trip classification is edited on two offline devices, does the system avoid naive last-write-wins data loss?

## Hypothesis

Documented merge matrix + user conflict UI (or deterministic rule for non-conflicting fields) preserves audit trail and user intent.

## Minimal scope

- Simulated two-device offline edits (can be Node + in-memory store initially)
- Scenarios: classification conflict, delete vs edit, tombstones
- No production backend required — behavior spec + integration test harness

## Explicit non-goals

- Full PostgreSQL sync implementation
- Entitlements sync

## Success criteria

- Classification conflict never silently drops a confirmed user choice
- Tests pass for matrix in [Offline First.md](../../architecture/Offline%20First.md)

## Failure criteria

- Last-write-wins overwrites confirmed status or audit fields

## Devices / environments

- CI-runnable harness; optional two mobile simulators later

## Data collected

- Test scenario outcomes only; synthetic trip IDs

## Privacy restrictions

- No real multi-device user data

## Expected artifacts

- Test spec document
- Conflict UI wireflow reference for Phase 6

## Dependencies

- Domain types stub; Phase 2 domain helpful

## Promotion / discard rule

Promote **rules and tests** to `packages/domain` + sync module; discard throwaway harness if rewritten.

## Required updates after completion

- Offline First conflict matrix validation
- Sprint 3 sync language alignment
