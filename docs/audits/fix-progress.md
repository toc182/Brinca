# Audit fix progress

**Source audits:** [architecture](architecture-2026-05-01.md), [code-correctness](code-correctness-2026-05-01.md), [db-code-drift](db-code-drift-2026-05-01.md), [stale-and-dead](stale-and-dead-2026-05-01.md).

**Working order:** bottom-up by severity (LOW → MEDIUM → CRITICAL → BLOCKER). Coupled findings are pulled in early when they form one structural piece of work — those are noted inline (e.g. the auth bundle pulled in 3 CRITICALs while doing one MEDIUM).

**After every fix:**
1. Check the relevant box.
2. Append the commit hash on that line.
3. Update the **Status** counters at the top.

**When every checkbox is checked (or explicitly skipped): `rm docs/audits/fix-progress.md`.** Once the sweep is closed, the source audits are the historical record; this tracker has no further purpose.

---

## Status

- ✅ LOW phase — closed (4 items done, 2 explicitly skipped).
- 🟡 MEDIUM phase — 13 done, ~5 remaining.
- ⏳ CRITICAL phase — 3 closed via coupling during MEDIUM auth bundle, ~14 remaining.
- ⏳ BLOCKER phase — not started, 10 items.

---

## LOW — closed

Commit `d596816` ("Add 2026-05-01 audits and resolve LOW findings"):

- [x] Console-log hygiene wrapped in `__DEV__` (rehydrate.ts × 5, CreateActivityScreen.tsx × 2) — stale-and-dead #3, #4
- [x] Delete `src/lib/sync/useNetworkStatus.ts` (orphan, canonical at shared/hooks/) — stale-and-dead #1
- [x] Delete `src/features/session-logging/hooks/useActiveSession.ts` (orphan) — stale-and-dead #2 (also corrected architecture audit's LOW #1, which had a wrong premise)
- [x] Delete `src/features/session-logging/mutations/useStartSessionMutation.ts` (orphan) — code-correctness #27
- [⏭] Skipped: `IF NOT EXISTS` rewrite of initial migration — db-drift LOW (already-applied migration; touching it risks supabase CLI drift warnings for a hypothetical local-reset issue)
- [⏭] Skipped: batch insert in `rehydrate.ts:179-193` — db-drift LOW (marginal local-SQLite perf, audit calls "marginal" itself)

---

## MEDIUM — in progress

### Onboarding / auth flow
- [x] LoginScreen navigates before FK chain ready — code-correctness #19 — commit `b97eb0d` (closed via auth bundle)
- [x] Stale displayName/personaType in email-verify callback — code-correctness #20 — commit `bf8bfe3` (verification deferred — needs real email-link round-trip)

### State persistence
- [x] Zustand `migrate` ignores version param (4 stores) — code-correctness #21 — commit `46d63d9`

### Mutations / cache invalidation
- [x] `useFinishSessionMutation` invalidates inside `mutationFn` — code-correctness #22 — commit `0be72ee`
- [x] Measurement edit skips invalidation — code-correctness #23 — commit `0be72ee`
- [x] Session-note write fire-and-forget on Finish — code-correctness #24 — commit `0be72ee`

### Side fixes folded into commit `0be72ee` (not audit findings; surfaced during on-device testing)
- Shared `BottomSheet` defaults `keyboardBehavior='interactive'` + `keyboardBlurBehavior='restore'`
- Shared `Input` gains `inBottomSheet` prop that renders `BottomSheetTextInput` (required for @gorhom/bottom-sheet v5 keyboard handling)
- `profile.repository.getLatestMeasurement` adds `created_at DESC` tiebreaker to the SQL — same-day measurements were returning an arbitrary row (the oldest in practice)

### Timers / UX
- [x] Stopwatch loses time after app-kill — code-correctness #25 — commit `d6db6f1`
- [x] Image picker errors swallowed — code-correctness #26 — commit `d6db6f1` (verification waits for next native build)

