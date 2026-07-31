# MileRecover Technical Implementation Plan (Launch)

**Document owner:** Engineering / Architecture  
**Status:** Authoritative — pre-implementation program  
**Version:** 1.0  
**Last updated:** July 2026 (placeholder — update on approval)  
**Audience:** React Native, iOS, Android, backend, QA, security, analytics, release ops, Cursor agents

---

## 1. Document Control

### Approval roles

| Role | Responsibility |
|---|---|
| Mobile Engineering Lead | Native bridge, tracking, mobile architecture |
| Backend Lead | API, sync, jobs, infrastructure |
| Product | PRD alignment, phase gates |
| Security / Privacy | Threat model, encryption, deletion |
| QA Lead | Test strategy, device matrix |
| Founding Team | Phase approval, open technical decisions |

### Source documents

| Layer | Documents |
|---|---|
| Product | [Product Requirements Document.md](../docs/Product%20Requirements%20Document.md), [Product DNA.md](../docs/Product%20DNA.md), [MVP.md](./MVP.md) |
| Governance | [04 Trust Rules.md](../docs/04%20Trust%20Rules.md), [Growth and Sustainability Principles.md](../docs/Growth%20and%20Sustainability%20Principles.md) |
| Architecture | [System Architecture.md](../architecture/System%20Architecture.md), [Frontend.md](../architecture/Frontend.md), [Backend.md](../architecture/Backend.md), [Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md), [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md), [Offline First.md](../architecture/Offline%20First.md), [Recovery Engine.md](../architecture/Recovery%20Engine.md), [Security.md](../architecture/Security.md), [Data Model.md](../architecture/Data%20Model.md), [API.md](../architecture/API.md) |
| Decisions | [Decision Log.md](../docs/Decision%20Log.md) DEC-001–DEC-029 |

### Decision precedence

Constitution → Core Principles → Trust Rules → PRD → Product DNA → **this plan** → architecture specs → Sprint specs. Locked product decisions (pricing, tabs, recovery scope, review policy) are immutable here.

### Change control

1. Technical decision change → update Architecture Decision Inventory (§3) + Decision Log if locked.  
2. Phase scope change → Product approval + PRD cross-check.  
3. No phase may bypass Trust Rules or offline capture requirements.

### Definition of implementation-ready

Engineering may begin **Phase 0** when this plan is approved. **Phase 1** (native tracking validation) requires Phase 0 exit criteria. **Production feature UI** requires Phase 4+ prerequisites per §26–§27. Application code lives in a **separate application repository** — not `milerecover-core`.

---

## 2. Executive Technical Summary

### System shape

**Mobile-first, offline-first** React Native app with **native Swift/Kotlin tracking modules**, **encrypted local database** as operational source of truth for capture/review/export, and a **modular monolith backend** (TypeScript + PostgreSQL) for sync, entitlements, server-assisted recovery, and jobs. Capture **never requires** backend connectivity after initial account setup.

### Boundaries

| Concern | Owner |
|---|---|
| GPS sampling, FGS, reboot recovery | Native modules |
| Trip review, classification, Proof UI | Shared RN + domain layer |
| Trip draft creation from sensors | Native → local DB (not JS) |
| Recovery candidates | Local deterministic + optional server assist |
| Trip → confirmed | User action only |
| Proof Score | Deterministic local (Plus+) |
| PDF/CSV | Local generation launch-primary |
| Entitlements | Store + server reconcile + local cache |

### Primary technical risks

Background tracking reliability · OEM kills · duplicate trips · sync conflicts · entitlement drift · import format drift · battery · map/geocode cost · AI hallucination in suggestions

### Recommended implementation order

Phase 0 foundations → Phase 1–3 tracking + local data → Phase 4–5 app shell/review → Phase 6 sync → Phase 7–9 recovery/imports/proof → Phase 10 subscriptions → Phase 11 observability → Phase 12 hardening → Phase 13–15 release

See §26.

---

