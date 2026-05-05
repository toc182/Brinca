# Handoff to next Claude (continuing on PC at work)

This is a context dump of the 2026-05-04 → 05-05 session at home (Mac). Pick up here on the PC.

---

## Status snapshot

- ✅ LOW phase: closed
- ✅ MEDIUM phase: closed (DB hardening migration deployed 2026-05-01 to project `jybiqufdvzdnsqarcddk`)
- ⏳ CRITICAL phase: 3 closed via coupling, ~14 remaining
- ⏳ BLOCKER phase: **4 closed today, 6 remaining** (the sync-queue cluster: code-correctness #1–6)

Source of truth tracker: [`docs/audits/fix-progress.md`](docs/audits/fix-progress.md). Read this first.

---

## What landed today (2026-05-01 → 05-05)

In chronological order. All on `main`. Tracker commits omitted from this list except where noted.

| Commit | Summary |
|---|---|
| `d5c5910` | DB hardening migration: 5 MEDIUM RLS + FK fixes (families.INSERT, accolade_unlocks.INSERT, invites UPDATE, invites.invited_by CASCADE, sessions/drill_results/element_values RESTRICT) |
| `e5e1fff` | Tracker: MEDIUM phase closed |
| `19371ee` | Tracker: d5c5910 deployed (verified on remote) |
| `7d42966` | Storage RLS + currency_ledger fraud — 3 BLOCKERs in one migration: `avatars`/`session-media` path scoping + `currency_ledger.INSERT` source-conditional rules |
| `7512303` | Tracker: 3 BLOCKERs closed |
| `5c0344a` | IntervalTimer rest phase reads frozen 'work' phase from setInterval closure — closed code-correctness #7 BLOCKER |
| `2f13908` | Tracker: 4 BLOCKERs closed |
| `429d5af` | DrillEditScreen: auto-open config sheet when adding a tracking element (UX gap surfaced during IntervalTimer testing) |
| `f92dd8c` | DrillEditScreen: `await refetchElements` before opening config sheet — fixed race in 429d5af |
| `4bcdcf9` | Element configuration popup: editable name field at the top (new component `ElementLabelInput`) |
| `f0415dc` | Element configuration popup: Done button + save-on-close safety net |
| `db4fdf6` | DrillEditScreen.handleSave: invalidate drill queries after name save (was saving to SQLite but UI didn't refresh until app reload) |
| `22777ed` | Mount GlobalToast inside `(settings)` and `(modals)` navigators (toasts were rendering behind iOS native modals) |
| `44afff1` | Toast: stack-aware listener — only the topmost layer renders (fixes "two toasts" symptom) |

---

## OPEN PROBLEM — toast still wrong (start here)

The user just reported (and was right to be frustrated): after the stack-aware toast fix in `44afff1`, when you save the drill name from inside the `(settings)` modal, you see one toast (correct, in the modal layer). But if you then navigate back to home **while the toast is still in its 4-second display window**, you see a SECOND toast appear at root level.

### Root cause (confirmed by reading the code)

In `src/shared/utils/toast.ts`, the `subscribeToast` cleanup runs `notify()` after splicing the unmounted listener. If `currentState.visible` is still `true` at that moment, `notify()` hands the toast off to the new topmost listener. So the toast "follows" you to the home layer when you leave the modal.

That's the bug. The intended behavior is: a toast is owned by the layer it was fired from. If that layer goes away mid-toast, the toast goes with it.

### Fix options to discuss with the user

**A.** When a layer unmounts while a toast is visible, dismiss the toast globally instead of transferring. One line change in the unsubscribe cleanup: don't call `notify()` on unsubscribe — instead call `dismissToast()` if the leaving listener was the topmost.

**B.** Track which layer "owns" the current toast (a counter or id at toast-fire time). On unsubscribe, if the leaving listener was the owner, dismiss. Otherwise, do nothing. More robust but more state.

**C.** Don't notify on subscribe/unsubscribe at all. Listeners only ever react to fresh `showToast`/`dismissToast` calls. Simplest. Tradeoff: if a toast is mid-flight when a modal opens, it stays on the previous (now-buried) layer until it times out — back to the original "hidden behind modal" symptom for that one toast. Probably acceptable since toasts are short.

My lean is **A** — a leaving topmost layer dismisses the toast. Matches the "toasts belong to their context" mental model. ~3 line change.

But **don't fix it yet** — confirm with the user first. They explicitly told me earlier in this session: "next time, dont take action until we are sure of whats the problem." See memory file `feedback_diagnose_first.md`.

---

## WIP working tree — DO NOT STAGE INDISCRIMINATELY

The user has 70+ uncommitted unrelated changes in the working tree. These are their feature WIP and must not be committed by you. Pattern:

1. **Always `git status --short` before staging.**
2. **Stage by exact path**, never `git add -A` or `git add .`.
3. **For files where your edits mix with their WIP**, use the temp-file dance:
   - `cp <file> /tmp/<file>.user-wip` — save WIP
   - `git checkout HEAD -- <file>` — restore HEAD baseline
   - apply your edits
   - `git add <file>` — stage clean
   - commit
   - `cp /tmp/<file>.user-wip <file>` — restore WIP to working tree
   - **Important caveat I learned the hard way:** if your committed change overlaps a region the WIP file doesn't have, the cp will silently undo your committed change in the working tree. After cp, re-apply your committed edits as in-working-tree edits so the working-tree diff vs HEAD shows ONLY the WIP, never your committed work backwards.

I used this dance on `DrillEditScreen.tsx` multiple times today. Files known to have user WIP:
- `app.config.ts`, `CLAUDE.md`, `bun.lock`, `package.json`, `package-lock.json`
- `src/features/activity-builder/screens/DrillEditScreen.tsx` (Screen wrapper)
- `src/features/session-logging/screens/SessionSummaryScreen.tsx`
- ~70 other files (run `git status --short` to see)
- Untracked: two April-26 migrations (already applied to remote via dashboard), `.claude/settings.json`, `TESTINGGUIDE.md`, `docs/brand/`, `docs/design-system/`, `docs/research/design-playbook/`, `docs/ux/`

Any time I committed today, I committed only the specific files I edited intentionally.

---

## User preferences (from memory)

The persistent memory directory is `/Users/ileanacuevas/.claude/projects/-Users-ileanacuevas-Developer-Toc-Brinca/memory/`. Read `MEMORY.md` first; it indexes the entries.

Critical preferences saved this session:
- **Plain language, no jargon.** Drop technical words. Describe what a person using the app sees. Short beats long.
- **Diagnose first, fix second.** Never speculate-and-ship. Confirm root cause before writing any code. (`feedback_diagnose_first.md`)
- **Choice-presentation format.** Status snapshot → brief framing → A/B options labeled and explained → my lean stated explicitly → single closing question. (`feedback_choice_format.md`)
- **Pre-launch state** — only the user's own data on the remote Supabase project. Hard cutovers are safe; skip data-migration ceremony. (`project_prelaunch_state.md`)

---

## Action items still pending the user (verify before doing related work)

1. **EAS dev build** — needed to verify the camera/photo picker fix in `d6db6f1` (added NSCameraUsageDescription + NSPhotoLibraryUsageDescription to `app.config.ts`). Native rebuild required because it's a native config change.
2. **Email verify round-trip** — verification of `bf8bfe3` (email-verify callback uses refs instead of stale state). Needs a real signup with email-link round-trip; deferred until fresh-signup work.
3. **Toast layer-transition bug** — described above. Open issue.

---

## What's left in the audit

### BLOCKERs — 6 remaining (the sync-queue cluster)

These are code-correctness findings #1–6. The recommended approach is to introduce a `withQueuedWrite(table, op, payload)` helper that wraps SQLite write + queue append in one transaction, then retrofit the 5 paths that currently write to SQLite without queueing the change for sync, plus fix one head-of-line-blocking bug in the sync drainer.

- [ ] Currency ledger never queued — code-correctness #1
- [ ] Accolade unlocks never queued — code-correctness #2
- [ ] Session deletes never queued — code-correctness #3
- [ ] Measurement writes never queued — code-correctness #4
- [ ] External activity writes never queued — code-correctness #5
- [ ] Sync queue head-of-line blocking — code-correctness #6

This bundle also closes CRITICAL #8, #9, #10 (session/drill notes never queued, reorder-drills/elements append outside transaction). 9 audit findings closed in one structural change. Single most consequential remaining piece.

### CRITICAL phase — ~14 remaining

Cluster summary (full detail in `docs/audits/code-correctness-2026-05-01.md`):
- Cache invalidation (3): useAddBonusMutation, empty-string activity key, markDrillComplete no-invalidate
- Domain logic (2): streak calculator UTC bug, shared debounce ref dropping element values
- DB drift (2): verify `family_members.profiles!inner` embed; FK indexes migration (~17 indexes)
- Cross-feature imports (4 in 1 lift): extract `getDrillsByActivity`, `getDrillById`, `getElementsByDrill`, `getBonusPresets` to `src/shared/activity-data/`
- Sync writes (3): folded into the BLOCKER sync-queue bundle as side effects

---

## How to start your session on the PC

1. `git pull` to get today's commits.
2. Read `docs/audits/fix-progress.md` to confirm tracker state.
3. Run `git log --oneline -15` to verify commits arrived.
4. Run `git status --short | head` — there will still be a long list of WIP unrelated to my work; respect it.
5. Read this file's "OPEN PROBLEM" section above — confirm the diagnosis with the user before fixing.
6. If user wants to move on from the toast issue, the obvious next chunk is the **sync-queue BLOCKER bundle** (largest structural piece left). Per the user's saved choice-format preference, present options A/B and your lean before starting.

---

## Reference docs

- `docs/audits/fix-progress.md` — live tracker, source of truth
- `docs/audits/architecture-2026-05-01.md`
- `docs/audits/code-correctness-2026-05-01.md`
- `docs/audits/db-code-drift-2026-05-01.md`
- `docs/audits/stale-and-dead-2026-05-01.md`
- `CLAUDE.md` — project conventions (start-of-phase process, stack, structure, NEVER-do list)
- `docs/architecture/04-offline-sync.md` — relevant for the sync-queue BLOCKER bundle
- `docs/ux/navigation.md` — modal/toast convention (note from this session: every modal navigator must mount its own `<GlobalToast />` — was discussed for inclusion but not yet written into the doc; see commit `22777ed` rationale)

---

## Memory dir reminder

Memory files live at `/Users/ileanacuevas/.claude/projects/-Users-ileanacuevas-Developer-Toc-Brinca/memory/`. The directory is per-machine — when you start on the PC, the memory directory there will be empty until you populate it. Either bring the four current memory files over via git (they're not in git now) or let the new session re-derive them from this handoff.

Files currently in memory:
- `MEMORY.md` — index
- `feedback_choice_format.md`
- `project_prelaunch_state.md`
- `feedback_plain_language.md`
- `feedback_diagnose_first.md`

Suggest the new session re-create them after reading this doc.

---

*Generated 2026-05-05 by Claude Opus 4.7 (1M context).*
