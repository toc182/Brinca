# Feature spec — Home dashboard

**Screen name:** Home dashboard
**File:** `docs/feature-specs/home-dashboard.md`
**Last updated:** April 10, 2026
**Status:** Draft
**Related docs:** `docs/product-vision.md`, `docs/ux-conventions.md`, `docs/rewards-levels-accolades.md`

---

## Purpose

Home exists to give the user an at-a-glance overview of the active child's progress and motivate them to keep practicing. It is the first screen the user sees every time they open the app.

---

## Entry points

- Completing onboarding — lands on Home for the first time
- Tapping the Home tab from anywhere in the app
- Opening the app when already logged in — lands on Home
- Switching active child from the Profile tab — reloads Home with new child's data

---

## What the screen shows

Content is displayed top to bottom in this order:

### 1. Active child header
- Child's photo (circular) + name
- Tapping the header navigates to the Profile tab for child switching
- If no photo is set, show a circular placeholder with the child's initials

### 2. Level + badge
- Current level number (e.g. "Level 7")
- Visual badge that evolves at milestone levels (every 10 levels the badge upgrades visually)
- Progress bar showing progress toward next level (based on combination of sessions completed + currency earned)

### 3. Reward progress
- Shows the reward the child is closest to earning
- Progress bar with current currency balance vs. reward cost
- Example: "32 of 50 Coins — New baseball glove"
- Tappable — opens full rewards screen
- If no reward is configured: "No reward set. Add a reward to motivate practice." with "Add reward" button

### 4. Currency balance
- Current balance in the family's custom currency (default: "Coins")
- Example: "12 Coins"
- Always visible, even when balance is zero

### 5. Consistency
- Sessions this week (e.g. "3 sessions this week")
- Total sessions all time (e.g. "47 sessions total")
- These numbers always grow and never reset
- Current streak indicator (e.g. 🔥 5) shown near the active child header when streak ≥ 1. Hidden when streak is 0. Exact placement and icon style TBD in design pass. See `docs/rewards-levels-accolades.md` §6 for the streak mechanic.

### 6. Recent sessions
- Last 2 sessions logged, each showing:
  - Activity name
  - Date
  - Completion status (complete / incomplete)
- Tapping a session navigates to session detail
- "See all sessions" link navigates to Stats tab
- If no sessions logged yet: "No sessions yet. Start your first session to see your progress."

### 7. Accolades
- 3 most recently earned accolades shown as badges/icons
- "See all" link to full accolades screen
- If no accolades earned yet: shown after first session is completed

---

## Screen states

| State | Behavior |
|---|---|
| First time (just completed onboarding) | Child and activity exist but no sessions yet. All sections show empty states with clear CTAs. |
| Normal | Full data shown for active child. |
| Loading | Skeleton with shimmer animation while data loads. |
| Offline | Subtle offline banner at top of screen: "You're offline. Changes will sync when your connection is restored." Last cached data is shown. Banner disappears when connection is restored. |
| Error | "Something went wrong. Please try again." with retry button. |

---

## Edge cases

| Edge case | Expected behavior |
|---|---|
| No drills configured yet | Empty state below activity name: "No drills yet. Add your first drill to start practicing." with "Add drill" button |
| No sessions logged yet | Recent sessions section shows: "No sessions yet. Start your first session to see your progress." |
| No reward configured | Reward progress section shows: "No reward set. Add a reward to motivate practice." with "Add reward" button |
| No accolades earned yet | Accolades section appears after first session is completed |
| Currency balance is zero | Show "0 [currency name]" — never hide the balance |
| Child has no photo | Show circular placeholder with child's initials |
| Only one session logged | Show one session, no placeholders for missing sessions |
| No level reached yet | Show Level 1 badge with progress toward Level 2 |
| User has multiple children | All data shown is for active child only. Switching children reloads Home. |
| Network unavailable | Show last cached data with offline banner at top |

---

## Rewards system

### Currency
- Parent sets a custom currency name per family (default: "Coins")
- Currency is earned at the drill level — parent configures earning rules per drill
- Parent can give manual bonuses at any time, per drill or per session, for any reason

### Levels
- Numbered levels with no ceiling (Level 1, Level 2, Level 3...)
- Based on a combination of total sessions completed + total currency earned
- Badge evolves visually at milestone levels (every 10 levels)
- Always something to work toward — no maximum level

### Rewards
- Parent configures rewards the child is saving toward
- Each reward has a name and a currency cost
- Child sees progress toward the closest reward on Home
- Full rewards list accessible by tapping the reward progress section

### Accolades
- One-time achievements unlocked by milestones (e.g. "First session", "First Coin earned", "10 sessions logged")
- Permanent and collectible
- 3 most recently earned shown on Home, full list accessible via "See all"

---

## Navigation and exit points

| Trigger | Destination |
|---|---|
| Tap active child header | Profile tab |
| Tap reward progress section | Rewards screen |
| Tap a recent session | Session detail screen |
| Tap "See all sessions" | Stats tab |
| Tap "See all" accolades | Accolades screen |
| Tap "Add drill" button | Activity configuration screen |
| Tap "Add reward" button | Rewards configuration screen |
| Tap Home tab | Stays on Home, scrolls to top |

---

## Data read by this screen

- Active child (name, photo, DOB, gender)
- Current level + progress toward next level
- Currency balance
- Closest reward + progress toward it
- Sessions this week count
- Total sessions count
- Last 2 sessions (activity name, date, completion status)
- 3 most recently earned accolades

---

## Acceptance criteria

**Active child header**
- [ ] Child's name and photo are displayed at the top of the screen
- [ ] If no photo is set, a circular placeholder with the child's initials is shown
- [ ] Tapping the header navigates to the Profile tab

**Level + badge**
- [ ] Current level number is displayed
- [ ] Progress bar shows progress toward the next level
- [ ] Badge updates visually at every 10th level milestone

**Reward progress**
- [ ] The reward the child is closest to earning is shown with a progress bar
- [ ] Tapping the section navigates to the full rewards screen
- [ ] If no reward is configured, an empty state with "Add reward" button is shown

**Currency balance**
- [ ] Current balance is always visible, even when zero
- [ ] Balance displays the family's custom currency name

**Consistency**
- [ ] Sessions this week count is accurate and updates after each new session
- [ ] Total sessions count is accurate and always increases

**Recent sessions**
- [ ] Last 2 sessions are shown with activity name, date, and completion status
- [ ] Tapping a session navigates to session detail
- [ ] "See all sessions" link navigates to Stats tab
- [ ] If no sessions exist, empty state is shown

**Accolades**
- [ ] 3 most recently earned accolades are shown as badges
- [ ] "See all" link navigates to full accolades screen
- [ ] Accolades section appears after the first session is completed

**States**
- [ ] Skeleton with shimmer is shown while data loads
- [ ] Offline banner appears at top when device has no connection
- [ ] Offline banner disappears when connection is restored
- [ ] Error state shows "Something went wrong. Please try again." with retry button

**Child switching**
- [ ] Switching children in the Profile tab reloads Home with the new child's data
- [ ] All sections update to reflect the newly selected child

---

## Open questions

- [ ] Should Home show a "Start session" shortcut button, or is the Activity tab sufficient for starting sessions?

> Level thresholds, accolade catalog, bonus vs. earned distinction, and currency history model are defined in `docs/rewards-levels-accolades.md`.

---

## Mockups

[Link to Figma file — to be added after design phase]
