# Modal

Full-screen sheet that slides up from the bottom. Used for creating or editing something.

For a centered popup overlay (e.g. info / picker modal) see the **Centered popup** section below.

---

## Full-screen modal

| Property | Value |
|---|---|
| Overlay | `scrim` `#0F0B1F` @ 40% (light) / `#000000` @ 60% (dark) |
| Background | `surface` |
| Radius | 16pt top-left + top-right; 0 full-screen |
| Header | 88pt tall custom blur header (`ModalHeader.tsx`) — gradient-blur background fades over 88pt, icon row sits at top |
| Header title | Fredoka 17/22, weight 600, centered, `primary-500` |
| Header buttons | 50×50pt circle, `borderDefault` background, Phosphor icon size 20 `weight="bold"` `textPrimary` (or `textDisabled` when disabled); wrapped in 44pt min touch target |
| Left action | `close` (X) or `back` (CaretLeft) icon |
| Right action | `check` or `add` icon — disabled when form invalid |
| Internal padding | 20pt horizontal, 16pt top/bottom |
| Content paddingTop | `MODAL_HEADER_CONTENT_BOTTOM` (62pt) + `spacing.md` — content sits below the icon row, scrolls under the fade-zone |
| Enter | spring mass:1, stiffness:180, damping:20 |
| Exit | 250ms `Easing.in(cubic)`, slide down |
| Dismiss | Swipe down; dirty form → "Discard changes?" / "¿Descartar cambios?" |

Implementation: every `(settings)` modal route uses `<ModalHeader>` — see `src/shared/components/ModalHeader.tsx`. Push-navigated screens inside the settings sheet also use it (workaround for the iOS 26 push-transition glitch in `react-native-screens` < whatever-fix-version).

---

## Centered popup

Small dialog-style overlay rendered via `react-native`'s `<Modal>`. Used for element-picker info / confirmation card / similar.

| Property | Value |
|---|---|
| Overlay | `scrim` `#0F0B1F` @ 40% |
| Background | `surface` |
| Radius | 16pt (`radii.lg`) — all corners |
| Card width | 100% minus scrim padding (`spacing.lg` each side) |
| Card max height | 85% of screen |
| Close button | 50×50pt circle, top-right corner of card, `borderDefault` background, Phosphor `X` size 20 `weight="bold"` `textPrimary`; wrapped in 44pt min touch target |
| Close position | `top: spacing.sm`, `right: spacing.sm`, absolute |
| Content paddingTop | `62 + spacing.xs` — clears the close circle |
| Content paddingHorizontal | `spacing.lg` |
| Content paddingBottom | `spacing.lg` |
| Dismiss | Tap close X, tap scrim, or hardware back (Android) |

Reference implementation: `src/features/activity-builder/components/elements/previews/ElementInfoModal.tsx`.

---

## Adult vs kid

| Property | Adult | Kid |
|---|---|---|
| Close target | 44×44 | 56×56 |
| Header title | Fredoka 17 | Fredoka 20 |
