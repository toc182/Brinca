# Architecture Boundaries Audit

**Audited:** 2026-05-01
**Rule:** Features are islands (`src/features/<X>/` cannot import from `src/features/<Y>/`)
**Scope:** `src/features/`, `src/shared/`, `src/lib/`, `src/stores/`, `src/types/`

---

## 1. Summary

Four cross-feature import violations were found, all in a single direction: `session-logging` screens importing repository functions directly from `activity-builder`. No other feature-to-feature edges exist. The islands rule is largely upheld — the violation surface is narrow (3 files, 4 import lines) but sits on hot paths (active session recording and drill navigation). No circular dependencies were detected. The previously flagged `useRedeemRewardMutation` violation from `docs/audits/home-dashboard.md` has been resolved: those functions now live in `src/features/home-dashboard/repositories/`.

---

## 2. Cross-feature import violations

| # | From | To | Severity | What's imported | Why it's a violation | Proposed home |
|---|------|----|----------|-----------------|----------------------|---------------|
| 1 | `session-logging/screens/SessionScreen.tsx:19` | `activity-builder/repositories/drill.repository` | CRITICAL | `getDrillsByActivity` | Session screen bypasses the islands rule to load the drill list for the active activity; a session-logging query should own this read | `src/shared/activity-data/drill.ts` (new) |
| 2 | `session-logging/screens/DrillScreen.tsx:14` | `activity-builder/repositories/drill.repository` | CRITICAL | `getDrillById` | DrillScreen (hottest path in the app) reads a single drill directly from activity-builder's repository | `src/shared/activity-data/drill.ts` (new) |
| 3 | `session-logging/screens/DrillScreen.tsx:15` | `activity-builder/repositories/tracking-element.repository` | CRITICAL | `getElementsByDrill` | DrillScreen reads tracking-element configs directly from activity-builder; these are needed during every drill interaction | `src/shared/activity-data/tracking-element.ts` (new) |
| 4 | `session-logging/screens/SessionSummaryScreen.tsx:21` | `activity-builder/repositories/bonus-preset.repository` | CRITICAL | `getBonusPresets` | Summary screen reads bonus preset definitions from activity-builder; the dependency is implicit (no session-logging query mediates it) | `src/shared/activity-data/bonus-preset.ts` (new) |

---

## 3. Intra-feature layering issues

| # | File | Severity | Issue | Evidence |
|---|------|----------|-------|----------|
| 1 | `activity-builder/components/BonusPresetSection.tsx:9` | MEDIUM | Component performs both data loading and writes directly against a repository, bypassing the queries/mutations layer; TanStack Query cache has no visibility into these reads | `import { getBonusPresets, deleteBonusPreset } from '../repositories/bonus-preset.repository'` |
| 2 | `activity-builder/components/TierRewardSection.tsx:9` | MEDIUM | Same pattern as #1 — component drives its own reads and deletes outside TQ | `import { getTierRewards, deleteTierReward } from '../repositories/tier-reward.repository'` |
| 3 | `activity-builder/components/elements/` (12 files) | MEDIUM | Every element-config component calls `updateElement` from `tracking-element.repository` on each user input. Writes are invisible to TQ cache; any read-dependent query must be manually invalidated after the component saves | `import { updateElement } from '../../repositories/tracking-element.repository'` — repeated in `ChecklistConfig`, `NumberInputConfig`, `SelectConfig`, `CounterConfig`, `EmojiFaceScaleConfig`, `SplitCounterConfig`, `RatingScaleConfig`, `YesNoConfig`, `IntervalTimerConfig`, `MultistepCounterConfig`, `LapTimerConfig`, `VoiceNoteConfig`, `CountdownTimerConfig` |
| 4 | `session-logging/screens/SessionScreen.tsx:20-21` | MEDIUM | Screen calls write-path repository functions (`getOrCreateDrillResult`, `markDrillComplete`, `updateSessionNote`) directly, bypassing the `mutations/` layer; mutations handle TQ invalidation and error boundaries | `import { getDrillResultsBySession, getOrCreateDrillResult, markDrillComplete } from '../repositories/drill-result.repository'` — write functions should be in `useLogDrillMutation` |
| 5 | `session-logging/screens/SessionSummaryScreen.tsx:18-20` | MEDIUM | Summary screen calls three read functions from own repositories directly (no TQ hook); if these reads are ever cached or need invalidation, there's no hook to update | `import { getDrillResultsWithDrillNames } from '../repositories/drill-result.repository'`; `import { getSessionById, getCompletedSessionCount } from '../repositories/session.repository'` |

