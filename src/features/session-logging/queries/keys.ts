export const sessionKeys = {
  session: (sessionId: string) => ['session', sessionId] as const,
  drillResults: (sessionId: string) => ['drill-results', sessionId] as const,
  elementValues: (drillResultId: string) => ['element-values', drillResultId] as const,
  forChild: (childId: string) => ['sessions', childId] as const,
  recentSessions: (childId: string) => ['recent-sessions', childId] as const,
};