## 3. Architecture Decision Inventory

| Decision | Status | Rationale | Alternatives | Consequences | Validation | Owner doc |
|---|---|---|---|---|---|---|
| React Native shared UI | **Locked** (DEC-001) | Team velocity, parity | Fully native, Flutter | Native bridge required | Sprint 1 POC | [Frontend.md](../architecture/Frontend.md) |
| Native Swift/Kotlin tracking | **Locked** (DEC-002) | OS background policy | RN-only location | Two native codebases | Phase 1 prototypes A,B | [Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md) |
| Offline-first local operational SOT | **Locked** (DEC-003) | Field use, trust | Server-primary | Sync complexity | Phase 0 prototype E | [Offline First.md](../architecture/Offline%20First.md) |
| Modular monolith backend | **Locked** (DEC-030) | Small team, auditability | Microservices, K8s | Single deploy unit | Staging load test | [Backend.md](../architecture/Backend.md) |
| TypeScript backend | Recommended | RN TS parity, hiring | Go | Node runtime ops | Phase 6 spike | Backend.md |
| PostgreSQL authoritative server DB | Recommended | Relational integrity, sync | Dynamo-only | Ops managed RDS | Phase 6 | [Database.md](../architecture/Database.md) |
| Local encrypted SQLite DB | Validation required | Offline, audit | Realm, server-only | Library choice TBD | **Prototype D** | §9 |
| WatermelonDB candidate | Validation required | RN offline patterns | raw SQLite, Realm | Not locked | Prototype D comparison | Frontend.md |
| Redis job queue | Recommended | Jobs, rate limit | SQS-only | Another managed svc | Phase 6 | Backend.md |
| S3-compatible object storage | Recommended | Exports, evidence | DB blobs | Cost/lifecycle rules | Phase 8 | Backend.md |
| Apple/Google/email auth | Locked (PRD) | Platform norms | Password-only | OAuth flows | Phase 6 | Security.md |
| RevenueCat or native + server reconcile | Validation required | Entitlements | Roll own only | Vendor eval | **Prototype F** | §14 |
| PostHog/Amplitude-class analytics | Validation required | Privacy config | Custom only | Event dictionary | Phase 11 | §20 |
| Sentry-class crash reporting | Recommended | Mobile stability | None | PII scrubbing config | Phase 11 | §19 |
| Mapbox vs Apple/Google maps | Validation required | Cost, SDK, privacy | Single vendor lock | Provider interface | Phase 5 spike | §3 maps |
| On-device PDF generation | Locked (PRD) | Offline export | Server-only PDF | Template engine choice | Prototype H | Export Formats |
| AI server-assisted suggestions | Locked scope | Plus+ features | On-device LLM | Outage fallback required | Phase 7 | AI Architecture |
| Bluetooth vehicle trigger | **Deferred** (DEC-027) | Unvalidated | Launch optional | Not in launch | N/A | MVP.md |
| Kubernetes | **Deferred** | Team size | ECS/Fargate, Fly.io | No K8s at launch | N/A | §32 |
| Event streaming (Kafka) | **Deferred** | Overkill | Redis queue | Simpler ops | N/A | §32 |
| Web billing | **Deferred** | Store-only launch | Stripe web | Not approved | N/A | PRD |

---

## 4. System Boundary Map

