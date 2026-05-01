# Database ↔ Code Drift Audit

**Audited:** 2026-05-01
**Scope:** `supabase/migrations/`, `src/features/**/queries/`, `src/features/**/mutations/`, `src/features/**/repositories/`, `src/lib/sync/`, `src/lib/supabase/`
**Method:** schema inventory (3 migrations applied in timestamp order) + query inventory (20 `.from()` + 1 `.rpc()` call sites) + cross-reference

---

## 1. Summary

Two BLOCKERs and four CRITICALs dominate this audit; both blockers are RLS issues, not schema-query drift. **Storage RLS** (`avatars`, `session-media`) lets any authenticated user read every other family's media — no path scoping. **`currency_ledger.INSERT`** is gated only on `is_family_member`, so any 'member' role (including a child user) can credit themselves arbitrary currency. RLS coverage is otherwise solid: 18 of 18 user-data tables have RLS enabled with `is_family_member` / `has_write_access` / `is_admin_or_coadmin` helpers, and the JWT short-circuit in migration `20260426000001` is correctly applied. The biggest non-blocker risk is **zero indexes on FK columns** — every RLS check walks `family_members.user_id`, `children.family_id`, `activities.child_id`, etc., unindexed; this is fine at current scale but will degrade quickly. Schema-query drift in this audit is essentially nil because the V1 implementation is small (Phase 1 + partial Phase 2/3); 12 of 18 tables have no direct query references yet, which is expected, not stale. Generated types in [src/lib/supabase/types.ts](src/lib/supabase/types.ts) match the migration set 1:1.

---

## 2. Schema-query drift

