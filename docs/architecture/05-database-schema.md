# Database Schema — Brinca

> Every table the app uses, what it stores, and who reads/writes it. This is a starting reference for implementation — it will evolve during development.

**Date:** April 15, 2026
**Status:** Draft — will be updated as implementation progresses
**Related docs:** [`02-project-structure.md`](02-project-structure.md), [`04-offline-sync.md`](04-offline-sync.md), [`../rewards-levels-accolades.md`](../rewards-levels-accolades.md), [`../compliance/privacy-and-data.md`](../compliance/privacy-and-data.md)

---

## 1. Ownership tree

How the data connects, top to bottom. Every arrow means "owns many."

```
auth.users (Supabase Auth — managed)
  └─ profiles

families
  ├─ family_members → links to auth.users
  ├─ invites
  └─ children
       ├─ activities
       │    ├─ drills
       │    │    ├─ tracking_elements
       │    │    ├─ tier_rewards (drill-level)
       │    │    └─ bonus_presets (drill-level)
       │    ├─ tier_rewards (activity/session-level)
       │    └─ bonus_presets (activity/session-level)
       ├─ sessions
       │    ├─ drill_results
       │    │    └─ element_values
       │    └─ currency_ledger entries (drill_tier, session_tier, manual_bonus)
       ├─ currency_ledger (all sources)
       ├─ rewards (savings goals)
       ├─ accolade_unlocks
       ├─ measurements
       └─ external_activities
```

---

## 2. Tables

Every table except `sync_queue` exists in **both SQLite (local) and Supabase (cloud)** with matching schemas. The sync engine keeps them in sync per [`04-offline-sync.md`](04-offline-sync.md).

Standard columns on every table unless noted: `id` (UUID, primary key), `created_at` (timestamp), `updated_at` (timestamp).

---

### 2.1 profiles

Stores the app user's own profile data. One row per registered user.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Same as Supabase `auth.users.id` — not auto-generated, set on creation |
| `display_name` | text, required | Max 50 characters |
| `persona_type` | text | One of: `parent`, `therapist`, `coach`, `teacher`, `other` |
| `avatar_url` | text, nullable | Supabase Storage URL; local file URI while upload pending |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** onboarding (Step 1), accounts-center (edit name, edit photo).
**Read by:** parent avatar on every screen, accounts-center, settings.

---

### 2.2 families

One family is created per account during onboarding. Family members share access to children.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `currency_name` | text | Default: "Coins". Configurable per family. |
| `measurement_unit` | text | `metric` or `imperial`. Default: `metric`. |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** onboarding (created implicitly with the first account), accounts-center (measurement unit toggle).
**Read by:** home-dashboard (currency name), profile (measurement display), accounts-center.

---

### 2.3 family_members

Links users to families with a role. One user belongs to one family in V1.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `family_id` | UUID, FK → families | |
| `user_id` | UUID, FK → auth.users | |
| `role` | text | One of: `admin`, `co_admin`, `collaborator`, `member` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** onboarding (admin role on creation), invite acceptance (assigned role).
**Read by:** accounts-center (family list, role display), RLS policy chain (every table).

---

### 2.4 invites

Pending invitations to join a family.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `family_id` | UUID, FK → families | |
| `email` | text, required | Recipient's email |
| `role` | text | Role to assign on acceptance: `co_admin`, `collaborator`, or `member` |
| `invited_by` | UUID, FK → auth.users | |
| `created_at` | timestamp | |
| `accepted_at` | timestamp, nullable | Set when the recipient completes signup/login via the invite link |

**Written by:** accounts-center (invite flow).
**Read by:** accounts-center (pending invites — open question whether these are shown in V1).

---

### 2.5 children

One row per child added to a family.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `family_id` | UUID, FK → families | |
| `name` | text, required | Max 50 characters |
| `avatar_url` | text, nullable | Supabase Storage URL; local file URI while upload pending |
| `date_of_birth` | date, nullable | Required during onboarding, but nullable for schema flexibility |
| `gender` | text, nullable | `male`, `female`, or `prefer_not_to_say` |
| `country` | text, nullable | Free text |
| `grade_level` | text, nullable | Free text (e.g. "4th grade") |
| `school_calendar` | text, nullable | `panamanian`, `us`, or `custom` |
| `calendar_start_month` | integer, nullable | 1–12. Only set when school_calendar = `custom`. |
| `calendar_end_month` | integer, nullable | 1–12. Only set when school_calendar = `custom`. |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** onboarding (Step 2), profile edit form.
**Read by:** home-dashboard (name, photo), profile (all fields), child switcher, session-logging (child name context).

