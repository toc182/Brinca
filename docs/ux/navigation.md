# Navigation model

How users move through Brinca: tabs, stack screens, modals, sheets, alerts, and where the parent avatar lives.

---

## Tab bar

Primary navigation is a 4-tab bar at the bottom of the screen.

**Implementation:** `NativeTabs` from `expo-router/unstable-native-tabs` with iOS Liquid Glass material. Tint color is `primary-500` (brand purple). Tab icons use SF Symbols (`house`, `bolt`, `chart.bar`, `person`) with selected / default variants. `minimizeBehavior: 'onScrollDown'`.

| Tab | Purpose |
|---|---|
| Home | Active child's dashboard — recent sessions, reward progress, streaks |
| Activity | Start a new session |
| Stats | Progress over time and access to previous sessions |
| Profile | Active child's profile + child switcher + activity configuration + settings |

---

## MiniPlayerBar

A persistent strip that sits just above the tab bar while a session is in progress (`sessionStatus !== 'idle' && sessionStatus !== 'complete'`). Same pattern as Apple Music or Spotify's mini-player — lets the user return to the active session from any tab.

Shows the active activity name and a "Resume" affordance. Tapping it sets the session back to `active` and routes to the session modal. Visible across all tabs.

**Implementation:** rendered as `<NativeTabs.BottomAccessory>` inside the tab layout, conditional on session state. Visual: `primary-500` background, white text, `radiusMd`, `shadowMd`.

---

## Stack navigation

Used when navigating deeper into existing content. A new screen slides in from the right with a back button in the top left. Going back reverses the animation — the current screen slides away to the right, revealing the previous screen.

Standard iOS stack behavior, applied everywhere: tabs, Settings sub-screens, session detail, etc.

Example: `Settings → Activities → tap an activity → back to activity list → back to Settings`.

---

## Headers

Native iOS headers with large titles. Each tab and stack screen renders its title in the native header chrome rather than a custom-built header.

The screen title appears as a large title at the top of the screen, collapsing to a standard inline title on scroll. Back navigation uses the system back button (top left). The parent avatar lives in the native `headerRight` slot.

---

## Modals

Used for creating or editing something. A screen slides up from the bottom and covers the full screen.

**Dismissal:** swipe down or tap Cancel button (top left). Both are always available.

Visual spec: `docs/design-system/components/modal.md`.

---

## Bottom sheets

Used for quick selections and supplementary information — when the user needs to make a choice or see additional context without leaving the current screen. Examples: selecting an activity to start, picking a date filter.

**Behavior:** draggable, swipe down to dismiss, drag handle visible at top.

Visual spec: `docs/design-system/components/bottom-sheet.md`.
Interaction wiring: `docs/ux/interactions/bottom-sheet.md` (built in Phase E).

---

## Native iOS alerts

Used exclusively for destructive confirmations — actions that cannot be undone. Examples: deleting a child profile, deleting an activity, abandoning a session.

**Format:** native iOS alert dialog with title, message, and two buttons. Destructive action button appears in red.

Visual spec: `docs/design-system/components/destructive-alert.md`.

---

## Parent avatar

Displayed in the native `headerRight` slot on every tab and stack screen. Shows the parent's photo (circular, small) or initials if no photo is set. Tapping navigates to the Settings screen.

This is the only entry point to Settings — there is no gear icon anywhere in the app.

---

## Child switching

Lives in the Profile tab. The active child's photo and name are displayed at the top of the Profile screen — tapping opens a bottom sheet with the full list of children. Each row shows photo (or initials), name, and age. Active child has a checkmark. Selecting a different child dismisses the sheet and reloads all tabs with the new child's data.

The bottom sheet also includes:
- "Add child" — navigates to Settings
- "Go to Accounts Center" — navigates to the parent's account screen

---

## Settings screen

Accessed by tapping the parent avatar (top right). Organized in grouped sections:

| Section | Contents |
|---|---|
| Accounts Center | Single button — opens parent account management screen (see `docs/feature-specs/accounts-center.md`) |
| Activities | Single button — opens activity list and builder (see `docs/feature-specs/activity-builder.md`) |
| Child (header: active child's name) | Edit profile — form (name, photo, DOB, country, gender, grade level). Measurements — weight/height history with "Add entry." External activities — list of non-tracked activities with "Add activity." |
| App | Help, Privacy, About, Log out |

**Log out behavior:** native iOS alert: "Are you sure you want to log out?" with Cancel and Log out buttons. On confirmation, returns to login screen.
