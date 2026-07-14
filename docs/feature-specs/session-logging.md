# Feature spec — Session logging

**Screen name:** Session logging
**File:** `docs/feature-specs/session-logging.md`
**Last updated:** May 30, 2026
**Status:** Draft
**Related docs:** `docs/product-vision.md`, `docs/ux/`, `docs/design-system/`, `docs/brand/`, `docs/rewards-levels-accolades.md`

---

## Purpose

The session logging screen exists to let the user work through an activity's drills with the active child and record what happened — counts, times, completions — as quickly and frictionlessly as possible.

---

## Entry points

- Selecting an activity from the Activity tab bottom sheet — session logging screen opens
- Tapping the mini player bar while a session is minimized — resumes session logging screen
- Tapping the Activity tab while a session is in progress — resumes session logging screen

---

## Flow overview

```
Activity selected → Full session screen opens (tab bar hides)
    ↓
User logs drills in any order → tap a drill row to open drill screen,
or tap the row's completion circle to mark it done in place
    ↓
On the drill screen, tap the big completion circle when done → back arrow returns to drill list
    ↓
Tap "Finish Session" → session summary screen pushes in
    ↓
Tap "Done" → saves session notes and photo, lands on Home
```

---

## Session screen

### What the screen shows (top to bottom)
1. **Header** — activity name, child name + completion progress ("2 of 4 done"), session timer (stopwatch, counts up from 0), minimize button (top right)
2. **Drill list** — all configured drills for this activity, each showing name, completion status, and a tappable completion circle on the right
3. **Session notes + photos** — two-card row ("Add Photo" / "Add Note") with a horizontal thumbnail strip below for any photos added; always visible by scrolling to the bottom
4. **"Finish Session" button** — always visible at the bottom

### Drill list behavior
- Drills can be logged in any order
- The user can skip drills or not do them at all
- Every row has a **completion circle** (the `CompletionCircle` component, small size) at its right end. Tapping the circle marks the drill complete in place — ink-fill + bounce animation, success haptic (see `design-system/components/completion-circle.md`) — and shows an **UndoBar** at the bottom for 3 seconds (also dismissible by sideways swipe). Tapping a green circle un-completes the drill (light haptic, no confirmation). This works the same for all drills, with or without tracking elements.
- Tapping anywhere else on the row opens the drill screen (stack navigation — slides in from right) — for all drills, including completed and elementless ones (photos/notes stay reachable)
- Completed drills are visually distinguished from incomplete ones (tinted background, muted name, green circle)
- An **info icon** appears at the right end of a row when the drill template has description text or at least one description photo. Tapping the icon opens the same description sheet shown on the drill screen (see *Description sheet* below) without leaving the session screen. The icon replaces what was previously a navigation chevron — the chevron is gone; the row itself remains tappable to enter the drill.

### Session timer
- Starts automatically when the session begins
- Counts up from 0:00 with no limit
- Continues running when the app is backgrounded or minimized
- Auto-pauses after 2 hours of inactivity — banner appears on return: "Your session was paused due to inactivity. Resume?"
- Stops when the session is finished

### Minimizing
- Tap minimize button — session collapses, user returns to previous screen, tab bar reappears, mini player bar appears above tab bar
- Mini player bar shows: "[Activity name] — in progress" + "Resume" button
- Tapping mini player bar or Activity tab resumes the full session screen

### Session notes & photos
- **Note:** free text field, no character limit. Tap "Add Note" → bottom sheet with a multi-line text area; tap Save to commit.
- **Photos:** multi-photo (max 10 per session). Tap "Add Photo" → choose Camera or Photo Library → picked image lands in the strip immediately as a pending thumbnail. The thumbnail shows a spinner during upload, an X badge to remove, and a retry badge if the upload fails. After one photo is added the card label changes to "Add Another".
- Photos are stored in the private `session-media` Storage bucket under `<family_id>/<session_id>/session/<photo_id>.jpg` and displayed via short-lived signed URLs. They sync to other family members' devices once uploaded.
- No voice notes at the session level in V1. Drill-level Voice Note elements are supported separately — see `activity-builder.md`.
- The note text is saved when the user taps "Done" on the session summary screen; photos are saved as soon as they're picked (the row exists locally with `upload_status='pending'`, then flips to `'uploaded'` once the bytes land).

