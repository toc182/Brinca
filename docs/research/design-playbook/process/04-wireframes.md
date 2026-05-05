# Process 04 — Wireframe all screens (Days 5–7)

> Source: `docs/research/04-design-playbook.md` · Part 2 · Phase 3
> RN note: Purely a Figma exercise — no code at this stage. The Statistics screen paragraph mentions Apple's Swift Charts; for Brinca you'd use `victory-native`, `react-native-skia`, or similar. Defer chart library selection until you're ready to implement.

Create all 15 screens in **grayscale** using basic shapes and placeholder text. This phase is about layout and information hierarchy — not aesthetics. Use gray rectangles, simple text, and rough proportions. Don't use your polished components yet.

**Work flow by flow, not screen by screen.** Start with the main happy path (Onboarding → Dashboard → Track Activity → Complete), then do the settings and profile flows. This ensures your navigation logic works before you invest in visual polish.

**Key layout patterns for your screens:**

Your **Dashboard** should follow the card-based pattern used by top parenting apps: a child selector (horizontal avatar scroll) at the top, a quick-action grid of color-coded activity buttons below it, an "In Progress" banner if a timer is running, and a recent activity timeline at the bottom. Design for one-handed use — primary actions in the lower half of the screen.

Your **Statistics screen** should use a segmented control for time periods (Day/Week/Month) at the top, followed by progress rings (Apple Activity Rings style), bar charts for daily summaries, and trend lines. Apple's native Swift Charts (iOS 16+) handles all of these.

**Design empty states during wireframing.** Every screen needs an empty state: a friendly illustration + explanatory text + a CTA button. For example, the Dashboard with no children registered shows "Add your first child to get started" with a prominent button. These aren't afterthoughts — they're the first thing new users see.
