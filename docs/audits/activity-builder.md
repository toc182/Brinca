# Audit — Activity Builder

**Spec file:** `docs/feature-specs/activity-builder.md`
**UX conventions:** `docs/ux-conventions.md`
**Audit date:** 2026-04-21
**Auditor:** Claude (QA compliance audit)

**Source files:**
- `src/features/activity-builder/` (all files)
- `app/(settings)/activities/index.tsx`
- `app/(settings)/activities/create.tsx`
- `app/(settings)/activities/[activityId]/index.tsx`
- `app/(settings)/activities/[activityId]/create-drill.tsx`
- `app/(settings)/activities/[activityId]/[drillId].tsx`

---

## 1. Summary

The Activity Builder implementation covers the basic CRUD skeleton — activity listing, creation, drill creation, drill editing with tracking element configs — but is **substantially incomplete** relative to the spec. The biggest gaps are: **no icon picker**, **no category selector**, **no session-level or drill-level reward UI** (tier rewards and bonus presets have repositories but zero screen integration), **no deactivation toggles**, **no delete activity flow**, **no reorder via drag**, **no swipe-to-delete on drills or elements**, and **no loading/error/offline states**. The navigation model diverges from the spec in multiple places (create activity is a stack push instead of a modal; create drill is a stack push instead of a modal; element picker is inline instead of a bottom sheet). The implementation is roughly **25–30% complete** against the spec's acceptance criteria.

---

## 2. Gap table