| System | Responsibilities | Data owned | Offline | Failure | Non-responsibilities |
|---|---|---|---|---|---|
| **RN application layer** | UI, navigation, domain orchestration | UI state | Reads local DB | Degrade gracefully | Raw GPS sampling |
| **iOS Tracking Module** | CLLocation, motion, background, buffer | Native event inbox | Full | Needs repair state | Business classification |
| **Android Tracking Module** | FGS, fused location, OEM hints, buffer | Native event inbox | Full | Needs repair | Business classification |
| **Local Data Layer** | SQLite, encryption, migrations, audit | Trips, evidence, queue | Full | Quarantine corrupt rows | Server reconciliation logic |
| **Sync Engine** | Push/pull, conflicts, cursors | sync_queue, cursors | Queue when offline | Retry/backoff | Trip detection |
| **Backend API** | Auth, sync apply, validation | Server copy of user data | N/A | 503 → client queues | Capture |
| **Auth Service** | Tokens, devices, OAuth | users, devices, sessions | Cached session | Re-auth prompt | Blocking capture post-setup |
| **Entitlement Service** | Store webhooks, plan state | subscriptions, IAP receipts | Local cache TTL | Free limits apply | Store purchase UI |
| **Recovery Services** | Calendar/import jobs, gap batch | recovery_candidates server copy | Client deterministic first | Queue retry | Auto-create trips |
| **Import Processor** | Parse, validate CSV | import_sessions | Preview local | Reject bad rows | Auto-confirm rows |
| **Report Generator** | Optional server PDF H2+; launch local primary | report_snapshots | Local launch | User retry | Alter trip records |
| **Notification Service** | FCM/APNs scheduling | notification_log | Queue | Skip non-critical | Tracking |
| **Analytics Pipeline** | Event ingest, aggregates | Anonymized events | Batch upload | Drop non-critical | Raw coordinates |
| **Support/Ops Tools** | Ticket lookup, entitlement fix | support_audit | N/A | Manual process | Invent records |

---

## 5. Mobile Application Architecture

### Layers

```
Presentation (screens, components)
  → Navigation (4 tabs, stacks — DEC-007)
    → State orchestration (view models / hooks — criteria: testability)
      → Domain (validators, Proof rules, entitlement rules, recovery lifecycle)
        → Repository interfaces
          → Local persistence adapter
          → Sync coordinator
          → Native bridge adapter
          → Remote API client
```

### Policies

- **No business logic trapped in UI components** — domain services enforce Trust Rules  
- **Dependency injection:** interface-based repos; default impl wired at app root (container or module pattern — validate in Phase 0)  
- **State management:** ephemeral UI in lightweight store; **trip records only in local DB**, not pure in-memory  
- **Native events:** ingested via bridge → native inbox table → domain processor (idempotent)  
- **Background coordination:** native owns tracking; RN subscribes to summaries and DB changes  

### Type boundaries

- `Trip`, `RecoveryCandidate`, `AuditEvent` — domain types  
- `TripEntity` — persistence mapping  
- `TripDto` — API sync (no raw GPS in default sync payload)

---

## 6. Native Tracking Architecture

### Native owns

OS location APIs · Motion/activity · Background execution · Android FGS · Permission observers · Reboot recovery · Battery optimization status · Sample collection · Native lifecycle · **Native buffer when RN unavailable** · Diagnostic signals

### Shared layer owns

Review · Classification · Purpose · Recovery UI · Protection Health presentation · Subscription UI · Reports/exports · User-confirmed edits · Cross-platform product rules (where safe)

### Bridge contract (conceptual)

| Message | Direction | Idempotent | Notes |
|---|---|---|---|
| `startTracking(config)` | RN→Native | Yes | Returns current state |
| `stopTracking(reason)` | RN→Native | Yes | |
| `getEngineStatus()` | RN→Native | Yes | |
| `onEngineStateChanged` | Native→RN | Dedupe by eventId | Summary only |
| `onTripDraftReady` | Native→RN | Dedupe by draftId | After local persist |
| `onDiagnostic` | Native→RN | Rate-limited | No coordinates in release logs |

**Versioning:** `bridgeVersion` in config; native rejects unknown major version.  
**Buffering:** Native writes to `native_event_inbox` before RN ack; ack deletes or marks processed.  
**Retry:** Native retries local persist; never drops samples silently without diagnostic.

---

## 7. Tracking Pipeline