---

## 4. Misplaced shared code

| # | File | Severity | Why it should move | Proposed home |
|---|------|----------|--------------------|---------------|
| 1 | ~~`activity-selector/hooks/useActiveSession.ts`~~ | ~~LOW~~ | **RESOLVED 2026-05-01 — finding was based on a wrong premise.** The rich `session-logging/hooks/useActiveSession.ts` had 0 imports (orphan, deleted). The remaining `activity-selector/hooks/useActiveSession.ts` has a single consumer (`ActivityScreen.tsx:16`) and no cross-feature import. All other call sites that need session state read `useActiveSessionStore` directly. No islands violation, no divergence risk. Promoting to shared was YAGNI. | n/a |

---

## 5. Recommendation

Extract four read functions from `activity-builder/repositories/` to a new `src/shared/activity-data/` module (`drill.ts`, `tracking-element.ts`, `bonus-preset.ts`). This one lift resolves all four CRITICAL cross-feature violations and creates a single canonical location for "read activity definitions during a session." The three session-logging screens then import from `src/shared/activity-data/` instead of `@/features/activity-builder/`. Do this before addressing the intra-feature MEDIUM findings, since the MEDIUM findings (component→repository direct calls) reflect an intentional inline-edit pattern that is consistent across the codebase and carries no cross-feature risk.

---

## 6. Fix checklist

### CRITICAL

- [ ] **#1–3 — Create `src/shared/activity-data/`** — Extract the following functions from `activity-builder/repositories/` into new shared files; update `activity-builder` screens to re-import from the shared location; update all three session-logging screens to use the shared imports:
  - `src/shared/activity-data/drill.ts` — `getDrillsByActivity`, `getDrillById` (currently in `activity-builder/repositories/drill.repository.ts`)
  - `src/shared/activity-data/tracking-element.ts` — `getElementsByDrill` (currently in `activity-builder/repositories/tracking-element.repository.ts`)
  - Fix: `session-logging/screens/SessionScreen.tsx:19` → `import { getDrillsByActivity } from '@/shared/activity-data/drill'`
  - Fix: `session-logging/screens/DrillScreen.tsx:14-15` → `import { getDrillById } from '@/shared/activity-data/drill'` and `import { getElementsByDrill } from '@/shared/activity-data/tracking-element'`

- [ ] **#4 — Create `src/shared/activity-data/bonus-preset.ts`** — Extract `getBonusPresets` from `activity-builder/repositories/bonus-preset.repository.ts` into the shared module:
  - Fix: `session-logging/screens/SessionSummaryScreen.tsx:21` → `import { getBonusPresets } from '@/shared/activity-data/bonus-preset'`

### MEDIUM

- [ ] **#1–2 — Wrap `BonusPresetSection` and `TierRewardSection` reads in TQ queries** — Move `getBonusPresets` and `getTierRewards` calls into `activity-builder/queries/useBonusPresetsQuery.ts` and `activity-builder/queries/useTierRewardsQuery.ts`; components receive data via props or call the hooks. Keep delete calls in dedicated `mutations/` files with proper `queryClient.invalidateQueries` calls.

- [ ] **#3 — Audit element-config components' `updateElement` calls** — These 12 files bypass TQ entirely; each save should either use a mutation from `activity-builder/mutations/` or manually call `queryClient.invalidateQueries({ queryKey: activityBuilderKeys.all })` after the write to keep the drill detail cache coherent. Verify the existing invalidation in `DrillEditScreen` and `ActivityDetailScreen` covers these component-level saves — if not, add `useMutation` wrappers.

- [ ] **#4–5 — Move write calls out of `SessionScreen` into mutations** — `getOrCreateDrillResult`, `markDrillComplete`, and `updateSessionNote` are currently called directly from `SessionScreen`; these should live in `useLogDrillMutation` (add `getOrCreateDrillResult` to its flow) or a new `useMarkDrillCompleteMutation`. Keep the read `getDrillResultsBySession` as a `useQuery` call.

### LOW

- [x] ~~**#1 — Consolidate `useActiveSession`**~~ — **RESOLVED 2026-05-01.** The rich session-logging version was an orphan (0 imports) and was deleted. The activity-selector version has a single consumer and no cross-feature reach; left in place. See §4 for details.
