# MileRecover Spacing

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Design

---

## Spacing Philosophy

Spacing creates **calm and clarity**. MileRecover surfaces financial-evidence data—cramped UI increases audit anxiety.

Generous spacing on review flows; compact spacing only in scannable lists user explicitly enters.

---

## Base Unit

**Base:** 4px  
All spacing values are multiples of 4.

---

## Spacing Scale

| Token | Value | Use |
|---|---|---|
| `space-0` | 0 | — |
| `space-1` | 4px | Tight inline gaps |
| `space-2` | 8px | Icon-to-label, chip padding |
| `space-3` | 12px | Input padding, compact cards |
| `space-4` | 16px | Standard card padding, screen horizontal margin |
| `space-5` | 20px | Section gaps |
| `space-6` | 24px | Card-to-card vertical |
| `space-8` | 32px | Section separators |
| `space-10` | 40px | Major section breaks |
| `space-12` | 48px | Screen top breathing room |
| `space-16` | 64px | Empty state vertical center offset |

---

## Layout Grid

### Screen Margins
| Device | Horizontal |
|---|---|
| Phone (standard) | 16px (`space-4`) |
| Phone (large) | 20px (`space-5`) |
| Tablet (future) | 24px + max content width 680px |

### Safe Areas
- Respect platform safe areas always
- Bottom tab bar: platform default + `space-2` internal padding

---

## Component Spacing

### Trip Card
```
padding: space-4 (16px)
gap (internal): space-3 (12px)
margin-bottom: space-3 (12px)
```

### Review Queue
```
list gap: space-3
section header margin-bottom: space-2
sticky header padding: space-4 vertical, space-4 horizontal
```

### Trip Detail
```
map height: 240px (fixed)
content padding: space-4
metadata row gap: space-2
action bar padding: space-4 + safe area
```

### Export Preview
```
document margin: space-6
row gap: space-2
section gap: space-8
```

---

## Touch Targets

**Minimum:** 44×44pt (iOS HIG) / 48×48dp (Material)

- Primary actions: full-width button, 52px height
- Swipe actions: 56px reveal height
- Checkbox/toggle rows: 56px min height

---

## Density Modes (Future)

| Mode | Use |
|---|---|
| Comfortable (default) | All users |
| Compact | Power users, large trip lists |

Default is Comfortable — **trust over automation** requires readable review UI.

---

## Vertical Rhythm

Screen structure:
```
space-12   top (below nav)
heading
space-4
primary metric
space-6
secondary content
space-8
actions
space-4   bottom safe
```

---

## Related Documents

- [Design System.md](./Design%20System.md)
- [Typography.md](./Typography.md)
- [Component Library.md](./Component%20Library.md)
