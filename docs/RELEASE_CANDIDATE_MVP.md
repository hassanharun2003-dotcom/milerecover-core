# MileRecover Release Candidate MVP

Branch: `cursor/release-candidate-mvp-29cb`  
Build label: `0.1.3-rc.1` · Runtime: `0.1.3`

## What shipped

Real local trips, review decisions with undo, gap-based recovery suggestions (no invented miles), CSV import/export, PDF generation via `expo-print`, permission plumbing via `expo-location`, personalized 8-step onboarding, and honest automatic-capture unavailable state.

## Native note

`0.1.3` adds `expo-location`, `expo-document-picker`, `expo-file-system`, `expo-sharing`, and `expo-print`. Install the new preview APK; OTAs for runtime `0.1.2` will not include these native modules.

## Physical checklist

1. Fresh install → complete onboarding  
2. Add a manual drive → close app → reopen → trip remains  
3. Create two spaced work drives → recovery suggestion appears  
4. Review Work/Personal/Not a drive → Undo  
5. Proof totals match confirmed drives  
6. Share CSV and PDF  
7. Import a CSV  
8. Profile → About shows `0.1.3-rc.1`  
9. No Alex Johnson / 87.6 mi in live mode  
