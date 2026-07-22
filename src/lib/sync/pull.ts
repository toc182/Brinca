import type { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';

import { getDatabase } from '../sqlite/db';
import { supabase } from '../supabase/client';
import { useActiveSessionStore } from '@/stores/active-session.store';
import type { UUID } from '@/types/domain.types';

/**
 * The download half of sync.
 *
 * The engine (engine.ts) only ever pushes local changes up. Reads came from
 * Supabase exactly once — on a device with an empty table (rehydrate.ts) — and
 * never again, so two devices on one account drifted apart permanently and
 * deletions made on one device silently reappeared on the other.
 *
 * pullChildData asks each table "give me every row that changed since the last
 * time I pulled you" and writes those rows into local SQLite. Combined with the
 * deleted_at tombstones added in migration 0009, this makes edits AND deletions
 * propagate between devices.
 *
 * Design rules:
 *  - **Delta, not full scan.** Each table carries a watermark (the newest
 *    updated_at this device has already seen) in the sync_state table. We ask
 *    the server for rows strictly newer than it, and advance the watermark to
 *    the newest row we saw. First pull has a null watermark → full download,
 *    which is also what a fresh install needs (this replaces rehydrate's
 *    one-shot bootstrap).
 *  - **Local unsent changes win.** A row whose id sits in the outgoing
 *    sync_queue is skipped: the user's own not-yet-pushed edit must not be
 *    clobbered by an older server copy. Once it pushes, the server's updated_at
 *    bumps past the watermark and the reconciled row pulls normally.
 *  - **Every column, explicitly.** Overwrites list every synced column so an
 *    omitted one can't silently reset to its SQLite default (the bug that reset
 *    `width` on every launch). Photo tables are the exception — they carry
 *    device-local columns (local_uri, upload_status) the server doesn't know
 *    about, so their upsert updates only server-owned columns.
 *
 * Conflict resolution is last-writer-wins by updated_at, except the local-unsent
 * guard above. Two devices editing the same row while both offline will lose one
 * side's edit — acceptable for a two-parent household; documented in
 * docs/architecture/04-offline-sync.md.
 */

// PostgREST caps a single response and long `.in()` URLs; page through results
// and chunk parent-id lists (a UUID is ~44 URL-encoded chars, 150 ≈ 6.6KB).
const PAGE_SIZE = 1000;
const IN_CHUNK = 150;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** ids of rows with an unsent local change — never overwrite these from the server. */
async function getPendingIds(): Promise<Set<string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ payload: string }>(
    `SELECT payload FROM sync_queue WHERE status IN ('pending', 'in_flight', 'failed')`,
  );
  const ids = new Set<string>();
  for (const r of rows) {
    try {
      const id = JSON.parse(r.payload)?.id;
      if (typeof id === 'string') ids.add(id);
    } catch {
      // Malformed queue payload — ignore; it will surface as a sync failure.
    }
  }
  return ids;
}

async function getWatermark(table: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ last_pulled_at: string | null }>(
    `SELECT last_pulled_at FROM sync_state WHERE table_name = ?`,
    table,
  );
  return row?.last_pulled_at ?? null;
}

