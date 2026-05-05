# UX — Brinca

App behavior and interaction patterns. The "how it acts" layer, complementing the design system's "how it looks."

- For visual specs (tokens, components, mascot visuals), see `docs/design-system/`.
- For brand identity, voice, and bilingual copy, see `docs/brand/`.

---

## When to reference

Open the relevant file when:
- Designing or modifying a screen's navigation or where a control lives → `navigation.md`
- Deciding when changes are saved (auto-save vs explicit Save button) → `data-persistence.md`
- Wiring up a sheet, keyboard, header, status bar, transition, etc. → `interactions/` (built in Phase E)

---

## Files

| File | Topic |
|---|---|
| [navigation.md](navigation.md) | Tab bar, MiniPlayerBar, stack, headers, modals, sheets, alerts, parent avatar, child switching, settings |
| [data-persistence.md](data-persistence.md) | Auto-save vs explicit-save behavior per context |

---

## Interactions (Phase E)

`interactions/` will hold per-topic implementation patterns for things that need to feel native — keyboard avoidance, safe-area integration with `@gorhom/bottom-sheet`, native header heights, status bar per screen, pull-to-refresh, hit slop, haptics, transitions, edge-to-edge.

Currently empty. Files will be added per topic as patterns are documented.
