# Bottom sheet

Used for quick selections and supplementary information without leaving the current screen.

**Library:** `@gorhom/bottom-sheet`.

> This file is the **visual spec only**. Interaction wiring (safe-area integration, keyboard behavior on focus, dynamic snap-point sizing, edge cases) lives in `docs/ux/interactions/bottom-sheet.md`.

---

## Spec

| Property | Value |
|---|---|
| Handle | 36×5pt pill, `border-default`, centered, 8pt from top |
| Background | `surface` |
| Radius | 16pt top-left + top-right |
| Overlay | `scrim` @ 40% |
| Snap points | `['25%', '60%', '90%']` variable; `['CONTENT_HEIGHT']` dynamic |
| Enter | spring mass:1, stiffness:200, damping:22 |
| Close | spring mass:1, stiffness:160, damping:26 |
| Shadow | `0 -4 16 rgba(0,0,0,0.08)` light / `rgba(0,0,0,0.4)` dark |
| Max height | 90% screen |
| Keyboard | Expand to largest; `keyboardBehavior: 'interactive'` |

---

## Adult vs kid

| Property | Adult | Kid |
|---|---|---|
| Handle | 36×5 | 48×6 |
| Row height | 48 | 56 |
