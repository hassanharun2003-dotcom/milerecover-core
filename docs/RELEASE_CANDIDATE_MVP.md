# MileRecover Release Candidate MVP

Branch: `cursor/release-candidate-mvp-29cb`  
Build label: `0.1.3-rc.1` · Runtime: `0.1.3`

OTA update group: `7e901560-cede-4442-bfd3-117ec8944caa`  
Android update ID: `019fc6c1-3aa4-7f8b-997e-682b5f0eea80`  
EAS Android build: `b5bf6f9a-23f2-43f5-b4d4-5b9323d9aef3`  
Dashboard: https://expo.dev/accounts/milerecover/projects/milerecover/updates/7e901560-cede-4442-bfd3-117ec8944caa  

**Direct APK:** https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.3/MileRecover-preview-0.1.3.apk  
SHA-256: `e6983dc51e9c6a680c355a86e51ed0f81400b8479d3af7a1809435db77e17582`  
Package `com.milerecover.app` · versionName `0.1.3` · versionCode `4`

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
