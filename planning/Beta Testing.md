# MileRecover Beta Testing Plan

**Status:** Planned  
**Duration:** 4 weeks post-Sprint 3  
**Last Updated:** July 2026  
**Owner:** Product / QA

---

## Beta Objective

Validate that MileRecover delivers **trustworthy, defensible mileage tracking** with real users before public launch.

Primary question: *Do users trust the log enough to export it to their CPA?*

---

## Beta Success Criteria

| Metric | Target | Kill Threshold |
|---|---|---|
| Phantom trip rate | <5% | >10% → block launch |
| Week 2 retention | ≥50% | <35% |
| CPA export acceptance | ≥85% | <70% |
| NPS (beta survey) | ≥30 | <10 |
| Critical Trust Rule violations | 0 | Any → hotfix |
| Offline data loss | 0% | Any incident |
| Avg Proof Score (confirmed) | 75+ | Informational |

---

## Cohort Design

### Size & Composition

**Total:** 75 users (target 100 if waitlist strong)

| Segment | Count | Recruitment |
|---|---|---|
| Real estate agents | 20 | RE forums, broker partnerships |
| Contractors / field service | 20 | Trade communities |
| Gig / delivery independents | 15 | Gig worker groups |
| Other self-employed | 10 | Waitlist |
| CPA panel (export reviewers) | 5 | Direct outreach |
| Internal dogfooders | 5 | Team + friends |

### Platform Split
- iOS: 55%
- Android: 45%

Reflects target market but overweight Android for battery/OEM testing.

---

## Recruitment

### Inclusion Criteria
- Self-employed, drives 100+ business miles/month
- Willing to complete 2 surveys and 1 interview
- U.S. based (MVP scope)

### Exclusion Criteria
- Works for competing mileage app
- Fleet manager needing 10+ vehicles

### Incentive
- 6 months Pro free
- Founding member pricing lock ($49/yr)
- Direct line to product team

---

## Beta Phases

### Week 1: Onboarding Focus
- Monitor permission funnel
- First trip detection time
- Daily check-in Slack/Discord channel
- Hotfix channel for crashes

**Activities:**
- 15-min onboarding calls with 10 users
- Track where users disable tracking

### Week 2: Review Habit
- Review completion rate
- Phantom trip reports
- Proof Score comprehension survey

**Activities:**
- Push notification A/B (digest vs off)
- Mid-beta survey (5 questions)

### Week 3: Export & CPA
- All users prompted to export sample month
- CPA panel reviews 3 exports each
- Export rework rate measured

**Activities:**
- CPA feedback session (90 min)
- Export format iteration if needed

### Week 4: Stress & Edge Cases
- Offline week challenge (voluntary 20 users)
- Battery reporting (in-app + survey)
- Long drive test (2 users, 200+ mi day)

**Activities:**
- Exit survey + NPS
- 10 user interviews (30 min each)

---

## Feedback Collection

| Method | Frequency |
|---|---|
| In-app shake-to-feedback | Always |
| Beta Discord channel | Daily monitoring |
| Mid-beta survey | Week 2 |
| Exit survey + NPS | Week 4 |
| User interviews | Weeks 1–4 |
| CPA export review form | Week 3 |
| Analytics (privacy-respecting) | Continuous |

### Key Interview Questions
1. Did you trust trips the app detected? Why or why not?
2. Did you feel the app invented any mileage?
3. Would you give this export to your CPA? Why or why not?
4. What almost made you uninstall?
5. How did battery impact feel?

---

## QA Test Matrix (Beta Build)

### Trust Rules Verification
- [ ] No trip in export without evidence
- [ ] Rejected trips stay rejected
- [ ] Gaps shown without implied miles
- [ ] AI features disabled or labeled (MVP: disabled)

### Device Matrix (Minimum)
| Device | OS |
|---|---|
| iPhone 14 | iOS 17+ |
| iPhone 11 | iOS 16 |
| Pixel 7 | Android 14 |
| Samsung Galaxy A54 | Android 13 |
| Budget Android (TCL/Moto) | Android 12 |

### Scenario Tests
- Rural offline 3 days
- Urban canyon GPS
- Permission downgrade mid-beta
- Second device sync
- Pro subscription purchase flow

---

## Issue Triage

| Priority | Definition | SLA |
|---|---|---|
| P0 | Data loss, phantom export, crash loop | 24h fix |
| P1 | Detection failure >50% drives | 48h |
| P2 | UX confusion blocking review | Sprint fix |
| P3 | Polish, copy | Backlog |

---

## Beta Exit Decision

**Go to Launch if:**
- All success criteria met
- No open P0/P1
- CPA panel recommends with ≥85% acceptance
- Founding team Trust Rules sign-off

**Delay Launch if:**
- Phantom rate 5–10%: 2-week fix sprint
- Phantom rate >10%: major engine rework
- CPA acceptance <70%: export redesign

---

## Communication Plan

| Audience | Channel | Cadence |
|---|---|---|
| Beta users | Email + Discord | Weekly update |
| Team | Slack | Daily during beta |
| Waitlist | Email | Beta learnings teaser at end |

---

## Privacy

- Beta users sign beta agreement
- Feedback may be quoted anonymously in marketing
- Location data not accessed by team without explicit consent for support

---

## Related Documents

- [MVP.md](./MVP.md)
- [Launch Plan.md](./Launch%20Plan.md)
- [../docs/10 Success Metrics.md](../docs/10%20Success%20Metrics.md)
- [../docs/05 User Personas.md](../docs/05%20User%20Personas.md)
