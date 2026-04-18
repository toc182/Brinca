import { TABLE_DEFINITIONS } from '../schema';

/**
 * Migration 0001: Create all initial tables.
 * Applies the full schema from docs/architecture/05-database-schema.md.
 */
export const migrations = [
  {
    version: 1,
    sql: Object.values(TABLE_DEFINITIONS).join('\n'),
  },
];