---

### 2.6 activities

A named activity configured for a specific child (e.g. "Baseball", "Dr. Melillo Therapy").

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `child_id` | UUID, FK → children | Activities are per-child, not per-family |
| `name` | text, required | Max 50 characters |
| `icon` | text, nullable | Icon identifier from predefined set |
| `category` | text, nullable | `sport`, `therapy`, `academic`, `custom` |
| `is_active` | boolean | Default: true. Deactivated activities hidden from Activity tab. |
| `display_order` | integer | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** onboarding (Step 3 — name only), activity-builder (full configuration).
**Read by:** activity tab (selector list), session-logging (session context), stats (filter list), activity-builder (edit).

---

### 2.7 drills

A named drill within an activity (e.g. "Consecutive catches", "Tongue placement exercise").

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `activity_id` | UUID, FK → activities | |
| `name` | text, required | Max 50 characters |
| `is_active` | boolean | Default: true. Deactivated drills hidden from sessions. |
| `display_order` | integer | Reorderable via long-press drag in builder |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** activity-builder.
**Read by:** session-logging (drill list), activity-builder (edit), stats (session detail).

---

### 2.8 tracking_elements

A configurable input widget on a drill (e.g. a counter, a timer, a checklist). One drill can have many elements, including multiple of the same type.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `drill_id` | UUID, FK → drills | |
| `type` | text | One of the 18 element type identifiers (see below) |
| `label` | text, required | User-facing label |
| `config` | JSONB | Type-specific configuration: target values, options, durations, substep names, etc. Shape depends on `type`. |
| `display_order` | integer | Reorderable via long-press drag in builder |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Element type identifiers (18):**
`counter`, `combined_counter`, `split_counter`, `multistep_counter`, `stopwatch`, `countdown_timer`, `lap_timer`, `interval_timer`, `checklist`, `single_select`, `multi_select`, `yes_no`, `rating_scale`, `emoji_face_scale`, `number_input`, `multi_number_input`, `free_text_note`, `voice_note`

**Written by:** activity-builder.
**Read by:** session-logging (renders interactive widgets), activity-builder (edit), stats (display-only rendering).

---

### 2.9 tier_rewards

A named reward tier on a drill or activity (e.g. "Perfect — 10 coins if all drills completed").

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `parent_type` | text | `activity` or `drill` — polymorphic parent |
| `parent_id` | UUID | FK → activities.id or drills.id depending on parent_type |
| `name` | text, required | e.g. "Perfect", "Great", "Good" |
| `conditions` | JSONB | Array of conditions, each referencing a tracking_element_id + operator + value. AND logic. |
| `currency_amount` | integer | Coins earned if this tier qualifies |
| `display_order` | integer | Lower = higher priority in tiebreaker |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** activity-builder (tier configuration).
**Read by:** session-logging (tier evaluation at Finish Session), session summary (display).

---

### 2.10 bonus_presets

Pre-configured bonus amounts the parent can quickly award during a session.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `parent_type` | text | `activity` or `drill` |
| `parent_id` | UUID | FK → activities.id or drills.id depending on parent_type |
| `amount` | integer | Coin amount |
| `display_order` | integer | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** activity-builder.
**Read by:** session-logging (bonus picker on session summary and drill screen).

---

### 2.11 rewards

Savings goals the child works toward (e.g. "New baseball glove — 100 coins").

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `child_id` | UUID, FK → children | |
| `name` | text, required | |
| `cost` | integer | Currency amount needed to redeem |
| `state` | text | `saving`, `ready_to_redeem`, or `redeemed` |
| `created_at` | timestamp | |
| `redeemed_at` | timestamp, nullable | Set when parent taps Redeem |

**Written by:** rewards screen (not yet specced — creates/edits/deletes goals), home-dashboard ("Add reward" CTA).
**Read by:** home-dashboard (closest reward progress), session summary (threshold crossing celebration), rewards screen.

**State transitions:** per [`rewards-levels-accolades.md`](../rewards-levels-accolades.md) §4.2.

