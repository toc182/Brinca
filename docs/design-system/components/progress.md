# Progress indicators

Three forms: linear bar, circular progress, streak counter.

---

## Linear bar

| Property | Adult | Kid |
|---|---|---|
| Height | 4pt | 10pt |
| Track | `border-subtle` | `border-subtle` |
| Fill | `primary-500` | `accent-500` gradient (`#FFA366` → `#E5701F`) |
| Radius | `radiusFull` | `radiusFull` |
| Animation | 400ms `Easing.out(cubic)` | 600ms spring mass:1 stiffness:160 damping:16 |

---

## Circular progress

| Property | Adult | Kid hero |
|---|---|---|
| Diameter | 40pt inline / 80pt featured | 96pt |
| Stroke | 4pt | 8pt |
| Track | `border-subtle` | `border-subtle` |
| Fill | `primary-500` | `accent-500` with pulsing glow on complete |
| Center | Lexend 14 | Fredoka 20 |
| Fill animation | 900ms `Easing.out(cubic)` | 900ms + bounce |

---

## Streak counter

| Element | Value |
|---|---|
| Icon | Phosphor `flame` (fill), 24pt adult / 36pt kid, `accent-500` |
| Broken state | `flame` (regular), `text-placeholder` |
| Number | Fredoka 20pt adult / 32pt kid, weight 700, 6pt gap to flame |
| Label | Lexend 12pt `text-secondary`; EN "day streak" / ES "en racha" |
| Milestone animation (7 / 14 / 30 / 100) | Scale 1→1.3→1 spring mass:1 stiffness:140 damping:8 + confetti 1800ms |
| Weekly grid | 7 circles 24pt, 8pt gap; completed `accent-500`, incomplete `border-default` outline |
