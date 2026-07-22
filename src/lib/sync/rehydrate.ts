import type { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';

import { getDatabase } from '../sqlite/db';
import { supabase } from '../supabase/client';
import type { UUID } from '@/types/domain.types';

/**
 * Ensure the family and child rows exist in local SQLite.
 * Must run BEFORE auth resolves to 'authenticated' so that any
 * subsequent data operations (create activity, start session, etc.)
 * pass FK constraints.
 *
 * On a normal launch, both rows exist and this is two fast SELECT checks.
 * On reinstall, it pulls from Supabase (~500ms for 2 queries + 2 inserts).
 *
 * If the Supabase queries fail (token timing, RLS race, network), the
 * function falls back to inserting minimal rows using the data already
 * known by the caller. The sync engine will backfill full data later.
 */
export async function ensureLocalFKChain(
  childId: UUID,
  familyId: UUID,
  childName?: string | null,
): Promise<void> {
  if (__DEV__) {
    console.log('[FK] ensureLocalFKChain called with', { childId, familyId, childName });
  }
  Sentry.addBreadcrumb({ category: 'fk-chain', message: 'ensureLocalFKChain called', data: { childId, familyId, hasChildName: !!childName } });
  const db = await getDatabase();

  // 1. Family row
  const localFamily = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM families WHERE id = ?',
    familyId,
  );
  if (!localFamily) {
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id, currency_name, measurement_unit, created_at, updated_at')
      .eq('id', familyId)
      .single();

    if (family) {
      await db.runAsync(
        `INSERT OR IGNORE INTO families (id, currency_name, measurement_unit, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        family.id,
        family.currency_name,
        family.measurement_unit,
        family.created_at,
        family.updated_at,
      );
    } else {
      if (__DEV__) {
        console.warn('[FK] Family Supabase query failed for id:', familyId, 'error:', familyError);
      }
      Sentry.captureMessage(`FK chain: family query failed for ${familyId}`, {
        level: 'warning',
        extra: { familyId, errorCode: familyError?.code, errorMessage: familyError?.message },
      });
      // Fallback: insert minimal row so child FK can reference it
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT OR IGNORE INTO families (id, currency_name, measurement_unit, created_at, updated_at)
         VALUES (?, 'Coins', 'metric', ?, ?)`,
        familyId,
        now,
        now,
      );
      Sentry.addBreadcrumb({ category: 'fk-chain', message: 'family fallback insert executed', data: { familyId } });
    }
  }

  // Verify family row exists before proceeding to child
  const familyCheck = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM families WHERE id = ?',
    familyId,
  );
  if (!familyCheck) {
    const msg = `FK chain: family row missing after insert attempt for ${familyId}`;
    if (__DEV__) {
      console.error('[FK]', msg);
    }
    Sentry.captureMessage(msg, 'error');
    return; // Cannot insert child without family
  }

  // 2. Child row (depends on family existing)
  const localChild = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM children WHERE id = ?',
    childId,
  );
  if (!localChild) {
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, family_id, name, avatar_url, date_of_birth, gender, country, grade_level, school_calendar, calendar_start_month, calendar_end_month, created_at, updated_at')
      .eq('id', childId)
      .single();

    if (child) {
      await db.runAsync(
        `INSERT OR IGNORE INTO children (id, family_id, name, avatar_url, date_of_birth, gender, country, grade_level, school_calendar, calendar_start_month, calendar_end_month, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        child.id,
        child.family_id,
        child.name,
        child.avatar_url ?? null,
        child.date_of_birth ?? null,
        child.gender ?? null,
        child.country ?? null,
        child.grade_level ?? null,
        child.school_calendar ?? null,
        child.calendar_start_month ?? null,
        child.calendar_end_month ?? null,
        child.created_at,
        child.updated_at,
      );
    } else {
      if (__DEV__) {
        console.warn('[FK] Child Supabase query failed for id:', childId, 'error:', childError);
      }
      Sentry.captureMessage(`FK chain: child query failed for ${childId}`, {
        level: 'warning',
        extra: { childId, familyId, errorCode: childError?.code, errorMessage: childError?.message, hasChildName: !!childName },
      });
      // Fallback: insert minimal row so activity FK can reference it
      if (childName) {
        const now = new Date().toISOString();
        await db.runAsync(
          `INSERT OR IGNORE INTO children (id, family_id, name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
          childId,
          familyId,
          childName,
          now,
          now,
        );
        Sentry.addBreadcrumb({ category: 'fk-chain', message: 'child fallback insert executed', data: { childId, familyId } });
      } else {
        Sentry.captureMessage(`FK chain: child fallback skipped — no childName provided`, {
          level: 'error',
          extra: { childId, familyId },
        });
      }
    }
  }

  // Final verification
  const childCheck = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM children WHERE id = ?',
    childId,
  );
  if (!childCheck) {
    const msg = `FK chain: child row missing after insert attempt for ${childId}`;
    if (__DEV__) {
      console.error('[FK]', msg);
    }
    Sentry.captureMessage(msg, 'error');
  }
}

