# Prototype C — Bridge approach comparison

**Status:** Evidence gathering — **prototype choice is not a production decision**

---

## Approaches compared

| Criterion | Legacy Native Module + EventEmitter | TurboModule + Codegen | JSI / direct host object |
|---|---|---|---|
| **Reliability** | Proven; async Promise-based | Strong when codegen matches | Highest perf; manual lifecycle |
| **Type safety** | Manual TS + runtime validation required | Codegen TS specs — compile-time | Manual C++/Swift/Kotlin bindings |
| **Setup complexity** | **Lowest** | Medium — codegen pipeline | High — native C++ expertise |
| **Android/iOS parity** | Good with discipline | Good when specs shared | Divergence risk |
| **Runtime lifecycle** | Handles late JS start via pull | Same if pull authoritative | Same; must guard thread safety |
| **Batch transfer** | ReadableArray / Promise maps | Typed arrays in spec | Zero-copy potential |
| **Backpressure** | App-defined batch limits | Same | Same |
| **Debuggability** | Excellent RN tooling | Good | Harder stack traces |
| **Testing** | Robolectric + Jest mock | Codegen mocks + native tests | Native-heavy |
| **RN version coupling** | Stable across versions | Tighter to RN releases | Tightest |
| **Small-team maintenance** | **Lowest burden** | Medium | High |
| **Migration path** | Incremental TurboModule adoption | From legacy via spec | Often rewrite |
| **Performance at MileRecover volumes** | Sufficient for evidence events (pending device proof) | Similar | Overkill for prototype C |

---

## MileRecover-specific notes

- Event volumes are **evidence bursts**, not video streams — extreme JSI optimization not required for validation
- **Pull must remain authoritative** regardless of approach — push is hint-only
- Native tracking stays in Kotlin/Swift; RN must not own capture
- Codegen improves ergonomics but **does not replace runtime validation** for schema evolution

---

## Prototype selection

**Selected for Prototype C:** **Legacy Native Module (`ReactContextBaseJavaModule`) + `DeviceEventManagerModule` push hints**

**Why (prototype only):**

1. Fastest path to validate delivery/ack semantics on Android
2. Matches small-team maintenance profile in Engineering Principles
3. iOS parity via `RCTEventEmitter` is well-documented
4. Avoids locking New Architecture, Codegen, or JSI before evidence

**Not locked for production:** TurboModule/Codegen remains the likely upgrade path if device evidence shows no reliability gaps and team accepts codegen maintenance.

---

## Codegen evaluation

Codegen **may** materially improve type safety for batch APIs, but Prototype C evidence shows **runtime validation** still required for:

- Unsupported schema majors
- Malformed envelopes
- Partial batch acknowledgment

**No production codegen lock** from this prototype alone.

---

## Related

- [PLATFORM_PARITY.md](./PLATFORM_PARITY.md)
- [RESULTS.md](./RESULTS.md)
- [Technical Implementation Plan §25](../../planning/Technical%20Implementation%20Plan.md)
