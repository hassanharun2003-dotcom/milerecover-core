# MileRecover V2 Product Polish — User-First Experience

**Branch:** `cursor/expo-preview-release-29cb`  
**Scope:** Copy, hierarchy, spacing, empty/success/error calmness — **no new major features, no tab IA changes**  
**Feeling target:** *Someone is quietly protecting my work miles.*

---

## 1. Complete UX audit (summary)

Audited every Expo screen as if freshly downloaded from the App Store.

| Area | Before (problem) | Psychological risk |
|------|------------------|--------------------|
| Home | “Protected” + stacked equal cards + “Not quite ready” | Felt like a status dashboard, not relief |
| Review | Duplicate headers, “approximate”, ledger provenance | Mild anxiety / cognitive load |
| Proof | “Items need review” / “Resolve” / stats upfront | Accounting scramble energy |
| Profile | Settings dump; dark membership banner felt locked | Upsell + clutter |
| Onboarding | Ready step led with permission denials | Undermined “you’re ready” |
| Pricing | Feature checklists (“Cloud backup placeholder”) | Sold features, not outcomes |
| Export / Import | Tax disclaimers + “exceptions” language | Legal anxiety + accounting tone |
| Supporting | “Tracking engine”, “Honest placeholder”, Business≠Work | Meta / inconsistent / cold |
| Visual system | Identical bordered StatusCards everywhere | No focal point; premium collapsed |

**Competitor complaint themes applied (not copied):** wrong trips → never invent; battery fear → calm limited-access copy; distrust of totals → review-first; offline/data loss → “saved safely”; subscription pressure → “Upgrade when it helps”; onboarding overwhelm → one calm choice per step.

---

## 2. Issues found → improvements made

### Home
| Issue | Improvement | Why it helps |
|-------|-------------|--------------|
| Robotic “Protected” | “You’re covered today” | Relief, not status LED |
| Card soup | One hero StatusCard + SoftPanel glance + lighter secondary | One answer first: am I covered? |
| “Ready for proof” block | “If work asks today” / report-ready language | Outcome: can I submit? |
| Week metrics labels | Miles kept / found / Ready to share | Human, not ledger |
| Quiet empty | Reassure + never invent | Empty ≠ unfinished |

### Review
| Issue | Improvement | Why |
|-------|-------------|-----|
| Duplicate “Needs review” | Segment-only “Needs you / Done” | Calmer, less shouty |
| “X mi approximate” | “About X mi” | Soft certainty |
| Provenance jargon | “Might have missed” / “We’re not sure yet” | Human assistant |
| Empty reviewed | “Choices you make show up here…” | Undo confidence |

### Proof
| Issue | Improvement | Why |
|-------|-------------|-----|
| Resolve / Items need review | “A few drives need a look” / Review drives | Ten-seconds energy |
| Stats before outcome | Hero = report ready; details expandable | One job: ready to submit |
| “Verified / Adjustments” | Confirmed drives; hide clutter | Less accounting |
| Empty period | Reassuring EmptyState | Not a blank bug |

### Profile
| Issue | Improvement | Why |
|-------|-------------|-----|
| Flat dump | Driving · Protection · Import · Privacy · Help | Scannable life domains |
| Dark upsell banner | Soft forest panel + “Upgrade when it helps” | Confidence without pressure |
| “Coming later” meta | “Soon” + honest ComingLater body | No fake controls |

### Onboarding
| Issue | Improvement | Why |
|-------|-------------|-----|
| Competitive body copy | Quiet protect / no invented miles | Trust |
| Ready + denial grid | “You’re set” + demoted “Not granted yet” honesty | Relief first, honesty second |
| Card-heavy need/usage | Title + body + selections | Lighter cognitive load |

### Subscriptions
| Issue | Improvement | Why |
|-------|-------------|-----|
| Feature laundry lists | Outcome lines (never lose miles, warn before lost money, reports ready) | Users buy outcomes |
| Rescue as heavy cards | Quiet list + captions | No pressure |

### Design system
| Issue | Improvement | Why |
|-------|-------------|-----|
| Every card identical | `emphasis: hero \| subtle`, SoftPanel, softer MembershipBanner | Focal hierarchy |
| Working… | One moment… | Softer microcopy |
| Proof hero | “Your report is ready whenever you need it” | Outcome language |

---

## 3. Screens changed

- `OnboardingFlow.tsx`
- `HomeScreen.tsx`
- `ReviewScreen.tsx`
- `ProofScreen.tsx`
- `ProfileScreen.tsx`
- `SupportingScreens.tsx` (Manual, Trip details, Recovery, Protection, Tracking, Vehicles, Places, ComingLater, Export, Report preview, Plans, Help)
- `BringExistingMileageScreen.tsx`, `ImportPreviewScreen.tsx`
- `AboutScreen.tsx`
- `design-system/index.tsx`
- `fixtures/scenarios.ts`, `fixtures/subscription.ts`

---

## 4. Before vs after (reasoning)

| Moment | Before | After |
|--------|--------|-------|
| Open Home | “Protected” + metrics | “You’re covered today” + one action if needed |
| Something’s wrong | “Protection needs attention” | “Background access is limited… what’s saved stays put” |
| Proof blocked | “Resolve items” | “A few drives need a look first” |
| Proof ready | “Ready for proof” + dense lists | “Your report is ready…” + details on demand |
| Pricing | Capability bullets | Outcome promises + calm CTA |
| Empty Review | Fine | Stronger “ten seconds and done” reassurance |

---

## 5. Validation

- Four tabs unchanged: Home · Review · Proof · Profile
- No new major features or hidden menus
- Honesty preserved: permissions still “Not granted yet”; tracking stub still honest
- Tests: `npm run test:mobile-expo` 37/37; `check:all` pass
- Build label: `0.1.2-preview.3` for preview OTA

**Trust / protection / simplicity / confidence:** Home answers coverage first; Review asks calmly; Proof sells readiness not stats; Profile organizes life domains; Pricing sells outcomes without urgency.
