# MileRecover User Personas

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Product / UX

---

## Overview

MileRecover serves people whose livelihood depends on driving—and who cannot afford mileage logs that fail under scrutiny. Personas inform feature priority, onboarding, and messaging.

All personas share a core need: **every work mile accounted for** without **invented mileage**.

---

## Primary Personas

### 1. Marcus — The Real Estate Agent

**Demographics:** 38, independent realtor, suburban market, iPhone user  
**Annual business miles:** ~12,000  
**Tech comfort:** Medium — uses CRM, hates spreadsheets

**Goals:**
- Capture showing and client meeting miles without thinking about it
- Hand CPA a clean log in March
- Separate personal errands from business stops

**Frustrations:**
- MileIQ logged grocery runs as business trips
- Battery drain caused him to disable tracking for weeks
- Doesn't trust "AI did it" when audit anxiety hits

**MileRecover fit:**
- Proof Score gives confidence before export
- Review queue respects **trust over automation**
- Recovery helps reconstruct weeks he forgot to open the app

**Key quote:** *"I don't need more miles. I need miles I can defend."*

---

### 2. Elena — The General Contractor

**Demographics:** 45, owns small GC firm, Android user, 2 trucks  
**Annual business miles:** ~8,000 personal vehicle + reimburses employee  
**Tech comfort:** Low-medium — prefers simple tools

**Goals:**
- Track job site travel across inconsistent schedule
- Works offline at new construction sites
- Minimal phone fuss while on job sites

**Frustrations:**
- Apps require constant phone interaction
- Lost data when signal dropped at rural sites
- Previous app inflated miles — CPA flagged it

**MileRecover fit:**
- **Offline first** capture
- **Battery friendly** background tracking
- Manual odometer entry as first-class workflow

**Key quote:** *"If it doesn't work without signal, it doesn't work for me."*

---

### 3. Priya — The Mobile Therapist

**Demographics:** 32, LCSW with home office + client visits, iPhone  
**Annual business miles:** ~6,500  
**Tech comfort:** High

**Goals:**
- HIPAA-adjacent privacy sensitivity (client locations)
- Clear business purpose per trip for records
- Quarterly exports for bookkeeper

**Frustrations:**
- Uncomfortable with apps that share location broadly
- Wants control over what's logged and why
- AI business purpose suggestions feel invasive

**MileRecover fit:**
- Granular permission and data controls
- **AI assists but never replaces evidence** — she writes purpose
- Privacy-first architecture (see Security.md)

**Key quote:** *"Suggest, don't assume. This is my license on the line too."*

---

### 4. James — The Rideshare / Delivery Independent

**Demographics:** 28, multi-platform gig worker, Android  
**Annual business miles:** ~22,000  
**Tech comfort:** Medium

**Goals:**
- Separate platform miles from off-platform business travel
- Maximize legitimate non-platform business trips (supply runs, meetings)
- Low subscription cost

**Frustrations:**
- Platform apps track platform trips; everything else is invisible
- Competitors feel like "tax hack" apps
- Needs proof, not hype

**MileRecover fit:**
- Recovery for gaps between platform statements
- Honest gaps — **never invent mileage**
- Affordable tier with full proof on paid plan

**Key quote:** *"Uber knows half my miles. MileRecover needs to know the defensible half."*

---

## Secondary Personas

### 5. Diane — The CPA / Tax Preparer

**Role:** Prepares returns for 40+ self-employed clients  
**Needs:** Clean CSV/PDF exports, source transparency, no inflated totals  
**Adoption driver:** Recommends tools that reduce her rework

**Success metric:** <5% of MileRecover exports require manual correction

---

### 6. Alex — The Side Hustler (Emerging)

**Demographics:** 26, W-2 by day, weekend reselling / consulting  
**Annual business miles:** ~2,000  
**Needs:** Simple setup, clear personal/business split, free tier viability

**Risk:** May churn if onboarding feels "pro-only"  
**Mitigation:** Conservative defaults, education on legitimate deduction scope

---

## Anti-Personas (Not Our User)

| Anti-Persona | Why Not |
|---|---|
| **The Maximizer** | Wants highest possible deduction regardless of legitimacy — conflicts with **never invent mileage** |
| **Fleet Enterprise Admin** | Needs fleet telematics at scale — out of MVP scope |
| **Personal Mileage Optimizer** | No business use case |

---

## Persona → Principle Mapping

| Persona | Top Principle |
|---|---|
| Marcus | Trust over automation |
| Elena | Offline first + Battery friendly |
| Priya | AI assists but never replaces evidence |
| James | Every work mile accounted for |
| Diane | Accuracy over features |

---

## Research Gaps

- [ ] Validate Marcus/Elena split via user interviews (Beta)
- [ ] Quantify CPA export rework rate baseline
- [ ] Android vs iOS priority by segment

See [../research/User Pain Points.md](../research/User%20Pain%20Points.md).

---

## Related Documents

- [06 User Psychology.md](./06%20User%20Psychology.md)
- [05 User Personas.md](./05%20User%20Personas.md)
- [../planning/Beta Testing.md](../planning/Beta%20Testing.md)
