# Compliance Audit — Stats

**Feature:** Stats
**Spec:** `docs/feature-specs/stats.md`
**Date:** 2026-04-21
**Auditor:** Claude (QA audit)

---

## 1. Summary

The Stats feature is at a **very early scaffold stage** — roughly **15–20% compliant** with the spec. The implementation provides a bare-bones summary card grid and a flat session list, plus a session detail screen with delete functionality. However, the core differentiating features of the spec are entirely absent: there is no time filter (Week/Month/Year/All Time), no period selector with comparison, no charts (cumulative line or bar), no activity filter modal, no tappable card-to-chart interaction, and no previous-period comparison values on summary cards. The session list lacks the required row format (icon, key stat, completion indicator). Loading, error, empty, and offline states are either missing or non-compliant. The session detail screen omits drill recorded values and photos. The feature is functional as a minimal prototype but does not meet the spec for any acceptance criteria section in full.

---

## 2. Gap table

| # | Spec requirement | Status | Severity | Gap description | File(s) |
|---|---|---|---|---|---|
| 1 | Time filter: segmented control Week / Month / Year / All Time | MISSING | CRITICAL | No time filter UI or logic exists. All data is shown unfiltered across all time with no period scoping. | `StatsScreen.tsx`, `stats.repository.ts` |
| 2 | Default view is Week showing the current week | MISSING | CRITICAL | No time filter exists; no default period logic. | `StatsScreen.tsx` |
| 3 | Period selector with dropdown to change period | MISSING | CRITICAL | No period selector UI or state. | `StatsScreen.tsx` |
| 4 | Comparison label showing previous period | MISSING | CRITICAL | No comparison label, no previous-period computation. | `StatsScreen.tsx` |
| 5 | All Time view: no period selector, no comparison label | MISSING | MEDIUM | Moot — no time filter exists at all. | `StatsScreen.tsx` |
| 6 | Switching time periods resets activity filter to "All Activities" | MISSING | MEDIUM | Neither time filter nor activity filter exist. | `StatsScreen.tsx` |
| 7 | Chart: cumulative line chart (top) | MISSING | CRITICAL | No chart component or charting library used. | `StatsScreen.tsx` |
| 8 | Chart: bar chart (bottom) | MISSING | CRITICAL | No chart component. | `StatsScreen.tsx` |
| 9 | Chart: current period in accent color, previous in gray | MISSING | CRITICAL | No chart exists. | `StatsScreen.tsx` |
| 10 | Chart updates when a different summary card is selected | MISSING | CRITICAL | No chart, no card tap interaction. | `StatsScreen.tsx` |
| 11 | X-axis labels adapt to selected time filter | MISSING | CRITICAL | No chart. | `StatsScreen.tsx` |
| 12 | All Time: one cumulative line from first session | MISSING | MEDIUM | No chart. | `StatsScreen.tsx` |
| 13 | No data: chart shows flat line | MISSING | MEDIUM | No chart. | `StatsScreen.tsx` |
| 14 | Summary cards: 2x2 grid with drills, sessions, duration, currency | PARTIAL | MEDIUM | Four cards exist but use `width: '48%'` instead of a proper 2x2 grid. Cards are not labeled per spec ("Drills completed", "Sessions logged", "Total duration", "Currency earned") — labels are abbreviated ("Sessions", "Drills", "Duration", "Earned"). | `StatsScreen.tsx:24-27` |
| 15 | Tapping a card updates the chart to show that metric | MISSING | CRITICAL | Cards are not tappable (`View`, not `Pressable`). No selected state. No chart to update. | `StatsScreen.tsx:54-61` |
| 16 | Each card shows current value, previous period value, comparison indicator (↑ ↓ =) | MISSING | CRITICAL | Cards show only current value. No previous period value, no comparison indicator. | `StatsScreen.tsx:54-61` |
| 17 | Cards show zeros when no data — structure always visible | PARTIAL | LOW | Cards default to 0 via `?? 0`, but this covers all-time only since no period filter exists. | `StatsScreen.tsx:24-27` |
| 18 | Activity filter button in header | MISSING | CRITICAL | No filter button, no header customization. | `StatsScreen.tsx` |
| 19 | Activity filter modal with "All Activities" + checkboxes + "Done" | MISSING | CRITICAL | No filter modal component. | `StatsScreen.tsx` |
| 20 | Filter updates chart, cards, session list | MISSING | CRITICAL | No filter logic. | `StatsScreen.tsx`, `stats.repository.ts` |
| 21 | Sessions sorted by most recent first | PASS | — | Repository query uses `ORDER BY started_at DESC`. | `stats.repository.ts:39` |
| 22 | Session row: activity icon | MISSING | MEDIUM | No activity icon rendered in session rows. | `StatsScreen.tsx:37-47` |
| 23 | Session row: key stat + activity name (e.g. "12 drills · Baseball") | MISSING | MEDIUM | Row shows only activity name — no key stat (drill count) or formatted "stat · name" pattern. | `StatsScreen.tsx:42` |
| 24 | Session row: completion indicator if incomplete | MISSING | MEDIUM | No completion indicator shown. | `StatsScreen.tsx:37-47` |
| 25 | Session row: chevron (right) | PARTIAL | LOW | A `›` text character is used instead of a Phosphor icon chevron. | `StatsScreen.tsx:45` |
| 26 | Session count shown above list (e.g. "5 sessions") | MISSING | MEDIUM | "History" label has no session count. | `StatsScreen.tsx:30` |
| 27 | "0 sessions" when no sessions — no empty state message | PARTIAL | MEDIUM | Shows "No sessions yet" text instead of "0 sessions" — spec says structure always visible with count, no empty state message. | `StatsScreen.tsx:48` |
| 28 | Tapping session opens session detail (stack navigation) | PASS | — | `router.push` navigates to `[sessionId]` route. Route file exists. | `StatsScreen.tsx:38`, `app/(tabs)/stats/[sessionId].tsx` |
| 29 | Session detail: session date, activity name, duration | PASS | — | All three shown. | `SessionDetailScreen.tsx:43-45` |
| 30 | Session detail: drills logged with recorded values | PARTIAL | MEDIUM | Drills listed with name and complete/incomplete status, but no recorded values shown (counter values, timer durations, checklist states). | `SessionDetailScreen.tsx:55-60`, `stats.repository.ts:61-63` |
| 31 | Session detail: drill-level notes and photos | PARTIAL | MEDIUM | Drill notes shown. No photos — no photo query or rendering. | `SessionDetailScreen.tsx:59` |
| 32 | Session detail: session-level notes and photos | PARTIAL | MEDIUM | Session notes shown. No photos — no photo query or rendering. | `SessionDetailScreen.tsx:47-51` |
| 33 | Delete triggers native iOS alert: "Delete this session? This cannot be undone." | PARTIAL | LOW | Uses `useDestructiveAlert` (correct pattern) but the message text diverges from spec. Spec: "Delete this session? This cannot be undone." Implementation title: "Delete session", message: "This will permanently delete this session and all its drill results. Currency earned will not be reversed." | `SessionDetailScreen.tsx:26-28` |
| 34 | After deletion, user returns to Stats, session list updates | PASS | — | `onSuccess` calls `router.back()` and invalidates query keys. | `SessionDetailScreen.tsx:31`, `useDeleteSessionMutation.ts:11-14` |
| 35 | Currency balance not affected by session deletion in V1 | PASS | — | Delete only removes from `sessions` table; no currency ledger modification. | `stats.repository.ts:79-81` |
| 36 | Child switching reloads Stats with new child's data | PARTIAL | MEDIUM | Queries use `childId` from store and are keyed by it, so switching would trigger refetch. However, no explicit reload/invalidation on child switch. TanStack Query would show stale data until refetch completes. | `useStatsQuery.ts:5-10` |
| 37 | Entry point: "See all sessions" link on Home dashboard | MISSING | LOW | No evidence of this link (outside Stats feature scope, but noted). | — |
| 38 | Loading state: skeleton with shimmer animation | MISSING | CRITICAL | No loading state handling. Queries return data or undefined; no skeleton/shimmer. | `StatsScreen.tsx` |
| 39 | Error state: "Something went wrong" with retry button | MISSING | CRITICAL | No error state handling. `isError` not checked on either query. | `StatsScreen.tsx` |
| 40 | Offline state: subtle banner + cached data | MISSING | CRITICAL | No offline detection or banner. | `StatsScreen.tsx` |
| 41 | Session detail: loading state | MISSING | MEDIUM | Returns `null` when no data — blank screen instead of skeleton. | `SessionDetailScreen.tsx:36` |
| 42 | Only one period of data: comparison line/indicators hidden | MISSING | MEDIUM | No comparison logic exists at all. | `StatsScreen.tsx` |
| 43 | Repository: stats summary not scoped by period | MISSING | CRITICAL | `getStatsSummary` queries all-time data with no date filtering. Cannot support any time period feature. | `stats.repository.ts:4-31` |
| 44 | Repository: session list not scoped by period or activity | MISSING | CRITICAL | `getSessionList` returns all sessions for child, no date or activity filter. | `stats.repository.ts:33-47` |
| 45 | Repository: N+1 query pattern for session enrichment | EXTRA | LOW | Each session triggers an individual `SELECT name FROM activities` — should be a JOIN. Not a spec violation but a performance concern. | `stats.repository.ts:41-46` |
| 46 | Repository: drill recorded values not queried | MISSING | MEDIUM | `getSessionDetail` fetches `drill_results` but does not query `tracking_element_results` or equivalent table for counter/timer/checklist values. | `stats.repository.ts:61-63` |
| 47 | Parent avatar in top right corner | MISSING | LOW | No parent avatar in Stats header (global UX convention). | `StatsScreen.tsx` |

---

## 3. UX conventions compliance

- **Navigation model:** PASS — Stats tab exists, session detail uses stack push (`router.push`), route structure is correct with `(tabs)/stats/index.tsx` and `(tabs)/stats/[sessionId].tsx`.

- **Error states:** FAIL — No error handling anywhere. Neither `StatsScreen` nor `SessionDetailScreen` check `isError` or display error messages/retry buttons. Spec requires "Something went wrong. Please try again." with retry.

- **Loading states:** FAIL — No loading state in `StatsScreen` (no skeleton, no shimmer). `SessionDetailScreen` returns `null` (blank screen) while loading instead of a skeleton. UX conventions require skeleton with shimmer for screens loading lists/dashboards.

- **Empty states:** FAIL — `StatsScreen` shows "No sessions yet" via `ListEmptyComponent`, which violates the spec (spec says show "0 sessions" with structure always visible, no empty state message). No empty state icon or message structure per the UX conventions pattern (icon + short message + action button).

- **Destructive confirmations:** PARTIAL — Delete session uses `useDestructiveAlert` (correct shared hook, presumably native iOS alert). However, the alert copy diverges from the spec's exact wording. Pattern is directionally correct.
