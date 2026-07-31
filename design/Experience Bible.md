# MileRecover Experience Bible

**Status:** Foundational — Emotional & Experiential Source of Truth  
**Last Updated:** July 2026  
**Owner:** Product / UX Research / Design  
**Audience:** Product, Design, Engineering, QA, Support, Marketing

---

## How to Use This Document

This is MileRecover's **experience** layer — how users should **think and feel** from discovery through yearly export.

| Layer | Document |
|---|---|
| Philosophy & law | [03 Core Principles.md](../docs/03%20Core%20Principles.md), [04 Trust Rules.md](../docs/04%20Trust%20Rules.md) |
| Visual & component | [Design Bible.md](./Design%20Bible.md), [Design System.md](./Design%20System.md) |
| Gestures & flows | [Interaction Rules.md](./Interaction%20Rules.md) |
| **Emotion & journey** | **This document** |

**Product scope markers used throughout:**
- **MVP** — in scope per [MVP.md](../planning/MVP.md)
- **Launch** — planned for public launch onboarding (pre-code spec)
- **H1+** — [08 Feature Roadmap.md](../docs/08%20Feature%20Roadmap.md); labeled explicitly

Primary navigation (documented): **Home · Review · Trips · Export · Settings** — five tabs per [Apple HIG References.md](./Apple%20HIG%20References.md). Recovery is accessed from Home gap states in MVP, not a standalone tab.

---

## 1. Executive Experience Summary

### What experience MileRecover is creating

MileRecover is a **confidence and protection product** for people who drive for work. The experience is not "effortless mileage magic." It is **calm accountability**: every legitimate work mile visible, verifiable, and exportable — with gaps shown honestly and automation always provisional until the user confirms.

Users should feel they hired a meticulous records assistant who **never pads the log**, never hides failures, and never speaks in tax-hack language.

### What users are truly paying for (Pro tier)

Per [09 Pricing.md](../docs/09%20Pricing.md), users pay for **defensibility**, not miles logged:

- Unlimited history and full-year CPA-ready export
- Period-level Proof Score analytics
- Recovery tools and AI assist (**H1+** for calendar/import/AI; export unlock is Pro at launch)
- Priority sync and support

Free tier proves capture quality; Pro unlocks **peace of mind at export time**.

### How it differs emotionally from ordinary mileage trackers

| Ordinary tracker emotion | MileRecover emotion |
|---|---|
| "It logs everything for me!" (then doubt) | "I confirm what counts" |
| Anxiety about inflated totals | Calm from transparent totals |
| Surprise phantom trips | Control via review + reject |
| Shame / "tax hack" vibe | Professional pride in records |
| Fear when app goes quiet | Informed when tracking degrades |

### The single emotional promise

> **You can stand behind every mile you export.**

---

## 2. User Emotional Baseline

What users commonly feel **before** MileRecover (from [06 User Psychology.md](../docs/06%20User%20Psychology.md), [User Pain Points.md](../research/User%20Pain%20Points.md), [Competitor Reviews.md](../research/Competitor%20Reviews.md)):

| Emotion | Manifestation | MileRecover must not amplify |
|---|---|---|
| **Distrust** | "This app probably lies like the last one" | False completeness, hidden automation |
| **Tax anxiety** | Fear of IRS letter; under-log rather than over-log | "Maximize savings" messaging |
| **Fear of missed miles** | Guilt over forgotten weeks | Invented gap-fill estimates |
| **Subscription resentment** | Trapped, unclear value, hard cancel | Dark patterns, paywall on honesty |
| **Classification fatigue** | Swiping hundreds of ambiguous trips | Default business + nagging |
| **Privacy concern** | "Who sees my routes?" | Opaque data use; no delete/export |
| **Battery concern** | Uninstall after drain | Silent high-GPS; no pause clarity |
| **Report confusion** | "Will my CPA accept this?" | Cryptic exports, missing metadata |
| **Silent failure fear** | "Has it stopped tracking?" | Fake "100% tracked" badges |

---

## 3. Desired Emotional Outcomes

| Outcome | Meaning in product |
|---|---|
| **Protected** | Records are evidence-backed; weak entries flagged before export |
| **Calm** | No alarmist UI; tax season is procedural, not panic |
| **Confident** | Proof Score + source badges explain defensibility |
| **In control** | Confirm, reject, edit, pause — always |
| **Informed** | Tracking health, gaps, sync status visible |
| **Respected** | No manipulation; professional tone; easy cancel |
| **Never trapped** | Export/delete anytime; subscription via platform settings |
| **Never surprised** | Pending ≠ confirmed; gaps ≠ hidden; AI ≠ silent |

---

## 4. Emotional Journey

For each stage: thinking · feeling · fear · must communicate · next action · must never happen · trust opportunity · success signal.

### App discovery

| Dimension | Content |
|---|---|
| Thinking | "Another mileage app? What makes this different?" |
| Feeling | Skeptical hope |
| Fear | Same phantom-trip experience |
| Communicate | **Audit-ready · never invent mileage · you review before it counts** |
| Next action | Visit App Store / site |
| Never | "Maximize deduction" / dollar savings guarantees |
| Trust opportunity | Manifesto-aligned messaging ([Manifesto.md](../docs/Manifesto.md)) |
| Success signal | Click-through from trust keywords |

### App Store page

