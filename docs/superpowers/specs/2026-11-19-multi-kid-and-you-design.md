# Multi-kid navigation, Kids tab, and You screen — design

**Status:** waiting for Ivan's review
**Date:** 2026-11-19
**Mockups:**
- Clickable flow (1 / 3 / 30 kids): https://claude.ai/artifact/WoPW8AgiW6mN4M7Wpf3caW
- Where every Settings option goes, before and after: https://claude.ai/artifact/MZ4hd1CdVjE3u5JTM9rGG8

## 1. The problem

1. **Seeing several kids is tedious.** Home shows one kid at a time. To see another kid you open the Profile tab, open the kid switcher, pick the kid, and go back to Home.
2. **"Profile" vs. your own profile is confusing.** The Profile tab is the kid's profile, but the word doesn't say whose. The parent photo (top right) opens "Settings", which mixes three things: the kid again (Edit Profile, Measurements, Activities), the parent (two levels deep, behind "Accounts Center"), and app settings.

## 2. The rules, in one place

| Kids in the account | Top of Activity, Stats, Kids | Home |
|---|---|---|
| 1 | Nothing. Same as today. | The kid's page, same as today. |
| 2 to 6 | A row of names. Tap a name to switch. | Opens on **All**: every kid at once. Starts as **Cards**. |
| 7 or more | The current kid's name with an arrow. Tap it to open a searchable list. | Opens on **All**. Starts as **List**, with search. |

- **One kid at a time outside Home.** Activity, Stats and Kids always show one kid. The kid picked anywhere is the kid on every tab.
- **Only Home has All.**
- **The cutoff is 7 kids.** It's a guess, kept as one constant in the code so it's easy to change.
- **Cards or List** is a switch on Home. It only changes Home, and the app remembers it. Until someone uses it, Home follows the cutoff.
- **The tab is your kids; your photo is you.** The Profile tab becomes **Kids** (everything about a kid). The photo at the top right opens **You** (your account, the other adults, app settings).
- **A running session blocks switching kids,** same as today ("Finish it before switching children").

## 3. Home

### 3.1 With 1 kid
No change from today: Home is the kid's page.

