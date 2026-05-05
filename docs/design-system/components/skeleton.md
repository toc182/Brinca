# Skeleton / Shimmer loading

Loading placeholder used on lists, dashboards, and detail screens. Mimics the layout of the content about to appear with a shimmer sweep.

---

## Spec

| Property | Value |
|---|---|
| Placeholder base (light) | `#E8E5F2` (violet-tinted `border-subtle`) |
| Placeholder base (dark) | `#2A2346` |
| Shimmer highlight (light) | `#F4F2FA` with alpha gradient 0→0.6→0 |
| Shimmer highlight (dark) | `#3A3558` |
| Animation | translateX -100%→100%, 1500ms, linear, infinite |
| Gradient angle | 15–20° from vertical |
| Placeholder radii | Match target: text 4pt, avatars circle, cards 12pt |
| Delay before showing | 200–300ms (skip on sub-300ms loads) |
| Min display | 400ms once shown |
| Reduce Motion | Static placeholder, no animation |
