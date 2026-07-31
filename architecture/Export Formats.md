# MileRecover Export Formats

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Product / Engineering  
**Companion:** [Integrations.md](./Integrations.md) Tier 0

---

## Purpose

Defines **CPA-ready export formats** for MileRecover. Exports reflect **confirmed** business travel with honest metadata — never invented mileage.

Philosophy: **Trust over automation**, **every work mile accounted for** (including gap disclosure).

---

## Export Types (MVP)

| Format | Use | Generated |
|---|---|---|
| PDF Mileage Log | IRS-aligned user record; CPA review | On-device (offline) |
| CSV | CPA import, spreadsheet | On-device (offline) |
| JSON | User data portability, GDPR export | On-device + server (H2) |

See [IRS Research.md](../research/IRS%20Research.md) and [Export Disclaimer.md](../docs/Export%20Disclaimer.md).

---

## Inclusion Rules (Default)

| Trip status | Included in business total | In export body |
|---|---|---|
| Confirmed business | Yes | Yes |
| Pending review | No | Excluded (optional appendix toggle) |
| Personal | No | Optional separate section |
| Rejected | No | No |
| Recovered (accepted) | Yes, if confirmed | Yes, source marked |

**Gaps:** Listed in summary section — no implied miles.

---

## PDF Mileage Log Structure

### Header
- Taxpayer name (from profile)
- Business name (optional)
- Vehicle description (MVP: default vehicle label)
- Period: start date – end date
- Generated timestamp, app version, sync status

### Summary block
- Total confirmed business miles (tabular)
- Pending trips excluded: count + miles
- Unaccounted days: count + date list
- Period Proof Score (average weighted)

### Trip table columns

| Column | Required | Notes |
|---|---|---|
| Date | Yes | Trip start date (local TZ) |
| Destination | Yes | End address or route label |
| Business purpose | Yes for business | User-attested |
| Miles | Yes | 1 decimal; no rounding up |
| Source | Yes | auto, manual, recovered, imported |
| Proof Score | Yes | 0–100 at export |
| Confirmed | Yes | Timestamp or "auto-rule" |

### Footer
- [Export Disclaimer.md](../docs/Export%20Disclaimer.md) text
- AI-assisted trip count if >0

---

## CSV Specification (CPA Import)

**Filename pattern:** `MileRecover_Mileage_YYYY-MM-DD_YYYY-MM-DD.csv`  
**Encoding:** UTF-8 with BOM (Excel compatibility)  
**Delimiter:** comma  
**Header row:** required

### Standard columns

| Column | Type | Description |
|---|---|---|
| `trip_id` | UUID | Stable identifier |
| `date` | ISO date | Local date of trip |
| `start_time` | ISO datetime | Optional |
| `end_time` | ISO datetime | Optional |
| `start_address` | string | If available |
| `end_address` | string | Destination |
| `business_purpose` | string | User-confirmed |
| `miles` | decimal(2) | Distance |
| `classification` | enum | business, personal |
| `source` | enum | auto, manual, recovered, imported |
| `proof_score` | int | 0–100 |
| `user_confirmed_at` | ISO datetime | |
| `ai_assisted` | boolean | |
| `flags` | string | comma-separated: gap,incomplete,etc. |

### CPA notes row (comment line optional)
First line may be `# MileRecover export — confirmed business trips only. Not tax advice.`

---

## JSON Export (Portability)

Full trip objects per [Data Model.md](./Data%20Model.md) including:

- Trip fields + classification
- Proof factor breakdown
- Audit event ids (references, not full log)
- Export metadata object

Raw GPS samples: **excluded by default** (Pro+ audit pack H2 optional include).

---

## Import Template (H1 — Generic CSV)

For competitor migration and manual bulk entry — imports create **Recovery suggestions**, not trips.

### Template columns (downloadable)

| Column | Required |
|---|---|
| date | Yes |
| start_address | No |
| end_address | Yes |
| miles | Yes |
| business_purpose | No |
| notes | No |

**File:** `MileRecover_Import_Template.csv` (to ship with app H1)

User maps foreign columns in import UI. Each row → individual review ([Recovery Engine.md](./Recovery%20Engine.md)).

---

## MileIQ / TripLog Import Mapping (H1)

| Foreign field | MileRecover field |
|---|---|
| Date | date |
| Distance | miles (verify units) |
| Category | suggestion only — user confirms classification |
| Start/End | addresses |

Imported rows: `source=imported`, Proof Score base −5.

---

## Watermark (Free Tier)

Free tier PDF/CSV may include footer:

> Exported from MileRecover Free — current month only. Upgrade for full-year CPA export.

Honesty features (gaps, Proof Score, source) are **never** watermarked ([09 Pricing.md](../docs/09%20Pricing.md)).

---

## Related Documents

- [Integrations.md](./Integrations.md)
- [Proof Score.md](./Proof%20Score.md)
- [04 Trust Rules.md](../docs/04%20Trust%20Rules.md) — Category B
- [Sprint 3.md](../planning/Sprint%203.md)
