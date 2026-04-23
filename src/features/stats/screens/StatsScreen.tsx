import { useCallback, useMemo, useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { CaretDown, CaretRight, Check, Funnel } from 'phosphor-react-native';

import { ErrorState } from '@/shared/components/ErrorState';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { ParentAvatar } from '@/shared/components/ParentAvatar';
import { CollapsibleHeader, useCollapsibleHeaderHeight } from '@/shared/components/CollapsibleHeader';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { colors, iconSizes, radii, shadows, spacing, typography } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';

import type { ChartMetric, SessionRow } from '../repositories/stats.repository';
import {
  useActivitiesQuery,
  useChartDataQuery,
  useSessionListQuery,
  useStatsQuery,
} from '../queries/useStatsQuery';
import {
  bucketDataPoints,
  getDateRange,
  getPeriodInfo,
  getPreviousDateRange,
  toCumulative,
  type TimeFilter,
} from '../utils/periods';
import { StatsCharts } from '../components/StatsCharts';
import { ActivityFilterModal } from '../components/ActivityFilterModal';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'allTime', label: 'All Time' },
];

const CARD_METRICS: { key: ChartMetric; label: string }[] = [
  { key: 'drills', label: 'Drills completed' },
  { key: 'sessions', label: 'Sessions logged' },
  { key: 'duration', label: 'Total duration' },
  { key: 'currency', label: 'Currency earned' },
];

// ---------------------------------------------------------------------------
// StatsScreen
// ---------------------------------------------------------------------------

