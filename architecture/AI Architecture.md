# MileRecover AI Architecture

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** AI / Engineering

---

## Mission

AI in MileRecover **assists classification, detection quality, and recovery suggestions**—it never creates evidentiary records alone.

**AI assists but never replaces evidence.** **Never invent mileage.**

---

## AI Boundaries (Hard Rules)

| Allowed | Forbidden |
|---|---|
| Suggest business purpose text | Create trips from calendar/LLM alone |
| Flag anomalous trips | Adjust GPS distances upward |
| OCR odometer (user confirms) | Generate synthetic location paths |
| Summarize weekly activity (metadata) | Auto-confirm trips via AI |
| Improve drive/walk classification (on-device) | Fabricate historical gaps |
| Duplicate trip detection | Imply miles for unaccounted days |

Enforced at API gateway and client validators.

---

## AI Subsystems

### 1. On-Device ML (Native)

| Model | Purpose | Offline |
|---|---|---|
| Activity classification | Drive vs walk vs stationary | ✓ |
| Drive start/end refinement | Reduce false positives | ✓ |
| Geofence familiarity (H2) | Suggest business locations | ✓ |

Framework: Core ML (iOS), TensorFlow Lite (Android)

### 2. Purpose Suggestion (Cloud LLM)

**Input (user-controlled):**
- Destination address / POI name
- User's historical purpose patterns (local aggregate)
- Time of day, day of week
- Industry template (user setting)

**Output:**
- Suggested purpose string
- Confidence 0–1
- Model version ID

**Flow:**
1. User opens trip detail
2. AI suggestion fetched (or cached template)
3. Displayed as `AISuggestionChip`
4. User accept / edit / dismiss
5. Only user-confirmed text in export

**No destination → no purpose suggestion** (avoid hallucination)

### 3. OCR — Odometer (Hybrid)

- On-device OCR first (Apple Vision / ML Kit)
- Cloud fallback for low confidence
- User always edits before save

### 4. Anomaly Detection (Rules + ML)

Flags:
- Distance >500 mi single trip
- Speed >120 mph sustained
- Duplicate overlapping trips
- Classification flip pattern anomalies

Output: `flags[]` on trip, lowers Proof Score, surfaces in review.

### 5. Recovery Suggestions (H1)

- Calendar NLP for event location extraction
- **Does not compute export distance** without user input
- Pattern hints (H2): opt-in, heavily discounted Proof Score

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│              Mobile Client              │
│  ┌─────────────┐    ┌─────────────────┐ │
│  │ On-device ML│    │ AI Suggestion   │ │
│  │ (activity)  │    │ Cache + UI      │ │
│  └──────┬──────┘    └────────┬────────┘ │
└─────────┼─────────────────────┼───────────┘
          │                     │ HTTPS
          ▼                     ▼
┌─────────────────────────────────────────┐
│              AI Gateway                 │
│  Auth · Rate limit · PII scrubbing      │
└─────────┬───────────────────────────────┘
          │
    ┌─────┴─────┬─────────────┐
    ▼           ▼             ▼
┌────────┐ ┌──────────┐ ┌────────────┐
│ LLM    │ │ OCR Svc  │ │ Embeddings │
│ Provider│ │         │ │ (future)   │
└────────┘ └──────────┘ └────────────┘
```

---

## PII & Data Minimization

**Sent to cloud AI:**
- POI names, addresses (trip context)
- Anonymized purpose history vectors
- Odometer crop images (encrypted, deleted post-OCR)

**Never sent:**
- Full raw GPS traces (unless user opts into improvement program)
- Contact names from calendar without opt-in
- Unrelated location history

---

## Model Providers (Proposed)

| Use | Provider | Fallback |
|---|---|---|
| Purpose LLM | OpenAI / Anthropic API | Template-based local |
| OCR | On-device primary | Google Cloud Vision |
| Embeddings (H2) | OpenAI | Local hash matching |

Provider abstraction layer for swap without client changes.

---

## Audit Trail

Every AI interaction stores:
```json
{
  "trip_id": "...",
  "model": "purpose-v1",
  "input_hash": "...",
  "output": "Client showing at...",
  "confidence": 0.82,
  "user_action": "edited|accepted|dismissed",
  "timestamp": "..."
}
```

Available in trip detail "AI history" (advanced settings).

---

## Offline Behavior

| Feature | Offline |
|---|---|
| Activity ML | ✓ |
| Purpose suggestion | Cached templates only |
| OCR | On-device only |
| Anomaly rules | ✓ |

Core app fully functional without AI cloud.

---

## Evaluation

| Metric | Target |
|---|---|
| Purpose suggestion accept rate | 40–60% (too high = not adding value) |
| OCR accuracy (user unchanged) | >90% |
| False anomaly flag rate | <5% |
| Latency purpose suggestion p95 | <2s |

Human review sample: 100 AI outputs/week in beta.

---

## Related Documents

- [Recovery Engine.md](./Recovery%20Engine.md)
- [Proof Score.md](./Proof%20Score.md)
- [../docs/04 Trust Rules.md](../docs/04%20Trust%20Rules.md)
- [Security.md](./Security.md)
