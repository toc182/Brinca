import type { SQLiteBindValue } from 'expo-sqlite';

import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DateRange {
  start: string; // ISO date string
  end: string;   // ISO date string
}

export interface StatsFilters {
  childId: UUID;
  dateRange?: DateRange;
  activityIds?: UUID[];
}

export interface StatsSummary {
  sessionsCount: number;
  drillsCount: number;
  totalDurationSeconds: number;
  currencyEarned: number;
}

export interface SessionRow {
  id: string;
  activity_id: string;
  activityName: string;
  activityIcon: string | null;
  started_at: string;
  duration_seconds: number | null;
  is_complete: number;
  drillCount: number;
}

export interface ChartDataPoint {
  date: string; // ISO date (day bucket)
  value: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDateClause(
  dateRange: DateRange | undefined,
  tableAlias: string,
  column: string,
): { clause: string; params: SQLiteBindValue[] } {
  if (!dateRange) return { clause: '', params: [] };
  return {
    clause: ` AND ${tableAlias}.${column} >= ? AND ${tableAlias}.${column} < ?`,
    params: [dateRange.start, dateRange.end],
  };
}

function buildActivityClause(
  activityIds: UUID[] | undefined,
  tableAlias: string,
): { clause: string; params: SQLiteBindValue[] } {
  if (!activityIds || activityIds.length === 0) return { clause: '', params: [] };
  const placeholders = activityIds.map(() => '?').join(', ');
  return {
    clause: ` AND ${tableAlias}.activity_id IN (${placeholders})`,
    params: activityIds,
  };
}

// ---------------------------------------------------------------------------
// Stats summary (task 183)
// ---------------------------------------------------------------------------

export async function getStatsSummary(filters: StatsFilters): Promise<StatsSummary> {
  const db = await getDatabase();
  const { childId, dateRange, activityIds } = filters;

  const dc = buildDateClause(dateRange, 's', 'started_at');
  const ac = buildActivityClause(activityIds, 's');

  const baseWhere = `s.child_id = ?${dc.clause}${ac.clause}`;
  const baseParams: SQLiteBindValue[] = [childId, ...dc.params, ...ac.params];

  const sessions = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sessions s WHERE ${baseWhere} AND s.is_complete = 1`,
    baseParams,
  );

  const drills = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM drill_results dr
     JOIN sessions s ON s.id = dr.session_id
     WHERE ${baseWhere} AND dr.is_complete = 1`,
    baseParams,
  );