| Step | Input | State | Persisted | Failure | User-visible |
|---|---|---|---|---|---|
| 1 Permission/readiness | OS permission flags | Idle/Limited | permission_snapshot | Denied → Limited | Protection Health |
| 2 Motion signal | CMMotion/Activity | Possible movement | sparse events | Ignore noise | None |
| 3 Candidate movement | Speed, motion | Drive candidate | events+ | Timeout→Idle | None |
| 4 Location sampling | GPS rules | Confirmed drive | full batch | Gap flag | None |
| 5 Trip start | Thresholds met | Confirmed drive | session_id | — | Optional passive |
| 6 Active trip | Continuous samples | Confirmed drive | batch | Kill→Needs repair | None |
| 7 Stop candidate | Speed/time | Possible stop | events | Resume→Confirmed | None |
| 8 Finalize | Stop confirmed | Completed drive | session summary | — | Pending trip |
| 9 Local persist | Draft | Completed→Idle | trip draft pending | Quarantine | Review later |
| 10 Review eligibility | Product rules | pending | — | — | Review tab |
| 11 Sync | Online | — | sync_queue | Retry | Sync indicator |
| 12 Proof | confirmed | — | proof factors | — | Proof tab |

**Thresholds:** calibration-required — see Phase 1 prototype I.

---

## 8. Tracking State Machine Validation

Authoritative states in [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md). Implementation plan extensions:

| State | User-facing? | Notes |
|---|---|---|
| Disabled | Yes (Protection off) | User pause |
| Permission limited | Yes | Not same as Idle |
| Ready | Internal | Maps to Idle + healthy |
| Possible movement → Completed drive | Internal | Engine states |
| Recovery required | Yes | Protection Health alias |
| Faulted | Internal | → Needs repair |
| Recovering | Yes | Post-fix scan |

**Illegal:** Drive candidate → trip draft without Completed drive (SM-5).  
**Crash/reboot:** Native reloads inbox + session; may enter Needs repair.  
**Out-of-order events:** Dedupe by `(sessionId, sequence)`.  
**Multi-device:** Tracking is **per-device**; trips sync merge — no simultaneous native recording on two devices assumed.

---

## 9. Local Data Architecture

### Responsibilities

Encrypted SQLite · Transactions · UUID primary keys · Immutable evidence tables · Mutable annotations · Append-only audit · Sync metadata · Soft delete tombstones · Import staging · Export staging · Native inbox · Entitlement cache · Diagnostic retention caps

### Database comparison (validation-required)

| Criterion | SQLite + typed layer | WatermelonDB | Realm | Native SQLite direct |
|---|---|---|---|---|
| Transactions | ✓ | ✓ | ✓ | ✓ |
| Encryption | SQLCipher layer | + layer needed | Built-in option | SQLCipher |
| RN stability | Good | Good | Moderate | Bridge only |
| Native module access | Good | Moderate | Moderate | **Best** |
| Migrations | Manual/Flyway-style | Built-in | Built-in | Manual |
| Auditability | **Best** | Good | Moderate | Good |
| Offline-first | Good | **Designed for** | Good | Good |
| Testing | Good | Good | Moderate | Harder RN |
| Maintenance | Low | Medium | Vendor lock | Low |

**Recommendation:** Complete **Prototype D** before locking. Leading candidates: **SQLCipher + typed repository layer** with optional WatermelonDB for RN observation layer if native-direct writes remain primary for GPS.

---

## 10. Server Data Architecture

**Authority:** PostgreSQL holds synchronized copy for backup, multi-device, jobs, entitlements — **not** primary capture path.

**Domains:** users · devices · vehicles · businesses · clients · trips (metadata + evidence refs) · audit_events · recovery_candidates · imports · reports · entitlements · notification_prefs · deletion_requests · sync_cursors

**Immutable on server:** evidence batch refs · audit append · original import file hash  
**Mutable with version:** trip classification · purpose · user annotations  
**Conflict metadata:** `server_version`, `device_id`, `client_mutation_id`

No SQL in this plan — see [Database.md](../architecture/Database.md), [Data Model.md](../architecture/Data%20Model.md).

---

## 11. Sync Architecture