/**
 * Pull EVERY child of a family into local SQLite.
 *
 * ensureLocalFKChain only inserts the single active child, so on a fresh
 * install a family with multiple children shows only the active one in the
 * child switcher (the switcher reads getChildrenByFamily, which is local-only).
 * The siblings exist in Supabase but never land locally until each one's own
 * data happens to sync. This bulk-pulls the whole roster so the switcher is
 * complete right after auth recovery, on both the fast path (persisted active
 * child) and the full path (first login).
 *
 * Fire-and-forget: non-fatal on failure (next launch retries). Invalidates the
 * children query so a mounted ProfileScreen / AccountsCenterScreen refreshes.
 */
export async function hydrateFamilyChildren(
  familyId: UUID,
  queryClient: QueryClient,
): Promise<void> {
  const db = await getDatabase();
  const { data, error } = await supabase
    .from('children')
    .select(
      'id, family_id, name, avatar_url, date_of_birth, gender, country, grade_level, school_calendar, calendar_start_month, calendar_end_month, created_at, updated_at',
    )
    .eq('family_id', familyId);

  if (error || !data) {
    Sentry.captureMessage(`hydrateFamilyChildren query failed for ${familyId}`, {
      level: 'warning',
      extra: { familyId, errorCode: error?.code, errorMessage: error?.message },
    });
    return;
  }

  let inserted = 0;
  for (const c of data) {
    const res = await db.runAsync(
      `INSERT OR IGNORE INTO children (id, family_id, name, avatar_url, date_of_birth, gender, country, grade_level, school_calendar, calendar_start_month, calendar_end_month, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      c.id,
      c.family_id,
      c.name,
      c.avatar_url ?? null,
      c.date_of_birth ?? null,
      c.gender ?? null,
      c.country ?? null,
      c.grade_level ?? null,
      c.school_calendar ?? null,
      c.calendar_start_month ?? null,
      c.calendar_end_month ?? null,
      c.created_at,
      c.updated_at,
    );
    inserted += res.changes;
  }

  // Only invalidate when a sibling was actually new locally, so we don't churn
  // the query on every launch once the roster is fully hydrated.
  if (inserted > 0) {
    queryClient.invalidateQueries({ queryKey: ['profile', 'children', familyId] });
  }
}

/**
 * Pull activities, drills, and tracking elements from Supabase into local SQLite.
 * Runs AFTER auth resolves — non-blocking, fire-and-forget.
 * Assumes ensureLocalFKChain has already run (child row exists).
 *
 * Each table is checked independently: skipped if the child already has rows
 * locally. Bootstrap rehydration only — the sync engine handles deltas.
 */
export async function rehydrateActivities(
  childId: UUID,
  queryClient: QueryClient,
): Promise<void> {
  const db = await getDatabase();

  // 1. Activities
  const activityCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM activities WHERE child_id = ?',
    childId,
  );
  if (!activityCount || activityCount.count === 0) {
    const { data, error } = await supabase
      .from('activities')
      .select('id, child_id, name, icon, category, is_active, display_order, deleted_at, created_at, updated_at')
      .eq('child_id', childId)
      .order('display_order', { ascending: true });
    if (!error && data) {
      for (const a of data) {
        await db.runAsync(
          `INSERT OR IGNORE INTO activities (id, child_id, name, icon, category, is_active, display_order, deleted_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          a.id, a.child_id, a.name, a.icon ?? null, a.category ?? null,
          a.is_active ? 1 : 0, a.display_order, a.deleted_at ?? null, a.created_at, a.updated_at,
        );
      }
    }
  }

  const activityRows = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM activities WHERE child_id = ?',
    childId,
  );
  if (activityRows.length === 0) {
    queryClient.invalidateQueries({ queryKey: ['activities'] });
    queryClient.invalidateQueries({ queryKey: ['activities-selector'] });
    return;
  }
  const activityIds = activityRows.map((a) => a.id);
  const activityPlaceholders = activityIds.map(() => '?').join(',');

  // 2. Drills
  const drillCount = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM drills WHERE activity_id IN (${activityPlaceholders})`,
    ...activityIds,
  );
  if (!drillCount || drillCount.count === 0) {
    const { data, error } = await supabase
      .from('drills')
      .select('id, activity_id, name, description, is_active, display_order, deleted_at, created_at, updated_at')
      .in('activity_id', activityIds)
      .order('display_order', { ascending: true });
    if (!error && data) {
      for (const d of data) {
        await db.runAsync(
          `INSERT OR IGNORE INTO drills (id, activity_id, name, description, is_active, display_order, deleted_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          d.id, d.activity_id, d.name, d.description, d.is_active ? 1 : 0, d.display_order,
          d.deleted_at ?? null, d.created_at, d.updated_at,
        );
      }
    }
  }

  const drillRows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM drills WHERE activity_id IN (${activityPlaceholders})`,
    ...activityIds,
  );
  if (drillRows.length === 0) {
    queryClient.invalidateQueries({ queryKey: ['activities'] });
    queryClient.invalidateQueries({ queryKey: ['activities-selector'] });
    queryClient.invalidateQueries({ queryKey: ['drills'] });
    return;
  }
  const drillIds = drillRows.map((d) => d.id);
  const drillPlaceholders = drillIds.map(() => '?').join(',');

  // 3. Tracking elements — always re-sync to overwrite any locally-corrupted
  // configs from a previous double-encoding bug. Uses ON CONFLICT DO UPDATE, not
  // INSERT OR REPLACE: REPLACE deletes the existing row first, and that delete is
  // blocked with "error 19: FOREIGN KEY constraint failed" once the element has
  // element_values (element_values.tracking_element_id → tracking_elements, no
  // cascade). DO UPDATE edits in place. EVERY synced column must still be listed
  // — an omitted one silently keeps its stale value (the bug that reset `width`).
  {
    const { data, error } = await supabase
      .from('tracking_elements')
      .select('id, drill_id, type, label, config, width, display_order, deleted_at, created_at, updated_at')
      .in('drill_id', drillIds)
      .order('display_order', { ascending: true });
    if (!error && data) {
      for (const e of data) {
        // Supabase may return config either as a parsed object (correct JSONB)
        // or as a string (legacy rows where the JSONB value is a JSON-string).
        // Local SQLite always stores config as a JSON string.
        const configStr =
          typeof e.config === 'string' ? e.config : JSON.stringify(e.config);
        await db.runAsync(
          `INSERT INTO tracking_elements (id, drill_id, type, label, config, width, display_order, deleted_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             drill_id = excluded.drill_id,
             type = excluded.type,
             label = excluded.label,
             config = excluded.config,
             width = excluded.width,
             display_order = excluded.display_order,
             deleted_at = excluded.deleted_at,
             created_at = excluded.created_at,
             updated_at = excluded.updated_at`,
          e.id, e.drill_id, e.type, e.label, configStr,
          e.width ?? 'full', e.display_order, e.deleted_at ?? null, e.created_at, e.updated_at,
        );
      }
    }
  }

  queryClient.invalidateQueries({ queryKey: ['activities'] });
  queryClient.invalidateQueries({ queryKey: ['activities-selector'] });
  queryClient.invalidateQueries({ queryKey: ['drills'] });
  queryClient.invalidateQueries({ queryKey: ['tracking-elements'] });
}

/**
 * Convert a Supabase JSONB column (which supabase-js may return as a parsed
 * object OR, for legacy string-encoded rows, as a string) into the JSON TEXT
 * that local SQLite stores. Mirrors the tracking_elements.config handling.
 */
function toJsonText(value: unknown, fallback: string): string {
  if (value == null) return fallback;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

// Supabase `.in(col, ids)` serializes ids into the request URL; postgrest-js
// warns large arrays blow past the ~8000-char URL limit (gateways reject around
// 8-16KB). A UUID costs ~44 chars URL-encoded, so ~180 ids is the danger zone.
// Chunk every id-driven pull so high-cardinality subtrees (element_values,
// drill_results) fully rehydrate instead of silently returning a capped/empty
// page. 150 ids ≈ 6.6KB, comfortably under the limit.
const IN_CHUNK = 150;
function chunkIds(ids: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) {
    out.push(ids.slice(i, i + IN_CHUNK));
  }
  return out;
}

function reportRehydrateError(table: string, childId: UUID, error: unknown): void {
  if (__DEV__) {
    console.warn(`[rehydrate-child] ${table} failed for child ${childId}:`, error);
  }
  Sentry.captureException(
    error instanceof Error ? error : new Error(`rehydrate ${table} failed`),
    { level: 'warning', tags: { source: 'rehydrate-child' }, extra: { table, childId } },
  );
}

/**
 * Full read-side rehydration for ONE child: pulls EVERY per-child table from
 * Supabase into local SQLite so a fresh install / new device reconstructs the
 * complete picture — session history, drill results, currency, rewards,
 * accolades, measurements, external activities, and photos — not just activity
 * config. rehydrateActivities only restored activities/drills/tracking_elements;
 * this extends that to the rest of the hierarchy.
 *
 * Bootstrap-style: each table is pulled only when the child has no local rows
 * for it, and every write is INSERT OR IGNORE, so repeated calls (every child
 * switch, every auth restore) are cheap and idempotent. FK order is preserved
 * (foreign_keys is ON): activities → drills → tracking_elements must exist
 * before sessions/drill_results/element_values reference them. Each section is
 * independently try/caught so one table's failure degrades to "that slice is
 * missing" rather than aborting the whole rehydrate. Call sites are
 * fire-and-forget (.catch), so a thrown error never blocks auth recovery.
 */
export async function rehydrateChildData(
  childId: UUID,
  queryClient: QueryClient,
): Promise<void> {
  const db = await getDatabase();

  // 1. Activity config (activities → drills → tracking_elements). Everything
  // below depends on these rows existing locally to satisfy FK constraints
  // (sessions.activity_id, drill_results.drill_id, element_values.tracking_element_id).
  await rehydrateActivities(childId, queryClient);

  const activityRows = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM activities WHERE child_id = ?',
    childId,
  );
  const activityIds = activityRows.map((a) => a.id);
  const drillRows = activityIds.length
    ? await db.getAllAsync<{ id: string }>(
        `SELECT id FROM drills WHERE activity_id IN (${activityIds.map(() => '?').join(',')})`,
        ...activityIds,
      )
    : [];
  const drillIds = drillRows.map((d) => d.id);

  // 2. tier_rewards + bonus_presets — polymorphic on parent_id (an activity OR
  // drill id), so pulled by the union of this child's activity + drill ids.
  const parentIds = [...activityIds, ...drillIds];
  if (parentIds.length) {
    const ph = parentIds.map(() => '?').join(',');
    try {
      const existing = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM tier_rewards WHERE parent_id IN (${ph})`,
        ...parentIds,
      );
      if (!existing || existing.count === 0) {
        for (const batch of chunkIds(parentIds)) {
          const { data } = await supabase
            .from('tier_rewards')
            .select('id, parent_type, parent_id, name, conditions, currency_amount, display_order, created_at, updated_at')
            .in('parent_id', batch);
          for (const r of data ?? []) {
            await db.runAsync(
              `INSERT OR IGNORE INTO tier_rewards (id, parent_type, parent_id, name, conditions, currency_amount, display_order, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              r.id, r.parent_type, r.parent_id, r.name, toJsonText(r.conditions, '[]'),
              r.currency_amount, r.display_order, r.created_at, r.updated_at,
            );
          }
        }
      }
    } catch (e) { reportRehydrateError('tier_rewards', childId, e); }

    try {
      const existing = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM bonus_presets WHERE parent_id IN (${ph})`,
        ...parentIds,
      );
      if (!existing || existing.count === 0) {
        for (const batch of chunkIds(parentIds)) {
          const { data } = await supabase
            .from('bonus_presets')
            .select('id, parent_type, parent_id, amount, display_order, created_at, updated_at')
            .in('parent_id', batch);
          for (const b of data ?? []) {
            await db.runAsync(
              `INSERT OR IGNORE INTO bonus_presets (id, parent_type, parent_id, amount, display_order, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              b.id, b.parent_type, b.parent_id, b.amount, b.display_order, b.created_at, b.updated_at,
            );
          }
        }
      }
    } catch (e) { reportRehydrateError('bonus_presets', childId, e); }
  }

  // 3. drill_photos (drill_id). Remote rows are already uploaded; mark them
  // 'uploaded' with local_uri NULL so the photo drainer skips them and the
  // gallery renders via signed URL.
  if (drillIds.length) {
    const ph = drillIds.map(() => '?').join(',');
    try {
      const existing = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM drill_photos WHERE drill_id IN (${ph})`,
        ...drillIds,
      );
      if (!existing || existing.count === 0) {
        for (const batch of chunkIds(drillIds)) {
          const { data } = await supabase
            .from('drill_photos')
            .select('id, drill_id, storage_url, storage_path, display_order, created_at')
            .in('drill_id', batch);
          for (const p of data ?? []) {
            await db.runAsync(
              `INSERT OR IGNORE INTO drill_photos (id, drill_id, storage_url, storage_path, local_uri, upload_status, display_order, created_at)
               VALUES (?, ?, ?, ?, NULL, 'uploaded', ?, ?)`,
              p.id, p.drill_id, p.storage_url, p.storage_path, p.display_order, p.created_at,
            );
          }
        }
      }
    } catch (e) { reportRehydrateError('drill_photos', childId, e); }
  }

  // 4. sessions (child_id) → drill_results → element_values + photos.
  try {
    const sessCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sessions WHERE child_id = ?',
      childId,
    );
    if (!sessCount || sessCount.count === 0) {
      const { data } = await supabase
        .from('sessions')
        .select('id, child_id, activity_id, started_at, ended_at, duration_seconds, note, photo_url, is_complete, created_at, updated_at')
        .eq('child_id', childId);
      for (const s of data ?? []) {
        await db.runAsync(
          `INSERT OR IGNORE INTO sessions (id, child_id, activity_id, started_at, ended_at, duration_seconds, note, photo_url, is_complete, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          s.id, s.child_id, s.activity_id, s.started_at, s.ended_at ?? null,
          s.duration_seconds ?? null, s.note ?? null, s.photo_url ?? null,
          s.is_complete ? 1 : 0, s.created_at, s.updated_at,
        );
      }
    }
  } catch (e) { reportRehydrateError('sessions', childId, e); }

  const sessionRows = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM sessions WHERE child_id = ?',
    childId,
  );
  const sessionIds = sessionRows.map((s) => s.id);

  if (sessionIds.length) {
    const ph = sessionIds.map(() => '?').join(',');
    try {
      const drCount = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM drill_results WHERE session_id IN (${ph})`,
        ...sessionIds,
      );
      if (!drCount || drCount.count === 0) {
        for (const batch of chunkIds(sessionIds)) {
          const { data } = await supabase
            .from('drill_results')
            .select('id, session_id, drill_id, is_complete, note, photo_url, created_at, updated_at')
            .in('session_id', batch);
          for (const r of data ?? []) {
            await db.runAsync(
              `INSERT OR IGNORE INTO drill_results (id, session_id, drill_id, is_complete, note, photo_url, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              r.id, r.session_id, r.drill_id, r.is_complete ? 1 : 0, r.note ?? null,
              r.photo_url ?? null, r.created_at, r.updated_at,
            );
          }
        }
      }
    } catch (e) { reportRehydrateError('drill_results', childId, e); }

    try {
      const existing = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM session_photos WHERE session_id IN (${ph})`,
        ...sessionIds,
      );
      if (!existing || existing.count === 0) {
        for (const batch of chunkIds(sessionIds)) {
          const { data } = await supabase
            .from('session_photos')
            .select('id, session_id, storage_url, storage_path, display_order, created_at')
            .in('session_id', batch);
          for (const p of data ?? []) {
            await db.runAsync(
              `INSERT OR IGNORE INTO session_photos (id, session_id, storage_url, storage_path, local_uri, upload_status, display_order, created_at)
               VALUES (?, ?, ?, ?, NULL, 'uploaded', ?, ?)`,
              p.id, p.session_id, p.storage_url, p.storage_path, p.display_order, p.created_at,
            );
          }
        }
      }
    } catch (e) { reportRehydrateError('session_photos', childId, e); }
  }

  const drResultRows = sessionIds.length
    ? await db.getAllAsync<{ id: string }>(
        `SELECT id FROM drill_results WHERE session_id IN (${sessionIds.map(() => '?').join(',')})`,
        ...sessionIds,
      )
    : [];
  const drillResultIds = drResultRows.map((r) => r.id);

  if (drillResultIds.length) {
    const ph = drillResultIds.map(() => '?').join(',');
    try {
      const existing = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM element_values WHERE drill_result_id IN (${ph})`,
        ...drillResultIds,
      );
      if (!existing || existing.count === 0) {
        for (const batch of chunkIds(drillResultIds)) {
          const { data } = await supabase
            .from('element_values')
            .select('id, drill_result_id, tracking_element_id, value, created_at')
            .in('drill_result_id', batch);
          for (const v of data ?? []) {
            await db.runAsync(
              `INSERT OR IGNORE INTO element_values (id, drill_result_id, tracking_element_id, value, created_at)
               VALUES (?, ?, ?, ?, ?)`,
              v.id, v.drill_result_id, v.tracking_element_id, toJsonText(v.value, '{}'), v.created_at,
            );
          }
        }
      }
    } catch (e) { reportRehydrateError('element_values', childId, e); }

    try {
      const existing = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM drill_result_photos WHERE drill_result_id IN (${ph})`,
        ...drillResultIds,
      );
      if (!existing || existing.count === 0) {
        for (const batch of chunkIds(drillResultIds)) {
          const { data } = await supabase
            .from('drill_result_photos')
            .select('id, drill_result_id, storage_url, storage_path, display_order, created_at')
            .in('drill_result_id', batch);
          for (const p of data ?? []) {
            await db.runAsync(
              `INSERT OR IGNORE INTO drill_result_photos (id, drill_result_id, storage_url, storage_path, local_uri, upload_status, display_order, created_at)
               VALUES (?, ?, ?, ?, NULL, 'uploaded', ?, ?)`,
              p.id, p.drill_result_id, p.storage_url, p.storage_path, p.display_order, p.created_at,
            );
          }
        }
      }
    } catch (e) { reportRehydrateError('drill_result_photos', childId, e); }
  }

  // 5. Flat child-keyed tables.
  try {
    const existing = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM rewards WHERE child_id = ?', childId,
    );
    if (!existing || existing.count === 0) {
      const { data } = await supabase
        .from('rewards')
        .select('id, child_id, name, cost, state, created_at, redeemed_at')
        .eq('child_id', childId);
      for (const r of data ?? []) {
        await db.runAsync(
          `INSERT OR IGNORE INTO rewards (id, child_id, name, cost, state, created_at, redeemed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          r.id, r.child_id, r.name, r.cost, r.state, r.created_at, r.redeemed_at ?? null,
        );
      }
    }
  } catch (e) { reportRehydrateError('rewards', childId, e); }

  try {
    const existing = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM currency_ledger WHERE child_id = ?', childId,
    );
    if (!existing || existing.count === 0) {
      const { data } = await supabase
        .from('currency_ledger')
        .select('id, child_id, amount, source, reference_id, reason, created_at')
        .eq('child_id', childId);
      for (const c of data ?? []) {
        await db.runAsync(
          `INSERT OR IGNORE INTO currency_ledger (id, child_id, amount, source, reference_id, reason, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          c.id, c.child_id, c.amount, c.source, c.reference_id ?? null, c.reason ?? null, c.created_at,
        );
      }
    }
  } catch (e) { reportRehydrateError('currency_ledger', childId, e); }

  try {
    const existing = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM measurements WHERE child_id = ?', childId,
    );
    if (!existing || existing.count === 0) {
      const { data } = await supabase
        .from('measurements')
        .select('id, child_id, type, value, date, created_at, updated_at')
        .eq('child_id', childId);
      for (const m of data ?? []) {
        await db.runAsync(
          `INSERT OR IGNORE INTO measurements (id, child_id, type, value, date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          m.id, m.child_id, m.type, m.value, m.date, m.created_at, m.updated_at,
        );
      }
    }
  } catch (e) { reportRehydrateError('measurements', childId, e); }

  try {
    const existing = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM external_activities WHERE child_id = ?', childId,
    );
    if (!existing || existing.count === 0) {
      const { data } = await supabase
        .from('external_activities')
        .select('id, child_id, name, schedule, location, notes, created_at, updated_at')
        .eq('child_id', childId);
      for (const x of data ?? []) {
        await db.runAsync(
          `INSERT OR IGNORE INTO external_activities (id, child_id, name, schedule, location, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          x.id, x.child_id, x.name, x.schedule ?? null, x.location ?? null, x.notes ?? null, x.created_at, x.updated_at,
        );
      }
    }
  } catch (e) { reportRehydrateError('external_activities', childId, e); }

  // accolade_unlocks (composite PK, no surrogate id).
  try {
    const existing = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM accolade_unlocks WHERE child_id = ?', childId,
    );
    if (!existing || existing.count === 0) {
      const { data } = await supabase
        .from('accolade_unlocks')
        .select('child_id, accolade_id, unlocked_at')
        .eq('child_id', childId);
      for (const a of data ?? []) {
        await db.runAsync(
          `INSERT OR IGNORE INTO accolade_unlocks (child_id, accolade_id, unlocked_at) VALUES (?, ?, ?)`,
          a.child_id, a.accolade_id, a.unlocked_at,
        );
      }
    }
  } catch (e) { reportRehydrateError('accolade_unlocks', childId, e); }

  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['session-list'] });
  queryClient.invalidateQueries({ queryKey: ['stats-summary'] });
  queryClient.invalidateQueries({ queryKey: ['profile', 'measurements', childId] });
  queryClient.invalidateQueries({ queryKey: ['profile', 'external-activities', childId] });
  queryClient.invalidateQueries({ queryKey: ['profile', 'activities-summary', childId] });
}
