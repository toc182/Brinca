# Modal

Full-screen sheet that slides up from the bottom. Used for creating or editing something.

---

## Spec

| Property | Value |
|---|---|
| Overlay | `scrim` `#0F0B1F` @ 40% (light) / `#000000` @ 60% (dark) |
| Background | `surface` |
| Radius | 16pt top-left + top-right; 0 full-screen |
| Header height | 56pt |
| Header title | Fredoka 17/22, weight 600, centered |
| Close control | "Cancel" text, top-left, Lexend 15 weight 500, `primary-500`, 44×44 target |
| Primary action | Top-right, Lexend 15 weight 600, `primary-500`, 44×44 target |
| Internal padding | 20pt horizontal, 16pt top/bottom |
| Enter | spring mass:1, stiffness:180, damping:20 |
| Exit | 250ms `Easing.in(cubic)`, slide down |
| Dismiss | Swipe down; dirty form → "Discard changes?" / "¿Descartar cambios?" |

---

## Adult vs kid

| Property | Adult | Kid |
|---|---|---|
| Close target | 44×44 | 56×56 |
| Close control | "Cancel" text | "Cancel" text + 32pt × icon in circle |
| Header title | Fredoka 17 | Fredoka 20 |