- **Local-first creation** — all trips originate client with `client_id`  
- **Idempotency keys** — every mutation carries `client_mutation_id`  
- **No naive last-write-wins** for classification, confirmed status, or audit fields  
- **Tombstones** propagate deletes  
- **Clock-independent** — logical versions, not wall-clock trust  

### Conflict matrix

| Scenario | Resolution |
|---|---|
| Classification differs on 2 devices | User conflict UI; prefer confirmed + newer audit |
| Trip corrected on both | Merge fields if non-conflicting; else user picks |
| Deleted vs edited | User picks; tombstone wins if delete confirmed |
| Imported duplicate | Dedup by hash/time window → review item |
| Reconstructed confirm on one device only | Server accepts confirmed; other gets pull |
| Vehicle deleted with trips | Soft-delete vehicle; trips retain historical label |
| Business deleted | Historical trips retain snapshot |
| Account deletion during sync | Cancel queue; complete deletion job |

---

## 12. Recovery Architecture

See [Recovery Engine.md](../architecture/Recovery%20Engine.md).

| Layer | Examples |
|---|---|
| On-device deterministic | Gaps, edge repair, no-driving, known places |
| Server-assisted deterministic | Calendar compare, import gap analysis |
| AI-assisted explanation | Purpose, evidence summary — **never creates trip** |

**Candidate lifecycle:** detected → presented → accept | dismiss | remind_later → (accept creates trip with user confirm) → audit  
**AI outage:** Deterministic recovery continues; AI labels hidden.

---

## 13. Proof and Reporting Architecture

- **Proof Score:** deterministic local, versioned rules ([Proof Score.md](../architecture/Proof%20Score.md))  
- **Launch generation:** PDF, CSV, reimbursement CSV, Proof Package — **on-device**  
- **Snapshot:** export embeds rule version + trip states at generation time  
- **Personal-route privacy:** applied at export layer  
- **Server:** optional archive H2+; not required for launch export

---

## 14. Subscription and Entitlement Architecture

- **StoreKit / Play Billing** — purchase UI  
- **Server reconciliation** — webhooks + periodic poll  
- **Local cache** — TTL + grace; offline over-cap blocks **new** auto captures per Free rules, not record access  
- **Products:** Free, Plus, Pro, Mileage Rescue, Full-Year Rescue, Founding Member Pro (DEC-018, DEC-019)  
- **Promo entitlements:** internal only (DEC-028)  
- **No web billing** at launch

---

## 15. Security Architecture

Threat categories: credential theft · device loss · API abuse · malicious import · insider · legal request

Launch-critical reviews: local encryption · token storage · log redaction · deletion verification · signed URL exports · CSV injection · support access boundary

See [Security.md](../architecture/Security.md).

---

## 16. Privacy Architecture

Location minimization · precision reduction in analytics · personal-route hiding · calendar minimization (event time/place only) · import file lifecycle (delete after processing window) · no coordinates in analytics · synthetic staging data only

---

## 17. API Architecture

REST JSON v1 · Bearer auth · cursor sync · idempotent mutations · standard error envelope · rate limits · pre-signed uploads

### Launch endpoint domains

Auth · Devices · Sync push/pull · Trips validate · Recovery candidates · Imports · Reports (metadata) · Entitlements · Notifications prefs · Deletion · Health

See [API.md](../architecture/API.md), [api/openapi.yaml](../api/openapi.yaml).

---

## 18. Background Job Architecture

| Job | Trigger | Idempotent | User-visible |
|---|---|---|---|
| Import processing | Upload complete | Yes | Progress in Review |
| Gap analysis (server) | Schedule / request | Yes | Review items |
| Report archive | Optional H2 | Yes | Download link |
| Calendar compare | Opt-in sync | Yes | Review |
| Subscription reconcile | Webhook/cron | Yes | Profile tier |
| Notification schedule | Event | Dedupe key | Push |
| Account deletion | User request | Yes | Email confirm |
| Export cleanup | TTL | Yes | No |
| Retention cleanup | Policy cron | Yes | No |

