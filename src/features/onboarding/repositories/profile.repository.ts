import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

export async function insertProfile(
  id: UUID,
  displayName: string,
  personaType: string | null
) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO profiles (id, display_name, persona_type) VALUES (?, ?, ?)`,
    id,
    displayName,
    personaType
  );
}

export async function getProfile(id: UUID) {
  const db = await getDatabase();
  return db.getFirstAsync<{
    id: string;
    display_name: string;
    persona_type: string | null;
    avatar_url: string | null;
  }>(`SELECT * FROM profiles WHERE id = ?`, id);
}
