# Artifact 3 — Spacing system

> Source: `docs/research/04-design-playbook.md` · Part 1 · Section 3
> RN note: Export as a `spacing` object in `src/shared/theme.ts`. Use the named tokens directly in `StyleSheet.create` — never raw numbers.

**What it is:** A fixed scale of distances (in points) used for all padding, margins, and gaps throughout the app. Based on multiples of **4pt and 8pt**.

**What it's for:** Consistent spacing is the single biggest factor in whether an app looks "designed" or "thrown together." A spacing system removes guesswork from every layout decision.

**Why before screens:** Without it, you'll use 13pt here, 17pt there, 15pt somewhere else. With it, every spacing decision reduces to picking from a short list.

**Your spacing scale:**

| Token name | Value | Common uses |
|-----------|-------|-------------|
| `spacing/4` | 4pt | Icon-to-text gaps, hairline adjustments |
| `spacing/8` | 8pt | Tight padding, small gaps between related items |
| `spacing/12` | 12pt | Compact element padding, between form label and field |
| `spacing/16` | 16pt | **Standard iOS screen-edge margin**, card internal padding, between form fields |
| `spacing/20` | 20pt | Comfortable element spacing |
| `spacing/24` | 24pt | Section padding, generous card padding |
| `spacing/32` | 32pt | Between major sections |
| `spacing/40` | 40pt | Large section separation |
| `spacing/48` | 48pt | Screen-level breaks, hero spacing |

The critical number to memorize: **16pt is the standard iOS screen-edge margin.** Almost every Apple app uses 16pt left and right margins. Some newer Apple apps use 20pt for more breathing room — pick one and stick with it.

**In Figma:** Use Auto Layout on every frame and set padding/gap values exclusively from this scale. Create Number Variables for each spacing token so you can reference them by name.