  const duration = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(s.duration_seconds), 0) as total
     FROM sessions s WHERE ${baseWhere} AND s.is_complete = 1`,
    baseParams,
  );

  const currency = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(cl.amount), 0) as total
     FROM currency_ledger cl
     JOIN sessions s ON s.id = cl.reference_id
     WHERE s.child_id = ?${dc.clause}${ac.clause} AND cl.amount > 0`,
    [childId, ...dc.params, ...ac.params],
  );

  return {
    sessionsCount: sessions?.count ?? 0,
    drillsCount: drills?.count ?? 0,
    totalDurationSeconds: duration?.total ?? 0,
    currencyEarned: currency?.total ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Session list — fixed N+1 with JOIN (tasks 184, 214)
// ---------------------------------------------------------------------------

export async function getSessionList(filters: StatsFilters): Promise<SessionRow[]> {
  const db = await getDatabase();
  const { childId, dateRange, activityIds } = filters;

  const dc = buildDateClause(dateRange, 's', 'started_at');
  const ac = buildActivityClause(activityIds, 's');
  const params: SQLiteBindValue[] = [childId, ...dc.params, ...ac.params];

  const rows = await db.getAllAsync<SessionRow>(
    `SELECT
       s.id,
       s.activity_id,
       a.name AS activityName,
       a.icon AS activityIcon,
       s.started_at,
       s.duration_seconds,
       s.is_complete,
       (SELECT COUNT(*) FROM drill_results dr WHERE dr.session_id = s.id AND dr.is_complete = 1) AS drillCount
     FROM sessions s
     LEFT JOIN activities a ON a.id = s.activity_id
     WHERE s.child_id = ?${dc.clause}${ac.clause}
     ORDER BY s.started_at DESC`,
    params,
  );

  return rows;
}

// ---------------------------------------------------------------------------
// Chart data — daily buckets for a metric
// ---------------------------------------------------------------------------

export type ChartMetric = 'sessions' | 'drills' | 'duration' | 'currency';

export async function getChartData(
  filters: StatsFilters,
  metric: ChartMetric,
): Promise<ChartDataPoint[]> {
  const db = await getDatabase();
  const { childId, dateRange, activityIds } = filters;

  const dc = buildDateClause(dateRange, 's', 'started_at');
  const ac = buildActivityClause(activityIds, 's');

  const baseWhere = `s.child_id = ?${dc.clause}${ac.clause}`;
  const baseParams: SQLiteBindValue[] = [childId, ...dc.params, ...ac.params];

  let query: string;

  switch (metric) {
    case 'sessions':
      query = `SELECT date(s.started_at) as date, COUNT(*) as value
               FROM sessions s WHERE ${baseWhere} AND s.is_complete = 1
               GROUP BY date(s.started_at) ORDER BY date`;
      break;
    case 'drills':
      query = `SELECT date(s.started_at) as date, COUNT(*) as value
               FROM drill_results dr
               JOIN sessions s ON s.id = dr.session_id
               WHERE ${baseWhere} AND dr.is_complete = 1
               GROUP BY date(s.started_at) ORDER BY date`;
      break;
    case 'duration':
      query = `SELECT date(s.started_at) as date, COALESCE(SUM(s.duration_seconds), 0) as value
               FROM sessions s WHERE ${baseWhere} AND s.is_complete = 1
               GROUP BY date(s.started_at) ORDER BY date`;
      break;
    case 'currency':
      query = `SELECT date(s.started_at) as date, COALESCE(SUM(cl.amount), 0) as value
               FROM currency_ledger cl
               JOIN sessions s ON s.id = cl.reference_id
               WHERE s.child_id = ?${dc.clause}${ac.clause} AND cl.amount > 0
               GROUP BY date(s.started_at) ORDER BY date`;
      break;
  }

  return db.getAllAsync<ChartDataPoint>(query, baseParams);
}

// ---------------------------------------------------------------------------
// Activities list (for filter modal)
// ---------------------------------------------------------------------------

export async function getChildActivities(childId: UUID) {
  const db = await getDatabase();
  return db.getAllAsync<{ id: string; name: string; icon: string | null }>(
    `SELECT id, name, icon FROM activities WHERE child_id = ? AND is_active = 1 ORDER BY display_order`,
    childId,
  );
}

// ---------------------------------------------------------------------------
// Session detail (tasks 208, 209, 210, 46)
// ---------------------------------------------------------------------------

export interface DrillResultDetail {
  id: string;
  drill_id: string;
  drillName: string;
  is_complete: number;
  note: string | null;
  photo_url: string | null;
  elementValues: ElementValueRow[];
}

export interface ElementValueRow {
  id: string;
  trackingElementId: string;
  label: string;
  type: string;
  value: string; // JSON string
}

export async function getSessionDetail(sessionId: UUID) {
  const db = await getDatabase();

  const session = await db.getFirstAsync<{
    id: string;
    activity_id: string;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
    note: string | null;
    photo_url: string | null;
    is_complete: number;
  }>(`SELECT * FROM sessions WHERE id = ?`, sessionId);

  const activityName = session
    ? (await db.getFirstAsync<{ name: string }>(
        `SELECT name FROM activities WHERE id = ?`,
        session.activity_id,
      ))?.name ?? 'Unknown'
    : 'Unknown';

  // Drill results with names via JOIN (no N+1)
  const drillRows = await db.getAllAsync<{
    id: string;
    drill_id: string;
    is_complete: number;
    note: string | null;
    photo_url: string | null;
    drillName: string;
  }>(
    `SELECT dr.id, dr.drill_id, dr.is_complete, dr.note, dr.photo_url,
            COALESCE(d.name, 'Unknown') as drillName
     FROM drill_results dr
     LEFT JOIN drills d ON d.id = dr.drill_id
     WHERE dr.session_id = ?`,
    sessionId,
  );

  // Element values for each drill result — batch query
  const drillResultIds = drillRows.map((r) => r.id);
  let elementValues: Array<{
    drill_result_id: string;
    id: string;
    tracking_element_id: string;
    label: string;
    type: string;
    value: string;
  }> = [];

  if (drillResultIds.length > 0) {
    const placeholders = drillResultIds.map(() => '?').join(', ');
    elementValues = await db.getAllAsync(
      `SELECT ev.id, ev.drill_result_id, ev.tracking_element_id, te.label, te.type, ev.value
       FROM element_values ev
       LEFT JOIN tracking_elements te ON te.id = ev.tracking_element_id
       WHERE ev.drill_result_id IN (${placeholders})`,
      drillResultIds,
    );
  }

  // Group element values by drill_result_id
  const valuesByDrillResult = new Map<string, ElementValueRow[]>();
  for (const ev of elementValues) {
    const list = valuesByDrillResult.get(ev.drill_result_id) ?? [];
    list.push({
      id: ev.id,
      trackingElementId: ev.tracking_element_id,
      label: ev.label ?? '',
      type: ev.type ?? '',
      value: ev.value,
    });
    valuesByDrillResult.set(ev.drill_result_id, list);
  }

  const drillResults: DrillResultDetail[] = drillRows.map((dr) => ({
    ...dr,
    elementValues: valuesByDrillResult.get(dr.id) ?? [],
  }));

  return {
    session,
    activityName,
    drillResults,
  };
}

// ---------------------------------------------------------------------------
// Delete session
// ---------------------------------------------------------------------------

export async function deleteSession(sessionId: UUID) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM sessions WHERE id = ?`, sessionId);
}