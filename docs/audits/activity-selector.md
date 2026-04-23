# Compliance audit — Activity Selector

**Feature spec:** `docs/feature-specs/activity.md`
**UX conventions:** `docs/ux-conventions.md`
**Audit date:** 2026-04-21
**Auditor:** Claude (QA compliance audit)
**Verdict:** Not spec-complete

---

## 1. Summary

The Activity Selector implementation is **substantially non-compliant** with its spec. The core interaction model is wrong: the spec requires a bottom sheet that opens automatically when the Activity tab is tapped, but the implementation shows a centered screen with a "Start session" button that opens a `Modal`. Key features are entirely missing: mini player bar, skeleton loading state, drag handle, "Go to Settings" CTA in the empty state, tab icon color change for active sessions, and child-switching prevention. The `ActivityPickerSheet` component exists but is unused. The implementation covers the basic happy path (pick an activity, start a session, resume) at a rudimentary level, but deviates from spec text, layout, and behavior on nearly every point.

---

## 2. Source files audited

- `src/features/activity-selector/screens/ActivityScreen.tsx`
- `src/features/activity-selector/components/ActivityPickerSheet.tsx`
- `app/(tabs)/activity.tsx`

---

## 3. Gap table

| # | Spec requirement | Status | Severity | Gap description | File(s) |
|---|------------------|--------|----------|-----------------|---------|
| 1 | Tapping Activity tab (no session) opens a **bottom sheet** | MISSING | CRITICAL | Implementation uses a `Modal` with `animationType="slide"` triggered by a "Start session" button — not a bottom sheet, and not automatic on tab entry. | `ActivityScreen.tsx:67-90` |
| 2 | Bottom sheet opens **immediately** when tab is tapped | MISSING | CRITICAL | The sheet only opens after pressing a "Start session" button. Spec says it opens immediately with no intermediate screen. | `ActivityScreen.tsx:62-63` |
| 3 | Bottom sheet has a **drag handle** at top | MISSING | MEDIUM | No drag handle element rendered. | `ActivityScreen.tsx:74` |
| 4 | Heading: **"Select an activity"** | PARTIAL | LOW | Code says `"Choose an activity"` instead of `"Select an activity"`. | `ActivityScreen.tsx:75` |
| 5 | List shows activities for the **active child** (name only) | PASS | — | Activities are fetched via `useActivitiesQuery(childId)` and only `item.name` is rendered. | — |
| 6 | Swipe down to dismiss bottom sheet | PARTIAL | MEDIUM | Modal uses `animationType="slide"` but dismissal is via overlay press, not swipe-down gesture on the sheet itself. | `ActivityScreen.tsx:73` |
| 7 | Tapping an activity dismisses sheet and opens full session screen | PASS | — | `handleSelectActivity` calls `setShowPicker(false)` then navigates to `/(modals)/session`. | `ActivityScreen.tsx:23-35` |
| 8 | Empty state: **"No activities yet. Add your first activity in Settings."** with **"Go to Settings"** button | PARTIAL | CRITICAL | Empty state shows `"No activities"` / `"Create an activity first, then come back to start a session."` — text differs from spec and there is no "Go to Settings" button. | `ActivityScreen.tsx:56-59` |
| 9 | Only one activity configured → bottom sheet still appears | PASS | — | No special-casing for single activity; the list renders regardless of count. | — |
| 10 | **Mini player bar** above tab bar when session minimized | MISSING | CRITICAL | No mini player bar component exists anywhere in the feature directory. | — |
| 11 | Mini player shows **activity name + "— in progress"** and **"Resume" button** | MISSING | CRITICAL | No mini player bar implemented. | — |
| 12 | Mini player **persists across all tabs** | MISSING | CRITICAL | No mini player bar implemented. | — |
| 13 | Tapping mini player bar → full session screen | MISSING | CRITICAL | No mini player bar implemented. | — |
| 14 | Mini player disappears when session finished or abandoned | MISSING | CRITICAL | No mini player bar implemented. | — |
| 15 | Activity **tab icon changes color** when session is in progress | MISSING | MEDIUM | No tab icon color logic exists in any file. | — |
| 16 | Tapping Activity tab while session in progress → resumes full session screen (not selector) | PARTIAL | MEDIUM | The `ActivityScreen` shows a resume UI inline, but it renders a centered screen with timer and button instead of navigating directly to the full session screen. Spec says the tab tap should go straight to the session. | `ActivityScreen.tsx:38-51` |
| 17 | Only one session active at a time (cannot start new session while one exists) | PASS | — | The `isActive` check at line 38 prevents showing the selector when a session is active. | `ActivityScreen.tsx:38` |
| 18 | **Child switching blocked** during active session — native iOS alert | MISSING | CRITICAL | No child-switching guard exists in this feature. | — |
| 19 | **Loading state**: skeleton with shimmer while activity list loads | MISSING | MEDIUM | `useActivitiesQuery` result has no loading/pending check; no skeleton rendered. | `ActivityScreen.tsx:18` |
| 20 | App closed mid-session → session preserved, mini player reappears on next launch | MISSING | CRITICAL | No persistence logic for session state across app restarts (at least not in this feature). | — |
| 21 | Network unavailable → session starts normally (offline-first) | MISSING | MEDIUM | No offline handling visible; `startSession.mutate` has no offline fallback. | `ActivityScreen.tsx:26` |
| 22 | Navigation: "Go to Settings" in empty state → Settings screen | MISSING | CRITICAL | No "Go to Settings" button in empty state. | `ActivityScreen.tsx:56-59` |
| 23 | Navigation: session finished → Home screen | MISSING | LOW | No finish-session logic in this feature (likely in session-logging, but not wired here). | — |
| 24 | Scrim overlay uses `scrim` token from theme | PARTIAL | LOW | Overlay uses hardcoded `rgba(0,0,0,0.4)` instead of the `scrim` token (`#0F0B1F` @ 40%). | `ActivityScreen.tsx:104` |
| 25 | `ActivityPickerSheet` component is used | EXTRA | LOW | Component exists at `ActivityPickerSheet.tsx` but is **never imported or used** by `ActivityScreen`. The screen has its own inline FlatList instead. | `ActivityPickerSheet.tsx` |
| 26 | Feature isolation: no cross-feature imports | PARTIAL | MEDIUM | `ActivityScreen` imports from `session-logging` (hooks + mutations) and `activity-builder` (queries). Per CLAUDE.md: "Features are islands: no feature imports another feature's components, hooks, or repositories." | `ActivityScreen.tsx:9-12` |

