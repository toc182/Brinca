# Feature spec — Stats

**Screen name:** Stats
**File:** `docs/feature-specs/stats.md`
**Last updated:** April 11, 2026
**Status:** Draft
**Related docs:** `docs/product-vision.md`, `docs/ux-conventions.md`, `docs/rewards-levels-accolades.md`

---

## Purpose

The Stats tab exists to show the user detailed progress over time for the active child — sessions logged, drills completed, currency earned, and duration — and to provide access to individual past sessions for review or deletion.

---

## Entry points

- Tapping the Stats tab from anywhere in the app
- Tapping "See all sessions" link on the Home dashboard

---

## What the screen shows

Content is displayed top to bottom in this order:

### 1. Time filter
- Segmented control at the top: **Week / Month / Year / All Time**
- Default view: Week
- Everything below updates when the filter changes
- Filter resets to "All Activities" when switching between time periods

### 2. Period selector
- Shows current period in accent color (e.g. "Apr 1–11, 2026 ⏷")
- Comparison label below in gray (e.g. "vs. Mar 1–31, 2026")
- Tapping the period opens a dropdown to select any previous period
- Period selector adapts to filter:
  - Week → shows week range (e.g. "Mar 1–7, 2026")
  - Month → shows month and year (e.g. "April 2026")
  - Year → shows year (e.g. "2026")
  - All Time → no period selector, no comparison label

### 3. Chart
Two sections stacked vertically:
- **Top — cumulative line chart:** total accumulated value over the period. Current period in accent color, previous period in gray. For All Time view: one cumulative line from the first session ever logged.
- **Bottom — bar chart:** value per day/week/month depending on filter. Current period in accent color, previous period in gray.

The chart updates to show the metric of the currently selected summary card (see below).

X-axis labels adapt to filter:
- Week → days (Sun, Mon, Tue...)
- Month → dates (1, 5, 10, 15, 20, 25, 30)
- Year → months (Jan, Feb, Mar...)
- All Time → years

### 4. Summary cards (2x2 grid)
Tappable — selecting a card updates the chart to show that metric.

| Card | What it shows |
|---|---|
| Drills completed | Total drills completed in the period |
| Sessions logged | Total sessions in the period |
| Total duration | Combined duration of all sessions in the period |
| Currency earned | Total currency earned in the period (includes drill earnings and manual bonuses — no distinction) |

Each card shows:
- Metric name
- Current period value (large, bold)
- Previous period value (smaller, below)
- Comparison indicator: ↑ (improved), ↓ (declined), = (no change)

When no data exists for the period, cards show zeros. Structure is always visible — no empty state replaces the cards.

### 5. Activity filter
- Filter button in the header (top right)
- Tapping opens a modal with:
  - "All Activities" option (checked by default)
  - List of the active child's configured activities with checkboxes
  - "Done" button to apply
- When a filter is active, chart, summary cards, and session list all update to show only selected activities
- Filter resets to "All Activities" when the user switches time periods

### 6. Session list
- Labeled "History" with total session count for the period (e.g. "5 sessions")
- Sessions sorted by most recent first
- Each row shows:
  - Activity icon
  - Key stat + activity name (e.g. "12 drills · Baseball")
  - Date
  - Completion indicator if incomplete
  - Chevron (right)
- Tapping a session opens the session detail screen
- When no sessions exist for the period, shows "0 sessions" — no empty state message, structure always visible

---

## Session detail screen

Pushed in (stack navigation) when the user taps a session from the list.

### What the screen shows
- Session date, activity name, duration
- List of drills logged with their recorded values (counter values, timer durations, checklist states)
- Drill-level notes and photos
- Session-level notes and photos
- Delete session option

### Delete session
- Accessible from session detail screen only
- Triggers native iOS alert: "Delete this session? This cannot be undone."
- On confirmation → session is deleted, user returns to Stats screen, session list updates immediately
- Currency earned in the deleted session is not deducted from the child's balance in V1

---

## Screen states

