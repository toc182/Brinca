import { getDatabase } from '@/lib/sqlite/db';
import type { UUID } from '@/types/domain.types';

export interface PhotoRow {
  url: string;
  date: string;
  source: 'session' | 'drill';
}

export async function getPhotosByChild(childId: UUID): Promise<PhotoRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<PhotoRow>(
    `SELECT photo_url AS url, started_at AS date, 'session' AS source
     FROM sessions WHERE child_id = ? AND photo_url IS NOT NULL
     UNION ALL
     SELECT dr.photo_url AS url, s.started_at AS date, 'drill' AS source
     FROM drill_results dr
     JOIN sessions s ON s.id = dr.session_id
     WHERE s.child_id = ? AND dr.photo_url IS NOT NULL
     ORDER BY date DESC`,
    childId,
    childId
  );
}