# Prototype F — Subscription entitlement reconciliation

**TIP letter:** F  
**Directory:** `prototypes/entitlements/`

## Question answered

Can store sandbox purchases reconcile to server state and offline client cache without wrong-tier access >1%?

## Hypothesis

A reconciliation flow (vendor TBD: RevenueCat vs custom StoreKit/Play + server) keeps tier consistent online/offline within grace rules.

## Minimal scope

- Sandbox purchase → webhook/poll → server record → client cache
- Offline cache TTL + Free limit behavior (block **new** auto captures, not record access)
- Compare approaches — **do not lock vendor in this brief**

## Explicit non-goals

- Web billing / Stripe
- Production App Store products submission

## Success criteria

- Tier correct after purchase, restore, and offline restart in test matrix
- Wrong tier <1% in scripted scenarios

## Failure criteria

- Paid features without valid entitlement
- Free record access blocked offline incorrectly

## Devices / environments

- Store sandbox iOS + Play internal testing

## Data collected

- Transaction IDs (sandbox), tier state enums — no real billing PII

## Privacy restrictions

- No production receipts in Git

## Expected artifacts

- Reconciliation sequence diagram
- Vendor comparison memo (validation-required)

## Dependencies

- Phase 6 prep; can start after Phase 0 with sandbox-only spike

## Promotion / discard rule

Discard spike; ADR required to lock entitlement vendor.

## Required updates after completion

- TIP §14, §33 open decisions
- No DEC entry for vendor — ADR only
