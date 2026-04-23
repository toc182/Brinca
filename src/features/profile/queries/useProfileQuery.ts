import { useQuery } from '@tanstack/react-query';

import { profileKeys } from './keys';
import {
  getChildById,
  getLatestMeasurement,
  getActivitiesSummary,
  getExternalActivitiesSummary,
} from '../repositories/profile.repository';

export interface ActivityItem {
  id: string;
  name: string;
  icon: string | null;
  category: string | null;
  type: 'app' | 'external';
  sessionCount?: number;
  lastSessionDate?: string | null;
  schedule?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface ProfileData {
  child: {
    id: string;
    familyId: string;
    name: string;
    avatarUrl: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    country: string | null;
    gradeLevel: string | null;
  } | null;
  latestWeight: { value: number; date: string } | null;
  latestHeight: { value: number; date: string } | null;
  activities: ActivityItem[];
}

export function useProfileQuery(childId: string | null) {
  return useQuery({
    queryKey: profileKeys.child(childId ?? ''),
    queryFn: async (): Promise<ProfileData> => {
      const row = await getChildById(childId!);
      if (!row) {
        return { child: null, latestWeight: null, latestHeight: null, activities: [] };
      }

      const [weightRow, heightRow, activityRows, externalRows] = await Promise.all([
        getLatestMeasurement(childId!, 'weight'),
        getLatestMeasurement(childId!, 'height'),
        getActivitiesSummary(childId!),
        getExternalActivitiesSummary(childId!),
      ]);

      const appActivities: ActivityItem[] = activityRows.map((a) => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
        category: a.category,
        type: 'app' as const,
        sessionCount: a.session_count,
        lastSessionDate: a.last_session_date,
      }));

      const externalActivities: ActivityItem[] = externalRows.map((e) => ({
        id: e.id,
        name: e.name,
        icon: null,
        category: null,
        type: 'external' as const,
        schedule: e.schedule,
        location: e.location,
        notes: e.notes,
      }));

      return {
        child: {
          id: row.id,
          familyId: row.family_id,
          name: row.name,
          avatarUrl: row.avatar_url,
          dateOfBirth: row.date_of_birth,
          gender: row.gender,
          country: row.country,
          gradeLevel: row.grade_level,
        },
        latestWeight: weightRow ? { value: weightRow.value, date: weightRow.date } : null,
        latestHeight: heightRow ? { value: heightRow.value, date: heightRow.date } : null,
        activities: [...appActivities, ...externalActivities],
      };
    },
    enabled: !!childId,
  });
}
