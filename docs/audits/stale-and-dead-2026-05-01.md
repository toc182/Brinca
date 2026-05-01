# Stale References & Dead Code Audit

**Audited:** 2026-05-01
**Scope:** src/, app/, modules/, supabase/migrations/
**Method:** import-graph traversal + repo-wide reference scanning

---

## 1. Summary

The Brinca codebase is in good health. **0 stale references** were found that would crash at runtime. **2 dead code artifacts** identified: one unused hook in the sync module and one duplicate hook in session-logging that has a cleaner replacement. Console logging outside __DEV__ blocks is present but not in hot paths. The codebase is TypeScript strict and uses Zustand + TanStack Query correctly throughout.

---

## 2. Stale references

| # | What | Severity | Description | Evidence | Why it's stale |
|---|------|----------|-------------|----------|----------------|
| (none found) | — | — | All imports resolve correctly. Supabase column selections match latest schema. | — | — |

---

## 3. Dead code

| # | What | Severity | Description | Evidence | Verified by |
|---|------|----------|-------------|----------|-------------|
| 1 | useNetworkStatus in sync module | LOW | Hook never imported. Share-like duplicate exists in @/shared/hooks. Sync one is orphaned, unused. | `/src/lib/sync/useNetworkStatus.ts` | `grep -r "lib/sync/useNetworkStatus"` returns 0 results. Used hook is at `/src/shared/hooks/useNetworkStatus.ts` with 5 imports. |
| 2 | useActiveSession in session-logging | LOW | Duplicate hook. Cleaner version used from activity-selector. Both return `isActive` but session-logging also returns `status, sessionId, activityId, activityName, isIdle`. Only activity-selector version (`isActive` only) is imported. Session-logging version is orphaned. | `/src/features/session-logging/hooks/useActiveSession.ts` | `grep -r "session-logging/hooks/useActiveSession"` returns 0 results. Activity-selector version imported in ActivityScreen (5 uses total). |
| 3 | Console.warn (non-__DEV__) in CreateActivityScreen | LOW | Debug console.warn on lines 35–36 signal early guard failures. Not in __DEV__. Low risk—logs only on developer error, not user code path. | `/src/features/activity-builder/screens/CreateActivityScreen.tsx:35–36` | Lines: `console.warn('[CreateActivity] childId is null')` and `console.warn('[CreateActivity] name is invalid')` |
| 4 | Console logging in rehydrate.ts (non-__DEV__) | LOW | FK chain diagnostic logs on lines 26, 53, 78, 114, 148. Help debug data sync issues but should be in __DEV__ or removed for production. | `/src/lib/sync/rehydrate.ts:26,53,78,114,148` | Lines include `console.log('[FK]...')`, `console.warn('[FK]...')`, and `console.error('[FK]...')`. Low risk—only runs on app init and session restoration. |

---

## 4. Recommendation

**Priority:** Remove the two orphaned hooks and wrap diagnostic console logs in `if (__DEV__)` guards. These changes are low-risk cosmetic refactoring with zero runtime impact.

1. Delete `/src/lib/sync/useNetworkStatus.ts` (replaced by cleaner `/src/shared/hooks/useNetworkStatus.ts`).
2. Delete `/src/features/session-logging/hooks/useActiveSession.ts` (activity-selector version is the canonical hook; session-logging components don't import it).
3. Wrap console logs in `rehydrate.ts` with `if (__DEV__) { ... }` to reduce spam in production builds.
4. Wrap CreateActivityScreen console.warn in `if (__DEV__) { ... }`.

---

## 5. Fix checklist

### LOW
- [ ] **#1** — Remove orphaned sync useNetworkStatus hook — `/src/lib/sync/useNetworkStatus.ts` — Delete file entirely. Shared version is the canonical implementation.
- [ ] **#2** — Remove orphaned session-logging useActiveSession hook — `/src/features/session-logging/hooks/useActiveSession.ts` — Delete file entirely. Activity-selector version is imported and used.
- [ ] **#3** — Wrap CreateActivityScreen console.warn in __DEV__ guard — `/src/features/activity-builder/screens/CreateActivityScreen.tsx:35–36` — Replace inline `console.warn()` with `if (__DEV__) { console.warn(...) }` or remove.
- [ ] **#4** — Wrap rehydrate.ts console logs in __DEV__ guard — `/src/lib/sync/rehydrate.ts:26,53,78,114,148` — Wrap all FK diagnostic logs with `if (__DEV__) { ... }` to reduce production noise.
