# Design system — Brinca

Visual + UI source of truth: tokens, components, mascot.

- For brand identity (name, voice, microcopy, mascot personality), see `docs/brand/`.
- For app behavior and interaction patterns (navigation, persistence, keyboard wiring, safe-area, etc.), see `docs/ux/`.

---

## When to reference

Open the relevant file when:
- Creating or modifying anything in `src/shared/theme.ts` → `tokens/`
- Creating or modifying any shared component in `src/shared/components/` → `components/`
- Choosing a color, font, spacing, radius, shadow, or animation curve → `tokens/`
- Spec'ing how a component looks → `components/`

---

## Tokens

Values live in `src/shared/theme.ts`. Never hardcode hex / size values anywhere else.

| File | Topic |
|---|---|
| [color.md](tokens/color.md) | Color palette — light + dark, contrast rules |
| [typography.md](tokens/typography.md) | Fonts (Fredoka / Lexend / JetBrains Mono), 11-token scale, rendering rules |
| [spacing.md](tokens/spacing.md) | 4/8pt grid, 9 tokens |
| [radius.md](tokens/radius.md) | 6 corner-radius tokens |
| [shadows.md](tokens/shadows.md) | 5 elevation tokens, light + dark |
| [touch-targets.md](tokens/touch-targets.md) | 4 size tiers (44 / 48 / 56 / 64 pt) |
| [icons.md](tokens/icons.md) | Phosphor weights and sizes |
| [animation.md](tokens/animation.md) | 16 motion tokens |

---

## Components

| File | Topic |
|---|---|
| [button.md](components/button.md) | `<Button>` — variants, sizes, `iconLeft` |
| [toast.md](components/toast.md) | Top-of-screen notifications (4 variants) |
| [inline-form-error.md](components/inline-form-error.md) | Validation error text + input error state |
| [form-input.md](components/form-input.md) | Text input — all 5 states |
| [empty-state.md](components/empty-state.md) | Empty-state layout (copy in `brand/empty-state-copy.md`) |
| [skeleton.md](components/skeleton.md) | Shimmer loading placeholder |
| [modal.md](components/modal.md) | Full-screen modal sheet |
| [bottom-sheet.md](components/bottom-sheet.md) | Visual spec (interaction wiring in `ux/interactions/bottom-sheet.md`) |
| [destructive-alert.md](components/destructive-alert.md) | Native + custom branded destructive dialog |
| [disabled-states.md](components/disabled-states.md) | Treatment for all disabled controls |
| [focus-and-selected.md](components/focus-and-selected.md) | Keyboard / VoiceOver focus + touch selected |
| [badges.md](components/badges.md) | Status indicators with bilingual labels |
| [progress.md](components/progress.md) | Linear bar, circular, streak counter |
| [dividers.md](components/dividers.md) | List and section dividers |
| [completion-circle.md](components/completion-circle.md) | Tap-to-complete circle + UndoBar pattern |
| [element-card.md](components/element-card.md) | `<ElementCard>` — shared label + surface card around a tracking element (session + builder preview) |
| [swipe-to-delete-row.md](components/swipe-to-delete-row.md) | Swipe-left-to-delete row — list-row + rounded-card modes |

---

## Mascot

| File | Topic |
|---|---|
| [mascot.md](mascot.md) | Capi — visual style, expression states, where it appears |

---

## Libraries

Packages this design system depends on:

| Package | Purpose |
|---|---|
| `@expo-google-fonts/fredoka` | Display font |
| `@expo-google-fonts/lexend` | Body font |
| `@expo-google-fonts/jetbrains-mono` | Timer font |
| `phosphor-react-native` (v3) | Icon system |
| `@gorhom/bottom-sheet` | Bottom sheets |
| `expo-haptics` | Haptic feedback |
| `expo-linear-gradient` | Kid progress bar gradient |
| `lottie-react-native` | Capi animations |
| `react-native-reanimated` | All animation |