| Dimension | Content |
|---|---|
| Thinking | "Is this legitimate or a tax hack?" |
| Feeling | Evaluative |
| Fear | Subscription bait |
| Communicate | Screenshots show **review queue + Proof Score + gap honesty** |
| Next action | Install |
| Never | Fake 5-star claims; "IRS approved" |
| Trust opportunity | Privacy nutrition labels accurate |
| Success signal | Install from qualified segment |

### First launch (Splash → Welcome)

| Dimension | Content |
|---|---|
| Thinking | "What does this app want from me?" |
| Feeling | Cautious |
| Fear | Immediate permission grab |
| Communicate | One-line promise: **Every work mile accounted for — with proof** |
| Next action | Continue to onboarding (not permission yet) |
| Never | Account required before value explanation |
| Trust opportunity | Philosophy in plain language |
| Success signal | >80% proceed past Welcome |

### Personalized onboarding (Launch)

| Dimension | Content |
|---|---|
| Thinking | "Does this understand my kind of driving?" |
| Feeling | Curious |
| Fear | Over-complicated setup |
| Communicate | Personalization affects **copy and defaults only** — same trust rules for all |
| Next action | Driver type → work style → pain → vehicle |
| Never | Different trust standards by segment |
| Trust opportunity | "We don't invent miles" repeated once, calmly |
| Success signal | Onboarding completion <3 min |

### Driver-type selection (Launch)

| Dimension | Content |
|---|---|
| Thinking | "Is this built for someone like me?" |
| Feeling | Recognition |
| Fear | Wrong defaults |
| Communicate | "This helps us prioritize your review experience — not your tax outcome" |
| Next action | Select one primary type (+ optional secondary **H1**) |
| Never | Imply segment-specific deduction rates |
| Trust opportunity | Show relevant persona quote ([05 User Personas.md](../docs/05%20User%20Personas.md)) |
| Success signal | Selection saved; home copy personalized |

### Pain-point selection (Launch)

| Dimension | Content |
|---|---|
| Thinking | "Do they get my actual problem?" |
| Feeling | Seen |
| Fear | Generic app |
| Communicate | Reflect top pains: phantom trips, battery, offline, audit fear |
| Next action | Select top 1–2 pains |
| Never | Promise to fix pain without product behavior |
| Trust opportunity | Set expectation for conservative tracking default |
| Success signal | Pain drives first-run tip sequence |

### Vehicle setup (Launch / MVP implicit single vehicle)

| Dimension | Content |
|---|---|
| Thinking | "Do I need to enter my odometer now?" |
| Feeling | Mild friction |
| Fear | Commitment |
| Communicate | Optional in MVP; improves Proof Score later |
| Next action | Label vehicle or skip |
| Never | Require multi-vehicle in MVP ([MVP.md](../planning/MVP.md)) |
| Trust opportunity | "One vehicle is fine to start" |
| Success signal | Skip or save without blocking |

### Permission education (Launch — critical)

| Dimension | Content |
|---|---|
| Thinking | "Why does it need Always location?" |
| Feeling | Defensive |
| Fear | Surveillance |
| Communicate | **Detect drives when app closed · you review each trip · we don't sell location** |
| Next action | Continue to system permission |
| Never | Permission before education screen |
| Trust opportunity | Show degradation path if denied ([Background Location Research.md](../research/Background%20Location%20Research.md)) |
| Success signal | Permission grant rate ≥70% beta target |

### Tracking enabled (Launch)

| Dimension | Content |
|---|---|
| Thinking | "Is it running now?" |
| Feeling | Relieved or wary |
| Fear | Battery drain |
| Communicate | Tracking status plain; battery-friendly mode active |
| Next action | "Done — drive normally" |
| Never | Alarmist "tracking active" animation |
| Trust opportunity | Link to battery FAQ ([Help Center Index.md](../docs/Help%20Center%20Index.md)) |
| Success signal | Engine status = active in settings |

### First automatic drive (MVP)

| Dimension | Content |
|---|---|
| Thinking | "Did it catch that?" |
| Feeling | Curious verification |
| Fear | Wrong trip created |
| Communicate | Trip is **pending**, not confirmed business |
| Next action | Open Review after drive |
| Never | Push notification per trip (default off) |
| Trust opportunity | First trip shows map + confidence + source |
| Success signal | One pending trip with evidence |

### First trip review (MVP)

| Dimension | Content |
|---|---|
| Thinking | "Was this accurate?" |
| Feeling | Evaluative |
| Fear | Confirming something false |
| Communicate | Swipe/button labels: Confirm business · Personal · (Reject in detail) |
| Next action | Confirm or reject one trip |
| Never | Pre-checked business |
| Trust opportunity | Undo snackbar 4s ([Interaction Rules.md](./Interaction%20Rules.md)) |
| Success signal | User confirms or rejects with understanding |

### First missing-trip suggestion (MVP: gap only · H1: recovery)

| Dimension | Content |
|---|---|
| Thinking | "I forgot Tuesday — can it help?" |
| Feeling | Hope + suspicion |
| Fear | App inventing miles |
| Communicate | MVP: **"Tuesday unaccounted — add trip manually"**; H1: suggestion requires accept each |
| Next action | Manual add (MVP) or review suggestion (H1) |
| Never | Auto-fill gap distance |
| Trust opportunity | Gap without implied miles |
| Success signal | User adds manual trip or dismisses gap |

### First recovered mile (H1+)

