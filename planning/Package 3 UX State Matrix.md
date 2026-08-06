# Package 3 — UX State Matrix

| Surface | empty | loading | denied | restricted | unavailable | stale | error |
|---------|-------|---------|--------|------------|-------------|-------|-------|
| Onboarding welcome | — | — | — | — | — | — | — |
| Onboarding location | — | — | Explain + Settings path | Explain reduced accuracy | — | — | — |
| Onboarding ready | Checklist incomplete | — | Fix steps listed | Fix steps listed | — | — | — |
| Home Protection Health | "No confirmed activity yet" | Hydrating | `limited` level | `at_risk` if bg restricted | engine unavailable → at_risk | attention + stale copy | load error banner |
| Home period miles | 0.0 mi (valid) | — | — | — | — | stale warning | error |
| Review queue | "Nothing needs attention" | — | — | — | — | — | — |
| Missing trip recovery | — | — | — | — | — | — | transition error toast |
| Trip detail | N/A until trip exists | — | — | — | no route → hide map | — | — |
| Proof | 0 mi + completeness | — | — | — | — | staleDataWarning | — |
| Profile permissions | not_determined labels | — | denied + fix steps | restricted + fix steps | motion N/A on some platforms | — | — |
| Manual add | guidance only (no fake trip) | — | — | — | — | — | — |

All states derive from `@milerecover/domain` selectors — no hardcoded demo mileage in production paths.
