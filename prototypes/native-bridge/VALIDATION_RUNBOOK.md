# Prototype C — Validation runbook

Manual and semi-automated scenarios for bridge boundary validation.  
Use synthetic data only. Record evidence in [DEVICE_RESULT_TEMPLATE.md](./DEVICE_RESULT_TEMPLATE.md).

**Android device pass (complete):** [ANDROID_FIRST_DEVICE_PASS.md](./ANDROID_FIRST_DEVICE_PASS.md) · live rerun: `.\scripts\run-device-pass2.ps1` · evidence-only: `.\scripts\evaluate-device-evidence.ps1 -EvidenceDir device-validation-20260731-134617`

Format: **Preconditions → Steps → Expected → Evidence → Pass/Fail → Platform → Limitation**

---

## 1. Clean project setup

| Field | Value |
|---|---|
| Preconditions | Fresh clone |
| Steps | `cd prototypes/native-bridge && npm install` |
| Expected | `node_modules` present; no errors |
| Evidence | Terminal log |
| Platform | Desktop |
| Limitation | RN native deps require install before Gradle |

---

## 2. Android build

| Field | Value |
|---|---|
| Preconditions | Android SDK, JDK 17, `npm install` |
| Steps | `npm run android` |
| Expected | Debug APK installs; debug UI loads |
| Evidence | Screenshot / logcat |
| Platform | Android emulator or device |
| Limitation | **Pending** if SDK unavailable |

---

## 3. iOS build

| Field | Value |
|---|---|
| Preconditions | macOS, Xcode, CocoaPods, `npm install` |
| Steps | `cd ios && pod install && npm run ios` |
| Expected | Simulator launches debug UI |
| Evidence | Screenshot |
| Platform | iOS |
| Limitation | **Pending** on Windows/Linux |

---

## 4. Empty-buffer fetch

| Steps | Open app → Fetch pending |
| Expected | Zero events; no errors |
| Platform | Android / iOS |

---

## 5. Single event

| Steps | Generate 1 synthetic → Fetch → Ack |
| Expected | Counts: pending 0, ack 1 |
| Platform | Android / iOS |

---

## 6. Ten-event batch

| Steps | Generate 10 → Fetch batch → Ack all |
| Expected | Ordered seq 1..10 |
| Platform | Android / iOS |

---

## 7. Large event burst

| Steps | Generate 500–1000 → Fetch in batches of 100 |
| Expected | No silent loss; hasMore accurate |
| Platform | Android / iOS |
| Limitation | Memory on low-RAM devices |

---

## 8. Duplicate insertion

| Steps | Tap simulate duplicate (or generate same session+seq) |
| Expected | duplicateRejected increments |
| Platform | Android |

---

## 9. Replay without acknowledgment

| Steps | Generate → Fetch (delivered) → **do not ack** → Fetch again |
| Expected | Events still available for replay |
| Platform | Android / iOS |

---

## 10. Single acknowledgment

| Steps | Ack one event by ID |
| Expected | acknowledged=1; pending reduced |
| Platform | Android / iOS |

---

## 11. Partial batch acknowledgment

| Steps | Fetch 10 → ack 5 IDs |
| Expected | 5 acked; 5 remain delivered/pending |
| Platform | Android / iOS |

---

## 12. Repeated acknowledgment

| Steps | Ack same ID twice |
| Expected | alreadyAcknowledged on second call |
| Platform | Android / iOS |

---

## 13. Unknown acknowledgment

| Steps | Ack random UUID |
| Expected | unknown list contains ID |
| Platform | Android / iOS |

---

## 14. JavaScript reload

| Steps | Generate events → Reload JS (dev menu) → Fetch |
| Expected | Native events still present |
| Platform | Android / iOS |

---

## 15. JavaScript unavailable during native generation

| Steps | Force-stop JS / delay startup → generate native-side → start JS → fetch |
| Expected | All events retrieved |
| Platform | Android |
| Limitation | Requires adb / native hook |

---

## 16. Listener absent

| Steps | Generate without registering push listener → pull |
| Expected | Pull succeeds; push loss irrelevant |
| Platform | Android / iOS |

---

## 17. Listener duplicated

| Steps | Register two push listeners → generate |
| Expected | Both may fire; pull idempotent |
| Platform | Android |

---

## 18. App background / foreground

| Steps | Generate → background app → foreground → fetch |
| Expected | Buffer retained |
| Platform | Android / iOS |

---

## 19. Process recreation

| Steps | Generate → force-stop app → relaunch → fetch |
| Expected | SQLite/file buffer retains events |
| Platform | Android / iOS |

---

## 20. Unsupported schema

| Steps | Simulate unsupported schema |
| Expected | JS rejects; no auto-ack |
| Platform | Android |

---

## 21. Malformed event

| Steps | Jest: `malformed_event` tests |
| Expected | Explicit rejection |
| Platform | Jest ✅ |

---

## 22. Sequence gap

| Steps | Insert seq 1 and 3 → export diagnostics |
| Expected | sequenceGapDetected true in JS diagnostics |
| Platform | Jest ✅ |

---

## 23. Out-of-order insertion

| Steps | Insert 3,1,2 → fetch |
| Expected | Delivery order 1,2,3 |
| Platform | Jest + Robolectric ✅ |

---

## 24. Sanitized diagnostic export

| Steps | Export diagnostics with location_evidence events |
| Expected | No latitude/longitude in JSON |
| Platform | Jest + Robolectric ✅ |

---

## 25. Clear all data

| Steps | Clear prototype data |
| Expected | All counts zero |
| Platform | Android / iOS |

---

## 26. Reinstall

| Steps | Uninstall app → reinstall → fetch |
| Expected | Empty buffer |
| Platform | Android / iOS |

---

## Automated coverage map

| Scenario | Jest | Robolectric | Device |
|---|---|---|---|
| Contract validation | ✅ | — | ⏳ |
| Buffer ack model | ✅ | ✅ | ⏳ |
| Privacy redaction | ✅ | ✅ | ⏳ |
| Stress batches | ✅ | — | ⏳ |
| Push + pull | Partial mock | — | ⏳ |

Update [RESULTS.md](./RESULTS.md) after each device session.
