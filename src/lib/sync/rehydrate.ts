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
  console.log('[FK] ensureLocalFKChain called with', { childId, familyId, childName });
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
      console.warn('[FK] Family Supabase query failed for id:', familyId, 'error:', familyError);
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
    console.error('[FK]', msg);
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
      console.warn('[FK] Child Supabase query failed for id:', childId, 'error:', childError);
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
    console.error('[FK]', msg);
    Sentry.captureMessage(msg, 'error');
  }
}

/**
 * Pull activities from Supabase into local SQLite.
 * Runs AFTER auth resolves — non-blocking, fire-and-forget.
 * Assumes ensureLocalFKChain has already run (child row exists).
 */
export async function rehydrateActivities(
  childId: UUID,
  queryClient: QueryClient,
): Promise<void> {
  const db = await getDatabase();

  const localCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM activities WHERE child_id = ?',
    childId,
  );

  if (localCount && localCount.count > 0) return;

  const { data: remoteActivities, error } = await supabase
    .from('activities')
    .select('id, child_id, name, icon, category, is_active, display_order, created_at, updated_at')
    .eq('child_id', childId)
    .order('display_order', { ascending: true });

  if (error || !remoteActivities || remoteActivities.length === 0) return;

  for (const a of remoteActivities) {
    await db.runAsync(
      `INSERT OR IGNORE INTO activities (id, child_id, name, icon, category, is_active, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      a.id,
      a.child_id,
      a.name,
      a.icon ?? null,
      a.category ?? null,
      a.is_active ? 1 : 0,
      a.display_order,
      a.created_at,
      a.updated_at,
    );
  }

  queryClient.invalidateQueries({ queryKey: ['activities'] });
  queryClient.invalidateQueries({ queryKey: ['activities-selector'] });
}
