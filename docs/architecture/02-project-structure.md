# Project Structure — Brinca
> Architectural decision record. Stack: Expo Router v5, React Native 0.83, TanStack Query v5, Zustand v5, expo-sqlite, MMKV, Supabase.

**Date:** April 15, 2026
**Author:** Architectural review
**Status:** Committed

---

## 1. TL;DR — the three decisions that matter most

- **Logic never lives in `app/`**: the `app/` folder holds only thin Expo Router route files; all screens, hooks, and data logic live under `src/features/`. This means Luis Eduardo can always find a feature's code in `src/features/<name>/` without hunting through route files, and a route rename never requires moving business logic.

- **Every write goes through SQLite first, never directly to Supabase**: a single offline queue in `src/lib/sync/` drains to Supabase in the background. This one rule is what makes the app work without a network connection — break it once and you have unpredictable data loss.

- **Features are islands**: no feature folder imports from another feature's components, hooks, or repositories. Shared state flows through `src/stores/`; shared UI flows through `src/shared/`. This keeps the codebase navigable as it grows and makes it safe to delete or rewrite any one feature without side effects.

---

## 2. Recommended structure

```
brinca/
├── app/                              # Expo Router routes — thin wrappers only
│   ├── _layout.tsx                   # Root layout: providers, auth guard, Sentry
│   ├── (auth)/                       # Auth group — outside the tab bar
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── onboarding/               # 3-step wizard as a nested stack
│   │       ├── _layout.tsx
│   │       ├── step-1.tsx
│   │       ├── step-2.tsx
│   │       └── step-3.tsx
│   ├── (tabs)/                       # 4-tab group
│   │   ├── _layout.tsx               # Tab bar + MiniPlayerBar rendered here
│   │   ├── home.tsx
│   │   ├── activity.tsx
│   │   ├── stats/
│   │   │   ├── index.tsx
│   │   │   └── [sessionId].tsx       # Session detail — stack push
│   │   └── profile.tsx
│   ├── (modals)/                     # Full-screen modals (presentFullScreen)
│   │   ├── session/
│   │   │   ├── index.tsx             # Active session screen — tab bar hidden
│   │   │   └── [drillId].tsx         # Drill screen — stacked inside the modal
│   │   └── session-summary.tsx
│   └── (settings)/                   # Settings stack — accessed via parent avatar
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── accounts-center/
│       │   ├── index.tsx
│       │   └── [memberId].tsx
│       ├── activities/
│       │   ├── index.tsx
│       │   ├── [activityId].tsx
│       │   └── [activityId]/[drillId].tsx
│       └── child/
│           ├── edit-profile.tsx
│           ├── measurements.tsx
│           └── external-activities.tsx
│
├── src/                              # All application logic
│   ├── features/                     # One folder per feature
│   │   ├── onboarding/
│   │   ├── home-dashboard/
│   │   ├── activity-selector/
│   │   ├── session-logging/          # ← expanded below
│   │   ├── activity-builder/
│   │   ├── stats/
│   │   ├── profile/
│   │   └── accounts-center/
│   ├── shared/                       # Cross-feature UI and utilities
│   │   ├── components/               # Reusable UI primitives (Toast, Skeleton, etc.)
│   │   ├── hooks/                    # Cross-feature hooks (useDestructiveAlert, etc.)
│   │   ├── tracking-elements/        # 18 element type definitions — shared schema
│   │   └── utils/                    # Pure utility functions
│   ├── stores/                       # App-level Zustand stores
│   │   ├── active-child.store.ts
│   │   ├── active-session.store.ts
│   │   └── ui-preferences.store.ts
│   ├── lib/                          # Infrastructure adapters (no React)
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── types.ts              # Supabase-generated — never edit manually
│   │   │   └── mappers.ts            # Supabase types → domain types
│   │   ├── sqlite/
│   │   │   ├── schema.ts             # Table definitions as TypeScript SQL strings
│   │   │   ├── db.ts                 # Singleton connection and migration runner
│   │   │   └── migrations/           # 0001_initial.ts, 0002_session_tables.ts, …
│   │   └── sync/
│   │       ├── queue.ts              # Append outbound ops; features write here
│   │       └── engine.ts             # Background drain: queue → Supabase
│   └── types/                        # Global type definitions
│       ├── database.types.ts         # Re-export of Supabase-generated types
│       ├── domain.types.ts           # Business entities (Child, Activity, Session…)
│       └── api.types.ts              # Shared request/response shapes
│
├── e2e/
│   └── flows/                        # Maestro YAML flows — one per user story
├── assets/                           # Static assets (images, fonts)
├── docs/                             # Feature specs and ADRs (these files)
└── app.config.ts                     # Expo config
```

