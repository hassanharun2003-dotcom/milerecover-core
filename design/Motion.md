# MileRecover Motion

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Design

---

## Motion Philosophy

Motion in MileRecover serves **orientation and feedback**—never delight for its own sake.

Users reviewing evidence need stability. Animation must reinforce **trust over automation**: confirmations feel deliberate; rejections feel immediate.

Respect **Reduce Motion** system settings always.

---

## Duration Tokens

| Token | Duration | Use |
|---|---|---|
| `duration-instant` | 100ms | Toggle, checkbox |
| `duration-fast` | 200ms | Button press, chip select |
| `duration-normal` | 300ms | Card transitions, sheet present |
| `duration-slow` | 450ms | Proof Score meter fill |
| `duration-emphasis` | 600ms | Export success (once) |

---

## Easing

| Token | Curve | Use |
|---|---|---|
| `ease-out` | cubic-bezier(0, 0, 0.2, 1) | Elements entering |
| `ease-in` | cubic-bezier(0.4, 0, 1, 1) | Elements exiting |
| `ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | State changes |
| `spring-snappy` | damping 20, stiffness 300 | Review swipe snap |

Avoid bouncy springs on financial data screens.

---

## Standard Transitions

### Navigation
- Push: slide horizontal 300ms ease-out
- Modal/sheet: slide up 300ms ease-out + scrim fade 200ms
- Tab switch: crossfade 200ms (no slide)

### Review Queue
- **Confirm trip:** card slides right + green flash 200ms → collapse height 300ms
- **Reject trip:** card slides left + fade 200ms → collapse
- **Undo:** snackbar 4s with reverse animation

### Proof Score Meter
- On first reveal: fill 0 → value over 450ms ease-out
- On update: pulse border once 200ms, then animate delta

### Sync Status
- Offline → online: icon crossfade 200ms
- Syncing: subtle rotation 1s linear (low opacity, non-blocking)

---

## Haptics (iOS) / Haptic Feedback (Android)

| Action | Feedback |
|---|---|
| Confirm business trip | Success (medium) |
| Reject trip | Warning (light) |
| Export complete | Success (heavy) |
| Error | Error |
| Toggle automation | Selection |

No haptic on passive list scroll.

---

## Loading States

- **Skeleton screens** for trip list initial load
- **No spinners** on full screen except export generation
- Pull-to-refresh: platform native

Tracking engine status: static icon + copy, not pulsing animation (implies battery drain anxiety).

---

## Reduce Motion Fallbacks

When Reduce Motion enabled:
- Replace slides with crossfades
- Disable Proof Score fill animation (show final value)
- Disable parallax on maps
- Keep haptics (user-controlled separately)

---

## Prohibited Motion

- Confetti on mile milestones
- Slot-machine number rollovers for totals
- Shake animations on errors (patronizing)
- Infinite looping animations on home screen
- Auto-playing map flyovers

---

## Related Documents

- [Design Bible.md](./Design%20Bible.md)
- [Interaction Rules.md](./Interaction%20Rules.md)
- [Apple HIG References.md](./Apple%20HIG%20References.md)
