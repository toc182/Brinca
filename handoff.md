# Handoff to next Claude — same Mac, fresh session

You're picking up because the prior session ran low on context. Read this whole file before touching anything. It is the authoritative state of where work stands and what to do next.

---

## Context-budget advice (do this before anything else)

Your context window is shared with everything you read. **This handoff is the budget-aware entry point.** Read it first, in full, before opening anything else. Then read only:

1. The seven memory files in `/Users/ileanacuevas/.claude/projects/-Users-ileanacuevas-Developer-Toc-Brinca/memory/` (small; safe to load all).
2. `docs/audits/fix-progress.md` (the tracker).
3. The audit doc for the findings you're about to touch (excerpts already pulled into §4 below, so often you can skip this).
4. The specific source files listed in §4.

Skip everything else unless §4 explicitly points you there. The user has been burned by spending context on superficial comparisons; don't repeat that.

---

## TL;DR (read this first)

- **The actual work is the audit.** `docs/audits/fix-progress.md` is the source of truth. We're working bottom-up by severity. BLOCKER/LOW/MEDIUM are closed; **CRITICAL phase has ~9 items left**.
- **Cache invalidation cluster is partially closed.** #14 done and verified on device (commit `6294ab7` + side commits `9cc75fd` and `44704a2`). **#15 code is committed (commit pending — see below) but NOT YET VERIFIED ON DEVICE.** **#16 still pending.** That is the next chunk.
- **Prior keyboard side-quest** (locked-in via `docs/ux/forms.md` + `UXWORKS.md`) — do not undo, do not re-debate.
- **Cross-machine handoff (Mac → Windows office):** All working-tree state at the time of writing — including the prior keyboard refactor WIP, all unstaged docs edits, and the new files for `AppKeyboardToolbar`, modal form screens, etc. — was committed in a single "checkpoint" commit (the one that introduced THIS handoff revision). After `git pull` at the office, the working tree should be clean; everything previously sitting uncommitted is now part of the history.
- **Before writing any code: read this entire file, plus the user's auto-memory in `/Users/ileanacuevas/.claude/projects/-Users-ileanacuevas-Developer-Toc-Brinca/memory/MEMORY.md` (and the individual memory files it links to).** The user has strong preferences and prior corrections live there.

---

## §1. Status snapshot (2026-05-19)

### Audit
- ✅ LOW phase — closed
- ✅ MEDIUM phase — closed
- ✅ BLOCKER phase — closed (sync-queue cluster shipped 2026-05-09)
- ⏳ **CRITICAL phase — ~9 items remaining** (1 cache invalidation pending verification + 1 cache invalidation untouched + 2 domain logic + 2 DB drift/verification + 4 architecture cross-feature imports bundled in one refactor)

### Cache invalidation cluster (in-flight)
- ✅ #14 `useAddBonusMutation` no invalidation — committed `6294ab7`, **verified on device 2026-05-16**.
  - Side commit `9cc75fd` — completed the bottom-sheet keyboard refactor on `SessionSummaryScreen` (the popup wasn't showing at all because it lacked a `BottomSheetView` wrapper — the file got missed in the prior session's keyboard pass).
  - Side commit `44704a2` — added a "Bonuses" list on the session summary so each added bonus appears immediately with its reason (closed a UX gap surfaced during verification).
- ⚠ #15 Empty-string activity invalidation key — **code committed but NOT VERIFIED on device.** Office Claude: verify before marking the tracker.
- ⬜ #16 `markDrillComplete` skips drill-results invalidation — untouched.

### Prior keyboard side-quest (closed earlier)
- ✅ Tab-bar covers content (fixed 2026-05-09 via `contentInsetAdjustmentBehavior="automatic"`).
- ✅ Keyboard hides form fields (fixed across all forms; bottom-sheet edit popups for Measurements and External Activities were converted to full-screen modal Stack screens; iOS-grouped card layout applied; date picker uses `display="compact"` or inline accordion).

