# Process 02 — Figma file and design system setup (Days 2–3)

> Source: `docs/research/04-design-playbook.md` · Part 2 · Phase 1
> RN note: The Figma setup is for design work; the final source of truth for the app remains `src/shared/theme.ts`. Keep Figma Variables named to match the `theme.ts` exports (e.g., `color/background/primary` ↔ `colors.background.primary`) so handoff is a mechanical translation, not a redesign.

**File structure:** Keep everything in **one Figma file with multiple pages.** For a 15-screen app with one designer, separate files create unnecessary overhead. Create these pages in order:

| Page | Purpose |
|------|---------|
| 📋 Cover | Project name, status, date — set as file thumbnail |
| 🎨 Design System | All colors, typography, components, icons documented |
| ✏️ Wireframes | Low-fidelity grayscale layouts |
| 📱 Screens | High-fidelity designs organized by flow |
| 🔗 Prototype | Screens connected with interactions |
| 👨‍💻 Dev Ready | Final approved screens for handoff |

**Naming conventions matter.** Name frames as `ScreenName / State` — for example, `Dashboard / Default`, `Dashboard / Empty`, `Login / Error`. Name components with slash hierarchy: `Button/Primary/Default`. Name layers with lowercase hyphens matching iOS conventions: `activity-card`, `timer-display`, `child-avatar`. This discipline saves hours during handoff.

**Grab Apple's resources immediately.** Before building anything custom, get the **Apple iOS 18 UI Kit** from the Figma Community (free, official). It contains every standard iOS component pre-built with correct dimensions. Also install: SF Pro fonts (developer.apple.com/fonts), "Fix San Francisco" plugin (auto-corrects letter spacing), and "SF Symbols Browser" plugin.

**Build your design system page.** Create all the artifacts from Part 1 as Figma Styles and Variables. This typically takes 4–8 hours for a first-timer. Set up your 393×852pt iPhone frame with the layout grid (4 columns, 16pt margins, 8pt gutters). Create all Color Variables with Light/Dark modes. Create all 11 Text Styles. Create Effect Styles for shadows. This page becomes your visual reference for everything.
