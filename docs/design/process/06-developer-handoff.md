# Process 06 — Prepare for developer handoff (Day 14)

> Source: `docs/research/04-design-playbook.md` · Part 2 · Phase 6
> RN note: Ignore the SwiftUI references. For Brinca the handoff target is `src/shared/theme.ts` + `src/shared/components/`. The Figma Inspect panel still shows values (spacing, colors, sizes) that translate directly into React Native `StyleSheet.create` entries. Don't trust Figma's code snippets — they generate Swift/CSS, not RN.

**Create the Dev Ready page** with final approved screens only. Use Figma's Section feature to group screens by flow and mark sections as "Ready for development."

**What your developer gets from Figma automatically:** Figma's inspect panel (or Dev Mode on paid plans) shows every element's properties translated into code — including **iOS Swift code snippets**. Spacing, colors, typography, and component properties are all readable. Auto Layout properties map conceptually to SwiftUI's `VStack`, `HStack`, and `ZStack`.

**What you should add manually:**
- **Annotations** for non-obvious behavior (e.g., "Timer continues in background, shows on Dynamic Island," "Long-press counter for rapid increment," "Checklist items reorderable via drag")
- **Interaction specs** on each screen noting transitions, haptic feedback, and animation timing
- **Asset export settings** for any custom graphics: add @1x, @2x, and @3x PNG export presets. For SF Symbol icons, just note the symbol name — no export needed
- **A simple token reference** listing your color names → hex values, spacing names → point values, and component names → their behavior

**Naming alignment with iOS development:** If you've followed this guide, your Text Style names (LargeTitle, Headline, Body, etc.) map directly to SwiftUI's `.font(.largeTitle)`, `.font(.headline)`, `.font(.body)`. Your color Variable names should similarly match what the developer names their `Color` assets in Xcode. Discuss naming conventions with your developer early — 10 minutes of alignment saves hours of confusion.

---

## Additional guidance from the playbook

### A note on Google Stitch versus Figma

Google Stitch is a free AI design tool from Google Labs that generates UI designs from text descriptions. As of early 2026, it supports multi-screen generation, basic prototyping, and manual editing. **For this project, use Figma as your primary tool.** Stitch has three critical limitations: it generates HTML/CSS code rather than native Swift/SwiftUI, it has no formal component system for maintaining consistency across 15 screens, and it's still a Google Labs experiment with no guaranteed long-term availability.

That said, Stitch is useful as an **idea generator.** Use it to quickly explore layout concepts by describing screens ("dashboard for a kids activity tracking app with timer cards and progress rings"), then bring the best ideas into Figma for proper implementation. Stitch includes a "Paste to Figma" feature for exactly this workflow.

### The efficiency mindset for a solo design team

**Lean on Apple's defaults aggressively.** Don't customize navigation bars, tab bars, alerts, or action sheets unless you have a compelling reason. Apple's design team spent years refining these. Using standard components means your developer implements them in a single line of code instead of building custom views.

**Set time limits.** Allocate 30 minutes per wireframe screen, 1 hour per high-fidelity screen. Use a timer. Perfectionism is the enemy of shipping — your first version should be clear and usable, not pixel-perfect with custom micro-animations.

**The right number of components is ~25–30.** For a 15-screen app, that's all you need. Don't build a 200-component design system. Build what you need when you need it, but always build it as a proper reusable component rather than a one-off design.

**Essential Figma plugins for this project:** "SF Symbols Browser" (insert Apple icons), "Fix San Francisco" (correct letter spacing), "Iconify" (additional icon sets if needed), "Unsplash" (placeholder photos), and "Rename It" (batch layer renaming for handoff cleanup). The **Apple iOS 18 UI Kit** from Figma Community and the **Survival Kit for iOS Design** by Guillem Bruix are the two community files that will save you the most time.

### Conclusion

The core insight of this entire guide is that **designing 15 consistent screens is a systems problem, not an art problem.** Define your color palette, typography scale, spacing system, and components once. Store them as named Figma Variables and Styles. Build every screen exclusively from these pre-defined building blocks. The result will look professional not because of artistic talent, but because mathematical consistency — same colors, same spacing, same components — is what "professional" actually means in UI design. Follow the phase sequence (foundations → components → wireframes → high-fidelity → prototype → handoff), resist the urge to skip to pretty screens, and you'll hand your developer a file that's clear, complete, and buildable.