---

### 2.12 sessions

One row per logged session.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Generated client-side at session start |
| `child_id` | UUID, FK → children | |
| `activity_id` | UUID, FK → activities | |
| `started_at` | timestamp | |
| `ended_at` | timestamp, nullable | Set when Finish Session is tapped |
| `duration_seconds` | integer, nullable | Calculated from started_at and ended_at minus paused time |
| `note` | text, nullable | Session-level free text note |
| `photo_url` | text, nullable | Session-level photo; local URI until uploaded |
| `is_complete` | boolean | True when Finish Session is tapped; false for interrupted/abandoned sessions |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** session-logging.
**Read by:** home-dashboard (recent sessions, session count, streaks — derived), stats (session list, charts), profile (photo gallery).

---

### 2.13 drill_results

One row per drill logged within a session. A session may have zero drill results (valid per session-logging.md).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `session_id` | UUID, FK → sessions | |
| `drill_id` | UUID, FK → drills | |
| `is_complete` | boolean | True when Finish drill or Mark complete is tapped |
| `note` | text, nullable | Drill-level free text note |
| `photo_url` | text, nullable | Drill-level photo; local URI until uploaded |
| `voice_note_url` | text, nullable | Drill-level voice note from Voice Note element; local URI until uploaded |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** session-logging (auto-saved after each action).
**Read by:** stats (session detail), session summary (drills logged list).

Wait — voice notes are element values, not drill-level. Let me reconsider. Actually voice_note_url doesn't belong here. Voice notes are tracking elements and their values are stored in element_values. Same for photos taken via elements. The drill-level photo is a separate attachment per the session-logging spec (the photo attachment button at the bottom of the drill screen). Voice note as an element stores its file_uri in element_values.value JSONB.

Let me correct this.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `session_id` | UUID, FK → sessions | |
| `drill_id` | UUID, FK → drills | |
| `is_complete` | boolean | True when Finish drill or Mark complete is tapped |
| `note` | text, nullable | Drill-level free text note |
| `photo_url` | text, nullable | Drill-level photo attachment; local URI until uploaded |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** session-logging (auto-saved after each action).
**Read by:** stats (session detail), session summary (drills logged list).

---

### 2.14 element_values

One row per tracking element recorded within a drill result. Stores the actual value the parent entered during the session.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `drill_result_id` | UUID, FK → drill_results | |
| `tracking_element_id` | UUID, FK → tracking_elements | |
| `value` | JSONB | Shape depends on element type — see value shapes below |
| `created_at` | timestamp | |

**Value shapes by element type:**

| Element type | JSONB shape |
|---|---|
| `counter` | `{ "count": 64 }` |
| `combined_counter` | `{ "count": 64 }` |
| `split_counter` | `{ "left": 12, "right": 8 }` |
| `multistep_counter` | `{ "reps": 10 }` |
| `stopwatch` | `{ "elapsed_seconds": 145 }` |
| `countdown_timer` | `{ "remaining_seconds": 0, "elapsed_seconds": 120 }` |
| `lap_timer` | `{ "laps": [12.4, 10.8, 11.2], "total_elapsed": 34.4 }` |
| `interval_timer` | `{ "completed_cycles": 5, "total_elapsed": 300, "skipped_phases": 0 }` |
| `checklist` | `{ "items": [{ "item_id": "x", "checked": true }, ...] }` |
| `single_select` | `{ "selected": "option_id" }` or `{ "selected": null }` |
| `multi_select` | `{ "selected": ["id1", "id2"] }` |
| `yes_no` | `{ "answer": "yes" }` or `{ "answer": null }` |
| `rating_scale` | `{ "value": 4 }` or `{ "value": null }` |
| `emoji_face_scale` | `{ "value": 3 }` or `{ "value": null }` |
| `number_input` | `{ "value": 68.5 }` or `{ "value": null }` |
| `multi_number_input` | `{ "values": [12.4, 13.1, 11.8] }` |
| `free_text_note` | `{ "text": "Struggled with left-side balls" }` |
| `voice_note` | `{ "file_uri": "local/or/storage/url", "duration_seconds": 45 }` or `null` |

**Written by:** session-logging (auto-saved after each interaction).
**Read by:** stats (session detail — display-only rendering), tier evaluation (at Finish Session).

---

### 2.15 currency_ledger

