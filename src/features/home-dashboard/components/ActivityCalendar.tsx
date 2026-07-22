import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { CaretDown } from 'phosphor-react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';
import { DayRing } from './DayRing';

// LayoutAnimation needs an opt-in on old-arch Android; a no-op elsewhere.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface CalendarSession {
  started_at: string;
  activity_id: string;
  activity_name: string;
  drill_count: number;
}

interface ActivityCalendarProps {
  sessions: CalendarSession[];
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Distinct categorical colors for activities. Assigned by activity name (stable,
// deterministic) so a given activity keeps its color across renders and screens.
const ACTIVITY_PALETTE = [
  colors.primary500, colors.secondary500, colors.accent500,
  '#D4537E', '#378ADD', '#639922', '#BA7517', '#0F8B7D',
];

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function uniqueInOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) if (!seen.has(id)) { seen.add(id); out.push(id); }
  return out;
}

export function ActivityCalendar({ sessions }: ActivityCalendarProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  // Sessions grouped by local day; distinct activities with a stable color.
  const { byDay, activities, colorFor } = useMemo(() => {
    const byDay = new Map<string, CalendarSession[]>();
    const nameById = new Map<string, string>();
    for (const s of sessions) {
      const d = new Date(s.started_at);
      if (Number.isNaN(d.getTime())) continue;
      const key = dayKey(d);
      const list = byDay.get(key) ?? [];
      list.push(s);
      byDay.set(key, list);
      nameById.set(s.activity_id, s.activity_name);
    }
    const activities = [...nameById.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const colorFor = new Map<string, string>();
    activities.forEach((a, i) => colorFor.set(a.id, ACTIVITY_PALETTE[i % ACTIVITY_PALETTE.length]));
    return { byDay, activities, colorFor };
  }, [sessions]);

  const today = useMemo(() => new Date(), []);
  const todayKey = dayKey(today);
  const year = today.getFullYear();
  const month = today.getMonth();

  const weekDates = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [today]);

  const monthCells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [year, month]);

  /** Colors for a day's ring, honoring the active filter. */
  const segmentsFor = (key: string): string[] => {
    const daySessions = byDay.get(key) ?? [];
    let ids = uniqueInOrder(daySessions.map((s) => s.activity_id));
    if (filter) ids = ids.filter((id) => id === filter);
    return ids.map((id) => colorFor.get(id)!).filter(Boolean);
  };

  const monthCount = useMemo(() => {
    let count = 0;
    for (const cell of monthCells) {
      if (cell && segmentsFor(dayKey(cell)).length > 0) count++;
    }
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthCells, byDay, filter]);
  const weekCount = weekDates.filter((d) => segmentsFor(dayKey(d)).length > 0).length;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const selectDay = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedKey((prev) => (prev === key ? null : key));
  };

  const setActivityFilter = (id: string | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilter(id);
    setSelectedKey(null);
  };

  const cells = expanded ? monthCells : weekDates;

  // Detail for the selected day: activities grouped with summed drill counts.
  const selectedDetail = useMemo(() => {
    if (!selectedKey) return null;
    const daySessions = byDay.get(selectedKey) ?? [];
    const byActivity = new Map<string, { name: string; drills: number }>();
    for (const s of daySessions) {
      if (filter && s.activity_id !== filter) continue;
      const prev = byActivity.get(s.activity_id) ?? { name: s.activity_name, drills: 0 };
      prev.drills += s.drill_count;
      byActivity.set(s.activity_id, prev);
    }
    return { key: selectedKey, items: [...byActivity.entries()].map(([id, v]) => ({ id, ...v })) };
  }, [selectedKey, byDay, filter]);

  const formatSelectedDate = (key: string): string => {
    const [y, m, d] = key.split('-').map(Number);
    const label = `${MONTH_NAMES[m - 1]} ${d}`;
    return key === todayKey ? `Today · ${label}` : label;
  };

  return (
    <View style={styles.card}>
      <Pressable
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Collapse to week' : 'Expand to month'}
        style={styles.header}
      >
        <View>
          <Text style={styles.title}>{MONTH_NAMES[month]}</Text>
          <Text style={styles.subtitle}>
            {expanded
              ? `${monthCount} ${monthCount === 1 ? 'day' : 'days'} practiced this month`
              : `${weekCount} of 7 days this week`}
          </Text>
        </View>
        <CaretDown size={18} color={colors.textPlaceholder} weight="bold" style={expanded ? styles.chevronUp : undefined} />
      </Pressable>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>{label}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={i} style={styles.tileSlot} />;
          const key = dayKey(date);
          return (
            <Pressable key={i} style={styles.tileSlot} onPress={() => selectDay(key)}>
              <DayRing
                day={date.getDate()}
                segmentColors={segmentsFor(key)}
                today={key === todayKey}
                dim={key > todayKey}
                selected={key === selectedKey}
              />
            </Pressable>
          );
        })}
      </View>

      {selectedDetail && (
        <View style={styles.detail}>
          <Text style={styles.detailDate}>{formatSelectedDate(selectedDetail.key)}</Text>
          {selectedDetail.items.length === 0 ? (
            <Text style={styles.detailEmpty}>No practice this day.</Text>
          ) : (
            selectedDetail.items.map((item) => (
              <View key={item.id} style={styles.actRow}>
                <View style={[styles.actDot, { backgroundColor: colorFor.get(item.id) }]} />
                <Text style={styles.actName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.actMeta}>{item.drills} {item.drills === 1 ? 'drill' : 'drills'}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {activities.length > 1 && (
        <View style={styles.chips}>
          <Pressable onPress={() => setActivityFilter(null)} style={[styles.allChip, !filter && styles.allChipOn]}>
            <Text style={styles.allChipText}>All</Text>
          </Pressable>
          {activities.map((a) => {
            const on = filter === a.id;
            return (
              <Pressable key={a.id} onPress={() => setActivityFilter(a.id)} style={[styles.chip, on && styles.chipOn]}>
                <View style={[styles.chipDot, { backgroundColor: colorFor.get(a.id) }]} />
                <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>{a.name}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: { ...typography.titleMedium, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxxs },
  chevronUp: { transform: [{ rotate: '180deg' }] },
  weekdayRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekdayLabel: { flex: 1, textAlign: 'center', ...typography.captionSmall, color: colors.textPlaceholder },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tileSlot: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  detail: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
    gap: spacing.xxs,
  },
  detailDate: { ...typography.bodySmall, color: colors.textPrimary, fontFamily: 'Lexend_600SemiBold', marginBottom: spacing.xxs },
  detailEmpty: { ...typography.caption, color: colors.textSecondary },
  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actDot: { width: 10, height: 10, borderRadius: radii.full },
  actName: { ...typography.bodySmall, color: colors.textPrimary, flex: 1 },
  actMeta: { ...typography.captionSmall, color: colors.textSecondary },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceDisabled,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  chipOn: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  chipDot: { width: 9, height: 9, borderRadius: radii.full },
  chipText: { ...typography.captionSmall, color: colors.textSecondary },
  chipTextOn: { color: colors.textOnPrimary },
  allChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary100,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    justifyContent: 'center',
  },
  allChipOn: { backgroundColor: colors.primary50 },
  allChipText: { ...typography.captionSmall, color: colors.primary700 },
});