async function setWatermark(table: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sync_state (table_name, last_pulled_at) VALUES (?, ?)
     ON CONFLICT(table_name) DO UPDATE SET last_pulled_at = excluded.last_pulled_at`,
    table,
    value,
  );
}

interface PullSpec {
  /** Table name, identical in Supabase and SQLite. */
  table: string;
  /** Columns to select from Supabase, in the order the local writer expects. */
  columns: string[];
  /** Column the delta is keyed on — updated_at for mutable tables, created_at/etc. for append-only. */
  deltaColumn: string;
  /** Applies row scoping (child_id = …, parent_id in …) to the query builder. */
  scope: (q: ReturnType<typeof buildSelect>) => ReturnType<typeof buildSelect>;
  /** Writes one server row into SQLite. Receives the row and returns nothing. */
  write: (row: Record<string, unknown>) => Promise<void>;
}

function buildSelect(table: string, columns: string[], deltaColumn: string, watermark: string | null) {
  let q = supabase.from(table).select(columns.join(', '));
  if (watermark) q = q.gt(deltaColumn, watermark);
  return q.order(deltaColumn, { ascending: true });
}

/**
 * Pull one table: fetch rows newer than the watermark (paged), skip rows with a
 * pending local change, write the rest, then advance the watermark to the newest
 * row seen. Returns the number of rows written (for logging / invalidation).
 */
async function pullTable(spec: PullSpec, pendingIds: Set<string>): Promise<number> {
  const watermark = await getWatermark(spec.table);
  let newest = watermark;
  let written = 0;
  let offset = 0;

  for (;;) {
    const base = buildSelect(spec.table, spec.columns, spec.deltaColumn, watermark);
    const { data, error } = await spec
      .scope(base)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data ?? []) as unknown as Record<string, unknown>[];

    for (const row of rows) {
      const delta = row[spec.deltaColumn] as string | undefined;
      if (delta && (newest == null || delta > newest)) newest = delta;
      // Local unsent change wins — but the watermark still advances past this
      // row (above) so we don't re-pull it forever; the reconciled version
      // comes back after the local push bumps updated_at.
      if (typeof row.id === 'string' && pendingIds.has(row.id)) continue;
      await spec.write(row);
      written++;
    }

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  if (newest && newest !== watermark) await setWatermark(spec.table, newest);
  return written;
}

/**
 * Pull a table scoped by a parent-id list (drills → activities, etc.). Chunks
 * the id list under the URL limit and shares one watermark across chunks.
 */
async function pullTableIn(
  table: string,
  columns: string[],
  deltaColumn: string,
  inColumn: string,
  parentIds: string[],
  write: (row: Record<string, unknown>) => Promise<void>,
  pendingIds: Set<string>,
): Promise<number> {
  if (parentIds.length === 0) return 0;
  const watermark = await getWatermark(table);
  let newest = watermark;
  let written = 0;

  for (const ids of chunk(parentIds, IN_CHUNK)) {
    let offset = 0;
    for (;;) {
      let q = supabase.from(table).select(columns.join(', ')).in(inColumn, ids);
      if (watermark) q = q.gt(deltaColumn, watermark);
      const { data, error } = await q
        .order(deltaColumn, { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Record<string, unknown>[];

      for (const row of rows) {
        const delta = row[deltaColumn] as string | undefined;
        if (delta && (newest == null || delta > newest)) newest = delta;
        if (typeof row.id === 'string' && pendingIds.has(row.id)) continue;
        await write(row);
        written++;
      }

      if (rows.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  }

  if (newest && newest !== watermark) await setWatermark(table, newest);
  return written;
}

function jsonText(value: unknown, fallback: string): string {
  if (value == null) return fallback;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

type DB = Awaited<ReturnType<typeof getDatabase>>;

/**
 * Upsert a row by primary-key `id` WITHOUT the delete-then-insert that
 * `INSERT OR REPLACE` performs. REPLACE deletes the existing row first, and that
 * delete is blocked with `error 19: FOREIGN KEY constraint failed` by child rows
 * whose FK is RESTRICT — sessions→activities, drill_results→drills,
 * element_values→tracking_elements — (or would cascade-delete them). `ON CONFLICT
 * DO UPDATE` mutates the row in place, so neither happens. `updateCols` defaults
 * to every column except id; pass a subset to leave device-local columns
 * (photos' local_uri / upload_status) untouched on update.
 */
async function upsertById(
  db: DB,
  table: string,
  columns: string[],
  values: (string | number | null)[],
  updateCols?: string[],
): Promise<void> {
  const placeholders = columns.map(() => '?').join(', ');
  const toUpdate = (updateCols ?? columns.filter((c) => c !== 'id'))
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');
  await db.runAsync(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${toUpdate}`,
    ...values,
  );
}

/**
 * Download every change for one child since the last pull, parent tables first
 * so foreign keys resolve. Fire-and-forget from call sites; a thrown error is
 * reported and the next pull retries. Refreshes the query cache at the end.
 */