**Expanded: `src/features/session-logging/`**

```
src/features/session-logging/
├── screens/
│   ├── SessionScreen.tsx             # Full-screen active session view
│   ├── DrillScreen.tsx               # Individual drill interaction
│   └── SessionSummaryScreen.tsx      # Post-session reward + accolade summary
├── components/
│   ├── MiniPlayerBar.tsx             # Persistent bar above tab bar
│   ├── DrillListItem.tsx             # One row in the drill list
│   ├── SessionTimer.tsx              # HH:MM:SS display, reads MMKV startTime
│   ├── SessionNotes.tsx              # Note + photo attachment at bottom of list
│   ├── elements/                     # Interactive element renderers for 18 types
│   │   ├── CounterElement.tsx
│   │   ├── CombinedCounterElement.tsx
│   │   ├── SplitCounterElement.tsx
│   │   ├── MultistepCounterElement.tsx
│   │   ├── StopwatchElement.tsx
│   │   ├── CountdownTimerElement.tsx
│   │   ├── LapTimerElement.tsx
│   │   ├── IntervalTimerElement.tsx
│   │   ├── ChecklistElement.tsx
│   │   ├── SingleSelectElement.tsx
│   │   ├── MultiSelectElement.tsx
│   │   ├── YesNoElement.tsx
│   │   ├── RatingScaleElement.tsx
│   │   ├── EmojiFaceScaleElement.tsx
│   │   ├── NumberInputElement.tsx
│   │   ├── MultiNumberInputElement.tsx
│   │   ├── FreeTextNoteElement.tsx
│   │   └── VoiceNoteElement.tsx
│   └── summary/
│       ├── RewardBreakdown.tsx
│       └── AccoladeUnlock.tsx
├── hooks/
│   ├── useSessionTimer.ts            # Timer start/pause/elapsed backed by MMKV
│   ├── useActiveSession.ts           # Reads active-session.store
│   └── useSessionPersistence.ts      # Auto-saves every action to SQLite
├── queries/
│   ├── keys.ts                       # TanStack Query key factory for sessions
│   └── useDrillsForSessionQuery.ts
├── mutations/
│   ├── useStartSessionMutation.ts
│   ├── useLogDrillMutation.ts
│   ├── useFinishSessionMutation.ts
│   └── useAddBonusMutation.ts
├── repositories/
│   ├── session.repository.ts         # SQLite read/write for sessions
│   └── drill-result.repository.ts    # SQLite read/write for per-drill results
├── types/
│   └── session.types.ts              # UI/view-model types for this feature only
├── utils/
│   └── tier-evaluator.ts             # Evaluate tier conditions against drill results
└── session-logging.test.ts           # Unit tests for tier-evaluator and hooks
```

---

## 3. Why this structure fits Brinca

**Decision 1 — Top-level folder: `src/features/` inside `src/` [HIGH]**

Expo Router v5 requires `app/` as the route directory. Any business logic placed inside `app/` becomes coupled to the routing layer — renaming a route requires moving files that contain logic. The `app/` / `src/` split enforces a clean boundary: route files are navigation declarations, not feature code. `features/` was chosen over `modules/` because every attached spec is titled "Feature spec" and Luis Eduardo will map spec documents to folders without any translation. A developer joining in month 6 reads the spec for `session-logging.md` and knows the code is in `src/features/session-logging/` — no legend required.

**Decision 2 — Expo Router v5 route organization [HIGH]**

Per session-logging.md, a mini player bar must persist across all four tabs during an active session. In Expo Router v5, the tab layout in `app/(tabs)/_layout.tsx` is a persistent React component that remains mounted across tab switches. Rendering `MiniPlayerBar` here — reading from `active-session.store.ts` — is the only way to achieve true persistence without reinventing the navigator. When the store's status is `idle`, the bar is invisible; when `active`, it appears above the tab bar on every screen. The session screen itself lives at `app/(modals)/session/index.tsx` with `presentation: 'fullScreenModal'`. Per session-logging.md, the tab bar is hidden during an active session — `fullScreenModal` hides the tab bar in iOS with zero custom code. The drill screen stacks inside the same modal group as `[drillId].tsx`, giving the push/pop navigation behavior the spec requires, and the back-swipe returns to the session screen rather than dismissing the modal.

