# Artifact 1 — Color palette

> Source: `docs/research/04-design-playbook.md` · Part 1 · Section 1
> RN note: Implement as TypeScript constants in `src/shared/theme.ts`, not as Figma Variables. Dark mode is manual via `useColorScheme()`.

**What it is:** A fixed set of colors (typically **30–50 values** including light and dark mode) that your entire app uses. No screen ever uses a color outside this set.

**What it's for:** It ensures visual unity, supports dark mode, and communicates meaning (red = error, green = success). It also makes developer handoff trivial — your developer codes named color tokens once and references them everywhere.

**Why before screens:** If you pick colors ad hoc while designing, you'll end up with five slightly different blues. Defining colors first eliminates this entirely.

**How to build yours (iOS-specific):**

Your palette has five layers. Start with Apple's built-in semantic colors as your foundation, then add your brand on top.

| Layer | What to define | Recommended values |
|-------|---------------|-------------------|
| **Brand colors** | 1 primary + 1 secondary, each with a light-mode and dark-mode variant | Primary: a playful purple-blue like `#5B5FE6` (light) / `#7B7FFF` (dark). Secondary: a warm coral like `#FF6B6B` / `#FF8A8A`. For a kids' activity app, choose friendly, saturated-but-not-harsh tones. |
| **Semantic colors** | Success, warning, error, info | Use Apple's system colors directly: success `#34C759`, warning `#FF9500`, error `#FF3B30`, info `#007AFF`. These have built-in dark-mode variants. |
| **Neutral grays** | 6 levels for borders, disabled states, subtle backgrounds | Apple's systemGray scale: `#8E8E93`, `#AEAEB2`, `#C7C7CC`, `#D1D1D6`, `#E5E5EA`, `#F2F2F7` |
| **Backgrounds** | Primary, secondary, grouped | Light: `#FFFFFF`, `#F2F2F7`, `#FFFFFF`. Dark: `#000000`, `#1C1C1E`, `#2C2C2E`. Use Apple's exact semantic background values. |
| **Text colors** | Primary, secondary, tertiary, placeholder | Light: `#000000`, `#3C3C43` at 60% opacity, 30% opacity, 30% opacity. Dark: `#FFFFFF`, `#EBEBF5` at 60%, 30%, 18%. |

**Dark mode is not color inversion.** Apple uses entirely separate palettes. Brand colors get slightly brighter in dark mode to maintain contrast against dark backgrounds. Background colors step through progressively lighter grays (`#000000` → `#1C1C1E` → `#2C2C2E`) to create depth. Always check that text-on-background contrast meets **4.5:1 minimum** (use a free contrast checker tool).

**In Figma:** Create these as **Variables** (not just Color Styles) with two modes — "Light" and "Dark." Name them semantically: `color/background/primary`, `color/text/secondary`, `color/action/primary`. This lets you switch your entire file between light and dark mode with one click.
