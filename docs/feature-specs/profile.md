# Feature spec — Profile

**Screen name:** Profile
**File:** `docs/feature-specs/profile.md`
**Last updated:** April 14, 2026
**Status:** Draft
**Related docs:** `docs/product-vision.md`, `docs/ux-conventions.md`

---

## Purpose

The Profile tab displays the active child's complete profile — identity, physical measurements, enrolled activities, and photo history — giving the parent a single place to see everything about this child.

---

## Entry points

- Tapping the Profile tab from anywhere in the app
- Tapping the active child header on the Home dashboard
- Completing child switching (bottom sheet dismisses, Profile reloads with new child's data)

---

## What the screen shows

Content is displayed top to bottom in this order. The entire screen is read-only — all editing is done through the Settings screen.

### 1. Child header
- Child's photo (circular, large) + name
- Tapping the name or photo opens the child switcher bottom sheet
- If no photo is set, show a circular placeholder with the child's initials

### 2. Basic info
- Age (calculated from DOB, displayed as years — e.g., "9 years old")
- Country of residence
- Gender
- Current grade level (free text — e.g., "4th grade")
- Fields with no data show "Not recorded"

### 3. Measurements
- **Weight** — most recent value + date (e.g., "68 lbs — Mar 15, 2026")
- **Height** — most recent value + date (e.g., "4'5\" — Mar 15, 2026")
- Units are set at the family level (metric or imperial)
- Tapping weight or height opens a history view showing all recorded measurements over time
- If no measurements recorded: "Not recorded" — tapping still opens the history view (empty, with a prompt to add the first measurement from Settings)

### 4. Activities
- Section header: "Activities"
- List of all activities the child is involved in, two types:
  - **App-tracked** — added automatically when created in the Activity Builder. Shows activity name + context (e.g., session count, last session date)
  - **External** — manually added by the parent through Settings. Shows activity name + optional fields (schedule, location, notes)
- Both types appear in the same list, visually distinguished
- Not tappable — read-only list
- If no activities: "No activities yet."

### 5. Photos
- Section header: "Photos"
- Grid of photos pulled automatically from all sessions for this child
- Tapping a photo opens it full-screen
- If more than 6 photos: first 6 visible, "See all" link opens full gallery
- If no photos: "No photos yet. Photos taken during sessions will appear here."

---

## Child switcher — bottom sheet

Triggered by tapping the child's name or photo at the top of the Profile tab.

### What the sheet shows
- Drag handle at top
- List of all children in the family — each row shows photo (or initials), name, and age
- Active child has a checkmark
- Tapping a different child dismisses the sheet and reloads the entire Profile tab with the new child's data
- "Add child" option at the bottom of the list — navigates to Settings (where child creation lives)
- "Go to Accounts Center" button below — navigates to the parent's Settings/account screen

### Behavior
- Swipe down to dismiss without switching
- Selecting the already-active child dismisses the sheet with no reload

---

## Parent avatar

- Displayed in the top right corner of every screen in the app
- Shows the parent's photo (circular, small) or initials if no photo is set
- Tapping navigates to the Settings screen (see separate settings spec)

---

## Screen states

| State | Behavior |
|---|---|
| Normal | Full child profile displayed with all sections |
| Loading | Skeleton with shimmer animation |
| No child selected | Should not be reachable — onboarding ensures at least one child exists and is selected |
| No activities enrolled | Activities section shows: "No activities yet." |
| No photos | Photos section shows: "No photos yet. Photos taken during sessions will appear here." |
| No measurements recorded | Weight and height show: "Not recorded" — tapping still opens history view (empty with prompt to add from Settings) |
| Offline | Subtle offline banner at top: "You're offline. Changes will sync when your connection is restored." Last cached data shown. |
| Error | "Something went wrong. Please try again." with retry button |
| Child switched | All sections reload with the new child's data. Screen scrolls to top. |

---

## Edge cases

| Edge case | Expected behavior |
|---|---|
| Only one child in family | Child switcher bottom sheet still opens — shows the one child with checkmark + "Add child" + "Go to Accounts Center" |
| Child has no DOB | Age shows "Not recorded" |
| Child has no country, gender, or grade | Each field shows "Not recorded" |
| Child has measurements but only one entry | History view shows a single entry, no trend |
| Measurement history opened with no entries | Empty state: "No measurements yet. Add the first one from Settings." |
| Child has 50+ photos | Grid shows first 6, "See all" opens full gallery |
| Child has both app-tracked and external activities | Both appear in same list, visually distinguished |
| Session photo deleted from session detail (Stats tab) | Photo disappears from Profile gallery on next load |
| Child switched while scrolled down on Profile | Screen scrolls to top and reloads with new child's data |
| Network unavailable | Cached data shown, offline banner |
| Session in progress, child switch attempted | Blocked. Native iOS alert: "You have a session in progress. Finish it before switching children." |

---

## Navigation and exit points

| Trigger | Destination |
|---|---|
| Tap child name or photo | Child switcher bottom sheet |
| Tap a different child in switcher | Profile reloads with new child's data |
| Tap "Add child" in switcher | Settings screen (child creation) |
| Tap "Go to Accounts Center" in switcher | Settings/account screen |
| Tap parent avatar (top right) | Settings screen |
| Tap weight or height | Measurement history view |
| Tap a photo | Full-screen photo view |
| Tap "See all" photos | Full photo gallery |
| Tap another tab | Navigates to that tab |

---

## Data read by this screen

- Active child (name, photo, DOB, country of residence, gender, grade level)
- Weight history (all entries with values and dates)
- Height history (all entries with values and dates)
- Family measurement unit preference (metric or imperial)
- App-tracked activities for this child (name, session count, last session date)
- External activities for this child (name, schedule, location, notes)
- All photos from sessions for this child
- List of all children in family (for switcher)
- Parent photo or initials (for avatar)

**Data written by this screen:** None — Profile is entirely read-only.

---

## Edit sub-screens (accessed from Settings → Child section)

The following screens edit the active child's data displayed on the Profile tab. They are accessed from the Settings screen, not from the Profile tab itself.

### Edit Profile form (modal)

Opens when the parent taps "Edit profile" in Settings → Child section.

**Fields:**
- Photo (circular, tappable to change via system photo picker)
- Name (text field, required, max 50 characters)
- Date of birth (date picker)
- Country of residence (picker or text field)
- Gender (Male / Female / Prefer not to say)
- Grade level (text field, e.g., "4th grade")
- School calendar (picker: Panamanian, US, Custom — with start/end month fields for Custom). Stored but not displayed on Profile tab. Used internally for grade level update prompts.

**Behavior:**
- Save button — disabled until a change is made
- Cancel button (top left) or swipe down to dismiss without saving
- On save → toast: "Changes saved." Profile tab updates on next view.
- Inline validation: name required — "This field is required." Name too long — "Name must be under 50 characters."

**Edge cases:**
| Edge case | Expected behavior |
|---|---|
| All fields empty except name | Valid — only name is required |
| Name cleared | Save button disabled. Inline error: "This field is required." |
| Photo too large | Inline error: "Photo is too large. Please choose a smaller image." |
| Network unavailable on save | Changes saved locally, synced when connection restored. Toast: "Changes saved offline." |

---

### Measurements screen (stack push)

Opens when the parent taps "Measurements" in Settings → Child section.

**What the screen shows:**
- Two sections: Weight and Height
- Each section shows a list of entries sorted by most recent first
- Each entry shows: value + date (e.g., "68 lbs — Mar 15, 2026")
- Units display based on family measurement preference (metric or imperial)
- "Add entry" button per section

**Adding an entry:**
- Tapping "Add entry" opens a bottom sheet with:
  - Value field (numeric input, required)
  - Unit label (read-only, based on family preference)
  - Date picker (defaults to today)
  - "Save" button
- On save → entry added to list, sorted by date. Toast: "Entry saved."

**Editing an entry:**
- Tapping an existing entry opens the same bottom sheet, pre-filled with current values
- On save → entry updated. Toast: "Entry saved."

**Deleting an entry:**
- Swipe left on an entry to reveal delete option
- Native iOS alert: "Delete this measurement? This cannot be undone."
- On confirmation → entry removed from list

**Edge cases:**
| Edge case | Expected behavior |
|---|---|
| No entries for weight or height | Section shows: "No entries yet." with "Add entry" button |
| Value entered as zero | Allowed — some measurements can be zero |
| Value entered as negative | Not allowed — inline error: "Value must be a positive number." |
| Duplicate date for same measurement type | Allowed — parent may record multiple entries on the same day |
| Network unavailable | Changes saved locally, synced when connection restored |

---

### External Activities screen (stack push)

Opens when the parent taps "External activities" in Settings → Child section.

**What the screen shows:**
- List of external (non-tracked) activities for the active child
- Each row shows: activity name + optional details (schedule, location, notes)
- "Add activity" button at the bottom

**Adding an activity:**
- Tapping "Add activity" opens a modal with:
  - Name (text field, required, max 50 characters)
  - Schedule (text field, optional — e.g., "Tuesdays and Thursdays 3–4 PM")
  - Location (text field, optional — e.g., "School auditorium")
  - Notes (text field, optional, no character limit)
  - "Save" button — disabled until name is filled
  - Cancel button or swipe down to dismiss

**Editing an activity:**
- Tapping an existing activity opens the same modal, pre-filled with current values
- On save → activity updated. Toast: "Changes saved."

**Deleting an activity:**
- Swipe left on an activity to reveal delete option
- Native iOS alert: "Delete this activity? This cannot be undone."
- On confirmation → activity removed from list

**Edge cases:**
| Edge case | Expected behavior |
|---|---|
| No external activities | Screen shows: "No external activities yet. Add activities your child does outside the app." with "Add activity" button |
| Name left empty | Save button disabled. Inline error: "This field is required." |
| Duplicate activity name | Allowed — two activities can have the same name |
| Network unavailable | Changes saved locally, synced when connection restored |

---

## Acceptance criteria

**Child header**
- [ ] Child's name and photo are displayed prominently at the top
- [ ] If no photo is set, a circular placeholder with the child's initials is shown
- [ ] Tapping the name or photo opens the child switcher bottom sheet

**Basic info**
- [ ] Age is calculated from DOB and displayed as years (e.g., "9 years old")
- [ ] Country of residence, gender, and grade level are displayed
- [ ] Fields with no data show "Not recorded"

**Measurements**
- [ ] Most recent weight and height are shown with the date they were recorded
- [ ] Units match the family-level preference (metric or imperial)
- [ ] Tapping weight or height opens a history view with all recorded measurements
- [ ] If no measurements exist, "Not recorded" is shown and tapping opens an empty history with a prompt

**Activities**
- [ ] App-tracked activities appear automatically with session count and last session date
- [ ] External activities appear with name and optional fields (schedule, location, notes)
- [ ] Both types are visually distinguished in the same list
- [ ] Activity list is not tappable — read-only
- [ ] If no activities exist, "No activities yet." is shown

**Photos**
- [ ] Photos from all sessions for the active child are displayed in a grid
- [ ] Tapping a photo opens it full-screen
- [ ] If more than 6 photos, "See all" link is shown to open the full gallery
- [ ] If no photos exist, empty state message is shown

**Child switcher**
- [ ] Bottom sheet opens when child name or photo is tapped
- [ ] All children in the family are listed with photo/initials, name, and age
- [ ] Active child has a checkmark
- [ ] Tapping a different child dismisses the sheet and reloads Profile with the new child's data
- [ ] "Add child" option navigates to Settings
- [ ] "Go to Accounts Center" button navigates to the parent's account screen
- [ ] Swiping down dismisses the sheet without switching
- [ ] Child switching is blocked if a session is in progress

**Parent avatar**
- [ ] Parent avatar or initials displayed in top right corner of every screen
- [ ] Tapping navigates to Settings screen

**Edit Profile form**
- [ ] Modal opens from Settings → Child section → Edit profile
- [ ] All fields displayed: photo, name, DOB, country, gender, grade level, school calendar
- [ ] Name is required — Save disabled if empty, inline error shown
- [ ] School calendar offers Panamanian, US, and Custom options
- [ ] Custom school calendar shows start/end month fields
- [ ] Save button disabled until a change is made
- [ ] Cancel or swipe down dismisses without saving
- [ ] On save, toast: "Changes saved."

**Measurements screen**
- [ ] Stack push from Settings → Child section → Measurements
- [ ] Weight and Height sections each show entries sorted by most recent first
- [ ] Units match family-level preference (metric or imperial)
- [ ] "Add entry" opens bottom sheet with value, unit label, and date picker
- [ ] Tapping an existing entry opens bottom sheet pre-filled for editing
- [ ] Swipe left to delete with native iOS alert confirmation
- [ ] Empty sections show "No entries yet." with "Add entry" button

**External Activities screen**
- [ ] Stack push from Settings → Child section → External activities
- [ ] Activities listed with name and optional fields (schedule, location, notes)
- [ ] "Add activity" opens modal with name (required), schedule, location, notes
- [ ] Tapping an existing activity opens modal pre-filled for editing
- [ ] Swipe left to delete with native iOS alert confirmation
- [ ] Empty state shown when no external activities exist
- [ ] Name is required — Save disabled if empty

**States**
- [ ] Skeleton with shimmer is shown while data loads
- [ ] Offline banner appears when device has no connection
- [ ] Offline banner disappears when connection is restored
- [ ] Error state shows "Something went wrong. Please try again." with retry button
- [ ] Switching children scrolls to top and reloads all sections

---

## Open questions

- [ ] Should the measurement history view show a simple chart/graph of values over time, or just a list of entries?
- [ ] Should the photo gallery support filtering by activity (e.g., show only baseball photos)?
- [ ] What context should app-tracked activities show — session count + last session date, or something else (e.g., level, streak)?
- [ ] Should external activities have a category or icon, or just a name with optional fields?
- [ ] How many photos should be visible before "See all" — 6, 9, or another number?
- [ ] Should the parent avatar be visible on modal screens (e.g., session logging), or only on tab screens?

---

## Mockups

[Link to Figma file — to be added after design phase]
