export const profileKeys = {
  child: (childId: string) => ['profile', 'child', childId] as const,
  children: (familyId: string) => ['profile', 'children', familyId] as const,
  measurements: (childId: string) => ['profile', 'measurements', childId] as const,
  externalActivities: (childId: string) => ['profile', 'external-activities', childId] as const,
  activitiesSummary: (childId: string) => ['profile', 'activities-summary', childId] as const,
  accountProfile: (userId: string) => ['profile', 'account', userId] as const,
  photos: (childId: string) => ['profile', 'photos', childId] as const,
};
