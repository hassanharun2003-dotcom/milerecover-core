# MileRecover Product Requirements Document (Launch)

**Document owner:** Product  
**Status:** Authoritative — Launch PRD  
**Version:** 1.0  
**Last updated:** July 2026 (placeholder — update on approval)  
**Audience:** Product, Design, React Native, Native (Swift/Kotlin), Backend, QA, Support, Analytics, Cursor agents

---

## 1. Document Control

### Approval roles

| Role | Responsibility |
|---|---|
| Product | PRD accuracy, scope, acceptance criteria |
| Design | UX flows, accessibility, copy |
| Mobile Engineering Lead | RN + native feasibility, offline/sync |
| Backend Lead | Auth, sync, subscriptions API |
| QA Lead | Test plans mapped to §25 |
| Support Lead | Help content, escalation paths |
| Founding Team | Final launch scope sign-off |

### Source documents (read before implementing)

| Layer | Documents |
|---|---|
| Governance | [Company Constitution.md](./Company%20Constitution.md), [03 Core Principles.md](./03%20Core%20Principles.md), [04 Trust Rules.md](./04%20Trust%20Rules.md), [Anti-Principles.md](./Anti-Principles.md) |
| Product identity | [Product DNA.md](./Product%20DNA.md), [02 Product Brief.md](./02%20Product%20Brief.md), [09 Pricing.md](./09%20Pricing.md) |
| Decisions | [Decision Log.md](./Decision%20Log.md) DEC-001–DEC-024 |
| Experience | [Experience Bible.md](../design/Experience%20Bible.md), [Design Bible.md](../design/Design%20Bible.md), [Interaction Rules.md](../design/Interaction%20Rules.md) |
| Architecture | [Frontend.md](../architecture/Frontend.md), [Data Model.md](../architecture/Data%20Model.md), [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md), [Recovery Engine.md](../architecture/Recovery%20Engine.md), [Proof Score.md](../architecture/Proof%20Score.md), [Export Formats.md](../architecture/Export%20Formats.md) |
| Planning | [MVP.md](../planning/MVP.md), [Launch Plan.md](../planning/Launch%20Plan.md) |

### Decision precedence

When this PRD conflicts with another document, resolve per README hierarchy: Constitution → Core Principles → Trust Rules → Anti-Principles → **Product DNA** → Interaction Rules → Experience Bible → Architecture → Decision Log → Roadmap. **Locked decisions DEC-007–DEC-024 override informal drafts.**

### Change control

