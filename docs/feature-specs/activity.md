# Feature spec — Activity

**Screen name:** Activity
**File:** `docs/feature-specs/activity.md`
**Last updated:** April 10, 2026
**Status:** Draft
**Related docs:** `docs/product-vision.md`, `docs/ux-conventions.md`

---

## Purpose

The Activity tab exists to let the user quickly select an activity and start a new practice session for the active child.

---

## Entry points

- Tapping the Activity tab from anywhere in the app
- Tapping the mini player bar while a session is in progress — resumes full session screen

---

## Flow overview

```
User taps Activity tab
    ↓
[No session in progress] → Bottom sheet slides up with list of activities
    ↓
User selects an activity → Full session screen opens, tab bar hides
    ↓
[Session in progress] → Tapping Activity tab resumes full session screen
```

---

## Activity selector — bottom sheet

### What the sheet shows
- Drag handle at top
- Heading: "Select an activity"
- List of activities configured for the active child, showing activity name only
- If no activities configured: empty state (see edge cases)

### Behavior
- Opens immediately when the user taps the Activity tab (no session in progress)
- Swipe down to dismiss without starting a session
- Tapping an activity dismisses the sheet and opens the full session screen

---

## Session in progress — mini player bar

When a session is minimized, a persistent mini player bar appears just above the tab bar on every screen.

### What the bar shows
- Activity name + "— in progress" (e.g. "Baseball — in progress")
- "Resume" button

### Behavior
- Appears when the user taps the minimize button inside the full session screen
- Persists across all tabs (Home, Stats, Profile) while session is active
- Tapping the bar or tapping the Activity tab → returns to full session screen, tab bar hides
- Disappears when the session is finished or abandoned
- If the app is closed mid-session → bar reappears on next launch, session resumes where it left off

### Activity tab while session is in progress
- Tab icon changes color to signal an active session
- Tapping the Activity tab resumes the full session screen instead of opening the activity selector

---

## Screen states

| State | Behavior |
|---|---|
| No session in progress | Tapping Activity tab opens bottom sheet with activity list |
| Session in progress | Tapping Activity tab resumes full session screen. Mini player bar visible above tab bar on all screens. |
| No activities configured | Bottom sheet shows empty state with CTA to configure activities |
| Loading | Skeleton with shimmer while activity list loads |

---

## Edge cases

| Edge case | Expected behavior |
|---|---|
| No activities configured | Bottom sheet shows empty state: "No activities yet. Add your first activity in Settings." with "Go to Settings" button |
| Only one activity configured | Bottom sheet still appears for consistency — user taps the one activity to start |
| Session in progress, user taps Activity tab | Returns to full session screen instead of opening activity selector |
| Session in progress, user tries to start a new session | Not possible — Activity tab always resumes existing session while one is active |
| App closed mid-session | Session auto-saved, mini player bar reappears on next launch, session resumes where it left off |
| Device runs out of battery mid-session | Session auto-saved up to last action. On reopen, mini player bar reappears and session resumes where it left off |
| Network unavailable when starting session | Session starts normally — all data saved locally and synced when connection is restored |
| Child switched while session is in progress | Prevented. Show native iOS alert: "You have a session in progress. Finish it before switching children." |

---

## Navigation and exit points

| Trigger | Destination |
|---|---|
| Tap activity in bottom sheet | Full session screen (tab bar hides) |
| Swipe down bottom sheet | Dismisses sheet, returns to previous screen |
| Tap minimize button in session screen | Collapses session, returns to previous screen, mini player bar appears |
| Tap mini player bar | Full session screen (tab bar hides) |
| Tap Activity tab while session in progress | Full session screen (tab bar hides) |
| Tap "Go to Settings" in empty state | Settings screen |
| Session finished | Home screen |

---

## Acceptance criteria

**Activity selector**
- [ ] Tapping the Activity tab when no session is in progress opens a bottom sheet
- [ ] Bottom sheet shows the list of activities for the active child (name only)
- [ ] Tapping an activity dismisses the sheet and opens the full session screen
- [ ] Swiping down the bottom sheet dismisses it without starting a session
- [ ] If no activities are configured, bottom sheet shows empty state: "No activities yet. Add your first activity in Settings." with "Go to Settings" button

**Session in progress**
- [ ] Activity tab icon changes color when a session is in progress
- [ ] Tapping the Activity tab while a session is in progress resumes the full session screen
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

- [ ] Should the bottom sheet show any additional context per activity (e.g. last session date, number of drills) in a future version, or always name only?
- [ ] Should there be a way to quickly switch the active child from the Activity bottom sheet, or is that always done through the Profile tab?

---

## Mockups

[Link to Figma file — to be added after design phase]
