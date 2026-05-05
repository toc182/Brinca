# Shadows

Warm-tinted shadow color (`#0F172A`, not pure black). Pair with a 1px `border-subtle` border on Android < 9.

**Implementation:** values live in `src/shared/theme.ts`.

---

## Tokens

| Token | shadowColor | Offset (x/y) | Blur | Opacity | Usage |
|---|---|---|---|---|---|
| `shadowNone` | — | — | — | — | No elevation; flat surfaces |
| `shadowSm` | `#0F172A` | 0 / 1 | 2 | 0.06 | Subtle elevation — list cards |
| `shadowMd` | `#0F172A` | 0 / 4 | 12 | 0.08 | Floating elements — bottom sheets, mini player |
| `shadowLg` | `#0F172A` | 0 / 12 | 24 | 0.12 | Modals, overlaid panels |
| `shadowXl` | `#0F172A` | 0 / 20 | 32 | 0.16 | Hero cards, full-screen overlays |

### As JS

```js
shadowSm:  { shadowColor: '#0F172A', shadowOffset: {width:0, height:1},  shadowOpacity: 0.06, shadowRadius: 2,  elevation: 1 }
shadowMd:  { shadowColor: '#0F172A', shadowOffset: {width:0, height:4},  shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }
shadowLg:  { shadowColor: '#0F172A', shadowOffset: {width:0, height:12}, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 }
shadowXl:  { shadowColor: '#0F172A', shadowOffset: {width:0, height:20}, shadowOpacity: 0.16, shadowRadius: 32, elevation: 16 }
```

---

## Dark mode (V2)

`shadowColor: '#000000'`, opacity 0.35–0.5; add `rgba(255,255,255,0.04)` 1pt top border to compensate for darker scenes.
