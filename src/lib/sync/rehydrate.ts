import type { QueryClient } from '@tanstack/react-query';

import { getDatabase } from '../sqlite/db';
import { supabase } from '../supabase/client';
import type { UUID } from '@/types/domain.types';

/**
 * One-time pull of activities from Supabase into local SQLite.
 * Runs after reinstall when Keychain retains the session but the
 * app sandbox (MMKV + SQLite) was wiped by iOS.
 *
 * - Uses INSERT OR IGNORE to avoid duplicates.
 * - Does NOT queue pulled rows for sync (they already exist in Supabase).
 * - Invalidates TanStack Query cache so the UI picks up the data.
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
