import type { SQLiteDatabase } from 'expo-sqlite';

import { TABLE_DEFINITIONS } from '../schema';
import { migration as normalizeCategories } from './0002_normalize_categories';
import { migration as drillResultPhotos } from './0003_drill_result_photos';
import { migration as sessionPhotos } from './0004_session_photos';
import { migration as drillDescription } from './0005_drill_description';

/**
 * A migration is either a raw SQL string (declarative) or an async runner
 * that has the SQLite handle for procedural cases the SQL form can't express
 * — see 0005 for an example (conditional ALTER guarded by PRAGMA).
 */
export type Migration =
  | { version: number; sql: string }
  | { version: number; run: (db: SQLiteDatabase) => Promise<void> };

/**
 * Migration 0001: Create all initial tables.
 * Applies the full schema from docs/architecture/05-database-schema.md.
 */
export const migrations: Migration[] = [
  {
    version: 1,
    sql: Object.values(TABLE_DEFINITIONS).join('\n'),
  },
  normalizeCategories,
  drillResultPhotos,
  sessionPhotos,
  drillDescription,
];
