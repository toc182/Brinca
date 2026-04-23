import { useQuery } from '@tanstack/react-query';

import {
  getStatsSummary,
  getSessionList,
  getChartData,
  getChildActivities,
  type ChartMetric,
  type DateRange,
} from '../repositories/stats.repository';
import { statsKeys } from './keys';

export function useStatsQuery(
  childId: string | null,
  dateRange?: DateRange,
  activityIds?: string[],
) {
  return useQuery({
    queryKey: statsKeys.summary(childId ?? '', dateRange, activityIds),
    queryFn: () =>
      getStatsSummary({
        childId: childId!,
        dateRange,
        activityIds,
      }),
    enabled: !!childId,
  });
}

export function useSessionListQuery(
  childId: string | null,
  dateRange?: DateRange,
  activityIds?: string[],
) {
  return useQuery({
    queryKey: statsKeys.sessionList(childId ?? '', dateRange, activityIds),
    queryFn: () =>
      getSessionList({
        childId: childId!,
        dateRange,
        activityIds,
      }),
    enabled: !!childId,
  });
}

export function useChartDataQuery(
  childId: string | null,
  metric: ChartMetric,
  dateRange?: DateRange,
  activityIds?: string[],
) {
  return useQuery({
    queryKey: statsKeys.chartData(childId ?? '', metric, dateRange, activityIds),
    queryFn: () =>
      getChartData(
        { childId: childId!, dateRange, activityIds },
        metric,
      ),
    enabled: !!childId,
  });
}

export function useActivitiesQuery(childId: string | null) {
  return useQuery({
    queryKey: statsKeys.activities(childId ?? ''),
    queryFn: () => getChildActivities(childId!),
    enabled: !!childId,
  });
}