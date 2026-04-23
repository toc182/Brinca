import { StyleSheet, Text, View } from 'react-native';
import { CartesianChart, Line, Bar } from 'victory-native';

import { colors, radii, spacing, typography } from '@/shared/theme';
import type { ChartMetric } from '../repositories/stats.repository';
import type { BucketedPoint, TimeFilter } from '../utils/periods';

interface StatsChartsProps {
  currentData: BucketedPoint[];
  previousData: BucketedPoint[];
  cumulativeCurrent: BucketedPoint[];
  cumulativePrevious: BucketedPoint[];
  timeFilter: TimeFilter;
  metric: ChartMetric;
}

const CHART_HEIGHT = 140;
const ACCENT_COLOR = colors.primary500;
const GRAY_COLOR = colors.borderDefault;

function getMetricLabel(metric: ChartMetric): string {
  switch (metric) {
    case 'drills': return 'Drills completed';
    case 'sessions': return 'Sessions logged';
    case 'duration': return 'Total duration';
    case 'currency': return 'Currency earned';
  }
}

// ---------------------------------------------------------------------------
// Data shapes — use `type` (not `interface`) so they satisfy Record<string, unknown>
// ---------------------------------------------------------------------------

type SinglePoint = {
  x: number;
  y: number;
};

type DualPoint = {
  x: number;
  current: number;
  previous: number;
};

function toSinglePoints(data: BucketedPoint[]): SinglePoint[] {
  return data.map((d, i) => ({ x: i, y: d.y }));
}

function toDualPoints(
  current: BucketedPoint[],
  previous: BucketedPoint[],
): DualPoint[] {
  const len = Math.max(current.length, previous.length);
  return Array.from({ length: len }, (_, i) => ({
    x: i,
    current: i < current.length ? current[i].y : 0,
    previous: i < previous.length ? previous[i].y : 0,
  }));
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function StatsCharts({
  currentData,
  previousData,
  cumulativeCurrent,
  cumulativePrevious,
  timeFilter,
  metric,
}: StatsChartsProps) {
  const hasPrevData = previousData.length > 0 && previousData.some((d) => d.y > 0);
  const isAllTime = timeFilter === 'allTime';
  const showPrevious = hasPrevData && !isAllTime;

  const hasLineData = cumulativeCurrent.length > 0 && cumulativeCurrent.some((d) => d.y > 0);
  const hasBarData = currentData.length > 0 && currentData.some((d) => d.y > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>{getMetricLabel(metric)}</Text>

      {/* Cumulative line chart */}
      <View style={styles.chartBox}>
        {hasLineData ? (
          showPrevious ? (
            <DualLineChart
              data={toDualPoints(cumulativeCurrent, cumulativePrevious)}
            />
          ) : (
            <SingleLineChart data={toSinglePoints(cumulativeCurrent)} />
          )
        ) : (
          <FlatLineIndicator />
        )}
      </View>

      {/* Bar chart */}
      <View style={styles.chartBox}>
        {hasBarData ? (
          showPrevious ? (
            <DualBarChart data={toDualPoints(currentData, previousData)} />
          ) : (
            <SingleBarChart data={toSinglePoints(currentData)} />
          )
        ) : (
          <FlatLineIndicator />
        )}
      </View>

      {/* X-axis labels */}
      {currentData.length > 0 && (
        <View style={styles.xAxisLabels}>
          {getVisibleLabels(currentData, timeFilter).map((lbl, i) => (
            <Text key={i} style={styles.xAxisLabel}>{lbl}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Single-series charts
// ---------------------------------------------------------------------------

function SingleLineChart({ data }: { data: SinglePoint[] }) {
  return (
    <CartesianChart data={data} xKey="x" yKeys={['y']} domainPadding={{ top: 10, bottom: 5 }}>
      {({ points }) => (
        <Line points={points.y} color={ACCENT_COLOR} strokeWidth={2} curveType="natural" />
      )}
    </CartesianChart>
  );
}

function SingleBarChart({ data }: { data: SinglePoint[] }) {
  return (
    <CartesianChart
      data={data}
      xKey="x"
      yKeys={['y']}
      domainPadding={{ top: 10, bottom: 5, left: 10, right: 10 }}
    >
      {({ points, chartBounds }) => (
        <Bar
          points={points.y}
          chartBounds={chartBounds}
          color={ACCENT_COLOR}
          roundedCorners={{ topLeft: 3, topRight: 3 }}
          innerPadding={0.3}
        />
      )}
    </CartesianChart>
  );
}

// ---------------------------------------------------------------------------
// Dual-series charts (current + previous)
// ---------------------------------------------------------------------------

function DualLineChart({ data }: { data: DualPoint[] }) {
  return (
    <CartesianChart
      data={data}
      xKey="x"
      yKeys={['current', 'previous']}
      domainPadding={{ top: 10, bottom: 5 }}
    >
      {({ points }) => (
        <>
          <Line points={points.previous} color={GRAY_COLOR} strokeWidth={2} curveType="natural" />
          <Line points={points.current} color={ACCENT_COLOR} strokeWidth={2} curveType="natural" />
        </>
      )}
    </CartesianChart>
  );
}

function DualBarChart({ data }: { data: DualPoint[] }) {
  return (
    <CartesianChart
      data={data}
      xKey="x"
      yKeys={['current', 'previous']}
      domainPadding={{ top: 10, bottom: 5, left: 10, right: 10 }}
    >
      {({ points, chartBounds }) => (
        <>
          <Bar
            points={points.previous}
            chartBounds={chartBounds}
            color={GRAY_COLOR}
            roundedCorners={{ topLeft: 3, topRight: 3 }}
            innerPadding={0.3}
          />
          <Bar
            points={points.current}
            chartBounds={chartBounds}
            color={ACCENT_COLOR}
            roundedCorners={{ topLeft: 3, topRight: 3 }}
            innerPadding={0.3}
          />
        </>
      )}
    </CartesianChart>
  );
}

// ---------------------------------------------------------------------------
// Flat line placeholder for no-data state
// ---------------------------------------------------------------------------

function FlatLineIndicator() {
  return (
    <View style={styles.flatLine}>
      <View style={styles.flatLineBar} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getVisibleLabels(data: BucketedPoint[], filter: TimeFilter): string[] {
  if (filter === 'month') {
    return data.filter((_, i) => i % 5 === 0 || i === data.length - 1).map((d) => d.label);
  }
  if (data.length <= 12) {
    return data.map((d) => d.label);
  }
  return data.filter((_, i) => i % 2 === 0).map((d) => d.label);
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  chartTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  chartBox: {
    height: CHART_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
    overflow: 'hidden',
    padding: spacing.xs,
  },
  flatLine: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.md,
  },
  flatLineBar: {
    height: 2,
    backgroundColor: colors.borderSubtle,
    borderRadius: 1,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  xAxisLabel: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },
});