export function StatsScreen() {
  const childId = useActiveChildStore((s) => s.childId);
  const childName = useActiveChildStore((s) => s.childName);
  const scrollY = useSharedValue(0);
  const headerHeight = useCollapsibleHeaderHeight();
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });

  // --- State ---
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('drills');
  const [activityFilter, setActivityFilter] = useState<string[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);

  // --- Task 211: Reset state on child switch ---
  useEffect(() => {
    setPeriodOffset(0);
    setActivityFilter([]);
    setSelectedMetric('drills');
  }, [childId]);

  const filterButton = (
    <View style={styles.headerRight}>
      <Pressable onPress={() => setFilterModalVisible(true)} hitSlop={8} style={styles.headerButton}>
        <Funnel
          size={iconSizes.tabBar}
          color={activityFilter.length > 0 ? colors.primary500 : colors.textSecondary}
          weight={activityFilter.length > 0 ? 'fill' : 'regular'}
        />
      </Pressable>
      <ParentAvatar />
    </View>
  );

  // --- Derived ---
  const dateRange = useMemo(() => getDateRange(timeFilter, periodOffset), [timeFilter, periodOffset]);
  const previousDateRange = useMemo(() => getPreviousDateRange(timeFilter, periodOffset), [timeFilter, periodOffset]);
  const periodInfo = useMemo(() => getPeriodInfo(timeFilter, periodOffset), [timeFilter, periodOffset]);
  const isAllTime = timeFilter === 'allTime';
  const activeActivityIds = activityFilter.length > 0 ? activityFilter : undefined;

  // --- Queries ---
  const statsQuery = useStatsQuery(childId, dateRange, activeActivityIds);
  const prevStatsQuery = useStatsQuery(childId, previousDateRange, activeActivityIds);
  const sessionsQuery = useSessionListQuery(childId, dateRange, activeActivityIds);
  const chartQuery = useChartDataQuery(childId, selectedMetric, dateRange, activeActivityIds);
  const prevChartQuery = useChartDataQuery(childId, selectedMetric, previousDateRange, activeActivityIds);
  const activitiesQuery = useActivitiesQuery(childId);

  const isLoading = statsQuery.isLoading || sessionsQuery.isLoading;
  const isError = statsQuery.isError || sessionsQuery.isError;

  // --- Handlers ---
  const handleTimeFilterChange = useCallback((filter: TimeFilter) => {
    setTimeFilter(filter);
    setPeriodOffset(0);
    setActivityFilter([]); // Task 199: reset activity filter on time period change
    setPeriodDropdownOpen(false);
  }, []);

  const handleRetry = useCallback(() => {
    statsQuery.refetch();
    sessionsQuery.refetch();
    chartQuery.refetch();
  }, [statsQuery, sessionsQuery, chartQuery]);

  const handlePeriodChange = useCallback((direction: 'prev' | 'next') => {
    setPeriodOffset((prev) => (direction === 'prev' ? prev + 1 : Math.max(0, prev - 1)));
  }, []);

  // --- Computed values ---
  const stats = statsQuery.data;
  const prevStats = prevStatsQuery.data;
  const sessions = sessionsQuery.data ?? [];

  const hasPreviousData = !isAllTime && prevStats != null && (
    prevStats.sessionsCount > 0 ||
    prevStats.drillsCount > 0 ||
    prevStats.totalDurationSeconds > 0 ||
    prevStats.currencyEarned > 0
  );

  // Chart data
  const currentChartData = useMemo(
    () => bucketDataPoints(chartQuery.data ?? [], timeFilter, dateRange),
    [chartQuery.data, timeFilter, dateRange],
  );
  const previousChartData = useMemo(
    () => (isAllTime ? [] : bucketDataPoints(prevChartQuery.data ?? [], timeFilter, previousDateRange)),
    [prevChartQuery.data, timeFilter, previousDateRange, isAllTime],
  );
  const cumulativeCurrent = useMemo(() => toCumulative(currentChartData), [currentChartData]);
  const cumulativePrevious = useMemo(() => toCumulative(previousChartData), [previousChartData]);

  // --- Loading state ---
  if (isLoading) {
    return (
      <View style={styles.container}>
        <CollapsibleHeader title={childName ?? 'Stats'} scrollY={scrollY} rightContent={filterButton} />
        <Animated.ScrollView style={styles.container} contentContainerStyle={[styles.listContent, { paddingTop: headerHeight }]}>
          <OfflineBanner />
          <StatsLoadingSkeleton />
        </Animated.ScrollView>
      </View>
    );
  }

  // --- Error state ---
  if (isError) {
    return (
      <View style={styles.container}>
        <CollapsibleHeader title={childName ?? 'Stats'} scrollY={scrollY} rightContent={filterButton} />
        <Animated.ScrollView style={styles.container} contentContainerStyle={[styles.listContent, { paddingTop: headerHeight }]}>
          <OfflineBanner />
          <ErrorState onRetry={handleRetry} />
        </Animated.ScrollView>
      </View>
    );
  }

  // --- Period dropdown items ---
  const periodDropdownItems = isAllTime
    ? []
    : Array.from({ length: 6 }, (_, i) => {
        const info = getPeriodInfo(timeFilter, i);
        return info ? { offset: i, label: info.label } : null;
      }).filter(Boolean) as Array<{ offset: number; label: string }>;

  return (
    <View style={styles.container}>
      <CollapsibleHeader title={childName ?? 'Stats'} scrollY={scrollY} rightContent={filterButton} />
      <Animated.FlatList
        style={styles.container}
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingTop: headerHeight }]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <>
            <OfflineBanner />

            {/* Time filter segmented control */}
            <View style={styles.segmentedControl}>
              {TIME_FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  style={[
                    styles.segmentButton,
                    timeFilter === f.key && styles.segmentButtonActive,
                  ]}
                  onPress={() => handleTimeFilterChange(f.key)}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      timeFilter === f.key && styles.segmentLabelActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Period selector (hidden for All Time) */}
            {!isAllTime && periodInfo && (
              <View style={styles.periodSection}>
                <Pressable
                  style={styles.periodSelector}
                  onPress={() => setPeriodDropdownOpen((v) => !v)}
                >
                  <Text style={styles.periodLabel}>{periodInfo.label}</Text>
                  <CaretDown size={iconSizes.inline} color={colors.primary500} />
                </Pressable>
                {hasPreviousData && (
                  <Text style={styles.comparisonLabel}>{periodInfo.comparisonLabel}</Text>
                )}

                {/* Period dropdown */}
                {periodDropdownOpen && (
                  <View style={styles.periodDropdown}>
                    {periodDropdownItems.map((item) => (
                      <Pressable
                        key={item.offset}
                        style={[
                          styles.periodDropdownItem,
                          item.offset === periodOffset && styles.periodDropdownItemActive,
                        ]}
                        onPress={() => {
                          setPeriodOffset(item.offset);
                          setPeriodDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.periodDropdownText,
                            item.offset === periodOffset && styles.periodDropdownTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                        {item.offset === periodOffset && (
                          <Check size={iconSizes.inline} color={colors.primary500} />
                        )}
                      </Pressable>
                    ))}
                    <View style={styles.periodNavButtons}>
                      <Pressable
                        style={styles.periodNavButton}
                        onPress={() => handlePeriodChange('prev')}
                      >
                        <Text style={styles.periodNavText}>Older</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.periodNavButton, periodOffset === 0 && styles.periodNavDisabled]}
                        onPress={() => handlePeriodChange('next')}
                        disabled={periodOffset === 0}
                      >
                        <Text style={[styles.periodNavText, periodOffset === 0 && styles.periodNavTextDisabled]}>
                          Newer
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Charts */}
            <StatsCharts
              currentData={currentChartData}
              previousData={hasPreviousData ? previousChartData : []}
              cumulativeCurrent={cumulativeCurrent}
              cumulativePrevious={hasPreviousData ? cumulativePrevious : []}
              timeFilter={timeFilter}
              metric={selectedMetric}
            />

            {/* Summary cards 2x2 grid */}
            <View style={styles.summaryGrid}>
              {CARD_METRICS.map((card) => {
                const current = getMetricValue(stats, card.key);
                const previous = getMetricValue(prevStats, card.key);
                const isSelected = selectedMetric === card.key;
                return (
                  <Pressable
                    key={card.key}
                    style={[styles.card, isSelected && styles.cardSelected]}
                    onPress={() => setSelectedMetric(card.key)}
                  >
                    <Text style={styles.cardValue}>
                      {card.key === 'duration' ? formatDuration(current) : String(current)}
                    </Text>
                    <Text style={styles.cardLabel}>{card.label}</Text>
                    {!isAllTime && hasPreviousData && (
                      <View style={styles.cardComparison}>
                        <Text style={styles.cardPrevValue}>
                          {card.key === 'duration' ? formatDuration(previous) : String(previous)}
                        </Text>
                        <ComparisonIndicator current={current} previous={previous} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Session list header */}
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>History</Text>
              <Text style={styles.sessionCount}>{sessions.length} sessions</Text>
            </View>
          </>
        }
        renderItem={({ item }) => <SessionRowItem item={item} />}
        ListEmptyComponent={null}
      />

      {/* Activity filter modal */}
      {filterModalVisible && (
        <ActivityFilterModal
          activities={activitiesQuery.data ?? []}
          selectedIds={activityFilter}
          onApply={(ids: string[]) => {
            setActivityFilter(ids);
            setFilterModalVisible(false);
          }}
          onClose={() => setFilterModalVisible(false)}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMetricValue(
  stats: { sessionsCount: number; drillsCount: number; totalDurationSeconds: number; currencyEarned: number } | undefined,
  metric: ChartMetric,
): number {
  if (!stats) return 0;
  switch (metric) {
    case 'sessions': return stats.sessionsCount;
    case 'drills': return stats.drillsCount;
    case 'duration': return stats.totalDurationSeconds;
    case 'currency': return stats.currencyEarned;
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ---------------------------------------------------------------------------
// Comparison indicator
// ---------------------------------------------------------------------------

function ComparisonIndicator({ current, previous }: { current: number; previous: number }) {
  if (current > previous) {
    return <Text style={[styles.indicator, { color: colors.success600 }]}>{'\u2191'}</Text>;
  }
  if (current < previous) {
    return <Text style={[styles.indicator, { color: colors.error500 }]}>{'\u2193'}</Text>;
  }
  return <Text style={[styles.indicator, { color: colors.textSecondary }]}>=</Text>;
}

// ---------------------------------------------------------------------------
// Session row
// ---------------------------------------------------------------------------

function SessionRowItem({ item }: { item: SessionRow }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/stats/${item.id}` as never)}
      style={styles.sessionRow}
    >
      {item.activityIcon ? (
        <Text style={styles.activityIcon}>{item.activityIcon}</Text>
      ) : (
        <View style={styles.activityIconPlaceholder} />
      )}
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionActivity} numberOfLines={1}>
          {item.drillCount} drills {'\u00B7'} {item.activityName}
        </Text>
        <Text style={styles.sessionDate}>
          {new Date(item.started_at).toLocaleDateString()}
        </Text>
      </View>
      {!item.is_complete && (
        <View style={styles.incompleteBadge}>
          <Text style={styles.incompleteBadgeText}>Incomplete</Text>
        </View>
      )}
      <CaretRight size={iconSizes.body} color={colors.textSecondary} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function StatsLoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <SkeletonPlaceholder>
        {/* Segmented control */}
        <View style={{ height: 36, borderRadius: radii.md, marginBottom: spacing.md }} />
        {/* Period */}
        <View style={{ height: 20, width: '50%', borderRadius: radii.sm, marginBottom: spacing.xs }} />
        <View style={{ height: 14, width: '40%', borderRadius: radii.sm, marginBottom: spacing.lg }} />
        {/* Chart area */}
        <View style={{ height: 160, borderRadius: radii.md, marginBottom: spacing.md }} />
        {/* Summary cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          <View style={{ height: 80, width: '48%', borderRadius: radii.md }} />
          <View style={{ height: 80, width: '48%', borderRadius: radii.md }} />
          <View style={{ height: 80, width: '48%', borderRadius: radii.md, marginTop: spacing.xs }} />
          <View style={{ height: 80, width: '48%', borderRadius: radii.md, marginTop: spacing.xs }} />
        </View>
        {/* History header */}
        <View style={{ height: 20, width: '30%', borderRadius: radii.sm, marginTop: spacing.lg, marginBottom: spacing.sm }} />
        {/* Session rows */}
        <View style={{ height: 60, borderRadius: radii.md, marginBottom: spacing.xs }} />
        <View style={{ height: 60, borderRadius: radii.md, marginBottom: spacing.xs }} />
        <View style={{ height: 60, borderRadius: radii.md }} />
      </SkeletonPlaceholder>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  screenTitle: { ...typography.titleLarge, color: colors.textPrimary },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl },

  // Header
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  headerButton: {
    padding: spacing.xxs,
  },

  // Segmented control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceDisabled,
    borderRadius: radii.md,
    padding: spacing.xxs,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  segmentButtonActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  segmentLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  segmentLabelActive: {
    color: colors.primary500,
    fontFamily: 'Lexend_600SemiBold',
  },

  // Period selector
  periodSection: { marginBottom: spacing.md },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  periodLabel: {
    ...typography.titleSmall,
    color: colors.primary500,
  },
  comparisonLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxxs,
  },

  // Period dropdown
  periodDropdown: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginTop: spacing.xs,
    ...shadows.md,
    overflow: 'hidden',
  },
  periodDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  periodDropdownItemActive: {
    backgroundColor: colors.primary50,
  },
  periodDropdownText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  periodDropdownTextActive: {
    color: colors.primary500,
    fontFamily: 'Lexend_600SemiBold',
  },
  periodNavButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  periodNavButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  periodNavDisabled: { opacity: 0.4 },
  periodNavText: {
    ...typography.caption,
    color: colors.primary500,
  },
  periodNavTextDisabled: { color: colors.textDisabled },

  // Summary cards
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  card: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary500,
    backgroundColor: colors.primary50,
  },
  cardValue: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 24,
    color: colors.textPrimary,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxxs,
    textAlign: 'center',
  },
  cardComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  cardPrevValue: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },
  indicator: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },

  // Session list
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  historyTitle: { ...typography.titleSmall, color: colors.textPrimary },
  sessionCount: { ...typography.caption, color: colors.textSecondary },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.sm,
    ...shadows.sm,
  },
  activityIcon: { fontSize: 24 },
  activityIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.primary100,
  },
  sessionInfo: { flex: 1 },
  sessionActivity: { ...typography.titleSmall, color: colors.textPrimary },
  sessionDate: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxxs },
  incompleteBadge: {
    backgroundColor: colors.warning50,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxxs,
    borderRadius: radii.xs,
  },
  incompleteBadgeText: {
    ...typography.captionSmall,
    color: colors.warning700,
  },

  // Skeleton
  skeletonContainer: {
    padding: spacing.md,
  },
});