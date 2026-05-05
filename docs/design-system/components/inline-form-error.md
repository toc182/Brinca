# Inline form errors

Error text and icon shown beneath a form input when validation fails.

---

## Error text

| Property | Value |
|---|---|
| Text color | `error-700` `#9F1239` |
| Font | `caption` — Lexend 13/18, weight 500 |
| Leading icon | Phosphor `warning-circle` (regular), 14pt, `error-600` |
| Icon-to-text gap | 6pt |
| Spacing from input | 6pt below; reserve 24pt slot under every input |
| Enter animation | Fade + slide `translateY(+4→0)`, 180ms `Easing.out(cubic)` |
| Exit animation | Fade to 0, 120ms, no slide |
| Max lines | 2, wrap (never ellipsis) |
| Shake | No |

---

## Input error state

Applied to the input itself when its value is invalid.

| Property | Value |
|---|---|
| Border color | `error-500` `#E11D48` |
| Border width | 1.5pt |
| Background | `error-50` `#FFE4EA` at 40% opacity |
| Label color | `error-700` `#9F1239` |
| Trailing icon | Phosphor `warning-circle` (regular), 20pt, `error-600`, 12pt from right |