### Side fixes folded into commit `d6db6f1` (not audit findings; surfaced during on-device testing)
- Stopwatch sanity cap: auto-stop and freeze at last-saved value if 2+ hours have passed since the saved start, mirroring the session-level inactivity threshold
- `app.config.ts` adds `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` — without these the picker cannot open at all on iOS (native config; needs rebuild to take effect)

### Architecture (intra-feature)
- [x] `BonusPresetSection` and `TierRewardSection` bypass TanStack Query — architecture intra-feature #1, #2 — commit `7a0f8e1`
- [x] 12 element-config components call `updateElement` outside any mutation — architecture intra-feature #3 — commit `fe41d96` (actually 13 components; introduced `useUpdateElementMutation` shared by all)
- [x] 2 session-logging screens (SessionScreen + SessionSummaryScreen) call repo functions directly — architecture intra-feature #4, #5 — commit `aaa7f4c`

### DB hardening
- [ ] Tighten `families.INSERT` — db-drift MEDIUM #6
- [ ] Tighten `accolade_unlocks.INSERT` — db-drift MEDIUM #7
- [ ] Add UPDATE policy for `invites` (mark accepted) — db-drift MEDIUM #8
- [ ] Fix `invites.invited_by` cascade — db-drift MEDIUM #9
- [ ] Document or fix no-cascade on `sessions.activity_id` / `drill_results.drill_id` / `element_values.tracking_element_id` — db-drift MEDIUM #10

---

## CRITICAL — pending (some closed via coupling)

### Closed during MEDIUM auth bundle (commit `b97eb0d`)
- [x] FK-chain silent no-op when `childName` absent — code-correctness #11 (closed via `ensureFKChainAndVerify` post-condition check)
- [x] `_layout.tsx` reads `data` without `error` → routes onboarded user to onboarding on transient errors — code-correctness #12
- [x] `onAuthStateChange` no try/catch → blank-screen lock — code-correctness #13

### Pending — sync writes (will fold into BLOCKER sync-queue bundle)
- [ ] Session/drill notes never queued — code-correctness #8
- [ ] `reorderDrills` queue append outside transaction — code-correctness #9
- [ ] `reorderElements` queue append outside transaction — code-correctness #10

### Pending — cache invalidation
- [ ] `useAddBonusMutation` no invalidation — code-correctness #14
- [ ] Empty-string activity invalidation key (`activities('')` never matches) — code-correctness #15
- [ ] `markDrillComplete` skips drill-results invalidation — code-correctness #16

### Pending — domain logic
- [ ] Streak calculator uses UTC + fixed 86400s — code-correctness #17
- [ ] Shared debounce ref drops element values when typing notes — code-correctness #18

### Pending — DB drift / verification
- [ ] Verify `family_members.profiles!inner` embed works at runtime — db-drift CRITICAL #4
- [ ] Add FK indexes (~17 indexes via new migration) — db-drift CRITICAL #5

### Pending — architecture (cross-feature imports)
- [ ] Extract to `src/shared/activity-data/`: `getDrillsByActivity`, `getDrillById`, `getElementsByDrill`, `getBonusPresets` (closes 4 CRITICAL violations in one refactor) — architecture cross-feature #1-#4

---

## BLOCKER — pending

### Sync queue cluster *(close all 6 with `withQueuedWrite` helper + head-of-line fix; also closes CRITICAL #8, #9, #10)*
- [ ] Currency ledger never queued — code-correctness #1
- [ ] Accolade unlocks never queued — code-correctness #2
- [ ] Session deletes never queued — code-correctness #3
- [ ] Measurement writes never queued — code-correctness #4
- [ ] External activity writes never queued — code-correctness #5
- [ ] Sync queue head-of-line blocking — code-correctness #6

### Storage RLS leaks *(single migration)*
- [ ] `avatars` bucket — no path scoping (any auth'd user reads any other user's avatar) — db-drift BLOCKER #1
- [ ] `session-media` bucket — no path scoping (child photos!) — db-drift BLOCKER #2

### Self-credit fraud
- [ ] `currency_ledger.INSERT` policy too permissive (any 'member' role can credit arbitrary currency) — db-drift BLOCKER #3

### Timer correctness
- [ ] IntervalTimer stale phase closure (rest phase counts down work duration) — code-correctness #7
