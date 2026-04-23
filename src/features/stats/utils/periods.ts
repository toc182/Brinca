import type { DateRange } from '../repositories/stats.repository';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimeFilter = 'week' | 'month' | 'year' | 'allTime';

export interface PeriodInfo {
  current: DateRange;
  previous: DateRange;
  label: string;
  comparisonLabel: string;
}

// ---------------------------------------------------------------------------
// Period calculations
// ---------------------------------------------------------------------------

/** Get the start of the week (Sunday) for a given date. */
function startOfWeek(d: Date): Date {
  const result = new Date(d);
  result.setDate(result.getDate() - result.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

function toISO(d: Date): string {
  return d.toISOString();
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Compute current + previous period ranges for a given filter and offset. */
export function getPeriodInfo(filter: TimeFilter, offset: number = 0): PeriodInfo | null {
  if (filter === 'allTime') return null;

  const now = new Date();

  switch (filter) {
    case 'week': {
      const currentStart = startOfWeek(now);
      currentStart.setDate(currentStart.getDate() - offset * 7);
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 7);

      const prevStart = new Date(currentStart);
      prevStart.setDate(prevStart.getDate() - 7);
      const prevEnd = new Date(currentStart);

      const lastDay = new Date(currentEnd);
      lastDay.setDate(lastDay.getDate() - 1);

      return {
        current: { start: toISO(currentStart), end: toISO(currentEnd) },
        previous: { start: toISO(prevStart), end: toISO(prevEnd) },
        label: `${formatDateShort(currentStart)} – ${formatDateShort(lastDay)}`,
        comparisonLabel: `vs. ${formatDateShort(prevStart)} – ${formatDateShort(new Date(prevEnd.getTime() - 1))}`,
      };
    }
    case 'month': {
      const currentStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const currentEnd = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);

      const prevStart = new Date(now.getFullYear(), now.getMonth() - offset - 1, 1);
      const prevEnd = new Date(currentStart);

      const monthName = currentStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const prevMonthName = prevStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      return {
        current: { start: toISO(currentStart), end: toISO(currentEnd) },
        previous: { start: toISO(prevStart), end: toISO(prevEnd) },
        label: monthName,
        comparisonLabel: `vs. ${prevMonthName}`,
      };
    }
    case 'year': {
      const currentStart = new Date(now.getFullYear() - offset, 0, 1);
      const currentEnd = new Date(now.getFullYear() - offset + 1, 0, 1);

      const prevStart = new Date(now.getFullYear() - offset - 1, 0, 1);
      const prevEnd = new Date(currentStart);

      return {
        current: { start: toISO(currentStart), end: toISO(currentEnd) },
        previous: { start: toISO(prevStart), end: toISO(prevEnd) },
        label: String(currentStart.getFullYear()),
        comparisonLabel: `vs. ${prevStart.getFullYear()}`,
      };
    }
  }
}

/** Get the date range for the current period (or undefined for All Time). */
export function getDateRange(filter: TimeFilter, offset: number = 0): DateRange | undefined {
  if (filter === 'allTime') return undefined;
  const info = getPeriodInfo(filter, offset);
  return info?.current;
}

/** Get the previous period's date range (for comparison). */
export function getPreviousDateRange(filter: TimeFilter, offset: number = 0): DateRange | undefined {
  if (filter === 'allTime') return undefined;
  const info = getPeriodInfo(filter, offset);
  return info?.previous;
}

// ---------------------------------------------------------------------------
// X-axis labels
// ---------------------------------------------------------------------------

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getXAxisLabels(filter: TimeFilter): string[] {
  switch (filter) {
    case 'week':
      return DAY_LABELS;
    case 'month':
      return ['1', '5', '10', '15', '20', '25', '30'];
    case 'year':
      return MONTH_LABELS;
    case 'allTime':
      return []; // Dynamically generated from data
  }
}

// ---------------------------------------------------------------------------
// Bucket data points for chart display
// ---------------------------------------------------------------------------

export interface BucketedPoint {
  x: number;
  y: number;
  label: string;
}

/** Bucket raw daily data into the correct x-axis positions based on the filter. */
export function bucketDataPoints(
  data: Array<{ date: string; value: number }>,
  filter: TimeFilter,
  dateRange?: DateRange,
): BucketedPoint[] {
  if (data.length === 0) return [];

  switch (filter) {
    case 'week': {
      // 7 buckets (Sun–Sat)
      const buckets = Array.from({ length: 7 }, (_, i) => ({
        x: i,
        y: 0,
        label: DAY_LABELS[i],
      }));
      for (const d of data) {
        const day = new Date(d.date).getDay();
        buckets[day].y += d.value;
      }
      return buckets;
    }
    case 'month': {
      // 31 buckets (day 1–31)
      const buckets = Array.from({ length: 31 }, (_, i) => ({
        x: i,
        y: 0,
        label: String(i + 1),
      }));
      for (const d of data) {
        const dayOfMonth = new Date(d.date).getDate() - 1;
        if (dayOfMonth >= 0 && dayOfMonth < 31) {
          buckets[dayOfMonth].y += d.value;
        }
      }
      return buckets;
    }
    case 'year': {
      // 12 buckets (Jan–Dec)
      const buckets = Array.from({ length: 12 }, (_, i) => ({
        x: i,
        y: 0,
        label: MONTH_LABELS[i],
      }));
      for (const d of data) {
        const month = new Date(d.date).getMonth();
        buckets[month].y += d.value;
      }
      return buckets;
    }
    case 'allTime': {
      // Group by year
      const yearMap = new Map<number, number>();
      for (const d of data) {
        const year = new Date(d.date).getFullYear();
        yearMap.set(year, (yearMap.get(year) ?? 0) + d.value);
      }
      const years = [...yearMap.keys()].sort();
      return years.map((y, i) => ({
        x: i,
        y: yearMap.get(y) ?? 0,
        label: String(y),
      }));
    }
  }
}

/** Convert bucketed points to cumulative values. */
export function toCumulative(points: BucketedPoint[]): BucketedPoint[] {
  let total = 0;
  return points.map((p) => {
    total += p.y;
    return { ...p, y: total };
  });
}