1. Proposed behavior change → Feature Admission Test ([Product DNA §10](./Product%20DNA.md#10-feature-admission-test)).  
2. Trust-impacting change → Trust Rules review + Decision Log entry.  
3. Pricing/navigation change → Founding approval only (out of scope for v1.0 PRD).  
4. PRD version bump + section changelog on approval.

### Definition of launch scope

**Launch** = publicly shippable iOS + Android app with four-tab navigation, personalized onboarding, bounded Recovery Engine, tiered subscriptions (Free/Plus/Pro/Rescue/Founding Member Pro), offline-first tracking and review, Proof exports, and employee reimbursement CSV (Pro). Anything labeled **Deferred** is not required for launch approval.

---

## 2. Executive Product Summary

### User problem

People who drive for work lose legitimate miles to forgotten trips, broken tracking, silent app failures, and tools that either invent history or offer no recovery. The cost is reimbursement shortfall, audit anxiety, and distrust of mileage apps.

### Product solution

MileRecover is a **work-mile protection system** that automatically captures drives, surfaces **exceptions and gaps honestly**, helps users recover missing records with **evidence and confirmation**, and produces **defensible proof** for employers, CPAs, and records.

### Primary value proposition

**Every work mile accounted for** — with evidence, without invented mileage.

### Why users switch from competitors

| Competitor pain | MileRecover answer |
|---|---|
| Phantom / wrong auto-classification | Pending until user confirms; reject + audit |
| Silent gaps | Gap detection, no-driving confirm, recovery candidates |
| Battery / tracking dies quietly | Protection Health with escalation |
| Recovery = backfill fiction | User-confirmed reconstruction only |
| Cluttered expense suites | Four-tab calm UX |

### Functional promise

Capture → protect → detect gaps → user reviews evidence → proof improves → export.

### Emotional promise

**Calm, protected, informed, confident** that records are complete — not maximized.

### Launch boundaries

- U.S. mobile-first; individual professionals and employee reimbursement  
- Bounded recovery (no bank/email/platform integrations at launch)  
- Not tax filing, accounting suite, or fleet admin

### Primary success criteria

| Metric | Launch target |
|---|---|
| Defensible Miles Confirmed (north star) | Baseline + growth tracked |
| Phantom trip rate | <5% beta → <3% launch |
| Week 1 retention | ≥45% beta |
| Review completion (7d) | ≥70% |
| Offline 7-day test | Zero data loss |
| Critical Trust Rule violations | 0 |

See [10 Success Metrics.md](./10%20Success%20Metrics.md).

---

## 3. Goals and Non-Goals

### Launch goals

1. Reliable automatic trip capture (native engine, conservative default)  
2. Clear **Protection Health** visibility  
3. Low-effort **exception-based** classification  
4. **Bounded** missing-trip recovery (DEC-021)  
5. Evidence-backed **Proof Score** and exports  
6. Useful PDF/CSV/reimbursement exports  
7. **Personalized onboarding** (DEC-008)  
8. **Transparent** paid conversion (DEC-018, DEC-019)

### Explicit non-goals (launch)

Tax filing · General accounting · Fleet dispatch · Payroll · Banking aggregation · Full email inbox scanning · Universal gig-platform integrations · Social features · Autonomous mileage creation · Unlimited historical reconstruction · Full employer administration portal · Location data sales · Guaranteed tax outcomes

---

## 4. User Segments and Jobs to Be Done

| Persona | Core job | Workaround today | Trigger | Main anxiety | Frequency | Valuable outcome | Likely tier | Personalization | Privacy/a11y | Success signal |
|---|---|---|---|---|---|---|---|---|---|---|
| **Delivery / rideshare** | Account off-platform business miles | Platform app + memory | Tax season / audit scare | Double-counting platform miles | Daily | Complete non-platform log | Plus | High volume; batch review; gig language | Battery; notification fatigue | Confirmed mi excluding platform overlap |
| **Realtor** | Defensible client/showing miles | MileIQ + spreadsheet fixes | CPA pushback / wrong auto trips | Phantom business trips | Daily | Clean annual export | Plus → Pro | Showing/client purpose templates | — | Proof Score ≥70 on exports |
| **Contractor / home-service** | Job-site travel offline | Paper + odometer | Rural dead zones | Data loss offline | Daily | Offline capture + sync | Plus | Job-site schedule; conservative tracking | Offline, glove-friendly targets | Zero loss 7-day offline test |
| **Healthcare / mobile-care** | Client-visit miles with privacy | Manual log | License / ethics sensitivity | Client location exposure | Daily | Purpose on every trip | Plus | Minimal client names in UI/notifs | PHI-adjacent privacy; AI opt-out | No client names in notifications |
| **Sales professional** | Territory/client drive proof | CRM notes incomplete | Expense report rejection | Forgotten legs between stops | Daily | Reimbursement-ready period | Plus → Pro | Client/project fields (Pro) | — | Employer CSV accepted |
| **Employee reimbursement** | Employer-ready mileage report | Spreadsheet / employer portal | Monthly submit deadline | Personal miles mixed in | Weekly–monthly | Standard reimbursement CSV | Pro | Reimbursement value label | Home address generalization | Jordan: CSV accepted first try |
| **Business owner** | Multi-vehicle / multi-type accuracy | Bookkeeper chase | Multi-entity complexity | Wrong entity attribution | Daily | Period proof by business | Pro | Multiple businesses (Pro) | — | Quarterly summary exported |
| **Multiple jobs** | Separate work contexts | Multiple apps | Side gig added | Wrong job attribution | Daily | Work-type tagging | Plus | Multi work-type labels | — | Correct work-type on ≥90% confirms |

Reference personas: [05 User Personas.md](./05%20User%20Personas.md) (Marcus, Elena, Priya, James, Alex).

---

## 5. Product Information Architecture

### Four primary tabs (DEC-007)

| Tab | Purpose | User question | Primary content | Primary action | Secondary | Empty state | Offline | Deep link | Badge | Does NOT belong |
|---|---|---|---|---|---|---|---|---|---|---|
| **Home** | Protection status | "Am I covered?" | Protection Health, today's miles, estimated value, review count, missing-drive signal | Fix tracking **or** Review pending | Hide money; view health detail | "Enable tracking to protect your miles" | Full read from local DB | `milerecover://home` | None (Review tab badges pending) | Full trip history; export wizard |
| **Review** | Exceptions + history | "What needs my decision?" | Review queue; trip history search | Confirm / resolve top item | Add manual trip; filter history | "No items need review — you're protected" | Queue + history local | `milerecover://review` | Pending count | Settings; subscription |
| **Proof** | Defensibility | "Can I defend this period?" | Proof Score, completeness, reports, export | Preview export | Share (Pro); odometer check | "Confirm trips to build proof" | Generate PDF/CSV on-device | `milerecover://proof/export` | Unresolved gaps count (optional) | Trip editing queue |
| **Profile** | Control | "My rules, my data" | Driver type, vehicles, tracking, privacy, subscription | Open tracking settings | Help, legal | Standard account setup prompts | Preferences local; billing needs network | `milerecover://profile` | None | Primary trip review |

### Global sheets

Proof Score breakdown · Export preview · Batch review summary (≥85 score) · Subscription compare · Founding Member terms · Permission education (re-entry)

### Global modals

Destructive delete (trip/account) · Sign-out confirm · Sync conflict resolution · Unsupported import alert

### Search behavior

**Review → Trip history:** search by date, address label, purpose, client/project (Pro). Results open Trip Detail. No global search tab.

### Notification destinations

See §17. All deep links map to [Frontend.md](../architecture/Frontend.md) URI scheme.

### Authentication boundaries

| State | Access |
|---|---|
| Unauthenticated | Onboarding + auth only |
| Authenticated, onboarding incomplete | Onboarding resume |
| Authenticated, onboarding complete | MainTabs |
| Session expired | Re-auth modal; local data retained |

### Onboarding gates

`MainTabs` requires: `personalizationComplete` + valid session + permission **education** shown (grant not required).

### Subscription gates

| Feature | Gate |
|---|---|
| Auto trip 41+ / month | Plus |
| Proof Score, PDF, calendar recovery, unlimited scans | Plus |
| Multi-business, reimbursement CSV, Proof Package, sharing | Pro |
| Rescue scoped workflows | IAP purchase |

Honesty features **never** gated: gaps, Protection Health, reject, basic CSV, stored record access.

### Help access

Profile → Help & Support → Help Center articles ([Help Center Index.md](./Help%20Center%20Index.md)). In-context help links on Permission Education, Proof Score, Export preview.

### Destructive confirmation patterns

Trip delete: confirm with date/distance · Account delete: export reminder → two-step · Reject trip: undo snackbar 4s ([Interaction Rules.md](../design/Interaction%20Rules.md))

---

## 6. End-to-End User Journeys

### Journey template fields

Each journey below includes: **Entry · Steps · Decisions · System · Evidence · Confirmations · Failures · Recovery · Analytics · Success**

---

### A. Brand-new Free user

| Field | Specification |
|---|---|
| **Entry** | Fresh install, no account |
| **Steps** | Splash → Welcome → Auth → Onboarding (§7) → MainTabs Home → Permission education → OS prompts → First drive captured as **pending** → Review prompt |
| **Decisions** | Driver type, value basis, tracking preference, skip import |
| **System** | Create local profile; start conservative engine if permitted; pending trip in local DB |
| **Evidence** | GPS batch linked to draft trip |
| **Confirmations** | None until user reviews first trip |
| **Failures** | Permission denied → Limited Home + manual path |
| **Recovery** | Profile → Tracking fix flow |
| **Analytics** | `onboarding_complete`, `first_trip_captured`, `first_trip_confirmed` |
| **Success** | First confirmed trip within 7 days |

### B. Plus subscriber

| Field | Specification |
|---|---|
| **Entry** | Free user hits 40 auto trips or export paywall intent |
| **Steps** | Proof or Profile → tier compare → purchase → entitlement unlock → resume workflow |
| **System** | RevenueCat entitlement; unlimited auto capture; Proof Score enabled |
| **Success** | PDF export generated within session |

### C. Pro subscriber

| Field | Specification |
|---|---|
| **Entry** | Needs businesses/clients/reimbursement CSV/Proof Package |
| **Steps** | Profile → upgrade → configure businesses/clients → export reimbursement CSV |
| **Success** | Employee CSV passes employer acceptance (user-reported) |

### D. Founding Member Pro

| Field | Specification |
|---|---|
| **Entry** | Eligible beta/early user sees $59.99/yr Pro offer (DEC-019) |
| **Steps** | Transparent terms sheet → purchase → Pro features at founding price while continuous |
| **Failures** | Cancel → re-sub at public Pro price |
| **Success** | Grandfathered renewal at $59.99 while active |

### E. Switching from competitor / CSV

| Field | Specification |
|---|---|
| **Entry** | Onboarding Import or Profile → Import |
| **Steps** | Select file → map columns → preview rows as **suggestions** → review each → gap analysis |
| **Confirmations** | Per-row accept/dismiss |
| **Free** | 7-day preview window |
| **Analytics** | `import_started`, `import_row_accepted`, `import_complete` |
| **Success** | ≥80% rows reviewed without support ticket |

### F. Tracking permissions denied

| Field | Specification |
|---|---|
| **Entry** | User denies Always/When In Use or Background |
| **System** | Protection Health = Limited; no fake auto trips |
| **Steps** | Home Limited state → education → manual trip CTA |
| **Success** | User understands limitation; manual trip added OR permission upgraded |

### G. Tracking silently limited

| Field | Specification |
|---|---|
| **Entry** | OEM kill, battery saver, permission revocation |
| **System** | Protection Health escalation (DEC-011); gap detection continues honestly |
| **Steps** | Passive Home → in-app banner → push if meaningful risk |
| **Success** | User fixes permission/OEM whitelist OR acknowledges gap |

### H. Possible missing trip

| Field | Specification |
|---|---|
| **Entry** | Gap detector, calendar mismatch, known-place transition |
| **Steps** | Home signal → Review recovery card → evidence sheet → accept/dismiss/remind |
| **Confirmations** | Required to create trip |
| **Analytics** | `recovery_candidate_shown`, `recovery_accepted`, `recovery_dismissed` |
| **Success** | User action recorded; no silent trip |

### I. No driving occurred

| Field | Specification |
|---|---|
| **Entry** | Expected work day, zero drives |
| **Copy** | "No driving detected on Tuesday. Is that correct?" (DEC-024) |
| **Options** | Correct — I did not drive · I drove for work · Remind me later |
| **Success** | Day accounted OR explicitly unresolved |

### J. Employee reimbursement submit

| Field | Specification |
|---|---|
| **Entry** | Pro user, reimbursement persona |
| **Steps** | Review exceptions → Proof → Employee reimbursement CSV → preview → share |
| **Privacy** | Home addresses generalized if enabled |
| **Success** | CSV opens in Excel/Sheets; confirmed trips only default |

### K. Self-employed export

| Field | Specification |
|---|---|
| **Entry** | Plus+ user, tax season |
| **Steps** | Proof → PDF/CSV → preview gaps/pending → generate → share with CPA |
| **Success** | Export includes source + Proof Score + gap disclosure |

### L. Rescue one-time purchaser

| Field | Specification |
|---|---|
| **Entry** | Profile or Proof → Mileage Rescue ($14.99) or Full-Year ($29.99) |
| **Steps** | Scope confirm (3 months / 1 tax year) → recovery queue → confirm entries → export assist |
| **Success** | Scoped recovery reviewed; no invented miles |

### M. Offline user

| Field | Specification |
|---|---|
| **Entry** | No network during drive/review |
| **System** | Local DB source of truth; sync queued |
| **Steps** | Capture + review + export on-device → sync when online |
| **Success** | Zero data loss after reconnect |

### N. Cancelling subscriber

| Field | Specification |
|---|---|
| **Entry** | Profile → Subscription → platform cancel |
| **System** | Export reminder; downgrade at period end |
| **Data** | Records remain; Free limits on new auto trips/export |
| **Success** | Basic CSV export still works |

### O. Returning subscriber

| Field | Specification |
|---|---|
| **Entry** | Lapsed user reopens app |
| **Steps** | Home shows gaps honestly → restore purchase or re-subscribe |
| **Founding** | Only if still continuous-active eligibility |

### P. Account and location deletion

| Field | Specification |
|---|---|
| **Entry** | Profile → Privacy → Delete account |
| **Steps** | Export reminder → two-step confirm → soft delete 30d → purge |
| **Audit** | Deletion request logged server-side |
| **Success** | User data removed per Privacy Policy |

---

## 7. Onboarding Requirements

**Rule:** Permission education **before** OS permission prompts. No pressure tactics. Skip paths must remain viable on Free.

| Screen | Purpose | Required inputs | Default | Primary action | Skip | Personalization effect | Data saved | AI | Offline | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|
| **Splash** | Brand | — | — | Continue | — | — | — | None | Static | Loads <2s |
| **Welcome** | Promise | — | — | Get started | — | — | — | None | Yes | No savings claims |
| **Sign-in** | Account | Email or Apple/Google | — | Continue | — | — | Auth token | None | Queue auth | Error states for network |
| **Driver Type** | Segment | 1 primary type | — | Continue | — | Home copy, purpose templates | `driver_type` | None | Yes | All 8 personas listed |
| **Work Style** | Pattern | Schedule intensity | Regular | Continue | Optional | Review digest timing | `work_style` | None | Yes | — |
| **Biggest Pain** | Priority | 1 selection | Missing miles | Continue | Optional | Home emphasis | `primary_pain` | None | Yes | — |
| **Value Basis** | Estimated value label | Deduction / reimbursement / potential mileage | By persona | Continue | No | Home value label (DEC-020) | `value_basis` | None | Yes | Disclaimer shown |
| **Vehicle Setup** | Capture context | Vehicle name, optional odometer | 1 vehicle | Continue | Minimal skip | Default vehicle on trips | `vehicle` | None | Yes | Free: 1 vehicle |
| **Work Schedule** | Gap expectations | Work days pattern | From work style | Continue | Optional | No-driving expectations | `work_schedule` | None | Yes | — |
| **Known Work Sources** | Recovery prep | Calendar opt-in intent | None | Continue | Skip | Calendar connect prompt later | `sources_intent` | None | Yes | — |
| **Permission Education** | Informed consent | Acknowledge read | — | Continue to OS | Cannot skip before OS | — | `education_shown_at` | None | Yes | Must precede OS prompt |
| **OS Permission Requests** | Platform grants | System dialogs | — | System | User can deny | Protection Health state | Permission flags | None | N/A | Degrade honestly |
| **Tracking Preference** | Automation | Conservative / Standard | Conservative | Enable tracking | Pause allowed | Engine config | `automation_tier` | None | Yes | Conservative default |
| **Privacy Choices** | Control | Personal-route hide, analytics opt | Sensible defaults | Continue | — | Export generalization | `privacy_prefs` | None | Yes | — |
| **Import Existing Tracker** | Migration | File optional | Skip | Upload or Skip | Skip | Import queue | `import_session` | None | Needs file | 7-day Free preview |
| **Tracking Enabled** | Confirmation | — | — | Go to Home | — | — | — | None | Yes | Health = Protected or Limited |
| **First Value Preview** | Motivation | — | — | Review or Home | — | — | — | None | Yes | Shows pending if exists |
| **Initial Plan Offer** | Transparent upgrade | — | Continue Free | Continue Free / View plans | Always skip path | — | — | None | Needs network for purchase | No fake urgency |

**Analytics (onboarding):** `onboarding_step_viewed`, `onboarding_step_completed`, `onboarding_abandoned`, `permission_education_completed`, `permission_granted|denied`, `onboarding_complete`.

**Accessibility:** VoiceOver/TalkBack order matches visual order; all buttons ≥44pt/48dp; Dynamic Type safe on education screens.

---

## 8. Home Requirements

### Required elements

Protection status · Last health check time · Today's work miles (confirmed + pending labeled) · Estimated value (basis from onboarding; **hide-money toggle** in Profile) · Drives captured today · Items needing review (link Review) · Possible missing-drive signal · Active drive indicator (if in progress) · Weekly progress summary · **One primary action** · Personalized headline by driver type

### Home states

| State | Headline (example) | Primary action | Alert | Notification |
|---|---|---|---|---|
| New user, no drives | "Let's protect your first work mile" | Enable tracking / Add manual | None | None |
| Healthy protection | "Protected" | Review pending (if >0) else none | None | Weekly digest only |
| Active drive | "Drive in progress" | — (passive) | Low | None default |
| Review needed | "3 drives need review" | Review | Medium in-app | After quiet hours |
| Possible missing drive | "Tuesday may be incomplete" | Review gap | Medium | DEC-023 queue |
| Limited tracking | "Protection limited" | Fix tracking | High | Escalation if risk |
| Tracking off | "Protection paused" | Resume tracking | High | If workday expected |
| Offline | "Saved locally" | Continue | None | None |
| Sync pending | "Syncing…" | — | Low banner | None |
| No work expected | "No work driving expected today" | — | None | None |
| No driving, expected workday | "No driving detected Tuesday…" | Confirm (DEC-024) | Medium | Queued |
| Subscription limit (40 auto) | "Monthly auto-trip limit reached" | Upgrade or manual | Medium | None |
| Returning inactive | "Welcome back — check protection" | Review gaps | Medium | One digest |

**Acceptance:** One primary action only; estimated value shows disclaimer; hide-money removes all currency UI; offline never blocks Home render.

---

## 9. Review Requirements

### Scope

**Review queue** = exceptions only. **Trip history** (same tab, secondary navigation) = all trips searchable.

### Review item types

| Type | Trigger | Evidence | Actions | Default | Confirm | Audit event | Undo | Offline |
|---|---|---|---|---|---|---|---|---|
| Classification | Pending auto trip | Map, source, confidence | Business / Personal / Reject | None selected | Required | `trip.classified` | 4s snackbar | Yes |
| Work type | Multi work-type user | Trip metadata | Select type | — | Save | `trip.work_type_set` | Edit | Yes |
| Vehicle | Multi-vehicle | Trip start | Select vehicle | Default vehicle | Save | `trip.vehicle_set` | Edit | Yes |
| Business | Pro multi-business | — | Select business | — | Save | `trip.business_set` | Edit | Yes |
| Client/project | Pro | — | Select/create | — | Save | `trip.client_set` | Edit | Yes |
| Missing purpose | Export intent / low score | — | Enter purpose | — | Save | `trip.purpose_set` | Edit | Yes |
| Suggested purpose | Plus AI | Label "AI suggested" | Accept / edit / dismiss | Dismiss | Edit counts as confirm | `ai.suggestion_action` | Edit | Yes |
| Possible missing trip | Gap / calendar / place | Source panel | Add / dismiss / remind | — | Add requires distance | `recovery.*` | Dismiss | Partial calendar |
| Late-start correction | Edge repair | GPS + suggestion | Accept / dismiss | Dismiss | Accept | `trip.edge_repair` | Revert window | Yes |
| Early-stop correction | Edge repair | Same | Same | Dismiss | Accept | `trip.edge_repair` | Revert | Yes |
| Duplicate candidate | Overlap detector | Both trips | Merge / keep both / reject one | — | User choice | `trip.duplicate_resolved` | — | Yes |
| No-driving day | Expected work, no trips | Day context | Correct / drove / remind | — | Correct | `day.no_driving_confirmed` | — | Yes |
| Imported issue | Validation fail row | Import metadata | Fix / skip | Skip | Fix | `import.row_action` | — | Yes |
| Low-confidence place | Place match < threshold | Places | Confirm place / edit | — | Confirm | `trip.place_confirmed` | Edit | Yes |
| Unresolved evidence | Missing required fields | Flags list | Complete fields | — | Save | `trip.evidence_resolved` | Edit | Yes |

### Batch review

High-confidence pending (≥85) may batch with **summary modal** listing each trip — user confirms batch explicitly. Conservative mode: no batch without modal.

### Weekly review

Default digest notification after quiet hours; opens Review queue count.

### Cognitive load

Target ≤15 high-friction decisions per weekly digest (median user).

### Exception-based automation

User opt-in auto-confirm above threshold only; never default on Conservative.

---

## 10. Trip Details Requirements

### Fields (all sources)

Original captured route (immutable GPS evidence) · Adjusted route (if user edit) · Start/end times · Distance (source labeled) · Vehicle · Classification · Purpose · Business · Client/project (Pro) · Evidence attachments · Capture source badge · Confidence · Edit history · Audit history · Estimated value (if not hidden) · Notes · Personal-route privacy flag

### Source types (always visible)

| Type | Badge | Creation |
|---|---|---|
| Captured | `auto` | Engine detection → pending |
| Manual | `manual` | User entry |
| Imported | `imported` | Import accept |
| Reconstructed | `recovered` | Recovery accept |
| Corrected | `corrected` | Edge repair accept |

### Actions

Edit (distance requires attestation) · Split · Merge (duplicate flow) · Delete (soft 30d) · Share/export single trip (Proof flows)

**Acceptance:** Original evidence preserved read-only; no source badge hidden; delete requires confirm.

---

## 11. Recovery Requirements

Launch scope per [Recovery Engine.md](../architecture/Recovery%20Engine.md) and DEC-021.

### Insufficient evidence behavior

Show candidate with **"Not enough evidence to suggest distance"** — user may manual add only. **Never** create trip from weak evidence alone.

### Recovery candidates (summary)

| Candidate | Min evidence | Tier | User actions |
|---|---|---|---|
| Gap between drives | Absence + tracking on | Free scan 1/mo; Plus unlimited | Manual add / no-driving |
| Calendar w/o trip | Calendar event + opt-in | Plus+ | Accept+distance / dismiss |
| Known-place transition | Place graph + time | Plus+ | Accept / dismiss |
| Import gap | Import file | Free 7d; Plus+ | Row review |
| Late/early edge | GPS partial | Plus+ | Accept repair / dismiss |
| No-driving day | Schedule + zero trips | Free+ | DEC-024 options |

**Analytics:** `recovery_candidate_*`, `recovery_confirmed`, `recovery_rejected`, `recovery_remind_later`.

---

## 12. Protection Health Requirements

### Monitored conditions

Location permission · Precise location · Motion · Background refresh · Android FGS · Battery optimization · Bluetooth vehicle (if configured) · Auth session · Sync status · Last drive · App version · Storage health · Notification permission · OS breaking changes

### States

| State | Trigger (summary) | User wording | Severity | Primary action |
|---|---|---|---|---|
| **Protected** | Engine active, permissions OK | "Protected" | None | — |
| **Limited** | Partial permissions / OEM | "Protection limited" | Medium | Fix in Profile |
| **Action needed** | Permission revoked | "Action needed" | High | Fix permissions |
| **Protection off** | User pause | "Protection paused" | Medium | Resume |
| **Unknown** | Initial / indeterminate | "Checking protection…" | Low | — |
| **Recovering** | Post-fix scan running | "Checking for gaps…" | Low | Wait |

**Quiet hours:** Critical alerts only when delay risks record loss (DEC-023). **Recovery scan available** when engine healthy and Plus+ entitlement (or Free monthly scan).

---

## 13. Proof Requirements

### Components

Proof Score (Plus+) · Monthly completeness · Unresolved gaps · Unclassified records · Missing purposes · Odometer consistency · Tracking continuity · Reports · Exports · Accountant/employer sharing (Pro) · Proof Package (Pro) · Historical periods

### Proof Score (Plus+)

**Inputs:** Per [Proof Score.md](../architecture/Proof%20Score.md) — GPS continuity, confirmation, purpose, distance integrity, source trust.  
**Explainability:** Factor breakdown sheet mandatory.  
**Improve score:** Add purpose, confirm trip, odometer verify, resolve gaps.  
**No guarantee language.**  
**Free:** Not shown (upgrade CTA honest).  
**Offline:** Calculated locally from local DB.

### Report types

| Report | Tier | Offline |
|---|---|---|
| Monthly mileage summary | Free+ | Yes |
| Basic CSV | Free+ | Yes |
| PDF mileage log | Plus+ | Yes |
| Standard CSV (CPA) | Plus+ | Yes |
| Employee reimbursement CSV | Pro | Yes |
| Proof Package | Pro | Yes |
| Quarterly summary | Pro | Yes |
| Rescue report | IAP scope | Yes |
| Annual summary | Plus+ | Yes |

Employee CSV spec: [Export Formats.md](../architecture/Export%20Formats.md) DEC-022.

---

## 14. Profile Requirements

Sections: Personal profile · Driver type · Work styles · Value basis · Hide estimated value · Vehicles · Businesses (Pro) · Clients/projects (Pro) · Work schedules · Known places · Calendar connections · Import sources · Tracking preference · Privacy / personal-route hiding · Notifications · **Quiet hours (default 9 PM–7 AM)** · Subscription · Restore purchases · Data export · Data deletion · Help · Support · Legal · About

**Upgrade UX:** Tier comparison honest; no preselected annual without showing monthly; Founding Member terms explicit (DEC-019).

---

## 15. Import Requirements

### Supported at launch (validated)

MileIQ CSV · Everlance CSV · Driversnote export · TripLog export · Generic template CSV

### Flow

File pick → validate → field map → duplicate detect → preview suggestions → per-row confirm → audit trail → gap analysis

### Policies

Original file hash stored; file not re-shared externally. Free: **7-day preview** then upgrade prompt. Plus+: full continuation.

**Unsupported format:** Clear error; no partial silent import.

**Acceptance:** Zero rows auto-confirmed; duplicates flagged.

---

## 16. Subscription and Paywall Requirements

See [09 Pricing.md](./09%20Pricing.md) for locked prices and features.

| Product | Trigger | Value before paywall | Downgrade data |
|---|---|---|---|
| Free | Default | Manual + 40 auto + basic CSV | N/A |
| Plus | Limit/export/Proof | Show pending trips + gaps free | Records stay; limits apply |
| Pro | Business/reimbursement | Plus features visible | Same |
| Mileage Rescue | User-initiated gap | Scope: 3 months | IAP scope persists |
| Full-Year Rescue | Tax season | Scope: 1 year | IAP scope persists |
| Founding Pro | Eligibility flag | $59.99/yr terms | Public price if lapse |

**Paywall rules:** No fake urgency · No hidden close · No misleading savings · Annual/monthly clear · Rescue scope explicit · Restore purchases · Billing failure: grace per store policy then downgrade with export reminder

**Analytics:** `paywall_viewed`, `subscription_started`, `subscription_cancelled`, `rescue_purchased`, `founding_member_purchased`

---

## 17. Notification Requirements

**Default quiet hours:** 9:00 PM – 7:00 AM local (DEC-023). User configurable.

| Category | Default | Quiet hours | Escalation | Deep link | Cap |
|---|---|---|---|---|---|
| Critical Protection Health | On | May break if record risk | Pattern-aware | Profile/tracking | No spam |
| Review needed | Weekly digest | Queue | 3+ days pending | Review | 1/day max |
| Missing-trip candidate | On | Queue | Repeated only if unresolved | Review | Escalation ladder |
| Weekly review | On | Queue | — | Review | 1/week |
| Monthly proof | Opt-in | Queue | — | Proof | 1/month |
| Export ready | On | Queue | — | Proof | — |
| Subscription/billing | On | Queue except critical | 7-day renewal | Profile/sub | Store rules |
| Support response | On | Deliver | — | Profile/help | — |
| Product education | Opt-in | Blocked | — | Context | 1/month |
| Marketing | Off | **Blocked** | — | — | 0 launch |

**Approved:** "3 drives need review — about 12 min." · **Rejected:** "You're missing $412!"

---

## 18. Offline and Sync Requirements

### Fully offline

Trip capture · Review queue · Trip history read · Manual add · Proof Score calc · PDF/CSV generate · Protection Health read (last known) · Preferences edit

### Partial offline

Calendar sync · Import upload to server · Subscription purchase · Account delete confirmation to server

### Requires connectivity

Initial auth · Purchase/restore · Server account deletion finalize · Optional cloud backup (if enabled)

**Local source of truth:** WatermelonDB/SQLite ([Frontend.md](../architecture/Frontend.md)).  
**Conflict:** User resolves; never silent overwrite of confirmed trips.  
**Sign-out:** Local data retained until user deletes.  
**Acceptance:** 7-day offline test zero loss.

---

## 19. Privacy and Security Requirements

Product-level (legal text in [Privacy Policy.md](./Privacy%20Policy.md)):

- Location minimization; no sale (DEC-006)  
- Personal-route hiding generalizes export labels  
- Encrypt at rest; Keychain/Keystore for tokens  
- Analytics: no exact coordinates or calendar body content  
- Delete account: soft 30d then purge  
- Support: no raw GPS without consent  
- Audit logging for classification, recovery, export, delete  
- COPPA: not for children; 18+ target

---

## 20. AI Requirements

### Allowed (Plus+)

Purpose suggestion · Calendar interpretation · Evidence explanation · Place categorization · Weekly summary · Import note interpretation · Support assist (human in loop for paid)

### Prohibited

Create/confirm trips · Edit distance · Change classification without user rule · Tax guarantees · Hide uncertainty · Override Proof Score deterministically

Each AI output: label · confidence · dismiss · opt-out · log model version · fallback to manual if unavailable

---

## 21. Accessibility Requirements

VoiceOver/TalkBack on all actions · Dynamic Type to AX5 · WCAG AA contrast · Color + icon for states · 44pt/48dp targets · Reduce Motion paths · No haptic monetization · Plain language grade 8–10 · String externalization · RTL **deferred H2** · Map summaries text alternative

---

## 22. Analytics and Success Metrics

**North star:** Defensible Miles Confirmed — see [10 Success Metrics.md](./10%20Success%20Metrics.md).

| Metric | Event source | Privacy |
|---|---|---|
| Activation | `onboarding_complete` | No PII |
| First drive | `first_trip_captured` | No coordinates |
| Recovery acceptance | `recovery_confirmed` | Candidate type only |
| Permission conversion | `permission_granted` | Enum only |
| Free→Plus | RevenueCat webhook | Tier only |
| Battery impact | Client sampled metric | Aggregated |

**Never send:** Raw GPS traces · Calendar titles · Home addresses · Employer names (default)

---

## 23. Error and Edge-Case Matrix

| Condition | System behavior | User message | Recovery | Data integrity |
|---|---|---|---|---|
| Permission denied | Limited mode | "Protection limited" | Manual + education | No fake auto trips |
| Permission revoked | Action needed + gap | "Permission lost since…" | Settings link | Log gap |
| App force-closed | Engine resumes per OS | — | — | Persist local |
| Device reboot | FGS/OS restart rules | Tracking status refresh | — | No duplicate if deduped |
| Low battery | Engine may pause | "Paused to save battery" | User resume | Log pause |
| Battery saver | Limited | OEM-specific guidance | Whitelist steps | Honest banner |
| No GPS | No new auto trip | "Location unavailable" | Manual add | — |
| Poor GPS | Low confidence flag | Score reflects | Review | Never inflate distance |
| No network | Offline mode | "Saved locally" | Auto sync later | Queue mutations |
| Bluetooth failure | Ignore for trip start | — | — | — |
| Vehicle changed | Prompt if ambiguous | Select vehicle | Review item | Audit |
| Passenger / not driving | User reject trip | Reject in detail | — | Rejected permanent A3 |
| Walking after park | Split/reject | Edit trip | — | — |
| Transit mistaken | Reject | Phantom rejection metric | — | — |
| Very short drive | May filter as draft | Review if kept | User confirm | — |
| Multi-stop | Single trip default | Split optional | — | — |
| Overnight drive | Timezone-aware | — | — | — |
| TZ / DST change | Local TZ rules | — | — | Timestamps correct |
| Duplicate trip | Duplicate candidate | Merge flow | User choice | One confirmed |
| Overlapping | Flag both | Resolve overlap | — | — |
| Imported duplicate | Dedup by hash/time | Skip/merge | — | — |
| Signed out | Local data remains | Re-auth | — | — |
| Subscription expired | Downgrade features | Export reminder | Resubscribe | Data retained |
| Billing grace | Store policy | Banner | Update payment | — |
| Report failure | Retry | "Export failed" | Retry/support | No partial file marked complete |
| Calendar disconnected | Stop calendar recovery | "Calendar disconnected" | Reconnect | — |
| Data deletion | Purge pipeline | Confirm steps | — | Audit delete request |
| Device lost | Server revoke session | — | Remote sign-out | — |
| Multi-device | Sync merge | Conflict UI | User pick | — |
| Corrupt record | Quarantine | Support path | Repair tool | Never export corrupt |
| Unsupported import | Block | Format list | Template download | — |
| AI unavailable | Hide suggestions | — | Manual only | — |
| Map unavailable | Show list fields | "Map preview unavailable" | — | Trip data intact |

---

## 24. Release Scope Matrix

| Feature | Launch required | Launch optional | Deferred H1 | Deferred H2+ | Rejected |
|---|---|---|---|---|---|
| Four-tab navigation | ✓ | | | | |
| Personalized onboarding | ✓ | | | | |
| Native tracking engine | ✓ | | | | |
| Protection Health | ✓ | | | | |
| Exception Review queue | ✓ | | | | |
| Trip history + search | ✓ | | | | |
| Bounded Recovery Engine | ✓ | | | | |
| No-driving 3-option flow | ✓ | | | | |
| Proof Score | ✓ Plus+ | | | | |
| PDF/CSV export | ✓ Plus+ | | | | |
| Basic CSV Free | ✓ | | | | |
| Employee reimbursement CSV | ✓ Pro | | | | |
| Proof Package | ✓ Pro | | | | |
| Competitor import | ✓ | | | | |
| Calendar matching | ✓ Plus+ | | | | |
| AI classification suggest | ✓ Plus+ | | | | |
| Subscriptions + Rescue IAP | ✓ | | | | |
| Founding Member Pro | ✓ | | | | |
| Quiet hours default | ✓ | | | | |
| Offline capture/review/export | ✓ | | | | |
| Bluetooth vehicle trigger | | ✓ | | | |
| ML Proof calibration | | | ✓ | | |
| Bank/email recovery | | | | ✓ | |
| Gig platform integrations | | | | ✓ | |
| CPA portal / employer admin | | | | ✓ | |
| Fleet dispatch | | | | | ✓ |
| Autonomous trip creation | | | | | ✓ |
| Tax filing | | | | | ✓ |

---

## 25. Functional Acceptance Checklist

### Product
- [ ] All DEC-007–DEC-024 behaviors verified
- [ ] No silent trip create/modify
- [ ] Free tier limits enforced (40 auto, 1 scan/mo, 7d import)

### UX
- [ ] One primary action per screen (major flows)
- [ ] Four tabs only
- [ ] Estimated value disclaimer + hide toggle

### Native tracking
- [ ] State machine matches [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md)
- [ ] Battery targets met
- [ ] Phantom rate within target

### Recovery
- [ ] All launch candidate types tested
- [ ] Insufficient evidence path shows no trip

### Offline
- [ ] 7-day zero-loss test passed

### Proof
- [ ] Proof Score breakdown explainable
- [ ] Export preview shows pending/gaps

### Imports
- [ ] All supported formats validated
- [ ] Row-by-row confirm enforced

### Subscriptions
- [ ] All SKUs purchasable/restorable
- [ ] Downgrade retains data + basic CSV

### Privacy/security
- [ ] Trust Rules A1–C categories pass
- [ ] Delete account flow works

### Accessibility
- [ ] WCAG AA checklist
- [ ] VoiceOver/TalkBack critical paths

### Analytics
- [ ] North star computable
- [ ] No coordinate leakage

### Support
- [ ] Help articles for permissions, export, Proof Score

### App Store
- [ ] Demo account; background location justification; no guaranteed tax claims in metadata

---

## 26. Open Questions

Genuine unresolved items only — **do not reopen locked pricing, navigation, recovery scope, quiet hours, CSV spec, or founding offer.**

| # | Question | Owner | Blocking PRD? |
|---|---|---|---|
| 1 | Beta tester complimentary tier (if separate from Founding Member Pro) — duration and tier | Ops | No |
| 2 | Van Westendorp price validation results | Product/Finance | No |
| 3 | Post-launch employer-specific CSV column variants if rejection rate >10% | Product | No |
| 4 | Bluetooth vehicle trigger: launch optional vs defer if unstable | Mobile Eng | No — ship without if needed |
| 5 | Exact OEM whitelist copy per top 5 devices | Mobile Eng | No |

---

## Related Documents

- [Product DNA.md](./Product%20DNA.md)
- [MVP.md](../planning/MVP.md)
- [Launch Plan.md](../planning/Launch%20Plan.md)
- [Decision Log.md](./Decision%20Log.md)

---

*MileRecover Launch PRD v1.0 — Every work mile accounted for.*