export async function pullChildData(childId: UUID, queryClient: QueryClient): Promise<void> {
  // Never pull into a live session. Logging writes sessions / drill_results /
  // element_values on every tap, and there is always a brief window between the
  // local write and its queue append where the pending-id guard can't see it —
  // an incoming overwrite there would stomp values the parent is entering. The
  // next foreground/interval pull (after the session ends) reconciles safely.
  const sessionStatus = useActiveSessionStore.getState().status;
  if (sessionStatus === 'active' || sessionStatus === 'paused' || sessionStatus === 'minimized') {
    return;
  }

  const db = await getDatabase();
  const pendingIds = await getPendingIds();

  // ---- 1. Activity config: activities → drills → tracking_elements ----
  await pullTable(
    {
      table: 'activities',
      columns: ['id', 'child_id', 'name', 'icon', 'category', 'is_active', 'display_order', 'deleted_at', 'created_at', 'updated_at'],
      deltaColumn: 'updated_at',
      scope: (q) => q.eq('child_id', childId),
      write: async (a) => {
        await upsertById(db, 'activities',
          ['id', 'child_id', 'name', 'icon', 'category', 'is_active', 'display_order', 'deleted_at', 'created_at', 'updated_at'],
          [a.id as string, a.child_id as string, a.name as string, (a.icon ?? null) as string | null,
            (a.category ?? null) as string | null, a.is_active ? 1 : 0, a.display_order as number,
            (a.deleted_at ?? null) as string | null, a.created_at as string, a.updated_at as string],
        );
      },
    },
    pendingIds,
  );

  const activityIds = (await db.getAllAsync<{ id: string }>(
    'SELECT id FROM activities WHERE child_id = ?', childId,
  )).map((r) => r.id);

  await pullTableIn(
    'drills',
    ['id', 'activity_id', 'name', 'description', 'is_active', 'display_order', 'deleted_at', 'created_at', 'updated_at'],
    'updated_at', 'activity_id', activityIds,
    async (d) => {
      await upsertById(db, 'drills',
        ['id', 'activity_id', 'name', 'description', 'is_active', 'display_order', 'deleted_at', 'created_at', 'updated_at'],
        [d.id as string, d.activity_id as string, d.name as string, (d.description ?? null) as string | null,
          d.is_active ? 1 : 0, d.display_order as number, (d.deleted_at ?? null) as string | null,
          d.created_at as string, d.updated_at as string],
      );
    },
    pendingIds,
  );

  const drillIds = activityIds.length
    ? (await db.getAllAsync<{ id: string }>(
        `SELECT id FROM drills WHERE activity_id IN (${activityIds.map(() => '?').join(',')})`,
        ...activityIds,
      )).map((r) => r.id)
    : [];

  await pullTableIn(
    'tracking_elements',
    ['id', 'drill_id', 'type', 'label', 'config', 'width', 'display_order', 'deleted_at', 'created_at', 'updated_at'],
    'updated_at', 'drill_id', drillIds,
    async (e) => {
      await upsertById(db, 'tracking_elements',
        ['id', 'drill_id', 'type', 'label', 'config', 'width', 'display_order', 'deleted_at', 'created_at', 'updated_at'],
        [e.id as string, e.drill_id as string, e.type as string, e.label as string,
          jsonText(e.config, '{}'), (e.width ?? 'full') as string, e.display_order as number,
          (e.deleted_at ?? null) as string | null, e.created_at as string, e.updated_at as string],
      );
    },
    pendingIds,
  );

  // ---- 2. tier_rewards + bonus_presets (polymorphic on activity OR drill id) ----
  const parentIds = [...activityIds, ...drillIds];
  await pullTableIn(
    'tier_rewards',
    ['id', 'parent_type', 'parent_id', 'name', 'conditions', 'currency_amount', 'display_order', 'deleted_at', 'created_at', 'updated_at'],
    'updated_at', 'parent_id', parentIds,
    async (r) => {
      await upsertById(db, 'tier_rewards',
        ['id', 'parent_type', 'parent_id', 'name', 'conditions', 'currency_amount', 'display_order', 'deleted_at', 'created_at', 'updated_at'],
        [r.id as string, r.parent_type as string, r.parent_id as string, r.name as string,
          jsonText(r.conditions, '[]'), r.currency_amount as number, r.display_order as number,
          (r.deleted_at ?? null) as string | null, r.created_at as string, r.updated_at as string],
      );
    },
    pendingIds,
  );

  await pullTableIn(
    'bonus_presets',
    ['id', 'parent_type', 'parent_id', 'amount', 'display_order', 'deleted_at', 'created_at', 'updated_at'],
    'updated_at', 'parent_id', parentIds,
    async (b) => {
      await upsertById(db, 'bonus_presets',
        ['id', 'parent_type', 'parent_id', 'amount', 'display_order', 'deleted_at', 'created_at', 'updated_at'],
        [b.id as string, b.parent_type as string, b.parent_id as string, b.amount as number,
          b.display_order as number, (b.deleted_at ?? null) as string | null, b.created_at as string, b.updated_at as string],
      );
    },
    pendingIds,
  );

  // ---- 3. Sessions → drill_results → element_values ----
  await pullTable(
    {
      table: 'sessions',
      columns: ['id', 'child_id', 'activity_id', 'started_at', 'ended_at', 'duration_seconds', 'note', 'photo_url', 'is_complete', 'created_at', 'updated_at'],
      deltaColumn: 'updated_at',
      scope: (q) => q.eq('child_id', childId),
      write: async (s) => {
        await upsertById(db, 'sessions',
          ['id', 'child_id', 'activity_id', 'started_at', 'ended_at', 'duration_seconds', 'note', 'photo_url', 'is_complete', 'created_at', 'updated_at'],
          [s.id as string, s.child_id as string, s.activity_id as string, s.started_at as string,
            (s.ended_at ?? null) as string | null, (s.duration_seconds ?? null) as number | null,
            (s.note ?? null) as string | null, (s.photo_url ?? null) as string | null,
            s.is_complete ? 1 : 0, s.created_at as string, s.updated_at as string],
        );
      },
    },
    pendingIds,
  );

  const sessionIds = (await db.getAllAsync<{ id: string }>(
    'SELECT id FROM sessions WHERE child_id = ?', childId,
  )).map((r) => r.id);

  await pullTableIn(
    'drill_results',
    ['id', 'session_id', 'drill_id', 'is_complete', 'note', 'photo_url', 'created_at', 'updated_at'],
    'updated_at', 'session_id', sessionIds,
    async (r) => {
      await upsertById(db, 'drill_results',
        ['id', 'session_id', 'drill_id', 'is_complete', 'note', 'photo_url', 'created_at', 'updated_at'],
        [r.id as string, r.session_id as string, r.drill_id as string, r.is_complete ? 1 : 0,
          (r.note ?? null) as string | null, (r.photo_url ?? null) as string | null,
          r.created_at as string, r.updated_at as string],
      );
    },
    pendingIds,
  );

  const drillResultIds = sessionIds.length
    ? (await db.getAllAsync<{ id: string }>(
        `SELECT id FROM drill_results WHERE session_id IN (${sessionIds.map(() => '?').join(',')})`,
        ...sessionIds,
      )).map((r) => r.id)
    : [];

  await pullTableIn(
    'element_values',
    ['id', 'drill_result_id', 'tracking_element_id', 'value', 'deleted_at', 'created_at', 'updated_at'],
    'updated_at', 'drill_result_id', drillResultIds,
    async (v) => {
      await upsertById(db, 'element_values',
        ['id', 'drill_result_id', 'tracking_element_id', 'value', 'deleted_at', 'created_at', 'updated_at'],
        [v.id as string, v.drill_result_id as string, v.tracking_element_id as string,
          jsonText(v.value, '{}'), (v.deleted_at ?? null) as string | null, v.created_at as string, v.updated_at as string],
      );
    },
    pendingIds,
  );

  // ---- 4. Photos. Server-owned columns only, so the device-local upload state
  //         (local_uri, upload_status) is never clobbered. A row that arrives
  //         for the first time is inserted as already-uploaded. ----
  // Photos carry device-local columns (local_uri, upload_status) the server
  // doesn't know about. A first-seen row inserts as already-uploaded; on
  // conflict we update ONLY the server-owned columns so local upload state is
  // never clobbered. ON CONFLICT (not REPLACE) also avoids the FK delete trap.
  const upsertPhoto = (table: string, fkCol: string) =>
    async (p: Record<string, unknown>) => {
      await db.runAsync(
        `INSERT INTO ${table} (id, ${fkCol}, storage_url, storage_path, local_uri, upload_status, display_order, deleted_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, 'uploaded', ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           storage_url = excluded.storage_url,
           storage_path = excluded.storage_path,
           display_order = excluded.display_order,
           deleted_at = excluded.deleted_at,
           updated_at = excluded.updated_at`,
        p.id as string, p[fkCol] as string, (p.storage_url ?? null) as string | null,
        (p.storage_path ?? null) as string | null, p.display_order as number,
        (p.deleted_at ?? null) as string | null, p.created_at as string, p.updated_at as string,
      );
    };

  const photoCols = ['id', 'storage_url', 'storage_path', 'display_order', 'deleted_at', 'created_at', 'updated_at'];
  await pullTableIn('drill_photos', [...photoCols, 'drill_id'], 'updated_at', 'drill_id', drillIds, upsertPhoto('drill_photos', 'drill_id'), pendingIds);
  await pullTableIn('session_photos', [...photoCols, 'session_id'], 'updated_at', 'session_id', sessionIds, upsertPhoto('session_photos', 'session_id'), pendingIds);
  await pullTableIn('drill_result_photos', [...photoCols, 'drill_result_id'], 'updated_at', 'drill_result_id', drillResultIds, upsertPhoto('drill_result_photos', 'drill_result_id'), pendingIds);

  // ---- 5. Flat child-keyed tables ----
  await pullTable(
    {
      table: 'measurements',
      columns: ['id', 'child_id', 'type', 'value', 'date', 'deleted_at', 'created_at', 'updated_at'],
      deltaColumn: 'updated_at',
      scope: (q) => q.eq('child_id', childId),
      write: async (m) => {
        await upsertById(db, 'measurements',
          ['id', 'child_id', 'type', 'value', 'date', 'deleted_at', 'created_at', 'updated_at'],
          [m.id as string, m.child_id as string, m.type as string, m.value as number, m.date as string,
            (m.deleted_at ?? null) as string | null, m.created_at as string, m.updated_at as string],
        );
      },
    },
    pendingIds,
  );

  await pullTable(
    {
      table: 'external_activities',
      columns: ['id', 'child_id', 'name', 'schedule', 'location', 'notes', 'deleted_at', 'created_at', 'updated_at'],
      deltaColumn: 'updated_at',
      scope: (q) => q.eq('child_id', childId),
      write: async (x) => {
        await upsertById(db, 'external_activities',
          ['id', 'child_id', 'name', 'schedule', 'location', 'notes', 'deleted_at', 'created_at', 'updated_at'],
          [x.id as string, x.child_id as string, x.name as string, (x.schedule ?? null) as string | null,
            (x.location ?? null) as string | null, (x.notes ?? null) as string | null,
            (x.deleted_at ?? null) as string | null, x.created_at as string, x.updated_at as string],
        );
      },
    },
    pendingIds,
  );

  await pullTable(
    {
      table: 'rewards',
      columns: ['id', 'child_id', 'name', 'cost', 'state', 'redeemed_at', 'deleted_at', 'created_at', 'updated_at'],
      deltaColumn: 'updated_at',
      scope: (q) => q.eq('child_id', childId),
      write: async (r) => {
        await upsertById(db, 'rewards',
          ['id', 'child_id', 'name', 'cost', 'state', 'redeemed_at', 'deleted_at', 'created_at', 'updated_at'],
          [r.id as string, r.child_id as string, r.name as string, r.cost as number, r.state as string,
            (r.redeemed_at ?? null) as string | null, (r.deleted_at ?? null) as string | null,
            r.created_at as string, r.updated_at as string],
        );
      },
    },
    pendingIds,
  );

  // ---- 6. Append-only, immutable tables. No updated_at / deleted_at: delta by
  //         the natural creation timestamp, INSERT OR IGNORE (never rewritten). ----
  await pullTable(
    {
      table: 'currency_ledger',
      columns: ['id', 'child_id', 'amount', 'source', 'reference_id', 'reason', 'created_at'],
      deltaColumn: 'created_at',
      scope: (q) => q.eq('child_id', childId),
      write: async (c) => {
        await db.runAsync(
          `INSERT OR IGNORE INTO currency_ledger (id, child_id, amount, source, reference_id, reason, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          c.id as string, c.child_id as string, c.amount as number, c.source as string,
          (c.reference_id ?? null) as string | null, (c.reason ?? null) as string | null, c.created_at as string,
        );
      },
    },
    pendingIds,
  );

  await pullTable(
    {
      table: 'accolade_unlocks',
      columns: ['child_id', 'accolade_id', 'unlocked_at'],
      deltaColumn: 'unlocked_at',
      scope: (q) => q.eq('child_id', childId),
      write: async (a) => {
        await db.runAsync(
          `INSERT OR IGNORE INTO accolade_unlocks (child_id, accolade_id, unlocked_at) VALUES (?, ?, ?)`,
          a.child_id as string, a.accolade_id as string, a.unlocked_at as string,
        );
      },
    },
    pendingIds,
  );

  // Refresh everything the pull can touch.
  queryClient.invalidateQueries({ queryKey: ['activities'] });
  queryClient.invalidateQueries({ queryKey: ['activities-selector'] });
  queryClient.invalidateQueries({ queryKey: ['drills'] });
  queryClient.invalidateQueries({ queryKey: ['tracking-elements'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['session-list'] });
  queryClient.invalidateQueries({ queryKey: ['stats-summary'] });
  queryClient.invalidateQueries({ queryKey: ['profile', 'measurements', childId] });
  queryClient.invalidateQueries({ queryKey: ['profile', 'external-activities', childId] });
  queryClient.invalidateQueries({ queryKey: ['profile', 'activities-summary', childId] });
}

/**
 * Fire-and-forget wrapper: never throws, reports failures to Sentry. Safe to
 * call from app-foreground / login / child-switch handlers.
 */
export function pullChildDataSafe(childId: UUID, queryClient: QueryClient): void {
  pullChildData(childId, queryClient).catch((error) => {
    if (__DEV__) console.warn('[pull] failed for child', childId, error);
    Sentry.captureException(
      error instanceof Error ? error : new Error('pullChildData failed'),
      { level: 'warning', tags: { source: 'sync-pull' }, extra: { childId } },
    );
  });
}