| # | Spec requirement | Status | Severity | Gap description | File(s) |
|---|---|---|---|---|---|
| 1 | Activity list rows show icon | MISSING | CRITICAL | No icon rendered in rows. Row shows name + category only. | `ActivityListScreen.tsx` |
| 2 | Activity list rows show active/deactivated status | MISSING | CRITICAL | No status indicator or dimming for deactivated activities. `is_active` is not read from the data. | `ActivityListScreen.tsx` |
| 3 | Deactivated activities dimmed with toggle to reactivate | MISSING | CRITICAL | No toggle, no dimming. | `ActivityListScreen.tsx` |
| 4 | Empty state text: "No activities yet. Add your first activity to start tracking." | PARTIAL | LOW | Title is hardcoded "No activities yet" but body uses `t('empty.noActivities')` — cannot verify match without i18n file. | `ActivityListScreen.tsx:21` |
| 5 | Create activity: Icon picker (predefined set) | MISSING | CRITICAL | No icon picker exists on the create activity screen. | `CreateActivityScreen.tsx` |
| 6 | Create activity: Category selector (Sport, Therapy, Academic, Custom) | MISSING | CRITICAL | No category selector. Activity is created with no category. | `CreateActivityScreen.tsx` |
| 7 | Create button disabled until name is filled | PARTIAL | MEDIUM | Button disabled until name is 2+ chars, but spec says "disabled until name is filled" (1+ chars). Implementation uses `length >= 2`. | `CreateActivityScreen.tsx:23` |
| 8 | After creation, push into activity detail screen | MISSING | CRITICAL | `router.back()` is called after creation — goes back to list, does not push into detail. | `CreateActivityScreen.tsx:33` |
| 9 | Create activity opens as a modal (slide up) | MISSING | MEDIUM | Route is a stack push (regular page), not a modal. No modal presentation configured. | `app/(settings)/activities/create.tsx` |
| 10 | Activity detail: Activity name tappable to edit | MISSING | CRITICAL | Activity detail screen shows no activity header at all — no name, no icon editing. Only shows drill list. | `ActivityDetailScreen.tsx` |
| 11 | Activity detail: Activity icon tappable to change | MISSING | CRITICAL | No icon display or editing. | `ActivityDetailScreen.tsx` |
| 12 | Activity detail: Session-level tier rewards section | MISSING | CRITICAL | No tier rewards UI. Repository exists but is not used in any screen. | `ActivityDetailScreen.tsx`, `tier-reward.repository.ts` |
| 13 | Activity detail: Session-level bonus presets section | MISSING | CRITICAL | No bonus presets UI. Repository exists but is not used in any screen. | `ActivityDetailScreen.tsx`, `bonus-preset.repository.ts` |
| 14 | Activity detail: Drill rows show tracking type summary | MISSING | MEDIUM | Drill rows show only name and deactivated badge. No "Counter · Target: 50" style summary. | `ActivityDetailScreen.tsx:70` |
| 15 | Activity detail: Drills reorderable via long-press drag | MISSING | CRITICAL | `onLongPress` triggers delete alert, not drag reorder. `reorderDrills` exists in repo but is unused. | `ActivityDetailScreen.tsx:67` |
| 16 | Activity detail: Swipe left on drill to delete with confirmation | PARTIAL | CRITICAL | Delete uses `onLongPress` alert instead of swipe-left gesture. Spec requires swipe-left with native iOS alert. | `ActivityDetailScreen.tsx:67` |
| 17 | Activity detail: Deactivate activity toggle | MISSING | CRITICAL | No deactivation toggle for the activity. | `ActivityDetailScreen.tsx` |
| 18 | Activity detail: Delete activity with confirmation | MISSING | CRITICAL | No delete activity option exists. | `ActivityDetailScreen.tsx` |
| 19 | Add drill opens as modal (slide up) | MISSING | MEDIUM | Route is a stack push, not a modal. | `app/(settings)/activities/[activityId]/create-drill.tsx` |
| 20 | Drill edit: Drill name max 50 characters validated | PARTIAL | LOW | CreateDrillScreen shows error if >50, but DrillEditScreen has no max-length validation at all. | `DrillEditScreen.tsx:58` |
| 21 | Drill edit: "Add element" opens grouped picker (bottom sheet with categories) | MISSING | CRITICAL | DrillEditScreen shows a flat list of buttons instead of a bottom sheet with 4 grouped categories. | `DrillEditScreen.tsx:81-92` |
| 22 | Drill edit: Each element tappable to edit its configuration | PARTIAL | MEDIUM | DrillEditScreen renders config inline below each element. Not "tappable to open" — configs are always visible, not behind a tap/bottom sheet. | `DrillEditScreen.tsx:67-78` |
| 23 | Drill edit: Swipe left to remove element with confirmation | MISSING | CRITICAL | No swipe gesture, no removal UI on DrillEditScreen at all. | `DrillEditScreen.tsx` |
| 24 | Drill edit: Elements reorderable via long-press drag | MISSING | CRITICAL | No drag reorder for elements. | `DrillEditScreen.tsx` |
| 25 | Drill edit: Drill-level tier rewards section | MISSING | CRITICAL | No tier rewards UI on drill edit screen. | `DrillEditScreen.tsx` |
| 26 | Drill edit: Drill-level bonus presets section | MISSING | CRITICAL | No bonus presets UI on drill edit screen. | `DrillEditScreen.tsx` |
| 27 | Drill edit: Tier conditions reference elements with operators (>=, <=, =) + AND logic | MISSING | CRITICAL | No condition builder exists anywhere in the codebase. | — |
| 28 | Drill edit: Deactivate drill toggle | MISSING | CRITICAL | No deactivation toggle on drill edit screen. | `DrillEditScreen.tsx` |
| 29 | Drill edit: Delete drill option with confirmation | MISSING | CRITICAL | No delete drill option on the drill edit screen. (Delete only exists on the activity detail via long-press.) | `DrillEditScreen.tsx` |
| 30 | Drill edit: "Save" button saves all changes | PARTIAL | MEDIUM | DrillEditScreen saves name onBlur and element configs onBlur individually — no explicit "Save" button for all changes. | `DrillEditScreen.tsx` |
| 31 | Tracking element: Stopwatch — spec says label is configurable | PARTIAL | LOW | Stopwatch config shows "No configuration needed" — label editing is not available in the config component. Label is set from default at creation. | `ElementConfigRouter.tsx:39` |
| 32 | Tracking element: Lap timer — target number of laps (optional) | MISSING | MEDIUM | Lap timer uses `NoConfig`. No field for target laps. | `ElementConfigRouter.tsx:39` |
| 33 | Tracking element: Checklist — target items completed (optional) | MISSING | MEDIUM | ChecklistConfig has items list but no target-items-completed field. | `ChecklistConfig.tsx` |
| 34 | Tracking element: Checklist — items reorderable | MISSING | LOW | Checklist items are not reorderable. | `ChecklistConfig.tsx` |
| 35 | Tracking element: Single select — target option (optional) | MISSING | MEDIUM | SelectConfig has options list but no target-option field. | `SelectConfig.tsx` |
| 36 | Tracking element: Multi-select — target number selected (optional) | MISSING | MEDIUM | SelectConfig has options list but no target-number-selected field. | `SelectConfig.tsx` |
| 37 | Tracking element: Yes/No — target answer (optional) | MISSING | LOW | Yes/No uses `NoConfig`. No target-answer field. | `ElementConfigRouter.tsx:49` |
| 38 | Tracking element: Rating scale — target value (optional) | MISSING | MEDIUM | RatingScaleConfig has min/max/labels but no target-value field. | `RatingScaleConfig.tsx` |
| 39 | Tracking element: Rating scale — min value configurable (default 1) | PARTIAL | LOW | Min value is hardcoded to 1 in `handleSave`. Not user-configurable. | `RatingScaleConfig.tsx:22` |
| 40 | Tracking element: Emoji face scale — target face (optional) | MISSING | LOW | No target-face field. | `EmojiFaceScaleConfig.tsx` |
| 41 | Tracking element: Multi-number input — target entries (optional) | MISSING | LOW | NumberInputConfig is shared for number_input and multi_number_input but has no target-entries field. | `NumberInputConfig.tsx` |
| 42 | Tracking element: Free text note — no config needed | PASS | — | Correctly uses `NoConfig`. | `ElementConfigRouter.tsx:59` |
| 43 | Tracking element: Voice note — spec says "Label" only | EXTRA | LOW | VoiceNoteConfig adds `maxDurationSeconds` — not in spec. Not harmful but is EXTRA. | `VoiceNoteConfig.tsx` |
| 44 | Tracking element: Split counter — target values per side (optional) | MISSING | MEDIUM | SplitCounterConfig has left/right labels but no target fields per side. | `SplitCounterConfig.tsx` |
| 45 | Tracking element: Multistep counter — target reps (optional) | MISSING | MEDIUM | MultistepCounterConfig has substeps list but no target-reps field. | `MultistepCounterConfig.tsx` |
| 46 | Tracking element: Countdown timer — spec says "Label, duration" | PASS | — | `CountdownTimerConfig` has duration field. Label is handled at element level. | `CountdownTimerConfig.tsx` |
| 47 | Tracking element: Interval timer — all 4 fields (label, work, rest, cycles) | PASS | — | IntervalTimerConfig has work, rest, cycles. Label is at element level. | `IntervalTimerConfig.tsx` |
| 48 | 18 element types all addable | PASS | — | All 18 types defined in `ELEMENT_LABELS` and routed in `ElementConfigRouter`. | `ElementConfigRouter.tsx` |
| 49 | CreateDrillScreen: Grouped picker with 4 categories | PASS | — | CreateDrillScreen groups by category correctly using `ELEMENT_CATEGORIES`. | `CreateDrillScreen.tsx:114-131` |
| 50 | Screen state: Loading — skeleton with shimmer | MISSING | CRITICAL | No loading state implemented anywhere. `isLoading` is read but no skeleton/shimmer rendered. | All screen files |
| 51 | Screen state: Error — retry button | MISSING | CRITICAL | No error state UI. Queries have no error handling UI (only catch-block toasts on mutations). | All screen files |
| 52 | Screen state: Offline banner + "Changes saved offline" toast | MISSING | CRITICAL | No offline detection or offline banner. | All screen files |
| 53 | Screen state: Drill edit — no elements empty state | MISSING | MEDIUM | DrillEditScreen has no empty state when elements list is empty. | `DrillEditScreen.tsx` |
| 54 | Navigation: Tap "Create" on new activity → stack push replaces modal → Activity detail | MISSING | CRITICAL | Create calls `router.back()`, never navigates to detail. Also not a modal to begin with. | `CreateActivityScreen.tsx:33` |
| 55 | Navigation: Tap "Add element" → bottom sheet (grouped element type picker) | MISSING | MEDIUM | DrillEditScreen uses inline buttons, not a bottom sheet. | `DrillEditScreen.tsx:81` |
| 56 | Navigation: Tap element to configure → bottom sheet | MISSING | MEDIUM | Config is rendered inline, not in a bottom sheet. | `DrillEditScreen.tsx` |
| 57 | Navigation: Tap "Add tier" / existing tier → bottom sheet | MISSING | CRITICAL | No tier UI exists. | — |
| 58 | Navigation: Tap "Add bonus preset" / existing → bottom sheet | MISSING | CRITICAL | No bonus preset UI exists. | — |
| 59 | Navigation: Delete activity → back to activity list | MISSING | CRITICAL | No delete activity flow exists. | — |
| 60 | Navigation: Delete drill → back to activity detail | PARTIAL | MEDIUM | Delete drill on detail screen stays on same screen (correct). But spec also expects delete from drill edit screen, which doesn't exist. | `ActivityDetailScreen.tsx` |
| 61 | Data: updateActivity does not queue to sync | PARTIAL | MEDIUM | `insertActivity` calls `appendToQueue`, but `updateActivity` and `deleteActivity` do not. | `activity.repository.ts:43-59` |
| 62 | Data: deleteDrill does not queue to sync | PARTIAL | MEDIUM | `insertDrill` calls `appendToQueue`, but `updateDrill`, `deleteDrill`, `reorderDrills` do not. | `drill.repository.ts:41-64` |
| 63 | Data: updateElement/deleteElement do not queue to sync | PARTIAL | MEDIUM | `insertElement` calls `appendToQueue`, but `updateElement`, `deleteElement` do not. | `tracking-element.repository.ts:38-52` |
| 64 | Data: bonus_presets and tier_rewards repos do not call appendToQueue at all | MISSING | MEDIUM | No sync queue integration for inserts, updates, or deletes. | `bonus-preset.repository.ts`, `tier-reward.repository.ts` |
| 65 | Edge case: Tier reward with no conditions — not allowed, "Add condition" required | MISSING | CRITICAL | No tier UI, so no validation. | — |
| 66 | Edge case: Tier referencing deactivated element — warning shown | MISSING | CRITICAL | No tier condition UI exists. | — |
| 67 | CreateDrillScreen: Remove element has no confirmation alert | MISSING | LOW | Spec requires native iOS alert "Remove this element?" on swipe. CreateDrillScreen removes immediately on tap. | `CreateDrillScreen.tsx:53` |

---

## 3. UX conventions compliance

- **Navigation model:** FAIL — Create activity and create drill both use stack navigation instead of modals (spec says modal slide-up). Element picker and element config should use bottom sheets but use inline UI instead. Tier and bonus preset bottom sheets are entirely absent.

- **Error states:** FAIL — No inline validation errors shown for required fields on most screens (only >50 char check on create). No "Something went wrong" + retry screen. Only mutation-failure toasts exist.

- **Loading states:** FAIL — `isLoading` is read from queries but no skeleton/shimmer animation is rendered. Screens render empty or the list immediately.

- **Empty states:** PARTIAL — Activity list and activity detail (no drills) have `EmptyState` components. Drill edit (no elements) has no empty state. No empty state for "no tier rewards" or "no bonus presets."

- **Destructive confirmations:** PARTIAL — Drill delete uses native iOS alert (correct pattern), but uses long-press instead of swipe-left. No confirmation for element removal. Delete activity is entirely missing.
