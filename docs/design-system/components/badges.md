# Badges & status indicators

Tint-50 bg + 700-shade text. Never color-only — always pair with a Phosphor icon.

---

## Statuses

| Status | Bg | Text color | Phosphor icon |
|---|---|---|---|
| Active | `info-50` | `info-700` | `play-circle` (fill) |
| Completed | `success-50` | `success-700` | `check-circle` (fill) |
| Paused | `warning-50` | `warning-700` | `pause-circle` (fill) |
| Missed | `error-50` | `error-700` | `x-circle` (fill) |
| Scheduled | `border-subtle` | `text-secondary` | `calendar` (regular) |
| Draft | `border-subtle` | `text-secondary` | `pencil-simple` (regular) |
| Achievement | `accent-50` | `accent-600` | `trophy` (duotone) |

---

## Adult vs kid

| Property | Adult | Kid |
|---|---|---|
| Height | 22pt | 28pt |
| Padding | 8h / 4v | 12h / 6v |
| Font | Lexend 11/14, weight 600 | Lexend 13/16, weight 700 |
| Radius | `radiusXs` 4pt (rounded-rect) | `radiusFull` 9999 (pill) |
| Icon | 12pt, optional | 16pt, always present |

---

## Bilingual labels

| Status | EN | ES |
|---|---|---|
| Active | Active | Activa |
| Completed | Completed | Completada |
| Paused | Paused | Pausada |
| Missed | Missed | Perdida |
| Scheduled | Scheduled | Programada |

Never uppercase for ES badges (`textTransform: 'none'`).
