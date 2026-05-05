# Typography

Brinca's type system. Three font families, eleven type tokens.

**Implementation:** values live in `src/shared/theme.ts`. Fonts loaded via `expo-font`.

---

## Fonts

- **Display:** Fredoka (variable, weights 400–600)
- **Body:** Lexend (variable, weights 400–700) — peer-reviewed +19.8% reading fluency in ages 7–12
- **Timer:** JetBrains Mono (weight 500, tabular numerals)

### Expo packages

- `@expo-google-fonts/fredoka`
- `@expo-google-fonts/lexend`
- `@expo-google-fonts/jetbrains-mono`
- All Latin Extended (ñ, á, é, í, ó, ú, ü, ¿, ¡)

---

## Type scale

| Token | Size / Line-height | Font | Weight | Letter-spacing | Use |
|---|---|---|---|---|---|
| `titleLarge` | 34 / 40 | Fredoka | 600 | -0.3 | Screen titles, hero numbers |
| `titleMedium` | 22 / 28 | Fredoka | 600 | -0.2 | Card titles, section headers |
| `titleSmall` | 17 / 24 | Lexend | 600 | 0 | Inline/group headers |
| `body` | 17 / 24 | Lexend | 400 | 0 | Default reading |
| `bodySmall` | 15 / 22 | Lexend | 400 | +0.1 | Secondary text |
| `caption` | 13 / 18 | Lexend | 500 | +0.2 | Metadata, labels |
| `captionSmall` | 11 / 16 | Lexend | 600 | +0.3 | Timestamps, legal only; avoid on kid views |
| `buttonLarge` | 17 / 22 | Lexend | 600 | +0.1 | Primary CTA |
| `buttonSmall` | 15 / 20 | Lexend | 600 | +0.1 | Secondary button |
| `counter` | 48 / 52 | Fredoka | 600 | -0.5 | Celebration big numbers |
| `timer` | 40 / 44 | JetBrains Mono | 500 | 0 | Tabular digits, stopwatch |

---

## Rendering rules

- Enable Lexend `tnum` on stat tables at `bodySmall` / `caption`
- Fredoka: 17pt and up only (rounded counters soften below that)
- Low-DPI Android (xhdpi/320dpi): prefer Lexend Medium below 13pt
- Never `text-transform: uppercase` on Spanish labels (accent rendering inconsistent)