One row per currency event — earned or spent. The child's balance is `SUM(amount)`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `child_id` | UUID, FK → children | |
| `amount` | integer | Positive = earned, negative = spent (reward redemption) |
| `source` | text | `drill_tier`, `session_tier`, `manual_bonus`, `reward_redemption` |
| `reference_id` | UUID, nullable | FK → drill_results.id, sessions.id, or rewards.id depending on source |
| `reason` | text, nullable | Auto-filled for tier sources; required for manual bonuses; auto-filled for redemptions |
| `created_at` | timestamp | |

**Written by:** session-logging (at Finish Session — tier and bonus entries), rewards screen (redemption entry).
**Read by:** home-dashboard (balance = SUM), stats (currency earned per period), rewards screen (balance vs cost).

**Note:** no `updated_at` — ledger entries are append-only, never edited.

---

### 2.16 accolade_unlocks

One row per accolade unlocked by a child. Composite primary key.

| Column | Type | Notes |
|---|---|---|
| `child_id` | UUID, FK → children | Part of composite PK |
| `accolade_id` | text | Identifier from the static 17-item catalog in code. Part of composite PK. |
| `unlocked_at` | timestamp | |

**Written by:** session-logging (evaluated at Finish Session), rewards screen ("Big Win" on first redemption).
**Read by:** home-dashboard (3 most recent), session summary (newly unlocked), accolades screen.

**Note:** no `id`, no `updated_at` — unlocks are permanent and never modified per [`rewards-levels-accolades.md`](../rewards-levels-accolades.md) §7.5.

---

### 2.17 measurements

Weight and height entries for a child over time.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `child_id` | UUID, FK → children | |
| `type` | text | `weight` or `height` |
| `value` | real | Numeric value in the family's measurement unit |
| `date` | date | Date of measurement (defaults to today on entry) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** profile — measurements screen (Settings → Child → Measurements).
**Read by:** profile (most recent value + history view).

---

### 2.18 external_activities

Non-tracked activities the parent records for context (e.g. "Soccer practice, Tuesdays 3–4 PM").

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `child_id` | UUID, FK → children | |
| `name` | text, required | Max 50 characters |
| `schedule` | text, nullable | Free text |
| `location` | text, nullable | Free text |
| `notes` | text, nullable | Free text, no limit |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Written by:** profile — external activities screen (Settings → Child → External activities).
**Read by:** profile (activities list).

---

### 2.19 invites

Pending invitations to join a family.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `family_id` | UUID, FK → families | |
| `email` | text, required | |
| `role` | text | `co_admin`, `collaborator`, or `member` |
| `invited_by` | UUID, FK → auth.users | |
| `created_at` | timestamp | |
| `accepted_at` | timestamp, nullable | Set when recipient signs up or logs in via the invite link |

**Written by:** accounts-center (invite flow).
**Read by:** accounts-center (pending invites — visibility TBD per open question).

---

### 2.20 sync_queue (SQLite only — not in Supabase)

The outbound sync queue. Per [`04-offline-sync.md`](04-offline-sync.md).

| Column | Type | Notes |
|---|---|---|
| `id` | integer, autoincrement | Determines replay order |
| `operation` | text | `INSERT`, `UPDATE`, or `DELETE` |
| `table_name` | text | Target Supabase table |
| `payload` | text (JSON) | Serialized row data |
| `status` | text | `pending`, `in_flight`, or `failed` |
| `retry_count` | integer | Default: 0 |
| `last_error` | text, nullable | |
| `created_at` | timestamp | |

---

## 3. Row Level Security — policy intent