**Decision 3 — Feature folder contents include repositories [HIGH]**

Per 01-stack-decision.md, writes go to SQLite first and sync to Supabase in the background. Each feature's `repositories/` folder owns the SQL operations for that feature's data. The central `src/lib/sqlite/` holds the schema definition and migration runner — infrastructure that is shared. Feature repositories consume the database connection from `src/lib/sqlite/db.ts` but own their own queries. This means deleting a feature also deletes its database operations, and the schema stays in one authoritative file. Per activity-builder.md, editing an activity that has a session in progress must not affect the in-progress session — the session repository can snapshot the configuration at session start precisely because it controls its own read operations.

**Decision 4 — Shared code split between `src/shared/` and `src/lib/` [HIGH]**

Two bins, not one. `src/shared/` is for code that depends on React (UI components, React hooks). `src/lib/` is for infrastructure adapters that do not depend on React (Supabase client, SQLite schema, sync engine, type mappers). Per ux-conventions.md, every screen implements the same shimmer skeleton, the same toast error pattern, and the same destructive alert. Centralizing these in `src/shared/components/` and `src/shared/hooks/` means a UX convention change touches one file, not eight. The sync engine lives in `src/lib/sync/` because it must be testable without mounting components — a pure TypeScript queue and drain loop.

**Decision 5 — TanStack Query: per-feature, keys in `queries/keys.ts` [HIGH]**

Query keys and hooks live in each feature's `queries/` folder. Each `keys.ts` exports a key factory (e.g., `sessionKeys.forChild(childId)`, `homeKeys.dashboard(childId)`). This is the pattern endorsed by TanStack Query's own documentation and fits the 2-person team because the query surface is co-located with the feature that owns it — deleting `stats/` deletes its queries. The one permitted cross-feature import is key-only: when `useLogDrillMutation` must invalidate the home dashboard after a session, it imports `homeKeys` from `@/features/home-dashboard/queries/keys.ts` to call `queryClient.invalidateQueries`. This import is narrow and one-directional — mutations may import key factories from other features, but never hooks or components.

**Decision 6 — Zustand: app-level stores + per-feature store [MEDIUM]**

Three app-level stores in `src/stores/` own state that multiple features read simultaneously. `active-child.store.ts` — which child is selected — is read by every tab (per home-dashboard.md, stats.md, profile.md, all reload when the active child changes). `active-session.store.ts` drives the MiniPlayerBar visibility and the Activity tab icon color change (per activity.md). `ui-preferences.store.ts` holds MMKV-persisted preferences including family measurement units. Feature-local state that only one feature reads (e.g., which drill is currently open on the session screen) lives inside that feature's own store. The rule from 01-stack-decision.md — "if it comes from Supabase, use TanStack Query; if it's UI, use Zustand" — is applied without exception.

**Decision 7 — Offline-first layer: `src/lib/sqlite/` + `src/lib/sync/` [HIGH]**

Per 01-stack-decision.md, the local SQLite database is the source of truth. `src/lib/sqlite/schema.ts` defines all table structures as TypeScript SQL strings. `src/lib/sqlite/db.ts` opens the database and runs pending migrations using expo-sqlite's built-in `migrate` API (no additional library needed — see stack gap note at the end of this section). `src/lib/sync/queue.ts` is an append-only table in SQLite that records every outbound write operation as a serialized JSON payload. `src/lib/sync/engine.ts` is a background process that polls the queue when a network connection is available and replays operations against Supabase. Conflict resolution is last-write-wins using `updated_at` timestamps — a deliberate choice given that per the product-vision.md use cases, the same drill result is never edited simultaneously by two users. A more sophisticated merge strategy is LOW confidence and deferred to V2 if real conflicts are observed.

**Decision 8 — The 18 tracking element types: shared definitions, feature-specific renderers [HIGH]**

Per activity-builder.md, the 18 types appear in three places with completely different interaction models: configuration UI (activity-builder), interactive logging UI (session-logging), and read-only historical display (stats/session-detail). The type definitions, config schemas, and validation rules for all 18 types live once in `src/shared/tracking-elements/types/`. The rendering components are feature-specific: `src/features/activity-builder/components/elements/` renders configuration forms, `src/features/session-logging/components/elements/` renders interactive widgets (counters tap to increment, timers tap to start), and `src/features/stats/components/elements/` renders static historical values. A single component with a `mode: 'config' | 'log' | 'display'` prop was rejected because on a 2-person team that component becomes unmaintainable within six months — each mode has different state, different validation, and different accessibility requirements.

