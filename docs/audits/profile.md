# Profile Feature — Compliance Audit

**Audited:** 2026-04-21
**Spec:** `docs/feature-specs/profile.md`
**UX conventions:** `docs/ux-conventions.md`
**Auditor:** Claude (QA)

---

## 1. Summary

The Profile feature is **partially implemented** — roughly 40-45% of spec requirements are covered. The core read-only profile screen exists with child header, basic info, measurements summary, and a basic activities list. The child switcher bottom sheet, settings screen, measurements screen, and external activities screen are functional at a basic level. However, **major sections are entirely missing**: the Photos section (grid, full-screen view, gallery), the Edit Profile form (only a placeholder stub exists), the parent avatar, the offline banner, error states with retry, skeleton/shimmer loading, and session-in-progress blocking of child switching. Activities on the profile screen lack the spec's required context fields (session count, last session date, schedule/location/notes) and do not distinguish between app-tracked and external types. The measurements screen uses an inline form instead of the specified bottom sheet, and lacks editing of existing entries. The "Go to Accounts Center" button is missing from the child switcher. Overall verdict: **not shippable** — significant implementation work remains.

---

## 2. Gap table

| # | Spec requirement | Status | Severity | Gap description | File(s) |
|---|------------------|--------|----------|-----------------|---------|
| 1 | Photos section — grid of session photos | MISSING | CRITICAL | No photos section exists anywhere in ProfileScreen. No component, no query, no repository. | `src/features/profile/screens/ProfileScreen.tsx` |
| 2 | Photos — tap opens full-screen view | MISSING | CRITICAL | No full-screen photo viewer implemented. | — |
| 3 | Photos — "See all" link for 6+ photos, full gallery | MISSING | CRITICAL | No gallery screen or "See all" link. | — |
| 4 | Photos — empty state: "No photos yet. Photos taken during sessions will appear here." | MISSING | CRITICAL | No photos section at all. | — |
| 5 | Edit Profile form — full modal with all fields (photo, name, DOB, country, gender, grade, school calendar) | MISSING | CRITICAL | Route file is a placeholder stub: "Child profile editing coming soon". No form, no fields, no validation, no save logic. | `app/(settings)/child/edit-profile.tsx` |
| 6 | Edit Profile — school calendar picker (Panamanian, US, Custom with start/end month) | MISSING | CRITICAL | Not implemented. | `app/(settings)/child/edit-profile.tsx` |
| 7 | Edit Profile — save button disabled until change, cancel/swipe dismiss, toast on save, inline validation | MISSING | CRITICAL | Not implemented. | `app/(settings)/child/edit-profile.tsx` |
| 8 | Edit Profile — photo too large inline error | MISSING | CRITICAL | Not implemented. | — |
| 9 | Edit Profile — offline save with "Changes saved offline" toast | MISSING | CRITICAL | Not implemented. | — |
| 10 | Skeleton with shimmer loading state | MISSING | CRITICAL | Loading shows plain "Loading..." text instead of skeleton with shimmer animation. | `src/features/profile/screens/ProfileScreen.tsx:63-68` |
| 11 | Error state — "Something went wrong. Please try again." with retry button | MISSING | CRITICAL | No error state handling. `isError` from the query is not checked. | `src/features/profile/screens/ProfileScreen.tsx` |
| 12 | Offline banner — "You're offline. Changes will sync when your connection is restored." | MISSING | CRITICAL | No offline detection or banner anywhere. | `src/features/profile/screens/ProfileScreen.tsx` |
| 13 | Session-in-progress blocks child switching with native iOS alert | MISSING | CRITICAL | No check for active session before switching children. | `src/features/profile/components/ChildSwitcherSheet.tsx`, `src/features/profile/screens/ProfileScreen.tsx` |
| 14 | Parent avatar in top right corner of every screen, tap navigates to Settings | MISSING | CRITICAL | No parent avatar component anywhere in the profile feature or visible in the route files. | — |
| 15 | Activities section — app-tracked activities show session count + last session date | MISSING | MEDIUM | `useProfileQuery` only fetches `id`, `name`, `icon`, `category`. No session count or last session date. | `src/features/profile/queries/useProfileQuery.ts:23-28`, `src/features/profile/repositories/profile.repository.ts:73-81` |
| 16 | Activities section — external activities show name + optional fields (schedule, location, notes) | MISSING | MEDIUM | External activities are not included in the profile query at all. Only app-tracked activities are fetched. | `src/features/profile/queries/useProfileQuery.ts` |
| 17 | Activities section — both types visually distinguished in the same list | MISSING | MEDIUM | Only one type of activity is shown. No visual distinction between app-tracked and external. | `src/features/profile/screens/ProfileScreen.tsx:96-119` |
| 18 | Activities section — list is not tappable (read-only) | PARTIAL | LOW | The activity rows themselves are not tappable (PASS), but the section header has a "See all" link navigating to `/(settings)/activities` which the spec does not mention. | `src/features/profile/screens/ProfileScreen.tsx:100-106` |
| 19 | Activities section — no activities: "No activities yet." | PARTIAL | MEDIUM | When `profile.activities.length === 0`, the entire section is hidden (renders `null`). Spec requires showing "No activities yet." | `src/features/profile/screens/ProfileScreen.tsx:96-119` |
| 20 | Child switcher — "Go to Accounts Center" button | MISSING | MEDIUM | The child switcher bottom sheet has no "Go to Accounts Center" button. Only shows children list and "Add child". | `src/features/profile/components/ChildSwitcherSheet.tsx` |
| 21 | Child switcher — selecting already-active child dismisses without reload | PARTIAL | LOW | The sheet closes on any selection, but `setActiveChild` is called even for the already-active child. No early return/guard. | `src/features/profile/screens/ProfileScreen.tsx:41-48` |
| 22 | Child switched — screen scrolls to top and reloads all sections | MISSING | MEDIUM | No `scrollTo(0)` logic on child switch. No ref on ScrollView to control scroll position. | `src/features/profile/screens/ProfileScreen.tsx` |
| 23 | Child switcher — "Add child" navigates to Settings (where child creation lives) | PARTIAL | LOW | `handleAddChild` callback is empty — no navigation. | `src/features/profile/screens/ProfileScreen.tsx:50-52` |
| 24 | Measurements summary — tapping weight or height opens history view | MISSING | MEDIUM | `MeasurementsSummary` component is not tappable. No `Pressable` wrapper, no navigation to measurements screen. | `src/features/profile/components/MeasurementsSummary.tsx` |
| 25 | Measurements summary — if no measurements, tapping opens empty history with prompt | MISSING | MEDIUM | Not tappable at all. | `src/features/profile/components/MeasurementsSummary.tsx` |
| 26 | Measurements screen — "Add entry" opens bottom sheet (not inline form) | PARTIAL | MEDIUM | Uses an inline form that expands in place. Spec requires a bottom sheet with value, unit label (read-only), and date picker. | `src/features/profile/screens/MeasurementsScreen.tsx:136-177` |
| 27 | Measurements screen — date picker (defaults to today) | PARTIAL | MEDIUM | Uses a plain text `Input` for date (`YYYY-MM-DD` placeholder) instead of a date picker component. | `src/features/profile/screens/MeasurementsScreen.tsx:145-149` |
| 28 | Measurements screen — unit label is read-only in the form | PARTIAL | LOW | The unit is shown in the input label `Value (lbs)` but not as a separate read-only field. | `src/features/profile/screens/MeasurementsScreen.tsx:138-144` |
| 29 | Measurements screen — tapping existing entry opens pre-filled bottom sheet for editing | MISSING | MEDIUM | No edit functionality. Tapping an entry does nothing — only a delete button is shown. | `src/features/profile/screens/MeasurementsScreen.tsx:96-113` |
| 30 | Measurements screen — swipe left to delete | MISSING | MEDIUM | Delete is a visible button, not a swipe-to-reveal action. | `src/features/profile/screens/MeasurementsScreen.tsx:104-109` |
| 31 | Measurements screen — delete alert text: "Delete this measurement? This cannot be undone." | PARTIAL | LOW | Alert message is "Are you sure you want to delete this measurement?" — different from spec's exact text. | `src/features/profile/screens/MeasurementsScreen.tsx:80-81` |
| 32 | Measurements screen — toast "Entry saved." on add | MISSING | LOW | No toast shown after saving. | `src/features/profile/screens/MeasurementsScreen.tsx:62-75` |
| 33 | Measurements screen — negative value validation: "Value must be a positive number." | PARTIAL | LOW | Code rejects `numericValue <= 0` silently (returns early). No inline error message displayed. | `src/features/profile/screens/MeasurementsScreen.tsx:64` |
| 34 | Measurements screen — empty state text: "No entries yet." | PARTIAL | LOW | Empty state says "No [weight/height] entries" / "Add your first [weight/height] measurement to start tracking." — close but not matching spec text exactly. | `src/features/profile/screens/MeasurementsScreen.tsx:185-188` |
| 35 | External activities screen — "Add activity" opens a modal (not inline form) | PARTIAL | MEDIUM | Uses an inline form instead of a modal. | `src/features/profile/screens/ExternalActivitiesScreen.tsx:105-155` |
| 36 | External activities screen — name max 50 characters validation | MISSING | LOW | No max-length validation on name input. | `src/features/profile/screens/ExternalActivitiesScreen.tsx:107-112` |
| 37 | External activities screen — tapping existing activity opens pre-filled modal for editing | MISSING | MEDIUM | No edit functionality. Activity cards show details and delete only. | `src/features/profile/screens/ExternalActivitiesScreen.tsx:77-101` |
| 38 | External activities screen — swipe left to delete | MISSING | MEDIUM | Delete is a visible button, not a swipe-to-reveal action. | `src/features/profile/screens/ExternalActivitiesScreen.tsx:82-88` |
| 39 | External activities screen — delete alert: "Delete this activity? This cannot be undone." | PARTIAL | LOW | Alert message is `Delete "${name}"?` — different from spec. | `src/features/profile/screens/ExternalActivitiesScreen.tsx:62-63` |
| 40 | External activities screen — toast "Changes saved." on edit | MISSING | LOW | No toast on add or edit. | `src/features/profile/screens/ExternalActivitiesScreen.tsx` |
| 41 | External activities screen — empty state: "No external activities yet. Add activities your child does outside the app." | PARTIAL | LOW | Close but text differs: "Track activities not managed in Brinca, like swimming classes or art school." | `src/features/profile/screens/ExternalActivitiesScreen.tsx:163-166` |
| 42 | External activities screen — save button disabled until name filled + inline error "This field is required." | PARTIAL | LOW | Button is disabled when name empty (PASS), but no inline error text shown. | `src/features/profile/screens/ExternalActivitiesScreen.tsx:143` |
| 43 | Entry points — tapping active child header on Home dashboard opens Profile | MISSING | MEDIUM | Not verifiable in profile feature code. No cross-feature integration visible. | — |
| 44 | Entry points — child switching reloads entire Profile tab | PARTIAL | LOW | Profile query depends on `childId` from store, so data refetches. But no scroll-to-top. | `src/features/profile/screens/ProfileScreen.tsx` |
| 45 | Measurements screen — Weight and Height as two separate sections on one screen | PARTIAL | LOW | Implemented as tabs (toggle between weight/height) instead of two visible sections on the same screen. | `src/features/profile/screens/MeasurementsScreen.tsx:117-134` |
| 46 | Child header — tapping name OR photo opens switcher | PASS | — | Entire header is wrapped in a Pressable. | `src/features/profile/components/ChildHeader.tsx:12-26` |
| 47 | Child header — initials placeholder when no photo | PASS | — | Delegated to `Avatar` shared component which handles initials. | `src/features/profile/components/ChildHeader.tsx:18` |
| 48 | Basic info — age calculated from DOB as "X years old" | PASS | — | Correctly implemented. | `src/features/profile/components/BasicInfo.tsx:13-23` |
| 49 | Basic info — fields with no data show "Not recorded" | PASS | — | `InfoRow` renders "Not recorded" for null values. | `src/features/profile/components/BasicInfo.tsx:39-48` |
| 50 | Basic info — country, gender, grade level displayed | PASS | — | All four fields rendered. | `src/features/profile/components/BasicInfo.tsx:50-58` |
| 51 | Measurements summary — most recent weight/height with date | PASS | — | Latest values displayed with date. | `src/features/profile/components/MeasurementsSummary.tsx:50-71` |
| 52 | Measurements summary — units match family preference | PASS | — | `measurementUnit` from store used in formatting. | `src/features/profile/components/MeasurementsSummary.tsx:12-28` |
| 53 | Child switcher — drag handle visible | PASS | — | `handleIndicatorStyle` applied. | `src/features/profile/components/ChildSwitcherSheet.tsx:55` |
| 54 | Child switcher — children show photo/initials, name, age | PASS | — | Avatar, name, and age rendered. | `src/features/profile/components/ChildSwitcherSheet.tsx:61-88` |
| 55 | Child switcher — active child has checkmark | PASS | — | Checkmark rendered for active child. | `src/features/profile/components/ChildSwitcherSheet.tsx:85` |
| 56 | Child switcher — swipe down to dismiss | PASS | — | `enablePanDownToClose` set. | `src/features/profile/components/ChildSwitcherSheet.tsx:54` |
| 57 | Settings screen — grouped sections matching spec | PASS | — | Account, Activities, Child, App sections present. | `src/features/profile/screens/SettingsScreen.tsx:53-104` |
| 58 | Settings — log out with native iOS alert | PASS | — | Destructive alert with title, message, confirm. | `src/features/profile/screens/SettingsScreen.tsx:41-51` |
| 59 | Activities query — LIMIT 5 not in spec | EXTRA | LOW | Repository limits activities to 5 results. Spec says "list of all activities." | `src/features/profile/repositories/profile.repository.ts:78` |
| 60 | Activities section — "See all" link in header | EXTRA | LOW | Spec says activity list is read-only, not tappable. No "See all" link specified. | `src/features/profile/screens/ProfileScreen.tsx:100-106` |