Every table in Supabase uses RLS. The chain is always: `auth.uid()` → `family_members` → `family_id`. Use `(SELECT auth.uid())` in policy expressions for performance.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Own row only | Own row only | Own row only | Via account deletion only |
| `families` | Member of family | System (onboarding) | Admin or Co-admin | Via account deletion only |
| `family_members` | Member of family | Admin or Co-admin (via invite acceptance) | Admin (role changes); Co-admin (limited) | Admin or Co-admin |
| `invites` | Member of family | Admin or Co-admin | None (accept sets accepted_at) | Admin or Co-admin |
| `children` | Member of family | Admin or Co-admin | Admin or Co-admin | Admin or Co-admin |
| `activities` | Member of family (via child → family) | Admin, Co-admin, or Collaborator | Admin, Co-admin, or Collaborator | Admin, Co-admin, or Collaborator |
| `drills` | Member of family (via activity → child → family) | Admin, Co-admin, or Collaborator | Admin, Co-admin, or Collaborator | Admin, Co-admin, or Collaborator |
| `tracking_elements` | Same as drills | Same as drills | Same as drills | Same as drills |
| `tier_rewards` | Same as drills | Same as drills | Same as drills | Same as drills |
| `bonus_presets` | Same as drills | Same as drills | Same as drills | Same as drills |
| `rewards` | Member of family (via child → family) | Admin, Co-admin, or Collaborator | Admin, Co-admin, or Collaborator | Admin, Co-admin, or Collaborator |
| `sessions` | Member of family (via child → family) | Any family member | Creator only | Admin or Co-admin |
| `drill_results` | Same as sessions | Same as sessions | Creator only | Via session deletion cascade |
| `element_values` | Same as sessions | Same as sessions | Creator only | Via drill_result deletion cascade |
| `currency_ledger` | Member of family (via child → family) | System (at Finish Session and redemption) | Never — append only | Via account/child deletion cascade |
| `accolade_unlocks` | Member of family (via child → family) | System (at Finish Session and redemption) | Never — permanent | Via child deletion cascade |
| `measurements` | Member of family (via child → family) | Admin or Co-admin | Admin or Co-admin | Admin or Co-admin |
| `external_activities` | Member of family (via child → family) | Admin or Co-admin | Admin or Co-admin | Admin or Co-admin |

**Role hierarchy reminder** (from [`feature-specs/accounts-center.md`](../feature-specs/accounts-center.md)):
- **Admin** — full access, one per family, manages everyone.
- **Co-admin** — full access, can manage Collaborators and Members.
- **Collaborator** — can create activities/drills, log sessions, see all data. Cannot manage family.
- **Member** — can log sessions only.

---

## 4. Cascade deletion rules

When a record is deleted, what else gets deleted automatically.

| When this is deleted… | …also delete |
|---|---|
| Account (Admin, last member) | family, all family_members, all children + cascades, all invites |
| Account (non-Admin member) | family_members row for that user. Family and children remain. |
| Child | activities, drills, tracking_elements, tier_rewards, bonus_presets, sessions, drill_results, element_values, currency_ledger entries, accolade_unlocks, rewards, measurements, external_activities, photos in Storage |
| Activity | drills, tracking_elements, tier_rewards (activity-level), bonus_presets (activity-level). Sessions that used this activity are preserved (activity name snapshotted). |
| Drill | tracking_elements, tier_rewards (drill-level), bonus_presets (drill-level). Past drill_results are preserved. |
| Session | drill_results, element_values, associated photos in Storage. Currency ledger entries are NOT reversed in V1. |

---

## 5. SQLite vs Supabase

| Location | Tables |
|---|---|
| **SQLite only** | `sync_queue` |
| **Supabase only** | `auth.users` (managed by Supabase Auth) |
| **Both (synced)** | All other 19 tables |

The SQLite schema mirrors Supabase exactly for synced tables. `src/lib/sqlite/schema.ts` defines the local schema; `supabase gen types typescript` generates the Supabase types. The mapper in `src/lib/supabase/mappers.ts` converts between them per [`02-project-structure.md`](02-project-structure.md) Decision 12.

---

## 6. Open questions

- [ ] Should `activities` snapshot their name and drill configuration at session start (so editing an activity mid-session doesn't affect the in-progress session)? Current edge case in [`activity-builder.md`](../feature-specs/activity-builder.md) says changes only take effect on the next session — this may require a `session_config_snapshot` JSONB column on `sessions`.
- [ ] Should `Member` role be able to create activities, or only log sessions on existing ones? Current spec says "log sessions only" — confirm this is intentional.
- [ ] Polymorphic `parent_type` + `parent_id` on `tier_rewards` and `bonus_presets` — the implementer may prefer two separate tables (`drill_tier_rewards` / `activity_tier_rewards`) for simpler foreign keys. Either approach works; decide during Phase 3.
- [ ] `family_members` — should a user be able to belong to multiple families (e.g. a therapist in multiple families)? Current assumption is one family per user in V1. Multi-family support would require rethinking the RLS chain.