**Decision 9 — Testing layout: colocated unit/component tests, `e2e/flows/` for Maestro [MEDIUM]**

Unit tests (`.test.ts`) and component tests (`.test.tsx`) are colocated next to the file they test. `tier-evaluator.ts` gets `tier-evaluator.test.ts` in the same folder. A drill component gets its `.test.tsx` beside it. Colocated tests are found instantly and deleted with the code they test — there is no `__tests__/` directory to keep in sync. Maestro E2E flows live in `e2e/flows/` as YAML files named after the user story (`log-session.yaml`, `complete-onboarding.yaml`, `switch-child.yaml`). Per 01-stack-decision.md, Maestro is the chosen E2E framework.

**Decision 10 — Naming conventions: kebab folders, PascalCase components, no barrels [HIGH]**

Folders are kebab-case (`session-logging`, `activity-builder`, `tracking-elements`). React component files are PascalCase.tsx (`DrillListItem.tsx`, `MiniPlayerBar.tsx`). All other TypeScript files are camelCase (`useSessionTimer.ts`, `active-session.store.ts`, `tier-evaluator.ts`). No `index.ts` barrel files anywhere. Three rules, zero exceptions. Screens are full-page views that map to a route file in `app/` and live in `features/<name>/screens/`. Components are sub-pieces used inside screens. The distinction matters because screens are where navigation params arrive; components are pure UI.

**Decision 11 — Imports: three path aliases, features are islands [HIGH]**

`tsconfig.json` defines four aliases: `@/features/`, `@/shared/`, `@/lib/`, `@/stores/`. Relative imports are only used within a feature folder (sibling files in the same directory). Imports that cross feature boundaries must use absolute aliases. The import rules are: (a) features freely import from `@/shared/`, `@/lib/`, and `@/stores/`; (b) features may import another feature's `queries/keys.ts` for cache invalidation only; (c) features must never import another feature's screens, components, hooks, repositories, or stores. This boundary means Luis Eduardo can audit every cross-feature dependency by searching for `@/features/<name>` in the codebase — every result is either a permitted key import or a violation.

**Decision 12 — Three categories of types in three locations [HIGH]**

Supabase-generated types live exclusively in `src/lib/supabase/types.ts`, regenerated via `supabase gen types typescript` after any schema change, committed in the same PR as the migration, and never edited by hand. Domain types — the app's own business entities (`Child`, `Activity`, `Drill`, `Session`, `TrackingElement`) — live in `src/types/domain.types.ts` and are mapped from Supabase types in `src/lib/supabase/mappers.ts`. UI/view-model types (e.g., `SessionSummaryViewModel` that flattens session + rewards + accolades for the summary screen) live inside the feature's `types/` folder. The dependency direction is enforced: Supabase types → domain types (via mapper) → view-model types. A schema change breaks the mapper at compile time, which forces a review of domain types, which surfaces any view-model impact.

**Stack gap:** expo-sqlite's `migrate` API (available since SDK 51) accepts an array of versioned SQL strings and handles sequential migrations. No external library is needed. Luis Eduardo should use it in `src/lib/sqlite/db.ts` to open the database and apply pending migrations on app start.

**Charting gap:** The stats feature requires a chart library (per stats.md: cumulative line chart + bar chart). No charting library is named in 01-stack-decision.md. **Victory Native XL** is the committed choice — it is built specifically for React Native New Architecture, has no native modules requiring custom build config, and is maintained by Formidable Labs. Ivan should add this to the stack decision document before Phase 4 begins.

---

## 4. Conventions the two developers will follow

1. Route files in `app/` export a single React component that imports a screen from `@/features/` — no business logic, no hooks, no data fetching inside route files. (Route files that contain logic cannot be reused and cannot be unit tested.)

2. Screens live in `src/features/<feature>/screens/` and are named `<ScreenName>Screen.tsx` — always with the `Screen` suffix. (The suffix makes it instantly clear which files are full-page views vs. sub-components when searching by file name.)