---

## Drill screen

### What the screen shows
- Drill name (prominent header). If the drill template has a description (text or photos), a small info icon appears next to the drill name; tapping the title opens the description sheet — see *Description sheet* below.
- Active child name + activity name (context)
- All configured tracking elements (visible simultaneously). There are 18 possible types grouped in 4 categories — see `activity-builder.md` for the full list and configuration. The categories are:
  - **Counters** — Regular, Combined, Split, Multistep
  - **Timers** — Stopwatch, Countdown, Lap, Interval
  - **Selection** — Checklist, Single select, Multi-select, Yes/No, Rating scale, Emoji face scale
  - **Input** — Number input, Multi-number input, Free text note, Voice note
- The **completion circle**. For drills with no tracking elements: large size, front and center, with a hint label below ("Tap when done" / "Completed"). For tracked drills: the compact labeled-row form ("Mark as complete" / "Completed" + small circle) below the elements; it stays neutral regardless of target progress — it does **not** change color or label when targets are met. Target progress is shown per element instead: an element that reaches its target turns its value green and pops a green check ribbon into the card's bottom-right corner (shared `ElementCard` / `TargetMetRibbon`). Nothing ever auto-completes. Tapping the completion row flushes any pending element/note saves, marks the drill complete (pop + burst + haptic), and shows the UndoBar — the screen does **not** auto-navigate back, so photos/notes can still be added. Tapping the green circle un-completes without confirmation.
- Notes + photos section at the bottom — same two-card row pattern as the session screen: "Add Note" opens a bottom sheet; "Add Photo" picks from camera or library and appends to a horizontal thumbnail strip (multi-photo, max 10 per drill). Photos upload to the private `session-media` bucket under `<family_id>/<session_id>/<drill_result_id>/<photo_id>.jpg`.
- There is no "Finish drill" button and no header check icon — the completion circle is the only completion control. The back arrow only navigates.

