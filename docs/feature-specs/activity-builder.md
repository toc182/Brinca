# Feature spec — Activity Builder

**Screen name:** Activity Builder
**File:** `docs/feature-specs/activity-builder.md`
**Last updated:** April 13, 2026
**Status:** Draft
**Related docs:** `docs/product-vision.md`, `docs/ux-conventions.md`, `docs/rewards-levels-accolades.md`

---

## Purpose

The Activity Builder lets the parent create and configure activities and drills for the active child — defining what tracking elements each drill uses, what the targets are, and what rewards are earned.

---

## Entry points

- Settings → Activities button → Activity list screen

---

## Flow overview

```
Settings → Activities button
    ↓
Activity list screen (all activities for active child)
    ↓
Tap an activity → Activity detail screen
    ↓
Tap a drill → Drill edit screen
```

---

## Activity list screen

### What the screen shows
- List of all activities for the active child
- Each row shows: activity icon, activity name, active/deactivated status
- Deactivated activities are visually dimmed with a toggle to reactivate
- "Add activity" button at the bottom
- If no activities: "No activities yet. Add your first activity to start tracking."

### Behavior
- Tapping an activity opens the activity detail screen (stack navigation)
- Tapping "Add activity" opens the create activity flow

---

## Create activity flow

### What the screen shows
- Activity name field (required, max 50 characters)
- Icon picker (predefined set, same pattern as currency icon picker)
- Category selector (optional): Sport, Therapy, Academic, Custom
- "Create" button — disabled until name is filled

### Behavior
- Tapping "Create" saves the activity, dismisses the modal, and opens the activity detail screen (stack push)
- The new activity starts with no drills — the parent adds them from the detail screen

---

## Activity detail screen

### What the screen shows (top to bottom)

**Activity header**
- Activity name (tappable to edit)
- Activity icon (tappable to change)

**Session-level rewards**
- Section header: "Session Rewards"
- Tier rewards — list of configured tiers, each showing name, condition, and amount
- "Add tier" button
- Bonus reward presets — list of configured preset amounts
- "Add bonus preset" button

**Drill list**
- Section header: "Drills"
- List of drills, each showing: drill name, tracking type summary (e.g., "Counter · Target: 50"), active/deactivated status
- Deactivated drills visually dimmed with toggle to reactivate
- Drills reorderable via long-press drag
- Swipe left on a drill to delete (native iOS alert: "Delete this drill? This cannot be undone.")
- "Add drill" button at the bottom

**Activity actions**
- Deactivate activity toggle
- Delete activity (native iOS alert: "Delete this activity? All drills and configuration will be removed. Past sessions will not be deleted.")

---

## Session-level tier rewards

### Configuration
- Parent adds flexible tiers — as many as they want
- Each tier has:
  - Tier name (text, e.g., "Perfect", "Great", "Good")
  - Condition — references drill results with operators (e.g., "All drills completed", "3 of 4 drills hit a tier"). AND logic only.
  - Currency amount earned
- Child earns the highest qualifying tier (not stacked)

### Session-level bonus reward presets

- Parent pre-configures bonus preset amounts (e.g., $1, $3, $5) or custom amounts
- Each preset has an amount only — the reason is typed at the time of awarding during the session
- During a session, the parent taps "Add bonus" → sees preset amounts + "Custom" option → picks one → types reason → bonus added
- Multiple bonuses can be added per session

---

## Drill edit screen

### What the screen shows (top to bottom)

**Drill name**
- Text field (required, max 50 characters)

**Tracking elements**
- List of configured tracking elements, each showing: type icon, label, type-specific summary
- "Add element" button → opens grouped picker (see tracking element types below)
- Multiple elements per drill allowed, including multiple of the same type
- Each element is tappable to edit its configuration
- Swipe left to remove an element (native iOS alert: "Remove this element?")
- Elements reorderable via long-press drag

**Drill-level rewards**
- Section header: "Drill Rewards"
- Tier rewards — list of configured tiers, each showing name, condition, and amount
- "Add tier" button
- Bonus reward presets — list of configured preset amounts
- "Add bonus preset" button

**Drill actions**
- Deactivate drill toggle
- Delete drill (native iOS alert: "Delete this drill? This cannot be undone.")

**Save**
- "Save" button — saves all changes to the drill

---

## Drill-level tier rewards

### Configuration
- Parent adds flexible tiers — as many as they want
- Each tier has:
  - Tier name (text, e.g., "Amazing", "Solid", "OK")
  - Condition — references tracking elements within the drill with operators (pick element → pick operator: ≥, ≤, = → set value). Multiple conditions combined with AND.
  - Currency amount earned
- Child earns the highest qualifying tier (not stacked)

### Drill-level bonus reward presets

- Same pattern as session-level: parent pre-configures preset amounts or custom
- Reason typed at the time of awarding during the session
- Multiple bonuses can be added per drill

---

## Tracking element types

Added via "Add element" → grouped picker (bottom sheet with categories).