3. All Zustand stores are created with `zustand`'s `immer` middleware and, where state must survive app close, with `persist` middleware backed by MMKV — never AsyncStorage. (Per 01-stack-decision.md, MMKV is the chosen persistent store; AsyncStorage is not in the stack.)

4. TanStack Query read hooks are named `use<Entity>Query` and live in `src/features/<feature>/queries/`. Write hooks are named `use<Action>Mutation` and live in `src/features/<feature>/mutations/`. (Predictable names mean Luis Eduardo knows the file name before opening the folder.)

5. Query key factories are exported from `src/features/<feature>/queries/keys.ts` as a plain object (e.g., `sessionKeys.forChild(childId)`). This is the only file from a feature that another feature is permitted to import. (Centralizing keys per feature keeps cache invalidation correct across features without coupling component trees.)

6. SQLite repositories in `src/features/<feature>/repositories/` are plain TypeScript classes with async methods and no React imports. (Framework-free repositories are testable without mounting a component tree.)

7. Every write operation that must sync to Supabase is appended to `src/lib/sync/queue.ts` — never calls Supabase directly from a mutation. (This single rule is what makes offline-first work; bypassing the queue creates data loss scenarios on intermittent connections.)

8. The active child is always read from `@/stores/active-child.store` — never passed as a prop through the tab navigator. (All four tabs read the same store; prop-drilling through the navigator would require the root layout to own child state and re-render all tabs on switch.)

9. Session timer state (`startTime`, `pausedAt`, `totalPausedMs`) is stored in MMKV, not in Zustand in-memory state, because it must survive app process termination. The calculation is always `Date.now() - startTime` — never accumulated. (Per 01-stack-decision.md, accumulating elapsed time causes drift and breaks after a force-close.)

10. Components that implement the skeleton loading state import `SkeletonPlaceholder` from `@/shared/components/SkeletonPlaceholder.tsx`. (Per ux-conventions.md, shimmer animation is the loading standard for all list and dashboard screens; a shared component ensures one implementation across eight features.)

11. Toast messages call the utility at `@/shared/utils/toast.ts` with strings from the standard error strings defined in ux-conventions.md. (Centralizing toast calls means swapping the underlying library touches one file, and ensures error copy stays consistent with the spec.)

12. Native iOS alert confirmations for destructive actions use `@/shared/hooks/useDestructiveAlert.ts`, which wraps `Alert.alert` with the correct red destructive button style. (Per ux-conventions.md, all destructive confirmations use native iOS alerts — a shared hook prevents each feature from reimplementing the pattern differently.)

13. When adding a new tracking element type: create one config component in `activity-builder/components/elements/`, one interactive component in `session-logging/components/elements/`, one display component in `stats/components/elements/`, and add the type definition to `src/shared/tracking-elements/types/`. (The four files always travel together; the shared definition is the contract the three renderers implement.)

14. Folders are named in kebab-case; React component files are PascalCase.tsx; all other TypeScript files are camelCase.ts. (Three naming rules, zero exceptions — naming is never a decision Luis Eduardo has to make in the moment.)

15. No `index.ts` barrel files in any folder. Imports always name the specific file — `import { useSessionTimer } from '@/features/session-logging/hooks/useSessionTimer'`. (Barrels break tree-shaking in Metro, obscure where code lives, and make "Go to Definition" jump to the barrel instead of the implementation.)

16. `src/lib/supabase/types.ts` is regenerated via `bun run supabase gen types typescript` after every schema change and committed in the same PR as the migration file. (Stale generated types are a silent source of runtime crashes; atomic commits make the schema and its types change together.)

17. Domain types in `src/types/domain.types.ts` never import from `src/lib/supabase/types.ts` directly — the mapping is done once in `src/lib/supabase/mappers.ts`. Feature components import domain types, not Supabase types. (Decoupling means a Supabase column rename is caught at compile time in the mapper, not scattered across every component that renders that field.)

18. E2E flows in `e2e/flows/` are named after the user story they cover (`log-session.yaml`, `complete-onboarding.yaml`, `add-first-activity.yaml`). (User-story names make it clear what broke when a test fails, without reading the YAML file body.)

19. When adding a new feature, work in this order: (a) write the migration in `src/lib/sqlite/migrations/`, (b) add domain types to `src/types/domain.types.ts`, (c) write the repository, (d) write queries and mutations, (e) write the screen. (Starting with the data contract before the UI ensures component data shapes are driven by persistence requirements, not rendering convenience.)

