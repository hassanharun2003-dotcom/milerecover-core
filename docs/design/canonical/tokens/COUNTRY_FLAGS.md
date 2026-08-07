# CountryFlag Component Specification

**Status:** Spec locked for production identity; Figma component pending write access  
**Identity driver:** ISO 3166-1 alpha-2 country code

## Visual treatment (locked)

| Property | Spec |
|---|---|
| Shape | Circular clip (or slightly rounded circle) matching Region & Rate row in approved board |
| Size (row) | Match country picker row icon size from canonical crop (measure after binary available); default target **24×24 pt** until measured |
| Border | Optional 1px light border using `color.border` so light flags remain visible on white |
| Placement | Leading icon in `CountryRow` before localized country name |
| Fallback | Neutral globe / ISO code badge if flag asset missing — never a hand-drawn fake flag |

## Required countries (explicit)

| ISO | Display name (EN) | Asset strategy |
|---|---|---|
| `US` | United States | Official ISO-coded flag asset |
| `CA` | Canada | Official ISO-coded flag asset |
| `GB` | United Kingdom | Official ISO-coded flag asset |
| `AU` | Australia | Official ISO-coded flag asset |

## Scalable behavior for other countries

1. Resolve `countryCode` → flag asset via ISO alpha-2 key.
2. Prefer a maintained ISO flag set (e.g. licensed / open flag icon pack keyed by ISO), not bespoke redraws.
3. Display localized country name from region/locale tables; flag is identity chrome only.
4. If asset unavailable: show ISO code in a muted circle; **do not invent** national flag geometry.
5. Region & Rate and any country picker must use the same `CountryFlag` + `CountryRow` components.

## Production mapping

| Piece | Notes |
|---|---|
| Component | `CountryFlag` (`code: IsoCountryCode`, `size`) |
| Row | `CountryRow` (flag + name + chevron) |
| Data | ISO code from user region settings |
| Forbidden | Manually inventing inaccurate national flags |

## Figma

- Component `CountryFlag` with variants `US` / `CA` / `GB` / `AU` / `Other`
- `Other` uses placeholder slot bound to ISO asset library
- **Created in Figma:** `false` (no write access — see `docs/design/FIGMA_STATUS.md`)
