# Feature spec — Activity

**Screen name:** Activity
**File:** `docs/feature-specs/activity.md`
**Last updated:** May 30, 2026
**Status:** Draft
**Related docs:** `docs/product-vision.md`, `docs/ux/`, `docs/design-system/`, `docs/brand/`

---

## Purpose

The Activity tab lets the user pick an activity and start a new practice session for the active child. It is a tab *destination* (a real screen with content), per Apple HIG: *"Tab bars should be used for navigation rather than providing actions."*

---

## Entry points

- Tapping the Activity tab from anywhere in the app
- Tapping the mini player bar while a session is in progress — resumes full session screen

---

## Flow overview

```
User taps Activity tab
    ↓
[No session in progress] → Full-screen Activities grid
    ↓
User taps an activity tile → Full session screen opens, tab bar hides
    ↓
[Session in progress] → Tapping Activity tab resumes full session screen
```

---

## Activities grid

### Layout
- Full-screen tab destination (no bottom sheet).
- Header: `CollapsibleHeader` with the active child's name and `ParentAvatar` on the right.
- Content: 2-column grid of tiles. `spacing.md` (16) horizontal screen inset; `spacing.sm` (12) gutter.
- Trailing tile is "+ Add activity" (visually distinct).

### Activity tile
- Container: `surface` background, 1px `borderSubtle`, `radii.md` (12), `shadows.sm`, `spacing.md` padding, `spacing.xs` internal gap.
- Icon container: 40×40 circle. Background cycles through `[primary500, secondary500, accent500]` by the activity's index in the list.
- Activity name: `typography.titleSmall`, `textPrimary`.
- Recency: `typography.bodySmall`, `textSecondary`. Format: `Today` / `Yesterday` / `Xd ago` / `Xw ago` / `Xmo ago` / `Never`.
- Tap behavior: starts a session for that activity and opens the full session screen.

### "+ Add activity" tile
- `primary50` background, `radii.md`, same dimensions as activity tiles.
- Phosphor `Plus` icon (24, `primary500`) + label "Add activity" in `primary500`.
- **V1 launch state: disabled (50% opacity, no press response).** Direct creation flow is deferred to a follow-up PR. Until then, users add activities via Settings → Activities → +.

---

## Session in progress — mini player bar

When a session is minimized, a persistent mini player bar appears above the tab bar on every screen.

### What the bar shows
- Activity name + "— in progress" (e.g. "Baseball — in progress")
- "Resume" button

### Behavior
- Appears when the user taps the minimize button inside the full session screen.
- Persists across all tabs (Home, Stats, Profile) while session is active.
- Tapping the bar or tapping the Activity tab → returns to full session screen, tab bar hides.
- Disappears when the session is finished or abandoned.
- If the app is closed mid-session → bar reappears on next launch, session resumes where it left off.

### Activity tab while session is in progress
- Tab icon stays at its default state (SF Symbol `bolt` / `bolt.fill`).
- The Activity tab is auto-presented (session modal pushed) only when the session is in the `active` (foreground) state — typically right after starting a session, or after relaunching the app while a session was active. Once the user minimizes (`minimized` state), tapping the Activity tab shows the grid; the mini player bar is the resume affordance. (Apple Music pattern.)

---

## Screen states

| State | Behavior |
|---|---|
| No session in progress | Tapping Activity tab shows the activities grid |
| Session in progress, foreground | Activity tab auto-pushes the session modal (handles relaunch / direct-start). Mini player bar visible above tab bar on all other screens |
| Session in progress, minimized | Activity tab shows the grid. Mini player bar visible above tab bar; tap it to resume |
| No activities configured | Empty state: "Let's set up your first activity" with body pointing to Settings (no CTA in V1 — direct add deferred) |
| Loading | Skeleton tiles in grid layout while activities load |

---

## Edge cases

