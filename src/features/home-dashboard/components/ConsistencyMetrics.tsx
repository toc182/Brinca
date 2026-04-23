import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii } from '@/shared/theme';

interface ConsistencyMetricsProps {
  sessionsThisWeek: number;
  totalSessions: number;
}

export function ConsistencyMetrics({ sessionsThisWeek, totalSessions }: ConsistencyMetricsProps) {
  return (
    <View style={styles.container}>
      <MetricItem label="This week" value={String(sessionsThisWeek)} />
      <MetricItem label="Total" value={String(totalSessions)} />
    </View>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: spacing.sm },
  metric: {
    flex: 1, alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radii.md, padding: spacing.sm,
  },
  metricValue: { fontFamily: 'Fredoka_600SemiBold', fontSize: 22, color: colors.textPrimary },
  metricLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
});
