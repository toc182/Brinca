import { useQuery } from '@tanstack/react-query';

import { profileKeys } from './keys';
import {
  getChildById,
  getLatestMeasurement,
  getActivitiesSummary,
} from '../repositories/profile.repository';

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
  activities: Array<{
    id: string;
    name: string;
    icon: string | null;
    category: string | null;
  }>;
}

export function useProfileQuery(childId: string | null) {
  return useQuery({
    queryKey: profileKeys.child(childId ?? ''),
    queryFn: async (): Promise<ProfileData> => {
      const row = await getChildById(childId!);
      if (!row) {
        return { child: null, latestWeight: null, latestHeight: null, activities: [] };
      }

      const [weightRow, heightRow, activityRows] = await Promise.all([
        getLatestMeasurement(childId!, 'weight'),
        getLatestMeasurement(childId!, 'height'),
        getActivitiesSummary(childId!),
      ]);

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
        activities: activityRows.map((a) => ({
          id: a.id,
          name: a.name,
          icon: a.icon,
          category: a.category,
        })),
      };
    },
    enabled: !!childId,
  });
}
