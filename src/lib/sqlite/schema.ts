/**
 * Complete SQLite table definitions for Brinca.
 * Mirrors the Supabase schema defined in docs/architecture/05-database-schema.md.
 * All synced tables exist in both SQLite (local) and Supabase (cloud).
 * sync_queue is SQLite-only.
 */

export const TABLE_DEFINITIONS = {
  profiles: `
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      persona_type TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  families: `
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      currency_name TEXT NOT NULL DEFAULT 'Coins',
      measurement_unit TEXT NOT NULL DEFAULT 'metric',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  family_members: `
    CREATE TABLE IF NOT EXISTS family_members (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  invites: `
    CREATE TABLE IF NOT EXISTS invites (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      invited_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      accepted_at TEXT
    );
  `,

  children: `
    CREATE TABLE IF NOT EXISTS children (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      avatar_url TEXT,
      date_of_birth TEXT,
      gender TEXT,
      country TEXT,
      grade_level TEXT,
      school_calendar TEXT,
      calendar_start_month INTEGER,
      calendar_end_month INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  activities: `
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      icon TEXT,
      category TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  drills: `
    CREATE TABLE IF NOT EXISTS drills (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  tracking_elements: `
    CREATE TABLE IF NOT EXISTS tracking_elements (
      id TEXT PRIMARY KEY,
      drill_id TEXT NOT NULL REFERENCES drills(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      config TEXT NOT NULL DEFAULT '{}',
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  tier_rewards: `
    CREATE TABLE IF NOT EXISTS tier_rewards (
      id TEXT PRIMARY KEY,
      parent_type TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      name TEXT NOT NULL,
      conditions TEXT NOT NULL DEFAULT '[]',
      currency_amount INTEGER NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  bonus_presets: `
    CREATE TABLE IF NOT EXISTS bonus_presets (
      id TEXT PRIMARY KEY,
      parent_type TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  rewards: `
    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      cost INTEGER NOT NULL,
      state TEXT NOT NULL DEFAULT 'saving',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      redeemed_at TEXT
    );
  `,

  sessions: `
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      activity_id TEXT NOT NULL REFERENCES activities(id),
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_seconds INTEGER,
      note TEXT,
      photo_url TEXT,
      is_complete INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  drill_results: `
    CREATE TABLE IF NOT EXISTS drill_results (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      drill_id TEXT NOT NULL REFERENCES drills(id),
      is_complete INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      photo_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  element_values: `
    CREATE TABLE IF NOT EXISTS element_values (
      id TEXT PRIMARY KEY,
      drill_result_id TEXT NOT NULL REFERENCES drill_results(id) ON DELETE CASCADE,
      tracking_element_id TEXT NOT NULL REFERENCES tracking_elements(id),
      value TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  currency_ledger: `
    CREATE TABLE IF NOT EXISTS currency_ledger (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      source TEXT NOT NULL,
      reference_id TEXT,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  accolade_unlocks: `
    CREATE TABLE IF NOT EXISTS accolade_unlocks (
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      accolade_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (child_id, accolade_id)
    );
  `,

  measurements: `
    CREATE TABLE IF NOT EXISTS measurements (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  external_activities: `
    CREATE TABLE IF NOT EXISTS external_activities (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      schedule TEXT,
      location TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  // SQLite-only — not synced to Supabase
  sync_queue: `
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      table_name TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
} as const;

export type TableName = keyof typeof TABLE_DEFINITIONS;