| # | Severity | Direction | Table.column | Where in code | Description |
|---|----------|-----------|--------------|---------------|-------------|
| 1 | CRITICAL | code → ⌀ | `family_members ↔ profiles` (no FK) | [src/features/accounts-center/repositories/accounts-center.repository.ts:49-53](src/features/accounts-center/repositories/accounts-center.repository.ts#L49-L53) and [:196](src/features/accounts-center/repositories/accounts-center.repository.ts#L196) | `.select('id, user_id, role, profiles!inner (display_name, avatar_url)')` requires PostgREST to embed `profiles` via `family_members.user_id`. No FK is declared between `family_members.user_id` and `profiles.id` — both reference `auth.users(id)` indirectly. PostgREST's auto-detection does not reliably resolve "two tables sharing a third FK target" as an embeddable relationship. Likely runtime error: `Could not find a relationship between 'family_members' and 'profiles'`. The generated types in [src/lib/supabase/types.ts:426-434](src/lib/supabase/types.ts#L426-L434) confirm only the `families` FK on `family_members`. |
| 2 | LOW | ⌀ → schema | 12 unused tables | n/a | `drills`, `tracking_elements`, `tier_rewards`, `bonus_presets`, `rewards`, `sessions`, `drill_results`, `element_values`, `currency_ledger`, `accolade_unlocks`, `measurements`, `external_activities` are referenced only in [src/lib/supabase/mappers.ts](src/lib/supabase/mappers.ts), never in `.from()`/`.rpc()` code. Phases 3–4 not yet implemented. Sync engine `.from(tableName)` in [src/lib/sync/engine.ts:51](src/lib/sync/engine.ts#L51) accepts any table dynamically, so these are not actually dead. **Not a defect — flagging only so the audit accounts for them.** |

[Direction key: `code → ⌀` = code references missing schema; `⌀ → schema` = schema has unreferenced rows.]

---

## 3. Type drift

| # | Severity | Type in code | Type in schema | Where | Impact |
|---|----------|--------------|----------------|-------|--------|
| — | — | — | — | — | **No drift detected.** Types in [src/lib/supabase/types.ts](src/lib/supabase/types.ts) match all 18 tables in migration `20260420000000_initial_schema.sql`. Nullability matches: `sessions.duration_seconds: number \| null` ↔ `INTEGER` (nullable); `measurements.value: number` ↔ `REAL NOT NULL`; `profiles.persona_type: string \| null` ↔ `TEXT CHECK (...)` (nullable). The string-typed enum-like columns (`persona_type`, `gender`, `category`, `state`, `source`, `school_calendar`, `parent_type`, `measurement_unit`) are mapped to domain enums in [src/lib/supabase/mappers.ts](src/lib/supabase/mappers.ts) via `as` casts — this is normal Supabase behavior because CHECK constraints don't introspect to enum types, and the runtime values are constrained by the CHECK at insert. |

---

## 4. RLS audit

| # | Table | Severity | Status | Issue | Risk |
|---|-------|----------|--------|-------|------|
| 1 | `storage.objects` (`avatars` bucket) | **BLOCKER** | RLS enabled, policies too permissive | [`avatars_select`/`insert`/`update`](supabase/migrations/20260420000000_initial_schema.sql#L846-L853) check only `bucket_id = 'avatars' AND auth.uid() IS NOT NULL`. No path scoping. | Any authenticated user can read every other user's avatar object. Path is `<user_id>/avatar-<ts>.jpg` per [accounts-center.repository.ts:161](src/features/accounts-center/repositories/accounts-center.repository.ts#L161) — enumerable by user_id. Also no DELETE policy, so users cannot remove their own avatars. |
| 2 | `storage.objects` (`session-media` bucket) | **BLOCKER** | RLS enabled, policies too permissive | [`session_media_select`/`insert`/`update`](supabase/migrations/20260420000000_initial_schema.sql#L855-L862) — same pattern: any authenticated user → full bucket read. | Any authenticated user can read every other family's session media (photos of children). Privacy + compliance breach. Per [docs/compliance/privacy-and-data.md](docs/compliance/privacy-and-data.md), session media may include child photos. |
| 3 | `currency_ledger` | **BLOCKER** | RLS enabled, INSERT policy too permissive | [`currency_ledger_insert`](supabase/migrations/20260420000000_initial_schema.sql#L737-L740) gates on `is_family_member` only. Any family role — including `'member'` (child) and `'collaborator'` — can insert any `amount` with any `source`. | A child user could self-credit arbitrary currency by inserting a `manual_bonus` row. Defeats the entire reward economy. Append-only RLS (no UPDATE/DELETE) does NOT mitigate; it just makes the fraud permanent. |
| 4 | `families` | MEDIUM | RLS enabled, INSERT open | [`families_insert_system`](supabase/migrations/20260420000000_initial_schema.sql#L119-L120): `WITH CHECK (true)`. Any authenticated user can `INSERT INTO families`. | Spam-create family rows. Not a data-leak (RLS scopes reads via `is_family_member`), but garbage rows accumulate. |
| 5 | `accolade_unlocks` | MEDIUM | RLS enabled, INSERT too permissive | [`accolade_unlocks_insert`](supabase/migrations/20260420000000_initial_schema.sql#L761-L764) gates on `is_family_member`. A `'member'` could grant themselves any accolade. | Less severe than #3 because accolades carry no currency value, but unlocks should be system-driven (server-side reward calc). |
| 6 | `invites` | MEDIUM | RLS enabled, no UPDATE policy | Schema in [migration 1:144-163](supabase/migrations/20260420000000_initial_schema.sql#L144-L163) defines `accepted_at TIMESTAMPTZ` but no UPDATE policy on `invites`. | When the invite-acceptance flow is built (Phase 2 follow-up), it will fail to mark `accepted_at`. Not currently exploited by code — preventive flag. |
| 7 | All user-data tables | n/a | RLS enabled, full coverage | n/a | All 18 user-data tables have RLS enabled. SELECT/INSERT/UPDATE policies are present where needed. Skip-DELETE on `currency_ledger`/`accolade_unlocks` is intentional (append-only); skip-DELETE on `drill_results`/`element_values` is intentional (delete via session/drill-result cascade only). `is_family_member` JWT short-circuit in [migration 3](supabase/migrations/20260426000001_is_family_member_jwt_short_circuit.sql) is correct: matching claim short-circuits, mismatch falls through to the table lookup, and `SET search_path = public` closes the SECURITY DEFINER CVE pattern. |
| 8 | Service role from client | n/a | OK | n/a | `grep -r "service_role\|SERVICE_ROLE\|serviceRole"` across `src/`, `app/`, `supabase/` returns zero hits. [src/lib/supabase/client.ts:5](src/lib/supabase/client.ts#L5) uses `EXPO_PUBLIC_SUPABASE_ANON_KEY` only. ✓ |

---

## 5. Migration inconsistencies

| # | Severity | Migration(s) | Issue |
|---|----------|--------------|-------|
| 1 | CRITICAL | `20260420000000_initial_schema.sql` (all tables) | **Zero `CREATE INDEX` statements across all 3 migrations.** Postgres does not auto-index foreign keys. Every RLS policy on family-scoped tables walks unindexed FK columns: `family_members.user_id` (every `is_family_member` call), `children.family_id`, `activities.child_id`, `drills.activity_id`, `tracking_elements.drill_id`, `sessions.child_id`, `drill_results.session_id`, `element_values.drill_result_id`, `tier_rewards.parent_id`, `bonus_presets.parent_id`, `rewards.child_id`, `currency_ledger.child_id`, `measurements.child_id`, `external_activities.child_id`, `invites.family_id`. Auto-indexed: PKs (`id`), `family_members(family_id, user_id)` UNIQUE, `accolade_unlocks(child_id, accolade_id)` PK. Everything else is sequential scan inside the RLS subquery on every authenticated read. |
| 2 | MEDIUM | `20260420000000_initial_schema.sql:588`, `:627`, `:675` | `sessions.activity_id`, `drill_results.drill_id`, and `element_values.tracking_element_id` reference parent rows without an `ON DELETE` clause — defaults to `NO ACTION`. Hard-deleting an activity/drill/tracking_element will fail if any session/drill_result/element_value references it. Likely intentional for historical preservation, but no soft-delete column exists either. Document or add `ON DELETE RESTRICT` explicitly + a `deleted_at` column to enable soft-deletion. |
| 3 | MEDIUM | `20260420000000_initial_schema.sql:149` | `invites.invited_by REFERENCES auth.users(id)` lacks `ON DELETE` clause (defaults to `NO ACTION`). Account deletion will fail when the deleted user has outstanding invites. Compounds with the unimplemented `delete-account` Edge Function ([useDeleteAccountMutation.ts:23-26](src/features/accounts-center/mutations/useDeleteAccountMutation.ts#L23-L26)). |
| 4 | LOW | `20260420000000_initial_schema.sql` | Tables created without `CREATE TABLE IF NOT EXISTS`. Migration is not idempotent — re-running will error. Acceptable for a single timestamped migration that runs once, but the convention is fragile if the file is ever re-applied (e.g., during local dev resets without a clean DB). |
| 5 | n/a | All migrations | No conflicting CREATE/ALTER. `is_family_member` is `CREATE OR REPLACE` in both migration 1 and 3; migration 3 intentionally redefines with `SET search_path = public` (CVE fix per its header comment). No DROP/ADD column conflicts. ✓ |

---

## 6. Dangerous query patterns

| # | Severity | Pattern | Where | Why dangerous |
|---|----------|---------|-------|---------------|
| 1 | LOW | `for…of` loop with per-row local insert | [src/lib/sync/rehydrate.ts:179-193](src/lib/sync/rehydrate.ts#L179-L193) | Per-row `db.runAsync` per remote activity. This is **local SQLite**, not Supabase — no network round-trips. Bound size is small (activities per child, typically <50). Could be batched with `INSERT … VALUES (?), (?), …` for marginal gain. Not a real N+1. |
| 2 | n/a | `.select('*')` | n/a | Zero hits across `src/`. All call sites use explicit column lists. ✓ |
| 3 | n/a | Unbounded `.select()` without `.limit()` | All current call sites | Every `.from()` query scopes by `family_id`, `child_id`, `user_id`, or `id` — bounded by the data model. No tables (currency_ledger, sessions) are queried from client today. When Phase 3 lands, queries on `sessions` and `currency_ledger` will need explicit `.limit()` + pagination. Preventive flag only. |
| 4 | n/a | Service-role client from client code | n/a | None found. [src/lib/supabase/client.ts](src/lib/supabase/client.ts) uses anon key. ✓ |
| 5 | LOW | Generic `.from(tableName)` from queue payload | [src/lib/sync/engine.ts:51,57,62](src/lib/sync/engine.ts#L51) | `tableName` and `payload` come from the local SQLite `sync_queue`, populated by app code via [appendToQueue](src/lib/sync/queue.ts#L17). No external input path. RLS still gates writes. Acceptable. |

---

## 7. Recommendation

Fix the three RLS BLOCKERs first — storage path scoping (#1, #2) and `currency_ledger` write authorization (#3) are exploitable by any authenticated user, including children. The CRITICAL `family_members ↔ profiles` embed (#1 in §2) needs verification with a real Supabase project before shipping accounts-center; if it fails at runtime, replace the embed with two separate queries joined client-side (the comment at [accounts-center.repository.ts:58-61](src/features/accounts-center/repositories/accounts-center.repository.ts#L58-L61) suggests the author already anticipated relationship problems). The missing-FK-indexes finding (§5 #1) is the highest-leverage performance fix — one migration adds indexes for every RLS lookup; do it before Phase 4 stats queries, which will compound the cost. Type drift, migration ordering, and query patterns are all clean — no further action there.

---

## 8. Fix checklist

### BLOCKER

- [ ] **#1 — Storage `avatars` bucket: scope by user folder.** Add migration:
  ```sql
  DROP POLICY "avatars_select" ON storage.objects;
  DROP POLICY "avatars_insert" ON storage.objects;
  DROP POLICY "avatars_update" ON storage.objects;

  CREATE POLICY "avatars_select_own_or_family" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'avatars'
      AND (
        (storage.foldername(name))[1] = (SELECT auth.uid())::text
        OR EXISTS (
          SELECT 1 FROM family_members fm_self
          JOIN family_members fm_other ON fm_other.family_id = fm_self.family_id
          WHERE fm_self.user_id = (SELECT auth.uid())
            AND fm_other.user_id::text = (storage.foldername(name))[1]
        )
      )
    );

  CREATE POLICY "avatars_insert_own" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

  CREATE POLICY "avatars_update_own" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

  CREATE POLICY "avatars_delete_own" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );
  ```
  Path convention from [accounts-center.repository.ts:161](src/features/accounts-center/repositories/accounts-center.repository.ts#L161) is `<user_id>/avatar-<ts>.jpg`, so `(storage.foldername(name))[1]` returns the owner's user_id. Family read is allowed for the family-member-list UI.

- [ ] **#2 — Storage `session-media` bucket: scope by family folder.** Update [src/lib/sync/media-uploader.ts](src/lib/sync/media-uploader.ts) to write to `<family_id>/<session_id>/...` (not by user_id), then:
  ```sql
  DROP POLICY "session_media_select" ON storage.objects;
  DROP POLICY "session_media_insert" ON storage.objects;
  DROP POLICY "session_media_update" ON storage.objects;

  CREATE POLICY "session_media_select_family" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'session-media'
      AND is_family_member(((storage.foldername(name))[1])::uuid)
    );

  CREATE POLICY "session_media_insert_family" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'session-media'
      AND is_family_member(((storage.foldername(name))[1])::uuid)
    );

  CREATE POLICY "session_media_update_family" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'session-media'
      AND is_family_member(((storage.foldername(name))[1])::uuid)
    );

  CREATE POLICY "session_media_delete_admin" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'session-media'
      AND is_admin_or_coadmin(((storage.foldername(name))[1])::uuid)
    );
  ```

- [ ] **#3 — `currency_ledger.INSERT`: restrict by source + role.** Replace policy:
  ```sql
  DROP POLICY "currency_ledger_insert" ON currency_ledger;

  CREATE POLICY "currency_ledger_insert_admin_or_system" ON currency_ledger
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM children c
        WHERE c.id = currency_ledger.child_id
          AND (
            -- manual_bonus + reward_redemption: admin/co_admin only
            (source IN ('manual_bonus', 'reward_redemption') AND is_admin_or_coadmin(c.family_id))
            -- drill_tier + session_tier: any family member (system-generated)
            OR (source IN ('drill_tier', 'session_tier') AND is_family_member(c.family_id))
          )
      )
    );
  ```
  Long-term: move ledger inserts into a `SECURITY DEFINER` function so only validated server-computed entries land — this stops any client from forging `drill_tier` rows too.

### CRITICAL

- [ ] **#4 — Verify `family_members.profiles!inner` embed works at runtime.** Test against a real Supabase project. If PostgREST returns `Could not find a relationship between 'family_members' and 'profiles'`, change [src/features/accounts-center/repositories/accounts-center.repository.ts:42-77](src/features/accounts-center/repositories/accounts-center.repository.ts#L42-L77) to two queries:
  ```ts
  const { data: members, error } = await supabase
    .from('family_members')
    .select('id, user_id, role')
    .eq('family_id', familyId);
  if (error) throw error;

  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds);
  if (profilesError) throw profilesError;

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  return (members ?? []).map((row) => {
    const p = profileById.get(row.user_id);
    return {
      id: row.id,
      userId: row.user_id,
      displayName: p?.display_name ?? '',
      email: '',
      avatarUrl: p?.avatar_url ?? null,
      role: row.role as FamilyRole,
    };
  });
  ```
  Same change required at [:194-197](src/features/accounts-center/repositories/accounts-center.repository.ts#L194-L197).

- [ ] **#5 — Add indexes on every FK column used in RLS.** New migration `2026XXXX_fk_indexes.sql`:
  ```sql
  CREATE INDEX idx_family_members_user_id ON family_members(user_id);
  CREATE INDEX idx_invites_family_id ON invites(family_id);
  CREATE INDEX idx_children_family_id ON children(family_id);
  CREATE INDEX idx_activities_child_id ON activities(child_id);
  CREATE INDEX idx_drills_activity_id ON drills(activity_id);
  CREATE INDEX idx_tracking_elements_drill_id ON tracking_elements(drill_id);
  CREATE INDEX idx_tier_rewards_parent ON tier_rewards(parent_type, parent_id);
  CREATE INDEX idx_bonus_presets_parent ON bonus_presets(parent_type, parent_id);
  CREATE INDEX idx_rewards_child_id ON rewards(child_id);
  CREATE INDEX idx_sessions_child_id ON sessions(child_id);
  CREATE INDEX idx_sessions_activity_id ON sessions(activity_id);
  CREATE INDEX idx_drill_results_session_id ON drill_results(session_id);
  CREATE INDEX idx_drill_results_drill_id ON drill_results(drill_id);
  CREATE INDEX idx_element_values_drill_result_id ON element_values(drill_result_id);
  CREATE INDEX idx_element_values_tracking_element_id ON element_values(tracking_element_id);
  CREATE INDEX idx_currency_ledger_child_id ON currency_ledger(child_id);
  CREATE INDEX idx_measurements_child_id ON measurements(child_id);
  CREATE INDEX idx_external_activities_child_id ON external_activities(child_id);
  -- accolade_unlocks already indexed via composite PK (child_id, accolade_id)
  -- family_members(family_id, user_id) already indexed via UNIQUE constraint
  ```

### MEDIUM

- [ ] **#6 — Tighten `families.INSERT`.** Tying creation to immediate membership prevents spam:
  ```sql
  DROP POLICY "families_insert_system" ON families;
  -- Keep INSERT open for the onboarding bootstrap (the family_member row is
  -- inserted within the same mutation), but require the caller is authenticated:
  CREATE POLICY "families_insert_authenticated" ON families
    FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
  ```
  Stronger fix: move family + family_member creation into a single `SECURITY DEFINER` RPC `bootstrap_family(display_name, persona_type)` and revoke client INSERT entirely.

- [ ] **#7 — `accolade_unlocks.INSERT`: same as currency_ledger.** Either restrict by role or move to a `SECURITY DEFINER` function the client cannot forge.

- [ ] **#8 — Add UPDATE policy for `invites` (mark accepted).**
  ```sql
  CREATE POLICY "invites_update_accept" ON invites
    FOR UPDATE USING (
      -- The invitee accepts: their email matches the row email
      lower(email) = lower((SELECT email FROM auth.users WHERE id = (SELECT auth.uid())))
    ) WITH CHECK (
      lower(email) = lower((SELECT email FROM auth.users WHERE id = (SELECT auth.uid())))
    );
  ```

- [ ] **#9 — `invites.invited_by` cascade.** New migration:
  ```sql
  ALTER TABLE invites
    DROP CONSTRAINT invites_invited_by_fkey,
    ADD CONSTRAINT invites_invited_by_fkey
      FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  ALTER TABLE invites ALTER COLUMN invited_by DROP NOT NULL;
  ```
  Or `ON DELETE CASCADE` if invites by deleted users should disappear.

- [ ] **#10 — Document `sessions.activity_id` / `drill_results.drill_id` / `element_values.tracking_element_id` no-cascade behavior.** Either add explicit `ON DELETE RESTRICT` and a `deleted_at` soft-delete column to the parent tables, or document in [docs/architecture/05-database-schema.md](docs/architecture/05-database-schema.md) that activities/drills/elements are append-only once referenced by historical data.

### LOW

- [ ] **#11 — `delete-account` Edge Function still TODO.** Implement server-side data deletion ([useDeleteAccountMutation.ts:23-26](src/features/accounts-center/mutations/useDeleteAccountMutation.ts#L23-L26), [accounts-center.repository.ts:245-250](src/features/accounts-center/repositories/accounts-center.repository.ts#L245-L250)) — required by privacy policy. Out of scope for "drift" but blocks compliance.

- [ ] **#12 — Convert per-row activity inserts to batch.** [src/lib/sync/rehydrate.ts:179-193](src/lib/sync/rehydrate.ts#L179-L193) — minor local-perf win.

- [ ] **#13 — Add `IF NOT EXISTS` to initial migration.** Pure hygiene for local dev resets:
  ```sql
  CREATE TABLE IF NOT EXISTS profiles ( ... );
  -- ... etc
  ```