Dead-letter: ops queue + alert; no silent drop for deletion jobs.

---

## 19. Observability and Diagnostics

- **Crash:** mobile crash reporter with PII scrubbing  
- **Native tracking diagnostics:** enum codes, no lat/long in production logs  
- **Backend:** structured logs, request tracing, metrics, alerts  
- **User diagnostic package:** opt-in export of redacted logs  
- **Severity:** S1 data loss · S2 tracking failure spike · S3 sync backlog · S4 report job fail

---

## 20. Analytics Event Governance

Owner: Product + Data. Dictionary in application repo `docs/analytics-event-dictionary.md` (to be created Phase 0).

**Prohibited properties:** exact coordinates · raw polyline · calendar title/body · client names · notes · import file contents

**Required instrumentation:** review prompt (DEC-026) · subscription funnel · recovery accept/dismiss · DMC inputs (aggregated)

See [10 Success Metrics.md](../docs/10%20Success%20Metrics.md).

---

## 21. Feature Flags and Remote Configuration

**Permitted:** gradual rollout · emergency disable AI · import format rollout · review prompt kill switch · safe numeric tuning within approved bounds

**Prohibited:** bypass user confirm · change store prices · invent limits · hide tracking failures · weaken privacy · mutable audit

---

## 22. Testing Strategy

| Layer | Scope |
|---|---|
| Unit | Domain, Proof, entitlements, sync merge, recovery lifecycle, export formatting |
| Native | iOS background, Android FGS, reboot, permissions, battery, buffer |
| Integration | Bridge, DB, sync API, imports, store sandbox |
| E2E | Onboarding → drive → review → export → upgrade |
| Field | Device/OEM matrix §23 |

**Regression gates:** golden exports (Prototype H) · phantom rate · offline 7-day · Trust Rule violations = 0

---

## 23. Device and Platform Validation Matrix

| Platform | Pre-implementation validation | Launch target (validate in Phase 1) |
|---|---|---|
| iOS | iPhone 14+ reference | iOS 16+ minimum (PRD); 17+ reference testing |
| Android | Pixel 7 reference | API 26+ minimum evaluate; API 28+ likely; 14 reference |

**OEM matrix (beta):** Samsung Galaxy A/S · Motorola · OnePlus if beta cohort justifies  
**Low-memory / aggressive battery devices:** explicit beta track

---

## 24. Technical Risk Register

| Risk | P | I | Detection | Mitigation | Gate | Fallback |
|---|---|---|---|---|---|---|
| Background tracking unreliable | H | H | Field tests, diagnostics | Native prototypes, OEM guides | Phase 1 exit | Manual trip path |
| Battery impact | M | H | Prototype I | Adaptive sampling | Beta | Conservative mode |
| OEM process kill | H | H | Protection Health | Whitelist education | Beta | Limited mode |
| Duplicate trips | M | M | Metrics | Dedup, state machine | Phase 3 | Review merge |
| False recovery | M | H | Accept rate, support | Evidence gates | Phase 7 | Dismiss-only |
| Map/geocode cost | M | M | Billing alerts | Provider caps, cache | Phase 5 | Labels deferred |
| Sync conflicts | M | M | Integration tests | Conflict UI | Phase 6 | User resolution |
| Entitlement errors | M | H | Reconcile job | Cache + restore | Phase 10 | Free limits |
| Import drift | M | M | Golden files | Strict parsers | Phase 9 | Reject rows |
| AI hallucination | L | H | Labeling, audits | Suggest-only | Phase 7 | Disable AI |
| Data deletion incomplete | L | H | Verification job | Deletion runbook | Phase 12 | Manual ops |
| App Store rejection | M | H | Pre-review checklist | Demo account | Phase 15 | Resubmit |

P/I = qualitative High/Medium/Low

---

## 25. Technical Validation Prototypes

