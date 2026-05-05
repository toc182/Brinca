# Artifact 6 — Icons (SF Symbols)

> Source: `docs/research/04-design-playbook.md` · Part 1 · Section 6
> RN note: **SF Symbols are iOS-only and have no direct React Native API.** Options for Brinca: `expo-symbols` (iOS-only, wraps SF Symbols) or `@expo/vector-icons` (cross-platform, ships Ionicons/Feather/MaterialIcons/etc.). Pick one icon library and stick with it. The icon names below are SF Symbol names — if you use a different library, find the equivalent once and document the mapping in `theme.ts` or a shared constants file.

**What it is:** Apple's library of **6,900+ vector icons** designed to work perfectly with SF Pro at every weight and size. They're free and built into every Apple device.

**What it's for:** A consistent icon set that automatically aligns with your text, scales with Dynamic Type, and requires zero asset export for standard icons — your developer references them by name in code.

**Why before screens:** Choosing random icons from different sources creates visual chaos. SF Symbols guarantee consistent weight, style, and optical alignment across your entire app.

**How to use them:**

For tab bars, use **25–28pt** icons at Regular weight. For navigation bars, use **22pt** icons. For inline body text, match the text point size. Common symbols you'll need for this app: `house` (Home), `person.2` (Children), `list.bullet` (Activities), `gearshape` (Settings), `plus.circle.fill` (Add), `play.fill` / `pause.fill` / `stop.fill` (Timer controls), `plus` / `minus` (Counter), `checkmark.circle.fill` (Checklist), `chart.bar` (Stats), `timer` (Timer), `bell` (Notifications).

**Getting SF Symbols into Figma:** Install the SF Symbols macOS app (free from Apple), find the symbol you need, copy it (`Cmd+C`), and paste into a text layer using SF Pro in Figma. Alternatively, use the "SF Symbols Browser" Figma plugin to insert symbols directly. For developer handoff, simply note the **exact symbol name** (e.g., `star.fill`) — developers don't need exported icon files for SF Symbols.
