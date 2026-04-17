# Brinca (Activity Tracking App)

## How to start a phase

When I say "start Phase N," follow this process before writing any code:

1. Read `docs/architecture/02-project-structure.md` Section 5, Phase N — this lists every file to create and what "done" looks like.
2. Read the docs referenced by that phase (feature specs, schema doc, ux-conventions) to understand what you're building.
3. Present a step-by-step task list with checkboxes for my approval. Group tasks by PR or logical chunk.
4. Wait for my approval before writing any code.
5. As you complete each task, check it off so I can track progress.

Key docs per phase:
- **Phase 1:** `02-project-structure.md` §5 Phase 1 + `05-database-schema.md` + `ux-conventions.md` §2 (tokens)
- **Phase 2:** `02-project-structure.md` §5 Phase 2 + `feature-specs/onboarding.md` + `compliance/privacy-and-data.md` §3 (consent)
- **Phase 3:** `02-project-structure.md` §5 Phase 3 + `feature-specs/activity-builder.md` + `feature-specs/session-logging.md` + `feature-specs/activity.md` + `rewards-levels-accolades.md` + `04-offline-sync.md`
- **Phase 4:** `02-project-structure.md` §5 Phase 4 + `feature-specs/home-dashboard.md` + `feature-specs/stats.md` + `feature-specs/profile.md` + `feature-specs/accounts-center.md`
- **Phase 5:** `02-project-structure.md` §5 Phase 5

## Keeping docs in sync

After completing any task, check whether the work changes anything documented in `docs/`. Specifically:
- If a feature spec's open question was answered by implementation, remove it from the spec and note the decision.
- If implementation diverged from a spec (different behavior, different data shape, different flow), update the spec to match what was actually built.
- If a `[TBD]` field anywhere in docs/ now has a real answer, fill it in.
- If a new table, column, or relationship was added, update `docs/architecture/05-database-schema.md`.
- If a new shared component was created, check if `docs/ux-conventions.md` should reference it.

Do not silently diverge from specs. Either follow the spec or update it — never leave them out of sync. Flag doc updates to me so I can see what changed.

## Stack
React Native 0.83.4 + Expo SDK 55 (New Architecture). TypeScript strict.
Backend: Supabase (PostgreSQL + RLS + Storage + Edge Functions).
DB local: expo-sqlite + MMKV. Routing: Expo Router v5 (file-based, SDK 55).
State: Zustand (client) + TanStack Query v5 (server) — NEVER mix.
Payments: RevenueCat. Crashes: Sentry SDK 8. Package manager: bun.

## Commands
bun install          # dependencies
bun run start        # dev server
bun run typecheck    # tsc --noEmit (always run before finishing)
bun test             # Jest + RNTL
bun run lint         # ESLint
maestro test e2e/flows/
npx supabase db push

## Verification
After ANY change: bun run typecheck && bun test

## Structure
app/          — Expo Router routes: (auth)/, (tabs)/, (modals)/, (settings)/
src/features/ — One folder per feature (see 02-project-structure.md)
src/shared/   — Shared components, hooks, tracking-element type definitions
src/stores/   — Zustand stores (active-child, active-session, ui-preferences)
src/lib/      — Infrastructure: supabase/, sqlite/, sync/
src/types/    — domain.types.ts, database.types.ts, api.types.ts
e2e/flows/    — Maestro YAML flows
docs/         — Feature specs, architecture, design, compliance

## Critical rules
- Zustand = ONLY client state
- TanStack Query = ONLY server state
- Supabase RLS required on ALL tables
- Auth tokens in expo-secure-store, NEVER AsyncStorage
- Activities use 18 configurable tracking element types — see docs/feature-specs/activity-builder.md
- Multi-tenancy: auth.uid() → family_members → family_id
- Offline-first: expo-sqlite as local truth, sync queue drains to Supabase — see docs/architecture/04-offline-sync.md
- Media: use expo-video and expo-audio — expo-av removed in SDK 55
- Timer pattern: store startTime as Date.now() in MMKV, never accumulate elapsed
- Features are islands: no feature imports another feature's components, hooks, or repositories
- Route files in app/ are thin wrappers — all logic lives in src/features/

## NEVER do
- NO any — use unknown
- NO TouchableOpacity — use Pressable
- NO inline styles — use StyleSheet.create
- NO server data in Zustand
- NO direct Supabase imports in components — go through repositories in src/features/<name>/repositories/
- NO barrel index.ts files — import specific files always
- NO AsyncStorage — use MMKV for persistent UI state, expo-secure-store for auth tokens

## Reference docs
docs/architecture/02-project-structure.md  — committed project structure and build phases
docs/architecture/04-offline-sync.md       — offline-first sync strategy
docs/architecture/05-database-schema.md    — all tables, columns, RLS, cascades
docs/feature-specs/                        — one spec per screen/feature
docs/rewards-levels-accolades.md           — currency, levels, streaks, accolades rules
docs/ux-conventions.md                     — navigation, design tokens, error/loading/empty patterns
docs/compliance/privacy-and-data.md        — data inventory, privacy policy, SDK audit
docs/team-workflow.md                      — branching, definition of done, cadence (template)
