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
- ✅ MEDIUM phase — closed (18 done, migration deployed 2026-05-01).
- ⏳ CRITICAL phase — 7 closed (3 via auth bundle + 3 via sync-queue bundle + 1 cache invalidation), ~10 remaining.
- ✅ BLOCKER phase — closed (10 done, sync-queue cluster shipped 2026-05-09).

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

### DB hardening — closed in commit `d5c5910` as one Supabase migration. Deployed to remote on 2026-05-01 (verified: 5 policies/FKs landed).
- [x] Tighten `families.INSERT` — db-drift MEDIUM #6
- [x] Tighten `accolade_unlocks.INSERT` — db-drift MEDIUM #7
- [x] Add UPDATE policy for `invites` (mark accepted) — db-drift MEDIUM #8
- [x] Fix `invites.invited_by` cascade (chose ON DELETE CASCADE; keeps NOT NULL so local schema + types unchanged) — db-drift MEDIUM #9
- [x] Document/fix no-cascade on `sessions.activity_id` / `drill_results.drill_id` / `element_values.tracking_element_id` (now explicit ON DELETE RESTRICT) — db-drift MEDIUM #10

---

## CRITICAL — pending (some closed via coupling)

### Closed during MEDIUM auth bundle (commit `b97eb0d`)
- [x] FK-chain silent no-op when `childName` absent — code-correctness #11 (closed via `ensureFKChainAndVerify` post-condition check)
- [x] `_layout.tsx` reads `data` without `error` → routes onboarded user to onboarding on transient errors — code-correctness #12
- [x] `onAuthStateChange` no try/catch → blank-screen lock — code-correctness #13

### Closed via sync-queue bundle (2026-05-09)
- [x] Session/drill notes never queued — code-correctness #8 — commit `70ad498`
- [x] `reorderDrills` queue append outside transaction — code-correctness #9 — commit `67a573e`
- [x] `reorderElements` queue append outside transaction — code-correctness #10 — commit `67a573e`

### Pending — cache invalidation
- [x] `useAddBonusMutation` no invalidation — code-correctness #14 — commit `6294ab7`
- [ ] Empty-string activity invalidation key (`activities('')` never matches) — code-correctness #15
- [ ] `markDrillComplete` skips drill-results invalidation — code-correctness #16

### Side commits alongside #14 (not audit findings; surfaced during on-device testing)
- commit `9cc75fd` — `SessionSummaryScreen` was missed in today's bottom-sheet keyboard refactor; the bonus popup mounted but rendered no visible content because it lacked a `BottomSheetView` wrapper
- commit `44704a2` — added a "Bonuses" list on the session summary so each added bonus appears immediately with its reason; closes a UX gap where the only confirmation a bonus had landed was the home-screen balance after leaving the screen

### Pending — domain logic
- [ ] Streak calculator uses UTC + fixed 86400s — code-correctness #17
- [ ] Shared debounce ref drops element values when typing notes — code-correctness #18

### Pending — DB drift / verification
- [ ] Verify `family_members.profiles!inner` embed works at runtime — db-drift CRITICAL #4
- [ ] Add FK indexes (~17 indexes via new migration) — db-drift CRITICAL #5

### Pending — architecture (cross-feature imports)
- [ ] Extract to `src/shared/activity-data/`: `getDrillsByActivity`, `getDrillById`, `getElementsByDrill`, `getBonusPresets` (closes 4 CRITICAL violations in one refactor) — architecture cross-feature #1-#4

---

## BLOCKER — closed

### Sync queue cluster — shipped 2026-05-09 (also closes CRITICAL #8, #9, #10 — see above)
- [x] Currency ledger never queued — code-correctness #1 — commit `908c359` (both duplicate repos)
- [x] Accolade unlocks never queued — code-correctness #2 — commit `7baea88` (both duplicate repos; INSERT OR IGNORE → only queue on result.changes > 0)
- [x] Session deletes never queued — code-correctness #3 — commit `1e9cd33`
- [x] Measurement writes never queued — code-correctness #4 — commit `c642fbd` (insert + update + delete)
- [x] External activity writes never queued — code-correctness #5 — commit `5ccadf4` (insert + update + delete; UPDATE payload mirrors the dynamic fields object)
- [x] Sync queue head-of-line blocking — code-correctness #6 — commit `2b94a7b` (`getNextPending` filters `retry_count < 10`; failed items stay in `sync_queue` with `last_error` for inspection; no schema change)

Decision: did NOT introduce a `withQueuedWrite` helper. Mirrored the existing convention in `tracking-element.repository.ts` (sequential `db.runAsync` then `appendToQueue`) for consistency. The audit's recommendation of a transactional helper is a future architectural improvement, not required for closing the BLOCKERs.

## BLOCKER — earlier closures

### Storage RLS leaks — closed in commit `7d42966` (migration `20260501000001`, deployed 2026-05-01)
- [x] `avatars` bucket — no path scoping (any auth'd user reads any other user's avatar) — db-drift BLOCKER #1 (writes/updates/deletes scoped to owner; reads stay open auth'd-user, profile-pic pattern; DELETE policy added)
- [x] `session-media` bucket — no path scoping (child photos!) — db-drift BLOCKER #2 (path scheme `<family_id>/<session_id>/<file>`; reads scoped to family, writes to write-access roles; DELETE policy added; no upload code yet — this is the canonical scheme future code must follow)

### Self-credit fraud — closed in commit `7d42966` (same migration as above)
- [x] `currency_ledger.INSERT` policy too permissive (any 'member' role can credit arbitrary currency) — db-drift BLOCKER #3 (source-conditional rules: drill_tier/session_tier/manual_bonus must be positive with real FK ref; reward_redemption must be negative with real reward FK; manual_bonus additionally requires admin/co_admin; all gated on `has_write_access`)

### Timer correctness — closed in commit `5c0344a`
- [x] IntervalTimer stale phase closure (rest phase counts down work duration) — code-correctness #7 (mirrored `phase` into a ref so the `setInterval`-captured `tick` and `advancePhase` read the current phase; state still backs the rendered badge)
