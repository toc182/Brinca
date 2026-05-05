# Artifact 2 — Typography scale

> Source: `docs/research/04-design-playbook.md` · Part 1 · Section 2
> RN note: Implement as TypeScript style objects in `src/shared/theme.ts`. Use `System` font or load SF Pro manually. No `.font(.headline)` — use style constants.

**What it is:** A predefined set of text styles (font, size, weight, line height) that covers every text need in your app. You'll use roughly **11 styles** — no more, no less.

**What it's for:** Consistent text hierarchy tells users what's most important on any screen. It also maps directly to iOS Dynamic Type, meaning your developer can implement it in one line of SwiftUI code per style.

**Why before screens:** If you eyeball font sizes per screen, you'll end up with 17pt here, 18pt there, 16pt somewhere else. A predefined scale prevents this and makes your app feel like a cohesive product.

**The iOS type scale you should use (these are Apple's exact values):**

| Style name | Size | Weight | Line height | When to use it |
|-----------|------|--------|-------------|----------------|
| Large Title | 34pt | Regular | 41pt | Top of scrollable pages (Dashboard, Activity List) |
| Title 1 | 28pt | Regular | 34pt | Major section headers |
| Title 2 | 22pt | Regular | 28pt | Sub-section headers |
| Title 3 | 20pt | Regular | 25pt | Card titles, group labels |
| Headline | 17pt | **Semibold** | 22pt | Emphasized body text, list item primary text |
| Body | 17pt | Regular | 22pt | Default readable text, descriptions |
| Callout | 16pt | Regular | 21pt | Secondary descriptive text |
| Subheadline | 15pt | Regular | 20pt | Supporting text below headlines |
| Footnote | 13pt | Regular | 18pt | Timestamps, metadata |
| Caption 1 | 12pt | Regular | 16pt | Labels, small annotations |
| Caption 2 | 11pt | Regular | 13pt | Smallest text (tab bar labels, badges) |

The font is **SF Pro**, Apple's system typeface — download it free from developer.apple.com/fonts. Use SF Pro Text for sizes 19pt and below, SF Pro Display for 20pt and above. In Figma, install the "Fix San Francisco" plugin to auto-apply Apple's correct letter-spacing values.

**Dynamic Type consideration:** These sizes are the "Large" default. iOS users can scale text from ~80% to ~310%. You don't need to design every size, but you must design layouts that accommodate text growing — use Auto Layout in Figma so containers expand with their content rather than having fixed heights.

**In Figma:** Create Text Styles matching these exact names. When your developer sees "Headline" in the design, they write `.font(.headline)` in SwiftUI — zero translation needed.