---

## 3. UX conventions compliance

- **Navigation model:** PARTIAL — Stack navigation for settings sub-screens is correct. Bottom sheet for child switcher is correct. But the Edit Profile route should be a modal (slides up); it's currently a stub routed under `(settings)` as a stack push. The measurements and external activities forms use inline expansion instead of the specified bottom sheet / modal patterns.

- **Error states:** FAIL — No inline validation errors shown (measurements negative value, external activity name required). No error toast on failed operations. No "Something went wrong" screen-level error state. No toast confirmations ("Entry saved.", "Changes saved.").

- **Loading states:** FAIL — ProfileScreen shows plain "Loading..." text. Spec and UX conventions require skeleton with shimmer animation for screens loading lists/dashboards.

- **Empty states:** PARTIAL — External activities and measurements screens have empty state components, but text does not match spec exactly. The activities section on the Profile screen shows nothing (renders null) instead of the required "No activities yet." empty state. Photos section is entirely missing.

- **Destructive confirmations:** PARTIAL — Native alert is used for delete actions (measurements, external activities, log out), which is correct. However, the alert copy does not match spec exactly in several cases. The spec-required "Delete this measurement? This cannot be undone." and "Delete this activity? This cannot be undone." messages are not used verbatim.

---

## Recommended priority

1. Edit Profile form (CRITICAL — placeholder stub)
2. Photos section (CRITICAL — entirely missing)
3. Skeleton/shimmer loading (CRITICAL — UX convention violation)
4. Error state + offline banner (CRITICAL — no error handling)
5. Parent avatar (CRITICAL — missing from all screens)
6. Session-in-progress blocking (CRITICAL — data integrity risk)
7. Activities context fields + external activities in profile query (MEDIUM)
8. Measurements tappability, swipe-to-delete, edit existing entries (MEDIUM)