### Counters

| Type | Description | Configurable fields |
|---|---|---|
| Regular counter | + and - buttons to increment/decrement | Label, target value (optional) |
| Combined counter | + and - buttons + tap number to type directly | Label, target value (optional) |
| Split counter | Two counters side by side with configurable labels | Label, left counter label, right counter label, target values per side (optional) |
| Multistep counter | Complete multiple substeps in sequence to count as one rep | Label, list of substep names, target reps (optional) |

### Timers

| Type | Description | Configurable fields |
|---|---|---|
| Stopwatch | Counts up from 0, start/stop/reset | Label |
| Countdown timer | Counts down from configured duration, alerts when done | Label, duration |
| Lap timer | Stopwatch with a lap button to record split times | Label, number of laps target (optional) |
| Interval timer | Configurable work/rest cycles that repeat | Label, work duration, rest duration, number of cycles |

### Selection

| Type | Description | Configurable fields |
|---|---|---|
| Checklist | List of items to check off one by one | Label, list of item names (reorderable), target items completed (optional) |
| Single select | Configurable list of options, tap one to select | Label, list of option names, target option (optional) |
| Multi-select | Configurable list of options, tap multiple to select | Label, list of option names, target number selected (optional) |
| Yes/No toggle | Single binary button | Label, target answer (optional) |
| Rating scale | Configurable 1–N scale, tap a value to record | Label, min value (default 1), max value, low/high end labels (optional), target value (optional) |
| Emoji face scale | Rating scale with emoji faces instead of numbers | Label, number of faces (3 or 5), target face (optional) |

### Input

| Type | Description | Configurable fields |
|---|---|---|
| Number input | Type a single number once per session | Label, unit (optional, e.g., "lbs", "seconds"), target value (optional) |
| Multi-number input | Type multiple numbers, one at a time, building a list | Label, unit (optional), target entries (optional) |
| Free text note | Type a text note during or after the drill | Label |
| Voice note | Record audio during or after the drill | Label |

---

## Screen states

| State | Behavior |
|---|---|
| Activity list — normal | Full list of activities shown |
| Activity list — empty | "No activities yet. Add your first activity to start tracking." with "Add activity" button |
| Activity detail — normal | Full activity configuration shown |
| Drill edit — normal | Full drill configuration shown |
| Drill edit — no elements | Tracking elements section shows: "No elements yet. Add your first tracking element." |
| Loading | Skeleton with shimmer animation |
| Offline | Subtle offline banner. Changes saved locally and synced when connection restored. |
| Error | "Something went wrong. Please try again." with retry button |

---

## Edge cases

| Edge case | Expected behavior |
|---|---|
| Activity with no drills | Valid — activity appears in Activity tab but starts a session with no drills (session notes still available) |
| Drill with no tracking elements | Valid — drill appears in session with a "Mark complete" button only |
| Drill with 10+ tracking elements | All elements visible on drill screen during session via scrolling |
| Delete an activity with past sessions | Activity and drills removed from builder. Past sessions preserved in Stats and session history. |
| Delete a drill with past session data | Drill removed from activity. Past session data for that drill preserved. |
| Deactivate an activity | Activity hidden from Activity tab bottom sheet. Stays in builder list, dimmed. Past sessions preserved. |
| Deactivate a drill | Drill hidden from sessions. Stays in drill list, dimmed. Past session data preserved. |
| Reactivate a deactivated drill/activity | Immediately available in sessions again |
| Two drills with the same name | Allowed. Treated as separate drills. |
| Two tracking elements with the same label | Allowed. Treated as separate elements. |
| Tier reward with no conditions set | Not allowed — "Add condition" required before saving a tier |
| Tier reward with condition referencing a deactivated element | Warning shown: "This condition references a deactivated element." Tier is still saved. During session evaluation the broken condition is skipped and the tier's remaining conditions still evaluate — if all conditions reference missing elements, the tier is skipped entirely. See `docs/rewards-levels-accolades.md` §3.2. |
| Editing an activity that has a session in progress | Changes saved but only take effect on the next session. Active session uses the configuration from when it started. |
| Network unavailable while saving | Changes saved locally, synced when connection restored. Toast: "Changes saved offline." |
| No bonus presets configured | "Add bonus" during session shows only the "Custom" option |
| Child switched | Activity Builder shows activities for the newly selected child |

---

## Navigation and exit points

