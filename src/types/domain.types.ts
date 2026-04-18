/**
 * Business entity types — populated in Phase 2.
 * Mapped from Supabase types via src/lib/supabase/mappers.ts.
 * Feature components import these, never Supabase types directly.
 */

export type UUID = string;
export type ISODateString = string;

// Placeholder interfaces — will be filled with all fields in Phase 2 (PR 4).

export interface User {
  id: UUID;
  displayName: string;
  personaType: string | null;
  avatarUrl: string | null;
}

export interface Family {
  id: UUID;
  currencyName: string;
  measurementUnit: 'metric' | 'imperial';
}

export interface Child {
  id: UUID;
  familyId: UUID;
  name: string;
}

export interface Activity {
  id: UUID;
  childId: UUID;
  name: string;
}
