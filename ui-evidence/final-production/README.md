# Final production evidence (`0.1.7-final.1`)

## Automated (this environment)

| Artifact | Notes |
|---|---|
| Domain tests | 92 passed (`packages/domain`) |
| Mobile tests | 94 passed (`apps/mobile-expo`) |
| Typecheck | `tsc --noEmit` green |
| check:all | green |
| `docs/product/FINAL_PRODUCTION_AUDIT.md` | Pre-implementation audit |
| `docs/release/FINAL_RELEASE_AUDIT.md` | Release audit |

## Device / visual

Local KVM/emulator may be unavailable in the cloud agent. Capture on a physical Android device after installing the `0.1.7` preview APK:

1. Onboarding (your work → protect → personalize → ready)
2. Home — protection off / setup / active / needs attention
3. Permission guided flow
4. Protection active + FGS notification
5. Review — Needs you / Done / empty “No drives need classification.”
6. Manual drive
7. Vehicle save (canonical title)
8. Proof readiness counts match CTA
9. Report CSV share
10. Profile / Plans (single preview notice) / Rescue
11. Offline + force-close reopen (trips persist)

Store screenshots in this folder as `01-….png` … when captured.
