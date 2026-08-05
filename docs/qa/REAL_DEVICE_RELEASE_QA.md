# Real-device release QA — MileRecover 0.1.8

Non-engineer checklist. Record results in the table at the bottom.

**Build under test:** `0.1.8` / `0.1.8-product-lock.1`  
**Android package:** `com.milerecover.app`  
**Install:** use the published preview APK direct link (not Expo Go).

---

## Installation

| # | Step | Expected |
|---|---|---|
| I1 | Clean install APK | App launches to onboarding or Home; no Metro/QR |
| I2 | Upgrade over prior preview | Data retained if same package; version shows 0.1.8 in About |
| I3 | First launch offline | App opens; local storage works |
| I4 | Force-stop + reopen | State restored; no crash |
| I5 | Reboot phone + reopen | State restored |

## Onboarding

| # | Step | Expected |
|---|---|---|
| O1 | Welcome → Get started | Brand + “Protect every work mile” |
| O2 | Purpose Employee / Business / Gig / Mixed | Continues; wording adapts later |
| O3 | Country / units / rate | Values save; rate optional |
| O4 | Skip protection | Ready → Home in Manual mode |
| O5 | Turn on protection + allow permissions | Home shows Protected or Needs attention honestly |
| O6 | Deny location | Never shows Protected; clear repair path |

## Tracking (device required)

| # | Step | Expected |
|---|---|---|
| T1 | App open during short drive (>150m, >90s) | Pending trip appears in Review after ~3 min quiet |
| T2 | Background app during drive | Samples continue when Always/all-the-time allowed |
| T3 | Screen off during drive | Trip still closes after quiet (OEM dependent) |
| T4 | 5-minute stop mid-drive | May finalize prior segment; no invented bridge |
| T5 | Traffic stop <3 min | Usually continues same trip |
| T6 | Very short walk/noise | Discarded — no fake trip |
| T7 | Multiple drives | Separate trips; no duplicates |
| T8 | Weak GPS | Low confidence + honest notes |
| T9 | Airplane / no network | Trip still creates; labels may fill later |
| T10 | Force-close during drive | On reopen, pending/buffer recovers without inventing path |
| T11 | Reboot during/after drive | Pending queue / buffer recovers |
| T12 | Battery saver / Samsung Restricted | Needs attention or limited background — never false Protected |
| T13 | Midnight crossing | Trip times correct; month auto-count uses startAt |

## Trip result

| # | Step | Expected |
|---|---|---|
| R1 | Start/end times sensible | Match observed drive |
| R2 | Route preview shows recorded points | Start/end markers; no Milwaukee demo |
| R3 | Distance reasonable vs odometer | Within noisy GPS tolerance; not invented map match |
| R4 | Addresses | City/region when online; coordinates kept if offline |
| R5 | Work / Personal / Not sure / Edit / Undo | All work; Undo restores |
| R6 | Delete | Removed from Proof |

## Proof

| # | Step | Expected |
|---|---|---|
| P1 | Week/Month/Quarter/Year/YTD | Totals match confirmed work only |
| P2 | Personal excluded | Not in distance/value |
| P3 | Readiness CTA | Opens exact trip/field |
| P4 | Preview / CSV / PDF / Share | Files open; naming professional |
| P5 | Generated timestamp visible | Matches export moment |
| P6 | Historic rate | Older accepted trips keep snapshot value |

## Privacy

| # | Step | Expected |
|---|---|---|
| V1 | Exact home not broadcast in Home cards | Coarse labels preferred |
| V2 | Delete local data | Clears trips/setup |
| V3 | No invented route when points missing | Empty/honest fallback |

## Billing

| # | Step | Expected |
|---|---|---|
| B1 | Free auto counter | Matches auto trips this month |
| B2 | 40th auto trip | Further auto capture gated; manual still works |
| B3 | Purchase / restore (sandbox) | Entitlement updates when store configured |
| B4 | Offline entitlement | Last known local entitlement; no fake Plus |

---

## Results table

| Device | OS | App build | Date | Case IDs | Result (Pass/Fail) | Defect ID | Notes |
|---|---|---|---|---|---|---|---|
|  |  | 0.1.8 |  |  |  |  |  |
|  |  | 0.1.8 |  |  |  |  |  |
