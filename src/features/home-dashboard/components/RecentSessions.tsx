import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii } from '@/shared/theme';

interface SessionItem {
  id: string;
  activityName: string;
  started_at: string;
  duration_seconds: number | null;
}

export function RecentSessions({ sessions }: { sessions: SessionItem[] }) {
  if (sessions.length === 0) {
    return <Text style={styles.empty}>No sessions yet</Text>;
  }

  return (
    <View style={styles.container}>
      {sessions.map((s) => (
        <View key={s.id} style={styles.row}>
          <Text style={styles.name}>{s.activityName}</Text>
          <Text style={styles.date}>{new Date(s.started_at).toLocaleDateString()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md,
  },
  name: { ...typography.titleSmall, color: colors.textPrimary },
  date: { ...typography.caption, color: colors.textSecondary },
  empty: { ...typography.bodySmall, color: colors.textSecondary },
});
