# Process 03 — Build your component library (Days 3–5)

> Source: `docs/research/04-design-playbook.md` · Part 2 · Phase 2
> RN note: Each Figma component should have a matching file in `src/shared/components/`. Build the Figma component first (visual spec), then implement in RN. Name them identically (e.g., `Button/Primary` in Figma ↔ `Button` with `variant="primary"` in code).

Work from atomic to complex. Start with buttons (your most-reused component), then input fields, then navigation elements, then cards and app-specific components. For each component:

1. Design the default state using your predefined styles
2. Create the component (`Cmd+Alt+K`)
3. Duplicate and modify for additional states (Pressed, Disabled, Error, etc.)
4. Select all variants and click "Combine as Variants"
5. Add component descriptions explaining behavior

**Use Apple's UI Kit as your starting point for standard iOS components** — don't recreate navigation bars, tab bars, or switches from scratch. Copy them from Apple's kit and customize only the colors and typography to match your brand. Build custom components only for your app-specific elements (activity cards, timer controls, counter controls, checklist items).

**For your activity tracking app, these app-specific components deserve extra attention:**

The **counter control** should feature a large monospaced number (48–72pt) with oversized +/− buttons (60–80pt tap targets). Parents are often holding a child with one hand — big targets aren't a luxury, they're a necessity. Add haptic feedback notation for the developer (`.light` impact on each tap).

The **timer control** follows the iOS Clock app pattern: a circular progress ring (gray 8pt-stroke track with a colored progress arc), large centered monospaced time (`MM:SS`), and Start (green) / Pause (orange) / Stop (red) circular buttons below. Note in your specs that the timer must continue in the background and use Live Activities on the Dynamic Island.

The **checklist item** follows the Apple Reminders pattern: an empty circle on the left that fills with a checkmark on tap, with text that gets strikethrough and fades to gray. Include a drag handle for reordering and swipe-left-to-delete.