### Description sheet
- The info icon (drill screen header and session screen drill row) appears only when the drill template has either non-empty description text or at least one description photo (whitespace-only descriptions don't count).
- Entry points:
  - Drill screen header — info icon to the right of the title block (size 34, weight regular, `textPrimary` color). The title block stays centered as if the icon weren't there; the icon is absolute-positioned at the right edge of the title area.
  - Session screen drill row — info icon at the right end of the row (size 22, `textPrimary` color). Single shared `DrillDescriptionSheet` instance per session screen; the selected row's `drillId` + description are stored in screen state and the sheet is presented via `useEffect` after that state lands (one tick after the tap, so the modal ref is attached when present is called).
- Tapping either entry point presents a bottom sheet titled "About this drill" — `snapPoints={['70%']}`, `enableDynamicSizing={false}` so a short body doesn't collapse the sheet, `BottomSheetBackdrop` with `opacity={0.4}` and `pressBehavior="close"` so the dimmed background dismisses on tap. Rounded top corners and the standard grabber pill match the rest of the app's bottom sheets.
- The sheet shows the description text on top followed by a horizontal photo strip (`PhotoGallery` in read-only mode — no remove/retry callbacks). Tapping a photo opens the existing lightbox (pinch zoom, swipe between siblings, swipe down to dismiss).
- Description text + photos are properties of the drill **template**, not of the per-session drill_result; they're edited in the activity builder — see `activity-builder.md` for the editor.
- The session screen's "drill has description" check combines `drill.description` text with a single `getDrillIdsWithPhotos()` repo call (DISTINCT scan of `drill_photos`) so we don't pay per-drill signed-URL costs to know whether the icon should render.

### Element behaviors

All 18 element types behave as described below. Every element auto-saves state after each interaction (per `docs/ux/data-persistence.md`). State survives app close, minimize, and background; timers and recorders continue running in the background where applicable. Every element's target indicator (a green check in the corner) lights up when the recorded value meets the element's configured target; reaching the target does **not** auto-complete the drill — only tapping the completion circle does.

#### Counters

- **Regular counter.** Tap `+` to increment by 1, tap `−` to decrement by 1. Minimum value is 0 — cannot go negative. Reset returns to 0 after native iOS alert: "Reset counter to zero?"
- **Editable counter** (type id `combined_counter`). Same as Regular counter, but the number sits in a tappable bordered field — tap it to open a numeric keypad and type a value directly (handy for large counts). Buttons match the regular counter (outline minus, filled plus). Minimum 0. Reset after alert: "Reset counter to zero?"
- **Split counter.** Two independent counters side by side using the two labels from the builder. Each side has its own `+` / `−`, own count, own optional target, own target indicator. No reset button. Saved as `{ left, right }`. In the builder, the two labels and the two targets are paired side by side to keep the configure modal short.
- **Multistep counter.** Shows a rep counter ("3 / 10 reps" or "3 reps" if no target) above a row of substep chips in the configured order. The current substep is highlighted. Tap the current chip to mark it done — focus auto-advances to the next chip. Strict order: a substep cannot be tapped out of sequence. When the last chip is tapped, the rep counter increments and all chips reset for the next rep. Long-pressing the rep counter opens an alert: "Clear the current rep in progress?" (clears unfilled-chip state without changing the rep count). The Reset button clears reps and chips after the alert: "Reset all progress to zero?" Saved as `{ reps: number }` — the in-progress chip state is not persisted to the final record.

#### Timers

- **Stopwatch.** Counts up from 0. Start / Pause / Resume. No automatic stop. Reset returns to 0 with no confirmation. Background-safe: the displayed elapsed time is always `Date.now() - startTime`, so the value on return is correct even after app close. Supports **half width**: at a narrow width the clock auto-shrinks (keeping centiseconds) and the text buttons become circular icon controls — a solid play/pause and an outline reset.
- **Countdown timer.** Counts down from the configured duration to 0. Start / Pause / Resume. A freshly added countdown shows the full configured duration (a not-yet-started timer is not treated as finished). When it reaches 0 the timer stops automatically, plays a completion chime (bundled `assets/sounds/countdown-complete.wav`, via `expo-audio`) plus a warning haptic, and the parent taps anywhere to silence. The chime plays with the default audio mode (respects the ringer/silent switch). The progress bar fills as a smooth continuous animation (driven `scaleX`), not per-tick steps. Drill does not auto-complete. Reset returns to the configured start value in paused state with no confirmation. Background-safe. Supports **half width** with the same compact treatment as the stopwatch (auto-shrinking clock + circular play/pause and outline reset icon controls); the progress bar and time's-up flash carry over.
- **Lap timer.** A Stopwatch with an additional Lap button that is active only while the timer is running. **Horizontal layout:** the info column on the left (total time, running "Lap N: 0:04.2" line in the monospace timer font, and "2 / 5 laps" target caption), and a stacked control column on the right — a solid circular play/pause on top and, while running, a round outline **Lap** button under it (flag icon with a tiny "Lap" label inside the circle); when paused with progress the outline reset circle takes that slot. Tapping Lap records the current elapsed time and resets the running display to 0 for the next lap. Lap times appear as a numbered list below the widget (Lap 1: 12.4s, Lap 2: 10.8s, …). Each lap row has a swipe-to-delete action. Reset clears laps and the timer after alert: "Reset timer and delete all laps?" Saved as `{ laps: number[], total_elapsed: number }`. Target met = laps recorded ≥ configured target lap count.
- **Interval timer.** Runs a configured sequence of alternating Work and Rest phases for a configured number of cycles (each cycle = one Work + one Rest). **Horizontal layout:** the info column on the left — a small **phase chip** (orange WORK / teal REST pill) next to a "Cycle 2 / 5" label, the big phase countdown under it, and a row of cycle dots (done / current / upcoming) at the bottom — and a stacked control column on the right: a solid circular play/pause on top and, while running, a round outline **Skip** button under it (skip icon with a tiny "Skip" label inside the circle); when paused with progress the outline reset circle takes that slot. Skip advances to the next phase immediately. On each phase transition the device gives a firm haptic — there is no pop-up banner; the phase chip shows the current phase. Auto-advances through all cycles. On the final Rest completion, the timer stops, a success haptic fires, and the chip row shows a green "Complete!". Reset after alert: "Reset interval timer?" Saved as `{ completed_cycles: number, total_elapsed: number, skipped_phases: number }`. Target met = `completed_cycles ≥ configured cycles`. Background-safe (phase transitions continue while backgrounded). Custom phase names and more than two phases per cycle (e.g. box breathing) are planned — tracked in GitHub issue #7.

#### Selection

Selection elements have **no configurable targets** — target met simply means a value was recorded (decided during the element polish pass; the target fields were removed from configs and builder forms).

- **Checklist.** Each configured item is a row with a checkbox. Tap to toggle on/off. Order doesn't matter. Saved as `{ item_id: boolean }[]`. Target met = every item checked.
- **Single select.** List of option buttons (rows or chips — visual style deferred to design pass). Tap to select. Tapping a different option moves the selection. Tap the selected option to deselect. Saved as option ID or `null`. Target met = an option is selected.
- **Multi-select.** Same UI as Single select. Tap to toggle each option on/off, any combination allowed. Saved as `string[]` (may be empty). Target met = at least one option selected.
- **Yes/No toggle.** Two buttons side by side: "Yes" and "No." Tap one to select; it fills with the brand purple (white text). Tap the other to switch. Tap the selected one again to deselect. Saved as `"yes" | "no" | null`. Target met = an answer is recorded.
- **Rating scale.** A horizontal row of N buttons from `min` to `max` (both from the builder). Optional low/high end labels shown above the row if configured. Tap a number to select. Tap the selected number to deselect. Saved as integer or `null`. Target met = a value is recorded.
- **Emoji face scale.** A horizontal row of 3 or 5 emoji faces (from the builder). Tap to select. Tap selected to deselect. Saved as face index (1..N) or `null`. Target met = a face is selected.

#### Input

- **Number input.** Single numeric field with the optional unit label (e.g. "lbs") shown inline. Numeric keyboard opens on tap. Accepts decimals. Saves on blur and when the drill is completed. Saved as number or `null`. Target met = recorded value ≥ target.
- **Multi-number input.** A growing list of numeric entries plus an "Add" button. Tapping Add opens an inline row with a numeric field and a ✓ button to commit. Committed entries appear in the list above in insertion order. Each row has a swipe-to-delete action. No reset button — individual wrong entries are swiped away. Saved as `number[]`. Target met = list length ≥ target entries.
- **Free text note.** Multiline text area, no character limit. Autosaves every few seconds and when the drill is completed. Saved as string (may be empty). Target met = any non-empty value.
- **Voice note.** Inline recorder widget on the drill screen — not a modal. Three visual states:
  - *Empty:* a large red circle record button with label "Tap to record."
  - *Recording:* the record button becomes a stop square; an animated waveform shows; the elapsed time counts up. Automatic stop at 3:00, with a toast: "Maximum 3 minutes reached."
  - *Recorded:* a playback bar with a Play / Pause button, the duration, a Re-record button (confirmed with alert: "Discard this recording and record again?"), and a Delete button (confirmed with alert: "Delete this recording?").
  
  One recording per element (not a list). To capture multiple audio clips, the parent adds multiple Voice Note elements in the builder. Audio is stored as a local file and uploaded to Supabase Storage on WiFi — same rule as photos per `docs/research/01-stack-decision.md`. Microphone permission is requested the first time the record button is tapped; if denied, the widget shows "Microphone access required" with a button that opens iOS Settings. Saved as `{ file_uri: string, duration_seconds: number } | null`. Target met = a recording exists (any duration).

### Completing a drill
- Tap the completion circle — drill is logged with whatever was tracked at that moment. The screen stays put; the back arrow returns to the session drill list.
- The drill shows as complete on the session screen (and counts toward the header's "n of m done")
- An UndoBar appears for 3 seconds after completing — tap Undo to revert, or swipe it sideways to dismiss
- Tapping a completed drill's row reopens the drill screen to add or correct data; tapping its green circle un-completes it

---

## Session summary screen

Pushed in (stack navigation) when the user taps "Finish Session." Session is saved immediately when this screen appears.

### What the screen shows
- Session duration
- Drills logged — list of drills with completion status
- Rewards earned — per drill breakdown showing tier achieved and currency amount per drill, plus session-level tier reward if conditions are met. See `activity-builder.md` for how tier rewards and bonus presets are configured.
- "Add bonus" button — opens preset picker (pre-configured amounts or custom) + reason field. Multiple bonuses can be added per drill and per session.
- Accolades unlocked during this session (if any)
- Level progress
- "Done" button at bottom

### Behavior
- Read-only except for adding bonuses
- Tapping "Done" lands the user on Home
- If the app is closed on this screen, the session is already saved. Any unsaved notes or photos from the session screen are saved on next open.

---

## Screen states

| State | Behavior |
|---|---|
| Active session | Full screen, tab bar hidden, timer running |
| Minimized session | Mini player bar visible above tab bar on all screens |
| Session paused (inactivity) | Timer paused, banner on return: "Your session was paused due to inactivity. Resume?" |
| Loading | Skeleton with shimmer while drill list loads |
| Network unavailable | Session continues normally — all data saved locally and synced when connection restored |

---

## Edge cases

| Edge case | Expected behavior |
|---|---|
| App closed mid-session | Auto-saved, resumes on reopen with mini player bar |
| Device battery dies mid-session | Auto-saved up to last action, resumes on reopen |
| Network unavailable during session | Session saves locally, syncs when connection restored |
| Session timer running when app is backgrounded | Timer continues running, correct time shown on return |
| Session inactive for 2 hours | Timer auto-pauses. Banner on return: "Your session was paused due to inactivity. Resume?" |
| Finish Session with no drills logged | Allowed — a session with no drills logged is valid |
| User reopens a completed drill | Tapping a completed drill reopens the drill screen to add or correct data |
| Child switching attempted mid-session | Blocked. Native iOS alert: "You have a session in progress. Finish it before switching children." |
| Counter goes below zero | Minimum value is 0, cannot go negative |
| Reset counter | Native iOS alert: "Reset counter to zero?" — confirmed — resets to 0 |
| Countdown timer reaches zero | Timer stops, device plays default alert sound, parent taps to silence. Drill does not auto-complete. |
| Reset timer | Returns to configured start value in paused state. No confirmation needed. |
| Drill with no tracking elements | Same row as every other drill — the circle completes it in place; the row still opens the drill screen for photos/notes. |
| Photo upload fails | Saved locally, uploaded automatically when connection restored. No error shown mid-session. |
| App closed on summary screen | Session already saved. Notes and photo saved on next open. |

---

## Navigation and exit points

| Trigger | Destination |
|---|---|
| Tap a drill on session screen | Drill screen (pushes in from right) |
| Tap back arrow on drill screen | Returns to session screen (completion state untouched) |
| Tap minimize button | Collapses session, returns to previous screen, mini player bar appears |
| Tap mini player bar | Resumes full session screen |
| Tap "Finish Session" | Session summary screen (pushes in) |
| Tap "Done" on summary screen | Home screen |

---

## Data written by this screen

**Session:**
- Session ID (auto-generated)
- Child ID
- Activity ID
- Start timestamp
- End timestamp
- Duration
- Session-level note (optional)
- Session-level photo URLs (0..10, multi via `session_photos`)

**Per drill logged:**
- Drill ID
- Tracking element values (counter values, timer durations, checklist states)
- Completion status
- Drill-level note (optional)
- Drill-level photo URLs (0..10, multi via `drill_result_photos`)

**Currency:**
- Currency earned per drill (based on parent-configured earning rules)
- Session bonus (if applicable)

---

## Acceptance criteria

**Session screen**
- [ ] Full session screen opens when an activity is selected from the Activity tab
- [ ] Tab bar is hidden during an active session
- [ ] Session timer starts automatically and counts up from 0:00
- [ ] Session timer continues running when app is backgrounded or minimized
- [ ] Session timer auto-pauses after 2 hours of inactivity
- [ ] Banner appears on return after inactivity pause: "Your session was paused due to inactivity. Resume?"
- [ ] Drills can be logged in any order
- [ ] Tapping a drill opens the drill screen
- [ ] Completed drills are visually distinguished from incomplete drills
- [ ] Tapping a completed drill reopens the drill screen
- [ ] Every drill row has a completion circle that marks the drill done in place, with an UndoBar to revert
- [ ] Session notes + photos section (two-card row + thumbnail strip) is visible by scrolling to bottom of drill list
- [ ] "Finish Session" button is always visible at the bottom

**Drill screen — general**
- [ ] All configured tracking elements are visible simultaneously
- [ ] Every element auto-saves state after each interaction and survives app close/minimize/background
- [ ] Every element's target indicator lights up when the recorded value meets its configured target; target-met never auto-completes the drill
- [ ] Notes field accepts free text with no character limit
- [ ] "Add Photo" opens device camera or library (photos only); picked photos appear in the thumbnail strip immediately and upload in the background; up to 10 photos per drill and per session
- [ ] Tapping the drill screen's completion circle logs the drill; the back arrow returns to the session screen

**Counters**
- [ ] Regular counter increments and decrements by 1, minimum value 0
- [ ] Editable counter behaves like Regular plus tapping the bordered number field opens a numeric keypad for direct entry
- [ ] Split counter shows two independent counters with the two builder labels; resetting one does not affect the other
- [ ] Multistep counter displays substep chips in configured order, advances focus only in strict order, increments the rep counter when the last chip is tapped, then resets chips
- [ ] Multistep long-press on the rep counter offers to clear the current in-progress rep without changing the rep count
- [ ] Any counter's Reset button shows a native iOS alert before clearing

**Timers**
- [ ] Countdown timer counts down from configured value, stops at 0, plays the default alert sound
- [ ] Parent taps to silence countdown alert sound
- [ ] Stopwatch counts up from 0 with no automatic stop
- [ ] Lap timer records the current elapsed time as a new lap row and resets the running display to 0 on each Lap tap
- [ ] Lap timer reset shows alert: "Reset timer and delete all laps?"
- [ ] Interval timer alternates Work and Rest phases for the configured number of cycles, auto-advances, gives a haptic at each phase transition, and shows the phase in a small colored chip (orange WORK / teal REST)
- [ ] Interval timer Skip button advances to the next phase immediately
- [ ] Interval timer shows "Complete" after the final Rest phase ends
- [ ] All timer types continue running when the app is backgrounded and show correct state on return
- [ ] Stopwatch, Countdown, and Lap reset behavior matches the spec (Stopwatch and Countdown reset without confirmation; Lap and Interval require alert)

**Selection**
- [ ] Checklist toggles each item on/off regardless of order
- [ ] Single select allows exactly one option at a time and supports deselecting by tapping the selected option
- [ ] Multi-select toggles any combination of options including zero
- [ ] Yes/No toggle allows selecting Yes, selecting No, switching between them, or deselecting by tapping the selected answer
- [ ] Rating scale shows buttons from min to max, supports selecting and deselecting, and shows optional low/high end labels
- [ ] Emoji face scale shows 3 or 5 faces per configuration, supports selecting and deselecting

**Input**
- [ ] Number input accepts a single numeric value, shows the configured unit inline, and saves on blur and on drill completion
- [ ] Multi-number input supports adding entries via an inline field, shows them in insertion order, and allows swipe-to-delete
- [ ] Free text note accepts multiline text with no character limit and autosaves
- [ ] Voice note record button requests microphone permission on first use and shows a permission-denied state with a link to iOS Settings if refused
- [ ] Voice note records up to 3 minutes, auto-stops at 3:00, and shows a toast when the cap is hit
- [ ] Voice note recorded state offers playback, re-record (with confirmation alert), and delete (with confirmation alert)
- [ ] Voice note audio is stored locally and uploaded to Supabase Storage on WiFi

**Session summary screen**
- [ ] Summary screen pushes in when "Finish Session" is tapped
- [ ] Session is saved immediately when summary screen appears
- [ ] Summary shows session duration, drills logged, currency earned per drill, accolades, level progress
- [ ] Tapping "Done" lands the user on Home

**Minimizing**
- [ ] Minimize button collapses the session and returns user to previous screen
- [ ] Mini player bar appears above tab bar showing "[Activity name] — in progress" and "Resume" button
- [ ] Tapping mini player bar resumes the full session screen
- [ ] Mini player bar persists across all tabs while session is active

**Persistence**
- [ ] All session data is auto-saved after every action
- [ ] App closed mid-session — resumes on reopen with mini player bar
- [ ] Device battery dies mid-session — all progress up to last action preserved on reopen
- [ ] Photos saved locally if upload fails, uploaded automatically when connection restored

---

## Open questions

- [ ] What does level progress look like on the summary screen? Is there an animation if the child leveled up during this session?
- [ ] If a new accolade is unlocked during the session, how is it shown on the summary screen?
- [ ] Should voice notes be supported in a future version for drill-level or session-level notes?
- [ ] Should the session summary screen be shareable (e.g. send to a therapist or co-parent)?

---

## Mockups

[Link to Figma file — to be added after design phase]
