# Destructive alerts

Used for actions that cannot be undone (delete child profile, delete activity, abandon session).

**Default:** native `Alert.alert` for ~90% of destructive actions.

**Button labels (Cancel, Delete, Confirm, Discard, Log out):** see `docs/brand/microcopy.md`.

---

## Custom branded dialog

Reserved for rare cases where the native alert can't carry the gravity (e.g., "Delete child's entire history").

| Property | Value |
|---|---|
| Overlay | `scrim` @ 50% |
| Width | 320pt max, 88% screen |
| Radius | `radiusLg` 16pt |
| Padding | `lg` 24pt |
| Top icon | Phosphor `warning` (fill), 40pt, `error-500` |
| Title | Fredoka 18/24, weight 700, centered |
| Body | Lexend 15/22, centered, `text-secondary` |
| Cancel button | Secondary style, flex 1, 48pt |
| Destructive button | `error-500` bg, white text, weight 600, flex 1, 48pt |
| Animation | Fade + scale 0.96→1, 200ms |
| Default focus | Cancel |
