# Artifact 9 — Style guide page and design tokens

> Source: `docs/research/04-design-playbook.md` · Part 1 · Section 9
> RN note: Brinca's "style guide" lives in two places:
> 1. **Code source of truth:** `src/shared/theme.ts` — all tokens as TypeScript exports
> 2. **Visual source of truth:** the Figma style guide page
> Keep them in sync. When tokens change, update both. For handoff, the token reference maps Figma variable names to the corresponding `theme.ts` exports.

**What it is:** A dedicated page in your Figma file that documents all the artifacts above in a visual, browsable format. Design tokens are the named variables that store these values.

**What it's for:** It's your single source of truth. When you or your developer need to check "what's the error color?" or "how tall are buttons?", the answer is on this page. It also makes handoff dramatically easier — your developer can open one page and see everything they need to implement.

**What to put on your style guide page:**
- Color swatches with hex values, names, and light/dark variants side by side
- Typography samples showing every text style with its name, size, weight, and line height
- Spacing scale visualization (rectangles showing each spacing value)
- Component inventory showing every component with all its states
- Icon reference showing key SF Symbol names used in the app
- Corner radius examples
- Shadow examples

**For developer handoff,** supplement with a simple JSON token file:

```
Colors:    color/primary → #5B5FE6 (light), #7B7FFF (dark)
Spacing:   spacing/16 → 16pt
Radius:    radius/md → 12pt, corner smoothing 60%
Shadows:   shadow/subtle → Y:1, Blur:3, #000 at 10%
Typography: headline → SF Pro, 17pt, Semibold, line-height 22pt
```

Your developer can translate these tokens into Swift constants once and reference them throughout the codebase, ensuring the built app matches your designs exactly.