| Edge case | Expected behavior |
|---|---|
| No activities configured | Grid hidden; `EmptyState` rendered: title "Let's set up your first activity", body "Add activities in Settings to start tracking sessions." No CTA (v1) — disabled "+ Add activity" tile in the grid is a placeholder for the future direct-create flow |
| Only one activity configured | One activity tile + one disabled "+ Add activity" tile side-by-side |
| Session in progress (active state), user taps Activity tab | Auto-pushes the session modal (covers the foreground-restore case on app relaunch) |
| Session minimized, user taps Activity tab | Shows the activities grid. Mini player bar visible to resume |
| Session in progress (active), user reaches Activity tab | `useFocusEffect` auto-pushes the session modal — the grid never appears, so no new session can be started from this state |
| Session minimized, user taps a different activity | Blocked by guard. Native iOS alert: title "Session in progress", body "Resume it or finish it before starting a new one.", buttons Cancel + Resume. "Resume" sets the session status back to `active` and pushes the session modal. (See `useChildSwitchGuard` for the equivalent guard on the child switcher.) |
| App closed mid-session | Session auto-saved, mini player bar reappears on next launch, session resumes where it left off |
| Device runs out of battery mid-session | Session auto-saved up to last action. On reopen, mini player bar reappears and session resumes where it left off |
| Network unavailable when starting session | Session starts normally — all data saved locally and synced when connection is restored |
| Child switched while session is in progress | Prevented. Show native iOS alert: "You have a session in progress. Finish it before switching children." |

---

## Navigation and exit points

| Trigger | Destination |
|---|---|
| Tap activity tile | Full session screen (tab bar hides) |
| Tap "+ Add activity" tile (V1) | No-op (disabled) |
| Tap minimize button in session screen | Collapses session, mini player bar appears above tab bar |
| Tap mini player bar | Full session screen (tab bar hides) |
| Tap Activity tab while session in `active` state | Full session screen (tab bar hides) |
| Tap Activity tab while session in `minimized` state | Activities grid (mini player bar remains as the resume affordance) |
| Session finished | Home screen |

---

## Acceptance criteria

**Activities grid**
- [ ] Tapping the Activity tab with no session in progress shows a 2-column grid of activity tiles
- [ ] Each tile shows the activity's icon (emoji), name, and recency line ("Today" / "Yesterday" / "Xd ago" / "Xw ago" / "Xmo ago" / "Never")
- [ ] Icon container colors cycle through `primary500` → `secondary500` → `accent500` by tile index
- [ ] A "+ Add activity" tile renders as the last item in the grid; in V1 it is visually disabled (50% opacity) and tapping it does nothing
- [ ] Tapping an activity tile starts a session for that activity and opens the full session screen
- [ ] If no activities are configured, the grid is replaced by `EmptyState` with title "Let's set up your first activity" and body "Add activities in Settings to start tracking sessions."
- [ ] Loading state shows a 2×2 skeleton grid

**Session in progress**
- [ ] Tapping the Activity tab while a session is in `active` state pushes the session modal (covers relaunch / restored foreground state)
- [ ] Tapping the Activity tab while a session is in `minimized` state shows the activities grid; mini player bar remains as the resume path
- [ ] Mini player bar appears above the tab bar when a session is minimized
- [ ] Mini player bar shows activity name + "— in progress" and a "Resume" button
- [ ] Mini player bar persists across all tabs while session is active
- [ ] Tapping the mini player bar resumes the full session screen
- [ ] Only one session can be active at a time
- [ ] Child switching is blocked while a session is in progress

**Persistence**
- [ ] If the app is closed mid-session, the session is preserved
- [ ] On next launch, the mini player bar reappears and the session resumes where it left off
- [ ] If the device runs out of battery mid-session, all progress up to the last action is preserved on reopen

---

## Open questions

- [ ] Direct-creation modal for the "+ Add activity" tile (currently routed through Settings). Tracked as a follow-up PR.
- [ ] Stable per-activity color (currently cycled by display order — color will shift if order changes).
- [ ] Should there be a way to quickly switch the active child from the Activities tab, or is that always done through the Profile tab?

---

## Mockups

[Link to Figma file — to be added after design phase]

---

## Change history

- **2026-05-21:** Replaced bottom-sheet picker with full-screen 2-column grid (per Apple HIG: tabs are for navigation, not actions; sheets are for transient modal tasks, not persistent UI). Added recency line to tiles. Added disabled "+ Add activity" tile pending follow-up direct-create modal.
- **2026-05-21:** Fixed minimize focus-loop: Activity tab now only auto-pushes the session modal when status is `active` (foreground / relaunch). After explicit minimize (status `minimized`), the grid shows and the mini player bar becomes the sole resume affordance, matching the Apple Music pattern. Removed the now-unused `useActiveSession` hook in favor of reading the status directly from the store.
