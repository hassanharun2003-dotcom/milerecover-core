# MileRecover — 10/10 Experience Pass

Branch: `cursor/production-mvp-29cb`  
Build label: `0.1.4-mvp.3`  
Focus: polish only. No brand, nav, or feature redesign.

## Before → after

| Area | Before | After | Why |
|------|--------|-------|-----|
| Onboarding | 10 steps including name, vehicle, places, permissions | **6 steps** to Home; vehicle/places/name/permissions after value | ≥35% less effort; never block value |
| Manual trip | When → Miles → Purpose → Work/personal → Save | **Work/Personal → Start/End → Distance → Save**; rest under More details | Progressive disclosure; less typing via chips |
| Home hero | “Protect your first work drive” | **“You’re protected.”** + watching / “before you lose mileage” | Relief in 3 seconds |
| Trial offer | After first confirmed drive | After **recovery / export / 5 work drives / missing trip** | Earned; start free |
| Trial copy | “You’re getting real value…” | “We’ve already helped protect your mileage. Continue… free for 7 days.” | No fake urgency |
| Plus bullets | Feature names | Outcome sentences (never lose miles / recover before lost / reports ready) | Conversion without dark patterns |
| Empty states | Mixed | “No work drives yet” / “You’re caught up” / “We’ll be here…” | Encouraging, never blank |
| First week | Timestamps only | Soft celebrate first drive / report / recovery | Teach without interrupting |
| Technical language | “Runtime version” in About | “App update version” / “Latest update” | Plain English |

## Rules checked

1. One job per screen — hero + one CTA; celebrations dismissible  
2. Less typing — date chips, place chips, purpose chips, vehicle picker  
3. Progressive disclosure — More details collapsed  
4. Short onboarding — 10 → 6 steps (~40%)  
5. Home relief — protected messaging  
6. No technical jargon in user surfaces  
7. Paywall after value only  
8. Plus as outcomes  
9. Encouraging empties  
10. Small motion only (existing selection/check patterns)  
11. Short warm microcopy  
12. Less scroll — tighter spacing on Home/trial card  
13. First-week soft celebrates  
14. Plus feels obvious ($8.99 framing on Plans)  
15. No feature bloat  

## Validation

- `npm run test:mobile-expo` — 54 passed  
- `npm run test:domain` — 43 passed  
- `npm run typecheck:mobile-expo` — passed  
- `npm run check:all` — passed  
- UI evidence under `docs/assets/ui-evidence/`  
- Screen comps under `/opt/cursor/artifacts/screenshots/10of10-*.png`

## OTA

- Update group: `ad83fcbf-221c-4980-b7b9-5bf4118e1e85`  
- Android update ID: `019fc8b8-2f02-70bd-a494-73b095ec330c`  
- iOS update ID: `019fc8b8-2f02-7e7b-b01d-15943fe296cf`  
- Message: `0.1.4-mvp.3 10/10 experience pass: lean onboarding, earned trial, relief home`  
- Commit: `ce35b6d77215934058ddeefd42fcfd740999e81d`  
- Dashboard: https://expo.dev/accounts/milerecover/projects/milerecover/updates/ad83fcbf-221c-4980-b7b9-5bf4118e1e85  

Requires an installed `0.1.4` preview APK. Close and reopen the app to pull the update.