| State | Behavior |
|---|---|
| Normal | Full data shown for active child and selected period |
| No data for period | Chart shows flat line, summary cards show zeros, session list shows "0 sessions" |
| No sessions ever logged | Chart shows flat line, all cards show zeros, session list shows "0 sessions" |
| Loading | Skeleton with shimmer animation while data loads |
| Offline | Subtle offline banner at top: "You're offline. Changes will sync when your connection is restored." Last cached data shown. |
| Error | "Something went wrong. Please try again." with retry button |

---

## Edge cases

| Edge case | Expected behavior |
|---|---|
| No sessions in selected period | Chart flat line, summary cards show zeros, session list shows "0 sessions" |
| Only one period of data (nothing to compare to) | Comparison line not shown on chart. Comparison label and indicators hidden. |
| Network unavailable | Show last cached data with offline banner |
| User deletes a session | Session list and summary cards update immediately. Currency balance unchanged in V1. |
| Filter active, no sessions match | Chart flat line, cards show zeros, session list shows "0 sessions" |
| Child switched | All Stats data reloads for the newly selected child |

---

## Navigation and exit points

| Trigger | Destination |
|---|---|
| Tap a session row | Session detail screen (pushes in from right) |
| Tap filter button | Activity filter modal (slides up) |
| Tap period selector | Period dropdown |
| Tap back on session detail | Returns to Stats screen |
| Delete session on detail screen | Returns to Stats screen, list updates |

---

## Data read by this screen

- All sessions for the active child (date, activity, duration, completion status)
- Drills logged per session (values, notes, photos)
- Currency earned per session
- Active child's configured activities (for filter list)

---

## Acceptance criteria

**Time filter and period selector**
- [ ] Time filter shows Week / Month / Year / All Time
- [ ] Default view is Week showing the current week
- [ ] Period selector shows the current period with a dropdown to change it
- [ ] Comparison label shows the previous period below the period selector
- [ ] All Time view shows no period selector and no comparison label
- [ ] Switching time periods resets the activity filter to "All Activities"

**Chart**
- [ ] Chart shows cumulative line (top) and bar chart (bottom)
- [ ] Current period shown in accent color, previous period in gray
- [ ] Chart updates when a different summary card is selected
- [ ] X-axis labels adapt to the selected time filter
- [ ] All Time view shows one cumulative line from the first session ever logged
- [ ] When no data exists, chart shows a flat line

**Summary cards**
- [ ] Four cards shown in a 2x2 grid: drills completed, sessions logged, total duration, currency earned
- [ ] Tapping a card updates the chart to show that metric
- [ ] Each card shows current value, previous period value, and comparison indicator (↑ ↓ =)
- [ ] Cards show zeros when no data exists — structure always visible

**Activity filter**
- [ ] Filter button in header opens a modal
- [ ] Modal shows "All Activities" + list of active child's activities with checkboxes
- [ ] Selecting activities and tapping "Done" filters chart, cards, and session list
- [ ] Filter resets to "All Activities" when switching time periods

**Session list**
- [ ] Sessions shown sorted by most recent first
- [ ] Each row shows activity icon, key stat + activity name, date, completion indicator if incomplete
- [ ] Tapping a session opens session detail screen
- [ ] Session count shown above list (e.g. "5 sessions")
- [ ] "0 sessions" shown when no sessions match — no empty state message

**Session detail**
- [ ] Shows session date, activity name, duration
- [ ] Shows all drills logged with recorded values
- [ ] Shows drill-level and session-level notes and photos
- [ ] Delete option triggers native iOS alert: "Delete this session? This cannot be undone."
- [ ] After deletion, user returns to Stats and session list updates immediately
- [ ] Currency balance is not affected by session deletion in V1

**Child switching**
- [ ] Switching children reloads Stats with the new child's data

---

## Open questions

- [ ] How are session photos displayed on the session detail screen — as a scrollable gallery, a grid, or a count with a "View photos" link?
- [ ] Should deleting a session also deduct the currency earned in that session from the child's balance in a future version?
- [ ] Should there be a way to export or share session history (e.g. as a PDF report for a therapist)?

---

## Mockups

[Link to Figma file — to be added after design phase]