### 3.2 All (2+ kids)
- The app opens on **All**. Which kid is picked is still remembered for the other tabs.
- Above the kids: a line reading "Last 7 days" (2–6 kids) or "All N kids" (7+), with a **Cards | List** switch at its right end. The switch only shows on All.
- **Card** (one per kid): photo, name, the kid's activity names, a "last practiced" label (Today / Yesterday / N days ago), the last 7 days as day rings, and "N of 7 days practiced".
- **List row** (one per kid): photo, name, activity names, 7 small day rings, a short last-practiced label (Today, 2d…).
- The last-practiced label turns to the warning color at 3 or more days, and for a kid who has never practiced.
- **Order, 2–6 kids:** the order the kids were added (same as today's switcher).
- **Order, 7+ kids:** a search box on top, then two groups:
  1. "Not practiced in 3+ days · N": longest gap first. Kids who never practiced go at the top of this group.
  2. "Practiced recently · N", A to Z.
- No results: "No kids match "<text>"."

### 3.3 One kid, from Home
- Tapping a card or row picks that kid (with the session check) and shows that kid's page: today's Home content (calendar, coins, level, recent sessions, accolades, rewards).
- **2–6 kids:** the row of names stays at the top, with **All** as its first item.
- **7+ kids:** a "‹ All kids" link at the top left instead of the row.
- Tapping the Home tab while already on Home goes back to All. (See §8: this depends on NativeTabs exposing a re-tap event. If it doesn't, All and "‹ All kids" are the ways back.)

### 3.4 Header title
- **1 kid:** the kid's name, as today.
- **2+ kids:** the tab's name ("Home", "Activity", "Stats", "Kids"). The kid is already shown by the row of names or the name with an arrow.

## 4. The kid switcher on Activity, Stats and Kids

- **2–6 kids:** a row of names under the header. Each name has the kid's photo. The picked kid is highlighted. If the names don't fit, the row scrolls sideways. There is no All.
- **7+ kids:** one button with the current kid's photo, name and a down arrow. It opens a sheet titled "Choose a kid", with a search box and every kid A to Z. Each row shows the kid's activities and last-practiced label, and a checkmark on the current kid. Tapping a kid picks them and closes the sheet.
- The old switcher on the Profile tab (tap the kid's header) goes away.

## 5. The Kids tab (was Profile)

Everything about the picked kid, and nothing else.

1. **Kid header:** photo, name, "N years old · born <date>", and an **Edit** button (opens today's Edit Profile: name, birthday, photo, etc.).
2. **Basic info:** birthday, gender, country, grade (today's Basic Info block).
3. **Activities:** each of the kid's activities with its color dot and drill count. Tapping opens the activity, which is today's activity detail with its drills. A **New activity** row at the end opens today's create-activity screen.
4. **More about <name>:** Measurements, External activities, Photos. Each opens today's screen.
5. **Add a kid** (opens today's Add Child screen; the label changes to "Add a kid").

The tab icon changes from one person to two people.

## 6. The You screen (opened from your photo)

It replaces both today's Settings screen and Accounts Center. Title: **You**. It is about you and the app only, with nothing about the kids.

1. **Header:** your photo, name, email, and your ID (e.g. BR-4821).
2. **Your account:** Photo, Name, Email, Password. Each opens today's editor from Accounts Center.
3. **People with access:** every adult in the family with their role (Admin, Co-admin, Member). "(you)" marks your own row, which can't be tapped. Tapping someone else opens today's member detail screen. **Invite someone** shows only for Admin and Co-admin, as today.
4. **App:** Units (Metric | Imperial, a two-option switch), Help, Privacy Policy, About.
5. **Log out**
6. **Delete account** (today's flow, with its warning)

### Where today's options went

| Today | After |
|---|---|
| Settings → "Child" card: activity bubbles, Edit Profile, Measurements, External Activities | Kids tab |
| Settings → "You" card: Accounts Center | You (Accounts Center is no longer a separate screen) |
| Settings → App: imperial units toggle, Help, Privacy Policy, About, Log out | You |
| Accounts Center → Your profile: photo, change password, ID | You |
| Accounts Center → Children list, Add child | Kids tab (the row of names, plus Add a kid) |
| Accounts Center → Family members, Invite member | You → People with access |
| Accounts Center → Sign in with Apple / Google ("Coming soon") | **Removed.** They did nothing yet. |
| Accounts Center → Delete my account | You |

## 7. How it's built

Follows the project rules: Zustand only for client state, local SQLite as the source of truth, features don't import each other, route files stay thin.

### 7.1 Shared pieces (`src/shared/`)
- **Kid list:** a shared read of the family's kids from local SQLite (id, name, photo, birth date, created order). It lives in shared code because Home, Activity, Stats and Kids all need it, and features can't import each other.
- **`KidSwitcher` component:** takes the kid list, the picked kid and an optional "All". It draws nothing for 1 kid, the row for 2–6, and the name-with-arrow plus sheet for 7+. Switching goes through the existing `useChildSwitchGuard`.
- **Cutoff:** one constant, `KID_LIST_CUTOFF = 7`, and one helper that turns a kid count into `'single' | 'row' | 'picker'`.

### 7.2 State
- **Picked kid:** unchanged, `active-child.store` (saved on the device).
- **Home showing All or one kid:** a new field in a Zustand store, **not** saved. The app always opens on All.
- **Cards or List:** a new field in `ui-preferences.store`, saved on the device. `null` means "follow the cutoff".

### 7.3 Home data
- A new `home-dashboard` repository function reads, for every kid in the family in one query: completed sessions in the last 7 days by day and activity, the date of the last completed session, and the kid's activity names. One TanStack query hook wraps it, following the existing `useDashboardQuery` pattern.
- It refreshes when a session is saved or deleted, the same way the dashboard and stats already do (see v121–v124).
- The one-kid page keeps today's `getDashboardData`.

### 7.4 Routes
- `app/(tabs)/profile.tsx` → `app/(tabs)/kids.tsx`: label "Kids", icon two people.
- The parent photo still opens `/(settings)/menu`, which now shows the You screen. It is owned by the `accounts-center` feature.
- `/(settings)/accounts-center/index` is removed. Member detail stays.
- `SettingsScreen` and `ChildSwitcherSheet` in `profile` are deleted.

### 7.5 Edge cases
- **Picked kid is removed:** pick the first remaining kid. If none remain, follow today's no-kid behavior.
- **Kid count crosses the cutoff** (adding the 2nd or 7th kid): the layout follows on the next render. A saved Cards/List choice is kept.
- **Session running:** every switch path (row, sheet, Home card, Home "All") goes through the guard. Going to All doesn't change the picked kid, so it's always allowed.
- **Offline:** everything reads local SQLite, so it works without a connection.

### 7.6 Tests
- Unit: the count → layout helper (1, 2, 6, 7, 30). The 7+ grouping and sort (gaps, never practiced, A to Z). The last-practiced label.
- Component: `KidSwitcher` at 1, 3 and 30 kids. The Home All ↔ kid ↔ All flow. The You screen shows Invite only for Admin and Co-admin.
- Device check before release: 1, 3 and 8+ kids on a real phone, with a session running.

## 8. Risks and unknowns

- **Re-tapping the Home tab.** I'm not sure expo-router's `NativeTabs` reports a tap on the tab you're already on. If it doesn't, that shortcut is dropped. All and "‹ All kids" still work.
- **The cutoff of 7 is a guess.** It's one constant.
- **Performance at 30+ kids.** The All query reads 7 days of sessions for every kid. It should be fine on SQLite, but check with a 30-kid test family.
- **Help, Privacy Policy and About do nothing today.** They move as-is. Wiring them up is separate work.

## 9. Not in this change (later)

- **Activity manager in You:** create an activity once and use it for several kids. Today every activity belongs to one kid. This is a bigger change to how data is stored, so it's deferred to its own phase.
- **Role-based tab name** (Kids / Athletes / Students / Clients): deferred. "Kids" for everyone for now.
- **Sign in with Apple / Google.**

## 10. Docs to update when this is built

- `docs/feature-specs/home-dashboard.md`: All view, Cards/List, cutoff
- `docs/feature-specs/profile.md`: becomes the Kids tab
- `docs/feature-specs/accounts-center.md`: becomes the You screen; Children section and Apple/Google removed
- `docs/ux/navigation.md`: tabs, the kid switcher, the photo → You
- `docs/design-system/components/`: a spec for `KidSwitcher`
