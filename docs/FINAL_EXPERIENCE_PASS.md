# MileRecover — Final Experience Pass

Branch: `cursor/production-mvp-29cb`  
Focus: calm, one-job screens. No redesign of brand, colors, or tabs. No architecture replacement.

## Why this pass

Users should never wonder what to do, why they’re asked, what happens next, or whether they’re finished. Every change below reduces friction, removes developer jargon, or makes the next action obvious.

---

## Changelog

### Onboarding

| Change | Why it reduces friction |
|--------|-------------------------|
| Primary ready CTA is **Go to Home**; personalized next step is Secondary | Setup feels finished; optional next action doesn’t trap users |
| Ready screen drops setup dump (pain-count, “permission path”) for one warm status | One emotional beat: you’re ready |
| Vehicle step defaults to skip-first (“Add my vehicle” / “Skip for now”) | Optional paperwork doesn’t feel required |
| Familiar places Primary is **Continue**; skip stays available | Places help later; not a setup wall |
| Protection education collapsed to two calm panels | Story without a lecture |
| Permissions rewritten as “Let MileRecover watch…” with On/Off language | Human, not API docs |
| Softer goal / pain / pattern copy; “change later in Profile” | Conversation, not permanent paperwork |
| Mixed goal body: “I do more than one of these” | Clearer tap choice |

### Home

| Change | Why |
|--------|-----|
| Hero answers “what should I do now?” with human coverage language | One job |
| Coverage SoftPanel only when needed; uses Protected / Partially / Not yet | No debug dashboard by default |
| Trial card demoted (Secondary CTA) and only after value + calm states | Superwall-style: value first, no interrupt during review/degraded |
| Redundant secondary actions suppressed when they fight the hero | One obvious action |
| Gig secondary is “Add a delivery drive” not “Check protection” | Avoids competing protection CTAs |
| Recent empty state hopeful | Never feels blank |

### Manual drive

| Change | Why |
|--------|-----|
| Essential path: When → Miles → Purpose → Work/personal → Save | ≤4 decisions |
| Place labels optional expand; evidence under **More details** | Advanced info stays out of the way |
| “Classification” → “Work or personal?” | Human wording |
| Intro shortened; Delete drive naming | Less form anxiety |

### Protection / Watching

| Change | Why |
|--------|-----|
| Removed runtime / controller / buffer / diagnostics / registered language | Trust without engineer speak |
| Status framed as Yes / Partially / Not yet + one action | Clear state machine for users |
| Buttons: Allow location while using the app / in the background | Matches the ask |

### Plans

| Change | Why |
|--------|-----|
| Lead with Plus value; Free as quiet stay; Monthly\|Annual segmented | Outcome-first, not compliance dump |
| Trial eligibility as caption under Plus, not a second full-screen sell | No aggressive double CTA |
| Removed “store verifies” hero anxiety | Honesty stays; tone calms |
| Rescue clearly one-time; renewal one short sentence | No fake urgency |

### Review / Proof / Profile

| Change | Why |
|--------|-----|
| Review empty: “You’re caught up” | Hopeful, finished |
| Provenance: “Not sure about this one” / “Possible missing drive” | Human |
| Proof empty: “No work drives in this period yet” | Warm, clear |
| Profile: Coverage status in plain language; “Add anytime” for vehicles/places | Optional setup lives here |
| Edit setup: “Update your answers” / “change anytime” | Onboarding never feels permanent |

### Trial offer

| Change | Why |
|--------|-----|
| “You’re getting real value…” after first confirmed drive | Value-triggered |
| Not now + non-primary CTA | Easy dismiss; wait for next success |
| Hidden during Review-priority and degraded coverage | Never interrupt critical work |

---

## Intentionally unchanged

- Brand colors, tab bar (Home · Review · Proof · Profile)
- Domain trip authority, entitlements, purchase port honesty
- Capability gates (PDF/Plus/watching)
- Locked visual identity (green/white)

## Validation

Run `npm run test:mobile-expo`, `npm run typecheck:mobile-expo`, and `npm run check:all` after this pass. UI evidence JSON regenerates from screen evidence tests.
