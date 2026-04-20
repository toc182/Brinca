export const activityBuilderKeys = {
  activities: (childId: string) => ['activities', childId] as const,
  activity: (activityId: string) => ['activity', activityId] as const,
  drills: (activityId: string) => ['drills', activityId] as const,
  drill: (drillId: string) => ['drill', drillId] as const,
  elements: (drillId: string) => ['tracking-elements', drillId] as const,
  tierRewards: (parentType: string, parentId: string) => ['tier-rewards', parentType, parentId] as const,
  bonusPresets: (parentType: string, parentId: string) => ['bonus-presets', parentType, parentId] as const,
};
