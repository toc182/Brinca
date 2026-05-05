# Color tokens

Brinca's color system. Light mode for V1; dark mode tokens defined for V2 but not used yet.

**Implementation:** all values live in `src/shared/theme.ts` as the single source of truth. Never hardcode hex values anywhere else.

---

## Light mode

| Token | Hex | Role |
|---|---|---|
| `primary-500` | `#6D4AE0` | Brand, primary CTAs, active tab, focus border |
| `primary-700` | `#4F33B3` | Pressed/hover, small white text on surface |
| `primary-100` | `#E3DBFF` | Selected-card tint (kid) |
| `primary-50` | `#F2EEFF` | Selected-card tint (adult), hover bg |
| `secondary-500` | `#14B8A6` | Mint supporting accent, calm surfaces |
| `secondary-50` | `#E6FAF6` | Info-adjacent tints |
| `accent-500` | `#FF8A3D` | Celebration, streak flame, reward highlights |
| `accent-400` | `#FFA366` | Gradient top stop for kid progress bars |
| `accent-600` | `#E5701F` | Gradient bottom stop, pressed accent |
| `accent-50` | `#FFF1E6` | Soft accent tint (kid highlights) |
| `background` | `#FAF8FF` | Screen background (barely-tinted lavender white) |
| `surface` | `#FFFFFF` | Cards, sheets, modals, inputs |
| `surface-disabled` | `#F4F3F8` | Disabled input/button bg |
| `error-500` | `#E11D48` | Icons, borders, strong accents |
| `error-600` | `#C01A3F` | White text on error buttons (4.9:1) |
| `error-700` | `#9F1239` | Error text on light bg (7.3:1) |
| `error-50` | `#FFE4EA` | Error toast/input background tint |
| `success-500` | `#059669` | Icon/border |
| `success-600` | `#047857` | White text on success buttons (5.4:1) |
| `success-700` | `#065F46` | Success text on surface (7.1:1) |
| `success-50` | `#D1FAE5` | Success toast/badge tint |
| `warning-500` | `#D97706` | Icon/border |
| `warning-700` | `#92400E` | Warning text (6.9:1) |
| `warning-50` | `#FEF3C7` | Warning toast/badge tint |
| `info-500` | `#0284C7` | Info icon/border (distinct from violet primary) |
| `info-700` | `#075985` | Info text (7.2:1) |
| `info-50` | `#E0F2FE` | Info toast/badge tint |
| `text-primary` | `#1A1630` | 16.5:1 on background |
| `text-secondary` | `#4B4865` | 8.3:1 on background |
| `text-placeholder` | `#8B88A3` | 3.3:1 (large-text only) |
| `text-disabled` | `#A7A4BD` | Disabled labels |
| `text-on-primary` | `#FFFFFF` | White on `primary-500` = 5.6:1 |
| `border-default` | `#CCC9DB` | Input borders |
| `border-subtle` | `#E8E5F2` | Hairline dividers |
| `scrim` | `#0F0B1F` @ 40% | Modal/sheet overlay |

---

## Dark mode (V2)

| Token | Hex |
|---|---|
| `background` | `#0F0B1F` |
| `surface` | `#1A1433` |
| `surface-disabled` | `#231D3D` |
| `primary-500` | `#9B82FF` |
| `primary-700` | `#6D4AE0` |
| `primary-100` | `#2A2346` |
| `secondary-500` | `#2DD4BF` |
| `accent-500` | `#FFA366` |
| `error-500` | `#FB7185` |
| `success-500` | `#34D399` |
| `warning-500` | `#FBBF24` |
| `info-500` | `#38BDF8` |
| `text-primary` | `#F1EEFE` |
| `text-secondary` | `#B3AFC9` |
| `border-default` | `#3A3558` |
| `border-subtle` | `#2A2346` |
| `scrim` | `#000000` @ 60% |

---

## Contrast rules

| Pair | Ratio | Result |
|---|---|---|
| `text-primary` on `background` | 16.5:1 | AAA |
| `text-secondary` on `background` | 8.3:1 | AAA |
| White on `primary-500` | 5.6:1 | AA (small text) |
| White on `primary-700` | 8.7:1 | AAA |
| `text-primary` on `accent-500` | 8.3:1 | AAA — **never white on accent** |
| `text-primary` on `warning-500` | 7.6:1 | AAA — **never white on warning** |
| White on `error-600` | 4.9:1 | AA |
| White on `success-600` | 5.4:1 | AA |
| `error-700` on `error-50` | 10.2:1 | AAA |
| `success-700` on `success-50` | 6.8:1 | AAA |
| `warning-700` on `warning-50` | 7.4:1 | AAA |
| `info-700` on `info-50` | 8.1:1 | AAA |
