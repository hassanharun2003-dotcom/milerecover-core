# MileRecover — Final Product Lock

Version stamp: **0.1.8-product-lock.1**  
Onboarding version: **9** (Welcome → Purpose → Country/Units/Rate → Protection → Ready)

## Locked navigation

Exactly four tabs: **Home · Review · Proof · Profile**

## Locked surfaces

| Surface | Composition |
|---|---|
| Home | Greeting, protection status, period summary, next best action, recovery alert, recent drives, Quick Add |
| Review | Route preview, distance, time, purpose, confidence, estimated value; Work / Personal / Not sure / Edit / Undo |
| Proof | Week / Month / Quarter / Year / YTD; readiness; Reports (Preview, PDF, CSV, Share) |
| Profile | Profile, Vehicles, Country, Units, Rates, Protection, Tracking, Import, Subscription, Privacy, Help, About |
| Onboarding | Five screens max; never invent mileage; skip protection allowed |

## Design system

Forest green / soft white / mist green · soft shadows · 48×48 touch targets · skeletons · dialogs · sheets · bar chart · route map preview · ThemeProvider (light/dark canvas) · automatic `userInterfaceStyle`

## Entitlements (unchanged)

Free forever: unlimited manual, **40 auto trips/month**, 1 vehicle, tracking health, **1 missing scan/month**, CSV.  
Plus/Pro unlock automation depth and advanced export. Free is never punished.

## Maps honesty

Route visualization ships as **`RouteMapPreview`** (pure React Native plot of recorded points). No invented path. Google Maps / Apple Maps SDK remain an external native dependency for a future binary when store builds can absorb the native module.

## Tracking

Production GPS path: `expo-location` + TaskManager via `trackingEngine.ts`, bootstrapped in `App.tsx`. Background capture, gap recovery suggestions, offline-safe local records.
