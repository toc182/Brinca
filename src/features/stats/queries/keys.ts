export const statsKeys = {
  summary: (childId: string) => ['stats-summary', childId] as const,
  sessionList: (childId: string) => ['session-list', childId] as const,
  sessionDetail: (sessionId: string) => ['session-detail', sessionId] as const,
};
