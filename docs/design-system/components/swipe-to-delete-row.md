# SwipeToDeleteRow

Swipe-left-to-reveal-delete row, shared. `src/shared/components/SwipeToDeleteRow.tsx`.
Wraps a child in a gesture-handler `Swipeable`; swiping reveals a red "Delete"
that runs a destructive confirmation alert (`useDestructiveAlert`) before
calling `onDelete`.

Used by: measurements, external activities, lap timer, multi-number input rows,
and the drill-builder element cards.

---

## Props

| Prop | Purpose |
|---|---|
| `children` | The row/card content. |
| `onDelete` | The **raw** removal — see the double-alert rule below. |
| `confirmTitle`, `confirmMessage` | Copy for the confirmation alert. |
| `borderRadius?` | Rounded-card mode — see below. |

---

## Rules / gotchas

- **The row owns the confirmation.** `onDelete` must do the raw removal, not pop
  its own second alert — otherwise the user gets two confirmations (shipped once).
- **Use the gesture-handler `Pressable` for a tappable child**, not RN's. RN's
  press isn't cancelled when the swipe pan activates, so a swipe would also fire
  the row's `onPress`.

---

## List-row mode (default)

Edge-to-edge rows with a white backing and a square, full-height red delete
action. Correct for flat list rows.

## Rounded-card mode (`borderRadius`)

For a rounded card floating on a tinted page (e.g. the drill-builder canvas).
Pass the child card's corner radius. The component then:

- drops the white row backing (the card brings its own), and
- rounds the swipe container and paints it **red**, so as the card slides the red
  shows **flush through the card's own rounded corners** — no square-corner notch
  and no see-through gap. The child card keeps its full rounding and border.

GOTCHA: because the red sits *behind* the card, the card's press feedback must be
opaque (not `opacity`) or the red bleeds through while pressing. See
`element-card.md`.