---

## §2. How to start — the very first thing to do

1. **Read this file end-to-end** (you're doing that now).
2. **Read memory:** `/Users/ileanacuevas/.claude/projects/-Users-ileanacuevas-Developer-Toc-Brinca/memory/MEMORY.md`. It is an index to seven individual feedback/project files. Read all of them. Key ones (verbatim names):
   - `feedback_choice_format.md` — status snapshot → A/B options → my lean → one closing question.
   - `feedback_plain_language.md` — describe what a person sees, not what code does; short beats long.
   - `feedback_diagnose_first.md` — never speculate-and-ship; confirm cause before code.
   - `feedback_no_stopping_suggestions.md` — always propose forward action; never offer "call it a day" as a choice.
   - `feedback_no_bundled_questions.md` — one question at a time. Don't pile a second question onto an answer.
   - `feedback_no_superficial_work.md` — when investigating or comparing, default to full depth; don't wait to be told.
   - `project_prelaunch_state.md` — only the user's own test data on remote; hard cutovers are safe; skip data-migration ceremony.
3. **Read `docs/audits/fix-progress.md`** in full. That's the audit tracker.
4. **Read `docs/ux/forms.md`** to know what's locked-in from today.
5. **Read `UXWORKS.md`** at repo root for the running history of UX fix attempts and their results.
6. **`nextSession.md` was deleted 2026-05-19** — earlier prior-prior handoff, no longer needed.
7. **Your first action is to verify #15 on device** (steps in §4). Do not start writing code for #16 until #15 is confirmed working — and after #15 is confirmed, present a step-by-step task list for #16 and wait for approval before writing code (per `CLAUDE.md` "How to start a phase").

---

## §3. Today's keyboard work — what shipped, what is locked, what you must not undo

This is non-trivial state. Re-litigating any of it will waste a lot of time. The user already spent half a day fighting through it.

### Files created today
- `src/shared/components/AppKeyboardToolbar.tsx` — wraps the library's `KeyboardToolbar` with a Liquid-Glass-style backdrop. Uses `tint="systemUltraThinMaterial"` (NOT `systemChromeMaterial` — that material looks solid, was the wrong tint). Mounted as a **sibling of `<Screen>` at the route root**, NOT inside `<Screen>`.
- `src/features/profile/screens/ExternalActivityEditScreen.tsx` — modal form, KAS, card layout, full-width inputs.
- `src/features/profile/screens/MeasurementEditScreen.tsx` — modal form, KAS, card layout, accordion-style inline date picker.
- `app/(settings)/child/external-activity-edit.tsx` — route wrapper (thin).
- `app/(settings)/child/measurement-edit.tsx` — route wrapper (thin).
- `docs/ux/forms.md` — the conventions doc. **This is the rulebook for any future form work. Don't rebuild forms differently from what's in there without strong reason.**
- `UXWORKS.md` (repo root) — running log of UX fix attempts. The format is "attempt → result". Append, don't restructure.

### Files modified today
- `src/shared/components/BottomSheet.tsx` — no longer auto-wraps children in `BottomSheetView`. Callers pick the right container (`BottomSheetView`, `BottomSheetScrollView`, or `BottomSheetFlatList`). Exposes `InBottomSheetContext`. Accepts `keyboardBehavior`, `keyboardBlurBehavior`, `enableContentPanningGesture` props.
- `src/shared/components/Input.tsx` — reads `InBottomSheetContext` so any `<Input>` inside a shared `BottomSheet` auto-swaps to `BottomSheetTextInput`. `inBottomSheet` prop still works as an explicit override.
- `src/features/profile/screens/ExternalActivitiesScreen.tsx` — stripped its inline popup `BottomSheet`. Now just a list. Tapping a row or Add navigates to `ExternalActivityEditScreen`.
- `src/features/profile/screens/MeasurementsScreen.tsx` — same treatment.
- `src/features/activity-selector/screens/ActivityScreen.tsx` — wraps the picker content in `BottomSheetView` explicitly (preserves prior behavior after the shared-`BottomSheet` refactor).
- `src/features/activity-builder/screens/DrillEditScreen.tsx` — element-picker sheet and element-editor sheet now use `BottomSheetScrollView` from `@gorhom/bottom-sheet` directly. Outer form uses `KeyboardAwareScrollView` + `<AppKeyboardToolbar />`.
- `src/features/activity-builder/screens/CreateActivityScreen.tsx`, `CreateDrillScreen.tsx`, `EditProfileScreen.tsx` — all converted to `KeyboardAwareScrollView` + `<AppKeyboardToolbar />` outside `<Screen>` with `bottomOffset={88}`.
- `src/features/home-dashboard/screens/HomeScreen.tsx`, `src/features/profile/screens/ProfileScreen.tsx`, `src/features/stats/screens/StatsScreen.tsx`, `src/features/stats/screens/SessionDetailScreen.tsx` — `contentInsetAdjustmentBehavior="automatic"` added to each `Animated.ScrollView`/`Animated.FlatList`/`ScrollView` to push content above the floating iOS native tab bar.
- `app/(settings)/_layout.tsx` — added two `Stack.Screen` entries (`child/external-activity-edit` and `child/measurement-edit`) with `presentation: 'modal'`.

### Key numbers / values to know
- `bottomOffset={88}` is the canonical value for `KeyboardAwareScrollView` when a `<KeyboardToolbar>` is mounted on iOS 26. The library's example value `62` is WRONG for this app — it doesn't account for the toolbar height.
- iOS 26 floating keyboard toolbar sits ~53pt above the keyboard (11pt offset + 42pt toolbar height).
- Date pickers use `display="compact"` (default) or `display="inline"` (accordion expansion). **Never `spinner`** on iOS 14+.
- `<AppKeyboardToolbar />` MUST be a sibling of `<Screen>`, NOT inside it. Inside, it inherits the home-indicator inset and floats off the keyboard.

### Pre-existing positioning bug — NOT FIXED, NOT in today's scope
- `TierRewardBottomSheet` and `BonusPresetBottomSheet` (rendered inline from inside `DrillEditScreen`) appear in the wrong vertical position because they use `GorhomBottomSheet` directly while nested deep inside the screen's content. They position relative to their parent, not the window. The user has approved a future fix path (convert to modal screens, same pattern as Measurements/External Activities) but **this is NOT what to do next** — finish the audit cache-invalidation cluster first.

### Sync toast on every reload — annoyance, NOT fixed, NOT in today's scope
The user reported on 2026-05-12: "every time I reload I get the 'some changes couldn't sync' toast. is annoying." This is the offline sync engine flushing a stale pending change on reload. Real bug, separate from the audit. Don't touch unless the user prioritizes it.

---

## §4. The actual next chunk — Option A: cache invalidation cluster

Three audit findings (code-correctness #14, #15, #16). All small. All TanStack Query mutation/query work.

### Canonical invalidation pattern (copy this shape)

`src/features/session-logging/mutations/useFinishSessionMutation.ts`:

```tsx
export function useFinishSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ... }) => { ... },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

Notes on this pattern:
- Invalidation lives in `onSuccess` of the `useMutation`, NEVER inside `mutationFn` (that was audit #22, already fixed).
- Brinca's codebase uses **string-array literals** (`['sessions']`) for keys in some places and **per-feature key factories** (e.g. `activityBuilderKeys.activities(childId)`) in others. The audit-doc remediation for #14 references factory names like `homeKeys.dashboard(childId)` and `sessionKeys.drillResults(sessionId)` — check whether those factories exist before using them. If they don't, use the literal-array form that matches what the corresponding `useQuery` registers.

---

### Finding #14 — `useAddBonusMutation` no invalidation ✅ DONE

Committed `6294ab7`. Verified on device 2026-05-16. Side commits `9cc75fd` (sheet-wrapper bug fix) and `44704a2` (Bonuses list UX feature) landed alongside.

For reference, the original finding was:

**Audit verbatim** (`docs/audits/code-correctness-2026-05-01.md` line 32, and remediation line 85):

> Mutation appends a ledger entry but never invalidates dashboard or rewards queries.
> File: `src/features/session-logging/mutations/useAddBonusMutation.ts:6-19`
> Symptom: Parent adds a manual bonus; the home dashboard balance and reward progress bar do not update until next app relaunch.
> Fix: Add `useQueryClient` and an `onSuccess` that invalidates `homeKeys.dashboard(childId)` (and any rewards keys that read currency).

**What to do:**
1. Open `src/features/session-logging/mutations/useAddBonusMutation.ts`.
2. Find the actual key shape used by `useDashboardQuery` (grep `src/features/home-dashboard/queries/`). It's probably `['dashboard', childId]` or a `homeKeys.dashboard(childId)` factory. Use whatever the query itself registers.
3. Also invalidate anything that reads the currency balance directly (grep for `currency_ledger` query usage, `useBalance`, `useChildBalance`, similar).
4. Add `useQueryClient` import + `onSuccess` invalidation following the pattern above.

**Verify on device:** award a manual bonus from the session-summary flow; the home dashboard's balance and reward-progress bar update without an app relaunch.

---

### Finding #15 — Empty-string activity invalidation key never matches ⚠ CODE DONE, NOT VERIFIED

Code change committed `0f6c40f`. Pulls `childId` from `useActiveChildStore`, replaces both `activities('')` calls in `ActivityDetailScreen.tsx` with `activities(childId)` guarded by `if (childId)`, and also invalidates the activity-selector's key `['activities-selector', childId]` in both handlers. Codebase sweep for `activities(''` and `keys.x(''` found no other empty-string fallback bugs.

**Office Claude — DO THIS FIRST:** verify on device, then update tracker and commit any follow-up. Verification steps below. If verification fails, diagnose-first (don't speculate).

**Audit verbatim** (line 33, remediation line 86):

> `activityBuilderKeys.activities('')` produces `['activities','']` which never matches the real `['activities', childId]`.
> Files: `src/features/activity-builder/screens/ActivityDetailScreen.tsx:272` and `:285`.
> Symptom: Parent toggles or deletes an activity; the activity-selector and list screens continue showing the stale row until app relaunch.
> Fix: Read `childId` from `useActiveChildStore` and pass it to `activityBuilderKeys.activities(childId)`; also invalidate the activity-selector key for that child.

**What to do:**
1. In `ActivityDetailScreen.tsx`, pull `childId` from `useActiveChildStore((s) => s.childId)` (check imports first; the store hook may already be imported in this file).
2. Replace both `activities('')` calls (lines 272, 285) with `activities(childId)`, guarded by `if (childId)`.
3. **Also invalidate the activity-selector's key for that child** (audit explicitly calls this out). Grep `src/features/activity-selector/queries/` to find that key.
4. Then audit the broader codebase: `grep -rn "activities(''" src/features` and `grep -rn "keys\.\w\+\(''" src/features`. Any other empty-string-fallback key is the same bug shape — fix or document them now.

**Verify on device:** toggle an activity's active state or delete it from the detail screen; navigate back to the activities list AND the activity-selector tab — both should show the change immediately without pull-to-refresh.

---

### Finding #16 — DrillScreen `markDrillComplete` skips drill-results invalidation

**Audit verbatim** (line 34, remediation line 87):

> `markDrillComplete` runs then `router.back()` fires; `['drill-results', sessionId]` is never invalidated.
> File: `src/features/session-logging/screens/DrillScreen.tsx:177-178`.
> Symptom: User finishes a drill with elements; on returning to the session screen the drill still shows uncompleted because the underlying query is stale.
> Fix: Call `queryClient.invalidateQueries({ queryKey: sessionKeys.drillResults(sessionId) })` after `markDrillComplete` and before `router.back()`.

**Decisive direction:** The audit specifies the fix point is `DrillScreen.tsx:177-178` — the direct call site, NOT the mutation hooks. Do NOT migrate this call into a mutation now (that's an architecture finding, audit cross-feature #5, separately tracked). Just add the invalidation at the call site.

**What to do:**
1. Open `DrillScreen.tsx` and locate the `markDrillComplete` direct call (around line 177-195 per current state — line numbers may have shifted slightly).
2. Find the drill-results query key shape: grep `drill-results` or `drillResults` in `src/features/session-logging/queries/`. Use whatever shape the corresponding `useQuery` registers.
3. Right after `await markDrillComplete(drillResultId)` and before `router.back()`, add `queryClient.invalidateQueries({ queryKey: <thatKey> })`.
4. Make sure `useQueryClient` is imported.

**Verify on device:** start a session, open a drill that has tracking elements, complete it; on returning to the session screen, the drill row should immediately show as completed without manual refresh.

---

### After applying all three fixes

1. Run `bun run typecheck`. Must pass.
2. **Heads-up about `bun test`:** as of this handoff, the project has **zero test files** matching the runner's pattern — `bun test` exits with `0 test files matching ...` and is effectively a no-op. Don't be confused by that. The audit doesn't require you to add tests for these fixes; verification is on-device.
3. Mark the three findings checked off in `docs/audits/fix-progress.md` ("CRITICAL — Pending — cache invalidation" section, lines 92-94). Append commit hash(es) on each line.
4. Update the **Status** counters at the top of `fix-progress.md` (drop "~11 remaining" to "~8 remaining"). Per the tracker's own instructions.
5. **Ask the user to verify each one on device. Do NOT claim "fixed" before they confirm.** (See §7 — biggest lesson from today.)
6. Once verified, propose **Option B — Shared activity-data extraction** as the next chunk. That refactor closes 4 architecture findings in one piece.

### Commit-message style (when the user asks for a commit)

User's existing commits are lowercase, scope-prefixed, concise, lowercase verbs. Examples from `git log`:

```
currency_ledger: queue inserts for sync
session and drill notes: queue note updates for sync
external_activities: queue insert/update/delete for sync
reorder paths: move queue appends inside the transaction
```

Match this style. For the cache-invalidation cluster, candidate messages:
- `bonus mutation: invalidate dashboard + rewards on success`
- `activity invalidation: use real childId instead of empty string`
- `drill complete: invalidate drill-results before navigating back`

Commit each finding as its own commit unless they're trivially related; the tracker takes one commit hash per row.

---

## §5. User preferences — re-read every time

These are in memory, but they're load-bearing enough to repeat here:

1. **Plain language, no jargon.** Describe what a person using the app sees. Short beats long. Don't say "the BottomSheetScrollView's contentContainerStyle's paddingBottom" — say "the form's bottom padding."
2. **Choice-presentation format for any non-trivial decision:** status snapshot → A/B framing → recommendation (with reasoning) → one closing question. NOT a wall of options.
3. **Diagnose first, fix second.** Never assume a cause and ship a fix. Confirm. The user has repeatedly pulled me back from speculative fixes today. If unsure of a cause, say so and propose how to confirm.
4. **Never suggest stopping.** No "call it a day", no "want me to pause here?". Always propose the next forward step. The user will tell you when to stop.
5. **One question at a time.** Never bundle two questions or tack a secondary question onto an answer. Resist "while we're at it."
6. **Do thorough work without being told.** When asked to investigate or compare, default to the FULL version — read both files end-to-end, compare props and defaults, look at surrounding render context. Don't skim. The user explicitly called this out today.
7. **No asking "want me to do X?" when X is obvious.** Just do it. The exception is anything destructive or that crosses a permission boundary.

---

## §6. WIP working tree — was big, now committed

At 2026-05-19, on the user's request to "commit and push everything" before switching machines, a single large checkpoint commit (the same commit that introduced THIS handoff revision) staged every modification, deletion, and untracked source/doc file in the working tree, with the following deliberate exclusions:

- `.DS_Store` and `app/.DS_Store` — macOS cruft. Not staged. Not added to `.gitignore` (out of scope; user can do that later if desired).
- `.claude/settings.json` — contains absolute `/Users/ileanacuevas/...` paths and per-machine permission entries that won't apply on the office Windows machine. Not staged. Treat as per-machine, not shared.
- `nextSession.md` — deleted (was stale per the prior `nextSession.md → handoff.md` baton pass; nothing in it is still load-bearing).

So at the office, the post-`git pull` working tree should be clean. The big checkpoint commit bundled, among other things: the prior keyboard refactor (today's modal form screens, `AppKeyboardToolbar`, `BottomSheet`/`Input` refactors, `contentInsetAdjustmentBehavior` rollout), assorted doc edits across `docs/architecture/`, `docs/audits/`, `docs/feature-specs/`, `docs/brand-decisions.md`, `docs/compliance/`, `docs/fix-plan.md`, `docs/rewards-levels-accolades.md`, `docs/ux-conventions.md`, the deletion of `docs/design/*`, modifications to `app.config.ts`, `app/(settings)/_layout.tsx`, `CLAUDE.md`, `.gitignore`, `package.json` + lockfiles (`bun.lock`, `package-lock.json`), `supabase/config.toml`, and edits across `src/features/accounts-center/`, `src/features/activity-builder/`, `src/features/activity-selector/`, `src/features/home-dashboard/`, `src/features/onboarding/`, `src/features/profile/`, `src/features/stats/`.

Going forward, the same per-path discipline still applies — for any audit work, stage exactly the files for that finding; don't `git add -A` or `git add .`.

---

## §7. Mistakes I made today — read this so you don't repeat them

The user explicitly called these out. They cost real time today.

1. **I committed to hypotheses as "the fix" before verifying.** Every iteration said "this should work" and the user had to push back. **Right rhythm: one change → user tests on device → confirm or reject → next change.** Don't bundle.
2. **I compared two implementations superficially.** When asked "why does Tier work and External Activities doesn't?", I looked at top-level props and missed deeper structural differences. **When investigating, read both files end-to-end.** Compare every prop, every default, every wrapper, every style. Produce a real diff before proposing.
3. **I assumed Tier's behavior was the "working" reference** when the user had never actually tested Tier's keyboard handling (it was blocked by a positioning bug). My whole strategy was built on an unverified premise.
4. **I layered changes without isolating which one did what.** When something broke (the bottom sheet stopped opening), I had no clean baseline to revert to. **Apply one change at a time when iterating.**
5. **I hoped the fix was a config tweak when it was actually a feature I had to build.** `@gorhom/bottom-sheet` doesn't auto-scroll the focused input. I kept hunting for settings that don't exist. **State library limitations clearly and early.**

The eventual fix was to step away from the bottom-sheet popup pattern entirely and adopt the iOS modal-form pattern. That's now codified in `docs/ux/forms.md` so future you doesn't waste time on the same path.

---

## §8. Critical conventions to keep top-of-mind

- **Architecture:** features are islands; `app/` routes are thin wrappers; all logic lives in `src/features/<name>/`. Don't put real code in route files. See `CLAUDE.md` and `docs/architecture/02-project-structure.md`.
- **State boundary:** Zustand = client state ONLY. TanStack Query = server state ONLY. Never mix.
- **Auth tokens:** `expo-secure-store` only. Never `AsyncStorage`.
- **UI primitives:** `Pressable` not `TouchableOpacity`. `StyleSheet.create` not inline styles. No barrel `index.ts` files. No `any` — use `unknown`.
- **Media:** `expo-video` / `expo-audio`. `expo-av` was removed in SDK 55.
- **Sync:** offline-first. `expo-sqlite` is local truth. `appendToQueue` after every local write that needs to sync. See `docs/architecture/04-offline-sync.md`. The convention is sequential `db.runAsync` then `appendToQueue` (NOT the audit's `withQueuedWrite` helper — explicitly decided against during the BLOCKER bundle).
- **Forms:** see `docs/ux/forms.md`. Don't deviate.

---

## §9. Useful commands

```bash
bun install            # deps
bun run start          # dev server
bun run typecheck      # tsc --noEmit — ALWAYS run before claiming done
bun test               # Jest + RNTL
bun run lint           # ESLint
maestro test e2e/flows/  # E2E
npx supabase db push   # apply migrations to remote
```

Deploying:
- JS-only: `eas update --branch production --message "..."` (OTA).
- Native changes: `eas build --platform ios --profile production` then `eas submit --platform ios --latest`.

The user is on Mac with local iOS build capability (Xcode + CocoaPods + Watchman). They develop on a physical iPhone running **iOS 26** — that detail matters for keyboard toolbar / safe-area math.

---

## §10. Verification protocol

After ANY change you intend to call "done":

1. `bun run typecheck` — must pass. (`bun test` is currently a no-op — no test files in the repo match the runner pattern. Don't rely on it as a signal.)
2. **User reloads on physical iPhone and tests the actual flow** — UI changes and behavior fixes are NOT verified by typecheck.
3. **For sync-related work, verify against the live database via the Supabase MCP.** Project ID: `jybiqufdvzdnsqarcddk`. Use `execute_sql` to confirm rows actually landed. Example after a coin spend: `select * from currency_ledger where child_id = '<child id>' order by created_at desc limit 5;`. The 8 sync paths from the BLOCKER work:
   1. Spend a coin → `currency_ledger` (negative amount, `reward_redemption`)
   2. Earn an accolade → `accolade_unlocks`
   3. Delete a session → row gone from `sessions`
   4. Add/edit/delete a measurement → `measurements`
   5. Add/edit/delete an external activity → `external_activities`
   6. Edit a session note → `sessions.note`
   7. Edit a drill note → `drill_results.note`
   8. Reorder drills/elements → `display_order` reflects the new order
   Each round-trips within ~30 seconds (engine idle poll).
4. Update relevant docs:
   - `UXWORKS.md` for UX work (running attempts log).
   - `docs/audits/fix-progress.md` for audit work (check the box, commit hash).
   - Feature specs in `docs/feature-specs/` if behavior diverged from spec.
5. Mark the relevant task in TodoWrite as completed (one task at a time, not in batch).

---

## §11. When you're done with the audit chunk

After Option A (cache invalidation, 3 findings):
- Update the tracker.
- Propose Option B (shared activity-data extraction — closes 4 architecture findings in one refactor).
- Wait for user approval before starting.

After all CRITICAL findings are closed, the audit is done. Per `docs/audits/fix-progress.md` line 12: "When every checkbox is checked (or explicitly skipped): `rm docs/audits/fix-progress.md`." The tracker self-destructs.

---

## §12. Stale artifacts you may notice (and what to do with them)

- `nextSession.md` was deleted 2026-05-19 — no longer present.
- **`/Users/ileanacuevas/.claude/plans/ive-enabled-plan-mode-steady-wind.md`** — a plan file generated during the keyboard side-quest. Executed and superseded by `docs/ux/forms.md`. Harmless but stale; outside the repo. Safe to ignore.

---

## §13. Cleanup

**Delete this file (`handoff.md`) when the next chunk is closed.** Like `nextSession.md` before it (and `forPC.md` before that), this is a one-shot handoff. Don't let it linger.

---

*Generated 2026-05-12, revised 2026-05-19 by Claude Opus 4.7 (1M context). The 2026-05-19 revision closed #14, committed unverified #15 code, and committed the working tree as a single checkpoint so work can resume on a different machine. Office Claude: verify #15 first; then #16.*