| ID | Question | Success | Failure | Artifact |
|---|---|---|---|---|
| **A** iOS tracking | Reliable drive→draft offline? | 10/10 drives on reference iPhone | Miss >20% | Report + logs |
| **B** Android FGS | Same on Pixel | Same | OEM kill without banner | Report |
| **C** Bridge + buffer | RN kill mid-drive, no sample loss | 0 loss in test matrix | Any silent loss | Inbox schema |
| **D** Local encrypted DB | RN+native write, migration, encrypt | Benchmark + audit query | Corruption on crash | ADR |
| **E** Sync conflict | Classification conflict handled | User UI or rule passes tests | LWW data loss | Test spec |
| **F** Entitlements | Store sandbox→server→client | Tier correct offline/online | Wrong tier >1% | Reconcile doc |
| **G** CSV import | MileIQ/Everlance samples | 100% parse or explicit error | Silent row drop | Golden files |
| **H** PDF/CSV golden | CPA/employer sample outputs | Hash match golden | Column mismatch | Golden dir |
| **I** Battery/location | Daily % within target | <4% iOS, <5% Android | Exceed by 50% | Benchmark report |
| **J** Recovery precision | False candidate rate | <30% dismiss on seeded gaps | >50% false | Harness metrics |

Prototype code **disposable** unless promoted through Phase 0 repo setup.

---

## 26. Implementation Phases

| Phase | Objective | Exit criteria (summary) |
|---|---|---|
| **0** | Engineering foundations | App repo, CI, ADR for DB, bridge schema, analytics dictionary shell |
| **1** | Native tracking validation | Prototypes A,B,C,I pass |
| **2** | Local data + core domain | Prototype D; domain validators; migrations v1 |
| **3** | Tracking pipeline + Protection Health | End-to-end drive→pending on device; SM compliance |
| **4** | App shell + onboarding | 4 tabs; onboarding; permission education |
| **5** | Review + trip management | Exception review; trip detail; audit |
| **6** | Sync + account | Push/pull; conflicts; auth |
| **7** | Recovery | Launch recovery scope; no silent trips |
| **8** | Proof + reports | Proof Score; PDF/CSV; golden H |
| **9** | Imports | Prototype G; gap analysis |
| **10** | Subscriptions | Prototype F; all SKUs |
| **11** | Notifications, analytics, review eligibility | DEC-026; event dictionary |
| **12** | Security, privacy, a11y hardening | Deletion test; pen test items |
| **13** | Internal alpha | Team dogfood 30 days |
| **14** | Closed beta | MVP criteria [MVP.md](./MVP.md) |
| **15** | Launch readiness | Store submission gates §31 |

**Parallel allowed:** Phase 0 docs + design; Phase 8 export templates while Phase 7 recovery; Phase 11 analytics schema early

**Excluded from early phases:** Bluetooth (DEC-027) · CPA portal · web app · K8s

---

## 27. Dependency Graph

| Blocker | Blocked |
|---|---|
| Phase 0 repo/CI | All code |
| Phase 1 tracking validation | Phase 3+, backend trip validation rules final |
| Phase 2 local DB | Phase 3–11 |
| Phase 3 tracking pipeline | Phase 5 review real trips |
| Phase 2 domain | Phase 5+ UI (real data) |
| Phase 6 sync | Multi-device, server backup |
| Phase 7 recovery | Import gap server jobs |
| Phase 8 proof | Paid export gating |
| Phase 10 entitlements | Paid features enforcement |
| Phase 12 hardening | Beta (Phase 14) |

**Backend investment** may start Phase 6 prep (auth skeleton) after Phase 1 shows tracking viability.

---

## 28. Team and Ownership Model

| Role | Owns | Approves |
|---|---|---|
| Product/Founder | PRD, phases, scope | Phase exit |
| RN engineering | App layer, domain, sync client | Bridge API |
| iOS native | Swift tracking module | SM transitions |
| Android native | Kotlin tracking module | FGS behavior |
| Backend | API, jobs, entitlements | Sync merge rules |
| Design | UX, a11y copy | Review flows |
| QA | Matrix, field tests | Release gates |
| Security | Threat reviews | Phase 12 |
| Analytics | Event dictionary | Phase 11 |
| Support ops | Help content | Export formats |