---

## 4. UX conventions compliance

| Convention | Status | Note |
|---|---|---|
| **Navigation model** | FAIL | Spec calls for a bottom sheet (per UX conventions §1 "Bottom sheets"). Implementation uses a `Modal` — which UX conventions reserve for "creating or editing something," not quick selections. |
| **Error states** | FAIL | No error handling for `startSession.mutate` failure, no toast on failure, no network-unavailable handling. |
| **Loading states** | FAIL | No skeleton/shimmer for the activity list while loading. UX conventions §5 requires skeleton with shimmer for lists. |
| **Empty states** | PARTIAL | An empty state exists but text and CTA don't match spec or UX conventions §4 (should have icon + message + action button; current implementation has no icon and no action button). |
| **Destructive confirmations** | N/A | No destructive actions in this feature's current scope. |

---

## 5. Priority remediation order

1. Replace `Modal` with a proper bottom sheet that auto-opens on tab entry (gaps #1, #2, #3, #6)
2. Implement mini player bar as a global component above the tab bar (gaps #10–14)
3. Fix empty state text and add "Go to Settings" CTA (gaps #8, #22)
4. Add child-switching guard with native iOS alert (gap #18)
5. Add session persistence across app restarts (gap #20)
6. Add skeleton/shimmer loading state (gap #19)
7. Add tab icon color change for active session (gap #15)
8. Fix session-active behavior to navigate directly to session screen (gap #16)
9. Resolve cross-feature imports (gap #26)
10. Fix heading text, scrim token, wire up `ActivityPickerSheet` (gaps #4, #24, #25)
