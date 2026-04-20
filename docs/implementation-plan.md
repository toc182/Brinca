# Implementation Plan — Brinca V1

> **Purpose:** Sequenced checklist from project bootstrap to App Store
> submission. Each phase has concrete done criteria. Delete this file
> after V1 ships.
>
> **How to use:** Work through phases in order. Check off steps as you
> complete them. A phase is done when its done criteria are met.
>
> **Parallel opportunities:** Phases 2 and 3 are independent and can be
> built in parallel. Phases 7 and 8 are independent and can be built in
> parallel.

## Phase overview

| Phase | Title | Depends on | Status |
|-------|-------|------------|--------|
| 1 | Project boots, dev can see an empty Home tab | — | ✅ |
| 2 | Design system, i18n, and shared UI primitives | 1 | ✅ |
| 3 | Supabase backend: schema, RLS, auth, storage | 1 | ✅ |
| 4 | User can create an account and complete onboarding | 2, 3 | ✅ |
| 5 | Parent can build a custom activity with drills and rewards | 4 | ✅ |
| 6 | Parent can log a full session offline and see a reward summary | 5 | ✅ |
| 7 | Home shows real progress; Stats shows charts and history | 6 | ✅ |
| 8 | Profile shows child info; Accounts Center manages family | 6 | ✅ |
| 9 | App is submittable to the App Store | 7, 8 | ✅ (code complete — external steps remain) |

---

## Phase 1 — Project boots, dev can see an empty Home tab

### Dependencies
None — this is the starting point.

### PR 1: Project config + infrastructure layer
- [x] 1.1 Convert `app.json` → `app.config.ts` — bundle ID, EAS project ID, Sentry plugin, Expo Router config
- [x] 1.2 Update `tsconfig.json` with path aliases: `@/features/*`, `@/shared/*`, `@/lib/*`, `@/stores/*`, `@/types/*`
- [x] 1.3 Install dependencies — `@tanstack/react-query`, `zustand`, `immer`, `expo-sqlite`, `react-native-mmkv`, `expo-secure-store`, `@supabase/supabase-js`; dev: `jest`, `@testing-library/react-native`, `@types/jest`
- [x] 1.4 Create `src/shared/theme.ts` — v0 design tokens from `ux-conventions.md` §2 (colors, typography, spacing, radii, shadows)
- [x] 1.5 Create `src/lib/supabase/client.ts` — Supabase client with placeholder env vars
- [x] 1.6 Create `src/lib/sqlite/schema.ts` — complete table definitions as TypeScript SQL strings (all 20 tables from `05-database-schema.md`)
- [x] 1.7 Create `src/lib/sqlite/db.ts` — database open + migration runner with WAL mode + foreign keys
- [x] 1.8 Create `src/lib/sqlite/migrations/0001_initial.ts` — first migration applying the full initial schema
- [x] 1.9 Delete template files no longer needed: `components/`, `constants/`, `app/+html.tsx`, `app/+not-found.tsx`, `app/modal.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/two.tsx`

### PR 2: Zustand stores + shared utilities
- [x] 2.1 Create `src/stores/active-child.store.ts` — Zustand + immer + MMKV persist (uses `createMMKV` v4 API)
- [x] 2.2 Create `src/stores/active-session.store.ts` — Zustand + immer, status: `idle | active | minimized | paused | complete`
- [x] 2.3 Create `src/stores/ui-preferences.store.ts` — Zustand + immer + MMKV persist (uses `createMMKV` v4 API)
- [x] 2.4 Create `src/shared/components/SkeletonPlaceholder.tsx` — shimmer skeleton component
- [x] 2.5 Create `src/shared/utils/toast.ts` — toast utility with standard error/success strings
- [x] 2.6 Create `src/shared/hooks/useDestructiveAlert.ts` — native iOS alert wrapper for destructive confirmations

### PR 3: Route layer + stub screens
- [x] 3.1 Create stub screens in `src/features/` — `home-dashboard/screens/HomeScreen.tsx`, `activity-selector/screens/ActivityScreen.tsx`, `stats/screens/StatsScreen.tsx`, `profile/screens/ProfileScreen.tsx`
- [x] 3.2 Create `src/features/session-logging/components/MiniPlayerBar.tsx` — invisible stub that reads `active-session.store`
- [x] 3.3 Rewrite `app/(tabs)/_layout.tsx` — 4-tab navigator (Home, Activity, Stats, Profile), renders MiniPlayerBar stub
- [x] 3.4 Create `app/(tabs)/home.tsx`, `activity.tsx`, `stats/index.tsx`, `profile.tsx` — thin wrappers importing from `src/features/`
- [x] 3.5 Rewrite `app/_layout.tsx` — root provider tree: `QueryClientProvider`, splash screen, SQLite database initialization
- [x] 3.6 Create `src/types/domain.types.ts`, `database.types.ts`, `api.types.ts` — placeholder type files

### Done criteria
App boots, four tabs render with stub screens, SQLite opens and migration runs, no crash. Parent avatar area is a placeholder.

### Implementation notes
- `@sentry/react-native` deferred to Phase 9 — not needed until crash reporting is wired up.
- MMKV v4 uses `createMMKV()` factory instead of `new MMKV()`, and `.remove()` instead of `.delete()`.
- `newArchEnabled` removed from `app.config.ts` — already the default in Expo SDK 55.
- Typecheck passes clean. Committed on `feature/phase-1-bootstrap`, merged to `main`.

---

## Phase 2 — Design system, i18n, and shared UI primitives

### Dependencies
Phase 1 complete. **Independent of Phase 3** — can be built in parallel.

### PR 1: Brand fonts + icon library + design tokens
- [x] 1.1 Install `@expo-google-fonts/fredoka`, `@expo-google-fonts/lexend`, `@expo-google-fonts/jetbrains-mono` — the three brand fonts from `brand-decisions.md` §4
- [x] 1.2 Install `phosphor-react-native` v3 — icon library (1,200+ icons, 6 weights including Duotone). Note: `brand-decisions.md` originally referenced `react-native-phosphor`; corrected to `phosphor-react-native` (same repo, v3 is current). `brand-decisions.md` updated.
- [x] 1.3 Install `@gorhom/bottom-sheet` — bottom sheet library per `brand-decisions.md` §13
- [x] 1.4 Install `expo-haptics` — haptic feedback for interactive elements
- [x] 1.5 Rewrite `src/shared/theme.ts` — full brand palette (Playful Purple), typography (Fredoka/Lexend/JetBrains Mono), spacing, radii (added `xs` and `xl`), shadows (added `xl`), touch targets, animation spring configs, icon sizes
- [x] 1.6 Update `app/_layout.tsx` — load 6 font weights with `useFonts`, gate rendering on fonts + DB readiness
- [x] 1.7 Also installed: `expo-linear-gradient`, `react-hook-form`, `expo-localization`, `i18next`, `react-i18next` (pulled forward from PR 3 since root layout imports i18n config)

