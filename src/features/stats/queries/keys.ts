import type { ChartMetric, DateRange } from '../repositories/stats.repository';

export const statsKeys = {
  summary: (childId: string, dateRange?: DateRange, activityIds?: string[]) =>
    ['stats-summary', childId, dateRange?.start, dateRange?.end, activityIds] as const,
  sessionList: (childId: string, dateRange?: DateRange, activityIds?: string[]) =>
    ['session-list', childId, dateRange?.start, dateRange?.end, activityIds] as const,
  chartData: (childId: string, metric: ChartMetric, dateRange?: DateRange, activityIds?: string[]) =>
    ['stats-chart', childId, metric, dateRange?.start, dateRange?.end, activityIds] as const,
  activities: (childId: string) => ['stats-activities', childId] as const,
  sessionDetail: (sessionId: string) => ['session-detail', sessionId] as const,
};