20. Child switching is always blocked while a session is in progress. Any component or screen that attempts to trigger a child switch calls the `active-session.store` to check status first and shows the native iOS alert from `useDestructiveAlert` if a session is active. (Per activity.md and profile.md, this guard must be consistent across every entry point to child switching.)

---

## 5. Build order — scaffold sequence

### Phase 1 — Project boots, dev can see an empty Home tab (2–3 PRs)

**Folders and files created:**
- `app.config.ts` — bundle ID, EAS project ID, Sentry plugin, Expo Router config
- `app/_layout.tsx` — root provider tree: `QueryClientProvider`, global Zustand initialization, Sentry init
- `app/(tabs)/_layout.tsx` — 4-tab navigator, each tab renders a stub screen; `MiniPlayerBar` stub (invisible)
- `app/(tabs)/home.tsx`, `activity.tsx`, `stats/index.tsx`, `profile.tsx` — each imports a one-line stub from `src/features/`
- `src/lib/supabase/client.ts` — Supabase client with `sb_publishable_xxx` key
- `src/lib/sqlite/schema.ts` — complete table definitions as TypeScript SQL strings (define all tables now to avoid migration debt)
- `src/lib/sqlite/db.ts` — database open + migration runner using expo-sqlite's `migrate` API
- `src/lib/sqlite/migrations/0001_initial.ts` — first migration applying the full initial schema
- `src/stores/active-child.store.ts`, `active-session.store.ts`, `ui-preferences.store.ts`
- `src/shared/components/SkeletonPlaceholder.tsx`, `src/shared/utils/toast.ts`, `src/shared/hooks/useDestructiveAlert.ts`
- `tsconfig.json` with path aliases: `@/features`, `@/shared`, `@/lib`, `@/stores`

**Wired up:** App boots, four tabs render, SQLite opens and migration runs, no crash. Parent avatar area is a placeholder.

**Deferred:** Auth, real data, sync engine, all feature logic.

---

### Phase 2 — Onboarding works end to end (4–5 PRs)

**Folders and files created:**
- `app/(auth)/_layout.tsx`, `login.tsx`, `onboarding/step-1.tsx`, `step-2.tsx`, `step-3.tsx`
- `app/_layout.tsx` updated — auth guard: unauthenticated → `(auth)/login`; authenticated + no child → `(auth)/onboarding/step-1`; ready → `(tabs)/home`
- `src/features/onboarding/` — screens, mutations (`useCreateAccountMutation`, `useCreateChildMutation`, `useCreateActivityMutation`), types, repositories
- `src/types/domain.types.ts` — `User`, `Child`, `Activity` initial domain types
- `src/lib/supabase/mappers.ts` — first mappers: Supabase auth user → domain `User`
- `src/stores/active-child.store.ts` — populated after onboarding Step 2 completes

**Wired up:** New user creates account, adds first child, names first activity, lands on Home tab. Returning logged-in user lands on Home. Closing the app mid-onboarding resumes at the correct step.

