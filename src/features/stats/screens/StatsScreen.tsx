import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card } from '@/shared/components/Card';
import { colors, typography, spacing, radii, shadows } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useStatsQuery, useSessionListQuery } from '../queries/useStatsQuery';

export function StatsScreen() {
  const router = useRouter();
  const childId = useActiveChildStore((s) => s.childId);
  const { data: stats } = useStatsQuery(childId);
  const { data: sessions } = useSessionListQuery(childId);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryGrid}>
        <SummaryCard label="Sessions" value={String(stats?.sessionsCount ?? 0)} />
        <SummaryCard label="Drills" value={String(stats?.drillsCount ?? 0)} />
        <SummaryCard label="Duration" value={formatDuration(stats?.totalDurationSeconds ?? 0)} />
        <SummaryCard label="Earned" value={String(stats?.currencyEarned ?? 0)} />
      </View>

      <Text style={styles.historyTitle}>History</Text>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(tabs)/stats/${item.id}` as never)}
            style={styles.sessionRow}
          >
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionActivity}>{item.activityName}</Text>
              <Text style={styles.sessionDate}>{new Date(item.started_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No sessions yet</Text>}
      />
    </View>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.xs,
  },
  card: {
    width: '48%', backgroundColor: colors.surface, borderRadius: radii.md,
    padding: spacing.md, alignItems: 'center', ...shadows.sm,
  },
  cardValue: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: colors.textPrimary },
  cardLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  historyTitle: { ...typography.titleSmall, color: colors.textPrimary, paddingHorizontal: spacing.md, marginTop: spacing.sm },
  list: { padding: spacing.md },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.xs, ...shadows.sm,
  },
  sessionInfo: { flex: 1 },
  sessionActivity: { ...typography.titleSmall, color: colors.textPrimary },
  sessionDate: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  chevron: { ...typography.titleMedium, color: colors.textSecondary },
  empty: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
});
