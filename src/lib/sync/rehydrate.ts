import type { QueryClient } from '@tanstack/react-query';

import { getDatabase } from '../sqlite/db';
import { supabase } from '../supabase/client';
import type { UUID } from '@/types/domain.types';

/**
 * One-time pull of family → child → activities from Supabase into local SQLite.
 * Runs after reinstall when Keychain retains the session but the
 * app sandbox (MMKV + SQLite) was wiped by iOS.
 *
 * Inserts prerequisite rows (family, child) first so FK constraints pass,
 * then pulls activities. Uses INSERT OR IGNORE to avoid duplicates.
 * Does NOT queue pulled rows for sync (they already exist in Supabase).
 */
export async function rehydrateActivities(
  childId: UUID,
  familyId: UUID,
  queryClient: QueryClient,
): Promise<void> {
  const db = await getDatabase();

  // 1. Ensure the family row exists locally
  const localFamily = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM families WHERE id = ?',
    familyId,
  );
  if (!localFamily) {
    const { data: family } = await supabase
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
    }
  }

  // 2. Ensure the child row exists locally
  const localChild = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM children WHERE id = ?',
    childId,
  );
  if (!localChild) {
    const { data: child } = await supabase
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
    }
  }

  // 3. Pull activities if local table is empty for this child
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
