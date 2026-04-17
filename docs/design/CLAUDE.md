# Design Documentation Index

This directory contains the decomposed iOS design playbook that Brinca's visual design will be built on. The full source document lives at `docs/research/04-design-playbook.md` — this folder breaks it into focused files so each topic can be referenced and updated independently.

## ⚠️ React Native caveat (read first)

The source material is written for **native iOS / SwiftUI**. Brinca is **React Native + Expo**. The principles and process apply, but specific tooling differs:

- **SF Symbols** → use `expo-symbols` (iOS-only) or `@expo/vector-icons` (cross-platform: Ionicons, Feather, Material, etc.)
- **SwiftUI Text Styles** (`.font(.headline)`) → TypeScript constants in `src/shared/theme.ts`
- **Auto Layout** → React Native flexbox (maps cleanly)
- **JSON/Swift tokens** → TypeScript exports in `theme.ts`
- **Figma Dev Mode Swift snippets** → read Inspect panel values manually into RN `StyleSheet`
- **Continuous corners (Corner Smoothing 60%)** → not supported in RN, standard `borderRadius` only
- **Dark mode** → `useColorScheme()`, manual palette switching
- **44pt touch target minimum** → still applies, use it on `Pressable`

Read the playbook as **principles and process**, not Figma-to-Xcode instructions.

---

## When to reference these files

Claude Code should open the relevant file when:

- Creating or modifying anything in `src/shared/theme.ts`
- Creating or modifying any shared component in `src/shared/components/`
- Designing a new screen or modifying an existing screen's layout
- Choosing spacing, color, typography, radius, or shadow values
- Setting up the design system foundations for the first time
- Doing the final design polish pass

When in doubt, start with the relevant `artifacts/` file. The `process/` files are mostly for when you're working in Figma, not for day-to-day code decisions.

---

## Artifacts — the building blocks

Each file documents one design system artifact. Reference these when writing or reviewing code that uses that token/system.

| File | Topic | Read when |
|---|---|---|
| [01-color-palette.md](artifacts/01-color-palette.md) | Color tokens, brand/semantic/neutral layers, dark mode | Defining or using colors in `theme.ts` or any style |
| [02-typography.md](artifacts/02-typography.md) | Type scale (11 styles), font, line height, Dynamic Type | Defining text styles, choosing font size/weight |
| [03-spacing-system.md](artifacts/03-spacing-system.md) | 4/8pt spacing scale, margins, gaps, padding | Any padding/margin/gap decision |
| [04-grid-layout.md](artifacts/04-grid-layout.md) | 4-col grid, iOS screen anatomy, safe zones | Screen-level layout, header/tab heights |
| [05-components.md](artifacts/05-components.md) | Foundation + app-specific component inventory | Creating a new shared component or variant |
| [06-icons-sf-symbols.md](artifacts/06-icons-sf-symbols.md) | Icon sizing, usage, naming conventions | Picking/placing icons (read RN note) |
| [07-border-radius.md](artifacts/07-border-radius.md) | Radius scale, nested corner rules | Rounded containers, buttons, cards |
| [08-shadows-elevation.md](artifacts/08-shadows-elevation.md) | Shadow scale, when to use elevation | Raised cards, modals, floating elements |
| [09-style-guide-tokens.md](artifacts/09-style-guide-tokens.md) | Style guide assembly, token format for handoff | Maintaining the single source of truth |

---

## Process — how to actually build the design

Reference these when you're in the middle of a design workflow (wireframing, componentizing, etc.). Less useful for day-to-day code.

| File | Phase | Read when |
|---|---|---|
| [01-decisions-before-tools.md](process/01-decisions-before-tools.md) | Phase 0 — before opening Figma | Starting the design from scratch |
| [02-figma-setup.md](process/02-figma-setup.md) | Phase 1 — Figma file & system setup | Setting up the Figma file |
| [03-component-library.md](process/03-component-library.md) | Phase 2 — build reusable components | Building the component library in Figma |
| [04-wireframes.md](process/04-wireframes.md) | Phase 3 — grayscale wireframes | Wireframing screens before visual polish |
| [05-high-fidelity.md](process/05-high-fidelity.md) | Phase 4 — final screens | Translating wireframes into polished screens |
| [06-developer-handoff.md](process/06-developer-handoff.md) | Phase 6 — handoff prep | Preparing Figma for implementation |

> Phase 5 (prototyping and testing) is covered inline in `05-high-fidelity.md` since for this project we prototype by running the app itself, not Figma interactions.

---

## Source

Full source: [docs/research/04-design-playbook.md](../research/04-design-playbook.md)

If any artifact file drifts from the source, the source wins. Re-sync when needed.
