# Device visual mismatches — 0.2.5 Batch A/B

Evidence from Pixel 6 AVD (`sdk_gphone64_x86_64`, API 34, 1080×2400, TCG).

## Corrected before rebuild (image-lock.2)

| Screen | Mismatch | Correction |
|---|---|---|
| Welcome | App icon was blue chevron, not green shield mark | `MRWelcomeLogo` draws dark-green rounded mark |
| Welcome | Extra “I already use a mileage app” link under CTA | Removed from Welcome footer (not in collage) |
| Welcome | Skip used primary green tertiary weight | Skip uses muted secondary text |
| Auth–Region | Progress “N of 6” | Progress excludes Welcome → “N of 5” (`8262305` + rebuild) |
| Home | Greeting fell back to “Welcome back” without name | Time-of-day greeting (`Good morning` / …) |
| Home | Empty hero used long CTA copy instead of money silhouette | Shows truthful `$0.00` / `this year.` when rate usable |
| Home | Metric tile put unit inside value (`0.0 mi`) | Numeric value + “Work miles” label |
| Home | Notification control was ◉ glyph | `notifications-outline` icon |
| Home | Hero glyph was text check | `shield-checkmark` icon |

## Honest remaining differences (post-correction intent)

| Screen | Remaining |
|---|---|
| Welcome | Pagination dots imply 4 intro pages; product only has one Welcome step |
| Auth | No collage tile — layout is protocol-required, not pixel-locked to a crop |
| Purpose | Selection checkmark / green border only after tap (capture can show unselected) |
| Region | Info row uses check circle; collage uses “i” info treatment |
| Protection | Product copy/actions (“Turn on drive protection”) vs collage Protection Center tile (different screen) |
| Ready | Not a collage tile; success CTA pair differs from marketing panels |
| Home | Truthful empty state (`$0.00`, `0` drives) vs collage populated sample (`$487.32`, `1,264`) |
| Home | Status panel attention tone when protection paused (amber) vs collage mint “All systems normal” |
| Home | Next-up label follows live next-best action, not always “Review 2 drives” |
| All | Status bar / gesture inset differ from collage chrome |
| Crops | Working crops are vision-derived geometry locks; original collage binary was not on disk |

## Acceptance for this stop condition

Batch A + Batch B presentation rebuilt to white canvas + collage hierarchy. Device PNGs under `raw/`, comparisons under `compare/` + `diff/`. Review/Proof and later batches not started.
