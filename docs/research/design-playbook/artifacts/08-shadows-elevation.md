# Artifact 8 — Shadow and elevation system

> Source: `docs/research/04-design-playbook.md` · Part 1 · Section 8
> RN note: React Native shadow implementation differs between iOS and Android. On iOS use `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`. On Android use `elevation` (approximates Material Design elevation, not iOS shadows). Define the scale in `theme.ts` with platform-aware helpers.

**What it is:** Predefined shadow values for elements that appear "above" the background — cards, modals, floating buttons.

**iOS uses shadows sparingly.** Unlike Material Design's formal 6-level elevation system, iOS relies primarily on background color differentiation and translucent blur effects ("frosted glass") for depth. Shadows are soft and subtle.

**Your shadow scale (Figma values):**

| Level | X | Y | Blur | Color | Use for |
|-------|---|---|------|-------|---------|
| None | — | — | — | — | Most elements, list items, nav bars |
| Subtle | 0 | 1 | 3 | `#000000` at 10% | Cards on grouped backgrounds, raised buttons |
| Medium | 0 | 4 | 12 | `#000000` at 12% | Floating cards, popovers |
| Prominent | 0 | 8 | 24 | `#000000` at 15% | Modals, bottom sheets |

**In dark mode**, reduce shadow opacity to ~5% or remove entirely — iOS dark mode conveys elevation through progressively lighter background colors instead.

**In Figma:** Create these as **Effect Styles** named `shadow/subtle`, `shadow/medium`, `shadow/prominent` so you apply them consistently and can update globally.