| Dimension | Content |
|---|---|
| Thinking | "Is this real?" |
| Feeling | Cautious gratitude |
| Fear | Fabricated history |
| Communicate | Source = recovered; lower Proof Score; user accepted |
| Next action | Review recovered entry before export |
| Never | Bulk accept without list |
| Trust opportunity | Show evidence basis ([Recovery Engine.md](../architecture/Recovery%20Engine.md)) |
| Success signal | User accepts knowing score impact |

### First Proof Score (MVP)

| Dimension | Content |
|---|---|
| Thinking | "What does 78 mean?" |
| Feeling | Interested |
| Fear | Score as judgment of their honesty |
| Communicate | Score = **defensibility**, not morality |
| Next action | Tap breakdown |
| Never | Red shame colors for low scores |
| Trust opportunity | Actionable improve hints (add purpose) |
| Success signal | User opens breakdown once |

### Paywall (MVP — export trigger)

| Dimension | Content |
|---|---|
| Thinking | "Is Pro worth it?" |
| Feeling | Cost-benefit |
| Fear | Paywall on core trust features |
| Communicate | **Capture free; full-year CPA export on Pro** — honesty features never gated |
| Next action | Start trial / subscribe / export current month free |
| Never | Block gap visibility or Proof Score on free |
| Trust opportunity | Annual savings shown; easy decline |
| Success signal | Conversion at export intent, not install |

### Weekly review (MVP)

| Dimension | Content |
|---|---|
| Thinking | "How many trips piled up?" |
| Feeling | Routine or dread |
| Fear | Overwhelming queue |
| Communicate | Weekly digest notification (default); batch high-confidence optional |
| Next action | Review N pending trips |
| Never | "Accept all" without summary in Conservative mode |
| Trust opportunity | Celebrate **confirmed** count, not raw detected |
| Success signal | ≥70% pending reviewed within 7 days |

### Tracking-health warning (Launch)

| Dimension | Content |
|---|---|
| Thinking | "Why did tracking stop?" |
| Feeling | Alert but not panicked |
| Fear | Silent data loss |
| Communicate | Cause + fix: permission, battery, pause, OEM kill |
| Next action | Fix permission or acknowledge gap |
| Never | Hide degraded state |
| Trust opportunity | Honest gap days on Home |
| Success signal | User restores tracking or marks day |

### Offline use (MVP)

| Dimension | Content |
|---|---|
| Thinking | "Will I lose this?" |
| Feeling | Relieved if offline works |
| Fear | Data gone at job site |
| Communicate | **Saved locally · will sync when online** |
| Next action | Continue review/export offline |
| Never | Blocking spinner on core flows |
| Trust opportunity | Export works offline |
| Success signal | Zero data loss in offline test |

### Error or failed tracking (MVP)

| Dimension | Content |
|---|---|
| Thinking | "What broke?" |
| Feeling | Frustrated but manageable if honest |
| Fear | Silent corruption |
| Communicate | Plain error + manual entry path |
| Next action | Retry sync / add manual trip / contact support |
| Never | Blame user; fake success |
| Trust opportunity | Needs repair state surfaced ([Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md)) |
| Success signal | User completes manual fallback |

### Monthly report (MVP — period summary / export preview)

| Dimension | Content |
|---|---|
| Thinking | "How am I doing this month?" |
| Feeling | Progress check |
| Fear | Bad surprise at tax time |
| Communicate | Confirmed vs pending vs unaccounted |
| Next action | Export preview or review pending |
| Never | Monthly "savings" headline |
| Trust opportunity | Period Proof Score trend |
| Success signal | User exports or clears pending |

### Tax-season export (MVP)

| Dimension | Content |
|---|---|
| Thinking | "Will my CPA accept this?" |
| Feeling | Anxious → calm if preview looks right |
| Fear | Audit |
| Communicate | Preview with disclaimer ([Export Disclaimer.md](../docs/Export%20Disclaimer.md)) |
| Next action | Generate PDF/CSV |
| Never | Include pending without explicit opt-in |
| Trust opportunity | CPA metadata columns ([Export Formats.md](../architecture/Export%20Formats.md)) |
| Success signal | Export shared; CPA acceptance (beta metric) |

### Support interaction (Launch)

| Dimension | Content |
|---|---|
| Thinking | "Will they gaslight me?" |
| Feeling | Vulnerable |
| Fear | Dismissal |
| Communicate | Evidence-first support; no raw GPS in tickets |
| Next action | Submit issue with trip ID |
| Never | "That's expected behavior" for phantom trips |
| Trust opportunity | Trust Rule violation = incident path |
| Success signal | Resolution <24h P2 |

### Cancellation (MVP)

| Dimension | Content |
|---|---|
| Thinking | "Can I leave easily?" |
| Feeling | Testing respect |
| Fear | Dark retention |
| Communicate | Export first reminder; platform cancel instructions |
| Next action | Export data → cancel in App Store/Play |
| Never | Hidden cancel; guilt trips |
| Trust opportunity | "Your data remains exportable until period end" |
| Success signal | Clean cancel; optional exit survey |

### Returning after cancellation (H1)

| Dimension | Content |
|---|---|
| Thinking | "Is my history still there?" |
| Feeling | Hesitant |
| Fear | Lost records |
| Communicate | Retention policy clear ([Privacy Policy.md](../docs/Privacy%20Policy.md)) |
| Next action | Resubscribe or export archive |
| Never | Deleted data without warning |
| Trust opportunity | Welcome back without penalty pricing |
| Success signal | Successful restore if within retention |

---

