# ElementCard

The contained presentation of a tracking element: a surface card with a centered
label above the element and an optional green target-met badge. Lives in
`src/shared/components/ElementCard.tsx`.

Shared so an element looks identical everywhere it appears:
- **Live session** (`DrillScreen`) — the interactive element inside the card.
- **Builder preview** — the configure-modal and the builder canvas wrap the same
  card around an inert `ElementStaticPreview`, so "what you configure is what
  you'll see in a session."

---

## Props

| Prop | Purpose |
|---|---|
| `label` | Centered element name, single line. |
| `children` | The element — interactive in a session, static in a preview. |
| `targetMet?` | Shows the green ✓ badge in the corner. |
| `style?` | Extra container style — this is where the layout passes the full/half **width** (see below). |

---

## Visuals

- `surface` background, `radii.lg`, 1pt `borderSubtle` border, `spacing.md`
  padding, `shadows.sm`, `minWidth: 0` (so it can shrink to half width).
- Header: centered label (`titleSmall`), `spacing.sm` below.
- Badge: `success500` circle with a white check, vertically centered at the right edge.

---

## Width & height

- The card does **not** size itself — the parent grid passes width via `style`.
- For a width that **changes at runtime** (the full/half toggle), pass an
  explicit **pixel** width, not a `flexBasis` percentage — a runtime `flexBasis`
  % does not re-layout on this build. See the half-width gotcha in
  `docs/architecture/adding-a-tracking-element.md` → *Half-width layout*.
- Keep the element's content a consistent height across its layouts so full and
  half cards line up (e.g. `CounterElement` centers both its layouts in a fixed
  min-height).

---

## Anti-patterns

- ❌ Transparent (`opacity`) press feedback when the card sits over the red
  `SwipeToDeleteRow` action — the press would reveal the red. Keep the card
  opaque (no tint, or an opaque color). See `swipe-to-delete-row.md`.
- ❌ A separate "thumbnail" preview in the builder that differs from the session
  render — always wrap the real element so the two can't drift.
