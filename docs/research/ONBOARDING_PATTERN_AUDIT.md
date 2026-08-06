# Onboarding pattern audit — MileRecover

**Sources:** Mobbin mobile onboarding / acknowledgement-success explore pages (public flow summaries), plus established mobile onboarding principles when screen-level detail was limited.

**Constraint:** Mobbin provides flow titles and short descriptions without authenticated deep-screen access in this environment. Patterns below synthesize those public summaries with product requirements. No competitor branding, layouts, or proprietary assets are copied.

---

## Patterns studied (≥12)

| # | App / category | Sequence (summary) | Psychological purpose | Cognitive load | Permission timing | Progress | Skip / back | Personalization | First-value | Adopt | Reject |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Revolut / finance | Welcome → verify → profile → optional plan | Trust + legitimacy | Medium–high | After identity basics | Step dots | Limited skip | Profile fields | Account ready CTA | Short value statement before forms | Premium upsell mid-onboarding |
| 2 | Wise / finance | Register → verify → “options to use app” | Outcome clarity | Medium | Late | Minimal | Clear continue | Light | Post-setup choices | Ready screen with confirmed choices only | Long verification-first before value |
| 3 | Spotify / media | Account → preferences → home | Preference → personalization | Low–medium | After home | Soft | Skip prefs | Genre chips | Personalized home | Compact purpose chips | Lengthy preference grids |
| 4 | Headspace / health | Calm intro → intent → start | Emotional safety | Low | Deferred | Soft | Skip common | Intent | Immediate calm | Calm copy, one job per screen | Heavy illustration stacks |
| 5 | Uber / travel | Permissions → account → payment → map | Permission necessity | Medium | Explained then request | Linear | Hard gates for core | Light | Map = value | Progressive permission education | Payment before core value |
| 6 | Uber Eats / food | Account → info → terms → payment | Checkout readiness | Medium | Late | Linear | Limited | Address | Browse food | Order of “setup only what’s needed” | Payment early for mileage app |
| 7 | Airbnb / travel | Welcome → browse/setup | Aspiration + trust | Low | Deferred | Soft | Skip | Interest | Browse | Hero outcome copy | Feature laundry lists |
| 8 | Ahead / health | Account → personalize → journey → pro | Commitment | Medium | Late | Linear | Soft | Journey pick | Journey start | Single personalization question | Pro push before first value |
| 9 | Luma / events | Signup → verify → profile → notifications → Discover | Community entry | Medium | Notifications last | Linear | Soft | Profile | Discover feed | Notifications after value | Email/phone gates for offline-first |
| 10 | Mozi / social | Compact invite/onboarding | Warmth | Low | Deferred | Minimal | Easy skip | Contacts optional | See friends | Optional fields stay optional | Contact scraping pressure |
| 11 | Instagram / social | Account → interests → feed | Habit loop | Low | Camera later | Soft | Skip interests | Interest chips | Feed | Chip selection for purpose | Social proof spam |
| 12 | Generic insurance / protection | Protect → explain → permission → confirm | Risk reduction | Low–medium | After explanation | 3–4 steps | Manual alternative | Light | “You’re covered” | Honest protect education + manual path | “Always on” claims before proof |
| 13 | Generic navigation | Location explain → Always → map | Permission honesty | Low | Progressive FG→BG | Linear | Manual search fallback | Destination | Map | Progressive location + battery only if needed | Demanding Always without why |
| 14 | Generic productivity | Goal → defaults → home | Control | Low | Deferred | 3 steps | Skip | Goal | Empty useful home | Purpose → region defaults → home | Long questionnaires |

---

## What MileRecover adopts

1. **Outcome-first Welcome** — one sentence value, one primary CTA, optional “I already use a mileage app.”
2. **One decision per stage** — purpose chips, then region/rate, then protection education.
3. **Progressive permissions** — explain → foreground → background → battery only when needed.
4. **Manual-first escape hatch** — “Not now” creates a legitimate manual account, not a warning loop.
5. **Ready = confirmed choices only** — no contradictory “on or ready to confirm.”
6. **Completion only on final CTA** — idempotent; reset stack into Home.
7. **Soft progress indicator** — visual only; step machine is source of truth.

## What MileRecover rejects

1. Mid-onboarding paywalls or fake trials.
2. Slideshow feature tours.
3. Technical GPS jargon on customer screens.
4. Giant scrolling purpose cards.
5. Claiming “Protected” before verified capture.
6. Fabricating COMPLETED from unrelated profile fields.
7. Competitor visual identity (MileIQ / Everlance / TripLog layouts).

## Target sequence (locked)

1. WELCOME  
2. PURPOSE (how you use mileage)  
3. REGION AND RATE  
4. PROTECT YOUR DRIVES (education + progressive permissions)  
5. READY → Home  

Maximum five meaningful stages. Value understood in under ~10 seconds; Home reached quickly.
