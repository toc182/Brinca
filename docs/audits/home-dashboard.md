# Home Dashboard — Compliance Audit

**Audited:** 2026-04-21
**Spec:** `docs/feature-specs/home-dashboard.md`
**UX conventions:** `docs/ux-conventions.md`
**Source:** `src/features/home-dashboard/` + `app/(tabs)/home.tsx`

---

## 1. Summary

The Home Dashboard implementation is at an **early scaffold stage** with significant gaps. The screen renders the correct data sections in roughly the right order, but almost all interactivity is missing: no navigation on any tappable element (child header, reward, sessions, accolades), no skeleton/shimmer loading, no offline banner, no error state, and no "See all" links. The active child header lacks photo/initials. Recent sessions omit completion status. The level calculation ignores currency (uses sessions only). The `useRedeemRewardMutation` violates the "features are islands" rule by importing from `session-logging`. Overall compliance: **~25-30%** — data fetching and layout structure are in place, but the spec's interactivity, states, and UX convention requirements are largely unimplemented.

---

## 2. Gap table

| # | Spec requirement | Status | Severity | Gap description | File(s) |
|---|------------------|--------|----------|-----------------|---------|
| 1 | Child's photo (circular) displayed in header | MISSING | CRITICAL | Only child name is rendered as plain text. No photo, no `<Image>`. | `src/features/home-dashboard/screens/HomeScreen.tsx` |
| 2 | If no photo, show circular placeholder with initials | MISSING | CRITICAL | No initials placeholder logic exists. | `src/features/home-dashboard/screens/HomeScreen.tsx` |
| 3 | Tapping child header navigates to Profile tab | MISSING | CRITICAL | Child name is a `<Text>`, not wrapped in `Pressable`. No navigation. | `src/features/home-dashboard/screens/HomeScreen.tsx` |
| 4 | Badge evolves visually at every 10th level milestone | MISSING | MEDIUM | Badge is a static purple circle with the level number. No visual evolution logic. | `src/features/home-dashboard/components/LevelBadge.tsx` |
| 5 | Level based on combination of sessions + currency earned | PARTIAL | MEDIUM | `getLevelProgress` only receives `sessionCount`. Currency is not factored in. | `src/features/home-dashboard/components/LevelBadge.tsx` |
| 6 | Reward progress section is tappable — navigates to rewards screen | MISSING | CRITICAL | No `Pressable` wrapper, no navigation handler. | `src/features/home-dashboard/components/RewardProgress.tsx`, `src/features/home-dashboard/screens/HomeScreen.tsx` |
| 7 | Reward empty state text: "No reward set. Add a reward to motivate practice." | PARTIAL | LOW | Shows "No rewards set" (plural, no motivational text). | `src/features/home-dashboard/components/RewardProgress.tsx` |
| 8 | "Add reward" button wired to navigation | MISSING | MEDIUM | `onAddReward` prop exists but HomeScreen never passes it. Button never renders. | `src/features/home-dashboard/screens/HomeScreen.tsx:44` |
| 9 | Reward progress format: "32 of 50 Coins — New baseball glove" | PARTIAL | LOW | Shows "balance / cost" without currency name or reward name inline in the progress text. | `src/features/home-dashboard/components/RewardProgress.tsx:27` |
| 10 | Streak indicator near active child header | PARTIAL | LOW | Streak is in the ConsistencyMetrics row at mid-page, not near the header as spec states. | `src/features/home-dashboard/screens/HomeScreen.tsx`, `src/features/home-dashboard/components/ConsistencyMetrics.tsx` |
| 11 | Recent sessions show completion status (complete/incomplete) | MISSING | MEDIUM | `SessionItem` interface has `duration_seconds` but no `is_complete` or completion status field. Not rendered. | `src/features/home-dashboard/components/RecentSessions.tsx` |
| 12 | Tapping a recent session navigates to session detail | MISSING | CRITICAL | Session rows are plain `<View>`, not `Pressable`. No navigation. | `src/features/home-dashboard/components/RecentSessions.tsx` |
| 13 | "See all sessions" link navigates to Stats tab | MISSING | CRITICAL | No "See all sessions" link exists anywhere. | `src/features/home-dashboard/screens/HomeScreen.tsx` |
| 14 | Recent sessions empty state: full text with CTA | PARTIAL | LOW | Shows "No sessions yet" but spec requires "No sessions yet. Start your first session to see your progress." | `src/features/home-dashboard/components/RecentSessions.tsx:13` |
| 15 | Accolades shown as badges/icons | PARTIAL | MEDIUM | Renders text name only. No icon or visual badge. | `src/features/home-dashboard/components/AccoladeRow.tsx` |
| 16 | "See all" link for accolades — full accolades screen | MISSING | CRITICAL | No "See all" link. | `src/features/home-dashboard/screens/HomeScreen.tsx` |
| 17 | Accolades section appears only after first session completed | PARTIAL | LOW | Conditionally shown when `accolades.length > 0`, which is functionally similar but doesn't distinguish "no session completed yet" from "sessions completed but no accolades earned." | `src/features/home-dashboard/screens/HomeScreen.tsx:58` |
| 18 | Loading state: skeleton with shimmer animation | MISSING | CRITICAL | Shows plain "Loading..." text. No skeleton shapes, no shimmer. | `src/features/home-dashboard/screens/HomeScreen.tsx:21-25` |
| 19 | Offline banner at top when no connection | MISSING | CRITICAL | No offline detection, no banner component. | `src/features/home-dashboard/screens/HomeScreen.tsx` |
| 20 | Offline banner disappears when connection restored | MISSING | CRITICAL | No implementation. | `src/features/home-dashboard/screens/HomeScreen.tsx` |
| 21 | Error state: "Something went wrong. Please try again." + retry button | MISSING | CRITICAL | `useDashboardQuery` returns `isLoading` but `isError`/`error` are not destructured or handled. | `src/features/home-dashboard/screens/HomeScreen.tsx` |
| 22 | First-time state: all sections show empty states with clear CTAs | PARTIAL | MEDIUM | Some empty states exist (sessions, rewards) but CTAs are not wired, and not all sections have empty states. | `src/features/home-dashboard/screens/HomeScreen.tsx` |
| 23 | "No drills configured" empty state with "Add drill" button | MISSING | MEDIUM | No drills section or empty state exists on Home. | `src/features/home-dashboard/screens/HomeScreen.tsx` |
| 24 | Tapping Home tab scrolls to top | MISSING | LOW | No scroll-to-top handler on tab re-tap. | `app/(tabs)/home.tsx` |
| 25 | Parent avatar (top right, all screens) | MISSING | MEDIUM | No parent avatar rendered. UX convention applies to every screen. | `src/features/home-dashboard/screens/HomeScreen.tsx` |
| 26 | `useRedeemRewardMutation` imports from `session-logging` feature | EXTRA | CRITICAL | Violates "features are islands" rule. Imports `appendLedgerEntry`, `insertAccoladeUnlock`, `isAccoladeUnlocked` from `@/features/session-logging/repositories/`. | `src/features/home-dashboard/mutations/useRedeemRewardMutation.ts` |
| 27 | `useCreateRewardMutation` in home-dashboard | EXTRA | LOW | Reward CRUD mutations may belong in a dedicated rewards feature, not home-dashboard. | `src/features/home-dashboard/mutations/useCreateRewardMutation.ts` |
| 28 | "Only one session logged" — show one session, no placeholders | PASS | — | Query limits to 2, component renders whatever is returned. Works correctly. | `src/features/home-dashboard/components/RecentSessions.tsx` |
| 29 | Currency balance visible when zero | PASS | — | Renders `{balance}` directly, zero displays as "0". | `src/features/home-dashboard/components/CurrencyBalance.tsx` |
| 30 | Custom currency name displayed | PASS | — | Reads from `useUIPreferencesStore`. | `src/features/home-dashboard/components/CurrencyBalance.tsx` |
| 31 | Sessions this week + total displayed | PASS | — | Both rendered in ConsistencyMetrics. | `src/features/home-dashboard/components/ConsistencyMetrics.tsx` |
| 32 | Streak hidden when 0, shown when >= 1 | PASS | — | Conditional `{streak > 0 && ...}`. | `src/features/home-dashboard/components/ConsistencyMetrics.tsx:15` |
| 33 | Content order top to bottom matches spec | PARTIAL | LOW | Order is: name - level - currency - reward - consistency - sessions - accolades. Spec order is: header - level - reward - currency - consistency - sessions - accolades. Currency and reward are swapped vs. spec. | `src/features/home-dashboard/screens/HomeScreen.tsx` |

---

## 3. UX conventions compliance

- **Navigation model:** FAIL — No tappable elements navigate anywhere. No Pressable wrappers on child header, reward section, session rows, or "see all" links. Parent avatar is absent.

- **Error states:** FAIL — No error handling. `isError` from the query is not checked. No "Something went wrong" screen, no retry button, no toast on sync failure.

- **Loading states:** FAIL — Spec and UX conventions require skeleton with shimmer animation for dashboard screens. Implementation shows plain "Loading..." text.

- **Empty states:** PARTIAL — RecentSessions and RewardProgress have basic empty text, but the text doesn't match spec verbatim, CTAs are not wired, and several sections (drills, accolades-first-time) have no empty state at all. Empty states lack icon + message + action button structure per convention.

- **Destructive confirmations:** N/A — No destructive actions on Home Dashboard.

---

## Recommendation

Prioritize the 10 CRITICAL items first — they represent the core interactivity (all navigation) and required screen states (loading skeleton, offline banner, error handling). The cross-feature import violation in `useRedeemRewardMutation` should also be addressed early since it breaks a fundamental architecture rule.