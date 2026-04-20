/**
 * Supabase row types → domain types.
 * Per 02-project-structure.md Decision 12: the mapping is done once here.
 * Feature components import domain types, not Supabase types.
 *
 * More mappers added in later phases as needed.
 */

import type { Database } from './types';
import type {
  User,
  Family,
  FamilyMember,
  Child,
  Activity,
  Drill,
  Session,
  DrillResult,
  Reward,
  CurrencyLedgerEntry,
  AccoladeUnlock,
  Measurement,
  ExternalActivity,
  PersonaType,
  FamilyRole,
  Gender,
  ActivityCategory,
  SchoolCalendar,
  RewardState,
  CurrencySource,
  MeasurementType,
} from '@/types/domain.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type FamilyRow = Database['public']['Tables']['families']['Row'];
type FamilyMemberRow = Database['public']['Tables']['family_members']['Row'];
type ChildRow = Database['public']['Tables']['children']['Row'];
type ActivityRow = Database['public']['Tables']['activities']['Row'];
type DrillRow = Database['public']['Tables']['drills']['Row'];
type SessionRow = Database['public']['Tables']['sessions']['Row'];
type DrillResultRow = Database['public']['Tables']['drill_results']['Row'];
type RewardRow = Database['public']['Tables']['rewards']['Row'];
type LedgerRow = Database['public']['Tables']['currency_ledger']['Row'];
type AccoladeRow = Database['public']['Tables']['accolade_unlocks']['Row'];
type MeasurementRow = Database['public']['Tables']['measurements']['Row'];
type ExternalActivityRow = Database['public']['Tables']['external_activities']['Row'];

export function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    displayName: row.display_name,
    personaType: row.persona_type as PersonaType | null,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFamily(row: FamilyRow): Family {
  return {
    id: row.id,
    currencyName: row.currency_name,
    measurementUnit: row.measurement_unit as 'metric' | 'imperial',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFamilyMember(row: FamilyMemberRow): FamilyMember {
  return {
    id: row.id,
    familyId: row.family_id,
    userId: row.user_id,
    role: row.role as FamilyRole,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapChild(row: ChildRow): Child {
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    avatarUrl: row.avatar_url,
    dateOfBirth: row.date_of_birth,
    gender: row.gender as Gender | null,
    country: row.country,
    gradeLevel: row.grade_level,
    schoolCalendar: row.school_calendar as SchoolCalendar | null,
    calendarStartMonth: row.calendar_start_month,
    calendarEndMonth: row.calendar_end_month,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    childId: row.child_id,
    name: row.name,
    icon: row.icon,
    category: row.category as ActivityCategory | null,
    isActive: row.is_active,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDrill(row: DrillRow): Drill {
  return {
    id: row.id,
    activityId: row.activity_id,
    name: row.name,
    isActive: row.is_active,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    childId: row.child_id,
    activityId: row.activity_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    note: row.note,
    photoUrl: row.photo_url,
    isComplete: row.is_complete,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDrillResult(row: DrillResultRow): DrillResult {
  return {
    id: row.id,
    sessionId: row.session_id,
    drillId: row.drill_id,
    isComplete: row.is_complete,
    note: row.note,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapReward(row: RewardRow): Reward {
  return {
    id: row.id,
    childId: row.child_id,
    name: row.name,
    cost: row.cost,
    state: row.state as RewardState,
    createdAt: row.created_at,
    redeemedAt: row.redeemed_at,
  };
}

export function mapLedgerEntry(row: LedgerRow): CurrencyLedgerEntry {
  return {
    id: row.id,
    childId: row.child_id,
    amount: row.amount,
    source: row.source as CurrencySource,
    referenceId: row.reference_id,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export function mapAccoladeUnlock(row: AccoladeRow): AccoladeUnlock {
  return {
    childId: row.child_id,
    accoladeId: row.accolade_id,
    unlockedAt: row.unlocked_at,
  };
}

export function mapMeasurement(row: MeasurementRow): Measurement {
  return {
    id: row.id,
    childId: row.child_id,
    type: row.type as MeasurementType,
    value: row.value,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapExternalActivity(row: ExternalActivityRow): ExternalActivity {
  return {
    id: row.id,
    childId: row.child_id,
    name: row.name,
    schedule: row.schedule,
    location: row.location,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
