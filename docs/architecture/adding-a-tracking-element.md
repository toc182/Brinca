# Adding a new tracking element type

A tracking element (counter, timer, checklist, …) is wired through several
typed registries. Most are exhaustive `Record<ElementType, …>` maps or
`switch` statements **with no `default`**, so TypeScript fails the build until
the new type is added everywhere it's required — that's the safety net. A few
spots have a `default` and won't error; those are marked "silent" below and
must be updated by hand or the element misbehaves at runtime.

Work top-to-bottom. Run `bun run typecheck` after the type edits — the errors
are your checklist for the required steps.

## 0. Decide the shape

- **Identifier**: `snake_case`, e.g. `tap_counter`.
- **Category**: one of `counters | timers | selection | input`.
- **Config shape**: the settings stored in `tracking_elements.config`. If it's
  the same as an existing element, you can copy that interface.
- **Value shape**: what a session records, stored in `element_values.value`.

If the config/value match an existing element (e.g. a tap counter is just a
counter: `{ target? }` config, `{ count }` value), reuse the same shapes and
the existing config editors — you only need a new session component + preview.

## 1. Central type list — `src/shared/tracking-elements/types/element-types.ts`

- Add the id to `ELEMENT_TYPES`.
- Add it to the right group in `ELEMENT_CATEGORIES`.
- Add a label to `ELEMENT_LABELS` (shown in the picker and cards).
- Add a one-line `ELEMENT_DESCRIPTIONS` entry.
- Add an `ELEMENT_SUPPORTS_HALF_WIDTH` entry — `true` only if the session
  component renders correctly in a narrow (half-width) container; otherwise
  `false`. *(compiler-forced — it's a full `Record<ElementType, boolean>`)* Read
  **Half-width layout** at the bottom before flipping it to `true`.
- Update the "N element types" count in the header comment.

## 2. Config type — `src/shared/tracking-elements/types/element-configs.ts`

- Add an interface for the config (or reuse an existing one).
- Add a member to the `ElementConfig` discriminated union. *(compiler-forced)*

## 3. Value type — `src/shared/tracking-elements/types/element-values.ts`

- Add an interface for the value.
- Add a member to the `ElementValue` union. *(compiler-forced)*

## 4. Validation + defaults — `src/shared/tracking-elements/validation.ts`

- `getDefaultValue`: add a `case`. *(compiler-forced — no default)*
- `getDefaultConfig`: add a `case`. *(compiler-forced — no default)*
- `validateElementConfig`: add a `case`. *(silent — has a default)*
- `isTargetMet`: add a `case`. *(silent — has a default)*
- `hasConfiguredTarget`: add a `case`. *(silent — has a default)*

## 5. Picker thumbnail — `…/activity-builder/components/elements/previews/`

- Write a small preview component (see `CounterPreviews.tsx` for the scale).
- Register it in `element-previews.tsx` `ELEMENT_PREVIEWS`. *(compiler-forced —
  it's a full `Record<ElementType, …>`)*

## 6. Session component — `…/session-logging/components/elements/`

- Build the interactive element (`{ value, onValueChange, config, elementId? }`).
- Add a `case` to `ElementRenderer.tsx`. *(compiler-forced — exhaustive switch)*

## 7. Config editors — `…/activity-builder/components/elements/`

- `ElementConfigRouter.tsx`: add a `case` (reuse an editor or `NoConfig`).
  *(compiler-forced — exhaustive switch)*
- `add-configs/ElementAddConfigRouter.tsx`: add a `case` so it can be configured
  in the add-modal, or rely on the default (no add-time form). *(silent)*

## 8. Stats display — `…/stats/screens/SessionDetailScreen.tsx`

- `parseElementValue`: add a `case` so recorded values render in session detail.
  *(silent — has a default; without it the value shows as raw JSON)*

## 9. Database constraint *(only if it will sync to Supabase)*

`tracking_elements.type` has a `CHECK (type IN (…))` constraint in Postgres.
The local SQLite mirror does **not** constrain it, so the element works offline
immediately — but syncing to Supabase is rejected until the constraint includes
the new id.

Add a migration under `supabase/migrations/` that drops and re-adds it:

```sql
ALTER TABLE tracking_elements DROP CONSTRAINT tracking_elements_type_check;
ALTER TABLE tracking_elements ADD CONSTRAINT tracking_elements_type_check
  CHECK (type IN ( … all ids including the new one … ));
```

Apply with `npx supabase db push`.

## 10. Keep docs in sync

- `docs/architecture/05-database-schema.md`: bump the element count, add the
  type to the identifier list and a value-shape row.
- `docs/feature-specs/activity-builder.md`: add the element if it lists them.

## 11. Verify

- `bun run typecheck` (clean — confirms every required registry was updated).
- Bump `APP_VERSION_LABEL` in `src/shared/appVersion.ts`.
- Reload: the new element appears in the "Add tracking element" picker.
- Add one to a drill, run a session, confirm it records and shows in stats.

## Half-width layout

`ELEMENT_SUPPORTS_HALF_WIDTH[type] === true` lets a parent shrink the element to
half a row (two per line) via the round toggle on the builder canvas. Only flip
it to `true` once the session component renders correctly in a ~150–170pt-wide
container. Three things make it work:

1. **The element must adapt to its own width.** The session component measures
   its container with `onLayout` and switches to a compact layout below a
   threshold — see `CounterElement.tsx` (`FULL_WIDTH_MIN = 240`: a wide centered
   cluster above, smaller buttons below).

2. **It must be a fixed height in both layouts**, so toggling width never changes
   height and two half cards line up. `CounterElement` centers both layouts
   inside `COUNTER_MIN_HEIGHT`.

3. **The slot is sized in explicit pixels, not `flexBasis: '%'`.**
   ⚠️ GOTCHA: on this build (RN New Architecture / Fabric) a `flexBasis`
   percentage that **changes at runtime** does not re-resolve — the view keeps
   its old width even though state updated (confirmed by on-device `onLayout`
   measurement). So the shared canvas (`DrillElementCanvas`, used by both the
   new-drill and edit-drill screens) measures the grid with `onLayout` (`gridW`)
   and gives each slot a plain explicit pixel width (`full = gridW`,
   `half = Math.floor((gridW - gap) / 2)`). The cards sit in a `Sortable.Flex`
   (the `react-native-sortables` drag-reorder grid), which animates the width
   change itself via `dimensionsAnimationType="worklet"` — so the slot just gets
   a `width` number, no Reanimated wrapper. (An earlier Reanimated-animated width
   wrapper broke `Sortable.Flex`'s child measurement and made the cards stack
   instead of pair; `LayoutAnimation` and Reanimated `LinearTransition` didn't
   apply the change at all.) The live session (`DrillScreen`) is fine setting
   `flexBasis: '47%'` once at mount — the bug only bites *runtime* changes.

The element is wrapped in the shared `ElementCard` (label + surface card) in both
the session and the builder preview, so it looks identical everywhere — see
`docs/design-system/components/element-card.md`. On the canvas the card is also
wrapped in `SwipeToDeleteRow` in rounded-card mode (pass `borderRadius`) — see
`docs/design-system/components/swipe-to-delete-row.md`.

A residual: the wide↔compact swap is a discrete layout change, so it "pops"
mid-resize. No animation tweak smooths it — only collapsing the two layouts into
one that scales continuously would.
