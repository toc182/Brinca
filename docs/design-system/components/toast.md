# Toast

Top-of-screen notification for non-critical errors, success confirmations, and info.

**Toast copy strings:** see `docs/brand/microcopy.md`.

---

## Spec

| Property | Value |
|---|---|
| Position | Top, safe-area-top + 8pt |
| Width | `min(screenWidth − 32, 480)` |
| Radius | `radiusMd` 12pt |
| Padding | 16pt horizontal, 12pt vertical |
| Background | `surface` white (light) / `surface` `#1A1433` (dark) |
| Left border | 4pt solid, semantic color per variant |
| Icon | Phosphor fill, 20pt, 12pt gap to text |
| Text | `bodySmall` Lexend 15/22, weight 500, `text-primary`, `numberOfLines={2}` |
| Shadow | `shadowMd` |
| Stacking | One visible; non-errors replace; errors queue FIFO max 3 |
| Dismiss | Swipe up |

---

## Duration

| Variant | Duration |
|---|---|
| Success / Info | 4s |
| Warning | 5s |
| Error | 6s |
| Action (with Undo) | 7s |

---

## Variants

| Variant | Left-border | Icon (Phosphor) | Icon color | Tint bg option |
|---|---|---|---|---|
| Success | `success-500` | `check-circle` (fill) | `success-600` | `success-50` |
| Error | `error-500` | `x-circle` (fill) | `error-600` | `error-50` |
| Warning | `warning-500` | `warning` (fill) | `warning-700` | `warning-50` |
| Info | `info-500` | `info` (fill) | `info-600` | `info-50` |

---

## Adult vs kid

| Property | Adult | Kid |
|---|---|---|
| Min height | 48pt | 64pt |
| Icon size | 20pt | 28pt |
| Text | 15/22 | 17/24 |
| Mascot | None | Capi head peeks from icon slot on success |