## 5. Screen Experience Framework

Global rules: [Interaction Rules.md](./Interaction%20Rules.md), [Color System.md](./Color%20System.md), [Motion.md](./Motion.md). One primary action per screen ([Simplicity Rules §11](#11-simplicity-rules)).

Legend: **MVP** | **Launch** (onboarding) | **H1+**

---

### Splash (**Launch**)

| Attribute | Specification |
|---|---|
| Desired emotion | Quiet confidence |
| Wrong emotion | Hype, urgency |
| Primary question | "What is this?" |
| Primary action | Auto-advance → Welcome (2s max) |
| Secondary | None |
| Essential info | Logo + tagline only |
| Defer | Permissions, accounts |
| Microcopy tone | Neutral, professional |
| Motion | Fade 300ms; respect Reduce Motion |
| Haptic | None |
| Color | `brand-700` on `neutral-0` |
| Loading | Branded splash only if cold start >1s |
| Success | Transition to Welcome |
| Empty | N/A |
| Offline | Same — no network required |
| Error | Skip to Welcome if corrupt state |
| Accessibility | Logo alt text; no flashing |
| Trust | No fake "syncing" spinner |

---

### Welcome (**Launch**)

| Attribute | Specification |
|---|---|
| Desired emotion | Informed curiosity |
| Wrong emotion | Sales pressure |
| Primary question | "Why should I trust this?" |
| Primary action | **Continue** |
| Secondary | Sign in (returning user) |
| Essential | Emotional promise + 3 philosophy bullets (accounted / never invent / you confirm) |
| Defer | Pricing, feature list |
| Microcopy | "Every work mile accounted for — with proof." |
| Motion | Horizontal page dots if carousel ≤3 panels |
| Haptic | None |
| Color | Navy headline; proof green accent sparingly |
| Success | Enters onboarding |
| Empty | N/A |
| Offline | Full function |
| Error | N/A |
| Accessibility | VoiceOver reads full promise |
| Trust | Link to Privacy Policy |

---

### Driver Type (**Launch**)

| Attribute | Specification |
|---|---|
| Desired emotion | Recognized |
| Wrong emotion | Stereotyped |
| Primary question | "Is this for me?" |
| Primary action | **Select driver type → Continue** |
| Secondary | Skip (defaults to General self-employed) |
| Essential | 6–8 types (§6); single select |
| Defer | Tax advice by profession |
| Microcopy | "Helps us tailor tips — not your tax outcome." |
| Motion | Selection highlight 200ms |
| Haptic | Selection light |
| Color | Selected card `brand-100` border |
| Success | Selection persisted |
| Empty | N/A |
| Trust | Same product for all types |

---

### Work Style (**Launch**)

| Attribute | Specification |
|---|---|
| Desired emotion | Understood |
| Wrong emotion | Judged |
| Primary question | "How often do I drive for work?" |
| Primary action | **Select frequency band → Continue** |
| Secondary | Skip |
| Essential | Daily / few times weekly / sporadic / seasonal spikes |
| Defer | Mile estimates |
| Microcopy | "We'll tune review reminders, not your log." |
| Motion | Crossfade |
| Haptic | Selection |
| Trust | No "you probably drive X miles" |

---

### Biggest Pain (**Launch**)

| Attribute | Specification |
|---|---|
| Desired emotion | Heard |
| Wrong emotion | Exploited |
| Primary question | "Do they know my problem?" |
| Primary action | **Select up to 2 pains → Continue** |
| Secondary | Skip |
| Essential | Phantom trips, battery, offline, audit fear, forgotten trips, classification fatigue |
| Defer | Solutions detail |
| Microcopy | Maps to [User Pain Points.md](../research/User%20Pain%20Points.md) IDs |
| Trust | Never promise unbuilt fix |

---

### Vehicle Setup (**Launch**)

| Attribute | Specification |
|---|---|
| Desired emotion | Prepared |
| Wrong emotion | Burdened |
| Primary question | "Do I need odometer now?" |
| Primary action | **Save label** or **Skip for now** |
| Secondary | Add odometer reading (optional MVP) |
| Essential | Vehicle nickname; MVP single implicit vehicle |
| Defer | Multi-vehicle (**H2**) |
| Microcopy | "Optional — helps later with odometer entries." |
| Trust | Skip never blocks tracking |

---

### Permission Education (**Launch** — trust-critical)

| Attribute | Specification |
|---|---|
| Desired emotion | Informed consent |
| Wrong emotion | Tricked |
| Primary question | "Why Always location?" |
| Primary action | **Continue to system permission** |
| Secondary | **Learn what works with limited permission** |
| Essential | What we collect; what we don't; review before count; no data sale |
| Defer | Account creation |
| Microcopy | Per [Apple HIG References.md](./Apple%20HIG%20References.md) / [Android Material References.md](./Android%20Material%20References.md) |
| Motion | Static illustration; no map animation |
| Haptic | None pre-permission |
| Color | Calm navy; no red |
| Error | If denied → degradation sheet, not dead-end |
| Accessibility | Full text readable without illustration |
| Trust | **Peak trust moment §9** |

---

### Tracking Enabled (**Launch**)

| Attribute | Specification |
|---|---|
| Desired emotion | Ready |
| Wrong emotion | Watched |
| Primary question | "Am I set up?" |
| Primary action | **Go to Home** |
| Secondary | View tracking settings |
| Essential | Status: Active / Limited / Paused |
| Defer | First trip tutorial until trip exists |
| Microcopy | "Drive normally. We'll notify you when a trip needs review." |
| Haptic | Success subtle (optional) |
| Trust | Battery-friendly note one line |

---

### Home (**MVP** — Period Summary)

| Attribute | Specification |
|---|---|
| Desired emotion | Oriented, calm accountability |
| Wrong emotion | Dashboard FOMO |
| Primary question | "Am I up to date?" |
| Primary action | **Review pending trips** (if pending >0) else **View period summary** |
| Secondary | Add manual trip; view gaps |
| Essential | Confirmed business miles (large tabular); pending count; unaccounted days; period Proof Score; tracking status bar |
| Defer | Personal miles total unless toggled; competitor comparisons |
| Microcopy | "4,281 mi confirmed · 3 pending · 2 unaccounted days" |
| Motion | Proof Score fill on first view only ([Motion.md](./Motion.md)) |
| Haptic | None on load |
| Color | Confirmed `proof-600`; pending `review-600`; gaps `neutral-400` dashed |
| Loading | Skeleton cards |
| Success | Pending = 0 and user aware of gaps |
| Empty | "No trips yet — drive or add manually" + tracking status |
| Offline | "Offline — changes saved locally" subtle banner |
| Error | Tracking degraded banner with fix CTA |
| Accessibility | Metrics readable in order: confirmed → pending → gaps |
| Trust | **Never show pending in confirmed total** |

---

### Review (**MVP**)

| Attribute | Specification |
|---|---|
| Desired emotion | Efficient control |
| Wrong emotion | Whack-a-mole |
| Primary question | "What needs my decision?" |
| Primary action | **Confirm business** (swipe/button) |
| Secondary | Personal; open detail for reject/split |
| Essential | Trip card: date, distance, map thumb, confidence, source badge |
| Defer | Proof breakdown until detail |
| Microcopy | "Confirm" not "Accept as business deduction" |
| Motion | Swipe snap; collapse on confirm 300ms |
| Haptic | Success on confirm; warning on reject path |
| Color | Pending amber accent |
| Loading | Local-first instant |
| Success | Queue empty → calm confirmation |
| Empty | "All caught up" + last review date |
| Offline | Full function |
| Error | Trip load fail → retry single card |
| Accessibility | Button alt to swipe; read score + source |
| Trust | Reject only in detail with modal |

---

### Trip Details (**MVP**)

| Attribute | Specification |
|---|---|
| Desired emotion | Informed judgment |
| Wrong emotion | Overwhelmed |
| Primary question | "Can I defend this trip?" |
| Primary action | **Confirm business** (with purpose if required) |
| Secondary | Personal · Reject · Edit · Split |
| Essential | Map path, timestamps, distance source, flags, Proof Score entry |
| Defer | Raw GPS point editor |
| Microcopy | Source badge: Auto-detected / Manual |
| Motion | Map fade in 300ms |
| Haptic | Success on confirm |
| Color | Proof score label semantic |
| Error | Map unavailable offline → list coords + "map when online" |
| Trust | Reject modal copy honest |

---

### Missing Trip (**MVP**: manual add from gap · **H1**: suggestion card)

| Attribute | Specification |
|---|---|
| Desired emotion | Empowered, not rescued by fiction |
| Wrong emotion | "App saved me $500" |
| Primary question | "How do I account for this day?" |
| Primary action | **Add manual trip** (MVP) / **Review suggestion** (H1) |
| Secondary | Mark "No driving this day" |
| Essential | Date; gap context; no pre-filled distance (MVP) |
| Defer | Calendar auto-distance (H1) |
| Microcopy | "This day has no trips — add one if you drove." |
| Trust | **Never invent mileage** |

---

### Proof Score (**MVP** — breakdown sheet)

| Attribute | Specification |
|---|---|
| Desired emotion | Clarity |
| Wrong emotion | Shame |
| Primary question | "Why this score?" |
| Primary action | **Dismiss** after reading |
| Secondary | **Add purpose** / fix weak factor |
| Essential | Factor bars + plain labels ([Proof Score.md](../architecture/Proof%20Score.md)) |
| Defer | ML explanation jargon |
| Microcopy | "Good — review recommended — Weak" not "Bad taxpayer" |
| Motion | Meter fill 450ms once |
| Color | Constrained gradient per Color System |
| Trust | Tap-to-explain mandatory |

---

### Reports (**MVP** — Export tab)

| Attribute | Specification |
|---|---|
| Desired emotion | Prepared |
| Wrong emotion | Blind send |
| Primary question | "What am I sending my CPA?" |
| Primary action | **Preview export** |
| Secondary | Change date range; format PDF/CSV |
| Essential | Confirmed miles; excluded pending; gap list; disclaimer |
| Defer | Custom templates (**Pro+ H2**) |
| Microcopy | [Export Disclaimer.md](../docs/Export%20Disclaimer.md) |
| Motion | Preview sheet up 300ms |
| Haptic | Success on generate complete |
| Success | Share sheet opened |
| Empty | "No confirmed trips in this period" |
| Offline | Generate allowed |
| Error | Generation fail → retry; never partial fake PDF |
| Trust | Preview before share required |

---

### Import Existing Tracker (**H1+**)

| Attribute | Specification |
|---|---|
| Desired emotion | Cautious hope |
| Wrong emotion | Magic migration |
| Primary question | "Will my old log transfer safely?" |
| Primary action | **Upload CSV → review each row** |
| Secondary | Download template ([Export Formats.md](../architecture/Export%20Formats.md)) |
| Essential | Each row = suggestion until accepted |
| Trust | No bulk import to confirmed |

---

### Subscription (**MVP**)

| Attribute | Specification |
|---|---|
| Desired emotion | Fair value exchange |
| Wrong emotion | Trapped |
| Primary question | "What do I get?" |
| Primary action | **Subscribe** or **Continue with Free** |
| Secondary | Restore purchases |
| Essential | Pro $7.99/mo · $69.99/yr; feature table; honesty never paywalled |
| Defer | Pro+ (**not launched MVP**) |
| Microcopy | "Full-year CPA export" not "Unlock all deductions" |
| Trust | Apple/Google manage billing; cancel anytime copy |

---

### Settings (**MVP**)

| Attribute | Specification |
|---|---|
| Desired emotion | Control |
| Wrong emotion | Hidden levers |
| Primary question | "How is tracking configured?" |
| Primary action | Contextual top item (Automation / Permissions / Tracking) |
| Secondary | Account, subscription, data |
| Essential | Automation level (Conservative default); tracking pause; permission status |
| Defer | Advanced debug |
| Trust | Automation change explains retroactive effect (none on pending) |

---

### Profile (**MVP** — subset of Settings)

| Attribute | Specification |
|---|---|
| Desired emotion | Ownership |
| Wrong emotion | Exposure |
| Primary question | "What's on my account?" |
| Primary action | **Edit name/business label** |
| Secondary | Export data · Delete account |
| Essential | Email; subscription tier; export/delete |
| Trust | Delete confirms + 30-day window per Privacy Policy |

---

### Help (**Launch** — links to Help Center)

| Attribute | Specification |
|---|---|
| Desired emotion | Supported |
| Wrong emotion | Abandoned |
| Primary question | "How does X work?" |
| Primary action | **Search / browse topics** |
| Secondary | Contact support |
| Essential | Top 5 FAQs from [Help Center Index.md](../docs/Help%20Center%20Index.md) |
| Trust | Support response SLA on Pro |

---

### About (**Launch**)

| Attribute | Specification |
|---|---|
| Desired emotion | Transparency |
| Wrong emotion | Corporate opacity |
| Primary question | "Who made this?" |
| Primary action | **View philosophy / legal links** |
| Essential | Version; Terms; Privacy; Manifesto link |
| Trust | No hidden trackers |

---

## 6. Personalized Experiences by Driver Type

**Rule:** Personalization changes **language, defaults, and education** — never trust rules, Proof Score logic, or invention policy. One design system ([Design System.md](./Design%20System.md)).

| Driver type | Home language | Key metric | Review pattern | Main anxiety | Valuable proof | Default classification | Boundaries |
|---|---|---|---|---|---|---|---|
| **Delivery / rideshare** (James) | "Off-platform miles accounted" | Confirmed mi excluding platform-overlap | High volume; batch ≥85 score | Double-counting platform miles | Source tags + gaps vs platform | Pending always | Never import platform CSV as auto-confirmed (**H1**) |
| **Realtors** (Marcus) | "Showing & client miles" | Period confirmed + pending | Moderate; errand mix-ups | Personal errand mislog | Purpose field + map | Conservative | No "open house = auto business" |
| **Contractors / home service** (Elena) | "Job travel captured" | Unaccounted days (offline) | Low daily; weekly digest | Offline + battery | Offline badge + manual add | Conservative | No job-site geofence auto (**H2**) without opt-in |
| **Healthcare / mobile care** (Priya) | "Client visit miles" | Proof Score | Purpose on every business trip | Privacy + license | User-written purpose; no client names in notifs | Conservative | AI purpose opt-out (**H1**); no PHI in cloud AI |
| **Sales professionals** | "Client & territory travel" | Confirmed vs quota-agnostic | High trip count | Territory vs personal | Split trip for mixed stops | Balanced optional | No CRM auto-trip (**H3**) |
| **Employees (reimbursement)** | "Reimbursable miles ready" | Confirmed business mi | Employer-report cadence | Employer format | CSV columns match employer | Conservative | Not an employer portal (**H3**); export only |
| **Business owners** | "Business travel accounted" | Period Proof Score | Mixed personal/business | Audit on blended use | Export metadata + gaps | Conservative | No "100% business" nudge |
| **Multiple-job drivers** | "Work miles by context" | Unaccounted days | Frequent classification | Wrong job attribution | Purpose tags; split trips | Conservative | Multi-job labels (**H1**); not multi-product |

**Consistent for all:** Never invent mileage; reject available; gap visibility; Proof Score semantics; free capture / Pro export.

---

## 7. Microcopy Principles

### Voice
Professional records assistant. Direct. Accounting-adjacent. Never bro-marketing.

### Tone
Calm > clever. Respectful > urgent. Honest > reassuring fiction.

### Sentence length
- Headlines: ≤8 words
- Body: ≤20 words average
- Legal: allowed longer with plain-language summary first

### Vocabulary
Prefer: accounted, confirmed, pending, evidence, export, review, defensible, unaccounted, purpose, source.  
Avoid: maximize, claim, hack, bonus, missed savings, auto-logged (without "pending").

### Uncertainty
✓ "We detected a possible drive — please confirm."  
✗ "Trip logged successfully."

### Tracking failure
✓ "Tracking paused — trips since Monday may be missing. Tap to fix or add manually."  
✗ "All your miles are captured!"

### Permissions
✓ "Background location lets us detect drives when the app is closed. You review every trip before it counts."  
✗ "Enable location for best experience."

### Deduction value (if shown — avoid by default)
✓ "Based on IRS rate, confirmed miles represent $X — not a tax estimate." (**Launch optional, off by default**)  
✗ "You saved $2,847!"

### Tax guarantees
Never. Use [Export Disclaimer.md](../docs/Export%20Disclaimer.md).

### AI suggestions (**H1+**)
✓ "Suggested purpose (AI) — tap to confirm or edit."  
✗ "AI verified business trip."

### Recovery recommendations (**H1+**)
✓ "Add this trip? You entered calendar event — distance required from you."  
✗ "We recovered 12 miles from your calendar."

### Rejected examples
| Rejected | Approved |
|---|---|
| "Cha-ching! 47 miles logged!" | "47 trips pending review" |
| "Accept all business trips" | "Review 12 high-confidence trips" (+ summary modal) |
| "Complete your log — 98% done" (with gaps) | "3 unaccounted days in March" |
| "Upgrade to claim more miles" | "Upgrade for full-year export" |

---

## 8. Motion and Haptic Philosophy

From [Motion.md](./Motion.md); experience layer emphasis:

### When motion is useful
- Confirm/reject feedback on Review
- Sheet present for Proof Score and export preview
- Sync icon crossfade (non-blocking)

### When motion is distracting
- Mile total celebrations
- Looping tracking pulse on Home
- Slot-machine number rollovers
- Parallax maps on data screens

### Duration ranges
Instant 100ms · Fast 200ms · Normal 300ms · Slow 450ms · Emphasis 600ms (once)

### Reduced Motion
Crossfade replaces slide; Proof Score shows final value; no parallax.

### Haptics
| Event | Haptic | Why |
|---|---|---|
| Confirm business | Success medium | Acknowledgment |
| Reject | Warning light | Deliberate |
| Export complete | Success heavy | Milestone |
| Error | Error | Alert |
| Subscription | **None** | No pressure |

### Why haptics must never create pressure
Financial anxiety + haptic nagging = avoidance. No haptic on passive scroll, paywall, or upsell.

---

## 9. Trust Moments

| Moment | Risk | Transparency required | User control | Audit history | Recovery if damaged |
|---|---|---|---|---|---|
| Location permission | Surveillance fear | What/when/why/degradation | Deny + manual mode | Permission choice logged | Honest limited mode UX |
| Tracking begins | Covert tracking | Status bar + settings | Pause anytime | Engine session start | Immediate pause visibility |
| Tracking stops | Silent gaps | Banner + gap days | Resume or acknowledge | Stop reason flag | Gap UI + manual add |
| Missing trip suggested (**H1**) | Invention | Source shown; no distance without user | Accept/dismiss each | Suggestion record | Dismiss + audit |
| Reconstructed trip confirmed (**H1**) | Weak evidence | Lower Proof Score; recovered badge | Edit/reject | Accept timestamp | Re-export with correction |
| AI purpose suggested (**H1**) | Wrong client context | AI label | Edit/dismiss/opt-out | AI interaction log | User edit before export |
| Personal trip hidden | "Lost" data | Still in All Trips | Reclassify | Classification event | Restore from history |
| Subscription offered | Trust paywall | Free capture complete | Decline freely | N/A | Export free tier month |
| Report generated | Wrong totals | Preview + pending excluded | Toggle appendix | Report snapshot immutable | Regenerate |
| Data deleted | Fear of trap | Confirm + retention window | Cancel delete | Deletion request | Support restore window |
| Support contacted | Dismissal | Ticket ID; no GPS in chat | Escalate | Support log | Incident runbook if violation |

---

## 10. Anxiety-Reduction Patterns

| Pattern | Trigger | UX response |
|---|---|---|
| **Permission ladder** | Denied Always | When In Use explanation + manual prominence |
| **Tracking health card** | Engine paused/OEM kill | Cause + fix steps + gap preview |
| **Gap honesty** | Unaccounted days | List dates; manual add CTA; no estimate miles |
| **Low-confidence gate** | Score <70 export | Advisory banner; not blocking |
| **Renewal calm** | Subscription renew | Email 7-day notice; no fear copy |
| **Offline badge** | No network | "Saved locally" — never blocking |
| **Sync delay** | Queue pending | Count + retry; no data loss claim until synced |
| **Incomplete report** | Pending >0 at export | Default exclude + preview list |
| **Tax season mode** | Jan–Mar | Home export CTA; checklist; no countdown pressure |
| **Mistake recovery** | Wrong confirm | Undo 4s; edit in detail; audit trail |

---

## 11. Simplicity Rules

Measurable experience rules (enforce in design QA):

1. **One primary action per screen** — secondary max one; tertiary in overflow.
2. **Review queue decisions** — target ≤15 high-friction decisions per weekly digest for median user; batch only ≥85 score with summary modal.
3. **Progressive disclosure** — Proof breakdown, export metadata, advanced automation behind intentional taps.
4. **No orphan metrics** — every Home number links to action (pending → Review; gaps → add/mark).
5. **No duplicate navigation** — single path to Review from Home CTA and tab.
6. **No unexplained jargon** — "Proof Score" always paired with "defensibility" first exposure.
7. **No silent automation affecting mileage** — all auto-detected start as pending.
8. **Notifications** — default weekly digest only; max 1/month gap alert; zero per-trip default.

---

## 12. Accessibility and Inclusion

Aligned with [Design Bible.md](./Design%20Bible.md) accessibility section:

| Area | Requirement |
|---|---|
| Screen readers | Trip card reads: date, miles, source, score, state, actions |
| Dynamic type | Layout survives 200% font; tabular figures on numbers |
| Contrast | WCAG AA minimum ([Color System.md](./Color%20System.md)) |
| Color-independent state | Icon + label for pending/confirmed/personal |
| Motor | 44×44pt min; reject not swipe-only |
| Cognitive load | One decision per review card when score <70 |
| Plain language | Grade 8–10 target for core flows |
| Localization | String externalization; +30% length buffer |
| Multilingual drivers | LTR MVP; RTL **H2** |
| Reduced Motion | Full alternate path |
| Large tap targets | 48dp Android / 44pt iOS |
| Low-attention / hands-free | Weekly digest > live prompts; voice readout of pending count via OS |

---

## 13. Competitive Experience Standard

From [07 Competitor Analysis.md](../docs/07%20Competitor%20Analysis.md) and [Competitor Reviews.md](../research/Competitor%20Reviews.md) — emotional positioning, not UI cloning:

| Competitor | User complaint | MileRecover should feel |
|---|---|---|
| **MileIQ** | Wrong classification, trust erosion | **Simpler decision loop** — pending vs confirmed always visible |
| **Everlance** | Cluttered; mileage secondary | **More focused** — mileage depth only MVP |
| **Driversnote** (category) | Rigid, impersonal | **More reassuring** — calm copy + Proof Score explanation |
| **TripLog** | Dated, dense | **Clearer hierarchy** — one next action on Home |
| **Low-cost trackers** | Opaque automation | **More transparent** — source, score, gaps on every export |

**Emotional summary:** The anti-anxiety mileage app — not the highest-mile-count app.

---

## 14. Experience Acceptance Checklist

Before any screen or feature ships, approvers (Design, Product, Eng, QA) confirm:

### Philosophy
- [ ] Aligns with [03 Core Principles.md](../docs/03%20Core%20Principles.md)
- [ ] Passes [04 Trust Rules.md](../docs/04%20Trust%20Rules.md) relevant categories
- [ ] No [Anti-Principles.md](../docs/Anti-Principles.md) violation

### Emotion
- [ ] Desired emotion defined; wrong emotion avoided
- [ ] Failure state designed equal to success state
- [ ] No tax savings guarantee or implied audit immunity

### Simplicity
- [ ] One primary action identified
- [ ] No metric without user action or emotional purpose
- [ ] Progressive disclosure for advanced fields

### Trust
- [ ] Pending ≠ confirmed visually and numerically
- [ ] Gaps shown without invented miles
- [ ] AI (**H1+**) labeled provisional
- [ ] Tracking degradation visible

### Copy
- [ ] Approved vocabulary; rejected phrases absent
- [ ] Export disclaimer where required

### Motion & a11y
- [ ] Reduce Motion path defined
- [ ] VoiceOver/TalkBack labels on actions
- [ ] Haptics not used for monetization pressure

### Scope
- [ ] MVP vs H1+ labeled in spec
- [ ] No undocumented capability implied

---

## 15. Open Founder Decisions

Genuine unresolved items **not** answered in existing OS docs — require founder approval:

1. **Tab bar consolidation** — Docs specify five tabs (Home, Review, Trips, Export, Settings). Confirm whether Export merges into Home for a four-tab bar or keep five.

2. **Onboarding depth at MVP launch** — Full Driver Type / Work Style / Pain flow (**Launch** in this doc) vs minimal permission + philosophy only for beta. Engineering cost vs personalization benefit.

3. **Optional deduction dollar display** — [09 Pricing.md](../docs/09%20Pricing.md) avoids deduction optimization; confirm whether any IRS-rate multiplication may appear (off by default recommended).

4. **"No driving this day" explicit action** — Mark gap as intentionally empty vs leave unaccounted; affects completeness metrics.

5. **Tracking-health warning thresholds** — Exact day count before gap alert notification (monthly default in Interaction Rules; tune per persona?).

6. **Employee reimbursement persona priority** — Listed in §6 but not in [05 User Personas.md](../docs/05%20Personas.md); confirm MVP marketing focus or defer.

7. **Pro+ at launch** — [09 Pricing.md](../docs/09%20Pricing.md) lists Pro+; [MVP.md](../planning/MVP.md) implies Pro only at launch. Confirm Pro+ waitlist vs hidden.

8. **Founding member pricing UX** — $49/yr lock ([09 Pricing.md](../docs/09%20Pricing.md)) — surface in onboarding vs export paywall only.

*Already decided (do not re-open):* conservative default, no data sale (DEC-006), offline-first, user confirmation for recovery, no AI in MVP, React Native + native engines.

---

## Related Documents

- [Design Bible.md](./Design%20Bible.md)
- [Interaction Rules.md](./Interaction%20Rules.md)
- [06 User Psychology.md](../docs/06%20User%20Psychology.md)
- [05 User Personas.md](../docs/05%20Personas.md)
- [Manifesto.md](../docs/Manifesto.md)
- [MVP.md](../planning/MVP.md)
- [Motion.md](./Motion.md)
- [Color System.md](./Color%20System.md)

---

*MileRecover — Calm over complexity. Every work mile accounted for.*