### PR 2: Shared UI components
- [x] 2.1 Create `src/shared/components/Button.tsx` — primary, secondary, destructive, text, ghost variants, pill option for kid CTAs
- [x] 2.2 Create `src/shared/components/Card.tsx` — surface background, `shadowSm`, `radiusMd`, `border-subtle` border
- [x] 2.3 Create `src/shared/components/Input.tsx` — all 5 states (default, focused, filled, error, disabled), static top label, focus halo, error tint background
- [x] 2.4 Create `src/shared/components/Avatar.tsx` — circular photo with initials fallback, 3 sizes (small/medium/large)
- [x] 2.5 Create `src/shared/components/EmptyState.tsx` — title + body + optional CTA button
- [x] 2.6 Create `src/shared/components/Badge.tsx` — tint-50 bg + 700-shade text, 6 status variants (active/completed/paused/missed/scheduled/achievement)
- [x] 2.7 Create `src/shared/components/ProgressBar.tsx` — linear bar, adult (4pt primary) and kid (10pt accent) variants
- [x] 2.8 Create `src/shared/components/Toast.tsx` — animated top-positioned toast, 4 variants, left border + auto-dismiss with variant-specific durations
- [x] 2.9 Update `src/shared/components/SkeletonPlaceholder.tsx` — violet-tinted shimmer (`#E8E5F2` base, `#F4F2FA` highlight)
- [x] 2.10 Update `src/shared/utils/toast.ts` — imperative toast manager with `showToast`, `dismissToast`, `subscribeToast` API
- [x] 2.11 Update `src/shared/hooks/useDestructiveAlert.ts` — uses i18n for bilingual Cancel/Delete defaults

### PR 3: i18n setup + bilingual copy
- [x] 3.1 Installed `expo-localization` + `i18next` + `react-i18next` (in PR 1 batch)
- [x] 3.2 Create `src/shared/i18n/config.ts` — i18n init, detect device locale via `getLocales()`, fallback to English
- [x] 3.3 Create `src/shared/i18n/en.json` — all English copy: CTAs, toasts, celebrations, gentle misses, empty states, validation, errors, alerts from `brand-decisions.md` §2
- [x] 3.4 Create `src/shared/i18n/es.json` — all Spanish copy: matching keys
- [x] 3.5 Create `src/shared/i18n/useTranslation.ts` — thin wrapper hook
- [x] 3.6 Root layout imports `@/shared/i18n/config` to initialize i18n at startup

### PR 4: Domain types
- [x] 4.1 Fill out `src/types/domain.types.ts` — 18 interfaces + type aliases: `User`, `Family`, `FamilyMember`, `Invite`, `Child`, `Activity`, `Drill`, `TrackingElement`, `TierReward`, `TierCondition`, `BonusPreset`, `Session`, `DrillResult`, `ElementValue`, `CurrencyLedgerEntry`, `Reward`, `AccoladeUnlock`, `Measurement`, `ExternalActivity` + all enums (`TrackingElementType` with 18 types, `FamilyRole`, `Gender`, `RewardState`, etc.)
- [x] 4.2 Fill out `src/types/api.types.ts` — `ApiResponse<T>`, `SyncQueueEntry`, `SyncOperation`, `SyncStatus`

### Done criteria
All shared UI components render correctly with brand tokens. App detects device language and shows English or Spanish copy. `bun run typecheck` passes. Domain types cover all 20 tables.

### Implementation notes
- `phosphor-react-native` v3 used instead of `react-native-phosphor` — both resolve to the same GitHub repo, v3 is current. `brand-decisions.md` Libraries table updated.
- All Phase 2 deps installed in one batch (fonts, icons, bottom-sheet, haptics, i18n, linear-gradient, react-hook-form).
- Tab layout updated: `colors.accent` → `colors.primary500` to match new token names.
- i18n initialized as side-effect import in root layout — no provider wrapper needed (react-i18next v17 handles this).
- Typecheck passes clean. Committed on `feature/phase-2-design-system`.

---

## Phase 3 — Supabase backend: schema, RLS, auth, storage

### Dependencies
Phase 1 complete (need `src/lib/supabase/client.ts`). **Independent of Phase 2** — can be built in parallel.

### PR 1: Supabase project + schema deployment
- [x] 1.1 Create Supabase project — project ref: `jybiqufdvzdnsqarcddk`
- [x] 1.2 Create `.env` with credentials (gitignored) + `.env.example`
- [x] 1.3 `supabase init` + `supabase link`, single migration with all 18 tables + RLS + helpers + triggers + storage buckets
- [x] 1.4 Deployed via `npx supabase db push`
- [x] 1.5 CASCADE rules included in migration (ON DELETE CASCADE on all FK relationships per schema doc §4)

### PR 2: RLS policies
- [x] 2.1 4 helper functions (`is_family_member`, `get_family_role`, `has_write_access`, `is_admin_or_coadmin`) — `SECURITY DEFINER` + `STABLE`
- [x] 2.2 SELECT/INSERT/UPDATE/DELETE policies on all tables with role-based access per schema doc §3
- [x] 2.3 `currency_ledger` — SELECT + INSERT only (append-only)
- [x] 2.4 `accolade_unlocks` — SELECT + INSERT only (permanent)
- [x] 2.5 Polymorphic `tier_rewards`/`bonus_presets` — CASE-based RLS resolving `parent_type`
- [ ] 2.6 RLS cross-family isolation testing — deferred to Phase 4 when auth users exist

### PR 3: Auth config + storage buckets + generated types
- [x] 3.1 Auth email/password — enabled by default on Supabase
- [ ] 3.2 Apple sign-in provider — deferred to Phase 9 (requires Apple Developer account)
- [x] 3.3 Storage buckets `avatars` and `session-media` created (private, via migration)
- [x] 3.4 Storage RLS — authenticated users can read/write (tighter family-scoped policies in Phase 8)
- [x] 3.5 `npx supabase gen types typescript` → `src/lib/supabase/types.ts`
- [x] 3.6 `src/lib/supabase/mappers.ts` — 13 mapper functions covering all entity types
- [x] 3.7 `src/types/database.types.ts` re-exports from generated types

### Done criteria
All 18 tables deployed with RLS. Storage buckets created. Generated types committed. 13 mappers cover Supabase → domain type conversion. `bun run typecheck` passes.

### Implementation notes
- All tables, RLS, helpers, storage, and triggers in one migration (`20260420000000_initial_schema.sql`).
- 4 `SECURITY DEFINER` helper functions avoid repeating `family_members` joins.
- `profiles` references `auth.users(id)` with `ON DELETE CASCADE`.
- `updated_at` auto-trigger on all 13 tables that have the column.
- Apple sign-in and RLS integration testing deferred.
- Typecheck passes clean.

---

## Phase 4 — User can create an account and complete onboarding

> **Feature specs covered:** `feature-specs/onboarding.md`
>
> **Tables used:** `profiles`, `families`, `family_members`, `children`, `activities`

### Dependencies
Phases 2 and 3 complete.