| Trigger | Navigation type | Destination |
|---|---|---|
| Settings → Activities button | Stack (push from right) | Activity list screen |
| Tap an activity in the list | Stack (push from right) | Activity detail screen |
| Tap "Add activity" | Modal (slide up) | Create activity screen |
| Tap "Create" on new activity | Stack (push from right, replaces modal) | Activity detail screen |
| Tap a drill in the list | Stack (push from right) | Drill edit screen |
| Tap "Add drill" | Modal (slide up) | Drill edit screen for new drill |
| Tap "Add element" on drill edit | Bottom sheet | Grouped element type picker |
| Tap an element to configure | Bottom sheet | Element configuration |
| Tap "Add tier" / tap existing tier | Bottom sheet | Tier configuration (name, conditions, amount) |
| Tap "Add bonus preset" / tap existing preset | Bottom sheet | Bonus preset configuration (amount) |
| Tier condition builder (pick element, operator, value) | Bottom sheet (nested within tier config) | Condition editor |
| Tap back from any screen | Stack (slide back to left) | Previous screen |
| Delete activity | Stack (slide back to left) | Activity list |
| Delete drill | Stack (slide back to left) | Activity detail |

---

## Data written by this screen

**Activity:**
- Activity ID (auto-generated)
- Name
- Icon
- Category (optional)
- Active/deactivated status
- Session-level tier rewards (name, conditions, amount per tier)
- Session-level bonus reward presets (amounts)

**Drill:**
- Drill ID (auto-generated)
- Activity ID
- Name
- Display order
- Active/deactivated status
- Drill-level tier rewards (name, conditions, amount per tier)
- Drill-level bonus reward presets (amounts)

**Tracking element:**
- Element ID (auto-generated)
- Drill ID
- Type
- Label
- Display order
- Type-specific configuration (target values, options, durations, etc.)

---

## Acceptance criteria

**Activity list**
- [ ] All activities for the active child are listed with icon, name, and status
- [ ] Deactivated activities are visually dimmed with a toggle to reactivate
- [ ] Tapping an activity opens the activity detail screen
- [ ] "Add activity" button creates a new activity
- [ ] Empty state shown when no activities exist

**Create activity**
- [ ] "Create" button is disabled until name is filled
- [ ] After creation, pushes into the activity detail screen
- [ ] New activity starts with no drills

**Activity detail**
- [ ] Activity name and icon are editable
- [ ] Session-level tier rewards can be added, edited, and removed
- [ ] Session-level bonus presets can be added, edited, and removed
- [ ] Drill list shows all drills with name, tracking summary, and status
- [ ] Drills are reorderable via long-press drag
- [ ] Swipe left on a drill shows delete option with confirmation alert
- [ ] "Add drill" button opens a new drill edit screen
- [ ] Deactivate toggle hides the activity from the Activity tab
- [ ] Delete option removes the activity with confirmation, preserves past sessions

**Drill edit**
- [ ] Drill name is required, max 50 characters
- [ ] "Add element" opens a grouped picker with 4 categories and 18 types
- [ ] Multiple tracking elements can be added per drill, including same type
- [ ] Each element is tappable to edit its configuration
- [ ] Elements are reorderable via long-press drag
- [ ] Swipe left on an element shows remove option with confirmation
- [ ] Drill-level tier rewards can be added, edited, and removed
- [ ] Tier conditions reference tracking elements with operators (≥, ≤, =) and AND logic
- [ ] Drill-level bonus presets can be added, edited, and removed
- [ ] Deactivate toggle hides the drill from sessions
- [ ] Delete option removes the drill with confirmation, preserves past session data
- [ ] "Save" button saves all changes

**Tracking elements**
- [ ] Each of the 18 tracking element types can be added and configured
- [ ] Configuration fields match the type-specific fields defined in this spec
- [ ] Elements with no target show no target indicator
- [ ] Labels are required for all elements

**Rewards during session**
- [ ] Tier rewards are evaluated automatically — child earns highest qualifying tier
- [ ] "Add bonus" button during session shows pre-configured presets + "Custom"
- [ ] Parent types a reason when adding a bonus
- [ ] Multiple bonuses can be added per drill and per session

**Deactivation and deletion**
- [ ] Deactivated activities are hidden from Activity tab but visible (dimmed) in builder
- [ ] Deactivated drills are hidden from sessions but visible (dimmed) in activity detail
- [ ] Reactivating immediately makes the item available again
- [ ] Deleting an activity preserves past sessions
- [ ] Deleting a drill preserves past session data for that drill

---

## Open questions

- [ ] Should there be a way to duplicate a drill (copy all tracking elements and rewards to a new drill)?
- [ ] Should there be a way to duplicate an activity (copy all drills and configuration)?
- [ ] Should tracking element configuration show a preview of what it looks like during a session?
- [ ] Can the parent set a default category for new activities, or is it always selected manually?
- [ ] Should the drill list show reward amounts per drill, or just tracking info?
- [ ] What happens to tier rewards if the parent removes a tracking element that a tier condition references — delete the condition, show a warning, or block removal?
- [ ] Should there be a limit to how many tracking elements a drill can have?
- [ ] Should there be a limit to how many drills an activity can have?
- [ ] How should the interval timer display work/rest cycles during a session — visual indicator, sound, vibration?
- [ ] How should the voice note element work during a session — inline recording with playback, or a modal?
- [ ] Should the emoji face scale use standard emoji or custom illustrations?

---

## Mockups

[Link to Figma file — to be added after design phase]