**Ambiguous zones forbidden:** who owns bridge schema (Mobile Lead) · who owns conflict rules (Backend + Mobile joint)

---

## 29. Definition of Ready

Feature ready when: PRD § exists · tier defined · offline/error defined · analytics defined · a11y · privacy/security impact · acceptance criteria · dependencies resolved · no locked decision violated

---

## 30. Definition of Done

Functional acceptance · automated tests · native device validation · offline validated · a11y · privacy/security checklist · analytics verified · support docs · observability · rollback flag · product + QA sign-off · zero open critical defects

---

## 31. Release Gates

| Gate | Requirements |
|---|---|
| Prototype complete | A–J pass or accepted risk |
| Architecture approval | This plan + DEC alignment |
| Native tracking readiness | Phase 3 exit |
| Data integrity | Audit + immutability tests |
| Offline readiness | 7-day zero loss |
| Recovery precision | Phase 7 metrics |
| Export correctness | Golden H |
| Subscription correctness | Sandbox E2E |
| Privacy/security | Phase 12 checklist |
| Accessibility | WCAG AA critical paths |
| Performance/battery | Prototype I targets |
| Internal alpha | 30-day dogfood |
| Closed beta | [MVP.md](./MVP.md) criteria |
| Store submission | Demo account, location justification |
| Public release | Rollout plan |

---

## 32. Deferred Technical Scope

Bluetooth (DEC-027) · employer portal · accountant dashboard · fleet admin · gig platform integrations · autonomous recovery · unlimited historical reconstruction · advanced hardware · **Kubernetes** · microservice split · **Kafka/event streaming** · web billing · full web app · international localization architecture beyond i18n strings

---

## 33. Open Technical Decisions

| Decision | Why | Options | Evidence | Gate | Owner |
|---|---|---|---|---|---|
| Local DB library | Native write + RN read | SQLCipher+repo, WatermelonDB, Realm | Prototype D | Phase 2 start | Mobile Lead |
| Entitlement vendor | Reconcile accuracy | RevenueCat vs custom | Prototype F | Phase 10 | Backend |
| Map/geocode provider | Cost, SDK, privacy | Mapbox, Apple/Google, hybrid | Cost spike | Phase 5 | Mobile |
| Backend hosting | Ops load | Fargate, Fly.io, Railway | Cost/reliability | Phase 6 | Backend |
| State management lib | Testability | Zustand, Jotai, other | Team preference | Phase 0 | RN |
| PDF engine on device | Offline export | react-native-pdf libs vs native | Prototype H | Phase 8 | Mobile |

**Do not reopen:** pricing · tabs · recovery scope · review policy · Bluetooth launch

---

## 34. First Implementation Prompt Boundary

After **approval of this plan**, the first code-generation prompt may **only**:

- Create application repository structure (Phase 0)  
- Configure CI lint/test shells without feature code  
- Add bridge **interface types** and ADR docs  
- Add analytics event dictionary scaffold  
- Add native module **empty targets** with bridge version constant  

The first prompt **must not**:

- Implement full tracking algorithm  
- Build production UI screens  
- Implement backend business logic beyond health check skeleton  
- Wire subscriptions  
- Deploy production infrastructure  
- Copy prototype throwaway code without review  

**Next prompt after Phase 0 exit:** Phase 1 prototype A/B in isolated branches.

---

## Related Documents

- [Sprint 1 Technical Spec.md](./Sprint%201%20Technical%20Spec.md) — subordinate; tracking POC detail  
- [MVP.md](./MVP.md) — product launch scope  
- [Product Requirements Document.md](../docs/Product%20Requirements%20Document.md)

---

*MileRecover — Implement truth first, scale second.*