### PR 1: Auth infrastructure
- [x] 1.1 Install `expo-apple-authentication`, `expo-image-picker`, `expo-web-browser`, `expo-crypto`, `@react-native-community/datetimepicker`
- [x] 1.2 Create `src/lib/supabase/auth.ts` — `signUp`, `signIn`, `signOut`, `getSession`, `getUser`, `onAuthStateChange`, `resendVerificationEmail`
- [x] 1.3 Auth token storage handled by Supabase client via `expo-secure-store` adapter (already in Phase 1)
- [x] 1.4 Create `src/features/onboarding/repositories/profile.repository.ts` — `insertProfile`, `getProfile`
- [x] 1.5 Create `src/features/onboarding/repositories/child.repository.ts` — `insertChild`, `getChildrenByFamily`, `getFirstChild`
- [x] 1.6 Create `src/features/onboarding/repositories/activity.repository.ts` — `insertActivity`, `getActivitiesByChild`, `getFirstActivity`
- [x] 1.7 Create `src/features/onboarding/types/onboarding.types.ts` — `CreateAccountData`, `CreateChildData`, `CreateActivityData`, `OnboardingStep`

### PR 2: Login screen + auth guard
- [x] 2.1 Create `app/(auth)/_layout.tsx` — auth group stack layout
- [x] 2.2 Create `app/(auth)/login.tsx` — thin route wrapper
- [x] 2.3 Create `LoginScreen.tsx` — email/password form, Sign in with Apple button (placeholder), Google "Coming soon" disabled button, "Create account" link
- [x] 2.4 Create `useSignInMutation.ts` — email/password sign-in via Supabase
- [ ] 2.5 `useSignInWithAppleMutation.ts` — deferred to Phase 9 (Apple Developer account needed)
- [x] 2.6 Update `app/_layout.tsx` — full auth guard: loading → check session → check child → check activity → route to correct screen

### PR 3: Onboarding wizard — 3 steps
- [x] 3.1 Create `app/(auth)/onboarding/_layout.tsx` — stack with back button, brand colors
- [x] 3.2 Create `step-1.tsx`, `step-2.tsx`, `step-3.tsx` route wrappers
- [x] 3.3 `OnboardingStep1Screen.tsx` — email, password (4-rule live checklist), display name, persona picker (5 chip options), terms consent checkbox, "Create account" button
- [x] 3.4 `OnboardingStep2Screen.tsx` — avatar preview, child name, date picker, gender picker (3 chips), passes `familyId` via route params
- [x] 3.5 `OnboardingStep3Screen.tsx` — activity name with 50-char validation, "Get started" navigates to Home
- [x] 3.6 `useCreateAccountMutation.ts` — signUp → profiles → families → family_members (admin) → SQLite
- [x] 3.7 `useCreateChildMutation.ts` — Supabase + SQLite + sets active-child store
- [x] 3.8 `useCreateActivityMutation.ts` — Supabase + SQLite
- [x] 3.9 `react-hook-form` already installed in Phase 2 (not used in Step 1 yet — forms are simple enough with useState)

### PR 4: Returning user login + session persistence
- [x] 4.1 Auth session rehydration — root layout checks `getSession()` on mount, restores auth state
- [x] 4.2 Initial data pull — deferred to full sync engine (Phase 6). Onboarding writes to both Supabase + SQLite simultaneously.
- [x] 4.3 Onboarding resume — auth guard checks: has session? → has child in store/SQLite? → has activity? → routes to correct step
- [ ] 4.4 Email verification flow — Supabase sends verification email, but deep link handling for auto-advance needs `expo-linking` config. Manual workaround: user verifies, then signs in from login screen.
- [ ] 4.5 Unit tests — deferred

### Done criteria
New user creates account, adds child, names activity, lands on Home. Returning user goes to Home. Mid-onboarding resume works. All data in SQLite + Supabase. `bun run typecheck` passes.

