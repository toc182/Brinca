# Completion circle + UndoBar

The app-wide pattern for marking something done. Philosophy: **completing is instant, mistakes are cheap.** No hold gestures, no confirmation dialogs — one tap completes with celebratory feedback, and a 4-second UndoBar covers accidental taps. Tapping a completed (green) circle un-completes it directly.

Components live in `src/features/session-logging/components/` (`CompletionCircle.tsx`, `UndoBar.tsx`). If another feature needs the pattern, promote them to `src/shared/components/` rather than duplicating (features are islands — no cross-feature imports).

---

## CompletionCircle

A circular toggle. Empty ring = not done; filled green circle with a white check = done.

| Size | Circle | Border | Check icon | Use |
|---|---|---|---|---|
| `small` | 36pt | 2pt | 18pt | List rows (session drill list) and the labeled-row form |
| `large` | 104pt | 3pt | 52pt | Screen-level control (elementless drill screen) |

### Labeled-row form
Passing a `label` prop renders the whole control as a full-width tappable row — label text on the left (`body`, muted when complete), small circle on the right. Use it where a large centered circle would dominate, e.g. a drill screen that already has tracking elements. The screen supplies the card styling (surface background, `radii.md`, 56pt min height) via `style`.

### Visuals
- Incomplete: transparent fill, `borderDefault` ring, no icon
- Complete: `success500` fill and ring, white Phosphor `Check` (weight bold)
- `hitSlop` pads the small size to a ≥48pt touch target

### Feedback on completing (false → true only, never on mount)
The "ink + bounce" sequence, ~400ms total, all fixed-duration timings (deliberately not a spring — it can never oscillate):
1. Scale: 1 → 0.82 (squeeze, 120ms ease-in) → 1.14 (bounce, 140ms ease-out) → 1 (settle, 140ms ease-in-out)
2. Ink fill: a `success500` disc expands from the circle's center to fill it (200ms ease-out, starts with the squeeze). The border turns green instantly; the steady complete state is the disc at full size — there is no background-color swap.
3. Check: fades in mid-bounce (120ms delay, 160ms fade)
4. Haptic: `notificationAsync(Success)`

Un-completing snaps back instantly (disc and check to zero) — only completing animates.

Tuning history, learned on device: an 8-dot particle burst (v9–v11) read as the circle slowly swelling and shrinking — don't re-add particles. A bare 1.1×/180ms pop (v12) was too dull. Pop + ring pulse (v13) still wasn't it. Ink + bounce (v14) was the user's pick from a six-option lineup.

### Feedback on un-completing
- Haptic only: `impactAsync(Light)`. No confirmation dialog — the action is itself the undo.

### Placement rules
- In a list row: right end of the row. The circle toggles; the rest of the row navigates. The two targets must not overlap.
- As a screen control: centered, with a hint label below (`bodySmall`, `textSecondary`): "Tap when done" / "Completed".

---

## UndoBar

Bottom snackbar shown immediately after a completion. Mirrors Toast's visual language (surface card, 4pt left accent border — `success500`, `shadows.md`, 92% width) but slides up from the bottom and carries an action.

- Content: `"{name} done"` (one line, `bodySmall` Lexend medium) + "Undo" text button (`buttonSmall`, `success600`)
- Dismisses three ways: tap Undo (reverts the completion), swipe it sideways (64pt distance or a fast fling), or on its own after 3 seconds (slides down)
- The auto-dismiss timer must key only on `visible` — never on callback identity. The session screen re-renders every second (running timer); a per-render dependency resets the countdown forever and the bar never leaves (this bug shipped once)
- `bottomOffset` prop positions it above the screen's bottom chrome (session footer, safe-area inset)
- Only one UndoBar at a time — a new completion replaces the previous one

---

## Anti-patterns

- ❌ A button labeled "Finish"/"Done" that also completes — navigation and completion must never share a control
- ❌ Confirmation dialogs for un-completing — undo is cheap, dialogs are friction
- ❌ Hold-to-complete gestures — reserved for destructive/irreversible actions, which completion is not
- ❌ Auto-completing on navigation (back arrow, screen close) — completion only ever happens from a circle tap