**Deferred:** Email verification (stub — passes immediately in dev), social login (buttons visible but stubbed per onboarding.md's `⚠️` notes), sync engine (writes go to SQLite only in this phase).

---

### Phase 3 — Activity builder + session logging work offline (6–8 PRs)

**Folders and files created:**
- `src/shared/tracking-elements/types/` — all 18 element type definitions and config schemas (the shared contract between builder, logger, and display)
- `src/features/activity-builder/` — full feature: screens, all 18 config element components, queries, mutations, repositories
- `src/features/session-logging/` — full feature: all 18 interactive element components, `MiniPlayerBar`, `useSessionTimer` (MMKV-backed), auto-save persistence, tier evaluator
- `app/(settings)/activities/` routes wired to activity-builder screens
- `app/(modals)/session/` routes wired to session-logging screens
- `app/(modals)/session-summary.tsx` wired to `SessionSummaryScreen`
- `app/(tabs)/_layout.tsx` — `MiniPlayerBar` now reads `active-session.store` and renders when active; Activity tab icon reads same store for color change
- `src/lib/sync/queue.ts` — operational (mutations append here)
- `src/lib/sync/engine.ts` — background drain loop (SQLite queue → Supabase), starts when app comes online
- `src/lib/sqlite/migrations/0002_session_tables.ts` if any tables were deferred from 0001

**Wired up:** Parent builds an activity with drills and any of the 18 element types. Starts a session, logs drills, finishes session, sees summary with rewards. All writes go to SQLite immediately and sync to Supabase in the background. MiniPlayerBar persists across tabs during a minimized session. App closed mid-session: resumes correctly on reopen with the mini player bar visible.

**Deferred:** Stats charts, full reward display on Home, accolades list.

---

### Phase 4 — Sync, stats, profile, accounts all functional (5–7 PRs)

**Folders and files created:**
- `src/features/stats/` — full feature: session list, session detail, chart components (Victory Native XL — must be added to 01-stack-decision.md before this phase), all 18 display-only element renderers in `components/elements/`
- `src/features/home-dashboard/` — full Home screen with rewards, level badge, accolades, recent sessions wired to real TanStack Query data
- `src/features/profile/` — child switcher bottom sheet, measurement history, external activities, photo gallery
- `src/features/accounts-center/` — invite flow, role management, edit profile, delete account (two-step confirmation)
- `app/(settings)/accounts-center/`, `app/(settings)/child/` routes
- Supabase Storage buckets configured — child photos and session photos upload to Storage; local URI used while upload is pending, replaced on sync (per ux-conventions.md backend notes)

**Wired up:** All four tabs are fully functional with real data. Multi-user access (Admin + Co-admin sharing a family) works end to end with RLS. Stats charts display with current/previous period comparison. Profile tab is fully read-only. Settings screens cover all edit operations.

---

### Phase 5 — Polish and launch prep (3–4 PRs)

**Created:**
- `e2e/flows/complete-onboarding.yaml`, `log-session.yaml`, `add-activity.yaml`, `switch-child.yaml` — Maestro E2E flows covering the four critical paths
- Sign in with Apple implemented in `(auth)/login.tsx` — required for App Store submission
- Sentry source maps configured in EAS build pipeline
- RevenueCat SDK initialized (freemium gate; paywall UI deferred but SDK pipeline starts collecting data now)
- EAS Update `--environment` flag configured per 01-stack-decision.md breaking change
- COPPA review pass: confirm Sentry and RevenueCat are not receiving child identifiers without the parental consent gate established in onboarding

**Wired up:** App is submittable to the App Store. OTA update pipeline is live. Crash reporting active from first install.

---

## 6. Things deliberately rejected (and why)

**Monorepo (Turborepo or Nx):** A monorepo is justified when multiple deployable targets share TypeScript packages — a web app, an API server, and a mobile app. Brinca is iOS-only for V1 with a fully managed Supabase backend. There is no shared package to extract. A monorepo would add workspace protocol configuration and inter-package build orchestration that provides zero benefit and adds a build expert tax the 2-person team cannot afford.

**Domain-driven `src/domain/` layer with pure entities and use-case classes:** A formal domain layer makes sense when multiple teams need protection from each other's changes. On a 2-person team where the developer owns both the database schema and the UI, the abstraction adds indirection without protecting against anything — there is no "accidental coupling" risk because Luis Eduardo is the only person writing all three layers simultaneously.

**Barrel `index.ts` exports:** Barrels hide the actual file behind a folder name, interfere with Metro's tree-shaking, create circular dependency risks, and redirect "Go to Definition" to the barrel instead of the implementation. The convenience of `import { X } from '@/features/session-logging'` is not worth a single debugging session where Metro's module graph becomes circular.

**Feature-flag system:** Per product-vision.md, every V1 feature is fully spec'd and ships as a complete unit. A feature-flag system requires a management UI, flag cleanup discipline, and either a remote config service or a custom MMKV implementation — overhead with no payoff until V2 when the team grows and ships partial features to user segments.

**Code generator for feature scaffolding (Plop.js or similar):** With 8 features in V1, Luis Eduardo will scaffold each folder manually in under 5 minutes by copying the previous feature. A code generator must stay in sync with evolving conventions, and when a specific feature legitimately deviates from the template, the generator becomes misleading. The maintenance cost exceeds the time saved.

**XState or a custom state machine for session lifecycle:** Session logging has clear states (`idle → active → minimized → paused → complete`) that make a state machine appealing. However, per session-logging.md the transitions are linear and fully specified, and a Zustand store with an explicit `status` field of type `'idle' | 'active' | 'minimized' | 'paused' | 'complete'` achieves the same result with no library learning curve. XState's API is non-trivial; the cost of onboarding Luis Eduardo to it outweighs any benefit at this complexity level.
