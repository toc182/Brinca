/**
 * Business entity types for Brinca.
 * Mapped from Supabase types via src/lib/supabase/mappers.ts.
 * Feature components import these, never Supabase types directly.
 *
 * All fields match docs/architecture/05-database-schema.md.
 */

export type UUID = string;
export type ISODateString = string;

// ---------------------------------------------------------------------------
// Auth & family
// ---------------------------------------------------------------------------

export type PersonaType = 'parent' | 'therapist' | 'coach' | 'teacher' | 'other';

export interface User {
  id: UUID;
  displayName: string;
  personaType: PersonaType | null;
  avatarUrl: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Family {
  id: UUID;
  currencyName: string;
  measurementUnit: 'metric' | 'imperial';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type FamilyRole = 'admin' | 'co_admin' | 'collaborator' | 'member';

export interface FamilyMember {
  id: UUID;
  familyId: UUID;
  userId: UUID;
  role: FamilyRole;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Invite {
  id: UUID;
  familyId: UUID;
  email: string;
  role: Exclude<FamilyRole, 'admin'>;
  invitedBy: UUID;
  createdAt: ISODateString;
  acceptedAt: ISODateString | null;
}

// ---------------------------------------------------------------------------
// Children
// ---------------------------------------------------------------------------

export type Gender = 'male' | 'female' | 'prefer_not_to_say';
export type SchoolCalendar = 'panamanian' | 'us' | 'custom';

export interface Child {
  id: UUID;
  familyId: UUID;
  name: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  country: string | null;
  gradeLevel: string | null;
  schoolCalendar: SchoolCalendar | null;
  calendarStartMonth: number | null;
  calendarEndMonth: number | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Activities & drills
// ---------------------------------------------------------------------------

export type ActivityCategory = 'sport' | 'therapy' | 'academic' | 'custom';

export interface Activity {
  id: UUID;
  childId: UUID;
  name: string;
  icon: string | null;
  category: ActivityCategory | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Drill {
  id: UUID;
  activityId: UUID;
  name: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Tracking elements (18 types)
// ---------------------------------------------------------------------------

export type TrackingElementType =
  | 'counter'
  | 'combined_counter'
  | 'split_counter'
  | 'multistep_counter'
  | 'stopwatch'
  | 'countdown_timer'
  | 'lap_timer'
  | 'interval_timer'
  | 'checklist'
  | 'single_select'
  | 'multi_select'
  | 'yes_no'
  | 'rating_scale'
  | 'emoji_face_scale'
  | 'number_input'
  | 'multi_number_input'
  | 'free_text_note'
  | 'voice_note';

export interface TrackingElement {
  id: UUID;
  drillId: UUID;
  type: TrackingElementType;
  label: string;
  config: Record<string, unknown>;
  displayOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Rewards configuration
// ---------------------------------------------------------------------------

export type TierParentType = 'activity' | 'drill';

export interface TierReward {
  id: UUID;
  parentType: TierParentType;
  parentId: UUID;
  name: string;
  conditions: TierCondition[];
  currencyAmount: number;
  displayOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface TierCondition {
  trackingElementId: UUID;
  operator: '>=' | '<=' | '=';
  value: number;
}

export interface BonusPreset {
  id: UUID;
  parentType: TierParentType;
  parentId: UUID;
  amount: number;
  displayOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Sessions & results
// ---------------------------------------------------------------------------

export interface Session {
  id: UUID;
  childId: UUID;
  activityId: UUID;
  startedAt: ISODateString;
  endedAt: ISODateString | null;
  durationSeconds: number | null;
  note: string | null;
  photoUrl: string | null;
  isComplete: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface DrillResult {
  id: UUID;
  sessionId: UUID;
  drillId: UUID;
  isComplete: boolean;
  note: string | null;
  photoUrl: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ElementValue {
  id: UUID;
  drillResultId: UUID;
  trackingElementId: UUID;
  value: Record<string, unknown>;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Currency & rewards
// ---------------------------------------------------------------------------

export type CurrencySource = 'drill_tier' | 'session_tier' | 'manual_bonus' | 'reward_redemption';

export interface CurrencyLedgerEntry {
  id: UUID;
  childId: UUID;
  amount: number;
  source: CurrencySource;
  referenceId: UUID | null;
  reason: string | null;
  createdAt: ISODateString;
}

export type RewardState = 'saving' | 'ready_to_redeem' | 'redeemed';

export interface Reward {
  id: UUID;
  childId: UUID;
  name: string;
  cost: number;
  state: RewardState;
  createdAt: ISODateString;
  redeemedAt: ISODateString | null;
}

// ---------------------------------------------------------------------------
// Accolades
// ---------------------------------------------------------------------------

export interface AccoladeUnlock {
  childId: UUID;
  accoladeId: string;
  unlockedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Measurements & external activities
// ---------------------------------------------------------------------------

export type MeasurementType = 'weight' | 'height';

export interface Measurement {
  id: UUID;
  childId: UUID;
  type: MeasurementType;
  value: number;
  date: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ExternalActivity {
  id: UUID;
  childId: UUID;
  name: string;
  schedule: string | null;
  location: string | null;
  notes: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
