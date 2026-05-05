# Artifact 7 — Border radius and corner values

> Source: `docs/research/04-design-playbook.md` · Part 1 · Section 7
> RN note: React Native's `borderRadius` does NOT support iOS continuous corners (Corner Smoothing). Rounded corners will look close but not identical to native iOS. Don't spend time trying to match the squircle look — ship with standard rounded corners. Export as a `radii` object in `src/shared/theme.ts`.

**What it is:** The rounded corner values used on buttons, cards, input fields, and containers. iOS uses **continuous corners** (also called "squircles") — smoother than standard rounded corners.

**What it's for:** Consistent corner rounding is a subtle but powerful consistency signal. Mismatched radii instantly look amateur.

**Recommended radius scale:**

| Token | Value | Use for |
|-------|-------|---------|
| `radius/sm` | 8pt | Buttons, input fields, small chips |
| `radius/md` | 12pt | Standard cards, medium containers, large buttons |
| `radius/lg` | 16pt | Large cards, prominent containers |
| `radius/xl` | 20–24pt | Modal sheets, bottom sheets |
| `radius/full` | 9999pt | Pill-shaped buttons, circular avatars |

**Critical Figma setting:** After setting the corner radius on any rectangle, click the corner radius value and set **Corner Smoothing to 60%**. This enables iOS's signature continuous/squircle corners. Without this, your corners will look subtly wrong compared to the real iOS.

**Nested corners rule:** Inner radius = Outer radius − Padding. A card with 16pt corners and 12pt padding should have inner elements at 4pt corners. This prevents the amateur look of matching inner/outer radii.
