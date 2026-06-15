import { supabase } from './client';
import { getDatabase } from '@/lib/sqlite/db';

/**
 * Make child profiles (name + avatar) behave like the parent profile:
 * always read server-fresh. The parent's photo propagates across devices
 * because it's fetched live from Supabase on every load; child data is
 * offline-first local SQLite that's only pulled down once at bootstrap, so
 * a photo changed on one device never reached the others.
 *
 * These helpers pull the latest child rows from Supabase into local SQLite
 * before the local read. Existing screens (which read + sign the local
 * `children.avatar_url`) then show the fresh photo with no other changes.
 *
 * Best-effort: any network/error path silently keeps the local values, so
 * offline still renders the last-known photo (same as the parent, whose
 * live query also falls back to its cache offline).
 *
 * Clobber guard: a child with a not-yet-synced local edit (a pending
 * sync_queue row) is skipped, so the device that just changed a photo
 * doesn't have its own change overwritten by the older server value before
 * its upload finishes syncing.
 */

async function childHasPendingSync(childId: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT 1 AS n FROM sync_queue
       WHERE table_name = 'children'
         AND status IN ('pending', 'in_flight', 'failed')
         AND payload LIKE ?
       LIMIT 1`,
    `%"id":"${childId}"%`,
  );
  return !!row;
}

/** A server avatar value worth writing locally: present and actually
 *  signable (a never-uploaded file:// is worthless and must not clobber a
 *  good local photo). */
function isUsableServerAvatar(value: string | null | undefined): value is string {
  return !!value && !value.startsWith('file://');
}

export async function refreshChildFromServer(childId: string): Promise<void> {
  try {
    if (await childHasPendingSync(childId)) return;
    const { data, error } = await supabase
      .from('children')
      .select('name, avatar_url')
      .eq('id', childId)
      .single();
    if (error || !data) return;
    const db = await getDatabase();
    // Never wipe a good local photo with an empty/unusable server value.
    if (isUsableServerAvatar(data.avatar_url)) {
      await db.runAsync(
        `UPDATE children SET name = ?, avatar_url = ? WHERE id = ?`,
        data.name,
        data.avatar_url,
        childId,
      );
    } else {
      await db.runAsync(`UPDATE children SET name = ? WHERE id = ?`, data.name, childId);
    }
  } catch {
    // offline / transient — keep local values
  }
}

export async function refreshChildrenFromServer(familyId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('children')
      .select('id, name, avatar_url')
      .eq('family_id', familyId);
    if (error || !data) return;
    const db = await getDatabase();
    for (const c of data) {
      if (await childHasPendingSync(c.id)) continue;
      if (isUsableServerAvatar(c.avatar_url)) {
        await db.runAsync(
          `UPDATE children SET name = ?, avatar_url = ? WHERE id = ?`,
          c.name,
          c.avatar_url,
          c.id,
        );
      } else {
        await db.runAsync(`UPDATE children SET name = ? WHERE id = ?`, c.name, c.id);
      }
    }
  } catch {
    // offline / transient — keep local values
  }
}
