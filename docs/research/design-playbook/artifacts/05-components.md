# Artifact 5 — Reusable components

> Source: `docs/research/04-design-playbook.md` · Part 1 · Section 5
> RN note: Build these in `src/shared/components/`. The Figma instructions at the end don't apply — but the component list and state variants do.

**What it is:** Pre-built UI elements (buttons, cards, input fields, navigation bars) that you design once and reuse as "instances" across every screen. Change the original, and every instance updates automatically.

**What it's for:** Components are how you build 15 screens fast while keeping them identical in style. They're also how your developer knows exactly what to build — each component maps to a code component.

**Why before screens:** Building screens without components means manually styling every button, every card, every input from scratch — and inevitably getting inconsistencies.

**Build these components in this order (from simple to complex):**

**Foundation components (build first):**
- **Buttons** — Primary (filled, brand color), Secondary (outlined), Ghost (text-only), Destructive (red). Each needs 4 states: Default, Pressed (darken 10–15%), Disabled (40–50% opacity), Loading (spinner replaces label). Standard heights: Large = 50pt, Medium = 44pt, Small = 34pt.
- **Input fields** — Text input, search bar. States: Empty/placeholder, Focused (brand-color border), Filled, Error (red border + message), Disabled. Height: **44pt minimum**.
- **Navigation bar** — Large title variant and inline (scrolled) variant, with back chevron, title, and right-side action button.
- **Tab bar** — 4–5 tabs with SF Symbol icons (**25–28pt**) and 10pt labels. Active tab uses your primary/accent color; inactive tabs use `systemGray` (`#8E8E93`).
- **List items** — Icon + text, text + chevron, text + toggle switch, text + secondary value. Minimum row height: **44pt**.

**App-specific components (build next):**
- **Activity card** — Icon (color-coded circle), activity name, type badge (Timer/Counter/Checklist), last recorded value. States: Default, In Progress (animated accent border), Completed.
- **Child selector** — Horizontal scroll of circular avatars. States: Selected (enlarged, accent border), Unselected (smaller, muted), "Add Child" (dashed circle with +).
- **Counter control** — Large number display (48–72pt, monospaced), oversized + and − buttons (60–80pt tap targets).
- **Timer control** — Circular progress ring (gray track + colored progress arc), large centered time display (monospaced `MM:SS`), Start/Pause/Stop buttons.
- **Checklist item** — Circle checkbox + text label + optional drag handle. States: Unchecked, Checked (filled circle with checkmark, strikethrough text faded to gray).
- **Progress ring/badge** — Circular progress indicator in Small (24pt), Medium (48pt), and Large (120pt) variants for dashboard widgets and stats.
- **Stat widget** — Label, large bold value, trend indicator arrow.
- **Empty states** — Illustration + message + CTA button (one per major screen).
- **Section headers** — Title + optional "See All" action link.

**In Figma:** Create each component (`Cmd+Alt+K`), then create variants for different states by selecting multiple component versions and clicking "Combine as Variants." Name them with slash notation: `Button/Primary/Default`, `Button/Primary/Pressed`, `Button/Primary/Disabled`. Use **Component Properties** for toggleable features (show/hide icon, swap icon, change label text).