### Implementation notes
- Auth guard uses 5 states: `loading`, `unauthenticated`, `onboarding-child`, `onboarding-activity`, `authenticated`.
- Mutations write to both Supabase and SQLite simultaneously (no sync queue yet — that's Phase 6).
- `familyId` and `childId` passed between onboarding steps via Expo Router `params`.
- Apple sign-in button visible but non-functional (placeholder).
- Email verification deep link auto-advance not implemented — users verify then sign in manually.
- Typecheck passes clean.

---

## Phase 5 — Parent can build a custom activity with drills and rewards

> **Feature specs covered:** `feature-specs/activity-builder.md`
>
> **Tables used:** `activities` (full CRUD), `drills`, `tracking_elements`, `tier_rewards`, `bonus_presets`

### Dependencies
Phase 4 complete (user must be authenticated, child must exist, activity stub from onboarding exists).

### PR 1: Shared tracking element type definitions
- [ ] 1.1 Create `src/shared/tracking-elements/types/element-types.ts` — union type of all 18 element type identifiers
- [ ] 1.2 Create `src/shared/tracking-elements/types/element-configs.ts` — TypeScript interfaces for the config JSONB shape of each element type (target values, option lists, duration, substep names, etc.)
- [ ] 1.3 Create `src/shared/tracking-elements/types/element-values.ts` — TypeScript interfaces for the value JSONB shape of each element type per `05-database-schema.md` §2.14
- [ ] 1.4 Create `src/shared/tracking-elements/validation.ts` — validation rules for each element config (min/max targets, required fields)

### PR 2: Activity builder screens + CRUD
- [ ] 2.1 Create `app/(settings)/activities/index.tsx`, `[activityId].tsx`, `[activityId]/[drillId].tsx` — thin route wrappers
- [ ] 2.2 Create `app/(settings)/_layout.tsx` — settings stack layout
- [ ] 2.3 Create `src/features/activity-builder/screens/ActivityListScreen.tsx` — list of activities for active child, "Add activity" button, swipe-to-delete
- [ ] 2.4 Create `src/features/activity-builder/screens/CreateActivityModal.tsx` — modal with name + icon picker + category (sport/therapy/academic/custom)
- [ ] 2.5 Create `src/features/activity-builder/screens/ActivityDetailScreen.tsx` — drill list with long-press reorder, session-level tier rewards, session-level bonus presets, "Add drill" button
- [ ] 2.6 Create `src/features/activity-builder/screens/DrillEditScreen.tsx` — drill name, tracking element list with "Add element" picker, drill-level tier rewards, drill-level bonus presets, deactivate toggle
- [ ] 2.7 Create `src/features/activity-builder/repositories/activity.repository.ts` — full CRUD for `activities` in SQLite
- [ ] 2.8 Create `src/features/activity-builder/repositories/drill.repository.ts` — CRUD for `drills` in SQLite, display_order management
- [ ] 2.9 Create `src/features/activity-builder/repositories/tracking-element.repository.ts` — CRUD for `tracking_elements` in SQLite
- [ ] 2.10 Create `src/features/activity-builder/queries/keys.ts` — TanStack Query key factory for activity-builder
- [ ] 2.11 Create `src/features/activity-builder/queries/useActivitiesQuery.ts`, `useDrillsQuery.ts`
- [ ] 2.12 Create `src/features/activity-builder/mutations/` — `useCreateActivityMutation`, `useUpdateActivityMutation`, `useDeleteActivityMutation`, `useCreateDrillMutation`, `useUpdateDrillMutation`, `useDeleteDrillMutation`, `useCreateElementMutation`, `useUpdateElementMutation`, `useDeleteElementMutation`

### PR 3: 18 config element components
- [ ] 3.1 Create `src/features/activity-builder/components/elements/CounterConfig.tsx` — target value input
- [ ] 3.2 Create `CombinedCounterConfig.tsx` — target value + manual entry toggle
- [ ] 3.3 Create `SplitCounterConfig.tsx` — two labels + two targets
- [ ] 3.4 Create `MultistepCounterConfig.tsx` — substep name list (add/remove/reorder) + target reps
- [ ] 3.5 Create `StopwatchConfig.tsx` — optional target time
- [ ] 3.6 Create `CountdownTimerConfig.tsx` — duration input (MM:SS)
- [ ] 3.7 Create `LapTimerConfig.tsx` — optional target lap count, optional target lap time
- [ ] 3.8 Create `IntervalTimerConfig.tsx` — work duration, rest duration, number of cycles
- [ ] 3.9 Create `ChecklistConfig.tsx` — item list (add/remove/reorder), target count
- [ ] 3.10 Create `SingleSelectConfig.tsx` — option list (add/remove/reorder)
- [ ] 3.11 Create `MultiSelectConfig.tsx` — option list (add/remove/reorder), optional target count
- [ ] 3.12 Create `YesNoConfig.tsx` — target value (yes/no/either)
- [ ] 3.13 Create `RatingScaleConfig.tsx` — scale max (3–10), optional low/high labels, optional target
- [ ] 3.14 Create `EmojiFaceScaleConfig.tsx` — number of faces (3 or 5), optional target
- [ ] 3.15 Create `NumberInputConfig.tsx` — optional unit label, optional target, optional min/max
- [ ] 3.16 Create `MultiNumberInputConfig.tsx` — unit label, optional target count
- [ ] 3.17 Create `FreeTextNoteConfig.tsx` — placeholder text config (minimal config, element is mostly self-explanatory)
- [ ] 3.18 Create `VoiceNoteConfig.tsx` — max duration config (default 3 min)
- [ ] 3.19 Create `src/features/activity-builder/components/elements/ElementConfigRouter.tsx` — switch component that renders the correct config by element type

### PR 4: Tier rewards + bonus presets configuration
- [ ] 4.1 Create `src/features/activity-builder/repositories/tier-reward.repository.ts` — CRUD for `tier_rewards` in SQLite
- [ ] 4.2 Create `src/features/activity-builder/repositories/bonus-preset.repository.ts` — CRUD for `bonus_presets` in SQLite
- [ ] 4.3 Create `src/features/activity-builder/components/TierRewardEditor.tsx` — tier name, condition builder (element reference + operator + value, AND logic), currency amount, reorderable list
- [ ] 4.4 Create `src/features/activity-builder/components/BonusPresetEditor.tsx` — preset amount list, add/remove
- [ ] 4.5 Create mutations — `useCreateTierRewardMutation`, `useUpdateTierRewardMutation`, `useDeleteTierRewardMutation`, `useCreateBonusPresetMutation`, `useDeleteBonusPresetMutation`
- [ ] 4.6 Unit tests — `activity-builder.test.ts` covering element config validation and tier condition logic

### Done criteria
Parent creates an activity with name/icon/category. Adds drills with any of the 18 element types configured. Sets drill-level and session-level tier rewards with conditions. Configures bonus presets. Reorders drills via long-press drag. Deactivates/reactivates drills. All data persists in SQLite. `bun run typecheck && bun test` passes.

### Risk notes
- Long-press drag reorder requires `react-native-reanimated` gesture handling — verify with New Architecture.
- The 18 config components are significant volume. Consider splitting PR 3 across two PRs if review load is too high.

---

## Phase 6 — Parent can log a full session offline and see a reward summary

> **Feature specs covered:** `feature-specs/session-logging.md`, `feature-specs/activity.md` (activity selector), `rewards-levels-accolades.md`
>
> **Tables used:** `sessions`, `drill_results`, `element_values`, `currency_ledger`, `accolade_unlocks`, `sync_queue`

### Dependencies
Phase 5 complete (activities and drills must exist to log sessions against them).

### PR 1: Offline sync engine
- [ ] 1.1 Create `src/lib/sync/queue.ts` — functions to append operations to `sync_queue` SQLite table, read pending ops, mark in-flight/failed/complete, reset stale in-flight on app launch
- [ ] 1.2 Create `src/lib/sync/engine.ts` — background drain loop: process one op at a time (FIFO), retry policy (5 consecutive failures → pause + toast), resume on network change or app foreground, conflict resolution via `updated_at` comparison (last-write-wins)
- [ ] 1.3 Create `src/lib/sync/media-uploader.ts` — separate background process for photos/voice notes, WiFi-only upload to Supabase Storage, image compression to ~800px, local URI → Storage URL replacement after upload
- [ ] 1.4 Create `src/lib/sync/useNetworkStatus.ts` — hook wrapping `@react-native-community/netinfo` to detect online/offline and WiFi state
- [ ] 1.5 Install `@react-native-community/netinfo` — network status detection
- [ ] 1.6 Wire sync engine startup in `app/_layout.tsx` — start on foreground when online, stop on background

### PR 2: Activity selector + session infrastructure
- [ ] 2.1 Create `src/features/activity-selector/screens/ActivityScreen.tsx` — update stub: tap opens bottom sheet with activity list for active child, tap activity → start session
- [ ] 2.2 Create `src/features/activity-selector/components/ActivityPickerSheet.tsx` — bottom sheet with activity list, activity name + icon per row
- [ ] 2.3 Create `src/features/session-logging/repositories/session.repository.ts` — SQLite CRUD for `sessions`, `drill_results`, `element_values`
- [ ] 2.4 Create `src/features/session-logging/repositories/drill-result.repository.ts` — SQLite CRUD for drill results and element values
- [ ] 2.5 Create `src/features/session-logging/hooks/useSessionTimer.ts` — MMKV-backed timer: store `startTime` as `Date.now()`, calculate elapsed as `Date.now() - startTime`, handle pause/resume via `pausedAt` + `totalPausedMs`, auto-pause after 2 hours inactivity
- [ ] 2.6 Create `src/features/session-logging/hooks/useSessionPersistence.ts` — auto-save every action to SQLite immediately, append sync ops to queue
- [ ] 2.7 Create `src/features/session-logging/hooks/useActiveSession.ts` — reads `active-session.store`, provides session context to components
- [ ] 2.8 Create `src/features/session-logging/queries/keys.ts` — TanStack Query key factory for session data
- [ ] 2.9 Create `src/features/session-logging/mutations/useStartSessionMutation.ts` — create session row, set `active-session.store` to active, write MMKV startTime

### PR 3: Session + drill screens
- [ ] 3.1 Create `app/(modals)/session/index.tsx` — thin wrapper, `presentation: 'fullScreenModal'`
- [ ] 3.2 Create `app/(modals)/session/[drillId].tsx` — thin wrapper, stacked inside modal group
- [ ] 3.3 Create `src/features/session-logging/screens/SessionScreen.tsx` — header (activity name, child name, session timer, minimize button), scrollable drill list, session notes field + photo attachment, "Finish Session" button
- [ ] 3.4 Create `src/features/session-logging/screens/DrillScreen.tsx` — drill name + context, renders tracking elements interactively via `ElementRenderer`, drill notes + optional photo, "Finish drill" button
- [ ] 3.5 Create `src/features/session-logging/components/SessionTimer.tsx` — HH:MM:SS display, reads from `useSessionTimer`
- [ ] 3.6 Create `src/features/session-logging/components/DrillListItem.tsx` — one row in drill list, shows completion status
- [ ] 3.7 Create `src/features/session-logging/components/SessionNotes.tsx` — free text note + photo attachment at bottom
- [ ] 3.8 Create `src/features/session-logging/mutations/useLogDrillMutation.ts` — save drill result + element values to SQLite
- [ ] 3.9 Create `src/features/session-logging/mutations/useFinishSessionMutation.ts` — set `ended_at`, calculate `duration_seconds`, run tier evaluation + accolade evaluation, create ledger entries, navigate to summary
- [ ] 3.10 Install `expo-image-picker` — for session/drill photo attachments

### PR 4: 18 interactive element components
- [ ] 4.1 Create `src/features/session-logging/components/elements/CounterElement.tsx` — `+`/`−` buttons, min 0, reset with alert
- [ ] 4.2 Create `CombinedCounterElement.tsx` — counter + tap number for manual entry
- [ ] 4.3 Create `SplitCounterElement.tsx` — two independent counters with labels
- [ ] 4.4 Create `MultistepCounterElement.tsx` — substep chips in order, advance sequentially, rep counter on last chip
- [ ] 4.5 Create `StopwatchElement.tsx` — Start/Pause/Resume, background-safe (recalculate on return)
- [ ] 4.6 Create `CountdownTimerElement.tsx` — count down from configured duration, stop at 0, play alert sound
- [ ] 4.7 Create `LapTimerElement.tsx` — stopwatch + Lap button, lap list with swipe-to-delete
- [ ] 4.8 Create `IntervalTimerElement.tsx` — alternating Work/Rest cycles, vibrate at transitions, cycle counter
- [ ] 4.9 Create `ChecklistElement.tsx` — checkbox rows, tap to toggle
- [ ] 4.10 Create `SingleSelectElement.tsx` — radio buttons, tap to select/deselect
- [ ] 4.11 Create `MultiSelectElement.tsx` — checkboxes, select any combination
- [ ] 4.12 Create `YesNoElement.tsx` — two toggle buttons
- [ ] 4.13 Create `RatingScaleElement.tsx` — 1–N buttons, optional labels
- [ ] 4.14 Create `EmojiFaceScaleElement.tsx` — 3 or 5 faces, tap to select/deselect
- [ ] 4.15 Create `NumberInputElement.tsx` — numeric field, optional unit label
- [ ] 4.16 Create `MultiNumberInputElement.tsx` — entry list with "Add" button, swipe-to-delete
- [ ] 4.17 Create `FreeTextNoteElement.tsx` — multiline textarea, autosaves
- [ ] 4.18 Create `VoiceNoteElement.tsx` — inline recorder (3-min max), playback/re-record/delete, local file + WiFi upload
- [ ] 4.19 Create `src/features/session-logging/components/elements/ElementRenderer.tsx` — switch component rendering correct interactive element by type
- [ ] 4.20 Install `expo-audio` — for voice note recording and playback (expo-av removed in SDK 55)

### PR 5: MiniPlayerBar + session lifecycle
- [ ] 5.1 Upgrade `src/features/session-logging/components/MiniPlayerBar.tsx` — from stub to real: show activity name + "in progress" + "Resume" button when `active-session.store` status is active/minimized/paused, invisible when idle
- [ ] 5.2 Update `app/(tabs)/_layout.tsx` — MiniPlayerBar reads store, renders above tab bar when active; Activity tab icon changes color from `active-session.store`
- [ ] 5.3 Implement session minimize — tapping minimize button on SessionScreen sets store to `minimized`, pops modal, returns to tabs with MiniPlayerBar visible
- [ ] 5.4 Implement session resume — tapping MiniPlayerBar or Activity tab when session active pushes session modal, restores full session state from SQLite + MMKV
- [ ] 5.5 Implement session survive app close — on app reopen, check MMKV for active session startTime, restore `active-session.store`, show MiniPlayerBar
- [ ] 5.6 Block child switching during active session — check `active-session.store` before child switch, show native iOS alert via `useDestructiveAlert` if session active

### PR 6: Reward evaluation + gamification engine
- [ ] 6.1 Create `src/features/session-logging/utils/tier-evaluator.ts` — evaluate drill-level and session-level tiers: highest qualifying tier wins, skip conditions referencing missing elements, deterministic tiebreaker via `display_order`
- [ ] 6.2 Create `src/features/session-logging/utils/accolade-evaluator.ts` — check all 17 accolades against child's cumulative state at Finish Session (sessions count, drill count, streak, level, ledger balance, rewards)
- [ ] 6.3 Create `src/shared/gamification/level-thresholds.ts` — level threshold table per `rewards-levels-accolades.md` §5.2 (L1: 0, L2: 3, ..., L10: 120, L11+: +20), `getLevel(sessionCount)` and `getLevelProgress(sessionCount)` functions
- [ ] 6.4 Create `src/shared/gamification/streak-calculator.ts` — derive current streak from session dates per `rewards-levels-accolades.md` §6 (consecutive calendar days, local timezone, per-child)
- [ ] 6.5 Create `src/shared/gamification/accolade-catalog.ts` — static catalog of 17 accolades with names, descriptions, icons, unlock rules per `rewards-levels-accolades.md` §7.3
- [ ] 6.6 Create `src/features/session-logging/repositories/currency-ledger.repository.ts` — append ledger entries (`drill_tier`, `session_tier`, `manual_bonus`), query balance as `SUM(amount)`
- [ ] 6.7 Create `src/features/session-logging/repositories/accolade.repository.ts` — insert `accolade_unlocks`, query unlocked accolades
- [ ] 6.8 Create `src/features/session-logging/mutations/useAddBonusMutation.ts` — parent awards manual bonus with preset or custom amount + reason
- [ ] 6.9 Create `app/(modals)/session-summary.tsx` — thin route wrapper
- [ ] 6.10 Create `src/features/session-logging/screens/SessionSummaryScreen.tsx` — session duration, drills logged, currency earned breakdown (drill tiers + session tiers + bonuses), level progress change, newly unlocked accolades, "Add bonus" button, "Done" button returns to Home
- [ ] 6.11 Create `src/features/session-logging/components/summary/RewardBreakdown.tsx` — itemized currency earnings
- [ ] 6.12 Create `src/features/session-logging/components/summary/AccoladeUnlock.tsx` — newly unlocked accolade display with animation
- [ ] 6.13 Unit tests — `tier-evaluator.test.ts` (tier evaluation edge cases: missing elements, tiebreakers, no qualifying tier), `streak-calculator.test.ts`, `level-thresholds.test.ts`, `accolade-evaluator.test.ts`

### Done criteria
Parent selects an activity, starts a session, logs drills with any of the 18 element types, finishes session, sees summary with currency earned + accolades unlocked + level progress. MiniPlayerBar persists across tabs during minimized session. Timer survives app close and resumes correctly. All writes go to SQLite immediately, sync engine drains queue to Supabase in the background. Photos saved locally, uploaded on WiFi. Voice notes record and play back. App works fully offline. `bun run typecheck && bun test` passes.

### Risk notes
- Voice note recording with `expo-audio` — verify recording API is stable in SDK 55 (expo-av was removed).
- The 18 interactive elements are the largest single deliverable. Consider splitting PR 4 into two PRs if needed.
- Sync engine edge cases (stale in-flight ops, device wipe) — test manually.

---

## Phase 7 — Home shows real progress; Stats shows charts and history

> **Feature specs covered:** `feature-specs/home-dashboard.md`, `feature-specs/stats.md`
>
> **Tables used:** `rewards` (new — CRUD for savings goals), all read-only queries against `sessions`, `drill_results`, `element_values`, `currency_ledger`, `accolade_unlocks`

### Dependencies
Phase 6 complete (session data must exist to display). **Independent of Phase 8** — can be built in parallel.

### PR 1: Home dashboard
- [ ] 1.1 Create `src/features/home-dashboard/screens/HomeScreen.tsx` — replace stub with full dashboard: active child header, level + badge, reward progress, currency balance, consistency metrics, recent sessions, accolades
- [ ] 1.2 Create `src/features/home-dashboard/components/LevelBadge.tsx` — programmatic badge (color/shape progression), level number, progress bar toward next level
- [ ] 1.3 Create `src/features/home-dashboard/components/RewardProgress.tsx` — closest reward name, progress bar (`current_balance / cost`), "Add reward" CTA if no rewards exist
- [ ] 1.4 Create `src/features/home-dashboard/components/CurrencyBalance.tsx` — current balance as `SUM(currency_ledger.amount)`, family currency name
- [ ] 1.5 Create `src/features/home-dashboard/components/ConsistencyMetrics.tsx` — sessions this week, total sessions, current streak (🔥 indicator, hidden at 0)
- [ ] 1.6 Create `src/features/home-dashboard/components/RecentSessions.tsx` — last 2 sessions with activity name, date, completion status; "See all" → Stats tab
- [ ] 1.7 Create `src/features/home-dashboard/components/AccoladeRow.tsx` — 3 most recent accolades; "See all" link
- [ ] 1.8 Create `src/features/home-dashboard/repositories/dashboard.repository.ts` — SQLite queries for all dashboard data (balance, sessions count, streak, level, recent sessions, accolades)
- [ ] 1.9 Create `src/features/home-dashboard/queries/keys.ts` and `useDashboardQuery.ts`
- [ ] 1.10 Implement empty states for each section per `brand-decisions.md` §10 (no sessions, no rewards, no accolades)
- [ ] 1.11 Implement skeleton loading per `brand-decisions.md` §11

### PR 2: Rewards screen
- [ ] 2.1 Create `src/features/home-dashboard/screens/RewardsScreen.tsx` — list of rewards with state badges (`saving` / `ready_to_redeem` / `redeemed`), "Add reward" button
- [ ] 2.2 Create `src/features/home-dashboard/components/CreateRewardModal.tsx` — name + cost inputs
- [ ] 2.3 Create `src/features/home-dashboard/repositories/reward.repository.ts` — SQLite CRUD for `rewards`, state transitions (`saving` → `ready_to_redeem` → `redeemed`)
- [ ] 2.4 Create `src/features/home-dashboard/mutations/useCreateRewardMutation.ts`, `useRedeemRewardMutation.ts`, `useDeleteRewardMutation.ts`
- [ ] 2.5 Implement redemption — deduct cost from balance via negative ledger entry, move reward to `redeemed`, trigger "Big Win" accolade check on first-ever redemption
- [ ] 2.6 Create route for rewards screen (stack push from Home)

### PR 3: Stats screen + charts
- [ ] 3.1 Install `victory-native` — chart library (Victory Native XL, built for New Architecture)
- [ ] 3.2 Create `src/features/stats/screens/StatsScreen.tsx` — replace stub: time filter (Week/Month/Year/All Time), period selector with comparison label, charts, summary cards, activity filter, session list
- [ ] 3.3 Create `src/features/stats/components/TimeFilter.tsx` — segmented control for time range
- [ ] 3.4 Create `src/features/stats/components/PeriodSelector.tsx` — current period display with left/right navigation + comparison period label
- [ ] 3.5 Create `src/features/stats/components/charts/CumulativeLineChart.tsx` — current period (accent) vs previous period (gray)
- [ ] 3.6 Create `src/features/stats/components/charts/BarChart.tsx` — value per day/week/month
- [ ] 3.7 Create `src/features/stats/components/SummaryCards.tsx` — 2×2 grid: drills completed, sessions logged, total duration, currency earned; each shows current value, previous period, comparison indicator (↑↓=)
- [ ] 3.8 Create `src/features/stats/components/ActivityFilter.tsx` — filter button → modal with activity checkboxes
- [ ] 3.9 Create `src/features/stats/components/SessionListItem.tsx` — activity icon, key stat, date, incomplete indicator, chevron
- [ ] 3.10 Create `src/features/stats/repositories/stats.repository.ts` — SQLite queries for aggregated stats by period, activity filter, session list
- [ ] 3.11 Create `src/features/stats/queries/keys.ts` and `useStatsQuery.ts`, `useSessionListQuery.ts`
- [ ] 3.12 Implement empty states — no data for period, no sessions at all

### PR 4: Session detail + 18 display-only elements
- [ ] 4.1 Create `app/(tabs)/stats/[sessionId].tsx` — thin route wrapper
- [ ] 4.2 Create `src/features/stats/screens/SessionDetailScreen.tsx` — session date, activity name, duration, drill results with recorded values, drill/session notes, drill/session photos, "Delete session" button (native iOS alert)
- [ ] 4.3 Create `src/features/stats/components/elements/` — all 18 display-only element renderers: `CounterDisplay`, `CombinedCounterDisplay`, `SplitCounterDisplay`, `MultistepCounterDisplay`, `StopwatchDisplay`, `CountdownTimerDisplay`, `LapTimerDisplay`, `IntervalTimerDisplay`, `ChecklistDisplay`, `SingleSelectDisplay`, `MultiSelectDisplay`, `YesNoDisplay`, `RatingScaleDisplay`, `EmojiFaceScaleDisplay`, `NumberInputDisplay`, `MultiNumberInputDisplay`, `FreeTextNoteDisplay`, `VoiceNoteDisplay`
- [ ] 4.4 Create `src/features/stats/components/elements/ElementDisplayRouter.tsx` — switch component rendering correct display element by type
- [ ] 4.5 Create `src/features/stats/mutations/useDeleteSessionMutation.ts` — delete session + cascade drill_results/element_values, recompute level (per `rewards-levels-accolades.md` §5.5), currency ledger NOT reversed
- [ ] 4.6 Invalidate home dashboard queries after session deletion (import `homeKeys` from home-dashboard)

### Done criteria
Home dashboard shows real data: level badge, reward progress, currency balance, current streak, recent sessions, accolades — all for the active child. Rewards can be created, tracked, and redeemed. Stats shows charts with current/previous period comparison, summary cards, filterable session list. Session detail displays all 18 element types in read-only mode. Session deletion works with proper side effects. `bun run typecheck && bun test` passes.

### Risk notes
- Victory Native XL compatibility with RN 0.83 / New Architecture — verify before committing to charts.
- Chart rendering performance with large datasets — test with 50+ sessions.
- The 18 display-only elements are simpler than interactive ones but still significant volume.

---

## Phase 8 — Profile shows child info; Accounts Center manages family

> **Feature specs covered:** `feature-specs/profile.md`, `feature-specs/accounts-center.md`
>
> **Tables used:** `children` (full edit), `measurements`, `external_activities`, `family_members` (management), `invites`, `profiles` (edit), `families` (edit measurement_unit)

### Dependencies
Phase 6 complete (session data needed for Photos section). **Independent of Phase 7** — can be built in parallel.

### PR 1: Profile tab + child switcher
- [ ] 1.1 Create `src/features/profile/screens/ProfileScreen.tsx` — replace stub: child header (photo + name, tappable for switcher), basic info (age, country, gender, grade), measurements summary, activities summary, photos grid
- [ ] 1.2 Create `src/features/profile/components/ChildHeader.tsx` — photo or initials, name, tap to open child switcher
- [ ] 1.3 Create `src/features/profile/components/ChildSwitcherSheet.tsx` — bottom sheet: list of children (photo/initials, name, age, checkmark on active), "Add child" link → Settings, "Go to Accounts Center" link
- [ ] 1.4 Create `src/features/profile/components/BasicInfo.tsx` — read-only info rows, "Not recorded" for blank fields
- [ ] 1.5 Create `src/features/profile/components/MeasurementsSummary.tsx` — most recent weight + height + dates, units per family preference, tap to open history
- [ ] 1.6 Create `src/features/profile/components/ActivitiesSummary.tsx` — app-tracked activities (session count + last date) + external activities (name + schedule)
- [ ] 1.7 Create `src/features/profile/components/PhotoGrid.tsx` — grid from session photos, tap for full-screen, "See all" if > 6
- [ ] 1.8 Create `src/features/profile/repositories/profile.repository.ts` — SQLite reads for child info, measurements, external activities, session photos
- [ ] 1.9 Create `src/features/profile/queries/keys.ts` and `useProfileQuery.ts`
- [ ] 1.10 Create `src/shared/components/ParentAvatar.tsx` — circular photo or initials in top-right corner of every screen, tap → Settings
- [ ] 1.11 Wire ParentAvatar into all tab screens and settings stack headers
- [ ] 1.12 Implement child switch — selecting different child in sheet updates `active-child.store`, dismisses sheet, all tabs reload with new child's data

### PR 2: Settings screen + child management
- [ ] 2.1 Create `app/(settings)/index.tsx` — thin route wrapper for settings screen
- [ ] 2.2 Create `app/(settings)/child/edit-profile.tsx`, `measurements.tsx`, `external-activities.tsx` — thin route wrappers
- [ ] 2.3 Create `src/features/profile/screens/SettingsScreen.tsx` — grouped sections: Accounts Center button, Activities button, Child section (edit profile, measurements, external activities), App section (Help, Privacy, About, Log out)
- [ ] 2.4 Create `src/features/profile/screens/EditChildProfileScreen.tsx` — modal: photo, name (req), DOB, country, gender, grade level, school calendar (Panamanian/US/Custom with month fields), Save button disabled until change
- [ ] 2.5 Create `src/features/profile/screens/MeasurementsScreen.tsx` — Weight and Height sections, entry list (most recent first), "Add entry" → bottom sheet (value, unit, date picker), swipe-to-delete with alert, tap entry to edit
- [ ] 2.6 Create `src/features/profile/screens/ExternalActivitiesScreen.tsx` — list of non-tracked activities, "Add activity" → modal (name req, schedule, location, notes), tap to edit, swipe-to-delete with alert
- [ ] 2.7 Create `src/features/profile/repositories/measurement.repository.ts` — SQLite CRUD for `measurements`
- [ ] 2.8 Create `src/features/profile/repositories/external-activity.repository.ts` — SQLite CRUD for `external_activities`
- [ ] 2.9 Create `src/features/profile/mutations/` — `useUpdateChildMutation`, `useAddMeasurementMutation`, `useDeleteMeasurementMutation`, `useAddExternalActivityMutation`, `useUpdateExternalActivityMutation`, `useDeleteExternalActivityMutation`
- [ ] 2.10 Implement log out — native iOS alert confirmation, clear `expo-secure-store`, clear Zustand stores, navigate to login

### PR 3: Accounts center
- [ ] 3.1 Create `app/(settings)/accounts-center/index.tsx`, `[memberId].tsx` — thin route wrappers
- [ ] 3.2 Create `src/features/accounts-center/screens/AccountsCenterScreen.tsx` — profile section (photo, display name, email, change password) + family section (measurement unit toggle, member list, "Invite member" button)
- [ ] 3.3 Create `src/features/accounts-center/screens/MemberDetailScreen.tsx` — photo, name, email, role, "Change role" → bottom sheet, "Remove from family" → native iOS alert
- [ ] 3.4 Create `src/features/accounts-center/components/InviteModal.tsx` — email input + role picker (Co-admin/Collaborator/Member)
- [ ] 3.5 Create `src/features/accounts-center/components/ChangePasswordModal.tsx` — current password, new password (requirements checklist), confirm password
- [ ] 3.6 Create `src/features/accounts-center/components/EditNameModal.tsx` — display name edit
- [ ] 3.7 Create `src/features/accounts-center/components/EditEmailModal.tsx` — new email + password confirmation
- [ ] 3.8 Create `src/features/accounts-center/repositories/family.repository.ts` — SQLite queries for family members, invites
- [ ] 3.9 Create `src/features/accounts-center/mutations/` — `useUpdateProfileMutation`, `useChangePasswordMutation`, `useChangeEmailMutation`, `useInviteMemberMutation`, `useChangeRoleMutation`, `useRemoveMemberMutation`, `useUpdateMeasurementUnitMutation`
- [ ] 3.10 Account-level operations (email change, password change, invite send) must require live connection — show offline toast if no network per `04-offline-sync.md` §3.2

### PR 4: Account deletion + media uploads
- [ ] 4.1 Create `src/features/accounts-center/screens/DeleteAccountScreen.tsx` — two-step: native iOS alert "Permanently delete account…" → text field "Type DELETE to confirm"
- [ ] 4.2 Create `src/features/accounts-center/mutations/useDeleteAccountMutation.ts` — invalidate Supabase auth, trigger server-side cascade deletion, clear local SQLite/MMKV/expo-secure-store, revoke RevenueCat user ID, disassociate Sentry user, navigate to login per `privacy-and-data.md` §5.2
- [ ] 4.3 Wire photo picker for parent avatar in Accounts Center — camera/library, upload to `avatars` Storage bucket
- [ ] 4.4 Wire photo picker for child avatar in Edit Child Profile — camera/library, upload to `avatars` Storage bucket
- [ ] 4.5 Wire session/drill photo attachment upload — `session-media` Storage bucket, local URI displayed immediately, background upload on WiFi via `media-uploader.ts`
- [ ] 4.6 Wire voice note upload — `session-media` Storage bucket, local file stored and played back immediately, background upload on WiFi

### Done criteria
Profile tab shows child info, measurements, external activities, session photos for active child. Child switcher works — all tabs reload with selected child's data. Parent avatar visible on all screens, navigates to Settings. Settings fully functional: edit child, add/edit/delete measurements, add/edit/delete external activities, log out. Accounts Center: edit name/email/password, toggle measurement units, view/invite/manage family members, change roles, remove members. Account deletion works end-to-end (two-step confirmation, full data wipe). Photos upload to Supabase Storage on WiFi. `bun run typecheck && bun test` passes.

### Risk notes
- Account deletion cascade — must be tested thoroughly to ensure no orphaned data remains.
- Email/password change requires live Supabase connection — ensure proper offline error handling.
- Photo compression and upload reliability — test with large images and slow connections.

---

## Phase 9 — App is submittable to the App Store

### Dependencies
Phases 7 and 8 complete — all features functional.

### PR 1: E2E testing with Maestro
- [ ] 1.1 Install Maestro CLI and configure for the project
- [ ] 1.2 Create `e2e/flows/complete-onboarding.yaml` — new user: create account → add child → name activity → land on Home
- [ ] 1.3 Create `e2e/flows/log-session.yaml` — select activity → log drills → finish session → see summary
- [ ] 1.4 Create `e2e/flows/add-activity.yaml` — create activity → add drills → configure elements → save
- [ ] 1.5 Create `e2e/flows/switch-child.yaml` — open switcher → select different child → verify data updates across tabs
- [ ] 1.6 Run all 4 flows and fix any failures

### PR 2: Sign in with Apple + Sentry
- [ ] 2.1 Finalize Sign in with Apple end-to-end — test with real Apple Developer account on device
- [ ] 2.2 Configure Sentry source maps in EAS Build pipeline — `@sentry/react-native` Expo plugin in `app.config.ts`
- [ ] 2.3 Configure `beforeBreadcrumb` in Sentry init — scrub free-text session notes to prevent PII in crash reports per `privacy-and-data.md` §6.1
- [ ] 2.4 Set Sentry user to parent's app user ID only — never pass child identifiers per `privacy-and-data.md` §6.1
- [ ] 2.5 Verify crash reporting on a real device via EAS Build → TestFlight

### PR 3: RevenueCat + EAS Update
- [ ] 3.1 Install `react-native-purchases` (RevenueCat SDK)
- [ ] 3.2 Initialize RevenueCat with anonymous app user ID (UUID, not email or child name) per `privacy-and-data.md` §6.2
- [ ] 3.3 Configure RevenueCat project with offerings (freemium gate — paywall UI deferred but SDK pipeline starts collecting data)
- [ ] 3.4 Configure EAS Update with `--environment` flag per `01-stack-decision.md` breaking change
- [ ] 3.5 Test OTA update pipeline — push an update, verify it installs on device

### PR 4: App Store submission prep
- [ ] 4.1 Generate app icons — all required sizes for iOS
- [ ] 4.2 Capture screenshots — iPhone SE (small) + iPhone 15 Pro (large) for all key screens
- [ ] 4.3 Host privacy policy at stable public URL — English and Spanish versions from `privacy-and-data.md` §4
- [ ] 4.4 Fill in App Store Connect privacy nutrition labels per `privacy-and-data.md` §6.5 — data linked to you: contact info, user content, identifiers, usage data, purchases; data not used to track
- [ ] 4.5 Write App Store review notes — test account credentials, explanation of child data handling
- [ ] 4.6 COPPA audit — confirm Sentry `sendDefaultPii` is off, RevenueCat user ID is anonymous UUID, no child identifiers sent to any third-party SDK
- [ ] 4.7 Set `NSMicrophoneUsageDescription` in `app.config.ts` — "Brinca uses the microphone only when you tap record on a Voice Note during a practice session." per `privacy-and-data.md` §2.5
- [ ] 4.8 Build for TestFlight via `eas build --platform ios`
- [ ] 4.9 Submit to App Store review

### Done criteria
All 4 Maestro E2E flows pass. Sign in with Apple works on a real device. Sentry crash reporting is active with source maps and PII scrubbing. RevenueCat SDK is initialized. EAS Update OTA pipeline is configured and tested. Privacy policy is hosted. App Store Connect listing is complete with icons, screenshots, privacy labels. COPPA audit confirms no child data reaches third-party SDKs. App is submitted to App Store review.

### Risk notes
- Apple review can take 1–7 days and may require changes — budget time for at least one rejection cycle.
- Privacy policy requires Panamanian attorney review before it can be hosted — this is a blocker.
- Maestro may need custom configuration for Expo Router navigation — verify setup early.
- RevenueCat project setup requires a paid Apple Developer account with in-app purchase agreements.

---

## Feature spec coverage

Every feature spec in `docs/feature-specs/` is covered:

| Feature spec | Phase(s) |
|---|---|
| `onboarding.md` | Phase 4 |
| `activity.md` (activity selector) | Phase 6 (PR 2) |
| `activity-builder.md` | Phase 5 |
| `session-logging.md` | Phase 6 |
| `home-dashboard.md` | Phase 7 (PRs 1–2) |
| `stats.md` | Phase 7 (PRs 3–4) |
| `profile.md` | Phase 8 (PRs 1–2) |
| `accounts-center.md` | Phase 8 (PRs 3–4) |

Cross-cutting docs are applied throughout:

| Doc | Applied in |
|---|---|
| `rewards-levels-accolades.md` | Phase 6 (evaluation engine), Phase 7 (display) |
| `ux-conventions.md` | Phase 2 (tokens), all phases (patterns) |
| `brand-decisions.md` | Phase 2 (design system), all phases (copy/i18n) |
| `04-offline-sync.md` | Phase 6 (sync engine) |
| `05-database-schema.md` | Phase 1 (SQLite schema), Phase 3 (Supabase), all feature phases |
| `privacy-and-data.md` | Phase 4 (consent), Phase 8 (deletion), Phase 9 (audit) |

## Table coverage

Every table from `05-database-schema.md` is implemented in at least one phase:

| Table | Phase |
|---|---|
| `profiles` | 4 |
| `families` | 4 |
| `family_members` | 4, 8 |
| `invites` | 8 |
| `children` | 4, 8 |
| `activities` | 4 (stub), 5 (full) |
| `drills` | 5 |
| `tracking_elements` | 5 |
| `tier_rewards` | 5 |
| `bonus_presets` | 5 |
| `rewards` | 7 |
| `sessions` | 6 |
| `drill_results` | 6 |
| `element_values` | 6 |
| `currency_ledger` | 6 |
| `accolade_unlocks` | 6 |
| `measurements` | 8 |
| `external_activities` | 8 |
| `sync_queue` (SQLite only) | 6 |
